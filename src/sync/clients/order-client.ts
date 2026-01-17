import { OrderStatus, type StoredOrder } from "../../shared/types.js";
import type {
  OrderChange,
  SequencedMessage,
  SyncClientConfig,
} from "../types.js";
import { BaseSyncClient } from "./base-client.js";
import { RedisWsClient } from "../redis-ws-client.js";

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
    // WebSocket worker uses format: orderbook:${marketId}
    const fullConfig: OrderbookSyncClientConfig = {
      ...config,
      channel: `orderbook:${config.marketId}`,
    };
    super(fullConfig);
  }

  // Override connect to handle array messages from WebSocket worker
  async connect(): Promise<void> {
    // Disconnect existing connection if any (for restarts)
    await this.disconnect();

    this.setStatus("connecting");

    const wsUrl = this.config.redisUrl;
    if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
      throw new Error(
        `Invalid WebSocket URL: ${wsUrl}. Only ws:// and wss:// URLs are supported.`
      );
    }

    // Set isProcessing to true to prevent queue processing until snapshot is fetched
    this.isProcessing = true;

    // Set up WebSocket client first (messages will be queued)
    this.wsClient = new RedisWsClient(wsUrl);

    // WebSocket worker sends arrays of orders, need to parse and convert to SequencedMessage
    this.wsClient.subscribe(this.config.channel, (messageStr: string) => {
      try {
        // Parse the array of orders from WebSocket worker
        const orders: any[] = JSON.parse(messageStr);

        // Convert each order to SequencedMessage format
        for (const orderData of orders) {
          const message = this.parseOrderToMessage(orderData);
          if (message) {
            this.enqueueMessage(message);
          }
        }
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
    this.startExpireCheck();
  }

  /**
   * Parse order data from WebSocket worker to SequencedMessage format
   */
  private parseOrderToMessage(orderData: any): SequencedMessage | null {
    const {
      action,
      orderHash,
      maker,
      marketId,
      previousSequenceId,
      currentSequenceId,
      info,
    } = orderData;

    if (!orderHash || !marketId || !currentSequenceId) {
      console.warn("Invalid order data:", orderData);
      return null;
    }

    // Convert sequence ID from string to number
    const seq = Number(currentSequenceId);
    if (isNaN(seq)) {
      console.warn("Invalid sequence ID:", currentSequenceId);
      return null;
    }

    // Map action to OrderChange type
    const change: OrderChange = {
      type: action,
      orderHash,
      order: this.infoToStoredOrder(orderHash, maker, marketId, info, action),
    };

    // Convert previousSequenceId from string to number
    const previousSeq = Number(previousSequenceId || "0");

    return {
      seq,
      previousSeq: isNaN(previousSeq) ? 0 : previousSeq,
      marketId,
      change,
      timestamp: Date.now(),
    };
  }

  /**
   * Convert info object to StoredOrder format
   */
  private infoToStoredOrder(
    orderHash: string,
    maker: string,
    marketId: string,
    info: any,
    action: string
  ): StoredOrder | undefined {
    if (action === "DELETE" || !info || Object.keys(info).length === 0) {
      return undefined;
    }

    // For UPDATE, merge with existing order if available
    if (action === "UPDATE") {
      const existingOrder = this.dataMap.get(orderHash);
      if (!existingOrder) {
        // Can't update an order that doesn't exist
        return undefined;
      }

      // Merge update fields
      return {
        ...existingOrder,
        remainingMakerAmount:
          info.remaining_maker_amount || existingOrder.remainingMakerAmount,
        status: this.mapStatus(info.status) || existingOrder.status,
        fillableAmount: info.fillable_amount || existingOrder.fillableAmount,
      };
    }

    // For INSERT, create full order from info
    if (action === "INSERT") {
      return {
        orderHash,
        extensionEncoded: info.extension_encoded,
        signature: info.signature_data,
        marketId,
        remainingMakerAmount: info.remaining_maker_amount,
        order: {
          salt: info.salt,
          maker,
          receiver: info.receiver,
          makerAsset: info.maker_asset,
          takerAsset: info.taker_asset,
          makingAmount: info.making_amount,
          takingAmount: info.taking_amount,
          makerTraits: info.maker_traits_encoded,
        },
        operator: info.operator || undefined,
        createdAt: Number(info.created_at) || Date.now(),
        expiresAt: info.expires_at ? Number(info.expires_at) : undefined,
        status: this.mapStatus(info.status) || OrderStatus.OPEN,
        fillableAmount: info.fillable_amount,
      };
    }

    return undefined;
  }

  /**
   * Map status string to OrderStatus enum
   */
  private mapStatus(status: string): OrderStatus | undefined {
    if (!status) return undefined;

    const statusUpper = status.toUpperCase();
    if (statusUpper === "OPEN") return OrderStatus.OPEN;
    if (statusUpper === "PARTIALLY_FILLED") return OrderStatus.PARTIALLY_FILLED;
    if (statusUpper === "FULLY_FILLED") return OrderStatus.FULLY_FILLED;
    if (statusUpper === "CANCELLED") return OrderStatus.CANCELLED;
    if (statusUpper === "EXPIRED") return OrderStatus.EXPIRED;

    return undefined;
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
        // seq is now a string from the API, convert to number
        const snapshotSeqStr = data.data.seq || data.seq || "0";
        const snapshotSeq = Number(snapshotSeqStr);

        if (isNaN(snapshotSeq)) {
          console.warn("Invalid snapshot sequence:", snapshotSeqStr);
        }

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
          // Only keep the order if it's still OPEN or PARTIALLY_FILLED, otherwise remove it
          // (CANCELLED and FULLY_FILLED orders should not be in the orderbook)
          if (
            change.order.status === OrderStatus.OPEN ||
            change.order.status === OrderStatus.PARTIALLY_FILLED
          ) {
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
