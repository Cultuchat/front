"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
    const { isAuthenticated, loginAsGuest } = useAuth();
  
    
    useEffect(() => {
      if (isAuthenticated) {
        router.push("/chat");
      }
    }, [isAuthenticated, router]);
  
    const handleGuestLogin = () => {
      loginAsGuest();
      router.push("/chat");
    };
  
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        {}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            {}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              CultuChat
            </h1>
  
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              Tu asistente cultural inteligente
            </p>
  
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Descubre eventos culturales cerca de ti. Conciertos, exposiciones, teatro, festivales y más.
              Todo en un solo lugar, con recomendaciones personalizadas.
            </p>
  
            {}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto"
                onClick={handleGuestLogin}
              >
                Comenzar ahora
              </Button>
            </div>
  
            <p className="text-sm text-muted-foreground mt-6">
              No necesitas cuenta para empezar a explorar
            </p>
          </div>
        </section>
  
        {}
        <section className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">¿Qué puedes hacer?</h2>
  
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4 text-center">🤖</div>
                <h3 className="text-xl font-semibold mb-3 text-center">Chatbot Inteligente</h3>
                <p className="text-muted-foreground text-center">
                  Pregunta en lenguaje natural y obtén recomendaciones personalizadas de eventos culturales
                </p>
              </CardContent>
            </Card>
  
            {}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4 text-center">🎭</div>
                <h3 className="text-xl font-semibold mb-3 text-center">Todos los Eventos</h3>
                <p className="text-muted-foreground text-center">
                  Explora música, arte, teatro, danza, festivales y gastronomía en tu ciudad
                </p>
              </CardContent>
            </Card>
  
            {}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4 text-center">❤️</div>
                <h3 className="text-xl font-semibold mb-3 text-center">Favoritos</h3>
                <p className="text-muted-foreground text-center">
                  Guarda los eventos que te interesan y accede a ellos cuando quieras
                </p>
              </CardContent>
            </Card>
  
            {}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4 text-center">🗺️</div>
                <h3 className="text-xl font-semibold mb-3 text-center">Mapa Interactivo</h3>
                <p className="text-muted-foreground text-center">
                  Encuentra eventos cercanos a tu ubicación con nuestro mapa interactivo
                </p>
              </CardContent>
            </Card>
  
            {}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4 text-center">🎫</div>
                <h3 className="text-xl font-semibold mb-3 text-center">Filtros Avanzados</h3>
                <p className="text-muted-foreground text-center">
                  Filtra por fecha, categoría, precio y ubicación para encontrar el evento perfecto
                </p>
              </CardContent>
            </Card>
  
            {}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-5xl mb-4 text-center">📊</div>
                <h3 className="text-xl font-semibold mb-3 text-center">Historial</h3>
                <p className="text-muted-foreground text-center">
                  Revisa los eventos que has visitado y tus conversaciones anteriores
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
  
        {}
        <section className="container mx-auto px-4 py-20">
          <Card className="max-w-3xl mx-auto bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="pt-12 pb-12 text-center">
              <h2 className="text-3xl font-bold mb-4">¿Listo para descubrir?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Comienza a explorar eventos culturales ahora mismo. ¡Es gratis!
              </p>
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto"
                onClick={handleGuestLogin}
              >
                Ir a CultuChat
                <svg
                  className="w-5 h-5 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>
            </CardContent>
          </Card>
        </section>
  
        {}
        <footer className="border-t border-border py-8">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>&copy; 2025 CultuChat. Descubre la cultura cerca de ti.</p>
          </div>
        </footer>
      </div>
    );
}
