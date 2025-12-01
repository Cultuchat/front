/**
 * Hook for fetching and managing events from Supabase.
 * All data is dynamic and comes from real sources via Firecrawl.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase, type Event as SupabaseEvent } from "@/lib/supabase";
import type { Event } from "@/types/event";

export interface EventFilters {
  category?: string;
  district?: string;
  is_free?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

interface UseEventsOptions {
  initialFilters?: EventFilters;
  autoFetch?: boolean;
}

interface UseEventsReturn {
  events: Event[];
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
 */
export function useEvents(options: UseEventsOptions = {}): UseEventsReturn {
  const { initialFilters = {}, autoFetch = true } = options;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(initialFilters.page || 1);
  const [pageSize] = useState<number>(initialFilters.page_size || 20);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [filters, setFilters] = useState<EventFilters>(initialFilters);
  const hasFetched = useRef(false);

  const fetchEvents = useCallback(async (newFilters?: EventFilters) => {
    setLoading(true);
    setError(null);

    try {
      const currentFilters = newFilters || {};

      // Build Supabase query
      // Note: We don't filter by event_date >= now because many events have null dates
      // Events without dates are shown at the end (nulls last)
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('event_date', { ascending: true, nullsFirst: false });

      // Apply filters
      if (currentFilters.category) {
        query = query.eq('category', currentFilters.category);
      }
      if (currentFilters.district) {
        query = query.eq('district', currentFilters.district);
      }
      if (currentFilters.is_free !== undefined) {
        query = query.eq('is_free', currentFilters.is_free);
      }
      if (currentFilters.date_from) {
        query = query.gte('event_date', currentFilters.date_from);
      }
      if (currentFilters.date_to) {
        query = query.lte('event_date', currentFilters.date_to);
      }
      if (currentFilters.search) {
        query = query.or(`title.ilike.%${currentFilters.search}%,description.ilike.%${currentFilters.search}%`);
      }

      // Pagination
      const currentPage = currentFilters.page || page;
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      // Convert Supabase events to frontend Event type
      const convertedEvents: Event[] = (data || []).map((e: SupabaseEvent) => ({
        id: e.id,
        title: e.title,
        description: e.description || e.short_description || "",
        short_description: e.short_description,
        category: e.category || "General",
        subcategory: e.subcategory,
        tags: e.tags || [],
        event_date: e.event_date,
        event_end_date: e.event_end_date,
        event_time: e.event_time,
        venue_name: e.venue_name,
        venue_address: e.venue_address,
        district: e.district,
        city: e.city,
        price_min: e.price_min,
        price_max: e.price_max,
        price_text: e.price_text,
        is_free: e.is_free,
        source_name: e.source_name,
        source_url: e.source_url,
        image_url: e.image_url,
        is_active: e.is_active,
        created_at: e.created_at,
        updated_at: e.updated_at,
        latitude: e.latitude,
        longitude: e.longitude,
      }));

      setEvents(convertedEvents);
      setTotal(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));

      if (newFilters) {
        setFilters(currentFilters);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch events"));
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (autoFetch && !hasFetched.current) {
      hasFetched.current = true;
      fetchEvents();
    }
  }, [autoFetch, fetchEvents]);

  return {
    events,
    loading,
    error,
    total,
    page,
    pageSize,
    totalPages,
    fetchEvents,
    setPage,
  };
}
