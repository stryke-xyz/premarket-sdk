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

export interface OrderHelperConfig {
  chainId: number;
  exchangeAddress: Address;
}

export class OrderHelper {
  constructor(private readonly config: OrderHelperConfig) {}

  buildOrder(params: BuildExchangeOrderParams): ExchangeOrder {
    return buildExchangeOrder(params);
  }

  buildSellOrder(
    params: Omit<BuildExchangeOrderParams, "tradeType">
  ): ExchangeOrder {
    return buildExchangeOrder({
      ...params,
      tradeType: TradeType.SELL,
    });
  }

  buildBuyOrder(
    params: Omit<BuildExchangeOrderParams, "tradeType">
  ): ExchangeOrder {
    return buildExchangeOrder({
      ...params,
      tradeType: TradeType.BUY,
    });
  }

  serializeOrder(order: ExchangeOrder): SerializedExchangeOrder {
    return serializeExchangeOrder(order);
  }

  hashOrder(order: ExchangeOrder): Hex {
    return getExchangeOrderHash(
      order,
      this.config.chainId,
      this.config.exchangeAddress
    );
  }

  getTypedData(order: ExchangeOrder) {
    return getExchangeTypedData(
      order,
      this.config.chainId,
      this.config.exchangeAddress
    );
  }

  async signEip712Order(
    order: ExchangeOrder,
    walletClient: WalletClient
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

  async signSimpleAccountOrder(
    order: ExchangeOrder,
    ownerWalletClient: WalletClient
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

  async signOrder(order: ExchangeOrder, walletClient: WalletClient): Promise<Hex> {
    return this.signEip712Order(order, walletClient);
  }

  async recoverOrderSigner(
    order: ExchangeOrder,
    signature: Hex
  ): Promise<Address> {
    return recoverExchangeOrderSigner(
      order,
      signature,
      this.config.chainId,
      this.config.exchangeAddress
    );
  }
}
