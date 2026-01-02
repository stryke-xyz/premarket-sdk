// ============================================================================
// TYPES
// ============================================================================

import type {
  StoredOrder,
  CreateOrderParams,
  OptionMarket,
  Position,
  UserHistories,
  Volumes24hResponse,
  OrderbookApiConfig,
  OrderQueryParams,
  QueryOrdersResponse,
  OrdersSnapshot,
  SyncMessage,
  BalanceMessage,
  BalanceSnapshot,
} from "../../shared/types.js";
import {
  deserializeOptionMarket,
  deserializePosition,
  deserializeUserHistories,
} from "./deserializers.js";

// ============================================================================
// ORDERBOOK API CLASS
// ============================================================================

/**
 * Unified API client for both orderbook and options market operations
 */
export class OrderbookApi {
  constructor(private readonly config: OrderbookApiConfig) {}

  // ============================================================================
  // ORDERBOOK METHODS
  // ============================================================================

  /**
   * Create a new order
   */
  async createOrder(
    params: CreateOrderParams,
    bearerToken: string
  ): Promise<StoredOrder> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(params),
      }
    );

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
      `${this.config.baseUrl}/orderbook/api/orders/${orderHash}`
    );

    const data = await response.json();
    return data.success ? data.data : null;
  }

  /**
   * Query orders with filters
   */
  async queryOrders(params: OrderQueryParams): Promise<QueryOrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params.marketId) queryParams.append("marketId", params.marketId);
    if (params.orderType) queryParams.append("orderType", params.orderType);
    if (params.maker) queryParams.append("maker", params.maker);
    if (params.stableToken)
      queryParams.append("stableToken", params.stableToken);
    if (params.status) queryParams.append("status", params.status);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders?${queryParams.toString()}`
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to query orders");
    }

    return data.data;
  }

  /**
   * Get orders snapshot for a market (includes sequence number)
   */
  async getOrdersSnapshot(marketId: string): Promise<OrdersSnapshot> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders?marketId=${marketId}&status=ACTIVE`
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to get orders snapshot");
    }

    return {
      orders: data.data.orders || [],
      seq: data.data.seq || 0,
      count: data.data.count || 0,
    };
  }

  /**
   * Get orders for a market
   */
  async getOrdersByMarket(marketId: string): Promise<StoredOrder[]> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders?marketId=${marketId}`
    );

    const data = await response.json();
    return data.success ? data.data.orders || [] : [];
  }

  /**
   * Get orders by option token ID
   */
  async getOrdersByOptionId(optionTokenId: string): Promise<StoredOrder[]> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders?optionTokenId=${optionTokenId}`
    );

    const data = await response.json();
    return data.success ? data.data.orders || [] : [];
  }

  /**
   * Get active orders
   */
  async getActiveOrders(): Promise<StoredOrder[]> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders/active`
    );

    const data = await response.json();
    return data.success ? data.data.orders || [] : [];
  }

  /**
   * Get sync messages for gap recovery
   */
  async getSyncMessages(
    marketId: string,
    fromSeq: number,
    toSeq: number
  ): Promise<SyncMessage[]> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/sync/messages?marketId=${marketId}&fromSeq=${fromSeq}&toSeq=${toSeq}`
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch sync messages");
    }

    return data.data || [];
  }

  /**
   * Get balance messages for gap recovery
   */
  async getBalanceMessages(
    marketId: string,
    fromSeq: number,
    toSeq: number
  ): Promise<BalanceMessage[]> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/sync/balance-messages?marketId=${marketId}&fromSeq=${fromSeq}&toSeq=${toSeq}`
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch balance messages");
    }

    return data.data || [];
  }

  /**
   * Get balance snapshot for a market
   */
  async getBalanceSnapshot(marketId: string): Promise<BalanceSnapshot> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/sync/balance-snapshot?marketId=${marketId}`
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch balance snapshot");
    }

    return data.data;
  }

  // ============================================================================
  // OPTIONS MARKET METHODS
  // ============================================================================

  /**
   * Get all markets
   */
  async getMarkets(): Promise<OptionMarket[]> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/markets`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch markets");
    }
    return data.data.map(deserializeOptionMarket);
  }

  /**
   * Get a single market by ID
   */
  async getMarket(marketId: string): Promise<OptionMarket | null> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/markets/${marketId}`
    );
    const data = await response.json();
    if (!data.success) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(data.error || "Failed to fetch market");
    }
    return deserializeOptionMarket(data.data);
  }

  /**
   * Get 24h volumes for multiple option IDs
   */
  async get24hVolumes(
    marketId: string,
    optionIds: string[]
  ): Promise<Volumes24hResponse> {
    const optionIdsParam = optionIds.join(",");
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/markets/${marketId}/volumes/24h?optionIds=${optionIdsParam}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch 24h volumes");
    }
    return data.data;
  }

  /**
   * Get user positions for a specific market
   */
  async getUserPositions(
    userAddress: string,
    marketId: string
  ): Promise<Position[]> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/positions/${marketId}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch positions");
    }
    return data.data.map(deserializePosition);
  }

  /**
   * Get all user positions across all markets
   */
  async getAllUserPositions(userAddress: string): Promise<Position[]> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/positions`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch positions");
    }
    return data.data.map(deserializePosition);
  }

  /**
   * Get user histories for a specific market
   */
  async getUserHistories(
    userAddress: string,
    marketId: string
  ): Promise<UserHistories> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/${marketId}`
      );
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch history");
      }
      return deserializeUserHistories(data.data);
    } catch (error) {
      console.error(error);
      return {
        depositHistory: [],
        transferDepositHistory: [],
        transferCollateralSharesHistory: [],
        transferOptionsSharesHistory: [],
        purchaseHistory: [],
        transferPositionHistory: [],
        exerciseHistory: [],
        unwindHistory: [],
        withdrawHistory: [],
        orderFillHistory: [],
      };
    }
  }
}
