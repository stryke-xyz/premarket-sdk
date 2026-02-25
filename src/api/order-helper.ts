import { pad, toHex, concat, type Address, type Hex, type WalletClient } from "viem";
import { LimitOrder, MakerTraits, ExtensionBuilder } from "../limit-order";
import { Address as OneInchAddress } from "../address";
import { randBigInt } from "../utils/rand-bigint";
import { buildMakerAssetSuffix } from "../utils/orderUtils";

const UINT_40_MAX = (1n << 40n) - 1n;
const ZERO_BYTES32 = `0x${"0".repeat(64)}` as const;

function hasFeeId(feeId?: Hex): boolean {
  return Boolean(feeId && feeId !== ZERO_BYTES32);
}

/** Encode a string (max 32 bytes UTF-8) as 32 bytes with the string at the end (right-padded). */
function encodeMarketIdBytes32(marketId: string): Hex {
  const utf8 = new TextEncoder().encode(marketId);
  if (utf8.length > 32) throw new Error("marketId must be at most 32 bytes");
  const padded = new Uint8Array(32);
  padded.set(utf8, 32 - utf8.length);
  return (`0x${Array.from(padded)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}`) as Hex;
}

/** Custom data: first 32 bytes = feeId (or zeros), second 32 bytes = marketId string (or zeros). */
function buildCustomData(feeId?: Hex, marketId?: string): Hex {
  const first = hasFeeId(feeId) ? pad(feeId as Hex, { size: 32 }) : ZERO_BYTES32;
  const second =
    marketId != null && marketId !== ""
      ? encodeMarketIdBytes32(marketId)
      : ZERO_BYTES32;
  return concat([first, second]);
}

export class OrderHelper {
  constructor(
    private config: {
      chainId: number;
      optionMarketVaultAddress?: Address;
    }
  ) { }

  buildERC20Order(params: {
    maker: Address;
    buyingToken: Address;
    sellingToken: Address;
    makingAmount: bigint;
    takingAmount: bigint;
    feeId?: Hex;
    marketId?: string;
    expiresAt?: bigint; // Optional expiration timestamp in seconds
  }): {
    order: LimitOrder;
    calldata: string;
    extensionEncoded: string;
  } {

    const makerTraits = MakerTraits.default()
      .withNonce(randBigInt(UINT_40_MAX))
      .allowPartialFills()
      .allowMultipleFills()

    const hasMarketId = params.marketId != null && params.marketId !== "";
    let extensionEncoded = "0";
    let extension = undefined;
    if (hasFeeId(params.feeId) || hasMarketId) {
      const customData = buildCustomData(params.feeId, params.marketId ?? "");
      const extensionBuilder = new ExtensionBuilder().withCustomData(customData);
      extension = extensionBuilder.build();
      extensionEncoded = extension.encode();
      makerTraits.withExtension();
    }

    if (params.expiresAt) {
      makerTraits.withExpiration(params.expiresAt);
    }

    const order = new LimitOrder(
      {
        makerAsset: new OneInchAddress(params.sellingToken),
        takerAsset: new OneInchAddress(params.buyingToken),
        makingAmount: params.makingAmount,
        takingAmount: params.takingAmount,
        maker: new OneInchAddress(params.maker),
      },
      makerTraits,
      extension
    );

    return {
      order,
      calldata: order.toCalldata(),
      extensionEncoded,
    };
  }

  /**
   * Build sell options order
   */
  buildSellOptionsOrder(params: {
    maker: Address;
    makerProxyAddress: Address;
    stableToken: Address;
    optionAmount: string;
    stableAmount: string;
    optionTokenId: Hex;
    feeId?: Hex;
    marketId?: string;
    expiresAt?: bigint; // Optional expiration timestamp in seconds
  }): {
    order: LimitOrder;
    optionTokenId: Hex;
    calldata: string;
    extensionEncoded: string;
  } {

    const vaultAddress =
      this.config.optionMarketVaultAddress;
    if (!vaultAddress) {
      throw new Error("OrderHelper requires optionMarketVaultAddress");
    }

    const makerAssetSuffix = buildMakerAssetSuffix(vaultAddress, params.optionTokenId, params.feeId);

    const extensionBuilder = new ExtensionBuilder().withMakerAssetSuffix(makerAssetSuffix);
    extensionBuilder.withCustomData(buildCustomData(params.feeId, params.marketId ?? ""));
    const extension = extensionBuilder.build();

    const makerTraits = MakerTraits.default()
      .withNonce(randBigInt(UINT_40_MAX))
      .withExtension()
      .allowPartialFills()
      .allowMultipleFills();

    if (params.expiresAt) {
      makerTraits.withExpiration(params.expiresAt);
    }

    const order = new LimitOrder(
      {
        makerAsset: new OneInchAddress(params.makerProxyAddress),
        takerAsset: new OneInchAddress(params.stableToken),
        makingAmount: BigInt(params.optionAmount),
        takingAmount: BigInt(params.stableAmount),
        maker: new OneInchAddress(params.maker),
      },
      makerTraits,
      extension
    );

    return {
      order,
      optionTokenId: params.optionTokenId,
      calldata: order.toCalldata(),
      extensionEncoded: extension.encode(),
    };
  }

  /**
   * Build buy options order
   * For buy orders:
   * - Maker gives: USDC (ERC20) - no suffix needed
   * - Maker receives: Options (ERC6909) - needs takerAssetSuffix
   */
  buildBuyOptionsOrder(params: {
    maker: Address;
    makerProxyAddress: Address; // ERC6909 proxy for receiving options
    stableToken: Address;
    optionAmount: string;
    stableAmount: string;
    optionTokenId: Hex;
    marketId: string;
    feeId?: Hex;
    expiresAt?: bigint; // Optional expiration timestamp in seconds
  }): {
    order: LimitOrder;
    optionTokenId: Hex;
    calldata: string;
    extensionEncoded: string;
  } {

    // For buy orders, the taker asset is ERC6909 options, so we use takerAssetSuffix
    const vaultAddress =
      this.config.optionMarketVaultAddress;
    if (!vaultAddress) {
      throw new Error("OrderHelper requires optionMarketVaultAddress");
    }
    const takerAssetSuffix = buildMakerAssetSuffix(vaultAddress, params.optionTokenId, params.feeId);

    const extensionBuilder = new ExtensionBuilder().withTakerAssetSuffix(takerAssetSuffix);
    extensionBuilder.withCustomData(buildCustomData(params.feeId, params.marketId));
    const extension = extensionBuilder.build();

    const makerTraits = MakerTraits.default()
      .withNonce(randBigInt(UINT_40_MAX))
      .withExtension()
      .allowPartialFills()
      .allowMultipleFills();

    if (params.expiresAt) {
      makerTraits.withExpiration(params.expiresAt);
    }

    const order = new LimitOrder(
      {
        makerAsset: new OneInchAddress(params.stableToken),
        takerAsset: new OneInchAddress(params.makerProxyAddress),
        makingAmount: BigInt(params.stableAmount),
        takingAmount: BigInt(params.optionAmount),
        maker: new OneInchAddress(params.maker),
      },
      makerTraits,
      extension
    );

    return {
      order,
      optionTokenId: params.optionTokenId,
      calldata: order.toCalldata(),
      extensionEncoded: extension.encode(),
    };
  }

  /**
   * Sign an order with wallet client
   */
  async signOrder(
    order: LimitOrder,
    walletClient: WalletClient
  ): Promise<{ r: string; vs: string }> {
    const account = walletClient.account;
    if (!account) throw new Error("No account connected");

    const typedData = order.getTypedData(this.config.chainId);

    const signature = await walletClient.signTypedData({
      account,
      domain: typedData.domain as any,
      types: { Order: typedData.types.Order } as any,
      primaryType: "Order",
      message: typedData.message as any,
    });

    // Convert to r, vs format
    const rHex = signature.slice(0, 66) as Hex;
    const r = pad(rHex, { size: 32 });
    const sHex = `0x${signature.slice(66, 130)}` as Hex;
    const vHex = signature.slice(130, 132);
    const v = parseInt(vHex, 16);

    const sBigInt = BigInt(sHex);
    const vBit = v === 28 ? BigInt(1) << BigInt(255) : BigInt(0);
    const vsBigInt = vBit | sBigInt;
    const vs = pad(toHex(vsBigInt), { size: 32 });

    return { r, vs };
  }
}
