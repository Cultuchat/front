"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { useChatHistory } from "@/hooks/use-chat-history";

export default function NewChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, isSearchingWeb, sendMessage, setMessages } = useChat();
  const { createNewConversation } = useChatHistory();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewConversation = () => {
    // Guardar conversación actual si hay mensajes de usuario
    const userMessages = messages.filter(m => m.role === "user");
    if (userMessages.length > 0) {
      createNewConversation(messages[0]);
      // Actualizar la conversación con todos los mensajes
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // Si no hay mensajes, simplemente limpiar
      setMessages([]);
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <PageTitle
            title="Asistente Cultural"
            description="Pregúntame sobre eventos culturales"
          />
          {messages.length > 0 && (
            <Button
              onClick={handleNewConversation}
              variant="outline"
              size="sm"
              className="ml-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva conversación
            </Button>
          )}
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-6 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="max-w-4xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center bg-background shadow-lg">
                      <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    ¿En qué puedo ayudarte hoy?
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Descubre eventos culturales, conciertos, obras de teatro y más. Pregúntame lo que necesites.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => sendMessage("¿Qué eventos hay este fin de semana?")}
                    className="group relative p-5 rounded-xl border-2 border-border hover:border-primary bg-gradient-to-br from-background to-accent/20 hover:from-primary/5 hover:to-primary/10 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                          Eventos del fin de semana
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Descubre qué hay este sábado y domingo
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => sendMessage("Muéstrame eventos gratuitos")}
                    className="group relative p-5 rounded-xl border-2 border-border hover:border-green-500/50 bg-gradient-to-br from-background to-accent/20 hover:from-green-500/5 hover:to-green-500/10 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors mb-1">
                          Eventos gratuitos
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Explora eventos sin costo de entrada
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-muted-foreground/50 group-hover:text-green-600 dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => sendMessage("¿Qué conciertos hay disponibles?")}
                    className="group relative p-5 rounded-xl border-2 border-border hover:border-purple-500/50 bg-gradient-to-br from-background to-accent/20 hover:from-purple-500/5 hover:to-purple-500/10 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors mb-1">
                          Conciertos y música
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Encuentra shows en vivo y presentaciones
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-muted-foreground/50 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => sendMessage("Muéstrame exposiciones de arte")}
                    className="group relative p-5 rounded-xl border-2 border-border hover:border-orange-500/50 bg-gradient-to-br from-background to-accent/20 hover:from-orange-500/5 hover:to-orange-500/10 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mb-1">
                          Arte y exposiciones
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Descubre galerías y museos abiertos
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-muted-foreground/50 group-hover:text-orange-600 dark:group-hover:text-orange-400 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => sendMessage("Eventos culturales en diciembre")}
                    className="group relative p-5 rounded-xl border-2 border-border hover:border-blue-500/50 bg-gradient-to-br from-background to-accent/20 hover:from-blue-500/5 hover:to-blue-500/10 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                          Eventos de este mes
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Ve todos los eventos culturales del mes
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-muted-foreground/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={() => sendMessage("Teatro y obras de teatro")}
                    className="group relative p-5 rounded-xl border-2 border-border hover:border-pink-500/50 bg-gradient-to-br from-background to-accent/20 hover:from-pink-500/5 hover:to-pink-500/10 transition-all duration-300 text-left shadow-sm hover:shadow-xl"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/10 border border-pink-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-foreground group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors mb-1">
                          Teatro y obras
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Descubre obras de teatro y shows en vivo
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-muted-foreground/50 group-hover:text-pink-600 dark:group-hover:text-pink-400 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-1">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onQuickAction={sendMessage}
                  onViewEventDetails={(event) => {
                    console.log("Ver detalles de:", event);
                  }}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
                    {isSearchingWeb ? (
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-primary animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium">Buscando eventos nuevos en la web...</p>
                          <p className="text-xs text-muted-foreground">Esto puede tomar unos segundos</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="flex-shrink-0 border-t border-border pt-4">
            <ChatInput onSend={sendMessage} disabled={isLoading} isSearchingWeb={isSearchingWeb} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
