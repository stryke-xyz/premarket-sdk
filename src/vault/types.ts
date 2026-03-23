/**
 * Types for OptionMarketVault (onchain contract types)
 */

/** Onchain instrument struct for vault operations */
export interface VaultInstrument {
    marketId: bigint;
    tick: bigint;
    isCall: boolean;
}

/** Onchain market struct from the vault contract */
export interface VaultMarket {
    underlying: `0x${string}`;
    collateral: `0x${string}`;
    delivery: `0x${string}`;
    owner: `0x${string}`;
    tickSize: bigint;
    tickSpacing: bigint;
    tokensPerTickSize: bigint;
    expiry: bigint;
    depositFeeBps: bigint;
    redeemFeeBps: bigint;
    makerFeeBps: bigint;
    takerFeeBps: bigint;
    rolloverFeeBps: bigint;
    marketType: number;
    isCollateralScaled: boolean;
    nonRollable: boolean;
}

/** @deprecated Use VaultInstrument instead */
export type Instrument = VaultInstrument;
/** @deprecated Use VaultMarket instead */
export type Market = VaultMarket;

export interface PrmInfo {
    marketId: bigint;
    expiry: bigint;
    tick: bigint;
    totalRedeemProfit: bigint;
    isCall: boolean;
}

export interface TokenIdParams {
    vaultAddress: `0x${string}`;
    marketId: bigint;
    tick: bigint;
    isCall: boolean;
    expiry: bigint;
    chainId: number;
}
