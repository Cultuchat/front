"use client";

import { useState, useEffect, useCallback } from "react";
import type { ChatConversation, Message } from "@/types/chat";

const STORAGE_KEY = "cultuchat_conversations";

export function useChatHistory() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      
      const converted = parsed.map((conv: Omit<ChatConversation, 'timestamp' | 'messages'> & { 
        timestamp: string; 
        messages: (Omit<Message, 'timestamp'> & { timestamp: string })[] 
      }) => ({
        ...conv,
        timestamp: new Date(conv.timestamp),
        messages: conv.messages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      setConversations(converted);
    }
  }, []);

  
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  const createNewConversation = (initialMessage: Message) => {
    const newConv: ChatConversation = {
      id: Date.now().toString(),
      title: "Nueva conversación",
      lastMessage: initialMessage.content,
      timestamp: new Date(),
      messages: [initialMessage],
    };

    setConversations((prev) => [newConv, ...prev]);
    setCurrentConversationId(newConv.id);
    return newConv.id;
  };

  const updateConversation = useCallback((conversationId: string, messages: Message[]) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === conversationId) {
          const lastUserMessage = messages
            .filter((m) => m.role === "user")
            .slice(-1)[0];

          return {
            ...conv,
            messages,
            lastMessage: lastUserMessage?.content || conv.lastMessage,
            timestamp: new Date(),
            title: generateTitle(messages),
          };
        }
        return conv;
      })
    );
  }, []);

  const deleteConversation = (conversationId: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  };

  const getCurrentConversation = useCallback(() => {
    if (!currentConversationId) return null;
    return conversations.find((conv) => conv.id === currentConversationId) || null;
  }, [currentConversationId, conversations]);

  const switchConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
  }, []);

  return {
    conversations,
    currentConversationId,
    createNewConversation,
    updateConversation,
    deleteConversation,
    getCurrentConversation,
    switchConversation,
  };
}


function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === "user");
  if (!firstUserMessage) return "Nueva conversación";

  const content = firstUserMessage.content.trim();
  if (content.length <= 30) return content;

  return content.substring(0, 30) + "...";
}
