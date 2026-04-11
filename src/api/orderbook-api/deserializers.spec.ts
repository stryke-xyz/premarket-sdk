import {
  marketInstrumentToBigInt,
  marketToBigInt,
} from "./deserializers.js";
import type { Erc20Market, Erc6909Market, SpreadMarketInstrument } from "../../shared/types.js";

describe("market deserializers", () => {
  it("converts erc6909 spread instruments to bigint values", () => {
    const instrument: SpreadMarketInstrument = {
      id: "inst-1",
      name: "1500-1700 Call Spread",
      tick: "1500",
      isCall: true,
      isSpread: true,
      spreadType: "standard",
      lower: "1500",
      upper: "1700",
      prmTokenId: "100",
      oPrmTokenId: "101",
      expiry: "1900000000",
      lastPrice: "12",
      bestBid: "11",
      bestAsk: "13",
      totalCollateral: "1000",
      totalPrmSupply: "2000",
      totalOprmSupply: "2000",
    };

    const market: Erc6909Market = {
      id: "12",
      groupId: null,
      type: "erc6909",
      name: "BTC Range",
      description: "Range market",
      specification: "Spec",
      minOrderAmount: "1",
      createdAt: "123",
      priceIncrement: "1",
      minPrice: "0",
      maxPrice: "100",
      collateralToken: "0xcccccccccccccccccccccccccccccccccccccccc",
      collateralDecimals: 6,
      maxDecimals: "18",
      marketType: "ERC20xERC6909",
      creator: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      instruments: [instrument],
      collateral: "0x1111111111111111111111111111111111111111",
      underlying: "0x2222222222222222222222222222222222222222",
      delivery: "0x3333333333333333333333333333333333333333",
      isSpread: true,
      spreadType: "standard",
      useAbsoluteSpreadCollateral: false,
      owner: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      tickSize: "100",
      tickSpacing: "100",
      tokensPerTickSize: "1000000",
      expiry: "1900000000",
      depositFeeBps: "0",
      redeemFeeBps: "0",
      makerFeeBps: "2000",
      takerFeeBps: "2000",
      rolloverFeeBps: "0",
      totalCollateral: "5000",
      isCollateralScaled: false,
      nonRollable: false,
    };

    const bigintInstrument = marketInstrumentToBigInt(instrument);
    const bigintMarket = marketToBigInt(market);

    if (!bigintInstrument.isSpread) {
      throw new Error("expected a spread instrument");
    }

    if (bigintMarket.type !== "erc6909") {
      throw new Error("expected an erc6909 market");
    }

    expect(bigintInstrument.lower).toBe(1500n);
    expect(bigintInstrument.upper).toBe(1700n);
    expect(bigintMarket.maxDecimals).toBe(18n);
    expect(bigintMarket.instruments[0]?.oPrmTokenId).toBe(101n);
  });

  it("converts erc20 markets with submarkets to bigint values", () => {
    const market: Erc20Market = {
      id: "spot-1",
      groupId: "group-1",
      type: "erc20",
      name: "Basket",
      description: "Spot market",
      specification: "Spec",
      minOrderAmount: "10",
      createdAt: "456",
      priceIncrement: "5",
      minPrice: "1",
      maxPrice: "1000",
      collateralToken: "0x4444444444444444444444444444444444444444",
      collateralDecimals: 6,
      maxDecimals: null,
      marketType: "ERC20xERC20",
      underlying: null,
      underlyingDecimals: null,
      submarkets: [
        {
          id: "sub-1",
          name: "USDC",
          tokenAddress: "0x5555555555555555555555555555555555555555",
          tokenDecimals: 6,
          lastPrice: "100",
          bestBid: "99",
          bestAsk: "101",
        },
      ],
    };

    const bigintMarket = marketToBigInt(market);

    if (bigintMarket.type !== "erc20") {
      throw new Error("expected an erc20 market");
    }

    expect(bigintMarket.submarkets[0]?.lastPrice).toBe(100n);
    expect(bigintMarket.maxDecimals).toBeNull();
    expect(bigintMarket.collateralDecimals).toBe(6);
  });
});
