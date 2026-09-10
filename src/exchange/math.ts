import type { ExchangeOrder } from "./types.js";
import { TradeType } from "./types.js";

export const EXCHANGE_ONE = 10n ** 18n;
export const FEE_RATE_BASE = 1_000_000n;

/** Headroom a covered order's `maxFee` keeps over the fee at today's index, bps. 12_000 = 1.2x. */
export const COVERED_MAX_FEE_INDEX_HEADROOM_BPS = 12_000n;

/**
 * The `maxFee` a covered order signs.
 *
 * The Exchange charges each side of a covered fill its premium rate on the
 * fill's NOTIONAL, capped at the order's pro-rata share of `maxFee`, so this is
 * the most the order can ever pay:
 *
 *   min(1.2 x rate x notional,  premiumFeeCapBps x premium)
 *
 * The 1.2x leaves room for the index to rise before the order fills; the 7%
 * is the Exchange's `premiumFeeCapBps`, one value for every market. The rate is
 * the higher of the market's maker and taker rates, since a resting order does not know which
 * side it will fill as. The backend rejects a cap far from this value.
 */
export function coveredMaxFee(params: {
  /** Full-order notional in quote units -- see {@link coveredNotional}. */
  notional: bigint;
  makerFeeRate: bigint;
  takerFeeRate: bigint;
  /** The Exchange's `premiumFeeCapBps`, in FEE_RATE_BASE. */
  premiumFeeCapBps: bigint;
  /** The order's signed premium. */
  premium: bigint;
}): bigint {
  const rate = params.makerFeeRate > params.takerFeeRate ? params.makerFeeRate : params.takerFeeRate;
  const denom = FEE_RATE_BASE * 10_000n;
  const byNotional =
    (params.notional * rate * COVERED_MAX_FEE_INDEX_HEADROOM_BPS + denom - 1n) / denom;
  const byPremium = (params.premium * params.premiumFeeCapBps) / FEE_RATE_BASE;
  return byNotional < byPremium ? byNotional : byPremium;
}

/**
 * `qty` option units (1e18) at `indexPrice`, the underlying's price already in
 * quote units (a covered market's quote is a USD stable).
 */
export function coveredNotional(qty: bigint, indexPrice: bigint): bigint {
  return (indexPrice * qty) / EXCHANGE_ONE;
}

export function getTakingAmount(
  fillMakingAmount: bigint,
  orderMakingAmount: bigint,
  orderTakingAmount: bigint
): bigint {
  return (fillMakingAmount * orderTakingAmount) / orderMakingAmount;
}

export function getMakingAmount(
  fillTakingAmount: bigint,
  orderMakingAmount: bigint,
  orderTakingAmount: bigint
): bigint {
  return (fillTakingAmount * orderMakingAmount) / orderTakingAmount;
}

export function calculateFee(grossAmount: bigint, feeRate: bigint): bigint {
  if (feeRate < 0n || feeRate > FEE_RATE_BASE) {
    throw new Error("feeRate must be in [0, 1e6]");
  }

  return (grossAmount * feeRate) / FEE_RATE_BASE;
}

export function applyFee(
  grossAmount: bigint,
  feeRate: bigint
): { fee: bigint; net: bigint } {
  const fee = calculateFee(grossAmount, feeRate);
  return {
    fee,
    net: grossAmount - fee,
  };
}

export function getOrderPriceWad(order: ExchangeOrder): bigint {
  if (order.tradeType === TradeType.BUY) {
    return (order.makingAmount * EXCHANGE_ONE) / order.takingAmount;
  }

  return (order.takingAmount * EXCHANGE_ONE) / order.makingAmount;
}

export function optionPrmToPrmId(tokenId: bigint): bigint {
  return tokenId & ~1n;
}

export function isCrossing(orderA: ExchangeOrder, orderB: ExchangeOrder): boolean {
  if (orderA.tradeType !== orderB.tradeType) {
    const buy = orderA.tradeType === TradeType.BUY ? orderA : orderB;
    const sell = orderA.tradeType === TradeType.SELL ? orderA : orderB;

    return (
      buy.makingAmount * sell.makingAmount >=
      buy.takingAmount * sell.takingAmount
    );
  }

  if (orderA.tradeType === TradeType.BUY) {
    // MINT path: pA + pB >= 1, where p = making / taking
    return (
      orderA.makingAmount * orderB.takingAmount +
        orderB.makingAmount * orderA.takingAmount >=
      orderA.takingAmount * orderB.takingAmount
    );
  }

  // MERGE path: pA + pB <= 1, where p = taking / making
  return (
    orderA.takingAmount * orderB.makingAmount +
      orderB.takingAmount * orderA.makingAmount <=
    orderA.makingAmount * orderB.makingAmount
  );
}

export function hasValidTokenPairForMatch(
  orderA: ExchangeOrder,
  orderB: ExchangeOrder
): boolean {
  if (orderA.tradeType !== orderB.tradeType) {
    return orderA.tokenId === orderB.tokenId;
  }

  if (orderA.tokenId === orderB.tokenId) {
    return false;
  }

  return optionPrmToPrmId(orderA.tokenId) === optionPrmToPrmId(orderB.tokenId);
}
