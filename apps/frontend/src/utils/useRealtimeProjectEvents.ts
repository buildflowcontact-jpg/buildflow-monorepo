import { useEffect } from 'react';
import { supabase } from './supabaseClient';

export function useRealtimeProjectEvents({ projectId, onEvent }: { projectId: string, onEvent: (evt: any) => void }) {
  useEffect(() => {
    const channel = supabase.channel('realtime:project_events')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_events',
        filter: `project_id=eq.${projectId}`
      }, payload => {
        onEvent(payload);
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [projectId, onEvent]);
}
