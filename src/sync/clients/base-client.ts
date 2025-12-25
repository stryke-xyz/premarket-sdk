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
  TMessage extends { seq: number },
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
    this.setStatus("connecting");

    // Only allow ws:// or wss:// URLs
    const wsUrl = this.config.redisUrl;
    if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      throw new Error(
        `Invalid WebSocket URL: ${wsUrl}. Only ws:// and wss:// URLs are supported.`
      );
    }

    this.wsClient = new RedisWsClient(wsUrl);

    this.wsClient.subscribe(this.config.channel, (messageStr: string) => {
      try {
        const message: TMessage = JSON.parse(messageStr);
        this.enqueueMessage(message);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    this.setStatus("syncing");
    await this.fetchSnapshot();
    this.setStatus("synced");
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

        if (message.seq <= this.lastSeq) {
          continue;
        }

        const expectedSeq = this.lastSeq + 1;

        if (message.seq === expectedSeq) {
          await this.applyMessage(message);
          this.lastSeq = message.seq;
        } else if (message.seq > expectedSeq) {
          const recovered = await this.recoverGap(expectedSeq, message.seq - 1);

          for (const msg of recovered) {
            if (msg.seq === this.lastSeq + 1) {
              await this.applyMessage(msg);
              this.lastSeq = msg.seq;
            }
          }

          if (message.seq === this.lastSeq + 1) {
            await this.applyMessage(message);
            this.lastSeq = message.seq;
          } else {
            this.incomingQueue.unshift(message);
            await this.recoverGap(this.lastSeq + 1, message.seq - 1);
          }
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
    this.isProcessing = true;
    try {
      this.incomingQueue = [];
      this.lastSeq = 0;
      await this.fetchSnapshot();
      this.setStatus("synced");
    } finally {
      this.isProcessing = false;
    }
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
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }
    this.setStatus("disconnected");
  }

  /**
   * Abstract methods to be implemented by child classes
   */
  protected abstract fetchSnapshot(): Promise<void>;
  protected abstract applyMessage(message: TMessage): Promise<void> | void;
  protected abstract recoverGap(
    fromSeq: number,
    toSeq: number
  ): Promise<TMessage[]>;
}
