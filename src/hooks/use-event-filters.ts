"use client";

import { useState, useMemo, useCallback } from "react";
import type { Event } from "@/types/event";

export function useEventFilters(events: Event[]) {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      
      if (
        selectedCategory !== "Todos" &&
        event.category !== selectedCategory
      ) {
        return false;
      }

      
      if (
        searchQuery &&
        !event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(event.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      
      if (selectedDate && event.date !== selectedDate) {
        return false;
      }

      
      const eventPrice = parseFloat((event.price || '0').replace(/[^0-9.]/g, ""));
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;

      if (!isNaN(eventPrice)) {
        if (eventPrice < min || eventPrice > max) {
          return false;
        }
      }

      return true;
    });
  }, [events, selectedCategory, searchQuery, selectedDate, minPrice, maxPrice]);

  const resetFilters = useCallback(() => {
    setSelectedCategory("Todos");
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedDate("");
  }, []);

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    selectedDate,
    setSelectedDate,
    filteredEvents,
    resetFilters,
  };
}
