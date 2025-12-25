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
  ACTIVE = "ACTIVE",
  FILLED = "FILLED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface StoredOrder {
  id: string;
  orderHash: string;
  orderType: OrderType;
  order: Order;
  extensionEncoded: string;
  signature: OrderSignature;
  marketId: string;
  optionTokenId: string;
  stableToken: string;
  optionAmount: string;
  stableAmount: string;
  status: OrderStatus;
  filledAmount: string;
  remainingMakerAmount: string; // Remaining maker amount left for the order
  maker: string;
  operator?: string; // Optional operator address (for smart account orders signed by owner/subkey)
  createdAt: number;
  expiresAt?: number;
}

export interface CreateOrderParams {
  orderType: OrderType;
  marketId: string;
  option: Option;
  order: Order;
  extensionEncoded: string;
  signature: OrderSignature;
  optionAmount: string;
  stableAmount: string;
  stableToken: string;
  makerProxyAddress: string;
  operator?: string; // Optional operator address (for smart account orders signed by owner/subkey)
  expiresAt?: number;
}

// Alias for API compatibility
export type CreateOrderRequest = CreateOrderParams;

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
