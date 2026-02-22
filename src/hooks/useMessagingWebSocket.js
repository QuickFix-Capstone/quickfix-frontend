import { useEffect, useRef, useState, useCallback } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import WebSocketMessagingClient from "../services/WebSocketMessagingClient";
import { WS_URL } from "../api/config";

export function useMessagingWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);

  const getToken = useCallback(async () => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const token = await getToken();
        if (!token || cancelled) {
          setIsInitializing(false);
          return;
        }

        const client = new WebSocketMessagingClient(WS_URL, token);

        client.on("connected", () => setIsConnected(true));
        client.on("disconnected", () => setIsConnected(false));
        client.on("reconnectFailed", () => setIsConnected(false));

        wsRef.current = client;
        setWs(client);
        client.connect();
      } catch {
        setIsConnected(false);
      } finally {
        setIsInitializing(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
      setWs(null);
      setIsConnected(false);
      setIsInitializing(false);
    };
  }, [getToken]);

  return { ws, isConnected, isInitializing };
}
