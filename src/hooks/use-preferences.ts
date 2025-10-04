"use client";

import { useState, useEffect, useCallback } from "react";

const PREFERENCES_KEY = "cultuchat_preferences";

export type CategoryPreference =
  | "Música"
  | "Arte"
  | "Teatro"
  | "Danza"
  | "Festivales"
  | "Gastronomía";

export interface UserPreferences {
  categories: CategoryPreference[];
  notifications: boolean;
  notifyNewEvents: boolean;
  notifyPriceChanges: boolean;
  notifyNearbyEvents: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  categories: [],
  notifications: false,
  notifyNewEvents: false,
  notifyPriceChanges: false,
  notifyNearbyEvents: false,
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences(parsed);
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    }
    setIsLoading(false);
  }, []);

  
  const savePreferences = useCallback((newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(newPreferences));
  }, []);

  
  const toggleCategory = useCallback((category: CategoryPreference) => {
    setPreferences((prev) => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];

      const updated = { ...prev, categories: newCategories };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  
  const updateNotifications = useCallback((settings: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  
  const hasInterests = preferences.categories.length > 0;

  return {
    preferences,
    isLoading,
    hasInterests,
    savePreferences,
    toggleCategory,
    updateNotifications,
  };
}
