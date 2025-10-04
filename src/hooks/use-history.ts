"use client";

import { useState, useCallback, useEffect } from "react";
import type { Event } from "@/types/event";

const STORAGE_KEY = "cultuchat_history";

export type HistoryEvent = Event & {
  visitedAt: Date;
  interested: boolean;
};

export function useHistory() {
  const [history, setHistory] = useState<HistoryEvent[]>([]);

  useEffect(() => {
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
        console.error("Error loading history:", error);
      }
    }
  }, []);

  const addToHistory = useCallback((event: Event, interested: boolean = false) => {
    setHistory((prev) => {
      const filtered = prev.filter((e) => e.id !== event.id);
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
  }, []);

  const markAsInterested = useCallback((eventId: string) => {
    setHistory((prev) => {
      const updated = prev.map((e) =>
        e.id === eventId ? { ...e, interested: true } : e
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    history,
    addToHistory,
    markAsInterested,
    clearHistory,
  };
}
