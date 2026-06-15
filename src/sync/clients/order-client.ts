import type { SyncStatus } from "../types.js";

function scheduleDeferred(callback: () => void): void {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(callback);
    return;
  }
  setTimeout(callback, 0);
}

function normalizePrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return num.toString();
}

export interface DepthLevel {
  price: string;
  depth: string;
}

/** A market + its token IDs to subscribe to. */
export interface MarketSpec {
  marketId: string;
  tokenIds: string[];
}

/** Current depth state for a token within a market subscription. */
export interface TokenDepthSnapshot {
  tokenId: string;
  bids: DepthLevel[];
  asks: DepthLevel[];
  bestBid: string | null;
  bestAsk: string | null;
  bestBidAt: number | null;
  bestAskAt: number | null;
  lastPrice: string | null;
  /** ms epoch when lastPrice was set on the server, or null if unknown. */
  lastPriceAt: number | null;
  seq: number;
}

/** One bid or ask level change in the normalized SDK format. */
export interface DepthLevelUpdate {
  side: "bid" | "ask";
  price: string;
  depth: string;
}

/** Raw level shape inside the wire `depth_update.levels[]` array. */
interface WireDepthLevel {
  side: "bid" | "ask";
  price: string;
  depth: string;
  seq: string;
  localSeq?: number;
}

/** Raw `depth_update` frame as published by the depth projector. */
interface WireDepthUpdate {
  type: "depth_update";
  marketId: string;
  tokenId: string;
  startSeq: string;
  endSeq: string;
  levels: WireDepthLevel[];
}

/** Consolidated depth update emitted to SDK listeners after normalization. */
export interface DepthUpdate {
  tokenId: string;
  levels: DepthLevelUpdate[];
  bestBid: string | null;
  bestAsk: string | null;
  bestBidAt: number | null;
  bestAskAt: number | null;
  lastPrice: string | null;
  /** ms epoch when lastPrice was set on the server, or null if unknown. */
  lastPriceAt: number | null;
  /** Last applied executor sequenceId for this token (== endSeq of the frame). */
  seq: number;
  /** Range covered by this frame; clients can detect gaps via startSeq != prevSeq + 1. */
  startSeq: number;
  endSeq: number;
}

/**
 * Configuration for the market depth websocket client.
 *
 * Supports multiple markets over a single WebSocket connection.
 * Markets can be added/removed dynamically via subscribeMarket / unsubscribeMarket
 * without closing the connection.
 */
export interface MarketDepthClientConfig {
  wsUrl: string;
  /** Initial market subscriptions. More can be added later via subscribeMarket(). */
  markets?: MarketSpec[];
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatIntervalMs?: number;
  /** Heartbeat timeout - if no pong received within this time, reconnect (default: 10000) */
  heartbeatTimeoutMs?: number;
  /** Max reconnection attempts before giving up (default: Infinity) */
  maxReconnectAttempts?: number;
  /** Initial reconnect delay in ms (default: 1000) */
  initialReconnectDelayMs?: number;
  /** Max reconnect delay in ms (default: 30000) */
  maxReconnectDelayMs?: number;
}

/** @deprecated Use MarketDepthClientConfig with markets[] instead of marketId+tokenIds. */
export interface LegacyMarketDepthClientConfig extends MarketDepthClientConfig {
  marketId?: string;
  tokenIds?: string[];
}

// Internal state per token
interface TokenDepthState {
  bids: Map<string, string>; // price → depth
  asks: Map<string, string>; // price → depth
  bestBid: string | null;
  bestAsk: string | null;
  bestBidAt: number | null;
  bestAskAt: number | null;
  lastPrice: string | null;
  lastPriceAt: number | null;
  seq: number;
}

/**
 * Client for syncing orderbook depth data for one or more markets over a
 * single persistent WebSocket connection.
 *
 * Usage:
 *   const client = new MarketDepthSyncClient({ wsUrl: "wss://..." });
 *   await client.connect();
 *
 *   // Subscribe to markets dynamically (e.g. when they scroll into view)
 *   client.subscribeMarket("5", ["0xabc..."]);
 *
 *   // Unsubscribe without closing the connection (e.g. scrolled out of view)
 *   client.unsubscribeMarket("5");
 *
 *   // Listen for updates
 *   const offDelta = client.onDelta((marketId, update) => { ... });
 *   const offSnap  = client.onSnapshot((marketId, snapshots) => { ... });
 *
 *   // Full disconnect (app teardown)
 *   await client.disconnect();
 */
export class MarketDepthSyncClient {
  private ws: WebSocket | null = null;
  private config: Required<MarketDepthClientConfig>;
  private status: SyncStatus = "disconnected";

  // Per-token depth state (tokenIds are globally unique across all subscribed markets)
  private tokenStates: Map<string, TokenDepthState> = new Map();

  // Active subscriptions: marketId → tokenIds[]
  private activeSubscriptions: Map<string, string[]> = new Map();

  // Reverse map: tokenId → marketId (for gap resync targeting)
  private tokenToMarket: Map<string, string> = new Map();

  // Markets that have received their initial snapshot on this connection
  private syncedMarkets: Set<string> = new Set();

  // Per-market frame queues: buffer depth_updates received before snapshot
  private frameQueues: Map<string, WireDepthUpdate[]> = new Map();

  // Per-market processing mutex
  private processingMarkets: Set<string> = new Set();

  // Listeners
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private snapshotListeners: Set<(marketId: string, snapshots: TokenDepthSnapshot[]) => void> = new Set();
  private deltaListeners: Set<(marketId: string, update: DepthUpdate) => void> = new Set();

  // Reconnection state
  private shouldBeConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Heartbeat
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastPongTime: number = 0;

  // Visibility handler
  private visibilityChangeHandler: (() => void) | null = null;

  constructor(config: LegacyMarketDepthClientConfig) {
    // Support legacy single-market config (marketId + tokenIds)
    const normalizedConfig: MarketDepthClientConfig = { ...config };
    if ((config as any).marketId && (config as any).tokenIds) {
      normalizedConfig.markets = [
        { marketId: (config as any).marketId, tokenIds: (config as any).tokenIds },
        ...(config.markets ?? []),
      ];
    }

    this.config = {
      markets: [],
      heartbeatIntervalMs: 30000,
      heartbeatTimeoutMs: 10000,
      maxReconnectAttempts: Infinity,
      initialReconnectDelayMs: 1000,
      maxReconnectDelayMs: 30000,
      ...normalizedConfig,
    };

    // Seed initial subscriptions from config
    for (const spec of this.config.markets) {
      this.activeSubscriptions.set(spec.marketId, [...spec.tokenIds]);
      for (const tokenId of spec.tokenIds) {
        this.tokenToMarket.set(tokenId, spec.marketId);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Open the WebSocket connection and subscribe to all configured markets. */
  async connect(): Promise<void> {
    this.stopHeartbeat();
    this.clearReconnectTimeout();

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.shouldBeConnected = true;
    this.syncedMarkets.clear();
    this.frameQueues.clear();
    this.processingMarkets.clear();
    this.setStatus("connecting");

    const wsUrl = this.config.wsUrl;
    if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      throw new Error(`Invalid WebSocket URL: ${wsUrl}`);
    }

    this.setupVisibilityChangeHandler();

    return new Promise((resolve, reject) => {
      let settled = false;
      const resolveOnce = () => { if (!settled) { settled = true; resolve(); } };
      const rejectOnce = (e: unknown) => { if (!settled) { settled = true; reject(e); } };

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.lastPongTime = Date.now();
        this.startHeartbeat();

        if (this.activeSubscriptions.size === 0) {
          this.setStatus("synced");
          resolveOnce();
        } else {
          for (const [marketId, tokenIds] of this.activeSubscriptions) {
            this._sendSubscribeMarket(marketId, tokenIds);
          }
          // Resolve immediately once WS is open — snapshots arrive async
          resolveOnce();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);

          if (msg.type === "pong") {
            this.lastPongTime = Date.now();
            this.clearHeartbeatTimeout();
            return;
          }

          if (msg.type === "subscribed_market") {
            this.handleSubscribedMarket(msg);
          } else if (msg.type === "depth_update") {
            this.handleDepthUpdate(msg as WireDepthUpdate);
          } else if (msg.type === "market_state") {
            this.handleMarketStateUpdate(msg);
          } else if (msg.type === "last_price") {
            this.handleLastPriceUpdate(msg);
          } else if (msg.type === "error") {
            console.error("[MarketDepthSyncClient] server error:", msg.message);
            rejectOnce(new Error(msg.message));
          }
        } catch (error) {
          console.error("[MarketDepthSyncClient] parse error:", error);
        }
      };

      this.ws.onerror = (error) => {
        if (this.status === "connecting") {
          rejectOnce(error);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.syncedMarkets.clear();
        this.setStatus("disconnected");

        if (!settled) {
          rejectOnce(new Error("[MarketDepthSyncClient] WebSocket closed before connecting"));
        }

        if (this.shouldBeConnected) {
          this.scheduleReconnect();
        }
      };
    });
  }

  /**
   * Subscribe to a market's depth. If the WebSocket is already open, sends the
   * `subscribe_market` message immediately. Otherwise, the subscription is queued
   * and sent when the connection opens. Calling this for an already-subscribed
   * market re-requests a fresh snapshot.
   */
  subscribeMarket(marketId: string, tokenIds: string[]): void {
    this.activeSubscriptions.set(marketId, [...tokenIds]);
    for (const tokenId of tokenIds) {
      this.tokenToMarket.set(tokenId, marketId);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this._sendSubscribeMarket(marketId, tokenIds);
    }
  }

  /**
   * Unsubscribe from a market. Sends `unsubscribe_market` to the server and
   * clears local state for that market's tokens. The WebSocket connection is
   * kept open for other subscriptions.
   */
  unsubscribeMarket(marketId: string): void {
    const tokenIds = this.activeSubscriptions.get(marketId) ?? [];
    this.activeSubscriptions.delete(marketId);
    this.syncedMarkets.delete(marketId);
    this.frameQueues.delete(marketId);
    this.processingMarkets.delete(marketId);

    for (const tokenId of tokenIds) {
      this.tokenStates.delete(tokenId);
      this.tokenToMarket.delete(tokenId);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: "unsubscribe_market", marketId }));
      } catch {
        // Ignore — connection closing
      }
    }
  }

  /** Fully disconnect and stop reconnecting. */
  async disconnect(): Promise<void> {
    this.shouldBeConnected = false;
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    this.removeVisibilityChangeHandler();

    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }

    this.syncedMarkets.clear();
    this.setStatus("disconnected");
  }

  getStatus(): SyncStatus { return this.status; }

  isSynced(): boolean {
    if (this.activeSubscriptions.size === 0) return this.status === "synced";
    return this.activeSubscriptions.size === this.syncedMarkets.size;
  }

  isMarketSynced(marketId: string): boolean {
    return this.syncedMarkets.has(marketId);
  }

  getBids(tokenId: string): DepthLevel[] {
    const state = this.tokenStates.get(tokenId);
    if (!state) return [];
    return Array.from(state.bids.entries()).map(([price, depth]) => ({ price, depth }));
  }

  getAsks(tokenId: string): DepthLevel[] {
    const state = this.tokenStates.get(tokenId);
    if (!state) return [];
    return Array.from(state.asks.entries()).map(([price, depth]) => ({ price, depth }));
  }

  getBestBid(tokenId: string): string | null {
    return this.tokenStates.get(tokenId)?.bestBid ?? null;
  }

  getBestAsk(tokenId: string): string | null {
    return this.tokenStates.get(tokenId)?.bestAsk ?? null;
  }

  getLastPrice(tokenId: string): string | null {
    return this.tokenStates.get(tokenId)?.lastPrice ?? null;
  }

  onSnapshot(listener: (marketId: string, snapshots: TokenDepthSnapshot[]) => void): () => void {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  }

  onDelta(listener: (marketId: string, update: DepthUpdate) => void): () => void {
    this.deltaListeners.add(listener);
    return () => this.deltaListeners.delete(listener);
  }

  onStatus(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  // ---------------------------------------------------------------------------
  // Private — WS message handlers
  // ---------------------------------------------------------------------------

  private _sendSubscribeMarket(marketId: string, tokenIds: string[]): void {
    // Clear stale state so we get a clean snapshot
    const existingTokenIds = this.activeSubscriptions.get(marketId) ?? tokenIds;
    for (const tokenId of existingTokenIds) {
      this.tokenStates.delete(tokenId);
    }
    this.syncedMarkets.delete(marketId);
    this.frameQueues.delete(marketId);

    try {
      this.ws!.send(JSON.stringify({ type: "subscribe_market", marketId, tokenIds }));
    } catch (e) {
      console.warn("[MarketDepthSyncClient] failed to send subscribe_market:", e);
    }
  }

  private handleSubscribedMarket(msg: {
    marketId: string;
    tokenIds: string[];
    snapshots: TokenDepthSnapshot[];
  }): void {
    const { marketId, snapshots } = msg;

    for (const snapshot of snapshots) {
      const state: TokenDepthState = {
        bids: new Map(),
        asks: new Map(),
        bestBid: snapshot.bestBid,
        bestAsk: snapshot.bestAsk,
        bestBidAt: (snapshot as any).bestBidAt ?? null,
        bestAskAt: (snapshot as any).bestAskAt ?? null,
        lastPrice: snapshot.lastPrice,
        lastPriceAt: (snapshot as any).lastPriceAt ?? null,
        seq: snapshot.seq,
      };
      for (const level of snapshot.bids) {
        state.bids.set(normalizePrice(level.price), level.depth);
      }
      for (const level of snapshot.asks) {
        state.asks.set(normalizePrice(level.price), level.depth);
      }
      this.tokenStates.set(String(snapshot.tokenId), state);
    }

    this.syncedMarkets.add(marketId);

    if (this.activeSubscriptions.size > 0 &&
        this.syncedMarkets.size >= this.activeSubscriptions.size) {
      this.setStatus("synced");
    }

    this.snapshotListeners.forEach((listener) => {
      try { listener(marketId, snapshots); } catch (e) { console.error(e); }
    });

    // Process any buffered depth_updates for this market
    void this.processFrameQueue(marketId);
  }

  private handleDepthUpdate(msg: WireDepthUpdate): void {
    const { marketId } = msg;

    if (!this.syncedMarkets.has(marketId)) {
      // Buffer until snapshot arrives
      if (!this.frameQueues.has(marketId)) {
        this.frameQueues.set(marketId, []);
      }
      this.frameQueues.get(marketId)!.push(msg);
      return;
    }

    if (!this.frameQueues.has(marketId)) {
      this.frameQueues.set(marketId, []);
    }
    this.frameQueues.get(marketId)!.push(msg);
    void this.processFrameQueue(marketId);
  }

  private handleMarketStateUpdate(msg: {
    marketId: string;
    tokenId: string;
    bestBid: string | null;
    bestAsk: string | null;
    bestBidAt?: number | null;
    bestAskAt?: number | null;
    lastPrice: string | null;
    lastPriceAt?: number | null;
  }): void {
    const state = this.tokenStates.get(String(msg.tokenId));
    if (!state) return;

    if (msg.bestBid != null) { state.bestBid = msg.bestBid; state.bestBidAt = msg.bestBidAt ?? state.bestBidAt; }
    if (msg.bestAsk != null) { state.bestAsk = msg.bestAsk; state.bestAskAt = msg.bestAskAt ?? state.bestAskAt; }
    if (msg.lastPrice != null) {
      state.lastPrice = msg.lastPrice;
      state.lastPriceAt = msg.lastPriceAt ?? state.lastPriceAt;
    }
    this.emitOutOfBandUpdate(msg.marketId, msg.tokenId, state);
  }

  private handleLastPriceUpdate(msg: {
    marketId?: string;
    tokenId: string;
    /** New batched format: all fill prices in this flush window. */
    prices?: Array<{ price: string; at: number }>;
    /** Legacy single-price format. */
    lastPrice?: string;
    lastPriceAt?: number | null;
  }): void {
    const state = this.tokenStates.get(String(msg.tokenId));
    if (!state) return;
    const marketId = msg.marketId ?? this.tokenToMarket.get(msg.tokenId) ?? "";

    if (msg.prices && msg.prices.length > 0) {
      // Emit one DepthUpdate per price so listeners see every fill price.
      for (const entry of msg.prices) {
        state.lastPrice = entry.price;
        state.lastPriceAt = entry.at;
        this.emitOutOfBandUpdate(marketId, msg.tokenId, state);
      }
    } else if (msg.lastPrice != null) {
      // Legacy single-price fallback.
      state.lastPrice = msg.lastPrice;
      state.lastPriceAt = msg.lastPriceAt ?? state.lastPriceAt;
      this.emitOutOfBandUpdate(marketId, msg.tokenId, state);
    }
  }

  private emitOutOfBandUpdate(marketId: string, tokenId: string, state: TokenDepthState): void {
    const update: DepthUpdate = {
      tokenId,
      levels: [],
      bestBid: state.bestBid,
      bestAsk: state.bestAsk,
      bestBidAt: state.bestBidAt,
      bestAskAt: state.bestAskAt,
      lastPrice: state.lastPrice,
      lastPriceAt: state.lastPriceAt,
      seq: state.seq,
      startSeq: state.seq,
      endSeq: state.seq,
    };
    this.deltaListeners.forEach((listener) => {
      try { listener(marketId, update); } catch (e) { console.error(e); }
    });
  }

  private async processFrameQueue(marketId: string): Promise<void> {
    if (this.processingMarkets.has(marketId)) return;
    this.processingMarkets.add(marketId);

    try {
      const queue = this.frameQueues.get(marketId);
      if (!queue) return;

      while (queue.length > 0) {
        const frame = queue.shift()!;
        const state = this.tokenStates.get(String(frame.tokenId));
        if (!state) continue;

        const startSeq = parseInt(frame.startSeq, 10);
        const endSeq = parseInt(frame.endSeq, 10);

        // endSeq=0 is a sentinel meaning "no sequence tracking" — always apply.
        // Non-zero endSeq <= state.seq means this frame was already applied.
        if (endSeq !== 0 && endSeq <= state.seq) continue;

        // Gap detection: warn and trigger resync for that specific market.
        if (state.seq > 0 && startSeq > 0 && startSeq > state.seq + 1) {
          console.warn(
            `[MarketDepthSyncClient] gap detected tokenId=${frame.tokenId} ` +
            `expected=${state.seq + 1} got=${startSeq} — resyncing market ${marketId}`,
          );
          // Re-subscribe to get a fresh snapshot (clears state, re-sends subscribe)
          const tokenIds = this.activeSubscriptions.get(marketId);
          if (tokenIds && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this._sendSubscribeMarket(marketId, tokenIds);
          }
          return; // Stop processing stale queue; new snapshot will restart it
        }

        const emittedLevels: DepthLevelUpdate[] = [];
        for (const lv of frame.levels) {
          const lvSeq = parseInt(lv.seq, 10);
          // lvSeq=0 means no sequence → always apply (same sentinel logic as endSeq)
          if (lvSeq !== 0 && lvSeq <= state.seq) continue;
          this.applyLevel(lv, state);
          emittedLevels.push({ side: lv.side, price: lv.price, depth: lv.depth });
        }

        // Advance seq only when endSeq is meaningful
        if (endSeq > state.seq) state.seq = endSeq;

        if (emittedLevels.length === 0) continue;

        const update: DepthUpdate = {
          tokenId: frame.tokenId,
          levels: emittedLevels,
          bestBid: state.bestBid,
          bestAsk: state.bestAsk,
          bestBidAt: state.bestBidAt,
          bestAskAt: state.bestAskAt,
          lastPrice: state.lastPrice,
          lastPriceAt: state.lastPriceAt,
          seq: state.seq,
          startSeq,
          endSeq,
        };

        this.deltaListeners.forEach((listener) => {
          try { listener(marketId, update); } catch (e) { console.error(e); }
        });
      }
    } finally {
      this.processingMarkets.delete(marketId);

      const queue = this.frameQueues.get(marketId);
      if (queue && queue.length > 0) {
        scheduleDeferred(() => { void this.processFrameQueue(marketId); });
      }
    }
  }

  private applyLevel(level: WireDepthLevel, state: TokenDepthState): void {
    const map = level.side === "bid" ? state.bids : state.asks;
    const depth = parseFloat(level.depth);
    const key = normalizePrice(level.price);

    if (depth <= 0) {
      map.delete(key);
    } else {
      map.set(key, level.depth);
    }

    if (level.side === "bid") {
      const bidPrices = Array.from(state.bids.keys()).map((p) => parseFloat(p));
      state.bestBid = bidPrices.length > 0 ? Math.max(...bidPrices).toString() : null;
    } else {
      const askPrices = Array.from(state.asks.keys()).map((p) => parseFloat(p));
      state.bestAsk = askPrices.length > 0 ? Math.min(...askPrices).toString() : null;
    }
  }

  private setStatus(status: SyncStatus): void {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => {
      try { listener(status); } catch (e) { console.error(e); }
    });
  }

  // ---------------------------------------------------------------------------
  // Private — reconnection & heartbeat
  // ---------------------------------------------------------------------------

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
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  private checkConnectionHealth(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.handleConnectionLost();
      return;
    }
    try {
      this.ws.send(JSON.stringify({ type: "ping" }));
      this.clearHeartbeatTimeout();
      this.heartbeatTimeoutId = setTimeout(() => {
        this.handleConnectionLost();
      }, this.config.heartbeatTimeoutMs);
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
    if (this.shouldBeConnected) {
      this.scheduleReconnect();
    }
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
        }, this.config.heartbeatTimeoutMs);
      } catch {
        this.handleConnectionLost();
      }
    }, this.config.heartbeatIntervalMs);
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

  private scheduleReconnect(): void {
    if (!this.shouldBeConnected) return;

    const maxAttempts = this.config.maxReconnectAttempts;
    if (this.reconnectAttempts >= maxAttempts) {
      console.error(`[MarketDepthSyncClient] max reconnect attempts (${maxAttempts}) reached`);
      return;
    }

    const baseDelay = this.config.initialReconnectDelayMs;
    const maxDelay = this.config.maxReconnectDelayMs;
    const delay = Math.min(
      baseDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      maxDelay,
    );
    this.reconnectAttempts++;
    this.setStatus("recovering");
    this.clearReconnectTimeout();
    this.reconnectTimeoutId = setTimeout(() => {
      void this.performReconnect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  private async performReconnect(): Promise<void> {
    if (!this.shouldBeConnected) return;
    try {
      // Clear snapshot state — will be re-populated from fresh snapshots
      this.tokenStates.clear();
      this.frameQueues.clear();
      this.processingMarkets.clear();
      await this.connect();
    } catch (error) {
      console.error("[MarketDepthSyncClient] reconnection failed:", error);
    }
  }
}
