import { buildExchangeOrder, getExecutableMakingAmount, isOrderExpired } from "./order.js";
import { SignatureType, TradeType } from "./types.js";

describe("exchange order helpers", () => {
  it("builds order with defaults", () => {
    const order = buildExchangeOrder({
      maker: "0x1111111111111111111111111111111111111111",
      marketId: 1n,
      makingAmount: 100n,
      takingAmount: 80n,
      deadline: 1_900_000_000n,
      tradeType: TradeType.SELL,
      tokenId: 42n,
      nonce: 2n,
    });

    expect(order.receiver).toBe(order.maker);
    expect(order.signatureType).toBe(SignatureType.EIP712);
  });

  it("handles remaining=0 non-terminal status as untouched order", () => {
    const order = buildExchangeOrder({
      maker: "0x1111111111111111111111111111111111111111",
      marketId: 1n,
      makingAmount: 100n,
      takingAmount: 80n,
      deadline: 1_900_000_000n,
      tradeType: TradeType.SELL,
      tokenId: 42n,
      nonce: 2n,
    });

    expect(
      getExecutableMakingAmount(order, {
        isFilledOrCancelled: false,
        remaining: 0n,
      })
    ).toBe(100n);
  });

  it("checks deadline expiry", () => {
    const order = buildExchangeOrder({
      maker: "0x1111111111111111111111111111111111111111",
      marketId: 1n,
      makingAmount: 100n,
      takingAmount: 80n,
      deadline: 10n,
      tradeType: TradeType.SELL,
      tokenId: 42n,
      nonce: 2n,
    });

    expect(isOrderExpired(order, 11n)).toBe(true);
    expect(isOrderExpired(order, 10n)).toBe(false);
  });
});
