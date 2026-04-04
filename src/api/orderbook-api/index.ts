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
  OrdersSnapshot,
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
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(private readonly config: OrderbookApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.fetchFn = config.fetchFn ?? fetch;
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): string {
    const url = new URL(path, `${this.baseUrl}/`);

    if (!query) {
      return url.toString();
    }

    for (const [key, value] of Object.entries(query)) {
      if (value == null) continue;
      url.searchParams.set(key, String(value));
    }

    return url.toString();
  }

  private async parseJsonBody(
    response: Response,
    defaultError: string,
  ): Promise<unknown> {
    const text = await response.text();
    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `${defaultError}: expected a JSON response (status ${response.status})`,
      );
    }
  }

  private getErrorMessage(
    response: Response,
    payload: unknown,
    defaultError: string,
  ): string {
    if (
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      typeof payload.error === "string" &&
      payload.error.length > 0
    ) {
      return payload.error;
    }

    if (response.statusText) {
      return `${defaultError} (${response.status} ${response.statusText})`;
    }

    return `${defaultError} (status ${response.status})`;
  }

  private isEnvelope<T>(
    payload: unknown,
  ): payload is { success: boolean; data?: T; error?: string } {
    return Boolean(
      payload &&
      typeof payload === "object" &&
      "success" in payload &&
      typeof payload.success === "boolean",
    );
  }

  private async requestEnvelope<T>(
    path: string,
    init: RequestInit | undefined,
    defaultError: string,
    options?: { allowNotFound?: boolean },
  ): Promise<T | null> {
    const response = await this.fetchFn(this.buildUrl(path), init);
    if (options?.allowNotFound && response.status === 404) {
      return null;
    }

    const payload = await this.parseJsonBody(response, defaultError);

    if (!response.ok) {
      throw new Error(this.getErrorMessage(response, payload, defaultError));
    }

    if (!this.isEnvelope<T>(payload)) {
      throw new Error(`${defaultError}: malformed response body`);
    }

    if (!payload.success) {
      throw new Error(payload.error || defaultError);
    }

    return (payload.data ?? null) as T | null;
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit | undefined,
    defaultError: string,
  ): Promise<T> {
    const response = await this.fetchFn(this.buildUrl(path), init);
    const payload = await this.parseJsonBody(response, defaultError);

    if (!response.ok) {
      throw new Error(this.getErrorMessage(response, payload, defaultError));
    }

    if (payload == null) {
      throw new Error(`${defaultError}: empty response body`);
    }

    return payload as T;
  }

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
    return (await this.requestEnvelope<StoredOrder>(
      "/orderbook/api/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(params),
      },
      "Failed to create order",
    )) as StoredOrder;
  }

  /**
   * Fetches a single stored order by its order hash.
   */
  async getOrder(orderHash: string): Promise<StoredOrder | null> {
    return this.requestEnvelope<StoredOrder>(
      `/orderbook/api/orders/${encodeURIComponent(orderHash)}`,
      undefined,
      "Failed to fetch order",
      { allowNotFound: true },
    );
  }

  /**
   * Queries orders using optional market, maker, status, and pagination filters.
   */
  async queryOrders(params: OrderQueryParams): Promise<QueryOrdersResponse> {
    const url = this.buildUrl("/orderbook/api/orders", {
      marketId: params.marketId,
      maker: params.maker,
      status: params.status,
      limit: params.limit,
      offset: params.offset,
    });

    return (await this.requestEnvelope<QueryOrdersResponse>(
      url,
      undefined,
      "Failed to query orders",
    )) as QueryOrdersResponse;
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

    const data = await this.requestEnvelope<OrdersSnapshot>(
      this.buildUrl(`/orderbook/api/orders/user/${encodeURIComponent(maker)}`, {
        marketId,
      }),
      undefined,
      "Failed to get orders snapshot",
    );

    return data?.orders || [];
  }

  /**
   * Fetches the current depth snapshot for one market and token pair.
   */
  async getDepthSnapshot(
    marketId: string,
    tokenId: string,
  ): Promise<DepthSnapshot> {
    return (await this.requestEnvelope<DepthSnapshot>(
      this.buildUrl("/orderbook/api/depth", {
        marketId,
        tokenId,
      }),
      undefined,
      "Failed to get depth snapshot",
    )) as DepthSnapshot;
  }

  // ============================================================================
  // MARKET METHODS
  // ============================================================================

  /**
   * Returns the paginated market catalog from the premarket API.
   */
  async getMarkets(): Promise<MarketsResponse["data"]> {
    return (await this.requestEnvelope<MarketsResponse["data"]>(
      "/premarket/api/markets",
      undefined,
      "Failed to fetch markets",
    )) as MarketsResponse["data"];
  }

  /**
   * Returns recent trade activity for a market, ordered by newest first.
   */
  async getMarketRecentTrades(
    marketId: string,
    limit?: number,
  ): Promise<MarketTradeItem[]> {
    return (await this.requestEnvelope<MarketTradeItem[]>(
      this.buildUrl(
        `/premarket/api/markets/${encodeURIComponent(marketId)}/trades`,
        {
          limit,
        },
      ),
      undefined,
      "Failed to fetch market trades",
    )) as MarketTradeItem[];
  }

  /**
   * Fetches one market by id, returning `null` on a 404 response.
   */
  async getMarket(marketId: string): Promise<MarketResponse["data"] | null> {
    return this.requestEnvelope<MarketResponse["data"]>(
      `/premarket/api/markets/${encodeURIComponent(marketId)}`,
      undefined,
      "Failed to fetch market",
      { allowNotFound: true },
    );
  }

  // ============================================================================
  // USER POSITION & PNL METHODS
  // ============================================================================

  /**
   * Returns current user positions derived from vault activity.
   */
  async getUserPositions(userAddress: string): Promise<UserPosition[]> {
    return (await this.requestEnvelope<UserPosition[]>(
      `/premarket/api/users/${encodeURIComponent(userAddress)}/positions`,
      undefined,
      "Failed to fetch positions",
    )) as UserPosition[];
  }

  /**
   * Returns realized trading PnL for limit-order activity.
   */
  async getUserTradingPnL(userAddress: string): Promise<TradingPnL[]> {
    return (await this.requestEnvelope<TradingPnL[]>(
      `/premarket/api/users/${encodeURIComponent(userAddress)}/trading`,
      undefined,
      "Failed to fetch trading PnL",
    )) as TradingPnL[];
  }

  /**
   * Returns aggregated user PnL across positions and orderbook trading.
   */
  async getUserPnL(userAddress: string): Promise<UserPnL> {
    return (await this.requestEnvelope<UserPnL>(
      `/premarket/api/users/${encodeURIComponent(userAddress)}/pnl`,
      undefined,
      "Failed to fetch PnL",
    )) as UserPnL;
  }

  /**
   * Returns PnL for a single ERC-6909 token id.
   */
  async getTokenPnL(userAddress: string, tokenId: string): Promise<TokenPnL> {
    return (await this.requestEnvelope<TokenPnL>(
      `/premarket/api/users/${encodeURIComponent(userAddress)}/pnl/${encodeURIComponent(tokenId)}`,
      undefined,
      "Failed to fetch token PnL",
    )) as TokenPnL;
  }

  /**
   * Returns trading PnL for a single ERC-20 token address.
   */
  async getErc20PnL(
    userAddress: string,
    tokenAddress: string,
  ): Promise<Erc20PnL> {
    return (await this.requestEnvelope<Erc20PnL>(
      `/premarket/api/users/${encodeURIComponent(userAddress)}/pnl/erc20/${encodeURIComponent(tokenAddress)}`,
      undefined,
      "Failed to fetch ERC20 PnL",
    )) as Erc20PnL;
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
    return (await this.requestEnvelope<UserHistories>(
      this.buildUrl(
        `/premarket/api/users/${encodeURIComponent(userAddress)}/history`,
        {
          limit,
        },
      ),
      undefined,
      "Failed to fetch history",
    )) as UserHistories;
  }

  /**
   * Returns the user's mint history feed.
   */
  async getMintHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["mints"]> {
    return (await this.requestEnvelope<UserHistories["mints"]>(
      this.buildUrl(
        `/premarket/api/users/${encodeURIComponent(userAddress)}/history/mints`,
        {
          limit,
        },
      ),
      undefined,
      "Failed to fetch mint history",
    )) as UserHistories["mints"];
  }

  /**
   * Returns the user's redeem history feed.
   */
  async getRedeemHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["redeems"]> {
    return (await this.requestEnvelope<UserHistories["redeems"]>(
      this.buildUrl(
        `/premarket/api/users/${encodeURIComponent(userAddress)}/history/redeems`,
        {
          limit,
        },
      ),
      undefined,
      "Failed to fetch redeem history",
    )) as UserHistories["redeems"];
  }

  /**
   * Returns the user's unwind history feed.
   */
  async getUnwindHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["unwinds"]> {
    return (await this.requestEnvelope<UserHistories["unwinds"]>(
      this.buildUrl(
        `/premarket/api/users/${encodeURIComponent(userAddress)}/history/unwinds`,
        {
          limit,
        },
      ),
      undefined,
      "Failed to fetch unwind history",
    )) as UserHistories["unwinds"];
  }

  /**
   * Returns the user's transfer history feed.
   */
  async getTransferHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["transfers"]> {
    return (await this.requestEnvelope<UserHistories["transfers"]>(
      this.buildUrl(
        `/premarket/api/users/${encodeURIComponent(userAddress)}/history/transfers`,
        {
          limit,
        },
      ),
      undefined,
      "Failed to fetch transfer history",
    )) as UserHistories["transfers"];
  }

  /**
   * Returns the user's order fill history feed.
   */
  async getFillHistory(
    userAddress: string,
    limit?: number,
  ): Promise<UserHistories["fills"]> {
    return (await this.requestEnvelope<UserHistories["fills"]>(
      this.buildUrl(
        `/premarket/api/users/${encodeURIComponent(userAddress)}/history/fills`,
        {
          limit,
        },
      ),
      undefined,
      "Failed to fetch fill history",
    )) as UserHistories["fills"];
  }

  async getChallenge({
    address,
    chainId,
  }: {
    address: Address;
    chainId: number;
  }): Promise<AuthChallenge> {
    return this.requestJson<AuthChallenge>(
      "/auth/challenge",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: chainId.toString(),
          address,
        }),
      },
      "Failed to fetch challenge",
    );
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
    return this.requestJson<{ access: string }>(
      "/auth/verify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account,
          nonce,
          signature,
          chainId: chainId.toString(),
          expiresAt,
        }),
      },
      "Failed to verify",
    );
  }
}
