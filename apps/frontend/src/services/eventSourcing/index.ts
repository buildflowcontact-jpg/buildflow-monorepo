// services/eventSourcing/index.ts
export { emitEvent } from "./emitEvent";
export { buildIncidentState, buildTaskState } from "./reducers";
export {
  useIncidentProjection,
  useTaskProjection,
  useEntityEventLog,
  eventKeys,
} from "./useEntityEvents";
export type {
  DomainEvent,
  DomainEventType,
  IncidentEventType,
  TaskEventType,
  DeliveryEventType,
  EventPayloadMap,
  IncidentProjection,
  TaskProjection,
} from "./types";
