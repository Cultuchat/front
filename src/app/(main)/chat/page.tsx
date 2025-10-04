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
  const { messages, isLoading, sendMessage, setMessages } = useChat();
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
              <div className="max-w-3xl w-full space-y-8">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-primary/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-foreground">¿En qué puedo ayudarte hoy?</h2>
                  <p className="text-muted-foreground">Pregúntame sobre eventos culturales en tu ciudad</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => sendMessage("¿Qué eventos hay este fin de semana?")}
                    className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:border-primary transition-colors">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Eventos del fin de semana</h3>
                        <p className="text-sm text-muted-foreground">Descubre qué hay este sábado y domingo</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => sendMessage("Muéstrame eventos gratuitos")}
                    className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:border-primary transition-colors">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Eventos gratuitos</h3>
                        <p className="text-sm text-muted-foreground">Explora eventos sin costo de entrada</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => sendMessage("¿Qué conciertos hay disponibles?")}
                    className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:border-primary transition-colors">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Conciertos y música</h3>
                        <p className="text-sm text-muted-foreground">Encuentra shows en vivo y presentaciones</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => sendMessage("Muéstrame exposiciones de arte")}
                    className="p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center flex-shrink-0 group-hover:border-primary transition-colors">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">Arte y exposiciones</h3>
                        <p className="text-sm text-muted-foreground">Descubre galerías y museos abiertos</p>
                      </div>
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
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="flex-shrink-0 border-t border-border pt-4">
            <ChatInput onSend={sendMessage} disabled={isLoading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
