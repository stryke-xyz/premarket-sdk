// ============================================================================
// ORDER TYPES
// ============================================================================

export interface Order {
  salt: string;
  maker: string;
  receiver: string;
  makerAsset: string;
  takerAsset: string;
  makingAmount: string;
  takingAmount: string;
  makerTraits: string;
}

export interface OrderSignature {
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
  extensionEncoded: string;
  signature: OrderSignature;
  operator?: string;
  expiresAt?: number;
  timeInForce?: TimeInForce;
  postOnly?: boolean;
}

export type CreateOrderRequest = CreateOrderParams;

export interface StoredOrder {
  orderHash: string;
  extensionEncoded: string;
  signature: OrderSignature;
  marketId: string;
  tokenId: string;
  remainingMakerAmount: string;
  order: Order;
  operator?: string;
  createdAt: number;
  expiresAt?: number;
  status: OrderStatus;
  side: "bid" | "ask";
  price: number;
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
  /** The amount to pass to fillContractOrderArgs */
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
  error?: string;
}

export interface MatchAndUpdateParams {
  marketId: string;
  tokenId: string;
  makerSide: "bid" | "ask";
  takerPrice: number;
  takerAmount: string;
  createOrderForRemainder: boolean;
  requireFullFill?: boolean;
  orderData?: MatchableOrder;
  /** If true, takerAmount is in maker's makingAmount units. If false, takerAmount is in maker's takingAmount units. */
  isMakingAmount?: boolean;
}

export interface CreateOrderResult {
  order: MatchableOrder;
  matchResult: MatchResult;
  countFilled: number;
}

export interface OrderQueryParams {
  marketId?: string;
  maker?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface OrderResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface OrderbookApiConfig {
  baseUrl: string;
}

export interface OrdersSnapshot {
  orders: StoredOrder[];
  count: number;
}

export interface QueryOrdersResponse {
  orders: StoredOrder[];
  count: number;
  limit: number;
  offset: number;
}

export interface SyncMessage {
  seq: number;
  type: string;
  data: any;
}

export interface BalanceMessage {
  seq: number;
  type: string;
  data: any;
}

export interface BalanceSnapshot {
  balances: any[];
  seq: number;
}

// ============================================================================
// MARKET TYPES (New Schema)
// ============================================================================

/** Market state with best bid/ask and last trade price */
export interface MarketState {
  lastPrice: string | null;
  bestBid: string | null;
  bestAsk: string | null;
}

/** Onchain OptionMarketVault data */
export interface OptionMarketVault {
  underlying: `0x${string}`;
  collateral: `0x${string}`;
  delivery: `0x${string}`;
  owner: `0x${string}`;
  creator: `0x${string}`;
  tickSize: string;
  tickSpacing: string;
  tokensPerTickSize: string;
  expiry: string;
  depositFeeBps: string;
  redeemFeeBps: string;
  isCollateralScaled: boolean;
  totalPrmMinted: string;
  totalCollateralDeposited: string;
  totalFeesCollected: string;
  createdAt: string;
  updatedAt: string;
}

/** Instrument for ERC6909 markets (options) - API response type */
export interface ApiInstrument extends MarketState {
  id: string;
  name: string;
  tick: string;
  isCall: boolean;
  prmTokenId: string;
  oPrmTokenId: string;
  expiry: string;
}

/** Submarket for ERC20 markets (pre-TGE tokens) */
export interface Submarket extends MarketState {
  id: string;
  name: string;
  tokenAddress: string;
  tokenDecimals: number;
}

/** Base market fields shared by all market types */
export interface BaseMarket {
  id: string;
  name: string;
  specification: string;
  collateralToken: string;
  collateralDecimals: number;
}

/** ERC6909 market (options with instruments) */
export interface Erc6909Market extends BaseMarket {
  type: "erc6909";
  marketId: string | null;
  optionMarketVault: OptionMarketVault | null;
  instruments: ApiInstrument[];
  // Only returned on single market query
  prmTokens?: PrmToken[];
  finalTicks?: FinalTickInfo[];
}

/** ERC20 market (pre-TGE with submarkets) */
export interface Erc20Market extends BaseMarket {
  type: "erc20";
  createdAt: string;
  submarkets: Submarket[];
}

/** Union type for all markets - API response type */
export type ApiMarket = Erc6909Market | Erc20Market;

/** Response from getMarkets() */
export interface MarketsResponse {
  erc6909: Erc6909Market[];
  erc20: Erc20Market[];
  total: number;
}

/** @deprecated Use Market instead */
export type OptionMarket = Erc6909Market;

export interface PrmToken {
  id: string;
  prmTokenId: string;
  oPrmTokenId: string;
  tick: string;
  isCall: boolean;
  expiry: string;
  totalMinted: string;
  totalRedeemed: string;
  totalUnwound: string;
}

export interface FinalTickInfo {
  expiry: string;
  finalTick: string;
  updater: `0x${string}`;
  updatedAt: string;
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
  updatedAt: string;
}

export interface TradingPnL {
  id: string;
  asset: `0x${string}`;
  tokenId: string | null;
  totalBought: string;
  totalSold: string;
  totalSpent: string;
  totalReceived: string;
  realizedPnL: string;
  updatedAt: string;
}

export interface UserPnL {
  positionPnL: string;
  tradingPnL: string;
  totalPnL: string;
}

export interface TokenPnL {
  tokenId: string;
  position: {
    holding: string;
    totalCost: string;
    totalProceeds: string;
    realizedPnL: string;
  } | null;
  trading: {
    totalBought: string;
    totalSold: string;
    totalSpent: string;
    totalReceived: string;
    realizedPnL: string;
  } | null;
  positionPnL: string;
  tradingPnL: string;
  totalPnL: string;
}

export interface Erc20PnL {
  tokenAddress: `0x${string}`;
  trading: {
    totalBought: string;
    totalSold: string;
    totalSpent: string;
    totalReceived: string;
    realizedPnL: string;
  } | null;
  totalPnL: string;
}

// ============================================================================
// HISTORY TYPES
// ============================================================================

export interface MintHistoryItem {
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
}

export interface RedeemHistoryItem {
  id: string;
  oPrmTokenId: string;
  prmTokenId: string;
  redeemer: `0x${string}`;
  balance: string;
  profit: string;
  fees: string;
  finalTick: string;
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
}

export interface UnwindHistoryItem {
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
}

export interface TransferHistoryItem {
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
}

export interface OrderFillHistoryItem {
  id: string;
  orderHash: `0x${string}`;
  maker: `0x${string}`;
  taker: `0x${string}`;
  makerAsset: `0x${string}`;
  takerAsset: `0x${string}`;
  makingAmount: string;
  takingAmount: string;
  tradeType: string;
  optionTokenId: string | null;
  role?: "maker" | "taker";
  marketId?: string | null;
  transactionHash: `0x${string}`;
  blockNumber: string;
  timestamp: string;
  /** true = ask (maker sells), false = bid (maker buys); from API when available */
  isAsk?: boolean;
}

/** Recent trade item as returned by getMarketRecentTrades */
export type MarketTradeItem = OrderFillHistoryItem;

export interface UserHistories {
  mints: MintHistoryItem[];
  redeems: RedeemHistoryItem[];
  unwinds: UnwindHistoryItem[];
  transfers: TransferHistoryItem[];
  fills: OrderFillHistoryItem[];
}

// ============================================================================
// DEPTH TYPES
// ============================================================================

// Note: DepthLevel is exported from sync/clients/order-client.ts
// Use that type for consistency with the sync client

export interface DepthSnapshot {
  bids: { price: string; depth: string }[];
  asks: { price: string; depth: string }[];
  bestBid: string | null;
  bestAsk: string | null;
  lastPrice: string | null;
  seq: string;
}
