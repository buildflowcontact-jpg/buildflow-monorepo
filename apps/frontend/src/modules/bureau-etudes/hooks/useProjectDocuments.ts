import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('project_id', projectId)
        .order('title');
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ title, category }: { title: string; category?: string }) => {
      const { data, error } = await supabase
        .from('documents')
        .insert({ project_id: projectId, title, category })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-documents', projectId]);
    },
  });
}

export function useUpdateDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title, category }: { id: string; title: string; category?: string }) => {
      const { data, error } = await supabase
        .from('documents')
        .update({ title, category })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-documents', projectId]);
    },
  });
}

export function useDeleteDocument(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-documents', projectId]);
    },
  });
}
