import { encodeFunctionData, type Address, type Hex } from "viem";
import type { ExchangeOrder, SerializedExchangeOrder } from "./types.js";
import ExchangeAbi from "../abi/Exchange.abi.json" with { type: "json" };
const exchangeAbi = ExchangeAbi as readonly unknown[];

/** Minimal transaction envelope returned by exchange calldata builders. */
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
    premium: BigInt(order.premium ?? 0n),
  };
}

/** Calldata and transaction helpers for the Stryke exchange contract. */
export class ExchangeContract {
  constructor(public readonly address: Address) {}

  /** Encodes `fillOrder` calldata for a maker order and fill amount. */
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

  /** Builds a transaction request for `fillOrder`. */
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

  /** Encodes `matchOrder` calldata for a taker-maker match. */
  getMatchOrderCalldata(
    takerOrder: OrderLike,
    takerSignature: Hex,
    makerOrder: OrderLike,
    makerSignature: Hex,
    takerFillAmount: bigint,
    makerFillAmount: bigint,
    /**
     * The fill's notional in quote units. Each side of a covered fill pays its
     * maker/taker rate on this, capped at the Exchange's `premiumFeeCapBps` of
     * the premium. Pass 0 elsewhere.
     */
    notional: bigint
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
        notional,
      ],
    });
  }

  /** Builds a transaction request for `matchOrder`. */
  buildMatchOrderTx(
    takerOrder: OrderLike,
    takerSignature: Hex,
    makerOrder: OrderLike,
    makerSignature: Hex,
    takerFillAmount: bigint,
    makerFillAmount: bigint,
    notional: bigint
  ): ExchangeTransactionCall {
    return {
      to: this.address,
      data: this.getMatchOrderCalldata(
        takerOrder,
        takerSignature,
        makerOrder,
        makerSignature,
        takerFillAmount,
        makerFillAmount,
        notional
      ),
      value: 0n,
    };
  }

  /** Encodes `cancelOrder` calldata for a previously signed order. */
  getCancelOrderCalldata(order: OrderLike): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "cancelOrder",
      args: [normalizeOrder(order)],
    });
  }

  /** Encodes `incrementNonce` calldata for invalidating older orders by maker nonce. */
  getIncrementNonceCalldata(): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "incrementNonce",
    });
  }

  /** Encodes `setResolverWhitelist` calldata for resolver access management. */
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
  /** Encodes `setPremiumFeeCap` calldata. Owner only; one cap, in FEE_RATE_BASE, for every market. */
  getSetPremiumFeeCapCalldata(capBps: bigint): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "setPremiumFeeCap",
      args: [capBps],
    });
  }

  /** Encodes `setFeeReceiver` calldata for protocol fee destination updates. */
  getSetFeeReceiverCalldata(newFeeReceiver: Address): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "setFeeReceiver",
      args: [newFeeReceiver],
    });
  }

  /** Encodes `pause` calldata for admin pause flows. */
  getPauseCalldata(): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "pause",
    });
  }

  /** Encodes `unpause` calldata for admin resume flows. */
  getUnpauseCalldata(): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "unpause",
    });
  }

  /** Encodes `multicall` calldata for batching exchange method calls. */
  getMulticallCalldata(data: Hex[], allowFailure = false): Hex {
    return encodeFunctionData({
      abi: exchangeAbi,
      functionName: "multicall",
      args: [data, allowFailure],
    });
  }
}
