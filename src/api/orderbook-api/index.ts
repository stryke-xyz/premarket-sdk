// ============================================================================
// ORDERBOOK API CLIENT
// ============================================================================

import { Address, Hex } from "viem";
import type {
  StoredOrder,
  CreateOrderParams,
  CreateOrderResult,
  MarketsResponse,
  MarketResponse,
  UserPosition,
  TradingPnL,
  UserPnL,
  TokenPnL,
  Erc20PnL,
  UserHistories,
  EnrichedPosition,
  EnrichedPositionsResponse,
  OrderbookApiConfig,
  OrdersSnapshot,
  PaginatedOrdersResponse,
  MarketTradeItem,
  AuthChallenge,
} from "../../shared/types.js";

// ============================================================================
// SIGNATURE NORMALIZATION
// ============================================================================

/**
 * Wire shape expected by orderbook-pg: split EIP-2098 compact signature.
 * `r` is the standard r component (32 bytes hex). `vs` packs s + recovery bit
 * (v-27) into the most-significant bit, per EIP-2098.
 */
interface SplitOrderSignature {
  r: string;
  vs: string;
}

/**
 * Accepts either:
 *   - a 65-byte concatenated hex signature `0x{r:32}{s:32}{v:1}` (what
 *     `walletClient.signTypedData` and `signSimpleAccountOrder` return), or
 *   - an already-split `{ r, vs }` payload.
 *
 * Returns the EIP-2098 split form the backend's signature recovery expects.
 */
function toCompactSignature(
  signature: string | SplitOrderSignature,
): SplitOrderSignature {
  if (typeof signature === "object" && signature !== null) {
    return { r: signature.r, vs: signature.vs };
  }
  const hex = signature.startsWith("0x") ? signature.slice(2) : signature;
  if (hex.length !== 130) {
    throw new Error(
      `Invalid signature length: expected 65 bytes (130 hex chars), got ${hex.length}`,
    );
  }
  const r = `0x${hex.slice(0, 64)}`;
  const sHex = hex.slice(64, 128);
  const vByte = parseInt(hex.slice(128, 130), 16);
  if (vByte !== 27 && vByte !== 28) {
    throw new Error(`Invalid signature v byte: expected 27 or 28, got ${vByte}`);
  }
  const recoveryBit = vByte - 27;
  // Pack recoveryBit into the high bit of s to form vs.
  const sBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    sBytes[i] = parseInt(sHex.slice(i * 2, i * 2 + 2), 16);
  }
  if (recoveryBit === 1) sBytes[0] |= 0x80;
  let vs = "0x";
  for (let i = 0; i < 32; i++) {
    vs += sBytes[i].toString(16).padStart(2, "0");
  }
  return { r, vs };
}

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
   * Submits a new order and synchronously returns the engine's match outcome.
   *
   * The backend awaits the matching engine's reply (up to ~2s) before
   * responding, so callers get the full `matchResult` (`matches`, totals,
   * `createdOrder`) inline. If the engine reply does not arrive in time
   * `matchResult.message === "awaiting match"` and `matches` is empty —
   * clients should then poll `getOrder(orderHash)` or watch the user
   * activity WS for the eventual fill.
   */
  async createOrder(
    params: CreateOrderParams,
    bearerToken: string,
  ): Promise<CreateOrderResult> {
    const wireParams = {
      ...params,
      signature: toCompactSignature(params.signature),
    };
    return (await this.requestEnvelope<CreateOrderResult>(
      "/orderbook/api/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(wireParams),
      },
      "Failed to create order",
    )) as CreateOrderResult;
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
   * Returns active (non-cancelled, non-fully-filled, non-expired) orders for a market.
   * If `maker` is provided, scopes to a single user's open orders.
   */
  async getOrders(marketId: string, maker?: string): Promise<StoredOrder[]> {
    const data = await this.requestEnvelope<OrdersSnapshot>(
      this.buildUrl("/orderbook/api/orders", { marketId, maker }),
      undefined,
      "Failed to fetch orders",
    );
    return data?.orders ?? [];
  }

  /**
   * Returns active orders for a single user in a market.
   * Convenience wrapper around `getOrders(marketId, maker)`.
   */
  async getUserOrders(maker: string, marketId: string): Promise<StoredOrder[]> {
    return this.getOrders(marketId, maker);
  }

  /**
   * Returns a user's open orders across **all** markets, paginated.
   *
   * When `marketId` is omitted, the order-queue service switches to
   * paginated mode and requires `maker`.  Pass `limit` (1–1000, default
   * 1000) and `offset` (default 0) to page through results.
   */
  async getUserOrdersAllMarkets(
    maker: string,
    opts?: { limit?: number; offset?: number; status?: "all" },
  ): Promise<PaginatedOrdersResponse> {
    const data = await this.requestEnvelope<PaginatedOrdersResponse>(
      this.buildUrl("/orderbook/api/orders", {
        maker,
        limit: opts?.limit,
        offset: opts?.offset,
        status: opts?.status,
      }),
      undefined,
      "Failed to fetch orders",
    );
    return data ?? { orders: [], count: 0, hasMore: false, nextOffset: 0 };
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
   * Returns enriched user positions including market name, instrument name,
   * logo, collateral info, PnL, and role (isOPrm / isOpen).
   * Also includes a `grouped` array keyed by market.
   */
  async getUserPositions(userAddress: string): Promise<EnrichedPositionsResponse> {
    return (await this.requestEnvelope<EnrichedPositionsResponse>(
      `/premarket/api/users/${encodeURIComponent(userAddress)}/positions`,
      undefined,
      "Failed to fetch positions",
    )) as EnrichedPositionsResponse;
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
   * Returns grouped + enriched user history. Every event carries marketName,
   * instrumentName, logoUri, collateralDecimals, collateralToken, and a `type`
   * discriminator. The `timeline` field is a flat chronological list of all events.
   */
  async getUserHistories(
    userAddress: string,
    opts?: { limit?: number; marketId?: string; tokenId?: string },
  ): Promise<UserHistories> {
    const limit = typeof opts === "number" ? opts : opts?.limit;
    const marketId = typeof opts === "object" ? opts.marketId : undefined;
    const tokenId = typeof opts === "object" ? opts.tokenId : undefined;
    return (await this.requestEnvelope<UserHistories>(
      this.buildUrl(
        `/premarket/api/users/${encodeURIComponent(userAddress)}/history`,
        { limit, marketId, tokenId },
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
