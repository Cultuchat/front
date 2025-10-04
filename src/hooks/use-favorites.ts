"use client";

import { useState, useCallback, useEffect } from "react";
import type { Event } from "@/types/event";

const STORAGE_KEY = "cultuchat_favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<Event[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    }
  }, []);

  const addFavorite = useCallback((event: Event) => {
    setFavorites((prev) => {
      const updated = [...prev, event];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeFavorite = useCallback((eventId: string) => {
    setFavorites((prev) => {
      const updated = prev.filter((e) => e.id !== eventId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (eventId: string) => {
      return favorites.some((e) => e.id === eventId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    (event: Event) => {
      if (isFavorite(event.id)) {
        removeFavorite(event.id);
      } else {
        addFavorite(event);
      }
    },
    [isFavorite, removeFavorite, addFavorite]
  );

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}
