// services/workflow/types.ts
// Typage complet du Workflow Engine.
// -----------------------------------------------------------------------
// Convention : les workflows sont des règles déclaratives stockées en base.
// Ils ne contiennent pas de code — uniquement des données JSONB.
// -----------------------------------------------------------------------

import type { DomainEventType, EventPayloadMap } from "@/services/eventSourcing/types";

// ---------------------------------------------------------------------------
// Condition — supporte les formes simple, AND (all) et OR (any)
// ---------------------------------------------------------------------------

/** Condition simple : { field: value } ou { field: [v1, v2] } */
export type SimpleCondition = Record<string, string | number | boolean | string[]>;

/** Condition composée */
export interface CompoundCondition {
  all?: SimpleCondition[];
  any?: SimpleCondition[];
}

export type WorkflowCondition = SimpleCondition | CompoundCondition;

// ---------------------------------------------------------------------------
// Action — un event à émettre en réponse
// ---------------------------------------------------------------------------
export interface WorkflowAction<T extends DomainEventType = DomainEventType> {
  event_type: T;
  /** Payload partiel — fusionné avec le contexte du source event */
  payload: T extends keyof EventPayloadMap
    ? Partial<EventPayloadMap[T]> & Record<string, unknown>
    : Record<string, unknown>;
  /** Délai optionnel en secondes (0 = immédiat) */
  delay_seconds?: number;
}

// ---------------------------------------------------------------------------
// Workflow — enregistrement tel que stocké en base
// ---------------------------------------------------------------------------
export interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  entity_type: "incident" | "task" | "delivery" | "project";
  trigger_event: DomainEventType;
  conditions: WorkflowCondition | null;
  actions: WorkflowAction[];
  active: boolean;
  /** Profondeur max de déclenchement en cascade (default: 1) */
  max_depth?: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Contexte passé au moment de l'exécution
// ---------------------------------------------------------------------------
export interface WorkflowExecutionContext {
  /** Event source qui a déclenché le workflow */
  sourceEventId: string | undefined;
  projectId: string;
  entityType: Workflow["entity_type"];
  entityId: string;
  createdBy: string;
  /** Profondeur de cascade courante — protège contre les boucles infinies */
  depth: number;
}
