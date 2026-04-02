import type { SyncStatus } from "../types.js";

/**
 * Normalize a price string to a canonical form for consistent map key lookups.
 * Converts "1.000000" and "1" both to "1" (removes trailing zeros after decimal).
 */
function normalizePrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return num.toString();
}

export interface DepthLevel {
  price: string;
  depth: string;
}

/** Current depth state for a token within a market subscription. */
export interface TokenDepthSnapshot {
  tokenId: string;
  bids: DepthLevel[];
  asks: DepthLevel[];
  bestBid: string | null;
  bestAsk: string | null;
  lastPrice: string | null;
  seq: number;
}

/** One bid or ask level change in the normalized SDK format. */
export interface DepthLevelUpdate {
  side: "bid" | "ask";
  price: string;
  depth: string;
}

/** One raw depth update event as published by the websocket service. */
export interface DepthChangeEvent {
  tokenId: string;
  side: "bid" | "ask";
  price: string;
  depth: string;
  seq: string;
}

/** Consolidated depth update emitted to SDK listeners after normalization. */
export interface DepthUpdate {
  tokenId: string;
  levels: DepthLevelUpdate[];
  bestBid: string | null;
  bestAsk: string | null;
  lastPrice: string | null;
  seq: number;
}

/** Configuration for the market depth websocket client. */
export interface MarketDepthClientConfig {
  wsUrl: string;
  marketId: string;
  tokenIds: string[];
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

// Internal state per token
interface TokenDepthState {
  bids: Map<string, string>; // price -> depth
  asks: Map<string, string>; // price -> depth
  bestBid: string | null;
  bestAsk: string | null;
  lastPrice: string | null;
  seq: number; // Current sequence ID for this token
}

/**
 * Client for syncing orderbook depth data for multiple tokens in a market.
 * Seq is per market+token (gapless, monotonic). Each token tracks its own seq for dedup and gap detection.
 */
export class MarketDepthSyncClient {
  private ws: WebSocket | null = null;
  private config: MarketDepthClientConfig;
  private status: SyncStatus = "disconnected";

  // Per-token depth state (each token has its own gapless seq counter)
  private tokenStates: Map<string, TokenDepthState> = new Map();

  // Message queue for ordering
  private changeQueue: DepthChangeEvent[] = [];
  private isProcessing: boolean = false;

  // Listeners
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private snapshotListeners: Set<(snapshots: TokenDepthSnapshot[]) => void> =
    new Set();
  private deltaListeners: Set<
    (marketId: string, update: DepthUpdate) => void
  > = new Set();

  // Reconnection state
  private shouldBeConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Heartbeat state
  private heartbeatIntervalId: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lastPongTime: number = 0;

  // Visibility change handler reference (for cleanup)
  private visibilityChangeHandler: (() => void) | null = null;

  constructor(config: MarketDepthClientConfig) {
    this.config = {
      heartbeatIntervalMs: 30000,
      heartbeatTimeoutMs: 10000,
      maxReconnectAttempts: Infinity,
      initialReconnectDelayMs: 1000,
      maxReconnectDelayMs: 30000,
      ...config,
    };
  }

  /** Connects to the market depth websocket and hydrates token snapshots. */
  async connect(): Promise<void> {
    // Clean up any existing connection first
    this.stopHeartbeat();
    this.clearReconnectTimeout();

    if (this.ws) {
      this.ws.onclose = null; // Prevent triggering reconnect
      this.ws.close();
      this.ws = null;
    }

    this.shouldBeConnected = true;
    this.setStatus("connecting");

    const wsUrl = this.config.wsUrl;
    if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      throw new Error(`Invalid WebSocket URL: ${wsUrl}`);
    }

    // Prevent queue processing until snapshots are received
    this.isProcessing = true;

    // Set up visibility change handler
    this.setupVisibilityChangeHandler();

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
        this.lastPongTime = Date.now();

        // Send subscribe_market message
        this.ws!.send(
          JSON.stringify({
            type: "subscribe_market",
            marketId: this.config.marketId,
            tokenIds: this.config.tokenIds,
          })
        );

        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);

          // Handle pong response
          if (msg.type === "pong") {
            this.lastPongTime = Date.now();
            this.clearHeartbeatTimeout();
            return;
          }

          if (msg.type === "subscribed_market") {
            // Received initial snapshots
            this.handleSubscribedMarket(msg);
            this.isProcessing = false;
            this.setStatus("synced");
            this.processChangeQueue();
            resolve();
          } else if (msg.type === "depth_update") {
            // Received depth update
            this.handleDepthUpdate(msg);
          } else if (msg.type === "market_state") {
            // Received market state (bestBid, bestAsk, lastPrice) - preferred over last_price
            this.handleMarketStateUpdate(msg);
          } else if (msg.type === "last_price") {
            // Legacy: last price only (still supported)
            this.handleLastPriceUpdate(msg);
          } else if (msg.type === "error") {
            console.error("WebSocket error:", msg.message);
            reject(new Error(msg.message));
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        // Only reject if this is the initial connection
        if (this.status === "connecting") {
          reject(error);
        }
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setStatus("disconnected");

        // Attempt to reconnect if we should still be connected
        if (this.shouldBeConnected) {
          this.scheduleReconnect();
        }
      };
    });
  }

  private setupVisibilityChangeHandler(): void {
    // Only set up in browser environment
    if (typeof document === "undefined") return;

    // Remove existing handler if any
    this.removeVisibilityChangeHandler();

    this.visibilityChangeHandler = () => {
      if (document.visibilityState === "visible" && this.shouldBeConnected) {
        // Tab became visible - check if connection is still healthy
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
      // Connection is dead, trigger reconnect
      console.log("Connection unhealthy on visibility change, reconnecting...");
      this.handleConnectionLost();
      return;
    }

    // Send a ping to verify the connection is actually working
    try {
      this.ws.send(JSON.stringify({ type: "ping" }));

      // Set a timeout for the pong response
      this.clearHeartbeatTimeout();
      this.heartbeatTimeoutId = setTimeout(() => {
        console.log("Ping timeout on visibility change, reconnecting...");
        this.handleConnectionLost();
      }, this.config.heartbeatTimeoutMs!);
    } catch {
      // Send failed, connection is dead
      this.handleConnectionLost();
    }
  }

  private handleConnectionLost(): void {
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.onclose = null; // Prevent double-triggering
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
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      try {
        this.ws.send(JSON.stringify({ type: "ping" }));

        // Set timeout for pong response
        this.clearHeartbeatTimeout();
        this.heartbeatTimeoutId = setTimeout(() => {
          console.log("Heartbeat timeout, reconnecting...");
          this.handleConnectionLost();
        }, this.config.heartbeatTimeoutMs!);
      } catch {
        // Send failed, connection is dead
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

  private scheduleReconnect(): void {
    if (!this.shouldBeConnected) return;

    const maxAttempts = this.config.maxReconnectAttempts!;
    if (this.reconnectAttempts >= maxAttempts) {
      console.error(`Max reconnection attempts (${maxAttempts}) reached, giving up`);
      return;
    }

    // Exponential backoff with jitter
    const baseDelay = this.config.initialReconnectDelayMs!;
    const maxDelay = this.config.maxReconnectDelayMs!;
    const delay = Math.min(
      baseDelay * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      maxDelay
    );

    this.reconnectAttempts++;
    this.setStatus("recovering");

    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${Math.round(delay)}ms`);

    this.clearReconnectTimeout();
    this.reconnectTimeoutId = setTimeout(() => {
      this.performReconnect();
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
      // Clear state before reconnecting
      this.tokenStates.clear();
      this.changeQueue = [];

      await this.connect();
      console.log("Reconnected successfully");
    } catch (error) {
      console.error("Reconnection failed:", error);
      // Will trigger another reconnect via onclose handler
    }
  }

  private handleSubscribedMarket(msg: {
    marketId: string;
    tokenIds: string[];
    snapshots: TokenDepthSnapshot[];
    bufferedUpdates?: Array<{ tokenId: string; updates: DepthChangeEvent[] }>;
  }): void {
    // Initialize state for each token from snapshots (seq is per token)
    for (const snapshot of msg.snapshots) {
      const state: TokenDepthState = {
        bids: new Map(),
        asks: new Map(),
        bestBid: snapshot.bestBid,
        bestAsk: snapshot.bestAsk,
        lastPrice: snapshot.lastPrice,
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

    // Apply buffered updates that came in during snapshot fetch
    // These are updates with seq > snapshot.seq
    if (msg.bufferedUpdates) {
      for (const { tokenId, updates } of msg.bufferedUpdates) {
        const state = this.tokenStates.get(tokenId);
        if (!state) continue;

        for (const update of updates) {
          const updateSeq = parseInt(update.seq, 10);
          if (updateSeq > state.seq) {
            this.applyChange(update, state);
            state.seq = updateSeq;
          }
        }
      }
    }

    // Notify snapshot listeners
    this.snapshotListeners.forEach((listener) => {
      try {
        listener(msg.snapshots);
      } catch (error) {
        console.error("Error in snapshot listener:", error);
      }
    });
  }

  private handleDepthUpdate(msg: {
    marketId: string;
    tokenId: string;
    side: "bid" | "ask";
    price: string;
    depth: string;
    seq: string;
  }): void {
    // Convert single-level change to DepthChangeEvent
    const change: DepthChangeEvent = {
      tokenId: msg.tokenId,
      side: msg.side,
      price: msg.price,
      depth: msg.depth,
      seq: msg.seq,
    };
    this.changeQueue.push(change);
    this.processChangeQueue();
  }

  private handleMarketStateUpdate(msg: {
    marketId: string;
    tokenId: string;
    bestBid: string | null;
    bestAsk: string | null;
    lastPrice: string | null;
  }): void {
    const state = this.tokenStates.get(String(msg.tokenId));
    if (!state) {
      return;
    }

    state.bestBid = msg.bestBid ?? state.bestBid;
    state.bestAsk = msg.bestAsk ?? state.bestAsk;
    state.lastPrice = msg.lastPrice ?? state.lastPrice;

    this.deltaListeners.forEach((listener) => {
      try {
        const update: DepthUpdate = {
          tokenId: msg.tokenId,
          levels: [],
          bestBid: state.bestBid,
          bestAsk: state.bestAsk,
          lastPrice: state.lastPrice,
          seq: state.seq,
        };
        listener(this.config.marketId, update);
      } catch (error) {
        console.error("Error in delta listener for market_state:", error);
      }
    });
  }

  private handleLastPriceUpdate(msg: {
    tokenId: string;
    lastPrice: string;
  }): void {
    const state = this.tokenStates.get(String(msg.tokenId));
    if (!state) {
      return;
    }

    state.lastPrice = msg.lastPrice;

    this.deltaListeners.forEach((listener) => {
      try {
        const update: DepthUpdate = {
          tokenId: msg.tokenId,
          levels: [],
          bestBid: state.bestBid,
          bestAsk: state.bestAsk,
          lastPrice: msg.lastPrice,
          seq: state.seq,
        };
        listener(this.config.marketId, update);
      } catch (error) {
        console.error("Error in delta listener for last_price:", error);
      }
    });
  }

  private async processChangeQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.changeQueue.length > 0) {
        const change = this.changeQueue.shift()!;
        const state = this.tokenStates.get(change.tokenId);

        if (!state) {
          continue;
        }

        const newSeq = parseInt(change.seq, 10);

        // Duplicate or out-of-order: skip
        if (newSeq <= state.seq) {
          continue;
        }

        // Gap: next seq must be exactly state.seq + 1
        // However, we tolerate gaps to avoid reconnect loops when updates arrive
        // between snapshot fetch and subscription start on the server side.
        // The depth data is still correct (absolute values, not deltas).
        if (newSeq > state.seq + 1) {
          console.warn(
            `[MarketDepth] Gap detected tokenId=${change.tokenId} expected=${state.seq + 1} got=${newSeq}. Accepting anyway (depth is absolute).`
          );
          // Continue processing - depth values are absolute, so missing an update
          // just means we might have a stale value until the next update for that price.
        }

        // Apply the single-level change
        this.applyChange(change, state);
        state.seq = newSeq;

        // Notify delta listeners
        this.deltaListeners.forEach((listener) => {
          try {
            const update: DepthUpdate = {
              tokenId: change.tokenId,
              levels: [{ side: change.side, price: change.price, depth: change.depth }],
              bestBid: state.bestBid,
              bestAsk: state.bestAsk,
              lastPrice: state.lastPrice,
              seq: newSeq,
            };
            listener(this.config.marketId, update);
          } catch (error) {
            console.error("Error in delta listener:", error);
          }
        });
      }
    } finally {
      this.isProcessing = false;

      if (this.changeQueue.length > 0) {
        setImmediate(() => this.processChangeQueue());
      }
    }
  }

  private handleGap(): void {
    this.isProcessing = true;
    this.changeQueue = [];
    this.tokenStates.clear();
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.setStatus("recovering");
    this.scheduleReconnect();
  }

  private applyChange(change: DepthChangeEvent, state: TokenDepthState): void {
    const map = change.side === "bid" ? state.bids : state.asks;
    const depth = parseFloat(change.depth);
    const key = normalizePrice(change.price);

    if (depth <= 0) {
      map.delete(key);
    } else {
      map.set(key, change.depth);
    }

    // Recalculate best prices from current state
    // Best bid = highest price with depth
    // Best ask = lowest price with depth
    if (change.side === "bid") {
      const bidPrices = Array.from(state.bids.keys()).map(p => parseFloat(p));
      state.bestBid = bidPrices.length > 0 ? Math.max(...bidPrices).toString() : null;
    } else {
      const askPrices = Array.from(state.asks.keys()).map(p => parseFloat(p));
      state.bestAsk = askPrices.length > 0 ? Math.min(...askPrices).toString() : null;
    }
  }


  private setStatus(status: SyncStatus): void {
    if (this.status === status) return;
    this.status = status;

    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (error) {
        console.error("Error in status listener:", error);
      }
    });
  }

  // Public API
  /** Returns the current connection lifecycle state. */
  getStatus(): SyncStatus {
    return this.status;
  }

  /** Returns true once initial depth snapshots have been received. */
  isSynced(): boolean {
    return this.status === "synced";
  }

  /** Returns all token ids currently tracked by the client. */
  getTokenIds(): string[] {
    return Array.from(this.tokenStates.keys());
  }

  /** Returns raw internal token state for advanced integrations. */
  getTokenState(tokenId: string): TokenDepthState | undefined {
    return this.tokenStates.get(tokenId);
  }

  /** Returns the current bid ladder for a token, sorted from highest to lowest price. */
  getBids(tokenId: string): DepthLevel[] {
    const state = this.tokenStates.get(tokenId);
    if (!state) return [];

    return Array.from(state.bids.entries())
      .map(([price, depth]) => ({ price, depth }))
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); // Highest first
  }

  /** Returns the current ask ladder for a token, sorted from lowest to highest price. */
  getAsks(tokenId: string): DepthLevel[] {
    const state = this.tokenStates.get(tokenId);
    if (!state) return [];

    return Array.from(state.asks.entries())
      .map(([price, depth]) => ({ price, depth }))
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); // Lowest first
  }

  /** Returns the best bid price for a token, if known. */
  getBestBid(tokenId: string): string | null {
    return this.tokenStates.get(tokenId)?.bestBid ?? null;
  }

  /** Returns the best ask price for a token, if known. */
  getBestAsk(tokenId: string): string | null {
    return this.tokenStates.get(tokenId)?.bestAsk ?? null;
  }

  /** Returns the latest trade price tracked for a token, if any. */
  getLastPrice(tokenId: string): string | null {
    return this.tokenStates.get(tokenId)?.lastPrice ?? null;
  }

  /** Returns the latest applied sequence id for a token. */
  getSeq(tokenId: string): number {
    return this.tokenStates.get(tokenId)?.seq ?? 0;
  }

  /** Returns the current bid-ask spread for a token when both sides are available. */
  getSpread(tokenId: string): number | null {
    const state = this.tokenStates.get(tokenId);
    if (!state || !state.bestBid || !state.bestAsk) return null;
    return parseFloat(state.bestAsk) - parseFloat(state.bestBid);
  }

  /** Returns the depth resting at one exact price level on a given side. */
  getDepthAtPrice(
    tokenId: string,
    side: "bid" | "ask",
    price: string
  ): string | null {
    const state = this.tokenStates.get(tokenId);
    if (!state) return null;
    const map = side === "bid" ? state.bids : state.asks;
    return map.get((price)) || null;
  }

  // Event listeners
  /** Registers a listener for connection lifecycle updates. */
  onStatus(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  /** Registers a listener that receives full snapshots for all subscribed tokens. */
  onSnapshot(callback: (snapshots: TokenDepthSnapshot[]) => void): () => void {
    this.snapshotListeners.add(callback);
    return () => this.snapshotListeners.delete(callback);
  }

  /** Registers a listener for normalized incremental depth updates. */
  onDelta(
    callback: (marketId: string, update: DepthUpdate) => void
  ): () => void {
    this.deltaListeners.add(callback);
    return () => this.deltaListeners.delete(callback);
  }

  /** Closes the websocket and stops automatic reconnection attempts. */
  async disconnect(): Promise<void> {
    // Mark that we intentionally want to disconnect
    this.shouldBeConnected = false;
    this.isProcessing = true;

    // Clean up all timers and handlers
    this.stopHeartbeat();
    this.clearReconnectTimeout();
    this.removeVisibilityChangeHandler();
    this.reconnectAttempts = 0;

    if (this.ws) {
      // Prevent onclose from triggering reconnect
      this.ws.onclose = null;

      // Send unsubscribe before closing
      if (this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(
            JSON.stringify({
              type: "unsubscribe_market",
              marketId: this.config.marketId,
            })
          );
        } catch {
          // Ignore send errors during disconnect
        }
      }
      this.ws.close();
      this.ws = null;
    }

    this.changeQueue = [];
    this.tokenStates.clear();
    this.setStatus("disconnected");
  }
}
