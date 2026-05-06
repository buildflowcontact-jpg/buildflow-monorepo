// services/eventSourcing/reducers.ts
// Projectors — reconstituent l'état courant d'une entité
// à partir de la liste ordonnée de ses événements.
// -------------------------------------------------------------
// Règle : les reducers sont des fonctions pures (pas d'I/O).
// L'état initial est toujours défini pour éviter les undefined.
// -------------------------------------------------------------

import type { DomainEvent, DomainEventType, IncidentProjection, TaskProjection } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type AnyEvent = DomainEvent<DomainEventType>;

// Lit le payload d'un event de façon sûre
const pay = <K extends string>(event: AnyEvent, key: K): string =>
  ((event.payload as Record<string, unknown>)[key] as string) ?? "";

// ---------------------------------------------------------------------------
// Incident projector
// ---------------------------------------------------------------------------
const INCIDENT_INITIAL: Omit<IncidentProjection, "id"> = {
  title: "",
  description: null,
  status: "draft",
  severity: "low",
  assignedTo: null,
  comments: [],
  version: 0,
};

export const buildIncidentState = (
  entityId: string,
  events: AnyEvent[]
): IncidentProjection => {
  let state: IncidentProjection = { id: entityId, ...INCIDENT_INITIAL };

  for (const event of events) {
    state = { ...state, version: state.version + 1 };

    switch (event.event_type) {
      case "incident_created":
        state.title = pay(event, "title");
        state.description = pay(event, "description") || null;
        state.severity = pay(event, "severity") || "low";
        state.status = "created";
        break;

      case "incident_submitted":
        state.status = "submitted";
        break;

      case "incident_assigned":
        state.assignedTo = pay(event, "assigned_to");
        state.status = "assigned";
        break;

      case "incident_approved":
        state.status = "approved";
        break;

      case "incident_rejected":
        state.status = "rejected";
        break;

      case "incident_escalated":
        state.status = "escalated";
        break;

      case "incident_status_changed":
        state.status = pay(event, "to");
        break;

      case "incident_severity_changed":
        state.severity = pay(event, "to");
        break;

      case "incident_comment_added":
        state.comments = [
          ...state.comments,
          {
            author: pay(event, "author"),
            comment: pay(event, "comment"),
            at: event.created_at ?? new Date().toISOString(),
          },
        ];
        break;

      case "incident_closed":
        state.status = "closed";
        break;

      default:
        // Évènement inconnu → state inchangé (forward-compatibility)
        break;
    }
  }

  return state;
};

// ---------------------------------------------------------------------------
// Task projector
// ---------------------------------------------------------------------------
const TASK_INITIAL: Omit<TaskProjection, "id"> = {
  title: "",
  status: "todo",
  assignedTo: null,
  comments: [],
  version: 0,
};

export const buildTaskState = (
  entityId: string,
  events: AnyEvent[]
): TaskProjection => {
  let state: TaskProjection = { id: entityId, ...TASK_INITIAL };

  for (const event of events) {
    state = { ...state, version: state.version + 1 };

    switch (event.event_type) {
      case "task_created":
        state.title = pay(event, "title");
        state.assignedTo = pay(event, "assignee_id") || null;
        state.status = "todo";
        break;

      case "task_assigned":
        state.assignedTo = pay(event, "assigned_to");
        break;

      case "task_started":
        state.status = "in_progress";
        break;

      case "task_completed":
        state.status = "completed";
        break;

      case "task_validated":
        state.status = "validated";
        break;

      case "task_blocked":
        state.status = "blocked";
        break;

      case "task_unblocked":
        state.status = "in_progress";
        break;

      case "task_status_changed":
        state.status = pay(event, "to");
        break;

      case "task_comment_added":
        state.comments = [
          ...state.comments,
          {
            author: pay(event, "author"),
            comment: pay(event, "comment"),
            at: event.created_at ?? new Date().toISOString(),
          },
        ];
        break;

      default:
        break;
    }
  }

  return state;
};
