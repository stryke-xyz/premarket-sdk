import { encodeFunctionData, type Address, type Hex } from "viem";
import MarketsRegistryAbi from "../abi/MarketsRegistry.abi.json" with { type: "json" };
import type { RegistryMarket, SerializedRegistryMarket } from "./types.js";
const marketsRegistryAbi = MarketsRegistryAbi as readonly unknown[];

/** Minimal transaction envelope returned by registry calldata builders. */
export interface RegistryTransactionCall {
  to: Address;
  value?: bigint;
  data: Hex;
}

type MarketLike = RegistryMarket | SerializedRegistryMarket;

function normalizeMarket(market: MarketLike) {
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
    marketType: Number(market.marketType),
    isCollateralScaled: market.isCollateralScaled,
    nonRollable: market.nonRollable,
    isSpread: market.isSpread ?? false,
    useAbsoluteSpreadCollateral: market.useAbsoluteSpreadCollateral ?? false,
  };
}

/** Calldata and transaction helpers for the markets registry contract. */
export class MarketsRegistryContract {
  constructor(public readonly address: Address) {}

  /** Encodes `addMarket` calldata for a new registry market definition. */
  getAddMarketCalldata(market: MarketLike): Hex {
    return encodeFunctionData({
      abi: marketsRegistryAbi,
      functionName: "addMarket",
      args: [normalizeMarket(market)],
    });
  }

  /** Builds a transaction request for `addMarket`. */
  buildAddMarketTx(market: MarketLike): RegistryTransactionCall {
    return {
      to: this.address,
      data: this.getAddMarketCalldata(market),
      value: 0n,
    };
  }

  /** Encodes `updateToken` calldata for stable-token metadata changes. */
  getUpdateTokenCalldata(
    token: Address,
    isStable: boolean,
    isDelete: boolean
  ): Hex {
    return encodeFunctionData({
      abi: marketsRegistryAbi,
      functionName: "updateToken",
      args: [token, isStable, isDelete],
    });
  }

  /** Encodes `setWhitelisted` calldata for registry access control. */
  getSetWhitelistedCalldata(account: Address, allowed: boolean): Hex {
    return encodeFunctionData({
      abi: marketsRegistryAbi,
      functionName: "setWhitelisted",
      args: [account, allowed],
    });
  }

  /** Encodes `updateMarketExpiry` calldata for an existing market. */
  getUpdateMarketExpiryCalldata(marketId: bigint, expiry: bigint): Hex {
    return encodeFunctionData({
      abi: marketsRegistryAbi,
      functionName: "updateMarketExpiry",
      args: [marketId, expiry],
    });
  }

  /** Encodes `multicall` calldata for batching registry mutations. */
  getMulticallCalldata(data: Hex[]): Hex {
    return encodeFunctionData({
      abi: marketsRegistryAbi,
      functionName: "multicall",
      args: [data],
    });
  }
}
