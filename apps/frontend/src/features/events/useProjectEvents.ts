import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';

export function useProjectEvents(projectId: string) {
  return useQuery({
    queryKey: ['project-events', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_events')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateEvent(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, description, metadata }: { type: string; description?: string; metadata?: any }) => {
      const { data, error } = await supabase
        .from('project_events')
        .insert({ project_id: projectId, type, description, metadata })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-events', projectId]);
    },
  });
}

export function useUpdateEvent(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type, description, metadata }: { id: string; type: string; description?: string; metadata?: any }) => {
      const { data, error } = await supabase
        .from('project_events')
        .update({ type, description, metadata })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-events', projectId]);
    },
  });
}

export function useDeleteEvent(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('project_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['project-events', projectId]);
    },
  });
}
