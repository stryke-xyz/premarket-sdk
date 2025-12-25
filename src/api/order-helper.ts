import { pad, toHex, type Address, type Hex, type WalletClient } from "viem";
import { LimitOrder, MakerTraits, ExtensionBuilder } from "../limit-order";
import { Address as OneInchAddress } from "../address";
import { randBigInt } from "../utils/rand-bigint";
import { buildMakerAssetSuffix } from "../utils/orderUtils";
import type { Option } from "../shared/types.js";
import { calculateOptionTokenId as sharedCalculateOptionTokenId } from "../shared/utils.js";

const UINT_40_MAX = (1n << 40n) - 1n;

export class OrderHelper {
  constructor(
    private config: {
      chainId: number;
      optionTokenFactoryAddress: Address;
    }
  ) {}

  /**
   * Calculate option token ID from option parameters
   * Delegates to shared utility function
   */
  calculateOptionTokenId(option: Option): Hex {
    return sharedCalculateOptionTokenId(option);
  }

  /**
   * Build sell options order
   */
  buildSellOptionsOrder(params: {
    maker: Address;
    makerProxyAddress: Address;
    stableToken: Address;
    option: Option;
    optionAmount: string;
    stableAmount: string;
    expiresAt?: bigint; // Optional expiration timestamp in seconds
  }): {
    order: LimitOrder;
    optionTokenId: Hex;
    calldata: string;
    extensionEncoded: string;
  } {
    const optionTokenId = this.calculateOptionTokenId(params.option);

    const makerAssetSuffix = buildMakerAssetSuffix(
      this.config.optionTokenFactoryAddress,
      optionTokenId
    );

    const extension = new ExtensionBuilder()
      .withMakerAssetSuffix(makerAssetSuffix)
      .build();

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
      optionTokenId,
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
    option: Option;
    optionAmount: string;
    stableAmount: string;
    expiresAt?: bigint; // Optional expiration timestamp in seconds
  }): {
    order: LimitOrder;
    optionTokenId: Hex;
    calldata: string;
    extensionEncoded: string;
  } {
    const optionTokenId = this.calculateOptionTokenId(params.option);

    // For buy orders, the taker asset is ERC6909 options, so we use takerAssetSuffix
    const takerAssetSuffix = buildMakerAssetSuffix(
      this.config.optionTokenFactoryAddress,
      optionTokenId
    );

    const extension = new ExtensionBuilder()
      .withTakerAssetSuffix(takerAssetSuffix)
      .build();

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
      optionTokenId,
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
