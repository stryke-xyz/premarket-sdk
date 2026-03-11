import { isCrossing, hasValidTokenPairForMatch, getTakingAmount } from "./math.js";
import { SignatureType, TradeType, type ExchangeOrder } from "./types.js";

const BASE_ORDER: Omit<ExchangeOrder, "tradeType" | "makingAmount" | "takingAmount"> = {
  salt: 1n,
  nonce: 1n,
  marketId: 1n,
  deadline: 1_900_000_000n,
  maker: "0x1111111111111111111111111111111111111111",
  receiver: "0x1111111111111111111111111111111111111111",
  signatureType: SignatureType.EIP712,
  tokenId: 100n,
};

describe("exchange math", () => {
  it("calculates taking amount with floor division", () => {
    expect(getTakingAmount(5n, 10n, 9n)).toBe(4n);
  });

  it("detects crossing for complementary BUY/SELL", () => {
    const buy: ExchangeOrder = {
      ...BASE_ORDER,
      tradeType: TradeType.BUY,
      makingAmount: 60n,
      takingAmount: 100n,
    };
    const sell: ExchangeOrder = {
      ...BASE_ORDER,
      maker: "0x2222222222222222222222222222222222222222",
      receiver: "0x2222222222222222222222222222222222222222",
      tradeType: TradeType.SELL,
      makingAmount: 100n,
      takingAmount: 55n,
    };

    expect(isCrossing(buy, sell)).toBe(true);
  });

  it("validates token pairs for MINT/MERGE style matches", () => {
    const sellA: ExchangeOrder = {
      ...BASE_ORDER,
      tradeType: TradeType.SELL,
      makingAmount: 10n,
      takingAmount: 10n,
      tokenId: 200n,
    };
    const sellB: ExchangeOrder = {
      ...BASE_ORDER,
      maker: "0x3333333333333333333333333333333333333333",
      receiver: "0x3333333333333333333333333333333333333333",
      tradeType: TradeType.SELL,
      makingAmount: 10n,
      takingAmount: 10n,
      tokenId: 201n,
    };

    expect(hasValidTokenPairForMatch(sellA, sellB)).toBe(true);
  });
});
