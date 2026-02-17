import { OrderHelper } from "./order-helper.js";
import { Extension } from "../limit-order/extensions/extension.js";

const VAULT_ADDRESS = "0x1111111111111111111111111111111111111111" as const;
const MAKER_ADDRESS = "0x2222222222222222222222222222222222222222" as const;
const MAKER_PROXY_ADDRESS = "0x3333333333333333333333333333333333333333" as const;
const STABLE_TOKEN = "0x4444444444444444444444444444444444444444" as const;
const BUY_TOKEN = "0x5555555555555555555555555555555555555555" as const;
const SELL_TOKEN = "0x6666666666666666666666666666666666666666" as const;
const OPTION_TOKEN_ID =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const FEE_ID =
  "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as const;

function hasBit(value: bigint, bit: bigint): boolean {
  return (value & (1n << bit)) !== 0n;
}

function decodeSuffixMeta(suffix: string): {
  token: string;
  tokenId: string;
  offset: bigint;
  length: bigint;
  id: string;
} {
  const data = suffix.slice(2);
  const token = `0x${data.slice(24, 64)}`;
  const tokenId = `0x${data.slice(64, 128)}`;
  const offset = BigInt(`0x${data.slice(128, 192)}`);
  const length = BigInt(`0x${data.slice(192, 256)}`);
  const id = data.length >= 320 ? `0x${data.slice(256, 320)}` : "0x";

  return { token, tokenId, offset, length, id };
}

describe("OrderHelper fee-aware order building", () => {
  it("buildERC20Order keeps extension empty when feeId is not provided", () => {
    const helper = new OrderHelper({
      chainId: 4326,
      optionMarketVaultAddress: VAULT_ADDRESS,
    });

    const { order, extensionEncoded } = helper.buildERC20Order({
      maker: MAKER_ADDRESS,
      buyingToken: BUY_TOKEN,
      sellingToken: SELL_TOKEN,
      makingAmount: 10n,
      takingAmount: 20n,
    });

    const orderStruct = order.build();
    expect(extensionEncoded).toBe("0");
    expect(hasBit(BigInt(orderStruct.makerTraits), 249n)).toBe(false);
  });

  it("buildERC20Order attaches customData and extension flag when feeId is provided", () => {
    const helper = new OrderHelper({
      chainId: 4326,
      optionMarketVaultAddress: VAULT_ADDRESS,
    });

    const { order, extensionEncoded } = helper.buildERC20Order({
      maker: MAKER_ADDRESS,
      buyingToken: BUY_TOKEN,
      sellingToken: SELL_TOKEN,
      makingAmount: 10n,
      takingAmount: 20n,
      feeId: FEE_ID,
    });

    const decoded = Extension.decode(extensionEncoded);
    const orderStruct = order.build();
    expect(decoded.customData).toBe(FEE_ID);
    expect(hasBit(BigInt(orderStruct.makerTraits), 249n)).toBe(true);
  });

  it("buildSellOptionsOrder encodes vault/token suffix without fee id by default", () => {
    const helper = new OrderHelper({
      chainId: 4326,
      optionMarketVaultAddress: VAULT_ADDRESS,
    });

    const { extensionEncoded } = helper.buildSellOptionsOrder({
      maker: MAKER_ADDRESS,
      makerProxyAddress: MAKER_PROXY_ADDRESS,
      stableToken: STABLE_TOKEN,
      optionAmount: "1000000000000000000",
      stableAmount: "5000000",
      optionTokenId: OPTION_TOKEN_ID,
    });

    const decoded = Extension.decode(extensionEncoded);
    const suffix = decodeSuffixMeta(decoded.makerAssetSuffix);
    expect(suffix.token).toBe(VAULT_ADDRESS);
    expect(suffix.tokenId).toBe(OPTION_TOKEN_ID);
    expect(suffix.offset).toBe(192n);
    expect(suffix.length).toBe(0n);
    expect(decoded.customData).toBe("0x");
  });

  it("buildBuyOptionsOrder encodes fee id into suffix and customData", () => {
    const helper = new OrderHelper({
      chainId: 4326,
      optionMarketVaultAddress: VAULT_ADDRESS,
    });

    const { extensionEncoded } = helper.buildBuyOptionsOrder({
      maker: MAKER_ADDRESS,
      makerProxyAddress: MAKER_PROXY_ADDRESS,
      stableToken: STABLE_TOKEN,
      optionAmount: "1000000000000000000",
      stableAmount: "5000000",
      optionTokenId: OPTION_TOKEN_ID,
      feeId: FEE_ID,
    });

    const decoded = Extension.decode(extensionEncoded);
    const suffix = decodeSuffixMeta(decoded.takerAssetSuffix);
    expect(suffix.token).toBe(VAULT_ADDRESS);
    expect(suffix.tokenId).toBe(OPTION_TOKEN_ID);
    expect(suffix.offset).toBe(192n);
    expect(suffix.length).toBe(32n);
    expect(suffix.id).toBe(FEE_ID);
    expect(decoded.customData).toBe(FEE_ID);
  });

  it("supports deprecated optionTokenFactoryAddress config as fallback", () => {
    const helper = new OrderHelper({
      chainId: 4326,
      optionTokenFactoryAddress: VAULT_ADDRESS,
    });

    const { extensionEncoded } = helper.buildSellOptionsOrder({
      maker: MAKER_ADDRESS,
      makerProxyAddress: MAKER_PROXY_ADDRESS,
      stableToken: STABLE_TOKEN,
      optionAmount: "1000000000000000000",
      stableAmount: "5000000",
      optionTokenId: OPTION_TOKEN_ID,
    });

    const decoded = Extension.decode(extensionEncoded);
    const suffix = decodeSuffixMeta(decoded.makerAssetSuffix);
    expect(suffix.token).toBe(VAULT_ADDRESS);
  });
});

