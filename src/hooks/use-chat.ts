"use client";

import { useState, useCallback } from "react";
import type { Message } from "@/types/chat";

export function useChat(initialMessages?: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string, forceWebSearch = false) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    if (forceWebSearch) {
      setIsSearchingWeb(true);
    }
    setError(null);

    try {
      // Call Supabase Edge Function
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase configuration missing');
      }

      // Add current date context to help with date-related queries
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      
      // Enhance message with year context if it mentions a month without year
      let enhancedMessage = content;
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const lowerContent = content.toLowerCase();
      
      // If message mentions a month but not a year, add current/next year
      for (const month of months) {
        if (lowerContent.includes(month) && !lowerContent.match(/20\d{2}/)) {
          const monthIndex = months.indexOf(month);
          const yearToUse = monthIndex < currentMonth - 1 ? currentYear + 1 : currentYear;
          enhancedMessage = content + ` ${yearToUse}`;
          break;
        }
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          message: enhancedMessage,
          current_date: today.toISOString().split('T')[0],
          forceWebSearch,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar el mensaje');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        timestamp: new Date(),
        content: data.response,
        events: data.events,
        // Extract quick actions from metadata if available
        quickActions: data.metadata?.quick_actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Error al enviar el mensaje");

      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        timestamp: new Date(),
        content: "Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsSearchingWeb(false);
    }
  }, []);

  return { messages, isLoading, isSearchingWeb, sendMessage, setMessages, error };
}

