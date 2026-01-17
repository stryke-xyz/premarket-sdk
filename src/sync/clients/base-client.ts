import type { SyncStatus } from "../types.js";
import { RedisWsClient } from "../redis-ws-client.js";

/**
 * Base abstract class for sync clients
 * @template TMessage - The message type (e.g., SequencedMessage, BalanceUpdateMessage)
 * @template TChange - The change type (e.g., OrderChange, BalanceData[])
 * @template TData - The data type stored in the map (e.g., StoredOrder, string)
 * @template TConfig - The config type (must have redisUrl and channel)
 */
export abstract class BaseSyncClient<
  TMessage extends { seq: number; previousSeq: number },
  TChange,
  TData,
  TConfig extends { redisUrl: string; channel: string },
> {
  protected wsClient: RedisWsClient | null = null;
  protected config: TConfig;
  protected status: SyncStatus = "disconnected";
  protected lastSeq: number = 0;
  protected incomingQueue: TMessage[] = [];
  protected isProcessing: boolean = false;
  protected statusListeners: Set<(status: SyncStatus) => void> = new Set();
  protected changeListeners: Set<(change: TChange) => void> = new Set();
  protected dataMap: Map<string, TData> = new Map();
  protected snapshotListeners: Set<(data: TData[]) => void> = new Set();

  constructor(config: TConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // Disconnect existing connection if any (for restarts)
    await this.disconnect();

    this.setStatus("connecting");

    // Only allow ws:// or wss:// URLs
    const wsUrl = this.config.redisUrl;
    if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      throw new Error(
        `Invalid WebSocket URL: ${wsUrl}. Only ws:// and wss:// URLs are supported.`
      );
    }

    // Set isProcessing to true to prevent queue processing until snapshot is fetched
    this.isProcessing = true;

    // Start WebSocket connection first (messages will be queued)
    this.wsClient = new RedisWsClient(wsUrl);

    this.wsClient.subscribe(this.config.channel, (messageStr: string) => {
      try {
        const message: TMessage = JSON.parse(messageStr);
        this.enqueueMessage(message);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    // Wait 200ms after subscription to ensure we don't miss any updates
    // that might arrive immediately after subscribing
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Fetch snapshot while messages are being queued (but not processed)
    this.setStatus("syncing");
    await this.fetchSnapshot();

    // Now allow queue processing
    this.isProcessing = false;
    this.setStatus("synced");

    // Start processing any queued messages
    this.processQueue();
  }

  protected enqueueMessage(message: TMessage): void {
    this.incomingQueue.push(message);
    this.processQueue();
  }

  protected async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      while (this.incomingQueue.length > 0) {
        const message = this.incomingQueue.shift()!;

        // Skip if we've already processed this sequence ID
        if (message.seq <= this.lastSeq) {
          continue;
        }

        // Check if previousSeq matches our lastSeq (no gap)
        if (message.previousSeq === this.lastSeq) {
          // Perfect! Process this message and update lastSeq
          await this.applyMessage(message);
          this.lastSeq = message.seq;
        } else if (message.previousSeq < this.lastSeq) {
          // This message is out of order (previousSeq is behind us)
          // This shouldn't happen in normal operation, but skip it
          console.warn(
            `Out of order message: previousSeq=${message.previousSeq}, lastSeq=${this.lastSeq}, seq=${message.seq}`
          );
          continue;
        } else {
          // Gap detected: previousSeq > lastSeq
          // Trigger full resync instead of gap recovery
          console.warn(
            `Gap detected: previousSeq=${message.previousSeq}, lastSeq=${this.lastSeq}, seq=${message.seq}. Triggering full resync.`
          );
          // Clear the queue - full resync will reconnect and start fresh
          this.incomingQueue = [];
          await this.fullResync();
          break;
        }
      }
    } finally {
      this.isProcessing = false;

      if (this.incomingQueue.length > 0) {
        setImmediate(() => this.processQueue());
      }
    }
  }

  protected async fullResync(): Promise<void> {
    this.setStatus("recovering");
    // Disconnect and reconnect to restart the flow
    await this.disconnect();
    await this.connect();
  }

  protected setStatus(status: SyncStatus): void {
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

  getStatus(): SyncStatus {
    return this.status;
  }

  isSynced(): boolean {
    return this.status === "synced";
  }

  getLastSequence(): number {
    return this.lastSeq;
  }

  getBufferedCount(): number {
    return this.incomingQueue.length;
  }

  onStatus(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  onChange(callback: (change: TChange) => void): () => void {
    this.changeListeners.add(callback);
    return () => this.changeListeners.delete(callback);
  }

  onSnapshot(callback: (data: TData[]) => void): () => void {
    this.snapshotListeners.add(callback);
    return () => this.snapshotListeners.delete(callback);
  }

  protected notifySnapshotListeners(data: TData[]): void {
    this.snapshotListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error("Error in snapshot listener:", error);
      }
    });
  }

  async disconnect(): Promise<void> {
    // Stop processing
    this.isProcessing = true;

    // Clear WebSocket connection
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }

    // Clear queue
    this.incomingQueue = [];

    this.setStatus("disconnected");
  }

  /**
   * Abstract methods to be implemented by child classes
   */
  protected abstract fetchSnapshot(): Promise<void>;
  protected abstract applyMessage(message: TMessage): Promise<void> | void;
}
