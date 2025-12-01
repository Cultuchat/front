"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
      <div className="flex-shrink-0">
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

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6">
        {}
        <div className="flex-1 min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-xl md:text-2xl">
                  {MONTHS[month]} {year}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Hoy
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextMonth}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs sm:text-sm font-semibold text-muted-foreground py-1 sm:py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dateKey = formatDateKey(date);
                  const events = eventsByDate.get(dateKey) || [];
                  const hasEvents = events.length > 0;
                  const today = isToday(date);
                  const selected = isSameDay(date, selectedDate);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => handleDayClick(date)}
                      className={`
                        aspect-square border rounded-lg p-1 sm:p-2 transition-all relative text-xs sm:text-sm
                        ${today ? "border-primary bg-primary/5 font-bold" : "border-border"}
                        ${selected ? "ring-2 ring-primary bg-primary/10" : ""}
                        ${hasEvents ? "hover:shadow-md cursor-pointer hover:border-primary" : ""}
                      `}
                    >
                      <div>
                        {date.getDate()}
                      </div>
                      {hasEvents && (
                        <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {}
              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-primary bg-primary/5" />
                  <span>Hoy</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded ring-2 ring-primary bg-primary/10" />
                  <span>Seleccionado</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary" />
                  <span>Con eventos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {}
        <div className="w-full lg:w-96 flex-shrink-0 min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg">
                {selectedDate ? (
                  <>
                    Eventos del día
                    <p className="text-sm font-normal text-muted-foreground mt-1 capitalize">
                      {formatSelectedDate(selectedDate)}
                    </p>
                  </>
                ) : (
                  "Selecciona un día"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {!selectedDate ? (
                <div className="text-center py-8">
                  <div className="mb-3 flex justify-center">
                    <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Haz clic en un día del calendario para ver sus eventos
                  </p>
                </div>
              ) : selectedEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedEvents
                    .sort((a, b) => (a.event_time || '').localeCompare(b.event_time || ''))
                    .map((event) => (
                    <Link key={event.id} href={`/eventos/${event.id}`}>
                      <div className="relative pl-8 pb-4 group">
                        {/* Timeline line */}
                        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border group-last:hidden"></div>

                        {/* Time dot */}
                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary border-2 border-background shadow-sm"></div>

                        {/* Time label */}
                        <div className="text-xs font-semibold text-primary mb-2">{event.event_time}</div>

                        {/* Event card */}
                        <Card hoverable className="transition-all">
                          <CardContent className="p-3">
                            <div className="flex gap-3">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                                <EventIcon category={event.category || ''} className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                  {event.title}
                                </h4>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant="primary" className="text-xs">
                                    {event.category}
                                  </Badge>
                                  <span className="text-xs font-semibold text-success">
                                    {event.price_text || (event.is_free ? 'Gratis' : `S/ ${event.price_min || 0}`)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  <span className="line-clamp-1">{event.venue_name || event.district || 'Sin ubicación'}</span>
                                </div>
                                {event.event_time && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>{event.event_time}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-3 flex justify-center">
                    <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No hay eventos para este día
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
