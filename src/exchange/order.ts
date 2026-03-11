import type { Address } from "viem";
import { randBigInt } from "../utils/rand-bigint.js";
import { hashExchangeOrder } from "./eip712.js";
import type { ExchangeOrder, ExchangeOrderStatus } from "./types.js";
import { SignatureType } from "./types.js";

const DEFAULT_SALT_MAX = (1n << 96n) - 1n;

export type BuildExchangeOrderParams = Omit<
  ExchangeOrder,
  "salt" | "receiver" | "signatureType"
> & {
  salt?: bigint;
  receiver?: Address;
  signatureType?: SignatureType;
};

export function buildExchangeOrder(params: BuildExchangeOrderParams): ExchangeOrder {
  const order: ExchangeOrder = {
    salt: params.salt ?? randBigInt(DEFAULT_SALT_MAX),
    nonce: params.nonce,
    marketId: params.marketId,
    makingAmount: params.makingAmount,
    takingAmount: params.takingAmount,
    deadline: params.deadline,
    maker: params.maker,
    receiver: params.receiver ?? params.maker,
    tradeType: params.tradeType,
    signatureType: params.signatureType ?? SignatureType.EIP712,
    tokenId: params.tokenId,
  };

  validateExchangeOrder(order);

  return order;
}

export function validateExchangeOrder(order: ExchangeOrder): void {
  if (order.makingAmount <= 0n) {
    throw new Error("makingAmount must be greater than zero");
  }
  if (order.takingAmount <= 0n) {
    throw new Error("takingAmount must be greater than zero");
  }
  if (order.deadline <= 0n) {
    throw new Error("deadline must be greater than zero");
  }
}

export function isOrderExpired(
  order: ExchangeOrder,
  nowSec: bigint = BigInt(Math.floor(Date.now() / 1000))
): boolean {
  return order.deadline < nowSec;
}

export function getExecutableMakingAmount(
  order: ExchangeOrder,
  status: ExchangeOrderStatus
): bigint {
  if (status.isFilledOrCancelled) {
    return 0n;
  }

  // By contract semantics, 0 remaining with non-terminal state means untouched order.
  if (status.remaining === 0n) {
    return order.makingAmount;
  }

  return status.remaining;
}

export function getExchangeOrderHash(
  order: ExchangeOrder,
  chainId: number,
  exchangeAddress: Address
) {
  return hashExchangeOrder(order, chainId, exchangeAddress);
}
