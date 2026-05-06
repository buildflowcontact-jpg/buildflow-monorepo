import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/services/supabaseClient';

export interface ActivityTimelineItem {
  id: string;
  project_id: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  title: string;
  description: string | null;
  user_id: string | null;
  created_at: string;
}

export function useActivityTimeline(projectId?: string, limit = 20) {
  return useQuery({
    queryKey: ['activity_logs', projectId ?? 'all', limit],
    queryFn: async (): Promise<ActivityTimelineItem[]> => {
      let query = supabase
        .from('activity_logs' as never)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (projectId) {
        query = query.eq('project_id' as never, projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as ActivityTimelineItem[];
    },
    staleTime: 15_000,
  });
}
