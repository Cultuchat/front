"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/ui/page-title";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences, CategoryPreference } from "@/hooks/use-preferences";
import { useCategories } from "@/hooks/use-categories";
import { useLanguage, Language } from "@/contexts/language-context";
import { getCategoryIcon, getCategoryDescription } from "@/constants/categories";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const { user, isLoading, logout } = useAuth();
  const { preferences, toggleCategory } = usePreferences();
  const { categories: apiCategories } = useCategories();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  // Build category list with icons and descriptions
  const categories = useMemo(() => {
    return apiCategories
      .filter(cat => cat !== "Todos")
      .map(cat => ({
        name: cat as CategoryPreference,
        icon: getCategoryIcon(cat),
        description: getCategoryDescription(cat)
      }));
  }, [apiCategories]);

  const handleSavePreferences = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    router.push("/auth/login");
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
          {/* User Card */}
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
                  <span className="text-2xl font-medium">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {user.name || "Usuario"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user.email || "Sin email"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categories Card */}
          <Card>
            <CardHeader>
              <CardTitle>Intereses Culturales</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecciona las categorías que te interesan para recibir recomendaciones personalizadas
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((category) => {
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

          {/* Language Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t("profile.language")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("profile.languageDescription")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <button
                  onClick={() => setLanguage("es")}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-3
                    ${language === "es"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <span className="text-2xl">🇪🇸</span>
                  <div className="text-left">
                    <h4 className="font-semibold">Español</h4>
                    <p className="text-xs text-muted-foreground">Spanish</p>
                  </div>
                  {language === "es" && (
                    <svg className="w-5 h-5 text-primary ml-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`
                    flex-1 p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-3
                    ${language === "en"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                    }
                  `}
                >
                  <span className="text-2xl">🇺🇸</span>
                  <div className="text-left">
                    <h4 className="font-semibold">English</h4>
                    <p className="text-xs text-muted-foreground">Inglés</p>
                  </div>
                  {language === "en" && (
                    <svg className="w-5 h-5 text-primary ml-auto" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  )}
                </button>
              </div>
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
