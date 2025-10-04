"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { EventList } from "@/components/events/event-list";
import { HorizontalFilters } from "@/components/filters/horizontal-filters";
import { MOCK_EVENTS } from "@/constants/mock-events";
import { useEventFilters } from "@/hooks/use-event-filters";

export default function EventosPage() {
  const {
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
  } = useEventFilters(MOCK_EVENTS);

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
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onResetFilters={resetFilters}
          totalEvents={MOCK_EVENTS.length}
          filteredCount={filteredEvents.length}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredEvents.length > 0 ? (
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
