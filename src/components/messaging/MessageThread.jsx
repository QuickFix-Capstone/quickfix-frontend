// src/components/messaging/MessageThread.jsx
import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";

/**
 * Message thread component - displays messages in a conversation
 * @param {Array} messages - Array of message objects
 * @param {boolean} loading - Whether messages are loading
 */
export default function MessageThread({ messages = [], loading = false }) {
  const auth = useAuth();
  const messagesEndRef = useRef(null);
  const currentUserId = auth.user?.profile?.sub;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
          <p className="text-sm text-neutral-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-neutral-50">
        <div className="text-center">
          <p className="text-neutral-500">No messages yet</p>
          <p className="mt-1 text-sm text-neutral-400">
            Start the conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-4">
      <div className="space-y-4">
        {messages.map((msg) => {
          const isOwnMessage = msg.senderId === currentUserId;

          return (
            <div
              key={msg.messageId}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isOwnMessage
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-900 border border-neutral-200"
                }`}
              >
                {/* Sender name (only show for received messages) */}
                {!isOwnMessage && (
                  <p className="mb-1 text-xs font-semibold text-neutral-600">
                    {msg.senderName}
                  </p>
                )}

                {/* Message text */}
                <p className="whitespace-pre-wrap break-words text-sm">
                  {msg.text}
                </p>

                {/* Timestamp */}
                <p
                  className={`mt-1 text-xs ${
                    isOwnMessage ? "text-neutral-300" : "text-neutral-400"
                  }`}
                >
                  {formatTimestamp(msg.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

/**
 * Format timestamp to readable time
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  // Just now
  if (diffMins < 1) return "Just now";

  // Minutes ago
  if (diffMins < 60) return `${diffMins}m ago`;

  // Hours ago
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // Older - show date and time
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
