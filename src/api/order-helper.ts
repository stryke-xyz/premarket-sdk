import { pad, toHex, type Address, type Hex, type WalletClient } from "viem";
import { LimitOrder, MakerTraits, ExtensionBuilder } from "../limit-order";
import { Address as OneInchAddress } from "../address";
import { randBigInt } from "../utils/rand-bigint";
import { buildMakerAssetSuffix } from "../utils/orderUtils";

const UINT_40_MAX = (1n << 40n) - 1n;
const ZERO_BYTES32 = `0x${"0".repeat(64)}` as const;

function hasFeeId(feeId?: Hex): boolean {
  return Boolean(feeId && feeId !== ZERO_BYTES32);
}

export class OrderHelper {
  constructor(
    private config: {
      chainId: number;
      optionMarketVaultAddress?: Address;
      /** @deprecated Use optionMarketVaultAddress */
      optionTokenFactoryAddress?: Address;
    }
  ) { }

  buildERC20Order(params: {
    maker: Address;
    buyingToken: Address;
    sellingToken: Address;
    makingAmount: bigint;
    takingAmount: bigint;
    feeId?: Hex;
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

    let extensionEncoded = "0";
    let extension = undefined;
    if (hasFeeId(params.feeId)) {
      const extensionBuilder = new ExtensionBuilder().withCustomData(params.feeId as Hex);
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
    expiresAt?: bigint; // Optional expiration timestamp in seconds
  }): {
    order: LimitOrder;
    optionTokenId: Hex;
    calldata: string;
    extensionEncoded: string;
  } {

    const vaultAddress =
      this.config.optionMarketVaultAddress || this.config.optionTokenFactoryAddress;
    if (!vaultAddress) {
      throw new Error("OrderHelper requires optionMarketVaultAddress");
    }

    const makerAssetSuffix = buildMakerAssetSuffix(vaultAddress, params.optionTokenId, params.feeId);

    const extensionBuilder = new ExtensionBuilder().withMakerAssetSuffix(makerAssetSuffix);
    if (hasFeeId(params.feeId)) {
      extensionBuilder.withCustomData(params.feeId as Hex);
    }
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
      this.config.optionMarketVaultAddress || this.config.optionTokenFactoryAddress;
    if (!vaultAddress) {
      throw new Error("OrderHelper requires optionMarketVaultAddress");
    }
    const takerAssetSuffix = buildMakerAssetSuffix(vaultAddress, params.optionTokenId, params.feeId);

    const extensionBuilder = new ExtensionBuilder().withTakerAssetSuffix(takerAssetSuffix);
    if (hasFeeId(params.feeId)) {
      extensionBuilder.withCustomData(params.feeId as Hex);
    }
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
