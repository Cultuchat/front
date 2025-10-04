"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences, CategoryPreference } from "@/hooks/use-preferences";
import { useNotifications } from "@/hooks/use-notifications";
import { useRouter } from "next/navigation";

const CATEGORIES: { name: CategoryPreference; icon: string; description: string }[] = [
  { name: "Música", icon: "🎵", description: "Conciertos, festivales musicales, recitales" },
  { name: "Arte", icon: "🎨", description: "Exposiciones, galerías, arte urbano" },
  { name: "Teatro", icon: "🎭", description: "Obras de teatro, stand-up, performances" },
  { name: "Danza", icon: "💃", description: "Ballet, danza contemporánea, folklórica" },
  { name: "Festivales", icon: "🎪", description: "Festivales culturales y temáticos" },
  { name: "Gastronomía", icon: "🍽️", description: "Ferias gastronómicas, degustaciones" },
];

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const { preferences, toggleCategory, updateNotifications } = usePreferences();
  const { permission, requestPermission, sendNotification } = useNotifications();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      const granted = await requestPermission();
      if (granted) {
        updateNotifications({ notifications: true });
        sendNotification("¡Notificaciones activadas!", {
          body: "Recibirás alertas sobre eventos de tu interés",
        });
      }
    } else {
      updateNotifications({ notifications: enabled });
    }
  };

  const handleSavePreferences = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!user) {
    return null;
  }

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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
          title="Mi Perfil"
          description="Personaliza tu experiencia en CultuChat"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Información de Usuario</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {user.isGuest ? "Usuario Invitado" : user.email}
                  </p>
                  {user.isGuest && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Regístrate para guardar tus preferencias permanentemente
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle>Intereses Culturales</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona las categorías que te interesan para recibir recomendaciones personalizadas
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CATEGORIES.map((category) => {
                  const isSelected = preferences.categories.includes(category.name);
                  return (
                    <button
                      key={category.name}
                      onClick={() => toggleCategory(category.name)}
                      className={`
                        p-4 rounded-lg border-2 transition-all text-left
                        ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{category.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{category.name}</h4>
                            {isSelected && (
                              <svg
                                className="w-5 h-5 text-primary"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {preferences.categories.length === 0 && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ Selecciona al menos una categoría para mejorar tus recomendaciones
                  </p>
                </div>
              )}

              {preferences.categories.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Categorías seleccionadas:</span>
                  <div className="flex flex-wrap gap-2">
                    {preferences.categories.map((cat) => (
                      <Badge key={cat} variant="primary">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configura qué tipo de notificaciones deseas recibir
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer">
                <div className="flex-1">
                  <h4 className="font-medium">Habilitar notificaciones</h4>
                  <p className="text-xs text-muted-foreground">
                    Recibe alertas en tu navegador
                    {permission === "denied" && (
                      <span className="text-error"> (Bloqueadas por el navegador)</span>
                    )}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.notifications}
                  onChange={(e) => handleNotificationToggle(e.target.checked)}
                  disabled={permission === "denied"}
                  className="w-5 h-5"
                />
              </label>

              {preferences.notifications && (
                <>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer">
                    <div className="flex-1">
                      <h4 className="font-medium">Nuevos eventos</h4>
                      <p className="text-xs text-muted-foreground">
                        Notificar cuando haya eventos de tu interés
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifyNewEvents}
                      onChange={(e) => updateNotifications({ notifyNewEvents: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer">
                    <div className="flex-1">
                      <h4 className="font-medium">Cambios de precio</h4>
                      <p className="text-xs text-muted-foreground">
                        Alertas de eventos gratuitos o descuentos
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifyPriceChanges}
                      onChange={(e) =>
                        updateNotifications({ notifyPriceChanges: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer">
                    <div className="flex-1">
                      <h4 className="font-medium">Eventos cercanos</h4>
                      <p className="text-xs text-muted-foreground">
                        Notificar eventos cerca de tu ubicación
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.notifyNearbyEvents}
                      onChange={(e) =>
                        updateNotifications({ notifyNearbyEvents: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                  </label>
                </>
              )}
            </CardContent>
          </Card>

          {}
          <div className="flex justify-end gap-3 pb-6">
            <Button variant="outline" onClick={() => router.push("/chat")}>
              Cancelar
            </Button>
            <Button onClick={handleSavePreferences}>
              {saved ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Guardado
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
