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

export interface OrderUpdateEvent {
  type: "fill" | "order_update";
  orderHash: string;
  marketId?: string;
  tokenId?: string;
  status?: string;
  remainingAmount?: string;
  [extra: string]: unknown;
}

export interface ActivityClientConfig {
  wsUrl: string;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  maxReconnectDelayMs?: number;
  initialReconnectDelayMs?: number;
}

type FillCallback        = (event: OrderFillEvent) => void;
type OrderUpdateCallback = (event: OrderUpdateEvent) => void;

/**
 * Multi-market, multi-user activity sync client.
 *
 * One WebSocket handles all subscriptions. Use:
 *   - subscribeMarket(marketId) / unsubscribeMarket(marketId) for fill streams
 *   - subscribeUser(address)   / unsubscribeUser(address)    for user order updates
 *
 * All subscriptions are re-sent automatically on reconnect.
 */
export class ActivitySyncClient {
  private ws: WebSocket | null = null;
  private config: Required<ActivityClientConfig>;
  private status: SyncStatus = "disconnected";

  private shouldBeConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** Active market subscriptions: marketId → Set of callbacks */
  private marketListeners = new Map<string, Set<FillCallback>>();
  /** Active user subscriptions: address → Set of callbacks */
  private userListeners = new Map<string, Set<OrderUpdateCallback>>();
  /** Generic fill listeners (all markets) */
  private fillListeners = new Set<FillCallback>();
  /** Status listeners */
  private statusListeners = new Set<(s: SyncStatus) => void>();

  constructor(config: ActivityClientConfig) {
    this.config = {
      heartbeatIntervalMs: 25_000,
      heartbeatTimeoutMs:  10_000,
      initialReconnectDelayMs: 1_000,
      maxReconnectDelayMs: 30_000,
      ...config,
    };
  }

  // ── Connection lifecycle ──────────────────────────────────────────────────

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return Promise.resolve();
    }
    this.clearReconnectTimeout();
    this.shouldBeConnected = true;
    this.setStatus("connecting");

    return new Promise((resolve, reject) => {
      let settled = false;
      const done = (err?: unknown) => {
        if (settled) return;
        settled = true;
        err ? reject(err) : resolve();
      };

      try {
        this.ws = new WebSocket(this.config.wsUrl);
      } catch (e) {
        done(e);
        this.scheduleReconnect();
        return;
      }

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.resubscribeAll();
        this.startHeartbeat();
        this.setStatus("synced");
        done();
      };

      this.ws.onmessage = (ev) => this.handleMessage(ev);

      this.ws.onerror = () => {
        done(new Error("ActivitySyncClient WebSocket error"));
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setStatus("disconnected");
        done(new Error("WebSocket closed"));
        if (this.shouldBeConnected) this.scheduleReconnect();
      };
    });
  }

  disconnect(): void {
    this.shouldBeConnected = false;
    this.clearReconnectTimeout();
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onclose = null;
      try { this.ws.close(); } catch { /* noop */ }
      this.ws = null;
    }
    this.setStatus("disconnected");
  }

  getStatus(): SyncStatus { return this.status; }
  isSynced(): boolean { return this.status === "synced"; }

  // ── Market subscriptions ──────────────────────────────────────────────────

  subscribeMarket(marketId: string, callback: FillCallback): () => void {
    if (!this.marketListeners.has(marketId)) {
      this.marketListeners.set(marketId, new Set());
      // First subscriber — send subscribe to server
      this.send({ type: "subscribe_fills", marketId });
    }
    this.marketListeners.get(marketId)!.add(callback);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) this.connect().catch(() => {});

    return () => {
      const set = this.marketListeners.get(marketId);
      if (!set) return;
      set.delete(callback);
      if (set.size === 0) {
        this.marketListeners.delete(marketId);
        this.send({ type: "unsubscribe_fills", marketId });
        if (this.marketListeners.size === 0 && this.userListeners.size === 0) this.disconnect();
      }
    };
  }

  // ── User subscriptions ────────────────────────────────────────────────────

  subscribeUser(address: string, callback: OrderUpdateCallback): () => void {
    if (!this.userListeners.has(address)) {
      this.userListeners.set(address, new Set());
      this.send({ type: "subscribe_user", address });
    }
    this.userListeners.get(address)!.add(callback);
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) this.connect().catch(() => {});

    return () => {
      const set = this.userListeners.get(address);
      if (!set) return;
      set.delete(callback);
      if (set.size === 0) {
        this.userListeners.delete(address);
        this.send({ type: "unsubscribe_user", address });
        if (this.marketListeners.size === 0 && this.userListeners.size === 0) this.disconnect();
      }
    };
  }

  // ── Generic listeners ─────────────────────────────────────────────────────

  /** Fires for every fill event regardless of market or user channel. */
  onFill(callback: FillCallback): () => void {
    this.fillListeners.add(callback);
    return () => this.fillListeners.delete(callback);
  }

  onStatus(callback: (s: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private send(msg: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try { this.ws.send(JSON.stringify(msg)); } catch { /* noop */ }
    }
  }

  private resubscribeAll(): void {
    for (const marketId of this.marketListeners.keys()) {
      this.send({ type: "subscribe_fills", marketId });
    }
    for (const address of this.userListeners.keys()) {
      this.send({ type: "subscribe_user", address });
    }
  }

  private handleMessage(ev: MessageEvent): void {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(ev.data as string); } catch { return; }

    const type = msg.type as string | undefined;

    if (type === "pong") {
      this.clearHeartbeatTimeout();
      return;
    }

    if (type === "order_fill") {
      const fill = this.normalizeFill(msg);
      this.fillListeners.forEach((cb) => { try { cb(fill); } catch { /* noop */ } });
      const mid = fill.marketId;
      if (mid) {
        this.marketListeners.get(mid)?.forEach((cb) => { try { cb(fill); } catch { /* noop */ } });
      }
      return;
    }

    if (type === "fill" || type === "order_update") {
      const ev: OrderUpdateEvent = {
        type: type as "fill" | "order_update",
        orderHash: msg.orderHash as string,
        marketId:  msg.marketId as string | undefined,
        tokenId:   msg.tokenId  as string | undefined,
        status:    msg.status   as string | undefined,
        remainingAmount: msg.remainingAmount as string | undefined,
        ...msg,
      };
      for (const cbs of this.userListeners.values()) {
        cbs.forEach((cb) => { try { cb(ev); } catch { /* noop */ } });
      }
    }
  }

  private normalizeFill(msg: Record<string, unknown>): OrderFillEvent {
    return {
      type:            "order_fill",
      marketId:        (msg.marketId ?? null) as string | null,
      orderHash:       msg.orderHash as string,
      maker:           (msg.maker ?? null) as string | null,
      taker:           (msg.taker ?? null) as string | null,
      makerAsset:      (msg.makerAsset ?? "") as string,
      takerAsset:      (msg.takerAsset ?? "") as string,
      makingAmount:    msg.makingAmount as string,
      takingAmount:    msg.takingAmount as string,
      optionTokenId:   (msg.optionTokenId ?? null) as string | null,
      transactionHash: (msg.transactionHash ?? null) as string | null,
      blockNumber:     (msg.blockNumber ?? null) as string | null,
      timestamp:       (msg.timestamp ?? null) as string | null,
    };
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatIntervalId = setInterval(() => {
      this.send({ type: "ping" });
      this.heartbeatTimeoutId = setTimeout(() => {
        this.handleConnectionLost();
      }, this.config.heartbeatTimeoutMs);
    }, this.config.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) { clearInterval(this.heartbeatIntervalId); this.heartbeatIntervalId = null; }
    this.clearHeartbeatTimeout();
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutId) { clearTimeout(this.heartbeatTimeoutId); this.heartbeatTimeoutId = null; }
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) { clearTimeout(this.reconnectTimeoutId); this.reconnectTimeoutId = null; }
  }

  private handleConnectionLost(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.onclose = null;
      try { this.ws.close(); } catch { /* noop */ }
      this.ws = null;
    }
    this.setStatus("disconnected");
    if (this.shouldBeConnected) this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    const base  = this.config.initialReconnectDelayMs;
    const cap   = this.config.maxReconnectDelayMs;
    const delay = Math.min(base * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000, cap);
    this.reconnectAttempts++;
    this.setStatus("recovering");
    this.clearReconnectTimeout();
    this.reconnectTimeoutId = setTimeout(() => {
      this.connect().catch(() => {});
    }, delay);
  }

  private setStatus(status: SyncStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((cb) => { try { cb(status); } catch { /* noop */ } });
  }
}
