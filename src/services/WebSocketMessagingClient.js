class WebSocketMessagingClient {
  constructor(wsUrl, token) {
    this.wsUrl = wsUrl;
    this.token = token;
    this.ws = null;
    this.listeners = new Map();
    this.pendingRequests = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.pingInterval = null;
  }

  connect() {
    const url = `${this.wsUrl}?token=${this.token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this._startPing();
      this._emit("connected");
    };

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      this._handleMessage(msg);
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      this._emit("error", error);
    };

    this.ws.onclose = () => {
      console.log("WebSocket disconnected");
      this._stopPing();
      this._emit("disconnected");
      this._attemptReconnect();
    };
  }

  disconnect() {
    this.maxReconnectAttempts = 0;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._stopPing();
  }

  updateToken(newToken) {
    this.token = newToken;
  }

  sendMessage(conversationId, text) {
    return this._request("sendMessage", { conversationId, text });
  }

  getMessages(conversationId, limit = 50, before = null) {
    const data = { conversationId, limit };
    if (before !== null) data.before = before;
    return this._request("getMessages", data);
  }

  getConversations(limit = 20) {
    return this._request("getConversations", { limit });
  }

  markRead(conversationId) {
    return this._request("markRead", { conversationId });
  }

  sendTyping(conversationId, isTyping = true) {
    this._send({ action: "typing", data: { conversationId, isTyping } });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const cbs = this.listeners.get(event);
    if (cbs) {
      const idx = cbs.indexOf(callback);
      if (idx > -1) cbs.splice(idx, 1);
    }
  }

  _request(action, data) {
    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.pendingRequests.set(requestId, { resolve, reject });
      this._send({ action, data, requestId });

      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Request timeout: ${action}`));
        }
      }, 30000);
    });
  }

  _send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn("WebSocket not open, cannot send:", payload.action);
    }
  }

  _handleMessage(msg) {
    if (msg.type === "PONG") return;

    if (msg.type === "response" && msg.requestId) {
      const pending = this.pendingRequests.get(msg.requestId);
      if (pending) {
        this.pendingRequests.delete(msg.requestId);
        if (msg.success) {
          pending.resolve(msg.data);
        } else {
          pending.reject(new Error(msg.error?.message || "Request failed"));
        }
      }
    } else if (msg.type === "event") {
      this._emit(msg.event, msg.data);
    }
  }

  _emit(event, data) {
    const cbs = this.listeners.get(event);
    if (cbs) cbs.forEach((cb) => cb(data));
  }

  _startPing() {
    this.pingInterval = setInterval(() => {
      this._send({ action: "ping" });
    }, 30000);
  }

  _stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(
        `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
      );
      setTimeout(() => this.connect(), delay);
    } else {
      this._emit("reconnectFailed");
    }
  }
}

export default WebSocketMessagingClient;
