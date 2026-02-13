import { useEffect, useRef } from "react";

const WS_URL = "wss://074y7xhv7f.execute-api.us-east-2.amazonaws.com/dev";

export default function useWebSocket(userId, onMessage) {
  const wsRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const ws = new WebSocket(`${WS_URL}?user_id=${userId}`);

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("WS message:", data);
      if (onMessage) onMessage(data);
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
  }, [userId]);

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
