import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type SupplierRow = Database['public']['Tables']['suppliers']['Row'];

export function useSuppliers(projectId: string) {
  return useQuery({
    queryKey: ['suppliers', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('project_id', projectId)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSupplier(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, type }: { name: string; type?: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({ project_id: projectId, name, type: type ?? null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', projectId] });
    },
  });
}

export function useDeleteSupplier(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', projectId] });
    },
  });
}
