// ============================================================================
// ORDER TYPES
// ============================================================================

import { Hex } from "viem";

export interface Order {
  salt: string;
  nonce: string;
  marketId: string;
  makingAmount: string;
  takingAmount: string;
  deadline: string;
  maker: string;
  receiver: string;
  tradeType: number;
  signatureType: number;
  tokenId: string;
}

export type OrderSignature = `0x${string}`;

/**
 * Wire-format split signature (EIP-2098 compact pair). Used internally when
 * posting orders to orderbook-pg, which expects { r, vs } rather than the
 * 65-byte concatenated hex returned by viem.
 */
export interface SplitOrderSignature {
  r: string;
  vs: string;
}

/**
 * Option parameters for legacy OptionTokenFactory
 * Used for calculating option token IDs
 */
export interface Option {
  marketId: string;
  strikeLowerLimit: string;
  strikeUpperLimit: string;
  isPut: boolean;
}

export enum OrderStatus {
  OPEN = "OPEN",
  PARTIALLY_FILLED = "PARTIALLY_FILLED",
  FULLY_FILLED = "FULLY_FILLED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export type TimeInForce = "FOK" | "FAK" | "GTC" | "GTD";

export interface CreateOrderParams {
  marketId: string;
  order: Order;
  signature: OrderSignature;
  operator?: string;
  /** Primary wallet address (depositor) — required for ERC1271 smart account maker validation */
  depositor?: string;
  timeInForce?: TimeInForce;
  postOnly?: boolean;
}

export type CreateOrderRequest = CreateOrderParams;

export interface StoredOrder {
  orderHash: string;
  signature: OrderSignature;
  marketId: string;
  tokenId: string;
  remainingMakerAmount: string;
  order: Order;
  operator?: string;
  createdAt: number;
  status: OrderStatus;
  side: "bid" | "ask";
  price: number;
  // Enriched by the order-queue when returning user orders
  marketName?: string;
  instrumentName?: string;
  logoUri?: string | null;
}

export type MatchableOrder = StoredOrder;

export interface MatchRequest {
  marketId: string;
  tokenId: string;
  side: "bid" | "ask";
  price: number;
  amount: string;
  timeInForce: TimeInForce;
  postOnly?: boolean;
  orderData: MatchableOrder;
  /** If true, amount is in maker's makingAmount units. If false, amount is in maker's takingAmount units. */
  isMakingAmount?: boolean;
}

export interface MatchedOrder {
  orderHash: string;
  makingAmount: string;
  takingAmount: string;
  /** The amount to pass to Exchange.fillOrder */
  fillAmount: string;
  /** Whether fillAmount is in maker's makingAmount units (true) or takingAmount units (false) */
  isMakingAmount: boolean;
  price: number;
  maker: string;
}

export interface MatchResult {
  success: boolean;
  matches: MatchedOrder[];
  totalMakingAmount: string;
  totalTakingAmount: string;
  remainingAmount: string;
  createdOrder?: { orderHash: string; remainingAmount: string };
  /** True if the user-submitted order's `amount` is in maker's makingAmount units. */
  isMakingAmount?: boolean;
  /** Set to "awaiting match" when the engine's match tail did not arrive within the API's wait window. */
  message?: string;
  error?: string;
}

export interface CreateOrderResult {
  order: MatchableOrder;
  matchResult: MatchResult;
  countFilled: number;
}

export interface OrderResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface OrderbookApiConfig {
  baseUrl: string;
  fetchFn?: typeof fetch;
}

export interface OrdersSnapshot {
  orders: StoredOrder[];
  count: number;
}

// ============================================================================
// MARKET TYPES
// ============================================================================

export type SpreadType = "vanilla" | "standard" | "absolute";

export interface BaseMarket {
  id: string;
  groupId: string | null;
  /** Human-readable group label; only populated for grouped ERC20 markets. */
  groupName: string | null;
  type: "erc6909" | "erc20";
  name: string;
  description: string;
  specification: string;
  minOrderAmount: string;
  createdAt: string;
  priceIncrement: string;
  minPrice: string;
  maxPrice: string;
  collateralToken: string;
  collateralDecimals: number;
  maxDecimals: string | null;
  marketType: "ERC20xERC20" | "ERC20xERC6909";
  logoUri: string | null;
  /** True when the on-chain FinalTick event has been indexed for this market's current expiry. */
  hasFinalTick: boolean;
}

export interface BaseMarketInstrument {
  id: string;
  name: string;
  tick: string;
  isCall: boolean;
  isSpread: boolean;
  spreadType: SpreadType;
  prmTokenId: string;
  oPrmTokenId: string;
  expiry: string;
  lastPrice: string | null;
  bestBid: string | null;
  bestAsk: string | null;
  totalCollateral: string;
  totalPrmSupply: string;
  totalOprmSupply: string;
}

export interface VanillaMarketInstrument extends BaseMarketInstrument {
  isSpread: false;
  spreadType: "vanilla";
}

export interface SpreadMarketInstrument extends BaseMarketInstrument {
  isSpread: true;
  spreadType: "standard" | "absolute";
  lower: string;
  upper: string;
}

export type MarketInstrument =
  | VanillaMarketInstrument
  | SpreadMarketInstrument;

export interface Erc20Submarket {
  id: string;
  /** Numeric market_id of this sub-market (same as id for standalone, member id for grouped). */
  marketId: string;
  name: string;
  tokenAddress: string;
  tokenDecimals: number;
  lastPrice: string | null;
  bestBid: string | null;
  bestAsk: string | null;
}

export interface Erc6909Market extends BaseMarket {
  type: "erc6909";
  name: string;
  creator: string;
  instruments: MarketInstrument[];
  collateral: string;
  underlying: string;
  delivery: string;
  isSpread: boolean;
  spreadType: SpreadType;
  useAbsoluteSpreadCollateral: boolean;
  owner: string;
  tickSize: string;
  tickSpacing: string;
  tokensPerTickSize: string;
  expiry: string;
  depositFeeBps: string;
  redeemFeeBps: string;
  makerFeeBps: string;
  takerFeeBps: string;
  rolloverFeeBps: string;
  totalCollateral: string;
  isCollateralScaled: boolean;
  nonRollable: boolean;
}

export interface Erc20Market extends BaseMarket {
  type: "erc20";
  underlying: string | null;
  underlyingDecimals: number | null;
  /** Sub-markets / instruments in this ERC20 group. */
  instruments: Erc20Submarket[];
  /** @deprecated Use `instruments` instead. Kept for backward compatibility. */
  submarkets?: Erc20Submarket[];
}

export type ApiMarket = Erc6909Market | Erc20Market;
export type Market = ApiMarket;

export interface MarketResponse {
  success: true;
  data: ApiMarket;
}

export interface MarketsResponse {
  success: true;
  data: {
    markets: ApiMarket[];
    total: number;
  };
}

// ============================================================================
// POSITION & PNL TYPES
// ============================================================================

export interface UserPosition {
  id: string;
  tokenId: string;
  holding: string;
  totalCost: string;
  totalProceeds: string;
  realizedPnL: string;
  /** PnL contribution from limit-order trades */
  tradePnl: string;
  /** PnL contribution from redemption / exercise settlements */
  redeemExercisePnl: string;
  updatedAt: string;
}

/**
 * Market/instrument metadata the API attaches to positions and history events.
 * All fields are optional so existing decoders stay backward-compatible.
 */
export interface EventEnrichment {
  collateralSymbol?: string;
  marketId?: string | null;
  marketName?: string;
  instrumentName?: string;
  logoUri?: string | null;
  collateralDecimals?: number;
  collateralToken?: string;
}

/** Position enriched with market/instrument context returned by /positions. */
export interface EnrichedPosition extends UserPosition, EventEnrichment {
  /** true when holding > 0 */
  isOpen: boolean;
  /** true = oPRM (outcome position), false = PRM (write/minted) */
  isOPrm: boolean;
  marketId: string;
  marketName: string;
  instrumentName: string;
  logoUri: string | null;
  collateralDecimals: number;
  collateralToken: string;
}

export interface EnrichedPositionsResponse {
  /** Flat list sorted by updatedAt desc. */
  positions: EnrichedPosition[];
  /** Same positions grouped by market for convenient access. */
  grouped: Array<{
    marketId: string;
    marketName: string;
    logoUri: string | null;
    collateralDecimals: number;
    collateralToken: string;
    positions: EnrichedPosition[];
  }>;
}

export interface TradingPnL {
  id: string;
  asset: `0x${string}`;
  marketId: string | null;
  tokenId: string | null;
  totalBought: string;
  totalSold: string;
  totalSpent: string;
  totalReceived: string;
  realizedPnL: string;
  updatedAt: string;
}

export interface SettlementPnL {
  tokenId: string;
  totalProceeds: string;
  realizedPnL: string;
  updatedAt: string;
}

export interface UserPnL {
  tradePnl: string;
  redeemExercisePnl: string;
  totalPnl: string;
}

export interface TokenPnL {
  tokenId: string;
  position: {
    holding: string;
    totalCost: string;
    totalProceeds: string;
    realizedPnL: string;
  } | null;
  trading: TradingPnL | null;
  redeemExercise: SettlementPnL | null;
  tradePnl: string;
  redeemExercisePnl: string;
  totalPnl: string;
}

export interface Erc20PnL {
  tokenAddress: `0x${string}`;
  trading: TradingPnL | null;
  totalPnl: string;
}

// ============================================================================
// HISTORY TYPES
// ============================================================================

export interface MintHistoryItem extends EventEnrichment {
  id: string;
  marketId: string;
  prmTokenId: string;
  oPrmTokenId: string;
  minter: `0x${string}`;
  amount: string;
  collateralAmount: string;
  fees: string;
  tick: string;
  isCall: boolean;
  expiry: string;
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
  type?: "mint";
}

export interface RedeemHistoryItem extends EventEnrichment {
  id: string;
  oPrmTokenId: string;
  prmTokenId: string;
  redeemer: `0x${string}`;
  balance: string;
  profit: string;
  fees: string;
  /** Net proceeds after fees (profit - fees), as a string */
  netProceeds: string;
  finalTick: string;
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
  type?: "redeem";
}

export interface UnwindHistoryItem extends EventEnrichment {
  id: string;
  marketId: string;
  prmTokenId: string;
  oPrmTokenId: string;
  account: `0x${string}`;
  prmBalance: string;
  oPrmBalance: string;
  collateralReturned: string;
  tick: string;
  isCall: boolean;
  expiry: string;
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
  type?: "unwind";
}

export interface TransferHistoryItem extends EventEnrichment {
  id: string;
  vaultId: string;
  caller: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  tokenId: string;
  amount: string;
  direction: "sent" | "received";
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
  type?: "transfer";
}

export interface OrderFillHistoryItem extends EventEnrichment {
  id: string;
  orderHash: `0x${string}`;
  maker: `0x${string}`;
  taker: `0x${string}`;
  makerAsset: `0x${string}`;
  takerAsset: `0x${string}`;
  makingAmount: string;
  takingAmount: string;
  makerFee: string;
  tradeType: string;
  optionTokenId: string | null;
  role?: "maker" | "taker";
  marketId?: string | null;
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
  /** true = ask (maker sells), false = bid (maker buys); from API when available */
  isAsk?: boolean;
  type?: "fill";
}

/** Recent trade item as returned by getMarketRecentTrades */
export type MarketTradeItem = OrderFillHistoryItem;

export interface WithdrawHistoryItem extends EventEnrichment {
  id: string;
  marketId: string;
  prmTokenId: string;
  account: `0x${string}`;
  amount: string;
  loss: string;
  lossUsdc: string;
  finalTick: string;
  collateral: string;
  netProceeds: string;
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
  type?: "withdraw";
}

export interface RolloverHistoryItem extends EventEnrichment {
  id: string;
  marketId: string;
  oldMarketId: string | null;
  newMarketId: string | null;
  oldPrmTokenId: string;
  newPrmTokenId: string;
  newOPrmTokenId: string | null;
  account: `0x${string}`;
  oldExpiry: string;
  newExpiry: string;
  oldAmount: string;
  residualCollateral: string;
  rolloverFee: string;
  netRolloverCollateral: string;
  newAmount: string;
  /** FinalTick of the just-closed (oldExpiry) epoch, if indexed. Null if the
   * settlement event hasn't been indexed yet or for legacy rows. */
  finalTick: string | null;
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
  type?: "rollover";
}

export interface OrderCancelHistoryItem extends EventEnrichment {
  id: string;
  marketId: string;
  tokenId: string;
  orderHash: `0x${string}`;
  maker: `0x${string}`;
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
  type?: "cancel";
}

export type AnyHistoryEvent =
  | MintHistoryItem
  | RedeemHistoryItem
  | UnwindHistoryItem
  | WithdrawHistoryItem
  | RolloverHistoryItem
  | TransferHistoryItem
  | OrderFillHistoryItem
  | OrderCancelHistoryItem;

export interface UserHistories {
  mints: MintHistoryItem[];
  redeems: RedeemHistoryItem[];
  unwinds: UnwindHistoryItem[];
  withdraws: WithdrawHistoryItem[];
  rollovers: RolloverHistoryItem[];
  transfers: TransferHistoryItem[];
  fills: OrderFillHistoryItem[];
  cancels: OrderCancelHistoryItem[];
  /**
   * All of the above merged and sorted chronologically (newest first).
   * Each event has a `type` discriminator field.
   * Populated by /history — may be absent on sub-routes like /history/mints.
   */
  timeline?: AnyHistoryEvent[];
}

export interface PaginatedOrdersResponse {
  orders: StoredOrder[];
  count: number;
  hasMore: boolean;
  nextOffset: number;
}

// ============================================================================
// DEPTH TYPES
// ============================================================================

// Note: DepthLevel is exported from sync/clients/order-client.ts
// Use that type for consistency with the sync client

export type AuthChallenge = {
  readonly domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: `0x${string}`;
  };
  readonly types: {
    Login: Array<{
      name: string;
      type: string;
    }>;
  };
  message: {
    nonce: Hex;
    expiresAt: number;
  };
};
