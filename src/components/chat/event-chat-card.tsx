"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import type { Event } from "@/types/event";

interface EventChatCardProps {
  event: Event;
  onViewDetails?: (event: Event) => void;
}

export function EventChatCard({ event, onViewDetails }: EventChatCardProps) {
  const router = useRouter();
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(event.id);

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(event);
    }
    router.push(`/eventos/${event.id}`);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Fecha por confirmar";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  // Format location for display
  const location = event.venue_name
    ? `${event.venue_name}, ${event.district || event.city}`
    : event.district || event.city;

  // Format price for display
  const price = event.is_free
    ? "Gratis"
    : event.price_text || (event.price_min ? `Desde S/ ${event.price_min}` : "Precio por confirmar");

  return (
    <Card className="hover:shadow-lg transition-all h-full">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {event.image_url && (
              <Image
                src={event.image_url}
                alt={event.title}
                width={40}
                height={40}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
                unoptimized
              />
            )}
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 flex-1">
              {event.title}
            </h3>
          </div>
          <Badge variant="primary" className="text-xs flex-shrink-0">
            {event.category || "Evento"}
          </Badge>
        </div>

        {/* Event details */}
        <div className="space-y-2 text-xs text-muted-foreground mb-4 flex-1">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDate(event.event_date)}</span>
          </div>
          {event.event_time && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{event.event_time}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-foreground">{price}</span>
          </div>
        </div>

        {}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            size="sm"
            variant="primary"
            className="flex-1 h-9 text-xs font-medium"
            onClick={handleViewDetails}
          >
            Ver detalles
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`h-9 px-3 ${favorite ? "border-red-500 text-red-500 hover:bg-red-50" : ""}`}
            onClick={() => toggleFavorite(event)}
            title={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <svg
              className="w-5 h-5"
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
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
