/**
 * Collateral calculation utilities for OptionMarketVault
 *
 * These functions replicate the Solidity contract logic for:
 * - Collateral amount calculations
 * - Spread bounds and width
 * - Profit/loss calculations
 *
 * Key concepts:
 * - tickSize: price precision unit
 * - tickSpacing: spread width in tick units
 * - tokensPerTickSize: collateral per tick
 * - isCollateralScaled: if true, collateral scales with tick (strike price)
 */

import { mulDiv, Rounding } from "../utils/mul-div.js";
import { VAULT_TOKEN_PRECISION } from "./constants.js";

/**
 * Market parameters for collateral calculations
 */
export interface MarketParams {
  tickSize: bigint;
  tickSpacing: bigint;
  tokensPerTickSize: bigint;
  isCollateralScaled?: boolean;
}

/**
 * Instrument parameters for collateral calculations
 */
export interface InstrumentParams {
  marketId: bigint;
  tick: bigint; // strike/lower bound tick
  isCall: boolean;
}

/**
 * Spread bounds result
 */
export interface SpreadBounds {
  lower: bigint;
  upper: bigint;
  isSpread: boolean;
}

/**
 * Calculate the number of ticks in a spread
 * width = tickSpacing / tickSize (min 1)
 *
 * From contract: uint256 ticks = mkt.tickSpacing > mkt.tickSize ? (mkt.tickSpacing / mkt.tickSize) : 1;
 */
export function getSpreadWidth(market: MarketParams): bigint {
  if (market.tickSize === 0n) return 1n;
  return market.tickSpacing > market.tickSize
    ? market.tickSpacing / market.tickSize
    : 1n;
}

/**
 * Get the upper and lower bounds of a spread
 *
 * From contract _getSpreadBounds:
 * - lower = prm.tick
 * - upper = prm.tick + (width * mkt.tickSize)
 * - isSpread = width > 1
 */
export function getSpreadBounds(
  instrument: InstrumentParams,
  market: MarketParams,
): SpreadBounds {
  const width = getSpreadWidth(market);
  const isSpread = width > 1n;
  const lower = instrument.tick;
  const upper = instrument.tick + width * market.tickSize;
  return { lower, upper, isSpread };
}

/**
 * Calculate collateral amount for a given position size
 *
 * From contract _getCollateralAmt:
 * ```
 * uint256 ticks = mkt.tickSpacing > mkt.tickSize ? (mkt.tickSpacing / mkt.tickSize) : 1;
 * collateralAmt = ticks * mkt.tokensPerTickSize;
 * if (mkt.isCollateralScaled) {
 *     collateralAmt = (ins.tick * collateralAmt) / mkt.tickSize;
 * }
 * collateralAmt = (collateralAmt * amt) / VAULT_TOKEN_PRECISION;
 * ```
 */
export function calculateCollateralAmount(
  prmAmount: bigint,
  instrument: InstrumentParams,
  market: MarketParams,
): bigint {
  if (market.tickSize === 0n) return 0n;

  const ticks = getSpreadWidth(market);
  let collateralPerPosition = ticks * market.tokensPerTickSize;

  // Optional scaling by strike price
  if (market.isCollateralScaled) {
    collateralPerPosition =
      (instrument.tick * collateralPerPosition) / market.tickSize;
  }

  // Vault collateral accounting rounds up when the division is not exact.
  return mulDiv(
    collateralPerPosition,
    prmAmount,
    VAULT_TOKEN_PRECISION,
    Rounding.Ceil,
  );
}

/**
 * Calculate PRM amount from collateral amount (inverse of calculateCollateralAmount)
 */
export function calculatePrmAmount(
  collateralAmount: bigint,
  instrument: InstrumentParams,
  market: MarketParams,
): bigint {
  if (market.tickSize === 0n) return 0n;

  const ticks = getSpreadWidth(market);
  let collateralPerPosition = ticks * market.tokensPerTickSize;

  if (market.isCollateralScaled) {
    collateralPerPosition =
      (instrument.tick * collateralPerPosition) / market.tickSize;
  }

  if (collateralPerPosition === 0n) return 0n;

  return (collateralAmount * VAULT_TOKEN_PRECISION) / collateralPerPosition;
}

/**
 * Calculate profit for a spread position given final tick
 *
 * From contract _getProfit:
 * ```
 * if (isSpread) {
 *     if (upper > finalTick && finalTick > lower) {
 *         uint256 moneyness = prm.isCall ? finalTick - lower : upper - finalTick;
 *         profit = (mkt.tokensPerTickSize * moneyness) / mkt.tickSize;
 *     }
 * } else {
 *     // Vanilla call/put payoff
 *     if (prm.isCall && finalTick > prm.tick) {
 *         profit = finalTick - prm.tick;
 *     } else if (!prm.isCall && finalTick < prm.tick) {
 *         profit = prm.tick - finalTick;
 *     }
 * }
 * ```
 *
 * Note: This returns profit per VAULT_TOKEN_PRECISION (1e18) of position.
 * To get actual profit, multiply by position size and divide by VAULT_TOKEN_PRECISION.
 */
export function calculateSpreadProfit(
  instrument: InstrumentParams,
  market: MarketParams,
  finalTick: bigint,
  positionSize: bigint,
): bigint {
  const { lower, upper, isSpread } = getSpreadBounds(instrument, market);

  if (finalTick === 0n) return 0n;

  if (isSpread) {
    // Only profit if within bounds
    if (finalTick > lower && finalTick < upper) {
      const moneyness = instrument.isCall
        ? finalTick - lower
        : upper - finalTick;
      const profitPerPosition =
        (market.tokensPerTickSize * moneyness) / market.tickSize;
      return (profitPerPosition * positionSize) / VAULT_TOKEN_PRECISION;
    }
    return 0n;
  } else {
    // Vanilla option payoff
    if (instrument.isCall && finalTick > instrument.tick) {
      return (
        ((finalTick - instrument.tick) * positionSize) / VAULT_TOKEN_PRECISION
      );
    } else if (!instrument.isCall && finalTick < instrument.tick) {
      return (
        ((instrument.tick - finalTick) * positionSize) / VAULT_TOKEN_PRECISION
      );
    }
    return 0n;
  }
}

/**
 * Calculate loss for a PRM holder (collateral provider) after settlement
 * Loss is the profit that option holders receive
 */
export function calculateSpreadLoss(
  instrument: InstrumentParams,
  market: MarketParams,
  finalTick: bigint,
  positionSize: bigint,
): bigint {
  // Loss to collateral provider = profit to option holder
  return calculateSpreadProfit(instrument, market, finalTick, positionSize);
}

/**
 * Calculate withdrawable collateral after settlement
 * Withdrawable = totalCollateral - loss
 */
export function calculateWithdrawableCollateral(
  instrument: InstrumentParams,
  market: MarketParams,
  finalTick: bigint,
  positionSize: bigint,
): bigint {
  const totalCollateral = calculateCollateralAmount(
    positionSize,
    instrument,
    market,
  );
  const loss = calculateSpreadLoss(instrument, market, finalTick, positionSize);
  return totalCollateral > loss ? totalCollateral - loss : 0n;
}

/**
 * Get collateral per single position (1e18 PRM tokens)
 * Useful for minimum deposit checks
 */
export function getCollateralPerPosition(
  instrument: InstrumentParams,
  market: MarketParams,
): bigint {
  const ticks = getSpreadWidth(market);
  let collateral = ticks * market.tokensPerTickSize;

  if (market.isCollateralScaled) {
    collateral = (instrument.tick * collateral) / market.tickSize;
  }

  return collateral;
}

/**
 * Calculate deposit fees
 *
 * From contract _getDepositFees:
 * return (amt * mkt.depositFeeBps) / FEE_BPS_PRECISION;
 */
export function calculateDepositFees(
  collateralAmount: bigint,
  depositFeeBps: bigint,
  feeBpsPrecision: bigint = 1000000n,
): bigint {
  return (collateralAmount * depositFeeBps) / feeBpsPrecision;
}

/**
 * Calculate redeem fees
 *
 * From contract _getRedeemFees:
 * return (amt * mkt.redeemFeeBps) / FEE_BPS_PRECISION;
 */
export function calculateRedeemFees(
  profitAmount: bigint,
  redeemFeeBps: bigint,
  feeBpsPrecision: bigint = 1000000n,
): bigint {
  return (profitAmount * redeemFeeBps) / feeBpsPrecision;
}

/**
 * Check if a position is in the money (ITM) given the final tick
 */
export function isInTheMoney(
  instrument: InstrumentParams,
  market: MarketParams,
  finalTick: bigint,
): boolean {
  const { lower, upper, isSpread } = getSpreadBounds(instrument, market);

  if (isSpread) {
    // Spread is ITM if finalTick is within bounds
    return finalTick > lower && finalTick < upper;
  } else {
    // Vanilla option
    if (instrument.isCall) {
      return finalTick > instrument.tick;
    } else {
      return finalTick < instrument.tick;
    }
  }
}

/**
 * Calculate the moneyness percentage (0-100) for a spread position
 * Returns 0 if OTM, 100 if fully ITM
 */
export function calculateMoneyness(
  instrument: InstrumentParams,
  market: MarketParams,
  finalTick: bigint,
): number {
  const { lower, upper, isSpread } = getSpreadBounds(instrument, market);

  if (!isSpread) return 0;
  if (finalTick <= lower) return 0;
  if (finalTick >= upper) return 100;

  const width = upper - lower;
  const moneyness = instrument.isCall ? finalTick - lower : upper - finalTick;

  return Number((moneyness * 100n) / width);
}
