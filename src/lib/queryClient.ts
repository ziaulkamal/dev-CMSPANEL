/**
 * src/lib/queryClient.ts
 * Konfigurasi TanStack Query untuk server state (cache, retry, staleness).
 */
import { QueryClient } from '@tanstack/vue-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
