import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "react-oidc-context";
import {
  acquireWebSocketMessagingClient,
  DEFAULT_MESSAGING_WS_URL,
  releaseWebSocketMessagingClient,
} from "../services/WebSocketMessagingClient";

function resolveUserId(authUser, explicitUserId) {
  if (explicitUserId) return String(explicitUserId);

  const oidcId = authUser?.profile?.sub;
  if (oidcId) return String(oidcId);

  try {
    const raw = localStorage.getItem("quickfix_user");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.userId ? String(parsed.userId) : null;
  } catch {
    return null;
  }
}

function normalizeMessageEvent(event) {
  if (!event || typeof event !== "object") return null;
  if (event.message && typeof event.message === "object") return event.message;
  return event;
}

function normalizeEventType(event) {
  return String(event?.type || event?.event || event?.action || "").toUpperCase();
}

export default function useMessagingWebSocket({
  enabled = true,
  userId,
  wsUrl = DEFAULT_MESSAGING_WS_URL,
  onEvent,
  onMessage,
  onTyping,
  onReadReceipt,
  onUnreadCount,
} = {}) {
  const auth = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef(null);
  const callbacksRef = useRef({
    onEvent,
    onMessage,
    onTyping,
    onReadReceipt,
    onUnreadCount,
  });

  callbacksRef.current = {
    onEvent,
    onMessage,
    onTyping,
    onReadReceipt,
    onUnreadCount,
  };

  const resolvedUserId = useMemo(
    () => resolveUserId(auth.user, userId),
    [auth.user, userId],
  );

  useEffect(() => {
    if (!enabled || !resolvedUserId) {
      setIsConnected(false);
      return;
    }

    const client = acquireWebSocketMessagingClient({ userId: resolvedUserId, url: wsUrl });
    if (!client) return;

    clientRef.current = client;

    const offStatus = client.onStatusChange((status) => {
      setIsConnected(status === "connected");
    });

    const offEvent = client.onEvent((event) => {
      const safeEvent = normalizeMessageEvent(event);
      const type = normalizeEventType(event);
      const lower = type.toLowerCase();

      callbacksRef.current.onEvent?.(safeEvent, type);

      const isTypingEvent =
        lower.includes("typing") ||
        ["TYPING_START", "TYPING_STOP", "USER_TYPING"].includes(type);
      if (isTypingEvent) {
        callbacksRef.current.onTyping?.(safeEvent, type);
      }

      const isReadReceiptEvent =
        lower.includes("read_receipt") ||
        lower.includes("message_read") ||
        lower.includes("conversation_read") ||
        ["READ_RECEIPT", "MESSAGE_READ", "CONVERSATION_READ"].includes(type);
      if (isReadReceiptEvent) {
        callbacksRef.current.onReadReceipt?.(safeEvent, type);
      }

      const isUnreadCountEvent =
        lower.includes("unread") ||
        type === "UNREAD_COUNT_UPDATED";
      if (isUnreadCountEvent) {
        callbacksRef.current.onUnreadCount?.(safeEvent, type);
      }

      const isMessageEvent =
        lower.includes("message") ||
        type === "NEW_MESSAGE" ||
        type === "MESSAGE_RECEIVED";
      if (isMessageEvent) {
        callbacksRef.current.onMessage?.(safeEvent, type);
      }
    });

    client.connect();
    setIsConnected(client.isConnected);

    return () => {
      offEvent();
      offStatus();
      releaseWebSocketMessagingClient({ userId: resolvedUserId, url: wsUrl });
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, resolvedUserId, wsUrl]);

  const sendTypingStart = useCallback((conversationId) => {
    return clientRef.current?.sendTypingStart(conversationId) || false;
  }, []);

  const sendTypingStop = useCallback((conversationId) => {
    return clientRef.current?.sendTypingStop(conversationId) || false;
  }, []);

  const sendReadReceipt = useCallback((conversationId, messageId) => {
    return clientRef.current?.sendReadReceipt(conversationId, messageId) || false;
  }, []);

  return {
    isConnected,
    sendTypingStart,
    sendTypingStop,
    sendReadReceipt,
  };
}
