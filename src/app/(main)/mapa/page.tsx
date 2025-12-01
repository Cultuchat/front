"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/ui/page-title";
import { useEvents } from "@/hooks/use-events";
import { EventIcon } from "@/components/ui/event-icon";
import Link from "next/link";
import dynamic from "next/dynamic";


const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((mod) => mod.InteractiveMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-lg" /> }
);

export default function MapaPage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch dynamic events from the backend
  const { events, loading } = useEvents({ autoFetch: true });

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedEventData = useMemo(
    () => events.find((e) => e.id.toString() === selectedEvent),
    [selectedEvent, events]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0">
        <PageTitle
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          }
          title="Mapa de eventos"
          description={`${events.length} eventos en Lima`}
        />
      </div>

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardContent className="flex-1 p-0 overflow-hidden">
              {mounted && !loading && <InteractiveMap events={events} onEventClick={setSelectedEvent} />}
              {loading && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <p className="text-muted-foreground">Cargando eventos...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {}
        <div className="lg:col-span-1 overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg">
                {selectedEventData ? "Evento seleccionado" : "Eventos cercanos"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {selectedEventData ? (
                <div className="space-y-4">
                  <Link href={`/eventos/${selectedEventData.id}`}>
                    <Card hoverable className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-3 rounded-xl bg-primary/10 text-primary">
                            <EventIcon category={selectedEventData.category || ''} className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <Badge variant="primary" className="text-xs mb-2">
                              {selectedEventData.category || 'Evento'}
                            </Badge>
                            <h3 className="font-bold text-base mb-1">{selectedEventData.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {selectedEventData.description}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {selectedEventData.event_date && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(selectedEventData.event_date).toLocaleDateString('es-PE')}
                            </div>
                          )}
                          {selectedEventData.event_time && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {selectedEventData.event_time}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {selectedEventData.venue_name || selectedEventData.district || 'Sin ubicación'}
                          </div>
                          <div className="font-semibold text-success">
                            {selectedEventData.price_text || (selectedEventData.is_free ? 'Gratis' : `S/ ${selectedEventData.price_min || 0}`)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver todos los eventos
                  </button>
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-muted-foreground">Cargando eventos...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(String(event.id))}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-muted-foreground">
                          <EventIcon category={event.category || ''} className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1 truncate">{event.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="primary" className="text-xs">
                              {event.category}
                            </Badge>
                            <span className="text-xs font-semibold text-success">
                              {event.price_text || (event.is_free ? 'Gratis' : `S/ ${event.price_min || 0}`)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground truncate block">
                            📍 {event.venue_name || event.district || 'Sin ubicación'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
