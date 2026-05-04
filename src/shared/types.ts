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
  submarkets: Erc20Submarket[];
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
