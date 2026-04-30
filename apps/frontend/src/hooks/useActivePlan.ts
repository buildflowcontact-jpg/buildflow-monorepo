// hooks/useActivePlan.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useActivePlan(projectId: string) {
  return useQuery(['active-plan', projectId], async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_bpe', true)
      .single();
    if (error) throw error;
    return data;
  });
}
