import { encodeFunctionData, type Address, type Hex } from "viem";
import type { ExchangeOrder, SerializedExchangeOrder } from "./types.js";
import ExchangeAbi from "../abi/Exchange.abi.json" with { type: "json" };
const exchangeAbi = ExchangeAbi as readonly unknown[];

export interface ExchangeTransactionCall {
  to: Address;
  value?: bigint;
  data: Hex;
}

type OrderLike = ExchangeOrder | SerializedExchangeOrder;

function normalizeOrder(order: OrderLike) {
  return {
    salt: BigInt(order.salt),
    nonce: BigInt(order.nonce),
    marketId: BigInt(order.marketId),
    makingAmount: BigInt(order.makingAmount),
    takingAmount: BigInt(order.takingAmount),
    deadline: BigInt(order.deadline),
    maker: order.maker,
    receiver: order.receiver,
    tradeType: Number(order.tradeType),
    signatureType: Number(order.signatureType),
    tokenId: BigInt(order.tokenId),
  };
}

export class ExchangeContract {
  constructor(public readonly address: Address) {}

  getFillOrderCalldata(
    order: OrderLike,
    fillAmount: bigint,
    signature: Hex
  ): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "fillOrder",
      args: [normalizeOrder(order), fillAmount, signature],
    });
  }

  buildFillOrderTx(
    order: OrderLike,
    fillAmount: bigint,
    signature: Hex
  ): ExchangeTransactionCall {
    return {
      to: this.address,
      data: this.getFillOrderCalldata(order, fillAmount, signature),
      value: 0n,
    };
  }

  getMatchOrderCalldata(
    takerOrder: OrderLike,
    takerSignature: Hex,
    makerOrder: OrderLike,
    makerSignature: Hex,
    takerFillAmount: bigint,
    makerFillAmount: bigint
  ): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "matchOrder",
      args: [
        normalizeOrder(takerOrder),
        takerSignature,
        normalizeOrder(makerOrder),
        makerSignature,
        takerFillAmount,
        makerFillAmount,
      ],
    });
  }

  buildMatchOrderTx(
    takerOrder: OrderLike,
    takerSignature: Hex,
    makerOrder: OrderLike,
    makerSignature: Hex,
    takerFillAmount: bigint,
    makerFillAmount: bigint
  ): ExchangeTransactionCall {
    return {
      to: this.address,
      data: this.getMatchOrderCalldata(
        takerOrder,
        takerSignature,
        makerOrder,
        makerSignature,
        takerFillAmount,
        makerFillAmount
      ),
      value: 0n,
    };
  }

  getCancelOrderCalldata(order: OrderLike): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "cancelOrder",
      args: [normalizeOrder(order)],
    });
  }

  getIncrementNonceCalldata(): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "incrementNonce",
    });
  }

  getSetResolverWhitelistCalldata(
    resolver: Address,
    isWhitelisted: boolean
  ): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "setResolverWhitelist",
      args: [resolver, isWhitelisted],
    });
  }

  getSetFeeReceiverCalldata(newFeeReceiver: Address): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "setFeeReceiver",
      args: [newFeeReceiver],
    });
  }

  getPauseCalldata(): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "pause",
    });
  }

  getUnpauseCalldata(): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "unpause",
    });
  }

  getMulticallCalldata(data: Hex[], allowFailure = false): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "multicall",
      args: [data, allowFailure],
    });
  }
}
