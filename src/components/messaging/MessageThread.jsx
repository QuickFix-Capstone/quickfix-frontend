// src/components/messaging/MessageThread.jsx
import React, { useEffect, useRef } from "react";

/**
 * Message thread component - displays messages in a conversation
 * @param {string} currentUserId - The current user's ID (passed from parent)
 * @param {Array} typingUsers - Names of users currently typing
 */
export default function MessageThread({
  messages = [],
  loading = false,
  currentUserId,
  typingUsers = [],
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 text-xl">💬</span>
          </div>
          <p className="text-slate-700 font-medium">No messages yet</p>
          <p className="text-sm text-slate-500">
            Start the conversation by sending a message
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-4 max-w-4xl mx-auto">
        {messages.map((msg) => {
          // Normalize sender ID (prevents mismatch bugs)
          const senderId = msg.senderId?.toString();
          const isOwnMessage = senderId === currentUserId;

          return (
            <div
              key={msg.messageId}
              className={`flex ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                  isOwnMessage
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                }`}
              >
                {/* Sender name (only for received messages) */}
                {!isOwnMessage && msg.senderName && (
                  <p className="mb-1 text-xs font-semibold text-blue-600">
                    {msg.senderName}
                  </p>
                )}

                {/* Message text */}
                <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                  {msg.text}
                </p>

                {/* Timestamp */}
                <p
                  className={`mt-2 text-xs text-right ${
                    isOwnMessage ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {formatTimestamp(msg.timestamp)}
                </p>
                {isOwnMessage && (
                  <p
                    className={`mt-1 text-[11px] text-right ${
                      msg.readAt || msg.status === "read"
                        ? "text-blue-100"
                        : "text-blue-200"
                    }`}
                  >
                    {msg.readAt || msg.status === "read"
                      ? "Read"
                      : msg.deliveredAt || msg.status === "delivered"
                        ? "Delivered"
                        : "Sent"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 shadow-sm">
              {typingUsers.join(", ")} typing
              <span className="ml-1 inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400 [animation-delay:240ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

/**
 * Format timestamp to readable time
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
