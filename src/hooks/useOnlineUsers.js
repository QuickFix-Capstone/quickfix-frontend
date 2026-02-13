import { useEffect, useRef, useState } from "react";

const WS_BASE = "wss://074y7xhv7f.execute-api.us-east-2.amazonaws.com/dev";
const INITIAL_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;

export default function useOnlineUsers() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const delayRef = useRef(INITIAL_RECONNECT_DELAY);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    const stored = localStorage.getItem("adminProfile");
    const admin = stored ? JSON.parse(stored) : null;
    const userId = admin?.sub;
    if (!userId) return;

    function connect() {
      if (!mountedRef.current) return;
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(
        `${WS_BASE}?user_id=${encodeURIComponent(userId)}&role=admin`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        delayRef.current = INITIAL_RECONNECT_DELAY;
        ws.send(JSON.stringify({ action: "getOnlineUsers" }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.onlineUsers !== undefined) {
            setOnlineCount(msg.onlineUsers);
          } else if (msg.count !== undefined) {
            setOnlineCount(msg.count);
          }
        } catch {
          // ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (!mountedRef.current) return;
        setIsConnected(false);
        // Exponential backoff
        reconnectTimer.current = setTimeout(connect, delayRef.current);
        delayRef.current = Math.min(delayRef.current * 2, MAX_RECONNECT_DELAY);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return { onlineCount, isConnected };
}
