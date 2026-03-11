import type { ExchangeOrder } from "./types.js";
import { TradeType } from "./types.js";

export const EXCHANGE_ONE = 10n ** 18n;
export const FEE_RATE_BASE = 1_000_000n;

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
