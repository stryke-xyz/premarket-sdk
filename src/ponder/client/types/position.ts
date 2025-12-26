import type { OptionMarket, OptionParams } from "./market.js";

/**
 * Unified Position type that combines both collateral and option positions
 * Based on the new schema where positions are merged into a single table
 */
export interface Position {
  id: string;
  optionId: string;
  optionMarketId: string;
  userId: string; // user address
  collateralShares: bigint; // total collateral shares
  optionsShares: bigint; // total option shares
  premiumEarned: bigint; // premium earned from selling options on orderbook
  fee: bigint; // total fee paid on deposit
  settled: boolean; // true when all minted options are exercised
  updatedAt: bigint;
  updatedAtBlock: bigint;
  profit: bigint; // total profit received
  averagePrice: bigint; // average price per option (premium / amount, scaled by 1e18)
  optionsSharesExercised: bigint; // option tokens exercised against this position
  premiumPaid: bigint; // premium paid for the position
  optionMarket?: OptionMarket;
  optionParams?: OptionParams;
}
