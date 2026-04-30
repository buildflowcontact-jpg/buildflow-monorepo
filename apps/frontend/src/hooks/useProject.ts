// hooks/useProject.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useProject(projectId: string) {
  return useQuery(['project', projectId], async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (error) throw error;
    return data;
  });
}
