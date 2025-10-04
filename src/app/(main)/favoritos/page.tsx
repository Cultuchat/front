"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { EventList } from "@/components/events/event-list";
import { useFavorites } from "@/hooks/use-favorites";
import Link from "next/link";

export default function FavoritosPage() {
  const { favorites } = useFavorites();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0">
        <PageTitle
          icon={
            <svg
              className="w-full h-full text-primary"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          title="Tus favoritos"
          description={
            favorites.length > 0
              ? `${favorites.length} ${favorites.length === 1 ? 'evento guardado' : 'eventos guardados'}`
              : "Eventos que has guardado para revisar más tarde"
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {favorites.length > 0 ? (
          <EventList events={favorites} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Card className="p-12 text-center max-w-md">
              <div className="text-6xl mb-4">💔</div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                No tienes favoritos aún
              </h3>
              <p className="text-muted-foreground mb-6">
                Explora eventos y guarda tus favoritos haciendo clic en el ícono de corazón
              </p>
              <Link href="/eventos">
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
              </Link>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
