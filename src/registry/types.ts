import type { Address } from "viem";

/** Supported market storage formats in the registry contract. */
export enum MarketType {
  ERC20xERC20 = 0,
  ERC20xERC6909 = 1,
}

/** In-memory registry market configuration using bigint fee and sizing fields. */
export interface RegistryMarket {
  underlying: Address;
  collateral: Address;
  delivery: Address;
  owner: Address;
  tickSize: bigint;
  tickSpacing: bigint;
  tokensPerTickSize: bigint;
  expiry: bigint;
  depositFeeBps: bigint;
  redeemFeeBps: bigint;
  makerFeeBps: bigint;
  takerFeeBps: bigint;
  rolloverFeeBps: bigint;
  marketType: MarketType;
  isCollateralScaled: boolean;
  nonRollable: boolean;
  isSpread?: boolean;
  useAbsoluteSpreadCollateral?: boolean;
}

/** JSON-safe registry market payload used in APIs or config files. */
export interface SerializedRegistryMarket {
  underlying: Address;
  collateral: Address;
  delivery: Address;
  owner: Address;
  tickSize: string;
  tickSpacing: string;
  tokensPerTickSize: string;
  expiry: string;
  depositFeeBps: string;
  redeemFeeBps: string;
  makerFeeBps: string;
  takerFeeBps: string;
  rolloverFeeBps: string;
  marketType: number;
  isCollateralScaled: boolean;
  nonRollable: boolean;
  isSpread?: boolean;
  useAbsoluteSpreadCollateral?: boolean;
}

/** Converts a registry market into its stringified transport-safe shape. */
export function serializeRegistryMarket(
  market: RegistryMarket
): SerializedRegistryMarket {
  return {
    underlying: market.underlying,
    collateral: market.collateral,
    delivery: market.delivery,
    owner: market.owner,
    tickSize: market.tickSize.toString(),
    tickSpacing: market.tickSpacing.toString(),
    tokensPerTickSize: market.tokensPerTickSize.toString(),
    expiry: market.expiry.toString(),
    depositFeeBps: market.depositFeeBps.toString(),
    redeemFeeBps: market.redeemFeeBps.toString(),
    makerFeeBps: market.makerFeeBps.toString(),
    takerFeeBps: market.takerFeeBps.toString(),
    rolloverFeeBps: market.rolloverFeeBps.toString(),
    marketType: Number(market.marketType),
    isCollateralScaled: market.isCollateralScaled,
    nonRollable: market.nonRollable,
    isSpread: market.isSpread,
    useAbsoluteSpreadCollateral: market.useAbsoluteSpreadCollateral,
  };
}

/** Restores bigint fee and sizing fields from a serialized market payload. */
export function deserializeRegistryMarket(
  market: SerializedRegistryMarket
): RegistryMarket {
  return {
    underlying: market.underlying,
    collateral: market.collateral,
    delivery: market.delivery,
    owner: market.owner,
    tickSize: BigInt(market.tickSize),
    tickSpacing: BigInt(market.tickSpacing),
    tokensPerTickSize: BigInt(market.tokensPerTickSize),
    expiry: BigInt(market.expiry),
    depositFeeBps: BigInt(market.depositFeeBps),
    redeemFeeBps: BigInt(market.redeemFeeBps),
    makerFeeBps: BigInt(market.makerFeeBps),
    takerFeeBps: BigInt(market.takerFeeBps),
    rolloverFeeBps: BigInt(market.rolloverFeeBps),
    marketType: market.marketType as MarketType,
    isCollateralScaled: market.isCollateralScaled,
    nonRollable: market.nonRollable,
    isSpread: market.isSpread,
    useAbsoluteSpreadCollateral: market.useAbsoluteSpreadCollateral,
  };
}
