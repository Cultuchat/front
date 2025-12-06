"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/types/event";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_KEY = "cultuchat_favorites";

// Cache global para favoritos - persiste entre renders
let globalFavoritesCache: Event[] | null = null;
let globalFavoriteIdsCache: Set<string> | null = null;

interface FavoritesContextType {
  favorites: Event[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  addFavorite: (event: Event) => Promise<void>;
  removeFavorite: (eventId: string | number) => Promise<void>;
  isFavorite: (eventId: string | number) => boolean;
  toggleFavorite: (event: Event) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Event[]>(globalFavoritesCache || []);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(globalFavoriteIdsCache || new Set());
  // Solo mostrar loading si no hay cache
  const [isLoading, setIsLoading] = useState(globalFavoritesCache === null);
  const hasInitialized = useRef(globalFavoritesCache !== null);
  const isFetching = useRef(false);

  /**
   * Load favorites from localStorage (fallback)
   */
  const loadFromLocalStorage = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Event[];
        setFavorites(parsed);
        setFavoriteIds(new Set(parsed.map(e => e.id.toString())));
        // Actualizar cache global
        globalFavoritesCache = parsed;
        globalFavoriteIdsCache = new Set(parsed.map(e => e.id.toString()));
      } catch (error) {
        console.error("Error parsing localStorage favorites:", error);
      }
    }
    hasInitialized.current = true;
    setIsLoading(false);
  }, []);

  /**
   * Load favorites from Supabase or localStorage
   */
  const loadFavorites = useCallback(async () => {
    // Evitar múltiples fetches simultáneos
    if (isFetching.current) return;
    isFetching.current = true;

    // Solo mostrar loading si no tenemos datos
    if (favorites.length === 0) {
      setIsLoading(true);
    }

    try {
      if (isAuthenticated && user) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('user_favorites')
          .select(`
            id,
            event_id,
            notes,
            created_at,
            events (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error loading favorites from Supabase:", error);
          loadFromLocalStorage();
        } else if (data) {
          type FavoriteRow = {
            id: number;
            event_id: number | string;
            notes?: string;
            created_at: string;
            events?: Event;
          };
          const typedData = data as unknown as FavoriteRow[];
          const events = typedData
            .filter((fav) => fav.events)
            .map((fav) => fav.events as Event);
          const ids = new Set(typedData.map((fav) => fav.event_id.toString()));
          
          setFavorites(events);
          setFavoriteIds(ids);
          
          // Actualizar cache global
          globalFavoritesCache = events;
          globalFavoriteIdsCache = ids;

          // Migrate localStorage favorites to Supabase
          await migrateLocalStorageToSupabase();
        }
      } else {
        loadFromLocalStorage();
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
      loadFromLocalStorage();
    } finally {
      hasInitialized.current = true;
      setIsLoading(false);
      isFetching.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated, loadFromLocalStorage, favorites.length]);

  /**
   * Migrate localStorage favorites to Supabase
   */
  const migrateLocalStorageToSupabase = async () => {
    if (!isAuthenticated || !user) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const localFavorites = JSON.parse(stored) as Event[];
      if (localFavorites.length === 0) return;

      for (const event of localFavorites) {
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            event_id: event.id
          })
          .select()
          .single();
      }

      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error migrating favorites:", error);
    }
  };

  // Load favorites on mount and when user changes
  useEffect(() => {
    // Solo cargar si no hemos inicializado o si el usuario cambió
    if (!hasInitialized.current || (user && globalFavoritesCache === null)) {
      loadFavorites();
    }
  }, [loadFavorites, user]);

  /**
   * Add event to favorites
   */
  const addFavorite = useCallback(async (event: Event) => {
    // Optimistic update - update UI immediately
    setFavorites((prev) => {
      const updated = [event, ...prev];
      globalFavoritesCache = updated;
      return updated;
    });
    setFavoriteIds((prev) => {
      const updated = new Set(prev).add(event.id.toString());
      globalFavoriteIdsCache = updated;
      return updated;
    });

    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            event_id: event.id
          })
          .select()
          .single();

        if (error) {
          console.error("Error adding favorite:", error);
          // Revert on error
          setFavorites((prev) => prev.filter((e) => e.id.toString() !== event.id.toString()));
          setFavoriteIds((prev) => {
            const updated = new Set(prev);
            updated.delete(event.id.toString());
            return updated;
          });
        }
      } catch (error) {
        console.error("Error adding favorite:", error);
      }
    } else {
      // Save to localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      const current = stored ? JSON.parse(stored) : [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([event, ...current]));
    }
  }, [user, isAuthenticated]);

  /**
   * Remove event from favorites
   */
  const removeFavorite = useCallback(async (eventId: string | number) => {
    const id = eventId.toString();

    // Optimistic update - update UI immediately
    const previousFavorites = favorites;
    const previousIds = favoriteIds;
    
    setFavorites((prev) => {
      const updated = prev.filter((e) => e.id.toString() !== id);
      globalFavoritesCache = updated;
      return updated;
    });
    setFavoriteIds((prev) => {
      const updated = new Set(prev);
      updated.delete(id);
      globalFavoriteIdsCache = updated;
      return updated;
    });

    if (isAuthenticated && user) {
      try {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) {
          console.error("Error removing favorite:", error);
          // Revert on error
          setFavorites(previousFavorites);
          setFavoriteIds(previousIds);
        }
      } catch (error) {
        console.error("Error removing favorite:", error);
        // Revert on error
        setFavorites(previousFavorites);
        setFavoriteIds(previousIds);
      }
    } else {
      // Update localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const current = JSON.parse(stored) as Event[];
        const updated = current.filter((e) => e.id.toString() !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    }
  }, [user, isAuthenticated, favorites, favoriteIds]);

  /**
   * Check if event is favorited
   */
  const isFavorite = useCallback(
    (eventId: string | number) => {
      return favoriteIds.has(eventId.toString());
    },
    [favoriteIds]
  );

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(
    async (event: Event) => {
      if (isFavorite(event.id)) {
        await removeFavorite(event.id);
      } else {
        await addFavorite(event);
      }
    },
    [isFavorite, removeFavorite, addFavorite]
  );

  /**
   * Refresh favorites from server
   */
  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoriteIds,
        isLoading,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
