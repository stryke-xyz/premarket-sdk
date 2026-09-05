import type { Address } from "viem";
import { SignatureType } from "./types.js";

/** Book side of a covered order. */
export enum Side {
  BUY = 0,
  SELL = 1,
}

/**
 * Whether the maker is entering a position or leaving one.
 *
 * Direction alone does not identify a covered order the way it does on the
 * ordinary book: an opening buyer and a short buying back both post bids, and a
 * writer and a departing long both post asks. `side` plus `intent` picks one of
 * the four kinds the contract settles.
 */
export enum Intent {
  OPEN = 0,
  CLOSE = 1,
}

/**
 * Canonical in-memory covered (options) order using bigint fields.
 *
 * Deliberately not an {@link ExchangeOrder} with extra fields: the options book
 * is sized in contracts and priced in quote per contract, so there is no
 * `makingAmount`/`takingAmount` pair to carry — every leg is a function of `qty`
 * and `limitPremium`.
 */
export interface OptionsOrder {
  salt: bigint;
  nonce: bigint;
  marketId: bigint;
  tokenId: bigint;
  qty: bigint;
  limitPremium: bigint;
  maxUnderlying: bigint;
  minUnderlying: bigint;
  deadline: bigint;
  maker: Address;
  receiver: Address;
  side: Side;
  intent: Intent;
  signatureType: SignatureType;
}

/** JSON-safe covered order shape used by APIs and persistence layers. */
export interface SerializedOptionsOrder {
  salt: string;
  nonce: string;
  marketId: string;
  tokenId: string;
  qty: string;
  limitPremium: string;
  maxUnderlying: string;
  minUnderlying: string;
  deadline: string;
  maker: Address;
  receiver: Address;
  side: number;
  intent: number;
  signatureType: number;
}

/** Onchain fill state returned by options exchange status lookups. */
export interface OptionsOrderStatus {
  isFilledOrCancelled: boolean;
  /** Contracts still fillable. One counter covers every order kind. */
  remainingQty: bigint;
}

/** Serialized variant of {@link OptionsOrderStatus}. */
export interface SerializedOptionsOrderStatus {
  isFilledOrCancelled: boolean;
  remainingQty: string;
}

/** Converts an in-memory covered order into the stringified API shape. */
export function serializeOptionsOrder(
  order: OptionsOrder
): SerializedOptionsOrder {
  return {
    salt: order.salt.toString(),
    nonce: order.nonce.toString(),
    marketId: order.marketId.toString(),
    tokenId: order.tokenId.toString(),
    qty: order.qty.toString(),
    limitPremium: order.limitPremium.toString(),
    maxUnderlying: order.maxUnderlying.toString(),
    minUnderlying: order.minUnderlying.toString(),
    deadline: order.deadline.toString(),
    maker: order.maker,
    receiver: order.receiver,
    side: Number(order.side),
    intent: Number(order.intent),
    signatureType: Number(order.signatureType),
  };
}

/** Restores bigint and enum fields from a serialized covered order payload. */
export function deserializeOptionsOrder(
  order: SerializedOptionsOrder
): OptionsOrder {
  return {
    salt: BigInt(order.salt),
    nonce: BigInt(order.nonce),
    marketId: BigInt(order.marketId),
    tokenId: BigInt(order.tokenId),
    qty: BigInt(order.qty),
    limitPremium: BigInt(order.limitPremium),
    maxUnderlying: BigInt(order.maxUnderlying),
    minUnderlying: BigInt(order.minUnderlying),
    deadline: BigInt(order.deadline),
    maker: order.maker,
    receiver: order.receiver,
    side: order.side as Side,
    intent: order.intent as Intent,
    signatureType: order.signatureType as SignatureType,
  };
}

/** Converts bigint status fields into a transport-safe string payload. */
export function serializeOptionsOrderStatus(
  status: OptionsOrderStatus
): SerializedOptionsOrderStatus {
  return {
    isFilledOrCancelled: status.isFilledOrCancelled,
    remainingQty: status.remainingQty.toString(),
  };
}

/** Restores bigint fields from a serialized covered order status payload. */
export function deserializeOptionsOrderStatus(
  status: SerializedOptionsOrderStatus
): OptionsOrderStatus {
  return {
    isFilledOrCancelled: status.isFilledOrCancelled,
    remainingQty: BigInt(status.remainingQty),
  };
}
