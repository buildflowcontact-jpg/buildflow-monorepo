// modules/audit/hooks/useAuditLogs.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';
import type { AuditFilters, AuditLog } from '../types';

export function useAuditLogs(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ['audit_logs', filters],
    queryFn: async (): Promise<AuditLog[]> => {
      let q = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (filters.projectId)  q = q.eq('project_id', filters.projectId);
      if (filters.action)     q = q.eq('action', filters.action);
      if (filters.entityType) q = q.eq('entity_type', filters.entityType);
      if (filters.userId)     q = q.eq('user_id', filters.userId);
      if (filters.from)       q = q.gte('created_at', filters.from);
      if (filters.to)         q = q.lte('created_at', filters.to);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as AuditLog[];
    },
    staleTime: 30_000,
  });
}
