import { supabase } from "@/services/supabaseClient";
import { db } from "./db";
import type { QueuedAction } from "./db";

/** Retry exponentiel : 1s → 5s → 30s → 5min → abandon */
const RETRY_DELAYS = [1_000, 5_000, 30_000, 300_000];

let isSyncing = false;

// ---------------------------------------------------------------------------
// Dispatcher : traduit chaque type d'action en appel Supabase réel
// ---------------------------------------------------------------------------
const executeAction = async (item: QueuedAction): Promise<void> => {
  const p = item.payload as Record<string, unknown>;

  switch (item.type) {
    case "incident_create": {
      const { error } = await supabase.from("incidents").insert(p as never);
      if (error) throw error;
      break;
    }
    case "incident_update": {
      const { id, ...rest } = p;
      const { error } = await supabase
        .from("incidents")
        .update(rest as never)
        .eq("id", id as string);
      if (error) throw error;
      break;
    }
    case "task_update": {
      const { id, ...rest } = p;
      const { error } = await supabase
        .from("tasks")
        .update(rest as never)
        .eq("id", id as string);
      if (error) throw error;
      break;
    }
    case "task_create": {
      const { error } = await supabase.from("tasks").insert(p as never);
      if (error) throw error;
      break;
    }
    case "delivery_create": {
      const { error } = await supabase
        .from("purchase_orders")
        .insert(p as never);
      if (error) throw error;
      break;
    }
    case "event_log": {
      const { error } = await supabase
        .from("project_events")
        .insert(p as never);
      if (error) throw error;
      break;
    }
    case "emit_event": {
      // Event sourcing — replay depuis la file offline
      // On reconstruit la row project_events sans le champ interne _domainEvent
      const { _domainEvent: _ignored, ...row } = p as Record<string, unknown> & { _domainEvent?: unknown };
      const { error } = await supabase
        .from("project_events")
        .insert(row as never);
      if (error) throw error;
      break;
    }
    default:
      throw new Error(`Unknown action type: ${item.type}`);
  }
};

// ---------------------------------------------------------------------------
// Sync Engine principal
// ---------------------------------------------------------------------------
export const syncQueue = async (): Promise<void> => {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;

  try {
    // Priorité haute en premier, puis medium, puis low ; max 20 par cycle
    const pending = await db.queue
      .where("status")
      .equals("pending")
      .and((item) => item.nextRetryAt <= Date.now())
      .limit(20)
      .toArray();

    const sorted = pending.sort((a, b) => {
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });

    for (const item of sorted) {
      await db.queue.update(item.id!, { status: "syncing" });

      try {
        await executeAction(item);
        await db.queue.delete(item.id!);
      } catch (err) {
        const retryCount = (item.retryCount ?? 0) + 1;
        const delay = RETRY_DELAYS[Math.min(retryCount - 1, RETRY_DELAYS.length - 1)];
        const status = retryCount >= RETRY_DELAYS.length ? "failed" : "pending";

        await db.queue.update(item.id!, {
          status,
          retryCount,
          nextRetryAt: Date.now() + delay,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } finally {
    isSyncing = false;
  }
};

export const isSyncRunning = () => isSyncing;
