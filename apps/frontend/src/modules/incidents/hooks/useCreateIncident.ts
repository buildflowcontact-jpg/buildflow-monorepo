// modules/incidents/hooks/useCreateIncident.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { safeWrite } from '@/services/sync/safeWrite';
import { eventBus } from '@/services/eventBus';
import { logAudit } from '@/services/audit';
import { supabase } from '@/services/supabaseClient';
import type { CreateIncidentPayload, IncidentRow } from '../types';

export function useCreateIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateIncidentPayload) => {
      const optimisticItem: IncidentRow = {
        id: `offline_${Date.now()}`,
        project_id: payload.project_id,
        title: payload.title,
        description: payload.description ?? null,
        severity: payload.severity ?? null,
        status: 'submitted',
        reported_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return safeWrite<IncidentRow>({
        actionType: 'incident_create',
        table: 'incidents',
        payload: { ...payload, status: 'submitted' } as unknown as IncidentRow,
        queryKey: ['incidents', payload.project_id],
        optimisticItem,
      });
    },

    onSuccess: async ({ data, offline }) => {
      // En ligne : invalider pour s'assurer de la cohérence
      if (!offline) {
        queryClient.invalidateQueries({ queryKey: ['incidents', data.project_id] });
        eventBus.emit('incident_created', data);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          logAudit({
            userId: user.id,
            action: 'CREATE',
            entity: { type: 'incident', id: data.id, project_id: data.project_id },
            metadata: { title: data.title, severity: data.severity },
          });
        }
      }
    },
  });
}

