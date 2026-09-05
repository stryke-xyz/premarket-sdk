import { isAddress, zeroAddress, type Address } from "viem";
import { randBigInt } from "../utils/rand-bigint.js";
import { hashOptionsExchangeOrder } from "./options-eip712.js";
import type { OptionsOrder, OptionsOrderStatus } from "./options-types.js";
import { SignatureType } from "./types.js";

const DEFAULT_SALT_MAX = (1n << 96n) - 1n;

/**
 * Input accepted by {@link buildOptionsOrder}.
 * Omits fields that the helper can safely default for SDK consumers.
 *
 * `maxUnderlying` and `minUnderlying` are optional because each only binds one
 * order kind — a writer's ceiling, a closing short's floor — and zero means "no
 * bound" to the contract, so the side it does not apply to never has to state it.
 */
export type BuildOptionsOrderParams = Omit<
  OptionsOrder,
  "salt" | "receiver" | "signatureType" | "maxUnderlying" | "minUnderlying"
> & {
  salt?: bigint;
  receiver?: Address;
  signatureType?: SignatureType;
  maxUnderlying?: bigint;
  minUnderlying?: bigint;
};

/** Builds and validates a normalized covered order ready for hashing or signing. */
export function buildOptionsOrder(
  params: BuildOptionsOrderParams
): OptionsOrder {
  const order: OptionsOrder = {
    salt: params.salt ?? randBigInt(DEFAULT_SALT_MAX),
    nonce: params.nonce,
    marketId: params.marketId,
    tokenId: params.tokenId,
    qty: params.qty,
    limitPremium: params.limitPremium,
    maxUnderlying: params.maxUnderlying ?? 0n,
    minUnderlying: params.minUnderlying ?? 0n,
    deadline: params.deadline,
    maker: params.maker,
    receiver: params.receiver ?? params.maker,
    side: params.side,
    intent: params.intent,
    signatureType: params.signatureType ?? SignatureType.EIP712,
  };

  validateOptionsOrder(order);

  return order;
}

/** Guards the minimal invariants required by the options exchange contract. */
export function validateOptionsOrder(
  order: OptionsOrder,
  nowSec: bigint = BigInt(Math.floor(Date.now() / 1000))
): void {
  if (order.qty <= 0n) {
    throw new Error("qty must be greater than zero");
  }
  // A zero premium would settle the option legs for free rather than reading as
  // "market order" — the contract prices off the resting limit, so there is no
  // sentinel meaning here.
  if (order.limitPremium <= 0n) {
    throw new Error("limitPremium must be greater than zero");
  }
  if (order.deadline <= 0n) {
    throw new Error("deadline must be greater than zero");
  }
  if (order.deadline < nowSec) {
    throw new Error("deadline must not be in the past");
  }
  if (!isAddress(order.maker) || order.maker === zeroAddress) {
    throw new Error("maker must be a valid non-zero address");
  }
  // The receiver takes delivery of every leg this order earns, so a zero or
  // malformed address burns the fill rather than reverting.
  if (!isAddress(order.receiver) || order.receiver === zeroAddress) {
    throw new Error("receiver must be a valid non-zero address");
  }
}

/** Returns true when the order deadline is already behind the supplied timestamp. */
export function isOptionsOrderExpired(
  order: OptionsOrder,
  nowSec: bigint = BigInt(Math.floor(Date.now() / 1000))
): boolean {
  return order.deadline < nowSec;
}

/** Returns the contracts that can still be filled against the order. */
export function getExecutableQty(
  order: OptionsOrder,
  status: OptionsOrderStatus
): bigint {
  if (status.isFilledOrCancelled) {
    return 0n;
  }

  // By contract semantics, 0 remaining with non-terminal state means untouched
  // order: `_consume` seeds `remainingQty` from the signed size on first touch.
  if (status.remainingQty === 0n) {
    return order.qty;
  }

  return status.remainingQty;
}

/** Computes the EIP-712 hash the options exchange contract uses for this order. */
export function getOptionsOrderHash(
  order: OptionsOrder,
  chainId: number,
  optionsExchangeAddress: Address
) {
  return hashOptionsExchangeOrder(order, chainId, optionsExchangeAddress);
}
