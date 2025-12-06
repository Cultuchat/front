"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
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

interface EventsContextType {
  events: Event[];
  loading: boolean;
  error: Error | null;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  fetchEvents: (filters?: EventFilters) => Promise<void>;
  setPage: (page: number) => void;
  isInitialized: boolean;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

// Cache global para eventos - persiste entre renders
let globalEventsCache: Event[] = [];
let globalEventsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>(globalEventsCache);
  const [loading, setLoading] = useState<boolean>(globalEventsCache.length === 0);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState<number>(globalEventsCache.length);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(globalEventsCache.length > 0);
  const isFetching = useRef(false);

  const fetchEvents = useCallback(async (newFilters?: EventFilters) => {
    // Si no hay filtros y tenemos cache válido, no hacer fetch
    const hasFilters = newFilters && (
      newFilters.category || 
      newFilters.search || 
      newFilters.district || 
      newFilters.is_free !== undefined ||
      newFilters.date_from ||
      newFilters.date_to
    );
    
    const cacheValid = Date.now() - globalEventsCacheTime < CACHE_DURATION;
    
    if (!hasFilters && globalEventsCache.length > 0 && cacheValid) {
      setEvents(globalEventsCache);
      setTotal(globalEventsCache.length);
      setIsInitialized(true);
      setLoading(false);
      return;
    }

    // Evitar múltiples fetches simultáneos
    if (isFetching.current) return;
    isFetching.current = true;

    // Solo mostrar loading si no tenemos datos previos
    if (events.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      const currentFilters = newFilters || {};

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

      // Guardar en cache global solo si no hay filtros
      if (!hasFilters) {
        globalEventsCache = convertedEvents;
        globalEventsCacheTime = Date.now();
      }

      setEvents(convertedEvents);
      setTotal(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
      setIsInitialized(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch events"));
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [page, pageSize, events.length]);

  // Fetch inicial solo una vez
  useEffect(() => {
    if (!isInitialized && !isFetching.current) {
      fetchEvents();
    }
  }, [isInitialized, fetchEvents]);

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        error,
        total,
        page,
        pageSize,
        totalPages,
        fetchEvents,
        setPage,
        isInitialized,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEventsContext() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error("useEventsContext must be used within an EventsProvider");
  }
  return context;
}
