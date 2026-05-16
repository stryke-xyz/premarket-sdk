import { decodeFunctionData, encodeFunctionData, parseAbi } from "viem";
import {
  MarketType,
  MarketsRegistryContract,
  type RegistryMarket,
} from "./index.js";
import MarketsRegistryAbi from "../abi/MarketsRegistry.abi.json" with { type: "json" };

const REGISTRY_ADDRESS =
  "0x1111111111111111111111111111111111111111" as const;
const marketsRegistryAbi = MarketsRegistryAbi as readonly unknown[];

describe("MarketsRegistryContract", () => {
  const contract = new MarketsRegistryContract(REGISTRY_ADDRESS);

  const market: RegistryMarket = {
    underlying: "0x2222222222222222222222222222222222222222",
    collateral: "0x3333333333333333333333333333333333333333",
    delivery: "0x4444444444444444444444444444444444444444",
    owner: "0x5555555555555555555555555555555555555555",
    tickSize: 1_000_000n,
    tickSpacing: 2_000_000n,
    tokensPerTickSize: 1_000_000n,
    expiry: 1_900_000_000n,
    depositFeeBps: 100n,
    redeemFeeBps: 200n,
    makerFeeBps: 300n,
    takerFeeBps: 400n,
    rolloverFeeBps: 500n,
    marketType: MarketType.ERC20xERC6909,
    isCollateralScaled: true,
    nonRollable: false,
  };

  it("encodes addMarket calldata with the full live market struct", () => {
    const calldata = contract.getAddMarketCalldata(market);
    const decoded = decodeFunctionData({
      abi: marketsRegistryAbi,
      data: calldata,
    });

    expect(decoded.functionName).toBe("addMarket");
    expect(decoded.args[0]).toEqual({
      underlying: market.underlying,
      collateral: market.collateral,
      delivery: market.delivery,
      owner: market.owner,
      tickSize: market.tickSize,
      tickSpacing: market.tickSpacing,
      tokensPerTickSize: market.tokensPerTickSize,
      expiry: market.expiry,
      depositFeeBps: market.depositFeeBps,
      redeemFeeBps: market.redeemFeeBps,
      makerFeeBps: market.makerFeeBps,
      takerFeeBps: market.takerFeeBps,
      rolloverFeeBps: market.rolloverFeeBps,
      marketType: market.marketType,
      isCollateralScaled: market.isCollateralScaled,
      nonRollable: market.nonRollable,
      isSpread: false,
      useAbsoluteSpreadCollateral: false,
    });
  });

  it("builds addMarket transaction calls", () => {
    const tx = contract.buildAddMarketTx(market);

    expect(tx.to).toBe(REGISTRY_ADDRESS);
    expect(tx.value).toBe(0n);
    expect(tx.data).toBe(contract.getAddMarketCalldata(market));
  });

  it("encodes updateMarketExpiry calldata", () => {
    const marketId = 7n;
    const expiry = 1_950_000_000n;
    const expected = encodeFunctionData({
      abi: parseAbi([
        "function updateMarketExpiry(uint256 marketId, uint256 expiry) external",
      ]),
      functionName: "updateMarketExpiry",
      args: [marketId, expiry],
    });

    expect(contract.getUpdateMarketExpiryCalldata(marketId, expiry)).toBe(
      expected
    );
  });
});
