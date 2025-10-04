"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export const ChatInput = memo(function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Escribe tu pregunta aquí...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
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
        handleSend();
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
      <Button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        size="lg"
        className="flex-shrink-0"
      >
        <svg
          className="w-5 h-5"
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
  );
});
