"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/hooks/use-events";
import { EventIcon } from "@/components/ui/event-icon";
import Link from "next/link";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((mod) => mod.InteractiveMap),
  { ssr: false, loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-xl" /> }
);

// Calcular distancia entre dos puntos (en km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MapaPage() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const { events, loading } = useEvents({ autoFetch: true });

  useEffect(() => {
    setMounted(true);
    // Activar ubicación automáticamente al cargar
    requestLocation();
  }, []);

  // Solicitar ubicación
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalización no soportada");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("Ubicación denegada");
        }
        // No mostrar error para otros casos, simplemente no centrar
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Estado para forzar recentrado en el mapa
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Recentrar en mi ubicación
  const recenterToMyLocation = () => {
    if (userLocation) {
      setSelectedEvent(null);
      setRecenterTrigger(prev => prev + 1);
    } else {
      requestLocation();
    }
  };

  const eventsWithDistance = useMemo(() => {
    return events
      .filter(e => e.latitude && e.longitude)
      .map(event => ({
        ...event,
        distance: userLocation 
          ? calculateDistance(userLocation.lat, userLocation.lng, event.latitude!, event.longitude!)
          : undefined
      }))
      .sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return 0;
      });
  }, [events, userLocation]);

  const displayEvents = userLocation 
    ? eventsWithDistance.filter(e => e.distance !== undefined && e.distance <= 10)
    : eventsWithDistance;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header compacto */}
      <div className="flex-shrink-0 px-4 lg:px-6 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-foreground">
              Mapa de eventos
            </h1>
            <p className="text-xs text-muted-foreground">
              {userLocation 
                ? `${displayEvents.length} eventos cercanos` 
                : `${eventsWithDistance.length} eventos en Lima`}
            </p>
          </div>
          
          {/* Indicador de ubicación + botón recentrar */}
          <div className="flex items-center gap-2">
            {locationLoading && (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {locationError && (
              <span className="text-xs text-muted-foreground">📍 Sin ubicación</span>
            )}
            {userLocation && !locationLoading && (
              <button
                onClick={recenterToMyLocation}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                title="Volver a mi ubicación"
              >
                {/* Ícono de navegación/ubicación */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* Mapa - Ocupa 3/5 del espacio */}
        <div className="lg:col-span-3 h-[50vh] lg:h-full relative">
          {mounted && !loading ? (
            <InteractiveMap 
              events={events} 
              onEventClick={setSelectedEvent}
              selectedEventId={selectedEvent}
              userLocation={userLocation}
              recenterTrigger={recenterTrigger}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="text-5xl mb-3 animate-pulse">🗺️</div>
                <p className="text-muted-foreground text-sm">Cargando mapa...</p>
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral - Lista de eventos */}
        <div className="lg:col-span-2 overflow-hidden flex flex-col border-l border-border bg-card">
          {/* Header del panel */}
          <div className="flex-shrink-0 p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">
                {userLocation ? "Cerca de ti" : "Eventos"}
              </h2>
              {displayEvents.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {displayEvents.length}
                </Badge>
              )}
            </div>
            {userLocation && (
              <button 
                onClick={() => setUserLocation(null)}
                className="text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                Ver todos →
              </button>
            )}
          </div>

          {/* Lista scrolleable */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3 animate-pulse">⏳</div>
                <p className="text-muted-foreground text-sm">Cargando...</p>
              </div>
            ) : displayEvents.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="text-4xl mb-3">📍</div>
                <p className="text-muted-foreground text-sm">
                  {userLocation 
                    ? "No hay eventos cerca (10km)" 
                    : "No hay eventos con ubicación"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {displayEvents.map((event) => {
                  const isSelected = String(event.id) === selectedEvent;
                  
                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(String(event.id))}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 border-l-2 border-l-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      {/* Contenido del evento */}
                      <div className="flex gap-3">
                        {/* Icono */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-primary/20' : 'bg-muted'
                        }`}>
                          <EventIcon 
                            category={event.category || ''} 
                            className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} 
                          />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {/* Título */}
                          <h3 className="font-medium text-sm text-foreground line-clamp-1 mb-1">
                            {event.title}
                          </h3>
                          
                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="primary" className="text-xs">
                              {event.category}
                            </Badge>
                            <span className="text-xs font-semibold text-success">
                              {event.is_free ? 'GRATIS' : event.price_text || `S/${event.price_min || 0}`}
                            </span>
                            {event.distance !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {event.distance < 1 
                                  ? `${Math.round(event.distance * 1000)}m` 
                                  : `${event.distance.toFixed(1)}km`}
                              </span>
                            )}
                          </div>
                          
                          {/* Ubicación */}
                          <p className="text-xs text-muted-foreground mt-1.5 truncate">
                            📍 {event.venue_name || event.district || 'Sin ubicación'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Link a detalles */}
                      {isSelected && (
                        <Link 
                          href={`/eventos/${event.id}`}
                          className="mt-3 flex items-center justify-center gap-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-lg py-2 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver detalles completos
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
