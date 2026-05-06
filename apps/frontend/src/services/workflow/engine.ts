// services/workflow/engine.ts
// Cœur du Workflow Engine.
//
// processEvent(event, depth) :
//   1. Charge les workflows actifs matchant l'event_type + entity_type
//   2. Pour chaque workflow : évalue les conditions sur le payload
//   3. Si satisfait : exécute les actions (émission de nouveaux events)
//
// Protection anti-boucle infinie :
//   • depth est propagé de emitEvent → processEvent → executeActions → emitEvent
//   • dès que depth >= MAX_CASCADE_DEPTH, on arrête silencieusement
//
// Cache en mémoire : les workflows sont mis en cache 60s pour éviter
// de requêter Supabase à chaque event.
// -----------------------------------------------------------------------

import { supabase } from "@/services/supabaseClient";
import { evaluateConditions } from "./evaluateConditions";
import { executeActions, injectEmitFn } from "./executeActions";
import type { Workflow, WorkflowExecutionContext } from "./types";
import type { DomainEvent, DomainEventType } from "@/services/eventSourcing/types";

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------
const MAX_CASCADE_DEPTH = 3;
const CACHE_TTL_MS = 60_000;

// ---------------------------------------------------------------------------
// Cache mémoire des workflows (evite N requêtes Supabase par event)
// ---------------------------------------------------------------------------
interface WorkflowCache {
  data: Workflow[];
  expiresAt: number;
  key: string;
}

const workflowCache = new Map<string, WorkflowCache>();

const getCacheKey = (eventType: string, entityType: string) =>
  `${eventType}::${entityType}`;

const fetchWorkflows = async (
  eventType: string,
  entityType: string
): Promise<Workflow[]> => {
  const key = getCacheKey(eventType, entityType);
  const cached = workflowCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("trigger_event", eventType)
    .eq("entity_type", entityType)
    .eq("active", true);

  if (error) {
    console.error("[workflow] fetchWorkflows error:", error.message);
    return [];
  }

  const workflows = (data ?? []) as unknown as Workflow[];
  workflowCache.set(key, {
    key,
    data: workflows,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return workflows;
};

/** Invalide le cache pour forcer un rechargement (ex : après mise à jour d'un workflow) */
export const invalidateWorkflowCache = (eventType?: string, entityType?: string) => {
  if (eventType && entityType) {
    workflowCache.delete(getCacheKey(eventType, entityType));
  } else {
    workflowCache.clear();
  }
};

// ---------------------------------------------------------------------------
// Moteur principal
// ---------------------------------------------------------------------------
export const processEvent = async (
  event: DomainEvent<DomainEventType> & { id?: string },
  depth = 0
): Promise<void> => {
  // Protection anti-boucle
  if (depth >= MAX_CASCADE_DEPTH) {
    console.warn(
      `[workflow] MAX_CASCADE_DEPTH (${MAX_CASCADE_DEPTH}) reached for ${event.event_type} — stopping cascade`
    );
    return;
  }

  // Offline ou payload de workflow interne → skip (les events de workflow
  // ne déclenchent pas eux-mêmes d'autres workflows au-delà de la profondeur max)
  if (!navigator.onLine) return;

  const workflows = await fetchWorkflows(event.event_type, event.entity_type);
  if (workflows.length === 0) return;

  const payload = event.payload as Record<string, unknown>;

  for (const wf of workflows) {
    // Respect du max_depth défini par le workflow lui-même
    const wfMaxDepth = wf.max_depth ?? MAX_CASCADE_DEPTH;
    if (depth >= wfMaxDepth) continue;

    if (!evaluateConditions(wf.conditions, payload)) continue;

    const ctx: WorkflowExecutionContext = {
      sourceEventId: event.id,
      projectId: event.project_id,
      entityType: event.entity_type,
      entityId: event.entity_id,
      createdBy: event.created_by,
      depth,
    };

    try {
      await executeActions(wf.actions, ctx);
    } catch (err) {
      console.error(`[workflow] "${wf.name}" action failed:`, err);
      // On continue les autres workflows même si l'un échoue
    }
  }
};

// ---------------------------------------------------------------------------
// Initialisation — injecte la référence circulaire emitEvent dans executeActions
// Doit être appelé APRÈS que emitEvent soit défini.
// ---------------------------------------------------------------------------
export const initWorkflowEngine = (
  emitFn: (event: Record<string, unknown>, depth: number) => Promise<void>
) => {
  injectEmitFn(emitFn);
};
