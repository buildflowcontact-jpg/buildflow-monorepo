// services/workflow/executeActions.ts
// Exécute la liste d'actions d'un workflow en émettant les events correspondants.
//
// Sécurité anti-boucle :
//   • depth est incrémenté à chaque cascade
//   • MAX_CASCADE_DEPTH = 3 (configurable par workflow via max_depth)
//   • les events émis par workflow portent _fromWorkflow=true pour traçabilité
// -----------------------------------------------------------------------

import type { WorkflowAction, WorkflowExecutionContext } from "./types";
import type { DomainEventType } from "@/services/eventSourcing/types";

// Importé dynamiquement pour éviter la circularité emitEvent ↔ processEvent
// → executeActions appelle emitEventInternal qui est la version interne sans re-trigger

let _emitInternal: ((event: Record<string, unknown>, depth: number) => Promise<void>) | null =
  null;

/** Injecte la référence à emitEvent — appelé par engine.ts au démarrage */
export const injectEmitFn = (
  fn: (event: Record<string, unknown>, depth: number) => Promise<void>
) => {
  _emitInternal = fn;
};

// ---------------------------------------------------------------------------
// Exécuteur d'actions
// ---------------------------------------------------------------------------
export const executeActions = async (
  actions: WorkflowAction[],
  ctx: WorkflowExecutionContext
): Promise<void> => {
  if (!_emitInternal) {
    console.warn("[workflow] emitFn not injected — actions skipped");
    return;
  }

  for (const action of actions) {
    const event: Record<string, unknown> = {
      project_id: ctx.projectId,
      entity_type: ctx.entityType,
      entity_id: ctx.entityId,
      event_type: action.event_type as DomainEventType,
      payload: {
        ...action.payload,
        _from_event: ctx.sourceEventId,
        _workflow_triggered: true,
      },
      created_by: ctx.createdBy,
      created_at: new Date().toISOString(),
    };

    if ((action.delay_seconds ?? 0) > 0) {
      // Délai non-bloquant — utilise setTimeout (fire-and-forget)
      setTimeout(
        () => void _emitInternal?.(event, ctx.depth + 1),
        (action.delay_seconds as number) * 1_000
      );
    } else {
      await _emitInternal(event, ctx.depth + 1);
    }
  }
};
