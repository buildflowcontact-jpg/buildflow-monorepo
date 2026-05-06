// services/eventSourcing/useEntityEvents.ts
// React Query hooks qui lisent l'event store et retournent
// l'état projeté d'une entité (incident ou task).
//
// queryFn :
//   1. Charge tous les events de l'entité depuis project_events
//   2. Désérialise l'enveloppe DomainEvent depuis event_data
//   3. Passe la liste au reducer correspondant
// -----------------------------------------------------------------------

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabaseClient";
import { buildIncidentState, buildTaskState } from "./reducers";
import type { DomainEvent, DomainEventType, IncidentProjection, TaskProjection } from "./types";

// ---------------------------------------------------------------------------
// Clés React Query
// ---------------------------------------------------------------------------
export const eventKeys = {
  incident: (id: string) => ["events", "incident", id] as const,
  task: (id: string) => ["events", "task", id] as const,
  entity: (type: string, id: string) => ["events", type, id] as const,
};

// ---------------------------------------------------------------------------
// Fetch brut depuis project_events
// ---------------------------------------------------------------------------
const fetchEntityEvents = async (
  entityType: string,
  entityId: string
): Promise<DomainEvent<DomainEventType>[]> => {
  const { data, error } = await supabase
    .from("project_events")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  // Filtre sur entity_id / entity_type encodés dans event_data
  return (data ?? [])
    .filter((row) => {
      const d = row.event_data as Record<string, unknown> | null;
      return d?.entity_id === entityId && d?.entity_type === entityType;
    })
    .map((row) => {
      const d = row.event_data as Record<string, unknown>;
      return {
        id: row.id,
        project_id: row.project_id,
        entity_type: d.entity_type as DomainEvent["entity_type"],
        entity_id: d.entity_id as string,
        event_type: row.event_type as DomainEventType,
        payload: (d.payload ?? {}) as DomainEvent["payload"],
        created_by: d.created_by as string,
        created_at: row.created_at,
        version: d.version as number | undefined,
      } satisfies DomainEvent<DomainEventType>;
    });
};

// ---------------------------------------------------------------------------
// useIncidentProjection
// ---------------------------------------------------------------------------
export const useIncidentProjection = (incidentId: string) =>
  useQuery<IncidentProjection>({
    queryKey: eventKeys.incident(incidentId),
    queryFn: async () => {
      const events = await fetchEntityEvents("incident", incidentId);
      return buildIncidentState(incidentId, events);
    },
    enabled: !!incidentId,
    staleTime: 10_000,
  });

// ---------------------------------------------------------------------------
// useTaskProjection
// ---------------------------------------------------------------------------
export const useTaskProjection = (taskId: string) =>
  useQuery<TaskProjection>({
    queryKey: eventKeys.task(taskId),
    queryFn: async () => {
      const events = await fetchEntityEvents("task", taskId);
      return buildTaskState(taskId, events);
    },
    enabled: !!taskId,
    staleTime: 10_000,
  });

// ---------------------------------------------------------------------------
// useEntityEventLog — liste brute des events pour l'historique / audit UI
// ---------------------------------------------------------------------------
export const useEntityEventLog = (entityType: string, entityId: string) =>
  useQuery<DomainEvent<DomainEventType>[]>({
    queryKey: eventKeys.entity(entityType, entityId),
    queryFn: () => fetchEntityEvents(entityType, entityId),
    enabled: !!entityId,
    staleTime: 10_000,
  });
