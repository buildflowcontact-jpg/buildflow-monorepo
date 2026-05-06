// services/eventSourcing/types.ts
// Catalogue typé de tous les événements métier (append-only).
// -----------------------------------------------------------
// Convention de nommage : <entity>_<past_participle>
// -----------------------------------------------------------

// ---------------------------------------------------------------------------
// Incident events
// ---------------------------------------------------------------------------
export type IncidentEventType =
  | "incident_created"
  | "incident_submitted"
  | "incident_assigned"
  | "incident_approved"
  | "incident_rejected"
  | "incident_escalated"
  | "incident_comment_added"
  | "incident_status_changed"
  | "incident_severity_changed"
  | "incident_closed";

// ---------------------------------------------------------------------------
// Task events
// ---------------------------------------------------------------------------
export type TaskEventType =
  | "task_created"
  | "task_assigned"
  | "task_started"
  | "task_completed"
  | "task_validated"
  | "task_blocked"
  | "task_unblocked"
  | "task_status_changed"
  | "task_comment_added";

// ---------------------------------------------------------------------------
// Delivery / Purchase Order events
// ---------------------------------------------------------------------------
export type DeliveryEventType =
  | "delivery_created"
  | "delivery_dispatched"
  | "delivery_received"
  | "delivery_late"
  | "delivery_cancelled";

// ---------------------------------------------------------------------------
// Generic project events
// ---------------------------------------------------------------------------
export type ProjectEventType =
  | "project_created"
  | "project_status_changed"
  | "member_added"
  | "member_removed";

// ---------------------------------------------------------------------------
// Union de tous les types
// ---------------------------------------------------------------------------
export type DomainEventType =
  | IncidentEventType
  | TaskEventType
  | DeliveryEventType
  | ProjectEventType;

// ---------------------------------------------------------------------------
// Payloads typés par event_type
// ---------------------------------------------------------------------------
export interface EventPayloadMap {
  // Incident
  incident_created: { title: string; description?: string; severity: string; project_id: string };
  incident_submitted: { submitted_by: string };
  incident_assigned: { assigned_to: string };
  incident_approved: { approved_by: string; note?: string };
  incident_rejected: { rejected_by: string; reason: string };
  incident_escalated: { escalated_by: string; reason: string };
  incident_comment_added: { comment: string; author: string };
  incident_status_changed: { from: string; to: string };
  incident_severity_changed: { from: string; to: string };
  incident_closed: { closed_by: string; resolution?: string };
  // Task
  task_created: { title: string; assignee_id?: string; due_date?: string };
  task_assigned: { assigned_to: string; assigned_by: string };
  task_started: { started_by: string };
  task_completed: { completed_by: string };
  task_validated: { validated_by: string };
  task_blocked: { reason: string; blocked_by: string };
  task_unblocked: { unblocked_by: string };
  task_status_changed: { from: string; to: string };
  task_comment_added: { comment: string; author: string };
  // Delivery
  delivery_created: { reference: string; supplier?: string };
  delivery_dispatched: { estimated_date: string };
  delivery_received: { received_by: string; received_at: string };
  delivery_late: { expected_date: string; delay_days: number };
  delivery_cancelled: { reason: string; cancelled_by: string };
  // Project
  project_created: { name: string };
  project_status_changed: { from: string; to: string };
  member_added: { user_id: string; role: string };
  member_removed: { user_id: string };
}

// ---------------------------------------------------------------------------
// Enveloppe DomainEvent — structure stockée en base
// ---------------------------------------------------------------------------
export interface DomainEvent<T extends DomainEventType = DomainEventType> {
  /** UUID généré côté client avant envoi */
  id?: string;
  project_id: string;
  entity_type: "incident" | "task" | "delivery" | "project";
  entity_id: string;
  event_type: T;
  /** Payload métier sérialisé dans event_data.payload */
  payload: T extends keyof EventPayloadMap ? EventPayloadMap[T] : Record<string, unknown>;
  created_by: string;
  created_at?: string;
  /** Numéro de séquence dans l'historique de l'entité (optionnel, calculé à la lecture) */
  version?: number;
}

// ---------------------------------------------------------------------------
// Projection state — état reconstitué pour chaque entité
// ---------------------------------------------------------------------------
export interface IncidentProjection {
  id: string;
  title: string;
  description: string | null;
  status: string;
  severity: string;
  assignedTo: string | null;
  comments: Array<{ author: string; comment: string; at: string }>;
  version: number;
}

export interface TaskProjection {
  id: string;
  title: string;
  status: string;
  assignedTo: string | null;
  comments: Array<{ author: string; comment: string; at: string }>;
  version: number;
}
