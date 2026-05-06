// modules/incidents/hooks/useIncidentsPaginated.ts
import { useQuery } from '@tanstack/react-query';
import { getIncidentsPaginated } from '../api/getIncidentsPaginated';
import { QUERY_STALE_TIME } from '@/utils/constants';

export const INCIDENTS_PAGE_SIZE = 15;

export function useIncidentsPaginated(projectId: string, page: number) {
  return useQuery({
    queryKey: ['incidents-paginated', projectId, page],
    queryFn: () => getIncidentsPaginated(projectId, page, INCIDENTS_PAGE_SIZE),
    enabled: !!projectId,
    staleTime: QUERY_STALE_TIME,
    placeholderData: (prev) => prev,
  });
}
