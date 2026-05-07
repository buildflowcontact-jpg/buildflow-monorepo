// hooks/usePermissions.ts
// Façade RBAC standalone — utilisée par les composants hors contexte React.
// Aligne les permissions avec la matrice PermissionProvider.

import { useRBAC } from './useRBAC';
import type { Permission, ProjectRole } from '@/app/providers/PermissionProvider';

const ROLE_ALIASES: Record<string, ProjectRole> = {
  admin: 'admin', ADMIN: 'admin', owner: 'admin',
  chef_projet: 'chef_projet', CHEF_PROJET: 'chef_projet', charge_projet: 'chef_projet', manager: 'chef_projet',
  chef_chantier: 'chef_chantier', CHEF_CHANTIER: 'chef_chantier', site_manager: 'chef_chantier',
  bureau_etudes: 'bureau_etudes', BUREAU_ETUDES: 'bureau_etudes', BE: 'bureau_etudes', be: 'bureau_etudes',
  commercial: 'commercial', COMMERCIAL: 'commercial',
  technicien: 'technicien', TECHNICIEN: 'technicien',
  sous_traitant: 'sous_traitant', SOUS_TRAITANT: 'sous_traitant', subcontractor: 'sous_traitant',
  viewer: 'viewer', VIEWER: 'viewer',
};

const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  admin: [
    'module:dashboard','module:terrain','module:executer','module:planifier',
    'module:piloter','module:equipe','module:approvisionner','module:finance',
    'module:incidents','module:rh','module:commercial','module:kpi',
    'module:time','module:audit','module:parametres',
    'dashboard:full',
    'documents:read','documents:create','documents:update','documents:delete','documents:publish','documents:annotate',
    'tasks:read','tasks:create','tasks:update','tasks:validate','tasks:delete','tasks:assign',
    'incidents:read','incidents:create','incidents:update','incidents:delete','incidents:approve','incidents:escalate','incidents:validate_terrain',
    'procurement:read','procurement:create','procurement:manage','procurement:receive',
    'finance:read','finance:full','finance:export',
    'rh:read','rh:manage','team:invite','team:remove','team:manage_roles',
    'commercial:read','commercial:full',
    'time:personal','time:manage_team','time:read',
    'audit:read',
    'settings:update','workflow:manage','project:settings',
  ],
  chef_projet: [
    'module:dashboard','module:terrain','module:executer','module:planifier',
    'module:piloter','module:equipe','module:approvisionner','module:finance',
    'module:incidents','module:rh','module:commercial','module:kpi',
    'module:time','module:audit','module:parametres',
    'dashboard:full',
    'documents:read','documents:create','documents:update','documents:delete','documents:publish','documents:annotate',
    'tasks:read','tasks:create','tasks:update','tasks:validate','tasks:delete','tasks:assign',
    'incidents:read','incidents:create','incidents:update','incidents:approve','incidents:escalate','incidents:validate_terrain',
    'procurement:read','procurement:create','procurement:manage','procurement:receive',
    'finance:read','finance:full','finance:export',
    'rh:read','rh:manage','team:invite','team:remove','team:manage_roles',
    'commercial:read',
    'time:read',
    'audit:read',
    'settings:update','workflow:manage','project:settings',
  ],
  chef_chantier: [
    'module:dashboard','module:terrain','module:executer','module:planifier',
    'module:piloter','module:equipe','module:approvisionner',
    'module:incidents','module:rh','module:kpi','module:time','module:parametres',
    'dashboard:operational',
    'documents:read','documents:annotate',
    'tasks:read','tasks:create','tasks:update','tasks:validate','tasks:assign',
    'incidents:read','incidents:create','incidents:update','incidents:escalate','incidents:validate_terrain',
    'procurement:read','procurement:receive',
    'rh:read','team:invite','team:remove',
    'time:personal','time:manage_team',
    'audit:limited',
    'settings:update',
  ],
  bureau_etudes: [
    'module:dashboard','module:executer','module:planifier',
    'module:piloter','module:approvisionner','module:incidents',
    'module:kpi','module:parametres',
    'dashboard:full',
    'documents:read','documents:create','documents:update','documents:delete','documents:publish','documents:annotate',
    'tasks:read','tasks:create','tasks:update','tasks:validate',
    'incidents:read','incidents:create','incidents:update',
    'procurement:read',
    'audit:read',
    'settings:update',
  ],
  commercial: [
    'module:dashboard','module:executer','module:planifier',
    'module:piloter','module:approvisionner','module:finance',
    'module:incidents','module:commercial','module:kpi','module:parametres',
    'dashboard:full',
    'documents:read',
    'tasks:read',
    'incidents:read_critical',
    'procurement:read',
    'finance:read',
    'commercial:read','commercial:full',
    'settings:update',
  ],
  technicien: [
    'module:dashboard','module:terrain','module:executer',
    'module:incidents','module:time','module:parametres',
    'dashboard:personal',
    'documents:read',
    'tasks:read','tasks:update',
    'incidents:read','incidents:create',
    'time:personal',
    'settings:update',
  ],
  sous_traitant: [
    'module:dashboard','module:terrain','module:executer',
    'module:incidents','module:time',
    'dashboard:limited',
    'documents:read',
    'tasks:read','tasks:update',
    'incidents:create',
    'time:personal',
  ],
  viewer: [
    'module:dashboard','module:executer',
    'dashboard:limited',
    'documents:read',
    'tasks:read',
    'incidents:read',
  ],
};

export function usePermissions(projectId: string) {
  const { data: rawRole } = useRBAC(projectId);
  const role: ProjectRole = ROLE_ALIASES[String(rawRole ?? '')] ?? 'viewer';
  const perms = new Set<Permission>(ROLE_PERMISSIONS[role] ?? []);

  const can = (permission: string): boolean => perms.has(permission as Permission);

  return { can, role: role ?? null };
}
