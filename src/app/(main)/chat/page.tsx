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

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-6 min-h-0 overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col items-center justify-center min-h-full py-8">
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
