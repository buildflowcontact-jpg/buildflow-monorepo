// modules/incidents/hooks/useIncidentsRealtime.ts
// Souscription Supabase Realtime — invalide automatiquement le cache React Query.
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { eventBus } from '@/services/eventBus';

export function useIncidentsRealtime(projectId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`incidents:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incidents',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['incidents', projectId] });

          if (payload.eventType === 'INSERT') {
            eventBus.emit('incident_created', payload.new);
          } else if (payload.eventType === 'UPDATE') {
            eventBus.emit('incident_updated', payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}
