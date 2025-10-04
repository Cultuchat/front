"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EventIcon } from "@/components/ui/event-icon";
import type { Event } from "@/types/event";


const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type InteractiveMapProps = {
  events: Event[];
  onEventClick?: (eventId: string) => void;
};

export function InteractiveMap({ events, onEventClick }: InteractiveMapProps) {
  // Coordenadas ficticias para los eventos (centradas en Lima, Perú)
  const getEventCoordinates = (): [number, number] => {
    const baseLatLng: [number, number] = [-12.0464, -77.0428]; // Lima, Perú
    const offset = 0.03;
    return [
      baseLatLng[0] + (Math.random() - 0.5) * offset,
      baseLatLng[1] + (Math.random() - 0.5) * offset,
    ];
  };

  return (
    <MapContainer
      center={[-12.0464, -77.0428]}
      zoom={12}
      className="h-full w-full rounded-lg z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((event) => (
        <Marker
          key={event.id}
          position={getEventCoordinates()}
          icon={icon}
          eventHandlers={{
            click: () => {
              if (onEventClick) {
                onEventClick(event.id);
              }
            },
          }}
        >
          <Popup>
            <Link href={`/eventos/${event.id}`}>
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start gap-2 mb-2">
                  <div className="text-primary">
                    <EventIcon category={event.category} className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">{event.title}</h4>
                    <Badge variant="primary" className="text-xs">
                      {event.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </p>
                  <p className="font-semibold text-success">{event.price}</p>
                </div>
              </div>
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
