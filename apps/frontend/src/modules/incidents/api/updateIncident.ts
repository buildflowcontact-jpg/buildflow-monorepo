// modules/incidents/api/updateIncident.ts
import { supabase } from '@/services/supabaseClient';
import type { UpdateIncidentPayload, IncidentRow } from '../types';

export async function updateIncident(
  payload: UpdateIncidentPayload
): Promise<IncidentRow> {
  const { id, ...fields } = payload;
  const { data, error } = await supabase
    .from('incidents')
    .update(fields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
