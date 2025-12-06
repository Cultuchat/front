"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/types/event";
import { useAuth } from "./use-auth";

const STORAGE_KEY = "cultuchat_history";

// Cache global para historial - persiste entre renders
let globalHistoryCache: HistoryEvent[] | null = null;

export type HistoryEvent = Event & {
  visitedAt: Date;
  interested: boolean;
  attended?: boolean;
  rating?: number;
};

export function useHistory() {
  const { user, isAuthenticated } = useAuth();
  const [history, setHistory] = useState<HistoryEvent[]>(globalHistoryCache || []);
  // Solo mostrar loading si no hay cache
  const [isLoading, setIsLoading] = useState(globalHistoryCache === null);
  const hasInitialized = useRef(globalHistoryCache !== null);
  const isFetching = useRef(false);

  /**
   * Load history from localStorage (fallback)
   */
  const loadFromLocalStorage = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const historyData = parsed.map((item: Omit<HistoryEvent, 'visitedAt'> & { visitedAt: string }) => ({
          ...item,
          visitedAt: new Date(item.visitedAt),
        }));
        setHistory(historyData);
        globalHistoryCache = historyData;
      } catch (error) {
        console.error("Error loading history from localStorage:", error);
      }
    }
    hasInitialized.current = true;
    setIsLoading(false);
  }, []);

  /**
   * Load history from Supabase or localStorage
   */
  const loadHistory = useCallback(async () => {
    // Evitar múltiples fetches simultáneos
    if (isFetching.current) return;
    isFetching.current = true;

    // Solo mostrar loading si no tenemos datos
    if (history.length === 0) {
      setIsLoading(true);
    }

    try {
      if (isAuthenticated && user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('user_history')
          .select(`
            id,
            event_id,
            visited_at,
            interested,
            attended,
            rating,
            events (*)
          `)
          .eq('user_id', user.id)
          .order('visited_at', { ascending: false });

        if (error) {
          console.error("Error loading history from Supabase:", error);
          loadFromLocalStorage();
        } else if (data) {
          type HistoryRow = { events?: Event; visited_at: string; interested?: boolean; attended?: boolean; rating?: number };
          const typedData = data as unknown as HistoryRow[];
          const events = typedData
            .filter((hist) => hist.events)
            .map((hist) => ({
              ...hist.events,
              visitedAt: new Date(hist.visited_at),
              interested: hist.interested || false,
              attended: hist.attended || false,
              rating: hist.rating || undefined
            } as HistoryEvent));
          setHistory(events);
          globalHistoryCache = events;

          // Migrate localStorage history to Supabase
          await migrateLocalStorageToSupabase();
        }
      } else {
        // Load from localStorage
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Error loading history:", error);
      loadFromLocalStorage();
    } finally {
      hasInitialized.current = true;
      setIsLoading(false);
      isFetching.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated, history.length, loadFromLocalStorage]);

  // Load history on mount solo si no está inicializado
  useEffect(() => {
    if (!hasInitialized.current || (user && globalHistoryCache === null)) {
      loadHistory();
    }
  }, [loadHistory, user]);

  /**
   * Migrate localStorage history to Supabase
   */
  const migrateLocalStorageToSupabase = async () => {
    if (!isAuthenticated || !user) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const localHistory = JSON.parse(stored) as HistoryEvent[];
      if (localHistory.length === 0) return;

      console.log(`Migrating ${localHistory.length} history items to Supabase...`);

      // Insert history to Supabase
      for (const item of localHistory) {
        await supabase
          .from('user_history')
          .upsert({
            user_id: user.id,
            event_id: item.id,
            visited_at: item.visitedAt.toISOString(),
            interested: item.interested || false
          }, {
            onConflict: 'user_id,event_id'
          });
      }

      // Clear localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY);
      console.log("History migration complete!");
    } catch (error) {
      console.error("Error migrating history:", error);
    }
  };

  /**
   * Add event to history
   */
  const addToHistory = useCallback(async (event: Event, interested: boolean = false) => {
    const updateLocalState = (prev: HistoryEvent[]) => {
      const filtered = prev.filter((e) => e.id.toString() !== event.id.toString());
      const updated = [
        {
          ...event,
          visitedAt: new Date(),
          interested,
        },
        ...filtered,
      ];
      globalHistoryCache = updated;
      return updated;
    };

    if (isAuthenticated && user) {
      // Add to Supabase
      try {
        const { error } = await supabase
          .from('user_history')
          .upsert({
            user_id: user.id,
            event_id: event.id,
            visited_at: new Date().toISOString(),
            interested
          }, {
            onConflict: 'user_id,event_id'
          });

        if (error) {
          console.error("Error adding to history:", error);
          return;
        }

        // Update local state
        setHistory(updateLocalState);
      } catch (error) {
        console.error("Error adding to history:", error);
      }
    } else {
      // Add to localStorage
      setHistory((prev) => {
        const updated = updateLocalState(prev);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user, isAuthenticated]);

  /**
   * Mark event as interested
   */
  const markAsInterested = useCallback(async (eventId: string | number) => {
    const updateState = (prev: HistoryEvent[]) => {
      const updated = prev.map((e) =>
        e.id.toString() === eventId.toString() ? { ...e, interested: true } : e
      );
      globalHistoryCache = updated;
      return updated;
    };

    if (isAuthenticated && user) {
      // Update in Supabase
      try {
        const { error } = await supabase
          .from('user_history')
          .update({ interested: true })
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) {
          console.error("Error marking as interested:", error);
          return;
        }

        // Update local state
        setHistory(updateState);
      } catch (error) {
        console.error("Error marking as interested:", error);
      }
    } else {
      // Update in localStorage
      setHistory((prev) => {
        const updated = updateState(prev);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user, isAuthenticated]);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(async () => {
    if (isAuthenticated && user) {
      // Clear from Supabase
      try {
        const { error } = await supabase
          .from('user_history')
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error("Error clearing history:", error);
          return;
        }

        setHistory([]);
        globalHistoryCache = [];
      } catch (error) {
        console.error("Error clearing history:", error);
      }
    } else {
      // Clear localStorage
      setHistory([]);
      globalHistoryCache = [];
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user, isAuthenticated]);

  return {
    history,
    addToHistory,
    markAsInterested,
    clearHistory,
    isLoading,
  };
}
