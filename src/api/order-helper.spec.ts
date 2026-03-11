import { OrderHelper } from "./order-helper.js";
import { SignatureType, TradeType } from "../exchange/index.js";

const EXCHANGE_ADDRESS = "0x1111111111111111111111111111111111111111" as const;
const MAKER_ADDRESS = "0x2222222222222222222222222222222222222222" as const;

describe("OrderHelper (Exchange)", () => {
  it("builds a SELL order with default receiver and signature type", () => {
    const helper = new OrderHelper({
      chainId: 4326,
      exchangeAddress: EXCHANGE_ADDRESS,
    });

    const order = helper.buildSellOrder({
      maker: MAKER_ADDRESS,
      marketId: 1n,
      makingAmount: 10n,
      takingAmount: 20n,
      tokenId: 100n,
      nonce: 5n,
      deadline: 1_900_000_000n,
    });

    expect(order.maker).toBe(MAKER_ADDRESS);
    expect(order.receiver).toBe(MAKER_ADDRESS);
    expect(order.tradeType).toBe(TradeType.SELL);
    expect(order.signatureType).toBe(SignatureType.EIP712);
  });

  it("builds a BUY order with explicit receiver", () => {
    const helper = new OrderHelper({
      chainId: 4326,
      exchangeAddress: EXCHANGE_ADDRESS,
    });
    const receiver = "0x3333333333333333333333333333333333333333" as const;

    const order = helper.buildBuyOrder({
      maker: MAKER_ADDRESS,
      receiver,
      marketId: 2n,
      makingAmount: 30n,
      takingAmount: 40n,
      tokenId: 200n,
      nonce: 6n,
      deadline: 1_900_000_010n,
      signatureType: SignatureType.ERC1271,
    });

    expect(order.receiver).toBe(receiver);
    expect(order.tradeType).toBe(TradeType.BUY);
    expect(order.signatureType).toBe(SignatureType.ERC1271);
  });

  it("serializes and hashes orders deterministically", () => {
    const helper = new OrderHelper({
      chainId: 4326,
      exchangeAddress: EXCHANGE_ADDRESS,
    });

    const order = helper.buildOrder({
      maker: MAKER_ADDRESS,
      receiver: MAKER_ADDRESS,
      marketId: 3n,
      makingAmount: 50n,
      takingAmount: 75n,
      tokenId: 300n,
      nonce: 7n,
      deadline: 1_900_000_020n,
      tradeType: TradeType.SELL,
      salt: 123n,
    });

    const serialized = helper.serializeOrder(order);
    const hash = helper.hashOrder(order);

    expect(serialized.salt).toBe("123");
    expect(serialized.tradeType).toBe(TradeType.SELL);
    expect(hash).toMatch(/^0x[0-9a-f]{64}$/);
  });
});
