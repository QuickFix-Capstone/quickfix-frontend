const DEFAULT_WS_URL =
  import.meta.env.VITE_MESSAGING_WEBSOCKET_URL ||
  "wss://074y7xhv7f.execute-api.us-east-2.amazonaws.com/dev";

const NOOP = () => {};
const clientRegistry = new Map();

function parseMessage(rawData) {
  if (typeof rawData === "object" && rawData !== null) return rawData;

  try {
    return JSON.parse(rawData);
  } catch {
    return { type: "RAW_MESSAGE", rawData };
  }
}

function normalizeType(event) {
  return String(event?.type || event?.event || event?.action || "UNKNOWN").toUpperCase();
}

export default class WebSocketMessagingClient {
  constructor({ userId, url = DEFAULT_WS_URL } = {}) {
    this.userId = userId;
    this.url = url;
    this.socket = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.manualClose = false;

    this.eventListeners = new Set();
    this.statusListeners = new Set();
    this.typedListeners = new Map();
  }

  connect() {
    if (!this.userId) return;
    if (this.socket && [WebSocket.CONNECTING, WebSocket.OPEN].includes(this.socket.readyState)) {
      return;
    }

    this.manualClose = false;
    const separator = this.url.includes("?") ? "&" : "?";
    const wsUrl = `${this.url}${separator}user_id=${encodeURIComponent(this.userId)}`;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.emitStatus("connected");
    };

    this.socket.onmessage = (event) => {
      const payload = parseMessage(event.data);
      const type = normalizeType(payload);
      this.emitEvent(payload);
      this.emitTyped(type, payload);
    };

    this.socket.onerror = () => {
      this.emitStatus("error");
    };

    this.socket.onclose = () => {
      this.emitStatus("disconnected");
      this.socket = null;

      if (!this.manualClose) {
        this.scheduleReconnect();
      }
    };
  }

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 15000);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts += 1;
      this.connect();
    }, delay);
  }

  close() {
    this.manualClose = true;
    clearTimeout(this.reconnectTimer);

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(payload) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      this.socket.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  sendEvent(type, payload = {}) {
    return this.send({ type, ...payload });
  }

  sendTypingStart(conversationId) {
    return this.sendEvent("TYPING_START", { conversationId });
  }

  sendTypingStop(conversationId) {
    return this.sendEvent("TYPING_STOP", { conversationId });
  }

  sendReadReceipt(conversationId, messageId) {
    return this.sendEvent("READ_RECEIPT", { conversationId, messageId });
  }

  onEvent(callback = NOOP) {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  onStatusChange(callback = NOOP) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  on(type, callback = NOOP) {
    const key = String(type || "").toUpperCase();
    if (!this.typedListeners.has(key)) {
      this.typedListeners.set(key, new Set());
    }

    this.typedListeners.get(key).add(callback);
    return () => this.typedListeners.get(key)?.delete(callback);
  }

  emitEvent(event) {
    this.eventListeners.forEach((listener) => listener(event));
  }

  emitStatus(status) {
    this.statusListeners.forEach((listener) => listener(status));
  }

  emitTyped(type, event) {
    this.typedListeners.get(type)?.forEach((listener) => listener(event));
  }

  get isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export function acquireWebSocketMessagingClient({ userId, url = DEFAULT_WS_URL } = {}) {
  if (!userId) return null;

  const key = `${url}::${userId}`;
  const existing = clientRegistry.get(key);

  if (existing) {
    existing.refs += 1;
    return existing.client;
  }

  const client = new WebSocketMessagingClient({ userId, url });
  clientRegistry.set(key, { client, refs: 1 });
  return client;
}

export function releaseWebSocketMessagingClient({ userId, url = DEFAULT_WS_URL } = {}) {
  if (!userId) return;

  const key = `${url}::${userId}`;
  const entry = clientRegistry.get(key);
  if (!entry) return;

  entry.refs -= 1;
  if (entry.refs <= 0) {
    entry.client.close();
    clientRegistry.delete(key);
  }
}

export { DEFAULT_WS_URL as DEFAULT_MESSAGING_WS_URL };
