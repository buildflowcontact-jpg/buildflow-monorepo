// services/audit.ts
// Journal d'audit métier immuable.
// INSERT ONLY — ne jamais appeler update/delete sur audit_logs.

import { supabase } from './supabaseClient';

// Actions sensibles qui peuvent déclencher une alerte
const SENSITIVE_ACTIONS = new Set([
  'FINANCE_VIEW',
  'FINANCE_EXPORT',
  'DATA_EXPORT',
  'DELETE_ENTITY',
  'USER_PERMISSION_CHANGE',
  'LOGIN_FAILED',
]);

export type AuditAction =
  | 'READ'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'FINANCE_VIEW'
  | 'FINANCE_EXPORT'
  | 'DATA_EXPORT'
  | 'DELETE_ENTITY'
  | 'USER_PERMISSION_CHANGE'
  | 'LOGIN_FAILED'
  | string; // extensible

export interface AuditEntity {
  type: string;        // 'incident' | 'task' | 'document' | 'invoice' ...
  id?: string;
  project_id?: string;
}

export interface LogAuditOptions {
  userId: string;
  action: AuditAction;
  entity?: AuditEntity;
  eventId?: string;
  metadata?: Record<string, unknown>;
  onSensitive?: (action: AuditAction) => void;
}

/**
 * Enregistre un événement d'audit immuable.
 * Fire-and-forget : les erreurs sont loguées mais ne bloquent pas l'action métier.
 */
export async function logAudit(opts: LogAuditOptions): Promise<void> {
  const { userId, action, entity, eventId, metadata = {}, onSensitive } = opts;

  // Alerte sécurité sur actions sensibles
  if (SENSITIVE_ACTIONS.has(action)) {
    onSensitive?.(action);
  }

  const { error } = await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entity?.type ?? null,
    entity_id: entity?.id ?? null,
    project_id: entity?.project_id ?? null,
    event_id: eventId ?? null,
    metadata: {
      ...metadata,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    },
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Ne jamais bloquer l'UX pour un log d'audit
    console.warn('[audit] logAudit failed:', error.message);
  }
}

/**
 * Enregistre un event métier dans project_events ET un audit_log associé.
 * À utiliser pour toutes les actions importantes.
 */
export async function emitBusinessEvent(opts: {
  userId: string;
  projectId: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  auditEntity?: AuditEntity;
}): Promise<void> {
  const { userId, projectId, eventType, eventData = {}, auditEntity } = opts;

  const { data, error } = await supabase
    .from('project_events')
    .insert({
      project_id: projectId,
      event_type: eventType,
      event_data: { ...eventData, created_by: userId },
    })
    .select('id')
    .single();

  if (error) {
    console.warn('[audit] emitBusinessEvent insert failed:', error.message);
    return;
  }

  await logAudit({
    userId,
    action: eventType,
    entity: auditEntity ?? { type: 'project', project_id: projectId },
    eventId: data?.id,
    metadata: eventData,
  });
}
