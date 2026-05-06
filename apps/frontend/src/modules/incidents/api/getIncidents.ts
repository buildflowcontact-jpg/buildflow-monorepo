// modules/incidents/api/getIncidents.ts
import { supabase } from '@/services/supabaseClient';
import type { IncidentRow } from '../types';

export async function getIncidents(projectId: string): Promise<IncidentRow[]> {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
