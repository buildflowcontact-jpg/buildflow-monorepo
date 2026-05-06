import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export type SecurityLogRow = Database['public']['Tables']['security_logs']['Row'];

export function useSecurityLogs(projectId: string, filters?: { action?: string; severity?: string; dateRange?: [string, string] }) {
  return useQuery({
    queryKey: ['security_logs', projectId, filters],
    queryFn: async () => {
      let query = supabase
        .from('security_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      if (filters?.dateRange) {
        const [start, end] = filters.dateRange;
        query = query
          .gte('created_at', start)
          .lte('created_at', end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SecurityLogRow[];
    },
    enabled: !!projectId,
  });
}

export function useSecurityLogStats(projectId: string) {
  return useQuery({
    queryKey: ['security_log_stats', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .eq('project_id', projectId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const logs = (data || []) as SecurityLogRow[];
      
      const actionCounts: Record<string, number> = {};
      const severityCounts: Record<string, number> = {};
      const hourlyActivity: Record<number, number> = {};

      logs.forEach((log) => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        const date = new Date(log.created_at);
        const hour = date.getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      });

      return {
        totalLogs: logs.length,
        actionCounts,
        severityCounts,
        hourlyActivity,
        lastLog: logs[0],
      };
    },
    enabled: !!projectId,
  });
}
