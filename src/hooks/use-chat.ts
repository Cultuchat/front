"use client";

import { useState, useCallback } from "react";
import type { Message } from "@/types/chat";
import { MOCK_EVENTS } from "@/constants/mock-events";
import { usePreferences } from "./use-preferences";

export function useChat(initialMessages?: Message[]) {
  const { preferences } = usePreferences();
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback((content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    
    setTimeout(() => {
      const response = generateResponse(content, preferences.categories);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        timestamp: new Date(),
        content: response.content || "",
        events: response.events,
        quickActions: response.quickActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  }, [preferences.categories]);

  return { messages, isLoading, sendMessage, setMessages };
}

function generateResponse(userMessage: string, userPreferences: string[] = []): Partial<Message> {
  const lowerMessage = userMessage.toLowerCase();

  
  const filterByPreferences = (events: typeof MOCK_EVENTS) => {
    if (userPreferences.length === 0) return events;
    return events.filter(e => userPreferences.includes(e.category));
  };

  if (lowerMessage.includes("fin de semana") || lowerMessage.includes("semana")) {
    const weekendEvents = MOCK_EVENTS.filter(e =>
      e.category === "Música" || e.category === "Arte" || e.category === "Teatro"
    ).slice(0, 6);

    return {
      content: `Encontré ${weekendEvents.length} eventos para este fin de semana. Hay opciones muy interesantes para disfrutar:`,
      events: weekendEvents,
      quickActions: ["Solo eventos gratuitos", "Solo conciertos", "Solo exposiciones"],
    };
  }

  if (lowerMessage.includes("gratis") || lowerMessage.includes("gratuito")) {
    const freeEvents = MOCK_EVENTS.filter(e => e.price === "Gratis");

    return {
      content: `¡Perfecto! Hay ${freeEvents.length} eventos gratuitos disponibles. Aquí te muestro los más destacados:`,
      events: freeEvents,
      quickActions: ["Conciertos gratuitos", "Arte gratuito", "Eventos de esta semana"],
    };
  }

  if (lowerMessage.includes("jazz") || lowerMessage.includes("música") || lowerMessage.includes("concierto")) {
    const musicEvents = MOCK_EVENTS.filter(e => e.category === "Música");

    return {
      content: `Hay ${musicEvents.length} conciertos disponibles. Te va a encantar la variedad:`,
      events: musicEvents,
      quickActions: ["Solo jazz", "Solo gratuitos", "Eventos de esta semana"],
    };
  }

  if (lowerMessage.includes("arte") || lowerMessage.includes("exposición")) {
    const artEvents = MOCK_EVENTS.filter(e => e.category === "Arte");

    return {
      content: `Encontré ${artEvents.length} exposiciones de arte que podrían interesarte:`,
      events: artEvents,
      quickActions: ["Arte moderno", "Solo gratuitos", "Eventos de esta semana"],
    };
  }

  if (lowerMessage.includes("teatro")) {
    const theaterEvents = MOCK_EVENTS.filter(e => e.category === "Teatro");

    return {
      content: `Hay ${theaterEvents.length} obras de teatro en cartelera. Todas tienen muy buenas críticas:`,
      events: theaterEvents,
      quickActions: ["Solo fines de semana", "Solo gratuitos", "Ver todos"],
    };
  }

  if (lowerMessage.includes("danza") || lowerMessage.includes("ballet")) {
    const danceEvents = MOCK_EVENTS.filter(e => e.category === "Danza");

    return {
      content: `Tengo ${danceEvents.length} eventos de danza para mostrarte:`,
      events: danceEvents,
      quickActions: ["Solo ballet", "Solo gratuitos", "Eventos de esta semana"],
    };
  }

  if (lowerMessage.includes("festival")) {
    const festivals = MOCK_EVENTS.filter(e => e.category === "Festivales");

    return {
      content: `¡Los festivales son geniales! Hay ${festivals.length} festivales programados:`,
      events: festivals,
      quickActions: ["Festivales gratuitos", "Festivales de música", "Ver todos"],
    };
  }

  
  if (userPreferences.length > 0) {
    const preferredEvents = filterByPreferences(MOCK_EVENTS);

    if (preferredEvents.length > 0) {
      return {
        content: `Basándome en tus intereses (${userPreferences.join(", ")}), encontré ${preferredEvents.length} eventos que podrían gustarte:`,
        events: preferredEvents.slice(0, 6),
        quickActions: userPreferences.map(cat => `Más eventos de ${cat}`),
      };
    }
  }

  return {
    content: "Tenemos muchos eventos increíbles disponibles. Puedo ayudarte a encontrar el evento perfecto para ti. ¿Qué te interesa?",
    quickActions: [
      "Eventos de este fin de semana",
      "Eventos gratuitos",
      "Conciertos de música",
      "Exposiciones de arte",
      "Teatro",
      "Festivales"
    ],
  };
}
