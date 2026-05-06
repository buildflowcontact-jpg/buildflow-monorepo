// hooks/useRBAC.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useRBAC(projectId: string) {
  return useQuery({
    queryKey: ['rbac', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('project_role', { p_project_id: projectId });
      if (error) throw error;
      return data;
    },
  });
}
