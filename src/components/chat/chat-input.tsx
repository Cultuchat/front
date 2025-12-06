"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
  onSend: (message: string, forceTavily?: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  isSearchingWeb?: boolean;
};

export const ChatInput = memo(function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Escribe tu pregunta aquí...",
  isSearchingWeb = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback((forceTavily = false) => {
    if (message.trim() && !disabled) {
      onSend(message.trim(), forceTavily);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [message, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(false);
      }
    },
    [handleSend]
  );

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="
            w-full px-4 py-3 pr-12 rounded-xl border-2 bg-input
            border-border focus:border-primary focus:ring-2 focus:ring-ring/20
            resize-none max-h-32 min-h-[44px]
            placeholder:text-muted-foreground
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-smooth
          "
        />
        <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
          {message.length}/500
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => handleSend(true)}
          disabled={!message.trim() || disabled}
          size="lg"
          variant="outline"
          className="flex-shrink-0"
          title="Buscar eventos nuevos en la web (puede tomar unos segundos)"
        >
          {isSearchingWeb ? (
            <>
              <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Buscando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Web
            </>
          )}
        </Button>
        <Button
          onClick={() => handleSend(false)}
          disabled={!message.trim() || disabled}
          size="lg"
          className="flex-shrink-0"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
          Enviar
        </Button>
      </div>
    </div>
  );
});
