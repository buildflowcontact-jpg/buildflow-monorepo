import type { Database } from '@/types/database.types';
import type { ProjectRole } from '@/app/providers/PermissionProvider';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationViewModel extends NotificationRow {
  priority: NotificationPriority;
  title: string;
  groupLabel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

const PRIORITY_RANK: Record<NotificationPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const TYPE_TITLES: Record<string, string> = {
  incident: 'Incident terrain',
  incident_created: 'Incident créé',
  incident_escalated: 'Incident escaladé',
  task_assigned: 'Tâche assignée',
  task_completed: 'Tâche terminée',
  validation: 'Validation requise',
  alert: 'Alerte projet',
  comment: 'Nouveau commentaire',
};

export const computeNotificationPriority = (
  type: string,
  role: ProjectRole | null | undefined
): NotificationPriority => {
  if ((type === 'incident' || type === 'incident_escalated') && (role === 'chef_chantier' || role === 'chef_projet' || role === 'admin')) {
    return 'critical';
  }

  if (type === 'task_assigned' || type === 'validation' || type === 'task_completed') {
    return 'high';
  }

  if (type === 'comment') {
    return 'low';
  }

  return 'medium';
};

export const groupLabelForPriority = (priority: NotificationPriority): NotificationViewModel['groupLabel'] => {
  switch (priority) {
    case 'critical':
      return 'CRITICAL';
    case 'high':
      return 'HIGH';
    case 'low':
      return 'LOW';
    case 'medium':
    default:
      return 'MEDIUM';
  }
};

export const decorateNotification = (
  row: NotificationRow,
  role: ProjectRole | null | undefined
): NotificationViewModel => {
  const raw = row as NotificationRow & { priority?: NotificationPriority; title?: string | null };
  const priority = raw.priority ?? computeNotificationPriority(row.type, role);
  return {
    ...row,
    priority,
    title: raw.title ?? TYPE_TITLES[row.type] ?? row.type,
    groupLabel: groupLabelForPriority(priority),
  };
};

export const sortNotifications = (items: NotificationViewModel[]) =>
  [...items].sort((a, b) => {
    const p = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    if (p !== 0) return p;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
