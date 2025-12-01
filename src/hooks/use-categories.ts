/**
 * Hook for fetching categories from Supabase.
 * Replaces hardcoded categories with dynamic data.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const DEFAULT_CATEGORIES = ["Todos", "Música", "Arte", "Teatro", "Danza", "Festivales", "Gastronomía"];

export function useCategories() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const { data, error: queryError } = await supabase
          .from('categories')
          .select('name')
          .order('name');

        if (queryError) throw queryError;

        if (data && data.length > 0) {
          const categoryNames = data.map(cat => cat.name);
          setCategories(["Todos", ...categoryNames]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch categories"));
        // Keep using default categories on error
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
