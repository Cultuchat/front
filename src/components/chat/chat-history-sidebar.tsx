"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ChatConversation } from "@/types/chat";

interface ChatHistorySidebarProps {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ChatHistorySidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ChatHistorySidebarProps) {
  return (
    <div className="w-64 flex-shrink-0 border-l border-border bg-card p-4 space-y-4 overflow-y-auto">
      {}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Conversaciones</h3>
        <Button
          onClick={onNewConversation}
          className="w-full"
          size="sm"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva conversación
        </Button>
      </div>

      {}
      <div className="space-y-2">
        {conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No hay conversaciones aún
          </p>
        ) : (
          conversations.map((conv) => (
            <Card
              key={conv.id}
              className={`
                p-3 cursor-pointer transition-all hover:shadow-md group
                ${currentConversationId === conv.id ? "ring-2 ring-primary bg-primary/5" : ""}
              `}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-foreground truncate mb-1">
                    {conv.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.lastMessage}
                  </p>
                  <time className="text-xs text-muted-foreground mt-1 block">
                    {formatRelativeTime(conv.timestamp)}
                  </time>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error/10 rounded"
                >
                  <svg className="w-4 h-4 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}
