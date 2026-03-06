import { useEffect, useRef } from "react";

const WS_URL = "wss://074y7xhv7f.execute-api.us-east-2.amazonaws.com/dev/";

export default function useWebSocket(userId, onMessage, token) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!userId) return;

    const authParam = token
      ? `token=${encodeURIComponent(token)}`
      : `user_id=${encodeURIComponent(userId)}`;
    const ws = new WebSocket(`${WS_URL}?${authParam}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WS message:", data);
        if (onMessageRef.current) onMessageRef.current(data);
      } catch (error) {
        console.warn("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [userId, token]);

  const sendMessage = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      return true;
    }
    console.warn("WebSocket not connected. readyState:", wsRef.current?.readyState);
    return false;
  };

  return { sendMessage };
}
