import { decodeFunctionData, type Abi, type Address } from "viem";
import ExchangeAbi from "../abi/Exchange.abi.json" with { type: "json" };
import { ExchangeContract } from "./exchange-contract.js";
import { SignatureType, TradeType, type ExchangeOrder } from "./types.js";

const EXCHANGE_ADDRESS = "0x1111111111111111111111111111111111111111" as const;

function buildOrder(overrides?: Partial<ExchangeOrder>): ExchangeOrder {
  return {
    salt: 1n,
    nonce: 2n,
    marketId: 3n,
    makingAmount: 4n,
    takingAmount: 5n,
    deadline: 1_900_000_000n,
    maker: "0x2222222222222222222222222222222222222222",
    receiver: "0x3333333333333333333333333333333333333333",
    tradeType: TradeType.SELL,
    signatureType: SignatureType.EIP712,
    tokenId: 6n,
    ...overrides,
  };
}

describe("ExchangeContract", () => {
  it("encodes fillOrder calldata against the shipped exchange ABI", () => {
    const contract = new ExchangeContract(EXCHANGE_ADDRESS);
    const signature = `0x${"ab".repeat(65)}` as const;
    const order = buildOrder();

    const data = contract.getFillOrderCalldata(order, 7n, signature);
    const decoded = decodeFunctionData({
      abi: ExchangeAbi as Abi,
      data,
    });

    expect(decoded.functionName).toBe("fillOrder");
    expect(decoded.args?.[0]).toMatchObject({
      marketId: order.marketId,
      maker: order.maker,
      receiver: order.receiver,
      tradeType: Number(order.tradeType),
      signatureType: Number(order.signatureType),
    });
    expect(decoded.args?.[1]).toBe(7n);
    expect(decoded.args?.[2]).toBe(signature);
  });

  it("encodes resolver whitelist updates", () => {
    const contract = new ExchangeContract(EXCHANGE_ADDRESS);
    const resolver = "0x4444444444444444444444444444444444444444" as Address;

    const data = contract.getSetResolverWhitelistCalldata(resolver, true);
    const decoded = decodeFunctionData({
      abi: ExchangeAbi as Abi,
      data,
    });

    expect(decoded.functionName).toBe("setResolverWhitelist");
    expect(decoded.args).toEqual([resolver, true]);
  });
});
