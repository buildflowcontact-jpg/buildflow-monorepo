import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  status: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<ProjectSummary[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, code, status')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}