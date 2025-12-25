type Handler<T = any> = (data: T) => void;

export class RedisWsClient {
  private ws!: WebSocket;
  private handlers = new Map<string, Set<Handler>>();
  private heartbeat?: number;

  constructor(private url: string) {
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.startHeartbeat();
      // Re-subscribe to all channels after reconnection
      for (const channel of this.handlers.keys()) {
        this.subscribeInternal(channel);
      }
    };

    this.ws.onmessage = (event) => {
      const message = event.data as string;
      // Redis messages come directly as strings from the bridge
      // Since we subscribe to one channel per client instance in practice,
      // we can call all handlers
      for (const handlers of this.handlers.values()) {
        handlers.forEach((fn) => fn(message));
      }
    };

    this.ws.onclose = () => this.reconnect();
    this.ws.onerror = () => this.ws.close();
  }

  private reconnect() {
    this.stopHeartbeat();
    setTimeout(() => this.connect(), 1000);
  }

  private startHeartbeat() {
    this.heartbeat = setInterval(() => {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 20_000) as unknown as number;
  }

  private stopHeartbeat() {
    if (this.heartbeat) clearInterval(this.heartbeat);
  }

  subscribe<T>(channel: string, handler: Handler<T>) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
      this.subscribeInternal(channel);
    }
    this.handlers.get(channel)!.add(handler);
  }

  unsubscribe(channel: string, handler?: Handler) {
    const handlers = this.handlers.get(channel);
    if (!handlers) return;

    if (handler) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(channel);
        this.unsubscribeInternal(channel);
      }
    } else {
      this.handlers.delete(channel);
      this.unsubscribeInternal(channel);
    }
  }

  private subscribeInternal(channel: string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "subscribe",
          channel,
        })
      );
    }
  }

  private unsubscribeInternal(channel: string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "unsubscribe",
          channel,
        })
      );
    }
  }

  close() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}
