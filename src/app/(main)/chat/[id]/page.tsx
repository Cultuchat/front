"use client";

import { useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/ui/page-title";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { useChat } from "@/hooks/use-chat";
import { useChatHistory } from "@/hooks/use-chat-history";

export default function ChatConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef<string | null>(null);

  const { messages, isLoading, sendMessage, setMessages } = useChat();
  const { getCurrentConversation, updateConversation, switchConversation } = useChatHistory();

  
  useEffect(() => {
    if (conversationId && loadedRef.current !== conversationId) {
      loadedRef.current = conversationId;
      switchConversation(conversationId);
      const conversation = getCurrentConversation();
      if (conversation && conversation.messages) {
        setMessages(conversation.messages);
      }
    }
  }, [conversationId, switchConversation, getCurrentConversation, setMessages]);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  
  useEffect(() => {
    if (messages.length > 1 && conversationId) {
      updateConversation(conversationId, messages);
    }
  }, [messages, conversationId, updateConversation]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0">
        <PageTitle
          title="Asistente Cultural"
          description="Pregúntame sobre eventos, horarios, ubicaciones y más"
        />
      </div>

      {}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 flex flex-col p-6 overflow-hidden">
          {}
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

          {}
          <div className="flex-shrink-0 border-t border-border pt-4">
            <ChatInput onSend={sendMessage} disabled={isLoading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
