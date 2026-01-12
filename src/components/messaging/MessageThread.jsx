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
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full bg-blue-100 opacity-20"></div>
          </div>
          <p className="text-sm font-medium text-slate-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-slate-700 font-medium">No messages yet</p>
          <p className="text-sm text-slate-500">
            Start the conversation by sending a message below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-4 max-w-4xl mx-auto">
        {messages.map((msg) => {
          const isOwnMessage = msg.senderId === currentUserId;

          return (
            <div
              key={msg.messageId}
              className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} animate-fadeIn`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm transition-all hover:shadow-md ${isOwnMessage
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white"
                    : "bg-white text-slate-800 border border-slate-200"
                  }`}
              >
                {/* Sender name (only show for received messages) */}
                {!isOwnMessage && (
                  <p className="mb-1.5 text-xs font-semibold text-blue-600">
                    {msg.senderName}
                  </p>
                )}

                {/* Message text */}
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {msg.text}
                </p>

                {/* Timestamp */}
                <p
                  className={`mt-2 text-xs ${isOwnMessage ? "text-blue-100" : "text-slate-400"
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
