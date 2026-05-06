// modules/incidents/hooks/useUpdateIncident.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateIncident } from '../api/updateIncident';
import { eventBus } from '@/services/eventBus';
import { logAudit } from '@/services/audit';
import { supabase } from '@/services/supabaseClient';
import { buildConflictRecord, hasConflict, resolveConflict } from '@/services/conflict/conflictEngine';
import { pushConflict } from '@/store/conflictStore';
import type { UpdateIncidentPayload, IncidentRow } from '../types';

export function useUpdateIncident(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateIncidentPayload) => updateIncident(payload),

    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents', projectId] });
      eventBus.emit('incident_updated', data);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        logAudit({
          userId: user.id,
          action: 'UPDATE',
          entity: { type: 'incident', id: data.id, project_id: projectId },
          metadata: { status: data.status, severity: data.severity },
        });
      }
    },

    onError: async (_error, localPayload) => {
      // Tentative de détection de conflit : on fetch la version serveur actuelle
      const { data: serverData } = await supabase
        .from('incidents')
        .select()
        .eq('id', localPayload.id)
        .single();

      if (!serverData) return;

      // Reconstruit un objet local comparable à partir du cache React Query
      const cached = queryClient
        .getQueryData<IncidentRow[]>(['incidents', projectId])
        ?.find((i) => i.id === localPayload.id);

      const localFull = cached
        ? { ...cached, ...localPayload }
        : (localPayload as unknown as IncidentRow);

      if (!hasConflict(localFull as Record<string, unknown>, serverData as Record<string, unknown>)) {
        return; // Pas de conflit de données, autre type d'erreur
      }

      const record = buildConflictRecord('incident', localFull as Record<string, unknown>, serverData as Record<string, unknown>);
      const choice = await pushConflict(record);
      const resolved = resolveConflict(
        localFull as Record<string, unknown>,
        serverData as Record<string, unknown>,
        choice
      ) as IncidentRow;

      // Rejoue la mutation avec les données résolues si l'utilisateur a choisi "local" ou "merge"
      if (choice !== 'server') {
        await updateIncident({ id: resolved.id, title: resolved.title, description: resolved.description ?? undefined, severity: resolved.severity as UpdateIncidentPayload['severity'], status: resolved.status as UpdateIncidentPayload['status'] });
        queryClient.invalidateQueries({ queryKey: ['incidents', projectId] });
      } else {
        // Serveur : on met à jour le cache avec la donnée serveur
        queryClient.setQueryData<IncidentRow[]>(['incidents', projectId], (old) =>
          old?.map((i) => (i.id === serverData.id ? serverData as IncidentRow : i))
        );
      }
    },
  });
}
