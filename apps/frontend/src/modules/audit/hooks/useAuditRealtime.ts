// modules/audit/hooks/useAuditRealtime.ts
// Souscription Supabase Realtime sur audit_logs — invalide le cache + alerte sécurité.
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import { SENSITIVE_ACTIONS } from '../types';

interface UseAuditRealtimeOptions {
  projectId?: string;
  onSensitiveAction?: (log: Record<string, unknown>) => void;
}

export function useAuditRealtime({ projectId, onSensitiveAction }: UseAuditRealtimeOptions = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('audit_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        (payload) => {
          const log = payload.new as Record<string, unknown>;

          // Invalide uniquement si le log concerne le projet courant (ou si global)
          if (!projectId || log['project_id'] === projectId || log['project_id'] === null) {
            queryClient.invalidateQueries({ queryKey: ['audit_logs'] });
          }

          // Alerte sécurité pour les actions sensibles
          if (SENSITIVE_ACTIONS.includes(log['action'] as string)) {
            onSensitiveAction?.(log);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient, onSensitiveAction]);
}
