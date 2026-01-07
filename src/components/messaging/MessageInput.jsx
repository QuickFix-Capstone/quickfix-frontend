// src/components/messaging/MessageInput.jsx
import React, { useState } from "react";
import { Send } from "lucide-react";

/**
 * Message input component with send button
 * @param {Function} onSend - Callback function when message is sent
 * @param {boolean} disabled - Whether input is disabled
 */
export default function MessageInput({ onSend, disabled = false }) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage(""); // Clear input after sending
  };

  const handleKeyDown = (e) => {
    // Send on Enter, new line on Shift+Enter
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-neutral-200 bg-white p-4">
      <div className="flex items-end gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
          style={{
            minHeight: "40px",
            maxHeight: "120px",
          }}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-1 text-xs text-neutral-400">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
