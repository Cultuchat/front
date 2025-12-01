"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { EventList } from "@/components/events/event-list";
import { HorizontalFilters } from "@/components/filters/horizontal-filters";
import { useEvents } from "@/hooks/use-events";
import { useSemanticSearch } from "@/hooks/use-semantic-search";
import { Event } from "@/types/event";

export default function EventosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [useSemanticMode, setUseSemanticMode] = useState<boolean>(false);

  // Normal search
  const { events, loading, error, total, fetchEvents } = useEvents({
    autoFetch: true,
  });

  // Semantic search
  const {
    search: semanticSearch,
    results: semanticResults,
    loading: semanticLoading,
    error: semanticError,
  } = useSemanticSearch();

  // Re-fetch when filters change (normal mode only)
  useEffect(() => {
    if (useSemanticMode) return; // Don't fetch in semantic mode

    // Skip if no filters are active
    if (!selectedCategory && !searchQuery && !selectedDate) return;

    const filters: { category?: string; search?: string } = {};
    if (selectedCategory) filters.category = selectedCategory;
    if (searchQuery) filters.search = searchQuery;
    if (selectedDate) {
      // Filter by date on the frontend for now
      // Backend can be enhanced to support date filtering
    }
    fetchEvents(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, selectedDate, useSemanticMode]);

  // Client-side filtering for price and date
  const displayEvents = useSemanticMode ? semanticResults : events;

  const filteredEvents = (displayEvents || []).filter((event) => {
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
    setUseSemanticMode(false);
    fetchEvents();
  };

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    setUseSemanticMode(true);
    await semanticSearch(searchQuery, {
      matchCount: 50,
      matchThreshold: 0.3,
      useHybrid: true,
      filterCategory: selectedCategory || undefined,
    });
  };

  const handleNormalSearch = () => {
    setUseSemanticMode(false);
    const filters: { category?: string; search?: string } = {};
    if (selectedCategory) filters.category = selectedCategory;
    if (searchQuery) filters.search = searchQuery;
    fetchEvents(filters);
  };

  const isLoading = useSemanticMode ? semanticLoading : loading;
  const currentError = useSemanticMode ? semanticError : error?.message;

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

        {/* Search Mode Toggle */}
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
            <button
              onClick={handleNormalSearch}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !useSemanticMode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🔍 Búsqueda Normal
            </button>
            <button
              onClick={handleSemanticSearch}
              disabled={!searchQuery.trim()}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                useSemanticMode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              🤖 Búsqueda Inteligente (IA)
            </button>
          </div>

          {useSemanticMode && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Usando búsqueda semántica con IA para entender el significado de tu consulta
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              {useSemanticMode ? "Buscando con IA..." : "Cargando eventos..."}
            </h3>
            <p className="text-muted-foreground">
              {useSemanticMode
                ? "Analizando tu consulta con inteligencia artificial"
                : "Obteniendo eventos culturales dinámicos de Lima"}
            </p>
          </Card>
        ) : currentError ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              Error al cargar eventos
            </h3>
            <p className="text-muted-foreground mb-6">
              {currentError}
            </p>
            <Button onClick={() => useSemanticMode ? handleSemanticSearch() : fetchEvents()}>
              Reintentar
            </Button>
          </Card>
        ) : filteredEvents.length > 0 ? (
          <>
            {useSemanticMode && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">Resultados de búsqueda inteligente</h4>
                    <p className="text-sm text-muted-foreground">
                      Encontramos {filteredEvents.length} eventos relacionados con "{searchQuery}" usando IA.
                      Los resultados están ordenados por relevancia semántica.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <EventList events={filteredEvents} />
          </>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2 text-foreground">
              No se encontraron eventos
            </h3>
            <p className="text-muted-foreground mb-6">
              {useSemanticMode
                ? `No encontramos eventos relacionados con "${searchQuery}". Intenta con otros términos.`
                : "Intenta ajustar los filtros para ver más resultados"}
            </p>
            <Button onClick={resetFilters}>Limpiar filtros</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
