import type {
  StoredOrder,
  CreateOrderParams,
  Option,
} from "../shared/types.js";

export type { StoredOrder, CreateOrderParams, Option };

export interface OrderbookApiConfig {
  baseUrl: string;
}

/**
 * Orderbook API client
 */
export class OrderbookApi {
  constructor(private readonly config: OrderbookApiConfig) {}

  /**
   * Create a new order
   */
  async createOrder(params: CreateOrderParams): Promise<StoredOrder> {
    const response = await fetch(`${this.config.baseUrl}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to create order");
    }

    return data.data;
  }

  /**
   * Get order by hash
   */
  async getOrder(orderHash: string): Promise<StoredOrder | null> {
    const response = await fetch(
      `${this.config.baseUrl}/api/orders/${orderHash}`
    );

    const data = await response.json();
    return data.success ? data.data : null;
  }

  /**
   * Get orders for a market
   */
  async getOrdersByMarket(marketId: string): Promise<StoredOrder[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/orders?marketId=${marketId}`
    );

    const data = await response.json();
    return data.success ? data.data.orders : [];
  }

  /**
   * Get orders by option token ID
   */
  async getOrdersByOptionId(optionTokenId: string): Promise<StoredOrder[]> {
    const response = await fetch(
      `${this.config.baseUrl}/api/orders?optionTokenId=${optionTokenId}`
    );

    const data = await response.json();
    return data.success ? data.data.orders : [];
  }

  /**
   * Get active orders
   */
  async getActiveOrders(): Promise<StoredOrder[]> {
    const response = await fetch(`${this.config.baseUrl}/api/orders/active`);

    const data = await response.json();
    return data.success ? data.data.orders : [];
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderHash: string, maker: string): Promise<void> {
    const response = await fetch(
      `${this.config.baseUrl}/api/orders/${orderHash}/cancel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maker }),
      }
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to cancel order");
    }
  }
}
