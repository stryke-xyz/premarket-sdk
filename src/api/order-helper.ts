import type { Address, Hex, WalletClient } from "viem";
import {
  buildExchangeOrder,
  getExchangeOrderHash,
  getExchangeTypedData,
  recoverExchangeOrderSigner,
  serializeExchangeOrder,
  SignatureType,
  TradeType,
  type BuildExchangeOrderParams,
  type ExchangeOrder,
  type SerializedExchangeOrder,
} from "../exchange/index.js";

/** Required chain context for hashing and signing exchange orders. */
export interface OrderHelperConfig {
  chainId: number;
  exchangeAddress: Address;
}

/** High-level helper for building, hashing, serializing, and signing SDK orders. */
export class OrderHelper {
  constructor(private readonly config: OrderHelperConfig) { }

  /** Builds a normalized order with default receiver, salt, and signature type values. */
  buildOrder(params: BuildExchangeOrderParams): ExchangeOrder {
    return buildExchangeOrder(params);
  }

  /** Builds a `SELL` order without requiring the caller to provide `tradeType`. */
  buildSellOrder(
    params: Omit<BuildExchangeOrderParams, "tradeType">,
  ): ExchangeOrder {
    return buildExchangeOrder({
      ...params,
      tradeType: TradeType.SELL,
    });
  }

  /** Builds a `BUY` order without requiring the caller to provide `tradeType`. */
  buildBuyOrder(
    params: Omit<BuildExchangeOrderParams, "tradeType">,
  ): ExchangeOrder {
    return buildExchangeOrder({
      ...params,
      tradeType: TradeType.BUY,
    });
  }

  /** Serializes a bigint-backed order for API transport or persistence. */
  serializeOrder(order: ExchangeOrder): SerializedExchangeOrder {
    return serializeExchangeOrder(order);
  }

  /** Computes the EIP-712 hash for the configured chain and exchange address. */
  hashOrder(order: ExchangeOrder): Hex {
    return getExchangeOrderHash(
      order,
      this.config.chainId,
      this.config.exchangeAddress,
    );
  }

  /** Returns the typed-data payload to pass into a wallet signer. */
  getTypedData(order: ExchangeOrder) {
    return getExchangeTypedData(
      order,
      this.config.chainId,
      this.config.exchangeAddress,
    );
  }

  /** Signs a standard externally-owned-account order using EIP-712 typed data. */
  async signEip712Order(
    order: ExchangeOrder,
    walletClient: WalletClient,
  ): Promise<Hex> {
    if (order.signatureType !== SignatureType.EIP712) {
      throw new Error("signEip712Order only supports EIP712 orders");
    }

    const account = walletClient.account;
    if (!account) {
      throw new Error("No account connected");
    }

    return walletClient.signTypedData({
      account,
      ...this.getTypedData(order),
    });
  }

  /** Signs an order intended for ERC-1271 validation using the owner wallet. */
  async signSimpleAccountOrder(
    order: ExchangeOrder,
    ownerWalletClient: WalletClient,
  ): Promise<Hex> {
    if (order.signatureType !== SignatureType.ERC1271) {
      throw new Error("signSimpleAccountOrder only supports ERC1271 orders");
    }

    const account = ownerWalletClient.account;
    if (!account) {
      throw new Error("No account connected");
    }

    return ownerWalletClient.signTypedData({
      account,
      ...this.getTypedData(order),
    });
  }

  /** Alias for EIP-712 signing, kept for compatibility with existing callers. */
  async signOrder(
    order: ExchangeOrder,
    walletClient: WalletClient,
  ): Promise<Hex> {
    return this.signEip712Order(order, walletClient);
  }

  /** Recovers the signer address from a previously signed order payload. */
  async recoverOrderSigner(
    order: ExchangeOrder,
    signature: Hex,
  ): Promise<Address> {
    return recoverExchangeOrderSigner(
      order,
      signature,
      this.config.chainId,
      this.config.exchangeAddress,
    );
  }
}
