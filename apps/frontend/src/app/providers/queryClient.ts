// app/providers/queryClient.ts
// Instance singleton de QueryClient partagée par tous les providers et services.
// Exportée ici pour éviter les imports circulaires.

import { QueryClient } from "@tanstack/react-query";
import { QUERY_STALE_TIME, QUERY_GC_TIME } from "@/utils/constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      gcTime: QUERY_GC_TIME,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
