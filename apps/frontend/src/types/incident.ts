// types/incident.ts
// Types métier pour le module incidents.

import type { Database } from './database.types';

// Type de base depuis Supabase
export type IncidentRow = Database['public']['Tables']['incidents']['Row'];
export type IncidentInsert = Database['public']['Tables']['incidents']['Insert'];
export type IncidentUpdate = Database['public']['Tables']['incidents']['Update'];

// Sévérité typée
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

// Statuts du workflow
export type IncidentStatus =
  | 'submitted'
  | 'under_review_site_manager'
  | 'approved_for_pm'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'needs_more_info';

// Actions de transition
export type IncidentAction =
  | 'review'
  | 'approve'
  | 'reject'
  | 'request_info'
  | 'start'
  | 'resolve';

// Payload de création
export interface CreateIncidentPayload {
  project_id: string;
  title: string;
  description?: string;
  severity?: IncidentSeverity;
}

// Payload de mise à jour
export interface UpdateIncidentPayload {
  id: string;
  title?: string;
  description?: string;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
}
