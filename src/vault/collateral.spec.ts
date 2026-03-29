import {
  calculateCollateralAmount,
  calculatePrmAmount,
  type InstrumentParams,
  type MarketParams,
} from "./collateral.js";

const BASE_MARKET: MarketParams = {
  tickSize: 100n,
  tickSpacing: 300n,
  tokensPerTickSize: 10n,
};

const BASE_INSTRUMENT: InstrumentParams = {
  tick: 500n,
  isCall: true,
};

describe("vault collateral math", () => {
  it("rounds collateral up when the division is not exact", () => {
    expect(
      calculateCollateralAmount(100000000000000000n, BASE_INSTRUMENT, BASE_MARKET)
    ).toBe(3n);
  });

  it("preserves exact collateral results when division is exact", () => {
    expect(
      calculateCollateralAmount(500000000000000000n, BASE_INSTRUMENT, BASE_MARKET)
    ).toBe(15n);
  });

  it("keeps prm conversion as floor division for inverse previews", () => {
    expect(calculatePrmAmount(1n, BASE_INSTRUMENT, BASE_MARKET)).toBe(
      33333333333333333n
    );
  });

  it("rounds scaled collateral up with strike-based scaling", () => {
    const scaledMarket: MarketParams = {
      ...BASE_MARKET,
      isCollateralScaled: true,
    };

    expect(
      calculateCollateralAmount(100000000000000000n, BASE_INSTRUMENT, scaledMarket)
    ).toBe(15n);
  });
});
