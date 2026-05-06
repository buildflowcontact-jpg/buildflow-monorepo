import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

export type SearchResultType = 'project' | 'document' | 'incident' | 'task' | 'supplier' | 'worker';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
}

type ProjectRow = Pick<Database['public']['Tables']['projects']['Row'], 'id' | 'name' | 'code'>;
type DocumentRow = Pick<Database['public']['Tables']['documents']['Row'], 'id' | 'title' | 'category'>;
type IncidentRow = Pick<Database['public']['Tables']['incidents']['Row'], 'id' | 'title' | 'description'>;
type TaskRow = Pick<Database['public']['Tables']['tasks']['Row'], 'id' | 'title' | 'status'>;
type SupplierRow = Pick<Database['public']['Tables']['suppliers']['Row'], 'id' | 'name' | 'type'>;
type WorkerRow = Pick<Database['public']['Tables']['workers']['Row'], 'id' | 'full_name' | 'company'>;

async function safeQuery<T>(queryBuilder: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  try {
    const { data } = await queryBuilder;
    return data ?? [];
  } catch {
    return [];
  }
}

export function useSearch(rawQuery: string) {
  const query = rawQuery.trim();

  return useQuery({
    queryKey: ['global-search', query],
    enabled: query.length >= 2,
    queryFn: async (): Promise<SearchResult[]> => {
      const likeQuery = `%${query}%`;

      const [projects, documents, incidents, tasks, suppliers, workers] = await Promise.all([
        safeQuery<ProjectRow>(supabase.from('projects').select('id, name, code').or(`name.ilike.${likeQuery},code.ilike.${likeQuery}`).limit(5) as unknown as PromiseLike<{ data: ProjectRow[] | null; error: unknown }>),
        safeQuery<DocumentRow>(supabase.from('documents').select('id, title, doc_type').ilike('title', likeQuery).limit(5) as unknown as PromiseLike<{ data: DocumentRow[] | null; error: unknown }>),
        safeQuery<IncidentRow>(supabase.from('incidents').select('id, title, description').or(`title.ilike.${likeQuery},description.ilike.${likeQuery}`).limit(5) as unknown as PromiseLike<{ data: IncidentRow[] | null; error: unknown }>),
        safeQuery<TaskRow>(supabase.from('tasks').select('id, title, status').ilike('title', likeQuery).limit(5) as unknown as PromiseLike<{ data: TaskRow[] | null; error: unknown }>),
        safeQuery<SupplierRow>(supabase.from('suppliers').select('id, name, type').ilike('name', likeQuery).limit(5) as unknown as PromiseLike<{ data: SupplierRow[] | null; error: unknown }>),
        safeQuery<WorkerRow>(supabase.from('workers').select('id, full_name, company').ilike('full_name', likeQuery).limit(5) as unknown as PromiseLike<{ data: WorkerRow[] | null; error: unknown }>),
      ]);

      return [
        ...projects.map((item) => ({ id: item.id, type: 'project' as const, title: item.name, subtitle: item.code })),
        ...documents.map((item) => ({ id: item.id, type: 'document' as const, title: item.title, subtitle: item.category ?? undefined })),
        ...incidents.map((item) => ({ id: item.id, type: 'incident' as const, title: item.title, subtitle: item.description ?? undefined })),
        ...tasks.map((item) => ({ id: item.id, type: 'task' as const, title: item.title, subtitle: item.status ?? undefined })),
        ...suppliers.map((item) => ({ id: item.id, type: 'supplier' as const, title: item.name, subtitle: item.type ?? undefined })),
        ...workers.map((item) => ({ id: item.id, type: 'worker' as const, title: item.full_name, subtitle: item.company ?? undefined })),
      ];
    },
  });
}