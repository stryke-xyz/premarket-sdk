import { encodeFunctionData, type Address, type Hex } from "viem";
import MarketsRegistryAbi from "../abi/MarketsRegistry.abi.json" with { type: "json" };
import type { RegistryMarket, SerializedRegistryMarket } from "./types.js";
const marketsRegistryAbi = MarketsRegistryAbi as readonly unknown[];

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
    marketType: Number(market.marketType),
    isCollateralScaled: market.isCollateralScaled,
  };
}

export class MarketsRegistryContract {
  constructor(public readonly address: Address) {}

  getAddMarketCalldata(market: MarketLike): Hex {
    return encodeFunctionData({
      abi: marketsRegistryAbi,
      functionName: "addMarket",
      args: [normalizeMarket(market)],
    });
  }

  buildAddMarketTx(market: MarketLike): RegistryTransactionCall {
    return {
      to: this.address,
      data: this.getAddMarketCalldata(market),
      value: 0n,
    };
  }

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

  getSetWhitelistedCalldata(account: Address, allowed: boolean): Hex {
    return encodeFunctionData({
      abi: marketsRegistryAbi,
      functionName: "setWhitelisted",
      args: [account, allowed],
    });
  }

  getUpdateMarketExpiryCalldata(marketId: bigint, expiry: bigint): Hex {
    return encodeFunctionData({
      abi: marketsRegistryAbi,
      functionName: "updateMarketExpiry",
      args: [marketId, expiry],
    });
  }

  getMulticallCalldata(data: Hex[]): Hex {
    return encodeFunctionData({
      abi: marketsRegistryAbi,
      functionName: "multicall",
      args: [data],
    });
  }
}
