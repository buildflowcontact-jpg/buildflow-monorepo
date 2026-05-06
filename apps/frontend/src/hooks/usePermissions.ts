// hooks/usePermissions.ts
// Hook central de permissions basé sur le rôle projet (RBAC).
// Usage : const { can } = usePermissions(projectId)

import { useRBAC } from './useRBAC';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    'incidents:read', 'incidents:create', 'incidents:update', 'incidents:delete',
    'tasks:read', 'tasks:create', 'tasks:update', 'tasks:delete',
    'procurement:read', 'procurement:create', 'procurement:update',
    'finance:read', 'finance:create',
    'team:read', 'team:invite', 'team:remove',
    'settings:read', 'settings:update',
  ],
  manager: [
    'incidents:read', 'incidents:create', 'incidents:update',
    'tasks:read', 'tasks:create', 'tasks:update',
    'procurement:read', 'procurement:create',
    'finance:read',
    'team:read', 'team:invite',
    'settings:read',
  ],
  site_manager: [
    'incidents:read', 'incidents:create', 'incidents:update',
    'tasks:read', 'tasks:create', 'tasks:update',
    'procurement:read',
    'team:read',
  ],
  technician: [
    'incidents:read', 'incidents:create',
    'tasks:read', 'tasks:update',
    'procurement:read',
    'team:read',
  ],
  viewer: [
    'incidents:read',
    'tasks:read',
    'team:read',
  ],
};

export function usePermissions(projectId: string) {
  const { data: role } = useRBAC(projectId);

  const can = (permission: string): boolean => {
    if (!role) return false;
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  };

  return { can, role: role ?? null };
}
