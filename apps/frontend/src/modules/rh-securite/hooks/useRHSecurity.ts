import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/types/database.types';

type WorkerRow = Database['public']['Tables']['workers']['Row'];
type UserRoleRow = Database['public']['Tables']['user_roles']['Row'];
type RolePermissionRow = Database['public']['Tables']['role_permissions']['Row'];
type SecurityLogRow = Database['public']['Tables']['security_logs']['Row'];

// Workers Hooks
export function useWorkers(projectId: string) {
  return useQuery({
    queryKey: ['workers', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('id, full_name, role, company, created_at')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data as WorkerRow[];
    },
    enabled: !!projectId,
  });
}

export function useCreateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { projectId: string; fullName: string; role?: string; company?: string }) => {
      const { data, error } = await supabase
        .from('workers')
        .insert({
          project_id: params.projectId,
          full_name: params.fullName,
          role: params.role,
          company: params.company,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as WorkerRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['workers', projectId] });
    },
  });
}

export function useUpdateWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { workerId: string; projectId: string; fullName?: string; role?: string; company?: string }) => {
      const { data, error } = await supabase
        .from('workers')
        .update({
          full_name: params.fullName,
          role: params.role,
          company: params.company,
        })
        .eq('id', params.workerId)
        .select()
        .single();
      
      if (error) throw error;
      return data as WorkerRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['workers', projectId] });
    },
  });
}

export function useDeleteWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { workerId: string; projectId: string }) => {
      const { error } = await supabase
        .from('workers')
        .delete()
        .eq('id', params.workerId);
      
      if (error) throw error;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['workers', projectId] });
    },
  });
}

// User Roles Hooks
export function useUserRoles(projectId: string) {
  return useQuery({
    queryKey: ['user_roles', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, name, description, created_at')
        .eq('project_id', projectId);
      
      if (error) throw error;
      return data as UserRoleRow[];
    },
    enabled: !!projectId,
  });
}

export function useCreateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { projectId: string; name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          project_id: params.projectId,
          name: params.name,
          description: params.description,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as UserRoleRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['user_roles', projectId] });
    },
  });
}

// Role Permissions Hooks
export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: ['role_permissions', roleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('id, permission, granted_at')
        .eq('role_id', roleId);
      
      if (error) throw error;
      return data as RolePermissionRow[];
    },
    enabled: !!roleId,
  });
}

export function useGrantPermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { roleId: string; permission: string }) => {
      const { data, error } = await supabase
        .from('role_permissions')
        .insert({
          role_id: params.roleId,
          permission: params.permission,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as RolePermissionRow;
    },
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['role_permissions', roleId] });
    },
  });
}

export function useRevokePermission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { permissionId: string; roleId: string }) => {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('id', params.permissionId);
      
      if (error) throw error;
    },
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['role_permissions', roleId] });
    },
  });
}

// Security Logs Hooks
export function useSecurityLogs(projectId: string) {
  return useQuery({
    queryKey: ['security_logs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_logs')
        .select('id, actor_id, action, resource_type, resource_id, details, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as SecurityLogRow[];
    },
    enabled: !!projectId,
  });
}

export function useLogSecurityEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      projectId: string;
      action: string;
      resourceType?: string;
      resourceId?: string;
      details?: Database['public']['Tables']['security_logs']['Insert']['details'];
      actorId?: string;
    }) => {
      const { data, error } = await supabase
        .from('security_logs')
        .insert({
          project_id: params.projectId,
          action: params.action,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
          details: params.details as unknown as Json,
          actor_id: params.actorId,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as SecurityLogRow;
    },
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['security_logs', projectId] });
    },
  });
}
