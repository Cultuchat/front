"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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

  const handleCardClick = () => {
    router.push(`/eventos/${event.id}`);
  };

  return (
    <Card
      hoverable
      className={`h-full flex flex-col cursor-pointer group relative ${
        event.registered
          ? "border-2 border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/10"
          : ""
      }`}
      onClick={handleCardClick}
    >
      {event.registered && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-3 py-1 rounded-bl-lg rounded-tr-lg text-xs font-semibold flex items-center gap-1 shadow-md">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Inscrito
          </div>
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between mb-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <EventIcon category={event.category} className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-2">
            {!event.registered && <Badge variant="primary">{event.category}</Badge>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(event);
              }}
              className={`
                p-2 rounded-full transition-all duration-300
                ${favorite
                  ? "bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 shadow-sm"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }
              `}
              title={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${favorite ? "scale-110" : ""}`}
                fill={favorite ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
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
        <CardTitle className="group-hover:text-primary transition-colors">{event.title}</CardTitle>
        <CardDescription>{event.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-1">
        <EventDetail
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          text={event.date}
        />
        <EventDetail
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          text={event.time}
        />
        <EventDetail
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          text={event.location}
        />
        <EventDetail
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          text={event.price}
          className="font-semibold text-success"
        />
        {event.duration && (
          <EventDetail
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            text={event.duration}
          />
        )}
      </CardContent>
    </Card>
  );
});

type EventDetailProps = {
  icon: React.ReactNode;
  text: string;
  className?: string;
};

const EventDetail = memo(function EventDetail({ icon, text, className = "" }: EventDetailProps) {
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      {icon}
      {text}
    </div>
  );
});
