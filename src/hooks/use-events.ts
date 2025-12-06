/**
 * Hook for fetching and managing events from Supabase.
 * Uses global EventsContext for caching to prevent re-loading on navigation.
 */

import { useEventsContext, type EventFilters } from "@/contexts/events-context";

// Re-export EventFilters type for backward compatibility
export type { EventFilters };

interface UseEventsOptions {
  initialFilters?: EventFilters;
  autoFetch?: boolean;
}

interface UseEventsReturn {
  events: import("@/types/event").Event[];
  loading: boolean;
  error: Error | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  fetchEvents: (filters?: EventFilters) => Promise<void>;
  setPage: (page: number) => void;
}

/**
 * Hook to fetch events from the backend with filtering and pagination.
 * Now uses EventsContext for global caching.
 */
export function useEvents(options: UseEventsOptions = {}): UseEventsReturn {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { initialFilters = {}, autoFetch = true } = options;
  
  const context = useEventsContext();

  return {
    events: context.events,
    loading: context.loading,
    error: context.error,
    total: context.total,
    page: context.page,
    pageSize: context.pageSize,
    totalPages: context.totalPages,
    fetchEvents: context.fetchEvents,
    setPage: context.setPage,
  };
}
