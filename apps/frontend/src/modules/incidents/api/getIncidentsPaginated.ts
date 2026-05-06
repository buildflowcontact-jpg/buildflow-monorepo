// modules/incidents/api/getIncidentsPaginated.ts
import { supabase } from '@/services/supabaseClient';
import type { IncidentRow } from '../types';

export interface PaginatedIncidents {
  data: IncidentRow[];
  count: number;
}

export async function getIncidentsPaginated(
  projectId: string,
  page: number,
  pageSize: number,
): Promise<PaginatedIncidents> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('incidents')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}
