"use client";

import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/use-categories";

type EventFiltersProps = {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (price: string) => void;
  onMaxPriceChange: (price: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export const EventFilters = memo(function EventFilters({
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  selectedDate,
  onDateChange,
}: EventFiltersProps) {
  const { categories } = useCategories();

  return (
    <div className="space-y-6">
      {}
      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">
          Buscar eventos
        </label>
        <Input
          placeholder="Nombre del evento..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      </div>

      {}
      <div>
        <label className="block text-sm font-semibold mb-3 text-foreground">
          Categoría
        </label>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className="transition-smooth"
            >
              <Badge
                variant={
                  selectedCategory === category ? "primary" : "secondary"
                }
              >
                {category}
              </Badge>
            </button>
          ))}
        </div>
      </div>

      {}
      <div>
        <label className="block text-sm font-semibold mb-2 text-foreground">
          Fecha
        </label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          icon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
        />
      </div>

      {}
      <div>
        <label className="block text-sm font-semibold mb-3 text-foreground">
          Rango de precio
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            placeholder="Mín"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            label="Mínimo"
          />
          <Input
            type="number"
            placeholder="Máx"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            label="Máximo"
          />
        </div>
      </div>
    </div>
  );
});
