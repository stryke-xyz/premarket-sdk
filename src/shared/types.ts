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

export interface Option {
  marketId: string;
  strikeLowerLimit: string;
  strikeUpperLimit: string;
  isPut: boolean;
}

export enum OrderType {
  SELL_OPTIONS = "SELL_OPTIONS",
  BUY_OPTIONS = "BUY_OPTIONS",
}

export enum OrderStatus {
  OPEN = "OPEN",
  PARTIALLY_FILLED = "PARTIALLY_FILLED",
  FULLY_FILLED = "FULLY_FILLED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

// Time in force options for orders
export type TimeInForce = "FOK" | "FAK" | "GTC" | "GTD";

export interface CreateOrderParams {
  marketId: string;
  order: Order;
  extensionEncoded: string;
  signature: OrderSignature;
  operator?: string;
  expiresAt?: number;
  timeInForce?: TimeInForce; // Default: GTC
  postOnly?: boolean; // If true, place in book without matching
}

// Alias for API compatibility
export type CreateOrderRequest = CreateOrderParams;

// Stored order in database - has all required fields
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

// Matchable order - extends StoredOrder, used for order matching
export type MatchableOrder = StoredOrder;

// Request to match an order against the book
export interface MatchRequest {
  marketId: string;
  tokenId: string;
  side: "bid" | "ask";
  price: number;
  amount: string;
  timeInForce: TimeInForce;
  postOnly?: boolean;
  orderData: MatchableOrder;
}

// Single matched order from the book
export interface MatchedOrder {
  orderHash: string;
  makingAmount: string;
  takingAmount: string;
  price: number;
  maker: string;
}

// Result of a match operation
export interface MatchResult {
  success: boolean;
  matches: MatchedOrder[];
  totalMakingAmount: string;
  totalTakingAmount: string;
  remainingAmount: string;
  createdOrder?: { orderHash: string; remainingAmount: string };
  error?: string;
}

// Database match params
export interface MatchAndUpdateParams {
  marketId: string;
  tokenId: string;
  makerSide: "bid" | "ask"; // Side of orders we're matching against
  takerPrice: number;
  takerAmount: string;
  createOrderForRemainder: boolean;
  requireFullFill?: boolean;
  orderData?: MatchableOrder;
}

// Create order result
export interface CreateOrderResult {
  order: MatchableOrder;
  matchResult: MatchResult;
  countFilled: number;
}

export interface OrderQueryParams {
  marketId?: string;
  orderType?: OrderType;
  maker?: string;
  stableToken?: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

export interface OrderResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Orderbook API Types
export interface OrderbookApiConfig {
  baseUrl: string;
}

export interface OrderQueryParams {
  marketId?: string;
  orderType?: OrderType;
  maker?: string;
  stableToken?: string;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
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

// Options Market Types
export interface MarketStrategy {
  id: string;
  finalFDV: bigint;
  deadline: bigint;
  bandPrecision: bigint;
  collateralPerBandPrecision: bigint;
  premiumRate: bigint;
  depositFeeRate: bigint;
  purchaseFeeRate: bigint;
  settlementFeeRate: bigint;
  collateralToken: `0x${string}`;
}

export interface OptionMarket {
  id: string;
  callToken: `0x${string}`;
  putToken: `0x${string}`;
  expiry: bigint;
  maxTTL: bigint;
  strategy: MarketStrategy;
  collateralToken: `0x${string}`;
  totalCollateral: bigint;
  totalCollateralAmount: bigint;
  protocolFees: bigint;
}

export interface OptionParams {
  id: string;
  marketId: bigint;
  strikeLowerLimit: bigint;
  strikeUpperLimit: bigint;
  isPut: boolean;
  collateralPerShare?: bigint;
}

export interface Position {
  id: string;
  optionId: string;
  optionMarketId: string;
  userId: string;
  collateralShares: bigint;
  optionsShares: bigint;
  exercisedOptionsShares: bigint;
  exercisedCollateralShares: bigint;
  premiumEarned: bigint;
  fee: bigint;
  updatedAt: bigint;
  updatedAtBlock: bigint;
  profit: bigint;
  makerLoss: bigint;
  averagePrice: bigint;
  premiumPaid: bigint;
  optionMarket?: OptionMarket;
  optionParams?: OptionParams;
}

export interface DepositHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  receiver: `0x${string}`;
  amount: bigint;
  collateralAmount: bigint;
  fee: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface TransferDepositHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  amount: bigint;
  collateralAmount: bigint;
  fee: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface PurchaseHistory {
  id: string;
  optionId: string;
  purchaser: `0x${string}`;
  amount: bigint;
  premiumAmount: bigint;
  fee: bigint;
  optionShares: bigint;
  sharesUtilized: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface TransferPositionHistory {
  id: string;
  optionId: string;
  purchaser: `0x${string}`;
  amount: bigint;
  premiumAmount: bigint;
  fee: bigint;
  optionShares: bigint;
  sharesUtilized: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface ExerciseHistory {
  id: string;
  optionId: string;
  exerciser: `0x${string}`;
  amount: bigint;
  profitAmount: bigint;
  fee: bigint;
  optionTokensBurnt: bigint;
  sharesUnutilized: bigint;
  makerLoss: bigint | null;
  purchaserProfit: bigint | null;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface UnwindHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  amount: bigint;
  collateralTokensToReturn: bigint;
  collateralSharesToBurn: bigint;
  optionSharesToBurn: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface WithdrawHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  user: `0x${string}`;
  receiver: `0x${string}`;
  sharesBurnt: bigint;
  withdrawAmount: bigint;
  makerLoss: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface TransferCollateralSharesHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  user: `0x${string}`;
  receiver: `0x${string}`;
  amount: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
  userSide: "sender" | "receiver" | "both";
}

export interface TransferOptionsSharesHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  user: `0x${string}`;
  receiver: `0x${string}`;
  amount: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
  userSide: "sender" | "receiver" | "both";
}

export interface OrderFillHistory {
  id: string;
  orderHash: `0x${string}`;
  maker: `0x${string}`;
  taker: `0x${string}`;
  optionTokenId: string;
  makingAmount: bigint;
  takingAmount: bigint;
  price: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
  userSide: "maker" | "taker";
}

export interface UserHistories {
  depositHistory: DepositHistory[];
  transferDepositHistory: TransferDepositHistory[];
  transferCollateralSharesHistory: TransferCollateralSharesHistory[];
  transferOptionsSharesHistory: TransferOptionsSharesHistory[];
  purchaseHistory: PurchaseHistory[];
  transferPositionHistory: TransferPositionHistory[];
  exerciseHistory: ExerciseHistory[];
  unwindHistory: UnwindHistory[];
  withdrawHistory: WithdrawHistory[];
  orderFillHistory: OrderFillHistory[];
}

export interface OptionsMarketApiConfig {
  baseUrl: string;
}

export interface MarketData {
  market: OptionMarket;
  positions: Position[];
}

export interface MarketPositions {
  positions: Position[];
}

export interface Volume24hData {
  optionId: string;
  volume24h: string;
  volume24hChange: string;
  totalTradeCount: number;
}

export interface Volumes24hResponse {
  marketId: string;
  volumes: Volume24hData[];
}
