// src/components/messaging/ConversationList.jsx
import React from "react";
import { MessageSquare } from "lucide-react";
import UnreadBadge from "./UnreadBadge";

/**
 * Conversation list component - displays all conversations in sidebar
 * @param {Array} conversations - Array of conversation objects
 * @param {Object} selectedConversation - Currently selected conversation
 * @param {Function} onSelect - Callback when conversation is clicked
 * @param {boolean} loading - Whether conversations are loading
 */
export default function ConversationList({
  conversations = [],
  selectedConversation,
  onSelect,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
          <p className="text-sm text-neutral-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-white p-6 text-center">
        <MessageSquare className="h-12 w-12 text-neutral-300" />
        <p className="mt-3 text-sm font-medium text-neutral-600">
          No conversations yet
        </p>
        <p className="mt-1 text-xs text-neutral-400">
          Start by messaging a service provider
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="divide-y divide-neutral-100">
        {conversations.map((conv) => {
          const isSelected =
            selectedConversation?.conversationId === conv.conversationId;

          return (
            <button
              key={conv.conversationId}
              onClick={() => onSelect(conv)}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                isSelected ? "bg-neutral-100" : ""
              }`}
            >
              {/* Top row: Name and timestamp */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h3
                    className={`truncate text-sm font-semibold ${
                      conv.unreadCount > 0
                        ? "text-neutral-900"
                        : "text-neutral-700"
                    }`}
                  >
                    {conv.otherUser.name}
                  </h3>
                  <UnreadBadge count={conv.unreadCount} />
                </div>
                <span className="text-xs text-neutral-400 whitespace-nowrap">
                  {formatTime(conv.lastMessage.timestamp)}
                </span>
              </div>

              {/* Job title */}
              {conv.jobTitle && (
                <p className="mt-1 truncate text-xs text-neutral-500">
                  Job: {conv.jobTitle}
                </p>
              )}

              {/* Last message preview */}
              <p
                className={`mt-1 truncate text-sm ${
                  conv.unreadCount > 0
                    ? "font-medium text-neutral-900"
                    : "text-neutral-600"
                }`}
              >
                {conv.lastMessage.preview}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Format timestamp for conversation list
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time string
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  // Just now
  if (diffMins < 1) return "now";

  // Minutes ago
  if (diffMins < 60) return `${diffMins}m`;

  // Hours ago
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  // This week - show day name
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "short" });
  }

  // Older - show date
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
