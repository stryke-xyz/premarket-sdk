export interface MarketStrategy {
  id: string;
  finalFDV: bigint;
  deadline: bigint;
  bandPrecision: bigint;
  collateralPerBandPrecision: bigint;
  premiumRate: bigint;
  depositFeeRate: bigint;
  purchaseFeeRate: bigint;
  settlementFeeRate: bigint;
  collateralToken: `0x${string}`;
}

export interface OptionMarket {
  id: string;
  callToken: `0x${string}`;
  putToken: `0x${string}`;
  expiry: bigint;
  maxTTL: bigint;
  strategy: MarketStrategy;
  collateralToken: `0x${string}`;
  totalCollateral: bigint;
  totalCollateralAmount: bigint; // actual stablecoin collateral backing the tokens
  protocolFees: bigint;
}

export interface HourlyVolume {
  id: string;
  marketId: bigint;
  optionId: string;
  hourTimestamp: bigint;
  depositVolume: bigint;
  tradeVolume: bigint;
  unwindVolume: bigint;
  withdrawVolume: bigint;
  exerciseVolume: bigint;
  totalVolume: bigint;
  tradeCount: number;
}

export interface OptionParams {
  id: string;
  marketId: bigint;
  strikeLowerLimit: bigint;
  strikeUpperLimit: bigint;
  isPut: boolean;
  collateralPerShare?: bigint; // collateral per 1e18 shares
}
