"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { EventList } from "@/components/events/event-list";
import { HorizontalFilters } from "@/components/filters/horizontal-filters";
import { useEvents } from "@/hooks/use-events";

export default function EventosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const { events, loading, error, total, fetchEvents } = useEvents({
    autoFetch: true,
  });

  // Re-fetch when filters change
  useEffect(() => {
    // Skip if no filters are active
    if (!selectedCategory && !searchQuery && !selectedDate) return;

    const filters: { category?: string; search?: string } = {};
    if (selectedCategory) filters.category = selectedCategory;
    if (searchQuery) filters.search = searchQuery;
    fetchEvents(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, selectedDate]);

  // Client-side filtering for price and date
  const filteredEvents = (events || []).filter((event) => {
    // Price filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      const eventPrice = event.price_min || 0;
      if (minPrice !== undefined && eventPrice < minPrice) return false;
      if (maxPrice !== undefined && eventPrice > maxPrice) return false;
    }

    // Date filter
    if (selectedDate && event.event_date !== selectedDate) {
      return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSelectedCategory("");
    setSearchQuery("");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSelectedDate("");
    fetchEvents();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0">
        <PageTitle
          title="Todos los eventos"
          description="Explora nuestra colección completa de eventos culturales"
        />
      </div>

      <div className="flex-shrink-0">
        <HorizontalFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          minPrice={minPrice?.toString() || ''}
          maxPrice={maxPrice?.toString() || ''}
          onMinPriceChange={(val) => setMinPrice(val ? Number(val) : undefined)}
          onMaxPriceChange={(val) => setMaxPrice(val ? Number(val) : undefined)}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onResetFilters={resetFilters}
          totalEvents={total}
          filteredCount={filteredEvents.length}
        />

        {/* Contador de eventos */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <span className="text-sm text-muted-foreground">
            Mostrando {filteredEvents.length} de {events.length} eventos
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              Cargando eventos...
            </h3>
            <p className="text-muted-foreground">
              Obteniendo eventos culturales de Lima
            </p>
          </Card>
        ) : error ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              Error al cargar eventos
            </h3>
            <p className="text-muted-foreground mb-6">
              {error.message}
            </p>
            <Button onClick={() => fetchEvents()}>
              Reintentar
            </Button>
          </Card>
        ) : filteredEvents.length > 0 ? (
          <EventList events={filteredEvents} />
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              No se encontraron eventos
            </h3>
            <p className="text-muted-foreground mb-6">
              Intenta ajustar los filtros para ver más resultados
            </p>
            <Button onClick={resetFilters}>Limpiar filtros</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
