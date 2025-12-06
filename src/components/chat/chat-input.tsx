"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";

type ChatInputProps = {
  onSend: (message: string, forceTavily?: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  isSearchingWeb?: boolean;
};

export const ChatInput = memo(function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Pregunta sobre eventos culturales en Lima...",
  isSearchingWeb = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    if (message.trim() && !disabled) {
      onSend(message.trim(), webSearchEnabled);
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [message, disabled, onSend, webSearchEnabled]);

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
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  return (
    <div className="relative w-full">
      <div className={`
        relative flex items-end gap-2 p-2 rounded-2xl border 
        bg-background/80 backdrop-blur-sm shadow-lg
        transition-all duration-200
        ${disabled ? 'opacity-50' : ''}
        border-border/50 hover:border-border
      `}>
        {/* Web Search Toggle */}
        <button
          type="button"
          onClick={() => setWebSearchEnabled(!webSearchEnabled)}
          disabled={disabled || isSearchingWeb}
          className={`
            flex-shrink-0 p-2.5 rounded-xl transition-all duration-200
            ${webSearchEnabled 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }
            ${isSearchingWeb ? 'animate-pulse' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={webSearchEnabled ? "Búsqueda web activada" : "Activar búsqueda web"}
        >
          {isSearchingWeb ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          )}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="
              no-focus-ring
              w-full px-3 py-2.5 bg-transparent border-none
              resize-none max-h-[120px] min-h-[40px]
              placeholder:text-muted-foreground/60
              outline-none ring-0 shadow-none
              focus:outline-none focus:ring-0 focus:shadow-none focus:border-none
              disabled:cursor-not-allowed
              text-foreground
            "
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className={`
            flex-shrink-0 p-2.5 rounded-xl transition-all duration-200
            ${message.trim() && !disabled
              ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:scale-105' 
              : 'bg-muted/30 text-muted-foreground/50 cursor-not-allowed'
            }
          `}
          title="Enviar mensaje"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>

      {/* Helper text */}
      <div className="flex items-center justify-between mt-2 px-2 text-xs text-muted-foreground/60">
        <div className="flex items-center gap-2">
          {webSearchEnabled && (
            <span className="flex items-center gap-1 text-primary">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
              </svg>
              Búsqueda web activa
            </span>
          )}
        </div>
        <span>{message.length}/500</span>
      </div>
    </div>
  );
});
