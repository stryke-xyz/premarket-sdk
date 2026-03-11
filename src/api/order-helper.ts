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

  async signOrder(order: ExchangeOrder, walletClient: WalletClient): Promise<Hex> {
    const account = walletClient.account;
    if (!account) {
      throw new Error("No account connected");
    }

    return walletClient.signTypedData({
      account,
      ...getExchangeTypedData(
        {
          ...order,
          signatureType: SignatureType.EIP712,
        },
        this.config.chainId,
        this.config.exchangeAddress
      ),
    });
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
