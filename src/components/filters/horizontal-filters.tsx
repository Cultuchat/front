"use client";

import { memo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RangeSlider } from "@/components/ui/range-slider";

type HorizontalFiltersProps = {
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
  onResetFilters: () => void;
  totalEvents: number;
  filteredCount: number;
};

const CATEGORIES = [
  "Todos",
  "Música",
  "Arte",
  "Teatro",
  "Danza",
  "Festivales",
  "Gastronomía",
];

export const HorizontalFilters = memo(function HorizontalFilters({
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
  onResetFilters,
  totalEvents,
  filteredCount,
}: HorizontalFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
      {}
      <div className="flex flex-wrap items-center gap-3">
        {}
        <div className="flex-1 min-w-[200px] max-w-[400px]">
          <Input
            placeholder="Buscar eventos..."
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
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className="transition-smooth"
            >
              <Badge
                variant={selectedCategory === category ? "primary" : "secondary"}
              >
                {category}
              </Badge>
            </button>
          ))}
        </div>

        {}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="ml-auto"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          {showAdvanced ? "Ocultar filtros" : "Más filtros"}
        </Button>

        {}
        <Button
          variant="ghost"
          size="sm"
          onClick={onResetFilters}
          className="text-primary hover:text-primary-foreground"
        >
          Limpiar
        </Button>
      </div>

      {}
      {showAdvanced && (
        <div className="flex flex-wrap items-end gap-4 pt-4 border-t border-border animate-fadeIn">
          {}
          <div className="flex-1 min-w-[180px] max-w-[240px]">
            <label className="block text-sm font-medium mb-2 text-foreground">
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
          <div className="flex-1 min-w-[280px] max-w-[360px]">
            <label className="block text-sm font-medium mb-2 text-foreground">
              Rango de precio
            </label>
            <RangeSlider
              min={0}
              max={200}
              step={5}
              value={[
                minPrice ? Number(minPrice) : 0,
                maxPrice ? Number(maxPrice) : 200,
              ]}
              onChange={([min, max]) => {
                onMinPriceChange(min.toString());
                onMaxPriceChange(max.toString());
              }}
              formatLabel={(v) => (v === 200 ? "$200+" : `$${v}`)}
            />
          </div>
        </div>
      )}

      {}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredCount} de {totalEvents} eventos
      </div>
    </div>
  );
});
