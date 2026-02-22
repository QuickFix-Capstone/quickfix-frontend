// src/components/messaging/MessageInput.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

/**
 * Message input component with send button
 * @param {Function} onSend - Callback function when message is sent
 * @param {boolean} disabled - Whether input is disabled
 */
export default function MessageInput({
  onSend,
  disabled = false,
  onTypingChange,
  typingIndicatorText,
}) {
  const [message, setMessage] = useState("");
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const stopTyping = useCallback(() => {
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
  }, [onTypingChange]);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange?.(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1800);
  }, [onTypingChange, stopTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    stopTyping();
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-5 shadow-lg">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (e.target.value.trim()) {
                startTyping();
              } else {
                stopTyping();
              }
            }}
            onKeyDown={handleKeyDown}
            onBlur={stopTyping}
            placeholder="Type your message..."
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-xl border-2 border-slate-200 px-5 py-3 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
            style={{
              minHeight: "48px",
              maxHeight: "120px",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-xs font-mono">Shift+Enter</kbd> for new line
      </p>
      {typingIndicatorText && (
        <p className="mt-1 text-xs text-blue-600">{typingIndicatorText}</p>
      )}
    </form>
  );
}
