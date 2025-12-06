"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/use-favorites";
import type { Event } from "@/types/event";
import { EventIcon } from "@/components/ui/event-icon";

type EventCardProps = {
  event: Event;
};

export const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(event.id);

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Fecha por confirmar';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-PE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getPrice = () => {
    if (event.is_free || event.price_min === 0) return 'GRATIS';
    if (event.price_text) return event.price_text;
    if (event.price_min) {
      return event.price_max && event.price_max !== event.price_min 
        ? `S/ ${event.price_min} - S/ ${event.price_max}`
        : `S/ ${event.price_min}`;
    }
    return event.price || 'GRATIS';
  };

  const handleCardClick = () => {
    router.push(`/eventos/${event.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all duration-200"
    >
      {/* Header: Icono + Badge + Favorito */}
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
          <EventIcon category={event.category || ''} className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-xs">{event.category}</Badge>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(event);
            }}
            className={`
              p-1.5 rounded-full transition-all duration-200
              ${favorite
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
              }
            `}
            title={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <svg
              className="w-5 h-5"
              fill={favorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Título */}
      <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {event.title}
      </h3>

      {/* Descripción corta */}
      {(event.short_description || event.description) && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {event.short_description || event.description}
        </p>
      )}

      {/* Info: Fecha, Ubicación, Precio */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDate(event.date || event.event_date || '')}</span>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-1">{event.location || event.venue_name || event.district || 'Sin ubicación'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className={`font-medium ${getPrice() === 'GRATIS' ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
            {getPrice()}
          </span>
        </div>
      </div>
    </div>
  );
});
