import type { OptionMarket, OptionParams } from "./market.js";

export interface CollateralPosition {
  id: string;
  optionId: string;
  optionMarketId: string;
  totalCollateral: bigint;
  optionsMinted: bigint;
  optionsExercised: bigint;
  premiumEarned: bigint;
  fee: bigint;
  settled: boolean;
  updatedAt: bigint;
  updatedAtBlock: bigint;
  optionMarket?: OptionMarket;
  optionParams?: OptionParams;
}

export interface OptionPosition {
  id: string;
  tokenId: bigint;
  address: `0x${string}`;
  optionId: string;
  optionMarketId: string;
  premium: bigint;
  fee: bigint;
  profit: bigint;
  amount: bigint;
  averagePrice: bigint; // average price per option (scaled by 1e18)
  updatedAt: bigint;
  updatedAtBlock: bigint;
  optionMarket?: OptionMarket;
  optionParams?: OptionParams;
}



