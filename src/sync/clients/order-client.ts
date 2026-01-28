import type { SyncStatus } from "../types.js";

export interface DepthLevel {
  price: string;
  depth: string;
}

export interface TokenDepthSnapshot {
  tokenId: string;
  bids: DepthLevel[];
  asks: DepthLevel[];
  bestBid: string | null;
  bestAsk: string | null;
  lastPrice: string | null;
  seq: number;
}

export interface DepthLevelUpdate {
  side: "bid" | "ask";
  price: string;
  depth: string;
}

// Single depth level change from server
export interface DepthChangeEvent {
  tokenId: string;
  side: "bid" | "ask";
  price: string;
  depth: string;
  seq: string;
}

// Legacy format (kept for compatibility)
export interface DepthUpdate {
  tokenId: string;
  levels: DepthLevelUpdate[];
  bestBid: string | null;
  bestAsk: string | null;
  lastPrice: string | null;
  seq: number;
  previousSeq: number;
}

export interface MarketDepthClientConfig {
  wsUrl: string;
  marketId: string;
  tokenIds: string[];
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
 * Client for syncing orderbook depth data for multiple tokens in a market
 * Uses per-market sequence IDs for gap detection
 */
export class MarketDepthSyncClient {
  private ws: WebSocket | null = null;
  private config: MarketDepthClientConfig;
  private status: SyncStatus = "disconnected";

  // Per-token depth state
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

  constructor(config: MarketDepthClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    await this.disconnect();
    this.setStatus("connecting");

    const wsUrl = this.config.wsUrl;
    if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      throw new Error(`Invalid WebSocket URL: ${wsUrl}`);
    }

    // Prevent queue processing until snapshots are received
    this.isProcessing = true;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send subscribe_market message
        this.ws!.send(
          JSON.stringify({
            type: "subscribe_market",
            marketId: this.config.marketId,
            tokenIds: this.config.tokenIds,
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string);

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
        reject(error);
      };

      this.ws.onclose = () => {
        this.setStatus("disconnected");
      };
    });
  }

  private handleSubscribedMarket(msg: {
    marketId: string;
    tokenIds: string[];
    snapshots: TokenDepthSnapshot[];
    bufferedUpdates?: Array<{ tokenId: string; updates: DepthChangeEvent[] }>;
  }): void {
    // Initialize state for each token from snapshots
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
        state.bids.set(level.price, level.depth);
      }
      for (const level of snapshot.asks) {
        state.asks.set(level.price, level.depth);
      }

      this.tokenStates.set(snapshot.tokenId, state);
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

  private async processChangeQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.changeQueue.length > 0) {
        const change = this.changeQueue.shift()!;
        const state = this.tokenStates.get(change.tokenId);

        if (!state) {
          // Token not subscribed, skip
          console.log("[DEPTH_CLIENT] Token not found in state, skipping:", change.tokenId);
          console.log("[DEPTH_CLIENT] Available tokens:", Array.from(this.tokenStates.keys()));
          continue;
        }

        const newSeq = parseInt(change.seq, 10);

        // Gap detection: seq should be monotonically increasing
        // Allow seq === state.seq + 1 (normal case) or seq > state.seq (skipped some)
        // If newSeq <= state.seq, it's a duplicate or old message
        if (newSeq <= state.seq) {
          // Duplicate or out-of-order, skip
          console.log(`[DEPTH_CLIENT] Skipping old seq: ${newSeq} <= ${state.seq}`);
          continue;
        }

        // Apply the single-level change
        this.applyChange(change, state);
        state.seq = newSeq;

        // Notify delta listeners with the change
        this.deltaListeners.forEach((listener) => {
          try {
            // Convert to DepthUpdate format for backwards compat
            const update: DepthUpdate = {
              tokenId: change.tokenId,
              levels: [{ side: change.side, price: change.price, depth: change.depth }],
              bestBid: state.bestBid,
              bestAsk: state.bestAsk,
              lastPrice: state.lastPrice,
              seq: newSeq,
              previousSeq: state.seq - 1,
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

  private applyChange(change: DepthChangeEvent, state: TokenDepthState): void {
    // Apply single level change
    const map = change.side === "bid" ? state.bids : state.asks;
    const depth = parseFloat(change.depth);

    if (depth <= 0) {
      map.delete(change.price);
    } else {
      map.set(change.price, change.depth);
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

  /**
   * Reconnect and reapply depth for all tracked tokens
   */
  private async reconnect(): Promise<void> {
    this.setStatus("recovering");
    
    // Close existing connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // Clear state - will be repopulated from snapshots
    this.tokenStates.clear();
    this.changeQueue = [];
    
    // Reconnect
    await this.connect();
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
  getStatus(): SyncStatus {
    return this.status;
  }

  isSynced(): boolean {
    return this.status === "synced";
  }

  getTokenIds(): string[] {
    return Array.from(this.tokenStates.keys());
  }

  getTokenState(tokenId: string): TokenDepthState | undefined {
    return this.tokenStates.get(tokenId);
  }

  getBids(tokenId: string): DepthLevel[] {
    const state = this.tokenStates.get(tokenId);
    if (!state) return [];

    return Array.from(state.bids.entries())
      .map(([price, depth]) => ({ price, depth }))
      .sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); // Highest first
  }

  getAsks(tokenId: string): DepthLevel[] {
    const state = this.tokenStates.get(tokenId);
    if (!state) return [];

    return Array.from(state.asks.entries())
      .map(([price, depth]) => ({ price, depth }))
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); // Lowest first
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

  getSeq(tokenId: string): number {
    return this.tokenStates.get(tokenId)?.seq ?? 0;
  }

  getSpread(tokenId: string): number | null {
    const state = this.tokenStates.get(tokenId);
    if (!state || !state.bestBid || !state.bestAsk) return null;
    return parseFloat(state.bestAsk) - parseFloat(state.bestBid);
  }

  getDepthAtPrice(
    tokenId: string,
    side: "bid" | "ask",
    price: string
  ): string | null {
    const state = this.tokenStates.get(tokenId);
    if (!state) return null;
    const map = side === "bid" ? state.bids : state.asks;
    return map.get(price) || null;
  }

  // Event listeners
  onStatus(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onSnapshot(callback: (snapshots: TokenDepthSnapshot[]) => void): () => void {
    this.snapshotListeners.add(callback);
    return () => this.snapshotListeners.delete(callback);
  }

  onDelta(
    callback: (marketId: string, update: DepthUpdate) => void
  ): () => void {
    this.deltaListeners.add(callback);
    return () => this.deltaListeners.delete(callback);
  }

  async disconnect(): Promise<void> {
    this.isProcessing = true;

    if (this.ws) {
      // Send unsubscribe before closing
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "unsubscribe_market",
            marketId: this.config.marketId,
          })
        );
      }
      this.ws.close();
      this.ws = null;
    }

    this.changeQueue = [];
    this.tokenStates.clear();
    this.setStatus("disconnected");
  }
}
