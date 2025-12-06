"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "es" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    // Navigation
    "nav.chat": "Chat",
    "nav.events": "Eventos",
    "nav.calendar": "Calendario",
    "nav.map": "Mapa",
    "nav.favorites": "Favoritos",
    "nav.history": "Historial",
    "nav.profile": "Mi Perfil",
    
    // Chat
    "chat.title": "Chat con CultuChat",
    "chat.description": "Pregúntame sobre eventos culturales en Lima",
    "chat.placeholder": "¿Qué eventos culturales buscas?",
    "chat.send": "Enviar",
    "chat.webSearch": "Búsqueda web",
    "chat.searching": "Buscando eventos...",
    "chat.welcome": "¡Hola! Soy CultuChat, tu asistente de eventos culturales en Lima. ¿Qué te gustaría descubrir hoy?",
    "chat.newConversation": "Nueva conversación",
    "chat.conversations": "Conversaciones",
    
    // Events
    "events.title": "Eventos",
    "events.description": "Descubre eventos culturales en Lima",
    "events.showing": "Mostrando",
    "events.of": "de",
    "events.noEvents": "No hay eventos disponibles",
    "events.filters": "Filtros",
    "events.all": "Todos",
    "events.free": "Gratis",
    "events.today": "Hoy",
    "events.thisWeek": "Esta semana",
    "events.thisMonth": "Este mes",
    "events.viewDetails": "Ver detalles",
    "events.addFavorite": "Agregar a favoritos",
    "events.removeFavorite": "Quitar de favoritos",
    "events.dateConfirm": "Fecha por confirmar",
    "events.locationConfirm": "Ubicación por confirmar",
    "events.priceConfirm": "Precio por confirmar",
    
    // Calendar
    "calendar.title": "Calendario",
    "calendar.description": "Eventos por fecha",
    "calendar.noEvents": "No hay eventos para esta fecha",
    
    // Map
    "map.title": "Mapa de eventos",
    "map.nearbyEvents": "eventos cercanos",
    "map.eventsInLima": "eventos en Lima",
    "map.yourLocation": "Tu ubicación",
    "map.recenter": "Volver a mi ubicación",
    "map.noLocation": "Sin ubicación",
    
    // Favorites
    "favorites.title": "Favoritos",
    "favorites.description": "Tus eventos guardados",
    "favorites.empty": "No tienes favoritos aún",
    "favorites.emptyDescription": "Los eventos que guardes aparecerán aquí",
    
    // History
    "history.title": "Historial",
    "history.description": "Eventos que has visitado recientemente",
    "history.empty": "Sin historial",
    "history.emptyDescription": "Los eventos que visites aparecerán aquí para que puedas revisarlos después",
    "history.recentActivity": "Actividad reciente",
    "history.clear": "Limpiar",
    "history.today": "Hoy",
    "history.yesterday": "Ayer",
    "history.ago": "Hace",
    
    // Profile
    "profile.title": "Mi Perfil",
    "profile.description": "Personaliza tu experiencia en CultuChat",
    "profile.userInfo": "Información de Usuario",
    "profile.logout": "Cerrar sesión",
    "profile.interests": "Intereses Culturales",
    "profile.interestsDescription": "Selecciona las categorías que te interesan para recibir recomendaciones personalizadas",
    "profile.selectedCategories": "Categorías seleccionadas",
    "profile.selectCategory": "Selecciona al menos una categoría para mejorar tus recomendaciones",
    "profile.save": "Guardar cambios",
    "profile.saved": "Guardado",
    "profile.cancel": "Cancelar",
    "profile.language": "Idioma",
    "profile.languageDescription": "Selecciona el idioma de la aplicación",
    
    // Auth
    "auth.login": "Iniciar Sesión",
    "auth.signup": "Registrarse",
    "auth.logout": "Cerrar sesión",
    "auth.email": "Email",
    "auth.password": "Contraseña",
    "auth.confirmPassword": "Confirmar contraseña",
    "auth.name": "Nombre",
    "auth.forgotPassword": "¿Olvidaste tu contraseña?",
    "auth.noAccount": "¿No tienes cuenta?",
    "auth.hasAccount": "¿Ya tienes cuenta?",
    "auth.registerHere": "Regístrate aquí",
    "auth.loginHere": "Inicia sesión aquí",
    "auth.orContinueWith": "O continúa con",
    "auth.continueGoogle": "Continuar con Google",
    "auth.welcome": "¡Bienvenido de nuevo!",
    "auth.welcomeDescription": "Inicia sesión para descubrir eventos culturales en Lima",
    "auth.createAccount": "Crea tu cuenta",
    "auth.createAccountDescription": "Únete a CultuChat y descubre la cultura de Lima",
    
    // Common
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.retry": "Reintentar",
    "common.back": "Volver",
    "common.next": "Siguiente",
    "common.search": "Buscar",
    "common.close": "Cerrar",
  },
  en: {
    // Navigation
    "nav.chat": "Chat",
    "nav.events": "Events",
    "nav.calendar": "Calendar",
    "nav.map": "Map",
    "nav.favorites": "Favorites",
    "nav.history": "History",
    "nav.profile": "My Profile",
    
    // Chat
    "chat.title": "Chat with CultuChat",
    "chat.description": "Ask me about cultural events in Lima",
    "chat.placeholder": "What cultural events are you looking for?",
    "chat.send": "Send",
    "chat.webSearch": "Web search",
    "chat.searching": "Searching events...",
    "chat.welcome": "Hello! I'm CultuChat, your cultural events assistant in Lima. What would you like to discover today?",
    "chat.newConversation": "New conversation",
    "chat.conversations": "Conversations",
    
    // Events
    "events.title": "Events",
    "events.description": "Discover cultural events in Lima",
    "events.showing": "Showing",
    "events.of": "of",
    "events.noEvents": "No events available",
    "events.filters": "Filters",
    "events.all": "All",
    "events.free": "Free",
    "events.today": "Today",
    "events.thisWeek": "This week",
    "events.thisMonth": "This month",
    "events.viewDetails": "View details",
    "events.addFavorite": "Add to favorites",
    "events.removeFavorite": "Remove from favorites",
    "events.dateConfirm": "Date to be confirmed",
    "events.locationConfirm": "Location to be confirmed",
    "events.priceConfirm": "Price to be confirmed",
    
    // Calendar
    "calendar.title": "Calendar",
    "calendar.description": "Events by date",
    "calendar.noEvents": "No events for this date",
    
    // Map
    "map.title": "Events map",
    "map.nearbyEvents": "nearby events",
    "map.eventsInLima": "events in Lima",
    "map.yourLocation": "Your location",
    "map.recenter": "Back to my location",
    "map.noLocation": "No location",
    
    // Favorites
    "favorites.title": "Favorites",
    "favorites.description": "Your saved events",
    "favorites.empty": "No favorites yet",
    "favorites.emptyDescription": "Events you save will appear here",
    
    // History
    "history.title": "History",
    "history.description": "Events you've visited recently",
    "history.empty": "No history",
    "history.emptyDescription": "Events you visit will appear here so you can review them later",
    "history.recentActivity": "Recent activity",
    "history.clear": "Clear",
    "history.today": "Today",
    "history.yesterday": "Yesterday",
    "history.ago": "ago",
    
    // Profile
    "profile.title": "My Profile",
    "profile.description": "Customize your CultuChat experience",
    "profile.userInfo": "User Information",
    "profile.logout": "Log out",
    "profile.interests": "Cultural Interests",
    "profile.interestsDescription": "Select the categories you're interested in to receive personalized recommendations",
    "profile.selectedCategories": "Selected categories",
    "profile.selectCategory": "Select at least one category to improve your recommendations",
    "profile.save": "Save changes",
    "profile.saved": "Saved",
    "profile.cancel": "Cancel",
    "profile.language": "Language",
    "profile.languageDescription": "Select the app language",
    
    // Auth
    "auth.login": "Log in",
    "auth.signup": "Sign up",
    "auth.logout": "Log out",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm password",
    "auth.name": "Name",
    "auth.forgotPassword": "Forgot password?",
    "auth.noAccount": "Don't have an account?",
    "auth.hasAccount": "Already have an account?",
    "auth.registerHere": "Sign up here",
    "auth.loginHere": "Log in here",
    "auth.orContinueWith": "Or continue with",
    "auth.continueGoogle": "Continue with Google",
    "auth.welcome": "Welcome back!",
    "auth.welcomeDescription": "Log in to discover cultural events in Lima",
    "auth.createAccount": "Create your account",
    "auth.createAccountDescription": "Join CultuChat and discover Lima's culture",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.retry": "Retry",
    "common.back": "Back",
    "common.next": "Next",
    "common.search": "Search",
    "common.close": "Close",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");

  // Load language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cultuchat-language") as Language;
    if (saved && (saved === "es" || saved === "en")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("cultuchat-language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
