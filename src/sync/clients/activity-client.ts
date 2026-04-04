import type { SyncStatus } from "../types.js";

/**
 * Order fill event from activity stream (published via PG logical replication from Ponder).
 *
 * Two sources:
 * - orders_matched:{marketId} channel: includes maker, taker, transactionHash, blockNumber
 * - user:{address} channel: does not include maker/taker (user already knows their address)
 */
export interface OrderFillEvent {
  type: "order_fill";
  marketId: string | null;
  orderHash: string;
  /** Maker address (null for user channel messages) */
  maker: string | null;
  /** Taker address (null for user channel messages) */
  taker: string | null;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  optionTokenId: string | null;
  transactionHash: string | null;
  blockNumber: string | null;
  /** Blockchain timestamp (seconds since epoch, null for user channel) */
  timestamp: string | null;
}

export interface ActivityClientConfig {
  wsUrl: string;
  /** Subscribe to fills for this market (orders_matched:marketId) */
  marketId?: string;
  /** Subscribe to fills for this user address (user_info:address) */
  userAddress?: string;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  maxReconnectAttempts?: number;
  initialReconnectDelayMs?: number;
  maxReconnectDelayMs?: number;
}

/**
 * Client for activity streams: order fills per market (orders_matched) and per user (user_info).
 * Connects to the same worker as MarketDepthSyncClient; use WORKER_MODES that include "activity".
 *
 * No ordering or gap handling — we accept every order_fill message as it arrives.
 */
export class ActivitySyncClient {
  private ws: WebSocket | null = null;
  private config: ActivityClientConfig;
  private status: SyncStatus = "disconnected";

  private fillListeners: Set<(event: OrderFillEvent) => void> = new Set();
  private userFillListeners: Set<(event: OrderFillEvent) => void> = new Set();
  private marketFillListeners: Set<(event: OrderFillEvent) => void> = new Set();
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();

  private shouldBeConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastPongTime = 0;

  private visibilityChangeHandler: (() => void) | null = null;

  constructor(config: ActivityClientConfig) {
    if (!config.marketId && !config.userAddress) {
      throw new Error(
        "ActivitySyncClient requires at least one of marketId or userAddress",
      );
    }
    this.config = {
      heartbeatIntervalMs: 30000,
      heartbeatTimeoutMs: 10000,
      maxReconnectAttempts: Infinity,
      initialReconnectDelayMs: 1000,
      maxReconnectDelayMs: 30000,
      ...config,
    };
  }

  /** Connects to the activity websocket and subscribes to market and/or user channels. */
  async connect(): Promise<void> {
    this.clearReconnectTimeout();
    this.removeVisibilityChangeHandler();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.shouldBeConnected = true;
    this.setStatus("connecting");

    this.setupVisibilityChangeHandler();

    const wsUrl = this.config.wsUrl;
    if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      throw new Error(`Invalid WebSocket URL: ${wsUrl}`);
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      const expectedSubscriptions = new Set<string>();
      if (this.config.marketId) expectedSubscriptions.add("orders_matched");
      if (this.config.userAddress) expectedSubscriptions.add("user_info");

      const resolveOnce = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      const rejectOnce = (error: unknown) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.lastPongTime = Date.now();

        if (this.config.marketId) {
          this.ws!.send(
            JSON.stringify({
              type: "subscribe",
              channel: "orders_matched",
              marketId: this.config.marketId,
            }),
          );
        }
        if (this.config.userAddress) {
          this.ws!.send(
            JSON.stringify({
              type: "subscribe",
              channel: "user_info",
              userAddress: this.config.userAddress,
            }),
          );
        }

        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);

          if (msg.type === "pong") {
            this.lastPongTime = Date.now();
            this.clearHeartbeatTimeout();
            return;
          }

          if (msg.type === "subscribed") {
            if (typeof msg.channel === "string") {
              expectedSubscriptions.delete(msg.channel);
            }
            if (expectedSubscriptions.size === 0) {
              this.setStatus("synced");
              resolveOnce();
            }
            return;
          }

          if (msg.type === "unsubscribed") {
            return;
          }

          if (msg.type === "error") {
            const error = new Error(
              typeof msg.message === "string"
                ? msg.message
                : "Activity websocket subscription failed",
            );
            console.error("[ActivitySyncClient] error:", msg.message);
            if (!settled) {
              rejectOnce(error);
              this.handleConnectionLost();
            }
            return;
          }

          // Accept fill events (no seq/gap checks)
          // "order_fill" comes from orders_matched:{marketId} channel
          // "fill" comes from user_info:{address} channel
          if (msg.type === "order_fill" || msg.type === "fill") {
            const isFromUserChannel = msg.type === "fill";
            const isFromMarketChannel = msg.type === "order_fill";

            const fill: OrderFillEvent = {
              type: "order_fill",
              marketId: msg.marketId ?? null,
              orderHash: msg.orderHash,
              maker: msg.maker ?? null,
              taker: msg.taker ?? null,
              makerAsset: msg.makerAsset ?? "",
              takerAsset: msg.takerAsset ?? "",
              makingAmount: msg.makingAmount,
              takingAmount: msg.takingAmount,
              optionTokenId: msg.optionTokenId ?? null,
              transactionHash: msg.transactionHash ?? null,
              blockNumber: msg.blockNumber ?? null,
              timestamp: msg.timestamp ?? null,
            };

            // Notify generic fill listeners (all events)
            this.fillListeners.forEach((listener) => {
              try {
                listener(fill);
              } catch (e) {
                console.error("Error in fill listener:", e);
              }
            });

            // Notify user-specific listeners (only events from user_info channel)
            if (isFromUserChannel) {
              this.userFillListeners.forEach((listener) => {
                try {
                  listener(fill);
                } catch (e) {
                  console.error("Error in user fill listener:", e);
                }
              });
            }

            // Notify market-specific listeners (only events from orders_matched channel)
            if (isFromMarketChannel) {
              this.marketFillListeners.forEach((listener) => {
                try {
                  listener(fill);
                } catch (e) {
                  console.error("Error in market fill listener:", e);
                }
              });
            }
          }
        } catch (e) {
          console.error("Error parsing activity message:", e);
        }
      };

      this.ws.onerror = (err) => {
        if (this.status === "connecting") rejectOnce(err);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setStatus("disconnected");
        if (!settled) {
          rejectOnce(
            new Error(
              "WebSocket closed before subscriptions were acknowledged",
            ),
          );
        }
        if (this.shouldBeConnected) this.scheduleReconnect();
      };
    });
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatIntervalId = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      try {
        this.ws.send(JSON.stringify({ type: "ping" }));
        this.clearHeartbeatTimeout();
        this.heartbeatTimeoutId = setTimeout(() => {
          this.handleConnectionLost();
        }, this.config.heartbeatTimeoutMs!);
      } catch {
        this.handleConnectionLost();
      }
    }, this.config.heartbeatIntervalMs!);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
    this.clearHeartbeatTimeout();
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  private setupVisibilityChangeHandler(): void {
    if (typeof document === "undefined") return;
    this.removeVisibilityChangeHandler();
    this.visibilityChangeHandler = () => {
      if (document.visibilityState === "visible" && this.shouldBeConnected) {
        this.checkConnectionHealth();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
  }

  private removeVisibilityChangeHandler(): void {
    if (typeof document === "undefined") return;
    if (this.visibilityChangeHandler) {
      document.removeEventListener(
        "visibilitychange",
        this.visibilityChangeHandler,
      );
      this.visibilityChangeHandler = null;
    }
  }

  private checkConnectionHealth(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (this.shouldBeConnected) this.handleConnectionLost();
      return;
    }
    try {
      this.ws.send(JSON.stringify({ type: "ping" }));
      this.clearHeartbeatTimeout();
      this.heartbeatTimeoutId = setTimeout(() => {
        this.handleConnectionLost();
      }, this.config.heartbeatTimeoutMs!);
    } catch {
      this.handleConnectionLost();
    }
  }

  private handleConnectionLost(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.setStatus("disconnected");
    if (this.shouldBeConnected) this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (!this.shouldBeConnected) return;
    const max = this.config.maxReconnectAttempts!;
    if (this.reconnectAttempts >= max) {
      console.error(
        `[ActivitySyncClient] Max reconnect attempts (${max}) reached`,
      );
      return;
    }
    const base = this.config.initialReconnectDelayMs!;
    const cap = this.config.maxReconnectDelayMs!;
    const delay = Math.min(
      base * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      cap,
    );
    this.reconnectAttempts++;
    this.setStatus("recovering");
    this.clearReconnectTimeout();
    this.reconnectTimeoutId = setTimeout(() => {
      this.connect().catch((e) =>
        console.error("[ActivitySyncClient] Reconnect failed:", e),
      );
    }, delay);
  }

  private setStatus(status: SyncStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (e) {
        console.error("Error in status listener:", e);
      }
    });
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  /** Returns true once the websocket has an active subscription. */
  isSynced(): boolean {
    return this.status === "synced";
  }

  /** Registers a listener for connection lifecycle updates. */
  onStatus(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  /** Subscribes to all normalized fill events regardless of source channel. */
  onOrderFill(callback: (event: OrderFillEvent) => void): () => void {
    this.fillListeners.add(callback);
    return () => this.fillListeners.delete(callback);
  }

  /** Subscribe to fills from user_info channel only (user's orders being filled) */
  onUserFill(callback: (event: OrderFillEvent) => void): () => void {
    this.userFillListeners.add(callback);
    return () => this.userFillListeners.delete(callback);
  }

  /** Subscribe to fills from orders_matched channel only (market activity) */
  onMarketFill(callback: (event: OrderFillEvent) => void): () => void {
    this.marketFillListeners.add(callback);
    return () => this.marketFillListeners.delete(callback);
  }

  /** Closes the websocket, unsubscribes active channels, and stops reconnects. */
  async disconnect(): Promise<void> {
    this.shouldBeConnected = false;
    this.clearReconnectTimeout();
    this.removeVisibilityChangeHandler();
    this.stopHeartbeat();
    this.reconnectAttempts = 0;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (this.config.marketId) {
        try {
          this.ws.send(
            JSON.stringify({
              type: "unsubscribe",
              channel: "orders_matched",
              marketId: this.config.marketId,
            }),
          );
        } catch {
          /* ignore */
        }
      }
      if (this.config.userAddress) {
        try {
          this.ws.send(
            JSON.stringify({
              type: "unsubscribe",
              channel: "user_info",
              userAddress: this.config.userAddress,
            }),
          );
        } catch {
          /* ignore */
        }
      }
      this.ws.onclose = null;
      this.ws.close();
    }
    this.ws = null;
    this.setStatus("disconnected");
  }
}
