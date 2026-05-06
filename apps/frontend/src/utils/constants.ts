// utils/constants.ts
// Constantes globales de l'application BuildFlow.

export const APP_NAME = 'BuildFlow';
export const APP_VERSION = '1.0.0';

// Statuts projets
export const PROJECT_STATUS = {
  PLANNING: 'planning',
  ACTIVE: 'active',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const;

// Statuts incidents
export const INCIDENT_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review_site_manager',
  APPROVED_FOR_PM: 'approved_for_pm',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  NEEDS_INFO: 'needs_more_info',
} as const;

// Sévérité incidents
export const INCIDENT_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Statuts tâches
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
  BLOCKED: 'blocked',
} as const;

// Rôles projet
export const PROJECT_ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  SITE_MANAGER: 'site_manager',
  TECHNICIAN: 'technician',
  VIEWER: 'viewer',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Supabase Storage
export const STORAGE_BUCKET = 'project-media';

// React Query stale time (ms)
export const QUERY_STALE_TIME = 1000 * 60 * 5; // 5 min
export const QUERY_GC_TIME = 1000 * 60 * 10;    // 10 min
