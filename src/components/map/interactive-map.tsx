"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EventIcon } from "@/components/ui/event-icon";
import type { Event } from "@/types/event";
import { useEffect, useState } from "react";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Icono para la ubicación del usuario
const userIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="position: relative; width: 24px; height: 24px;">
      <!-- Pulso animado -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        background: rgba(66, 133, 244, 0.3);
        border-radius: 50%;
        animation: pulse 2s ease-out infinite;
      "></div>
      <!-- Punto central -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 14px;
        height: 14px;
        background: #4285F4;
        border: 2.5px solid white;
        border-radius: 50%;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Componente para centrar el mapa en un evento (con protección)
function MapController({ selectedEventId, events, userLocation, recenterTrigger }: { 
  selectedEventId: string | null; 
  events: Event[];
  userLocation?: { lat: number; lng: number } | null;
  recenterTrigger?: number;
}) {
  const map = useMap();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Esperar a que el mapa esté listo
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Efecto para centrar en evento seleccionado
  useEffect(() => {
    if (!isReady || !map) return;
    
    try {
      if (selectedEventId) {
        const event = events.find(e => String(e.id) === selectedEventId);
        if (event?.latitude && event?.longitude) {
          map.flyTo([event.latitude, event.longitude], 15, { duration: 0.5 });
        }
      }
    } catch (error) {
      console.warn('Map flyTo error:', error);
    }
  }, [selectedEventId, events, map, isReady]);

  // Efecto separado para recentrar en ubicación del usuario
  useEffect(() => {
    if (!isReady || !map || !userLocation || recenterTrigger === undefined) return;
    
    try {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 0.5 });
    } catch (error) {
      console.warn('Map recenter error:', error);
    }
  }, [recenterTrigger, map, isReady, userLocation]);

  return null;
}

type InteractiveMapProps = {
  events: Event[];
  onEventClick?: (eventId: string) => void;
  selectedEventId?: string | null;
  userLocation?: { lat: number; lng: number } | null;
  recenterTrigger?: number;
};

export function InteractiveMap({ events, onEventClick, selectedEventId, userLocation, recenterTrigger }: InteractiveMapProps) {
  // Filter events with valid coordinates
  const eventsWithCoordinates = events.filter(
    (event) => event.latitude && event.longitude
  );

  // Calculate center point based on user location, events or use Lima as default
  const getMapCenter = (): [number, number] => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }
    
    if (eventsWithCoordinates.length === 0) {
      return [-12.0464, -77.0428]; // Lima, Peru center
    }

    const avgLat = eventsWithCoordinates.reduce(
      (sum, event) => sum + (event.latitude || 0), 0
    ) / eventsWithCoordinates.length;

    const avgLng = eventsWithCoordinates.reduce(
      (sum, event) => sum + (event.longitude || 0), 0
    ) / eventsWithCoordinates.length;

    return [avgLat, avgLng];
  };

  return (
    <MapContainer
      center={getMapCenter()}
      zoom={userLocation ? 14 : 12}
      className="h-full w-full rounded-lg z-0"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Controlador para centrar en evento seleccionado */}
      <MapController 
        selectedEventId={selectedEventId || null} 
        events={events} 
        userLocation={userLocation}
        recenterTrigger={recenterTrigger}
      />
      
      {/* Ubicación del usuario - punto azul simple */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
      )}
      
      {/* Marcadores de eventos */}
      {eventsWithCoordinates.map((event) => (
        <Marker
          key={event.id}
          position={[event.latitude!, event.longitude!]}
          icon={icon}
          eventHandlers={{
            click: () => {
              if (onEventClick) {
                onEventClick(String(event.id));
              }
            },
          }}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-start gap-2 mb-2">
                <div className="text-primary">
                  <EventIcon category={event.category || ''} className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm mb-1">{event.title}</h4>
                  <Badge variant="primary" className="text-xs">
                    {event.category}
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mb-2">
                <p className="flex items-center gap-1">
                  📍 {event.venue_name || event.district || 'Sin ubicación'}
                </p>
                <p className="font-semibold text-green-600">
                  {event.price_text || (event.is_free ? 'GRATIS' : `S/ ${event.price_min || 0}`)}
                </p>
              </div>
              <Link 
                href={`/eventos/${event.id}`}
                className="block w-full text-center text-xs bg-primary text-white py-1.5 px-3 rounded hover:bg-primary/90 transition-colors"
              >
                Ver detalles →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
