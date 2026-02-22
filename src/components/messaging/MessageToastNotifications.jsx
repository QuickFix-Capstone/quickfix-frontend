import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, MessageSquare } from "lucide-react";
import useMessagingWebSocket from "../../hooks/useMessagingWebSocket";

function resolveMessagesRoute(pathname, role) {
  if (pathname.startsWith("/service-provider") || role === "provider" || role === "service_provider") {
    return "/service-provider/messages";
  }
  return "/customer/messages";
}

function toMessagePayload(event) {
  return event?.message && typeof event.message === "object" ? event.message : event;
}

function extractSenderName(payload) {
  return payload?.senderName || payload?.sender?.name || payload?.otherUser?.name || "New message";
}

function extractText(payload) {
  return payload?.text || payload?.content || payload?.preview || "You received a new message.";
}

function isMessagesPage(pathname) {
  return pathname === "/customer/messages" || pathname === "/service-provider/messages";
}

export default function MessageToastNotifications({ currentUserRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);

  const routeToMessages = useMemo(
    () => resolveMessagesRoute(location.pathname, currentUserRole),
    [location.pathname, currentUserRole],
  );

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useMessagingWebSocket({
    enabled: true,
    onMessage: (incoming) => {
      if (isMessagesPage(location.pathname)) return;

      const payload = toMessagePayload(incoming);
      if (!payload?.messageId) return;

      setToasts((prev) => {
        if (prev.some((toast) => toast.id === payload.messageId)) {
          return prev;
        }

        const next = [
          {
            id: payload.messageId,
            conversationId: payload.conversationId,
            sender: extractSenderName(payload),
            text: extractText(payload),
          },
          ...prev,
        ].slice(0, 4);

        return next;
      });

      window.setTimeout(() => {
        removeToast(payload.messageId);
      }, 6000);
    },
  });

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[100] flex w-[340px] max-w-[92vw] flex-col gap-2">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => {
            removeToast(toast.id);
            navigate(routeToMessages);
          }}
          className="pointer-events-auto w-full rounded-xl border border-blue-200 bg-white p-4 text-left shadow-xl transition hover:border-blue-300 hover:bg-blue-50"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <MessageSquare className="h-4 w-4" />
              </span>
              <p className="text-sm font-semibold text-slate-900">{toast.sender}</p>
            </div>
            <span
              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                removeToast(toast.id);
              }}
            >
              <X className="h-4 w-4" />
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-slate-600">{toast.text}</p>
        </button>
      ))}
    </div>
  );
}
