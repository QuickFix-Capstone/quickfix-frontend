// src/components/messaging/UnreadBadge.jsx
import React from "react";

/**
 * Badge component to display unread message count
 * @param {number} count - Number of unread messages
 */
export default function UnreadBadge({ count }) {
  if (!count || count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full">
      {count > 99 ? "99+" : count}
    </span>
  );
}
