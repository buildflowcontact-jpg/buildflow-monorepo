// modules/audit/types.ts

export interface AuditLog {
  id: string;
  event_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  project_id: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditFilters {
  projectId?: string;
  action?: string;
  entityType?: string;
  userId?: string;
  from?: string; // ISO date
  to?: string;   // ISO date
}

// Actions colorées pour l'UI
export const ACTION_COLORS: Record<string, string> = {
  CREATE:                   'bg-green-100 text-green-800',
  UPDATE:                   'bg-blue-100 text-blue-800',
  DELETE:                   'bg-red-100 text-red-800',
  DELETE_ENTITY:            'bg-red-100 text-red-800',
  READ:                     'bg-gray-100 text-gray-600',
  EXPORT:                   'bg-purple-100 text-purple-800',
  DATA_EXPORT:              'bg-purple-100 text-purple-800',
  FINANCE_EXPORT:           'bg-purple-100 text-purple-800',
  FINANCE_VIEW:             'bg-yellow-100 text-yellow-800',
  LOGIN:                    'bg-indigo-100 text-indigo-800',
  LOGOUT:                   'bg-indigo-100 text-indigo-700',
  LOGIN_FAILED:             'bg-red-100 text-red-700',
  USER_PERMISSION_CHANGE:   'bg-orange-100 text-orange-800',
};

export const SENSITIVE_ACTIONS = [
  'FINANCE_VIEW',
  'FINANCE_EXPORT',
  'DATA_EXPORT',
  'DELETE_ENTITY',
  'USER_PERMISSION_CHANGE',
  'LOGIN_FAILED',
];
