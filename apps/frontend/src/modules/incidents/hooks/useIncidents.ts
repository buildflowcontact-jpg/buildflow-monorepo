// modules/incidents/hooks/useIncidents.ts
import { useQuery } from '@tanstack/react-query';
import { getIncidents } from '../api/getIncidents';
import { QUERY_STALE_TIME } from '@/utils/constants';

export function useIncidents(projectId: string) {
  return useQuery({
    queryKey: ['incidents', projectId],
    queryFn: () => getIncidents(projectId),
    enabled: !!projectId,
    staleTime: QUERY_STALE_TIME,
  });
}
