// ============================================================================
// ORDERBOOK API CLIENT
// ============================================================================

import { Address, Hex } from "viem";
import type {
  StoredOrder,
  CreateOrderParams,
  MarketsResponse,
  MarketResponse,
  UserPosition,
  TradingPnL,
  UserPnL,
  TokenPnL,
  Erc20PnL,
  UserHistories,
  OrderbookApiConfig,
  OrderQueryParams,
  QueryOrdersResponse,
  DepthSnapshot,
  MarketTradeItem,
  AuthChallenge,
} from "../../shared/types.js";

// ============================================================================
// ORDERBOOK API CLASS
// ============================================================================

/**
 * Unified HTTP client for orderbook, market, position, and history endpoints.
 */
export class OrderbookApi {
  constructor(private readonly config: OrderbookApiConfig) { }

  // ============================================================================
  // ORDERBOOK METHODS
  // ============================================================================

  /**
   * Creates a new order in the orderbook service using a bearer-authenticated request.
   */
  async createOrder(
    params: CreateOrderParams,
    bearerToken: string,
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
      },
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to create order");
    }

    return data.data;
  }

  /**
   * Fetches a single stored order by its order hash.
   */
  async getOrder(orderHash: string): Promise<StoredOrder | null> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders/${orderHash}`,
    );

    const data = await response.json();
    return data.success ? data.data : null;
  }

  /**
   * Queries orders using optional market, maker, status, and pagination filters.
   */
  async queryOrders(params: OrderQueryParams): Promise<QueryOrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params.marketId) queryParams.append("marketId", params.marketId);
    if (params.maker) queryParams.append("maker", params.maker);
    if (params.status) queryParams.append("status", params.status);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());

    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders?${queryParams.toString()}`,
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to query orders");
    }

    return data.data;
  }

  /**
   * Get user orders for a market.
   * `marketId` is required by backend route contract.
   */
  async getUserOrders(
    maker: string,
    marketId?: string,
  ): Promise<StoredOrder[]> {
    if (!marketId) {
      throw new Error("marketId is required to fetch user orders");
    }

    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/orders/user/${maker}?marketId=${encodeURIComponent(
        marketId,
      )}`,
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to get orders snapshot");
    }

    return data.data.orders || [];
  }

  /**
   * Fetches the current depth snapshot for one market and token pair.
   */
  async getDepthSnapshot(
    marketId: string,
    tokenId: string,
  ): Promise<DepthSnapshot> {
    const response = await fetch(
      `${this.config.baseUrl}/orderbook/api/depth?marketId=${marketId}&tokenId=${tokenId}`,
    );

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to get depth snapshot");
    }

    return data.data;
  }

  // ============================================================================
  // MARKET METHODS
  // ============================================================================

  /**
   * Returns the paginated market catalog from the premarket API.
   */
  async getMarkets(): Promise<MarketsResponse["data"]> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/markets`,
    );
    const data: MarketsResponse | { success: false; error?: string } =
      await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch markets");
    }
    return data.data;
  }

  /**
   * Returns recent trade activity for a market, ordered by newest first.
   */
  async getMarketRecentTrades(
    marketId: string,
    limit?: number,
  ): Promise<MarketTradeItem[]> {
    const queryParams = limit != null ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/markets/${marketId}/trades${queryParams}`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch market trades");
    }
    return data.data;
  }

  /**
   * Fetches one market by id, returning `null` on a 404 response.
   */
  async getMarket(marketId: string): Promise<MarketResponse["data"] | null> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/markets/${marketId}`,
    );
    const data: MarketResponse | { success: false; error?: string } =
      await response.json();
    if (!data.success) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(data.error || "Failed to fetch market");
    }
    return data.data;
  }

  // ============================================================================
  // USER POSITION & PNL METHODS
  // ============================================================================

  /**
   * Returns current user positions derived from vault activity.
   */
  async getUserPositions(userAddress: string): Promise<UserPosition[]> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/positions`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch positions");
    }
    return data.data;
  }

  /**
   * Returns realized trading PnL for limit-order activity.
   */
  async getUserTradingPnL(userAddress: string): Promise<TradingPnL[]> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/trading`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch trading PnL");
    }
    return data.data;
  }

  /**
   * Returns aggregated user PnL across positions and orderbook trading.
   */
  async getUserPnL(userAddress: string): Promise<UserPnL> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/pnl`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch PnL");
    }
    return data.data;
  }

  /**
   * Returns PnL for a single ERC-6909 token id.
   */
  async getTokenPnL(userAddress: string, tokenId: string): Promise<TokenPnL> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/pnl/${tokenId}`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch token PnL");
    }
    return data.data;
  }

  /**
   * Returns trading PnL for a single ERC-20 token address.
   */
  async getErc20PnL(
    userAddress: string,
    tokenAddress: string,
  ): Promise<Erc20PnL> {
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/pnl/erc20/${tokenAddress}`,
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
   * Returns grouped user history across mint, redeem, unwind, transfer, and fill events.
   */
  async getUserHistories(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history${queryParams}`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch history");
    }
    return data.data;
  }

  /**
   * Returns the user's mint history feed.
   */
  async getMintHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["mints"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/mints${queryParams}`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch mint history");
    }
    return data.data;
  }

  /**
   * Returns the user's redeem history feed.
   */
  async getRedeemHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["redeems"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/redeems${queryParams}`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch redeem history");
    }
    return data.data;
  }

  /**
   * Returns the user's unwind history feed.
   */
  async getUnwindHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["unwinds"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/unwinds${queryParams}`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch unwind history");
    }
    return data.data;
  }

  /**
   * Returns the user's transfer history feed.
   */
  async getTransferHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["transfers"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/transfers${queryParams}`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch transfer history");
    }
    return data.data;
  }

  /**
   * Returns the user's order fill history feed.
   */
  async getFillHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["fills"]> {
    const queryParams = limit ? `?limit=${limit}` : "";
    const response = await fetch(
      `${this.config.baseUrl}/premarket/api/users/${userAddress}/history/fills${queryParams}`,
    );
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch fill history");
    }
    return data.data;
  }

  async getChallenge({
    address,
    chainId,
  }: {
    address: Address;
    chainId: number;
  }): Promise<AuthChallenge> {
    const response = await fetch(`${this.config.baseUrl}/auth/challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chainId: chainId.toString(),
        address,
      }),
    });

    if (!response.ok) {
      throw Error("Failed to fetch challenge");
    }

    const challenge = (await response.json()) as AuthChallenge;

    return challenge;
  }

  async verifyAuth({
    account,
    nonce,
    signature,
    chainId,
    expiresAt,
  }: {
    account: Address;
    signature: Hex;
    nonce: Hex;
    chainId: number;
    expiresAt: number;
  }): Promise<{ access: string }> {
    const response = await fetch(`${this.config.baseUrl}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account,
        nonce,
        signature,
        chainId: chainId.toString(),
        expiresAt,
      }),
    });

    if (!response.ok) {
      throw Error("Failed to verify");
    }

    const verification = (await response.json()) as { access: string };

    return verification;
  }
}
