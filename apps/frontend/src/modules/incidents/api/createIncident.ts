// modules/incidents/api/createIncident.ts
import { supabase } from '@/services/supabaseClient';
import type { CreateIncidentPayload, IncidentRow } from '../types';

export async function createIncident(
  payload: CreateIncidentPayload
): Promise<IncidentRow> {
  const { data, error } = await supabase
    .from('incidents')
    .insert({ ...payload, status: 'submitted' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
