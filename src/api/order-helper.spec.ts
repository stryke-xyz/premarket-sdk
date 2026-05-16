import { OrderHelper } from "./order-helper.js";
import { SignatureType, TradeType } from "../exchange/index.js";

const EXCHANGE_ADDRESS = "0x1111111111111111111111111111111111111111" as const;
const MAKER_ADDRESS = "0x2222222222222222222222222222222222222222" as const;

type TypedDataPayload = ReturnType<OrderHelper["getTypedData"]> & {
  account: `0x${string}`;
};

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

  it("returns typed data without rewriting the order payload", () => {
    const helper = new OrderHelper({
      chainId: 4326,
      exchangeAddress: EXCHANGE_ADDRESS,
    });

    const order = helper.buildOrder({
      maker: MAKER_ADDRESS,
      receiver: MAKER_ADDRESS,
      marketId: 4n,
      makingAmount: 80n,
      takingAmount: 120n,
      tokenId: 400n,
      nonce: 8n,
      deadline: 1_900_000_030n,
      tradeType: TradeType.BUY,
      signatureType: SignatureType.ERC1271,
      salt: 456n,
    });

    const typedData = helper.getTypedData(order);

    expect(typedData.domain.name).toBe("Exchange");
    expect(typedData.domain.version).toBe("1");
    expect(typedData.message.signatureType).toBe(SignatureType.ERC1271);
    expect(typedData.message).toBe(order);
  });

  it("signs EIP712 orders without mutating the signed payload", async () => {
    const helper = new OrderHelper({
      chainId: 4326,
      exchangeAddress: EXCHANGE_ADDRESS,
    });

    const order = helper.buildOrder({
      maker: MAKER_ADDRESS,
      receiver: MAKER_ADDRESS,
      marketId: 5n,
      makingAmount: 90n,
      takingAmount: 150n,
      tokenId: 500n,
      nonce: 9n,
      deadline: 1_900_000_040n,
      tradeType: TradeType.SELL,
      signatureType: SignatureType.EIP712,
      salt: 789n,
    });

    let captured: TypedDataPayload | undefined;
    const walletClient = {
      account: MAKER_ADDRESS,
      signTypedData: async (payload: TypedDataPayload) => {
        captured = payload;
        return "0x" + "12".repeat(65);
      },
    } as unknown as Parameters<OrderHelper["signEip712Order"]>[1];

    const signature = await helper.signEip712Order(order, walletClient);

    expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
    expect(captured).toBeDefined();
    const typedData = captured!;
    expect(typedData.message).toBe(order);
    expect(typedData.message.signatureType).toBe(SignatureType.EIP712);
    expect(order.signatureType).toBe(SignatureType.EIP712);
  });

  it("keeps signOrder as a compatibility alias for EIP712 signing", async () => {
    const helper = new OrderHelper({
      chainId: 4326,
      exchangeAddress: EXCHANGE_ADDRESS,
    });

    const order = helper.buildOrder({
      maker: MAKER_ADDRESS,
      receiver: MAKER_ADDRESS,
      marketId: 6n,
      makingAmount: 95n,
      takingAmount: 155n,
      tokenId: 600n,
      nonce: 10n,
      deadline: 1_900_000_050n,
      tradeType: TradeType.BUY,
      signatureType: SignatureType.EIP712,
      salt: 999n,
    });

    let called = false;
    const walletClient = {
      account: MAKER_ADDRESS,
      signTypedData: async () => {
        called = true;
        return "0x" + "34".repeat(65);
      },
    } as unknown as Parameters<OrderHelper["signOrder"]>[1];

    const signature = await helper.signOrder(order, walletClient);

    expect(called).toBe(true);
    expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it("rejects ERC1271 orders in the EIP712 signing helper", async () => {
    const helper = new OrderHelper({
      chainId: 4326,
      exchangeAddress: EXCHANGE_ADDRESS,
    });

    const order = helper.buildOrder({
      maker: MAKER_ADDRESS,
      receiver: MAKER_ADDRESS,
      marketId: 6n,
      makingAmount: 95n,
      takingAmount: 155n,
      tokenId: 600n,
      nonce: 10n,
      deadline: 1_900_000_050n,
      tradeType: TradeType.BUY,
      signatureType: SignatureType.ERC1271,
      salt: 999n,
    });

    const walletClient = {
      account: MAKER_ADDRESS,
      signTypedData: async () => {
        throw new Error("should not be called");
      },
    } as unknown as Parameters<OrderHelper["signEip712Order"]>[1];

    await expect(helper.signEip712Order(order, walletClient)).rejects.toThrow(
      "signEip712Order only supports EIP712 orders"
    );
  });

  it("signs SimpleAccount ERC1271 orders without rewriting the payload", async () => {
    const helper = new OrderHelper({
      chainId: 4326,
      exchangeAddress: EXCHANGE_ADDRESS,
    });

    const smartAccountAddress = "0x4444444444444444444444444444444444444444" as const;
    const ownerAddress = "0x5555555555555555555555555555555555555555" as const;

    const order = helper.buildOrder({
      maker: smartAccountAddress,
      receiver: smartAccountAddress,
      marketId: 7n,
      makingAmount: 100n,
      takingAmount: 200n,
      tokenId: 700n,
      nonce: 11n,
      deadline: 1_900_000_060n,
      tradeType: TradeType.SELL,
      signatureType: SignatureType.ERC1271,
      salt: 1001n,
    });

    let captured: TypedDataPayload | undefined;
    const walletClient = {
      account: ownerAddress,
      signTypedData: async (payload: TypedDataPayload) => {
        captured = payload;
        return "0x" + "56".repeat(65);
      },
    } as unknown as Parameters<OrderHelper["signSimpleAccountOrder"]>[1];

    const signature = await helper.signSimpleAccountOrder(order, walletClient);

    expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
    expect(captured).toBeDefined();
    const typedData = captured!;
    expect(typedData.account).toBe(ownerAddress);
    expect(typedData.message).toBe(order);
    expect(typedData.message.maker).toBe(smartAccountAddress);
    expect(typedData.message.signatureType).toBe(SignatureType.ERC1271);
  });

  it("rejects EIP712 orders in the SimpleAccount signing helper", async () => {
    const helper = new OrderHelper({
      chainId: 4326,
      exchangeAddress: EXCHANGE_ADDRESS,
    });

    const order = helper.buildOrder({
      maker: MAKER_ADDRESS,
      receiver: MAKER_ADDRESS,
      marketId: 8n,
      makingAmount: 105n,
      takingAmount: 205n,
      tokenId: 800n,
      nonce: 12n,
      deadline: 1_900_000_070n,
      tradeType: TradeType.BUY,
      signatureType: SignatureType.EIP712,
      salt: 1002n,
    });

    const walletClient = {
      account: MAKER_ADDRESS,
      signTypedData: async () => {
        throw new Error("should not be called");
      },
    } as unknown as Parameters<OrderHelper["signSimpleAccountOrder"]>[1];

    await expect(helper.signSimpleAccountOrder(order, walletClient)).rejects.toThrow(
      "signSimpleAccountOrder only supports ERC1271 orders"
    );
  });
});
