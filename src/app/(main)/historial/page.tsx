"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTitle } from "@/components/ui/page-title";
import { StatCard } from "@/components/ui/stat-card";
import { useHistory } from "@/hooks/use-history";
import { EventIcon } from "@/components/ui/event-icon";

export default function HistorialPage() {
  const { history, clearHistory } = useHistory();

  const stats = useMemo(() => {
    const interested = history.filter((e) => e.interested).length;
    const thisMonth = history.filter((e) => {
      const date = new Date(e.visitedAt);
      const now = new Date();
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;
    const categories = new Set(history.map((e) => e.category)).size;

    return { interested, thisMonth, categories };
  }, [history]);

  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: typeof history } = {};

    history.forEach((event) => {
      const date = new Date(event.visitedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label: string;
      if (date.toDateString() === today.toDateString()) {
        label = "Hoy";
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = "Ayer";
      } else {
        label = date.toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(event);
    });

    return groups;
  }, [history]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0">
        <PageTitle
          icon={
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          title="Historial"
          description={
            history.length > 0
              ? `${history.length} ${history.length === 1 ? 'evento visitado' : 'eventos visitados'}`
              : "Eventos que has visitado recientemente"
          }
        />

        {}
        {history.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <StatCard
              value={stats.thisMonth}
              label="Este mes"
              color="primary"
            />
            <StatCard
              value={stats.interested}
              label="Interesados"
              color="success"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {}
        {history.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Actividad reciente
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={clearHistory}
                className="text-error hover:bg-error/10"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Limpiar
              </Button>
            </div>

            {}
            <div className="space-y-8">
              {Object.entries(groupedByDate).map(([date, events]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-lg font-semibold text-foreground capitalize">
                      {date}
                    </h3>
                    <Badge variant="secondary">{events.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event) => (
                      <Link key={event.id} href={`/eventos/${event.id}`}>
                        <Card hoverable className="relative cursor-pointer group">
                          {event.interested && (
                            <div className="absolute top-3 right-3 z-10">
                              <Badge variant="success" className="text-xs">⭐ Interesado</Badge>
                            </div>
                          )}
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                                <EventIcon category={event.category} className="w-6 h-6" />
                              </div>
                              <Badge variant="primary" className="text-xs">{event.category}</Badge>
                            </div>
                            <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">{event.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Hace {getTimeAgo(new Date(event.visitedAt))}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="p-12 text-center max-w-md">
              <div className="mb-4 flex justify-center">
                <svg className="w-16 h-16 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                Sin historial
              </h3>
              <p className="text-muted-foreground mb-6">
                Los eventos que visites aparecerán aquí para que puedas revisarlos después
              </p>
              <Button size="lg">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Explorar eventos
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "unos segundos";
  if (minutes < 60) return `${minutes} minuto${minutes > 1 ? "s" : ""}`;
  if (hours < 24) return `${hours} hora${hours > 1 ? "s" : ""}`;
  return `${days} día${days > 1 ? "s" : ""}`;
}
