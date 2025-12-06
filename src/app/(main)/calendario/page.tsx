"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Badge } from "@/components/ui/badge";
import { useEvents } from "@/hooks/use-events";
import Link from "next/link";
import { EventIcon } from "@/components/ui/event-icon";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Fetch dynamic events from the backend
  const { events } = useEvents({ autoFetch: true });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();


  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [year, month]);


  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();

    events.forEach((event) => {
      // Parse date from ISO format (YYYY-MM-DDTHH:mm:ss) or similar
      let dateKey = '';
      if (event.event_date) {
        try {
          const date = new Date(event.event_date);
          if (!isNaN(date.getTime())) {
            // Format as YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateKey = `${year}-${month}-${day}`;
          }
        } catch {
          // If parsing fails, try to use raw value
          dateKey = event.event_date.split('T')[0];
        }
      }
      if (dateKey && !map.has(dateKey)) {
        map.set(dateKey, []);
      }
      if (dateKey) {
        map.get(dateKey)!.push(event);
      }
    });

    return map;
  }, [events]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSameDay = (date1: Date, date2: Date | null) => {
    if (!date2) return false;
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const selectedEvents = selectedDate
    ? eventsByDate.get(formatDateKey(selectedDate)) || []
    : [];

  const formatSelectedDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("es-ES", options);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 mb-4">
        <PageTitle
          icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          title="Calendario de Eventos"
          description="Explora eventos culturales por fecha"
        />
      </div>

      {/* En móvil: scroll vertical. En desktop: layout horizontal */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 min-h-0 lg:h-full">
          {/* Calendario */}
          <div className="lg:flex-1 flex-shrink-0">
            <Card className="lg:h-full flex flex-col">
              {/* Header del calendario */}
              <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                <h2 className="text-xl font-bold text-foreground">
                  {MONTHS[month]} {year}
                </h2>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToPreviousMonth}
                    className="h-9 w-9 p-0 flex items-center justify-center text-lg"
                  >
                    ‹
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToToday}
                    className="h-9 px-4 font-medium"
                  >
                    Hoy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToNextMonth}
                    className="h-9 w-9 p-0 flex items-center justify-center text-lg"
                  >
                    ›
                  </Button>
                </div>
              </div>

              {/* Grid del calendario */}
              <div className="p-4 flex-1 flex flex-col">
                {/* Días de la semana */}
                <div className="grid grid-cols-7 mb-2 flex-shrink-0">
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Días del mes - altura fija en móvil, flexible en desktop */}
                <div className="grid grid-cols-7 grid-rows-6 gap-1 min-h-[280px] lg:flex-1">
                  {calendarDays.map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} />;
                    }

                    const dateKey = formatDateKey(date);
                    const dayEvents = eventsByDate.get(dateKey) || [];
                    const hasEvents = dayEvents.length > 0;
                    const today = isToday(date);
                    const selected = isSameDay(date, selectedDate);

                    return (
                      <button
                        key={dateKey}
                        onClick={() => handleDayClick(date)}
                        className={`
                          rounded-lg flex flex-col items-center justify-center relative transition-all
                          text-sm font-medium min-h-[40px]
                          ${today && !selected ? "bg-primary/10 text-primary font-bold" : ""}
                          ${selected ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted"}
                          ${!today && !selected ? "text-foreground" : ""}
                        `}
                      >
                        <span className={selected ? "font-bold" : ""}>{date.getDate()}</span>
                        {hasEvents && (
                          <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${selected ? "bg-primary-foreground" : "bg-primary"}`} />
                        )}
                      </button>
                    );
                  })}
                  {/* Rellenar celdas vacías para completar 6 filas (42 celdas) */}
                  {Array.from({ length: 42 - calendarDays.length }).map((_, index) => (
                    <div key={`padding-${index}`} />
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* Panel de eventos del día */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 pb-4 lg:pb-0">
            <Card className="lg:h-full flex flex-col">
              <div className="p-4 border-b border-border flex-shrink-0">
                <h3 className="font-bold text-foreground">Eventos del día</h3>
                {selectedDate && (
                  <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                    {formatSelectedDate(selectedDate)}
                  </p>
                )}
              </div>
              
              <div className="flex-1 p-4 lg:overflow-y-auto">
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Selecciona un día para ver sus eventos
                    </p>
                  </div>
                ) : selectedEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEvents
                      .sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''))
                      .map((event) => (
                      <Link key={event.id} href={`/eventos/${event.id}`} className="block">
                        <div className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                              <EventIcon category={event.category || ''} className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <h4 className="font-semibold text-sm line-clamp-2 text-foreground leading-snug">
                                {event.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="primary" className="text-xs px-2 py-0.5">
                                  {event.category}
                                </Badge>
                                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                  {event.is_free ? 'GRATIS' : (event.price_text || `S/ ${event.price_min || 0}${event.price_max ? ` a S/ ${event.price_max}` : ''}`)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="line-clamp-1">{event.venue_name || event.district || 'Sin ubicación'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No hay eventos programados
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
