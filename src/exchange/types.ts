import type { Address, Hex } from "viem";

export enum TradeType {
  BUY = 0,
  SELL = 1,
}

export enum SignatureType {
  EIP712 = 0,
  ERC1271 = 1,
}

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

export interface ExchangeOrderStatus {
  isFilledOrCancelled: boolean;
  remaining: bigint;
}

export interface SerializedExchangeOrderStatus {
  isFilledOrCancelled: boolean;
  remaining: string;
}

export interface MulticallResult {
  success: boolean;
  returnData: Hex;
}

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

export function serializeOrderStatus(
  status: ExchangeOrderStatus
): SerializedExchangeOrderStatus {
  return {
    isFilledOrCancelled: status.isFilledOrCancelled,
    remaining: status.remaining.toString(),
  };
}

export function deserializeOrderStatus(
  status: SerializedExchangeOrderStatus
): ExchangeOrderStatus {
  return {
    isFilledOrCancelled: status.isFilledOrCancelled,
    remaining: BigInt(status.remaining),
  };
}
