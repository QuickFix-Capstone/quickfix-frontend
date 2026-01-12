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
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
            <div className="absolute inset-0 h-10 w-10 animate-pulse rounded-full bg-blue-100 opacity-20"></div>
          </div>
          <p className="text-sm font-medium text-slate-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
          <MessageSquare className="h-8 w-8 text-blue-600" />
        </div>
        <p className="text-sm font-semibold text-slate-700">
          No conversations yet
        </p>
        <p className="mt-2 text-xs text-slate-500 max-w-[200px]">
          Start by messaging a service provider about a job
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-white to-slate-50">
      <div className="divide-y divide-slate-100">
        {conversations.map((conv) => {
          const isSelected =
            selectedConversation?.conversationId === conv.conversationId;

          return (
            <button
              key={conv.conversationId}
              onClick={() => onSelect(conv)}
              className={`w-full px-5 py-4 text-left transition-all hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 relative group ${isSelected ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600" : ""
                }`}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-indigo-600"></div>
              )}

              {/* Top row: Name and timestamp */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h3
                    className={`truncate text-sm font-bold ${conv.unreadCount > 0
                        ? "text-slate-900"
                        : "text-slate-700"
                      }`}
                  >
                    {conv.otherUser.name}
                  </h3>
                  <UnreadBadge count={conv.unreadCount} />
                </div>
                <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                  {formatTime(conv.lastMessage.timestamp)}
                </span>
              </div>

              {/* Job title */}
              {conv.jobTitle && (
                <p className="mt-1.5 truncate text-xs text-blue-600 font-medium">
                  📋 {conv.jobTitle}
                </p>
              )}

              {/* Last message preview */}
              <p
                className={`mt-2 truncate text-sm ${conv.unreadCount > 0
                    ? "font-semibold text-slate-900"
                    : "text-slate-600"
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
