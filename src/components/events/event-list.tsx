import { memo } from "react";
import { EventCard } from "./event-card";
import type { Event } from "@/types/event";

type EventListProps = {
  events: Event[];
};

export const EventList = memo(function EventList({ events }: EventListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
});
