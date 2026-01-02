import { OrderStatus, type StoredOrder } from "../../shared/types.js";
import type {
  OrderChange,
  SequencedMessage,
  SyncClientConfig,
} from "../types.js";
import { BaseSyncClient } from "./base-client.js";

export interface OrderbookSyncClientConfig extends SyncClientConfig {
  channel: string;
}

export class OrderbookSyncClient extends BaseSyncClient<
  SequencedMessage,
  OrderChange,
  StoredOrder,
  OrderbookSyncClientConfig
> {
  private expireCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: SyncClientConfig) {
    // Build full config with channel
    const fullConfig: OrderbookSyncClientConfig = {
      ...config,
      channel: `orderbook:market:${config.marketId}`,
    };
    super(fullConfig);
  }

  async connect(): Promise<void> {
    await super.connect();
    this.startExpireCheck();
  }

  protected async fetchSnapshot(): Promise<void> {
    try {
      if (!this.config.snapshotUrl) {
        return;
      }

      const url = `${this.config.snapshotUrl}/orderbook/api/orders?marketId=${this.config.marketId}&status=ACTIVE`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `Snapshot fetch failed: ${response.status} ${response.statusText}`
        );
      }
      const data = (await response.json()) as any;

      if (data.success && data.data) {
        const orders = data.data.orders || data.data;
        const snapshotSeq = data.data.seq || data.seq || 0;

        this.dataMap.clear();
        orders.forEach((order: StoredOrder) => {
          this.dataMap.set(order.orderHash, order);
        });

        this.lastSeq = snapshotSeq;

        this.notifySnapshotListeners(orders);
      }
    } catch (error) {
      console.error("Error fetching snapshot:", error);
    }
  }

  protected applyMessage(message: SequencedMessage): void {
    const change = message.change;

    switch (change.type) {
      case "INSERT":
        if (change.order) {
          this.dataMap.set(change.orderHash, change.order);
        }
        break;

      case "UPDATE":
        if (change.order) {
          // Only keep the order if it's still ACTIVE, otherwise remove it
          // (CANCELLED and FILLED orders should not be in the orderbook)
          if (change.order.status === OrderStatus.ACTIVE) {
            this.dataMap.set(change.orderHash, change.order);
          } else {
            this.dataMap.delete(change.orderHash);
          }
        }
        break;

      case "DELETE":
        this.dataMap.delete(change.orderHash);
        break;
    }

    this.changeListeners.forEach((listener) => {
      try {
        listener(change);
      } catch (error) {
        console.error("Error in change listener:", error);
      }
    });
  }

  protected async recoverGap(
    fromSeq: number,
    toSeq: number
  ): Promise<SequencedMessage[]> {
    if (!this.config.gapRecoveryUrl) {
      return [];
    }

    const gapSize = toSeq - fromSeq + 1;

    if (gapSize > 1000) {
      await this.fullResync();
      return [];
    }

    this.setStatus("recovering");

    try {
      const url = `${this.config.gapRecoveryUrl}/orderbook/api/sync/messages?marketId=${this.config.marketId}&fromSeq=${fromSeq}&toSeq=${toSeq}`;

      const response = await fetch(url);
      const data = (await response.json()) as any;

      if (data.success && data.data) {
        const messages: SequencedMessage[] = data.data;
        messages.sort((a, b) => a.seq - b.seq);
        this.setStatus("synced");
        return messages;
      }

      this.setStatus("synced");
      return [];
    } catch (error) {
      await this.fullResync();
      return [];
    }
  }

  getOrders(): StoredOrder[] {
    return Array.from(this.dataMap.values());
  }

  getOrder(orderHash: string): StoredOrder | undefined {
    return this.dataMap.get(orderHash);
  }

  private startExpireCheck(): void {
    // Clear any existing interval
    if (this.expireCheckInterval) {
      clearInterval(this.expireCheckInterval);
    }

    // Check for expired orders every 1 second
    this.expireCheckInterval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const expiredOrders: string[] = [];

      for (const [orderHash, order] of this.dataMap.entries()) {
        // Check if order has expired
        if (order.expiresAt && order.expiresAt < now) {
          expiredOrders.push(orderHash);
        }
      }

      // Remove expired orders and notify listeners
      for (const orderHash of expiredOrders) {
        this.dataMap.delete(orderHash);

        const change: OrderChange = {
          type: "DELETE",
          orderHash,
        };

        this.changeListeners.forEach((listener) => {
          try {
            listener(change);
          } catch (error) {
            console.error("Error in change listener:", error);
          }
        });
      }
    }, 1000);
  }

  async disconnect(): Promise<void> {
    // Clear expire check interval
    if (this.expireCheckInterval) {
      clearInterval(this.expireCheckInterval);
      this.expireCheckInterval = null;
    }

    await super.disconnect();
  }
}
