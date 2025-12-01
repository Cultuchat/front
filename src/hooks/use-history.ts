"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/types/event";
import { useAuth } from "./use-auth";

const STORAGE_KEY = "cultuchat_history";

export type HistoryEvent = Event & {
  visitedAt: Date;
  interested: boolean;
  attended?: boolean;
  rating?: number;
};

export function useHistory() {
  const { user, isAuthenticated } = useAuth();
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load history from Supabase or localStorage
   */
  const loadHistory = useCallback(async () => {
    setIsLoading(true);

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
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  /**
   * Load history from localStorage (fallback)
   */
  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHistory(
          parsed.map((item: Omit<HistoryEvent, 'visitedAt'> & { visitedAt: string }) => ({
            ...item,
            visitedAt: new Date(item.visitedAt),
          }))
        );
      } catch (error) {
        console.error("Error loading history from localStorage:", error);
      }
    }
  };

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
        setHistory((prev) => {
          const filtered = prev.filter((e) => e.id.toString() !== event.id.toString());
          return [
            {
              ...event,
              visitedAt: new Date(),
              interested,
            },
            ...filtered,
          ];
        });
      } catch (error) {
        console.error("Error adding to history:", error);
      }
    } else {
      // Add to localStorage
      setHistory((prev) => {
        const filtered = prev.filter((e) => e.id.toString() !== event.id.toString());
        const updated = [
          {
            ...event,
            visitedAt: new Date(),
            interested,
          },
          ...filtered,
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }
  }, [user, isAuthenticated]);

  /**
   * Mark event as interested
   */
  const markAsInterested = useCallback(async (eventId: string | number) => {
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
        setHistory((prev) =>
          prev.map((e) =>
            e.id.toString() === eventId.toString() ? { ...e, interested: true } : e
          )
        );
      } catch (error) {
        console.error("Error marking as interested:", error);
      }
    } else {
      // Update in localStorage
      setHistory((prev) => {
        const updated = prev.map((e) =>
          e.id.toString() === eventId.toString() ? { ...e, interested: true } : e
        );
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
      } catch (error) {
        console.error("Error clearing history:", error);
      }
    } else {
      // Clear localStorage
      setHistory([]);
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
