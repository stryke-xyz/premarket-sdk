import type { Address, Hex } from "viem";

/** Direction of the maker order in the exchange. */
export enum TradeType {
  BUY = 0,
  SELL = 1,
}

/** Signature validation mode expected by the exchange contract. */
export enum SignatureType {
  EIP712 = 0,
  ERC1271 = 1,
}

/** Canonical in-memory exchange order shape using bigint fields. */
export interface ExchangeOrder {
  salt: bigint;
  nonce: bigint;
  marketId: bigint;
  makingAmount: bigint;
  takingAmount: bigint;
  deadline: bigint;
  maker: Address;
  receiver: Address;
  tradeType: TradeType;
  signatureType: SignatureType;
  tokenId: bigint;
}

/** JSON-safe exchange order shape used by APIs and persistence layers. */
export interface SerializedExchangeOrder {
  salt: string;
  nonce: string;
  marketId: string;
  makingAmount: string;
  takingAmount: string;
  deadline: string;
  maker: Address;
  receiver: Address;
  tradeType: number;
  signatureType: number;
  tokenId: string;
}

/** Onchain fill state returned by exchange status lookups. */
export interface ExchangeOrderStatus {
  isFilledOrCancelled: boolean;
  remaining: bigint;
}

/** Serialized variant of {@link ExchangeOrderStatus}. */
export interface SerializedExchangeOrderStatus {
  isFilledOrCancelled: boolean;
  remaining: string;
}

/** Result item returned by exchange multicall helpers. */
export interface MulticallResult {
  success: boolean;
  returnData: Hex;
}

/** Converts an in-memory order into the stringified API shape. */
export function serializeExchangeOrder(
  order: ExchangeOrder
): SerializedExchangeOrder {
  return {
    salt: order.salt.toString(),
    nonce: order.nonce.toString(),
    marketId: order.marketId.toString(),
    makingAmount: order.makingAmount.toString(),
    takingAmount: order.takingAmount.toString(),
    deadline: order.deadline.toString(),
    maker: order.maker,
    receiver: order.receiver,
    tradeType: Number(order.tradeType),
    signatureType: Number(order.signatureType),
    tokenId: order.tokenId.toString(),
  };
}

/** Restores bigint enum fields from a serialized exchange order payload. */
export function deserializeExchangeOrder(
  order: SerializedExchangeOrder
): ExchangeOrder {
  return {
    salt: BigInt(order.salt),
    nonce: BigInt(order.nonce),
    marketId: BigInt(order.marketId),
    makingAmount: BigInt(order.makingAmount),
    takingAmount: BigInt(order.takingAmount),
    deadline: BigInt(order.deadline),
    maker: order.maker,
    receiver: order.receiver,
    tradeType: order.tradeType as TradeType,
    signatureType: order.signatureType as SignatureType,
    tokenId: BigInt(order.tokenId),
  };
}

/** Converts bigint status fields into a transport-safe string payload. */
export function serializeOrderStatus(
  status: ExchangeOrderStatus
): SerializedExchangeOrderStatus {
  return {
    isFilledOrCancelled: status.isFilledOrCancelled,
    remaining: status.remaining.toString(),
  };
}

/** Restores bigint fields from a serialized exchange order status payload. */
export function deserializeOrderStatus(
  status: SerializedExchangeOrderStatus
): ExchangeOrderStatus {
  return {
    isFilledOrCancelled: status.isFilledOrCancelled,
    remaining: BigInt(status.remaining),
  };
}
