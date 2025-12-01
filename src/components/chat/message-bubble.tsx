import { memo } from "react";
import Link from "next/link";
import type { Message } from "@/types/chat";
import type { Event } from "@/types/event";
import { QuickActions } from "./quick-actions";
import { useFavorites } from "@/hooks/use-favorites";
import { EventIcon } from "@/components/ui/event-icon";

type MessageBubbleProps = {
  message: Message;
  onQuickAction?: (action: string) => void;
  onViewEventDetails?: (event: Event) => void;
};

export const MessageBubble = memo(function MessageBubble({
  message,
  onQuickAction,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { toggleFavorite, isFavorite } = useFavorites();

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 animate-fadeIn`}
    >
      <div className={`${isUser ? "max-w-[80%]" : "max-w-[85%]"}`}>
        <div
          className={`
            rounded-2xl px-4 py-3 shadow-sm
            ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-card text-card-foreground border border-border"
            }
          `}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {}
          {!isUser && message.events && message.events.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-border/50 pt-3">
              {message.events.map((event) => {
                const favorite = isFavorite(event.id);
                return (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/50 hover:bg-accent transition-colors group"
                  >
                    <div className="flex-shrink-0 text-muted-foreground">
                      <EventIcon category={event.category || ''} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {event.title}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">
                          {event.category || 'Evento'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {event.event_date ? new Date(event.event_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) : 'Por confirmar'}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {event.venue_name || event.district || event.city}
                        </span>
                        <span className="font-semibold text-success">
                          {event.is_free ? 'Gratis' : event.price_text || (event.price_min ? `S/ ${event.price_min}` : 'Consultar')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(event);
                        }}
                        className="p-1.5 rounded-full hover:bg-background/80 transition-colors"
                        title={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                      >
                        <svg
                          className={`w-4 h-4 ${favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
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
                      <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <time className="text-xs opacity-70 mt-2 block">
            {message.timestamp.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>

        {}
        {!isUser && message.quickActions && message.quickActions.length > 0 && (
          <QuickActions
            actions={message.quickActions}
            onActionClick={onQuickAction || (() => {})}
          />
        )}
      </div>
    </div>
  );
});
