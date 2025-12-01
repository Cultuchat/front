"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { useFavorites } from "@/hooks/use-favorites";
import { getEvent } from "@/lib/api";
import { EventIcon } from "@/components/ui/event-icon";
import type { Event } from "@/types/event";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { toggleFavorite, isFavorite } = useFavorites();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAttending, setIsAttending] = useState(false);

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Fecha por confirmar';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Fetch event data from backend
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await getEvent(parseInt(eventId));
        if (response) {
          setEvent(response);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch event"));
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-6xl mb-4">⏳</div>
        <h3 className="text-xl font-bold mb-2">Cargando evento...</h3>
        <p className="text-muted-foreground">Obteniendo información del evento</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <PageTitle title="Evento no encontrado" description="El evento que buscas no existe" />
        <Button onClick={() => router.push("/eventos")} className="mt-4">
          Volver a eventos
        </Button>
      </div>
    );
  }

  const favorite = isFavorite(event.id.toString());

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </Button>
      </div>

      <Card>
        <CardContent className="p-8">
          {}
          <div className="flex items-start gap-6 mb-6">
            <div className="p-6 rounded-2xl bg-primary/10 text-primary">
              <EventIcon category={event.category || ''} className="w-16 h-16" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <Badge variant="primary" className="mb-3">
                    {event.category}
                  </Badge>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{event.title}</h1>
                  <p className="text-muted-foreground text-lg">{event.description}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(event)}
                  className={`p-3 rounded-full hover:bg-accent transition-colors ${
                    favorite ? "text-red-500 bg-red-50" : "text-muted-foreground"
                  }`}
                  title={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <svg
                    className="w-8 h-8"
                    fill={favorite ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Fecha</p>
                <p className="text-sm font-semibold">{formatDate(event.event_date)}</p>
                {event.event_time && (
                  <p className="text-xs text-muted-foreground">{event.event_time}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Ubicación</p>
                <p className="text-sm font-semibold">{event.venue_name || event.district || 'Sin ubicación'}</p>
                {event.venue_address && (
                  <p className="text-xs text-muted-foreground">{event.venue_address}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Precio</p>
                <p className="text-sm font-semibold text-success">{event.price_text || (event.is_free ? 'Gratis' : `S/ ${event.price_min || 0}`)}</p>
              </div>
            </div>
          </div>

          {/* Descripción del evento */}
          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold mb-4">Acerca del evento</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">{event.description}</p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-border">
            <Button 
              variant={isAttending ? "primary" : "outline"}
              className="flex-1"
              onClick={() => setIsAttending(!isAttending)}
            >
              {isAttending ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ¡Asistiré!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Asistiré
                </>
              )}
            </Button>
            {event.source_url && (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.open(event.source_url, '_blank')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver en {event.source_name || 'sitio oficial'}
              </Button>
            )}
            <Button variant="ghost" className="px-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
