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
            <div className="mt-4 space-y-3 border-t border-border/30 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {message.events.length} {message.events.length === 1 ? 'Evento' : 'Eventos'}
                </span>
              </div>
              {message.events.map((event) => {
                const favorite = isFavorite(event.id);
                return (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.id}`}
                    className="block p-3 rounded-xl bg-gradient-to-br from-accent/40 to-accent/20 hover:from-accent/60 hover:to-accent/30 border border-border/50 hover:border-primary/30 transition-all duration-200 group shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <EventIcon category={event.category || ''} className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="text-sm font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {event.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(event);
                            }}
                            className="flex-shrink-0 p-1 rounded-full hover:bg-background/80 transition-all hover:scale-110"
                            title={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}
                          >
                            <svg
                              className={`w-4 h-4 transition-all ${favorite ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground hover:text-red-400"}`}
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
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {event.category || 'Evento'}
                          </span>
                          {event.is_free && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 font-semibold">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Gratis
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">
                              {event.event_date ? new Date(event.event_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Por confirmar'}
                            </span>
                          </div>
                          {!event.is_free && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="truncate font-medium">
                                {event.price_text || (event.price_min ? `S/ ${event.price_min}` : 'Consultar')}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-muted-foreground col-span-2">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">
                              {event.venue_name || event.district || event.city || 'Ubicación por confirmar'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
