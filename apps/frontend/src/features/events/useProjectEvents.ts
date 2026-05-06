import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import type { Json } from '../../types/database.types';

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
    mutationFn: async ({ type, description, metadata }: { type: string; description?: string; metadata?: Json }) => {
      const { data, error } = await supabase
        .from('project_events')
        .insert({ 
          project_id: projectId, 
          event_type: type, 
          event_data: { description: description ?? null, metadata: metadata ?? null } as Json
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });
}

export function useUpdateEvent(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type, description, metadata }: { id: string; type: string; description?: string; metadata?: Json }) => {
      const { data, error } = await supabase
        .from('project_events')
        .update({ 
          event_type: type, 
          event_data: { description: description ?? null, metadata: metadata ?? null } as Json
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
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
      queryClient.invalidateQueries({ queryKey: ['project-events', projectId] });
    },
  });
}
