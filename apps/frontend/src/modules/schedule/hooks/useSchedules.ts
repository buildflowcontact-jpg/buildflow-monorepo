// useSchedules Hook
// Manages worker schedules with real-time collision tracking

import { useState, useCallback, useEffect } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { gql } from '@apollo/client/core';

interface WorkerSchedule {
  id: string;
  project_id: string;
  worker_id: string;
  location: string;
  start_time: string;
  end_time: string;
  equipment_ids: string[];
  is_tentative: boolean;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ScheduleCollision {
  id: string;
  collision_type: 'LOCATION_OVERLAP' | 'EQUIPMENT_CONFLICT' | 'TEAM_CONFLICT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overlap_minutes: number;
  suggested_resolution?: string;
  resolved_at?: string;
}

interface UseSchedulesReturn {
  schedules: WorkerSchedule[];
  collisions: ScheduleCollision[];
  loading: boolean;
  error: Error | null;
  refreshSchedules: () => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  resolveCollision: (id: string, notes: string) => Promise<void>;
}

const LIST_PROJECT_SCHEDULES = gql`
  query ListProjectSchedules(
    $project_id: ID!
    $start_date: DateTime!
    $end_date: DateTime!
  ) {
    listProjectSchedules(
      project_id: $project_id
      start_date: $start_date
      end_date: $end_date
    ) {
      id
      project_id
      worker_id
      location
      start_time
      end_time
      equipment_ids
      is_tentative
      notes
      created_by
      created_at
      updated_at
    }
  }
`;

const LIST_COLLISIONS = gql`
  query ListCollisions($project_id: ID!, $resolved: Boolean) {
    listCollisions(project_id: $project_id, resolved: $resolved) {
      id
      primary_schedule_id
      conflicting_schedule_id
      collision_type
      severity
      overlap_minutes
      suggested_resolution
      resolved_at
    }
  }
`;

const DELETE_SCHEDULE = gql`
  mutation DeleteWorkerSchedule($id: ID!) {
    deleteWorkerSchedule(id: $id)
  }
`;

const RESOLVE_COLLISION = gql`
  mutation ResolveCollision(
    $collision_id: ID!
    $resolution_notes: String!
  ) {
    resolveCollision(
      collision_id: $collision_id
      resolution_notes: $resolution_notes
    ) {
      id
      resolved_at
      resolution_notes
    }
  }
`;

export const useSchedules = (projectId: string): UseSchedulesReturn => {
  const client = useApolloClient();
  const [schedules, setSchedules] = useState<WorkerSchedule[]>([]);
  const [collisions, setCollisions] = useState<ScheduleCollision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch schedules and collisions
  const refreshSchedules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get date range (current week)
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      // Fetch schedules
      const { data: schedulesData, errors: schedulesErrors } =
        await client.query({
          query: LIST_PROJECT_SCHEDULES,
          variables: {
            project_id: projectId,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
          },
        });

      if (schedulesErrors) {
        throw new Error(schedulesErrors[0].message);
      }

      setSchedules(schedulesData.listProjectSchedules || []);

      // Fetch collisions
      const { data: collisionsData, errors: collisionsErrors } =
        await client.query({
          query: LIST_COLLISIONS,
          variables: {
            project_id: projectId,
            resolved: false, // Only unresolved collisions
          },
        });

      if (collisionsErrors) {
        throw new Error(collisionsErrors[0].message);
      }

      setCollisions(collisionsData.listCollisions || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [projectId, client]);

  // Initial fetch
  useEffect(() => {
    if (projectId) {
      refreshSchedules();
    }
  }, [projectId, refreshSchedules]);

  // Delete schedule
  const deleteSchedule = useCallback(
    async (id: string) => {
      try {
        const { errors } = await client.mutate({
          mutation: DELETE_SCHEDULE,
          variables: { id },
        });

        if (errors) {
          throw new Error(errors[0].message);
        }

        // Remove from local state
        setSchedules((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Delete failed'));
        throw err;
      }
    },
    [client]
  );

  // Resolve collision
  const resolveCollision = useCallback(
    async (id: string, notes: string) => {
      try {
        const { errors } = await client.mutate({
          mutation: RESOLVE_COLLISION,
          variables: {
            collision_id: id,
            resolution_notes: notes,
          },
        });

        if (errors) {
          throw new Error(errors[0].message);
        }

        // Remove from local state
        setCollisions((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Resolve failed'));
        throw err;
      }
    },
    [client]
  );

  return {
    schedules,
    collisions,
    loading,
    error,
    refreshSchedules,
    deleteSchedule,
    resolveCollision,
  };
};

export default useSchedules;
