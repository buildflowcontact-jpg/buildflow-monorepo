import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type TimeEntryRow = Database['public']['Tables']['time_entries']['Row'];

export function useTimeEntries(projectId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['time_entries', projectId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('time_entries')
        .select('id, worker_id, task_id, hours, description, work_date, created_at')
        .eq('project_id', projectId)
        .order('work_date', { ascending: false });

      if (startDate) {
        query = query.gte('work_date', startDate);
      }
      if (endDate) {
        query = query.lte('work_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as TimeEntryRow[];
    },
    enabled: !!projectId,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      workerId?: string;
      taskId?: string;
      hours: number;
      description?: string;
      workDate: string;
    }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          project_id: params.projectId,
          worker_id: params.workerId,
          task_id: params.taskId,
          hours: params.hours,
          description: params.description,
          work_date: params.workDate,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TimeEntryRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['time_entries', projectId] });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      entryId: string;
      projectId: string;
      hours?: number;
      description?: string;
      workDate?: string;
    }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update({
          hours: params.hours,
          description: params.description,
          work_date: params.workDate,
        })
        .eq('id', params.entryId)
        .select()
        .single();

      if (error) throw error;
      return data as TimeEntryRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['time_entries', projectId] });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { entryId: string; projectId: string }) => {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', params.entryId);

      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['time_entries', projectId] });
    },
  });
}
