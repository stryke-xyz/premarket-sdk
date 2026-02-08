// ============================================================================
// ORDERBOOK API CLIENT
// ============================================================================

import type {
  StoredOrder,
  CreateOrderParams,
  MarketsResponse,
  Erc6909Market,
  Erc20Market,
  ApiMarket,
  UserPosition,
  TradingPnL,
  UserPnL,
  TokenPnL,
  Erc20PnL,
  UserHistories,
  OrderbookApiConfig,
  OrderQueryParams,
  QueryOrdersResponse,
  OrdersSnapshot,
  SyncMessage,
  BalanceMessage,
  BalanceSnapshot,
  DepthSnapshot,
  MarketTradeItem,
} from "../../shared/types.js";

// ============================================================================
// ORDERBOOK API CLASS
// ============================================================================

/**
 * Unified API client for orderbook and options market operations
 */
export class OrderbookApi {
  constructor(private readonly config: OrderbookApiConfig) { }

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
    if (params.maker) queryParams.append("maker", params.maker);
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
   * Get orders snapshot for a market
   */
  async getUserOrders(maker: string): Promise<StoredOrder[]> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders/user/${maker}`
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to get orders snapshot");
    }

    return data.data.orders || [];
  }

  /**
   * Get depth snapshot for a market+token
   */
  async getDepthSnapshot(marketId: string, tokenId: string): Promise<DepthSnapshot> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/depth?marketId=${marketId}&tokenId=${tokenId}`
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to get depth snapshot");
    }

    return data.data;
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
  // MARKET METHODS
  // ============================================================================

  /**
   * Get all markets (ERC6909 options + ERC20 pre-TGE)
   */
  async getMarkets(): Promise<MarketsResponse> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/markets`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch markets");
    }
    return data.data;
  }

  /**
   * Get recent trades (order fills) for a market
   */
  async getMarketRecentTrades(marketId: string, limit?: number): Promise<MarketTradeItem[]> {
    const queryParams = limit != null ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/markets/${marketId}/trades${queryParams}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch market trades");
    }
    return data.data;
  }

  /**
   * Get a single market by ID
   * Returns ERC6909 market with PRM tokens and final ticks, or ERC20 market with submarkets
   */
  async getMarket(marketId: string): Promise<ApiMarket | null> {
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
    return data.data;
  }

  /**
   * Get ERC6909 markets only (options markets)
   */
  async getErc6909Markets(): Promise<Erc6909Market[]> {
    const markets = await this.getMarkets();
    return markets.erc6909;
  }

  /**
   * Get ERC20 markets only (pre-TGE markets)
   */
  async getErc20Markets(): Promise<Erc20Market[]> {
    const markets = await this.getMarkets();
    return markets.erc20;
  }

  // ============================================================================
  // USER POSITION & PNL METHODS
  // ============================================================================

  /**
   * Get user positions (vault operations: mint/redeem/unwind)
   */
  async getUserPositions(userAddress: string): Promise<UserPosition[]> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/positions`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch positions");
    }
    return data.data;
  }

  /**
   * Get user trading PnL (limit orders)
   */
  async getUserTradingPnL(userAddress: string): Promise<TradingPnL[]> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/trading`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch trading PnL");
    }
    return data.data;
  }

  /**
   * Get user total PnL (positions + trading combined)
   */
  async getUserPnL(userAddress: string): Promise<UserPnL> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/pnl`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch PnL");
    }
    return data.data;
  }

  /**
   * Get PnL for a specific ERC6909 token
   */
  async getTokenPnL(userAddress: string, tokenId: string): Promise<TokenPnL> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/pnl/${tokenId}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch token PnL");
    }
    return data.data;
  }

  /**
   * Get PnL for a specific ERC20 token
   */
  async getErc20PnL(userAddress: string, tokenAddress: string): Promise<Erc20PnL> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/pnl/erc20/${tokenAddress}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch ERC20 PnL");
    }
    return data.data;
  }

  // ============================================================================
  // HISTORY METHODS
  // ============================================================================

  /**
   * Get all user histories (mints, redeems, unwinds, transfers, fills)
   */
  async getUserHistories(userAddress: string, limit?: number): Promise<UserHistories> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history${queryParams}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch history");
    }
    return data.data;
  }

  /**
   * Get user mint history
   */
  async getMintHistory(userAddress: string, limit?: number): Promise<UserHistories["mints"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/mints${queryParams}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch mint history");
    }
    return data.data;
  }

  /**
   * Get user redeem history
   */
  async getRedeemHistory(userAddress: string, limit?: number): Promise<UserHistories["redeems"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/redeems${queryParams}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch redeem history");
    }
    return data.data;
  }

  /**
   * Get user unwind history
   */
  async getUnwindHistory(userAddress: string, limit?: number): Promise<UserHistories["unwinds"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/unwinds${queryParams}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch unwind history");
    }
    return data.data;
  }

  /**
   * Get user transfer history
   */
  async getTransferHistory(userAddress: string, limit?: number): Promise<UserHistories["transfers"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/transfers${queryParams}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch transfer history");
    }
    return data.data;
  }

  /**
   * Get user order fill history
   */
  async getFillHistory(userAddress: string, limit?: number): Promise<UserHistories["fills"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/fills${queryParams}`
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch fill history");
    }
    return data.data;
  }
}
