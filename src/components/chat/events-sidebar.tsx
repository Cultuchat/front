"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/types/event";

interface EventsSidebarProps {
  events: Event[];
}

export function EventsSidebar({ events }: EventsSidebarProps) {
  if (events.length === 0) return null;

  return (
    <div className="w-80 flex-shrink-0 border-l border-border bg-card p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Eventos mencionados ({events.length})
      </h3>

      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="flex gap-2 mb-2">
              <div className="text-2xl">{event.image}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-foreground truncate mb-1">
                  {event.title}
                </h4>
                <Badge variant="primary" className="text-xs">
                  {event.category}
                </Badge>
              </div>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{event.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{event.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-foreground">{event.price}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
