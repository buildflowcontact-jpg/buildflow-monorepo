import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { useRole } from '@/app/providers/PermissionProvider';
import {
  decorateNotification,
  sortNotifications,
  type NotificationViewModel,
} from '../services/priority';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export function useNotifications(projectId: string, limit = 50) {
  const role = useRole();
  return useQuery({
    queryKey: ['notifications', projectId, role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return sortNotifications((data || []).map((row) => decorateNotification(row as NotificationRow, role)));
    },
    enabled: !!projectId,
  });
}

export function useSubscribeNotifications(projectId: string) {
  const role = useRole();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<NotificationViewModel[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`notifications:project_id=eq.${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newNotification = decorateNotification(payload.new as NotificationRow, role);
          setNotifications((prev) => sortNotifications([newNotification, ...prev]).slice(0, 50));
          queryClient.setQueryData<NotificationViewModel[]>(['notifications', projectId, role], (old) =>
            sortNotifications([newNotification, ...(old ?? [])]).slice(0, 50)
          );
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, queryClient, role]);

  return { notifications, isConnected };
}

export function useGroupedNotifications(projectId: string, limit = 50) {
  const { data = [], ...rest } = useNotifications(projectId, limit);

  const groups = useMemo(() => {
    return data.reduce<Record<string, NotificationViewModel[]>>((acc, notification) => {
      const key = notification.groupLabel;
      if (!acc[key]) acc[key] = [];
      acc[key].push(notification);
      return acc;
    }, {});
  }, [data]);

  return { data, groups, ...rest };
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notificationId, isRead }: { notificationId: string; isRead: boolean }) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: isRead })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('project_id', projectId)
        .or('is_read.is.null,is_read.eq.false');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useClearAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('project_id', projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
