/**
 * realtimeHandler.ts
 * Patche le cache React Query à partir des événements Supabase Realtime.
 * Règle : pas de refetch complet — on patche chirurgicalement.
 * Protection : si un item est en cours d'édition locale, on buffer l'update.
 */
import { queryClient } from "@/app/providers";
import { eventKeys } from "@/services/eventSourcing/useEntityEvents";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Registry des items en cours d'édition locale
// "table:id" → true  → l'update realtime est bufférisé
// ---------------------------------------------------------------------------

const editingRegistry = new Set<string>();
const realtimeBuffer = new Map<string, Row>(); // "table:id" → dernier état serveur

const editKey = (table: string, id: string) => `${table}:${id}`;

/** Appeler quand l'utilisateur commence à éditer un item */
export const markEditing = (table: string, id: string) => {
  editingRegistry.add(editKey(table, id));
};

/** Appeler quand l'utilisateur termine l'édition (submit ou annulation) */
export const markDoneEditing = (table: string, id: string) => {
  const key = editKey(table, id);
  editingRegistry.delete(key);

  // Applique le dernier état bufférisé s'il existe
  const buffered = realtimeBuffer.get(key);
  if (buffered) {
    realtimeBuffer.delete(key);
    const keyFn = TABLE_QUERY_KEYS[table];
    if (keyFn) patchUpdate(keyFn(buffered), buffered);
  }
};

// ---------------------------------------------------------------------------
// Helpers génériques
// ---------------------------------------------------------------------------

const patchInsert = (queryKey: unknown[], row: Row) => {
  queryClient.setQueryData<Row[]>(queryKey, (old) => {
    if (!old) return [row];
    const exists = old.some((item) => item.id === row.id);
    return exists ? old : [row, ...old];
  });
};

const patchUpdate = (queryKey: unknown[], row: Row) => {
  queryClient.setQueryData<Row[]>(queryKey, (old) =>
    old?.map((item) =>
      item.id === row.id
        ? (item.updated_at as string) > (row.updated_at as string)
          ? item
          : row
        : item
    )
  );
};

const patchDelete = (queryKey: unknown[], row: Row) => {
  queryClient.setQueryData<Row[]>(queryKey, (old) =>
    old?.filter((item) => item.id !== row.id)
  );
};

// ---------------------------------------------------------------------------
// Dispatchers par table
// ---------------------------------------------------------------------------

const TABLE_QUERY_KEYS: Record<string, (row: Row) => unknown[]> = {
  incidents: (row) => ["incidents", row.project_id as string],
  tasks: (row) => ["tasks", row.project_id as string],
  project_events: (row) => ["project-events", row.project_id as string],
  purchase_orders: (row) => ["purchase-orders", row.project_id as string],
  audit_logs: (row) => ["audit-logs", row.project_id as string],
};

export const handleRealtimeEvent = (
  table: string,
  payload: RealtimePostgresChangesPayload<Row>
) => {
  const keyFn = TABLE_QUERY_KEYS[table];
  if (!keyFn) return;

  const row = (payload.new ?? payload.old) as Row;
  if (!row?.project_id) return;

  // Protection édition active : buffer l'update plutôt que d'écraser
  if (payload.eventType === "UPDATE" && row.id) {
    const key = editKey(table, String(row.id));
    if (editingRegistry.has(key)) {
      realtimeBuffer.set(key, row);
      return;
    }
  }

  const queryKey = keyFn(row);

  switch (payload.eventType) {
    case "INSERT":
      patchInsert(queryKey, row);
      // Event sourcing : invalide la projection de l'entité concernée
      if (table === "project_events") {
        const d = row.event_data as Record<string, unknown> | null;
        if (d?.entity_type && d?.entity_id) {
          void queryClient.invalidateQueries({
            queryKey: eventKeys.entity(d.entity_type as string, d.entity_id as string),
          });
        }
      }
      break;
    case "UPDATE":
      patchUpdate(queryKey, row);
      break;
    case "DELETE":
      patchDelete(queryKey, row);
      break;
  }
};
