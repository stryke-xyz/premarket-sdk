import { encodeFunctionData, type Address, type Hex } from "viem";
import type { OptionsOrder, SerializedOptionsOrder } from "./options-types.js";
import OptionsExchangeAbi from "../abi/OptionsExchange.abi.json" with { type: "json" };
const optionsExchangeAbi = OptionsExchangeAbi as readonly unknown[];

/** Minimal transaction envelope returned by options exchange calldata builders. */
export interface OptionsExchangeTransactionCall {
  to: Address;
  value?: bigint;
  data: Hex;
}

type OptionsOrderLike = OptionsOrder | SerializedOptionsOrder;

function normalizeOptionsOrder(order: OptionsOrderLike) {
  return {
    salt: BigInt(order.salt),
    nonce: BigInt(order.nonce),
    marketId: BigInt(order.marketId),
    tokenId: BigInt(order.tokenId),
    qty: BigInt(order.qty),
    limitPremium: BigInt(order.limitPremium),
    maxUnderlying: BigInt(order.maxUnderlying),
    minUnderlying: BigInt(order.minUnderlying),
    deadline: BigInt(order.deadline),
    maker: order.maker,
    receiver: order.receiver,
    side: Number(order.side),
    intent: Number(order.intent),
    signatureType: Number(order.signatureType),
  };
}

/** Calldata and transaction helpers for the covered (options) exchange contract. */
export class OptionsExchangeContract {
  constructor(public readonly address: Address) {}

  /**
   * Encodes `matchOrder` calldata for a crossing bid/ask pair.
   *
   * One `qty` for both sides — unlike the ordinary book there are no per-side
   * fill amounts to reconcile, because both orders are denominated in contracts.
   * `takerIsBid` names the crossing side; the other is resting and sets the
   * execution premium.
   */
  getMatchOrderCalldata(
    bidOrder: OptionsOrderLike,
    bidSignature: Hex,
    askOrder: OptionsOrderLike,
    askSignature: Hex,
    qty: bigint,
    takerIsBid: boolean
  ): Hex {
    return encodeFunctionData({
      abi: optionsExchangeAbi,
      functionName: "matchOrder",
      args: [
        normalizeOptionsOrder(bidOrder),
        bidSignature,
        normalizeOptionsOrder(askOrder),
        askSignature,
        qty,
        takerIsBid,
      ],
    });
  }

  /** Builds a transaction request for `matchOrder`. */
  buildMatchOrderTx(
    bidOrder: OptionsOrderLike,
    bidSignature: Hex,
    askOrder: OptionsOrderLike,
    askSignature: Hex,
    qty: bigint,
    takerIsBid: boolean
  ): OptionsExchangeTransactionCall {
    return {
      to: this.address,
      data: this.getMatchOrderCalldata(
        bidOrder,
        bidSignature,
        askOrder,
        askSignature,
        qty,
        takerIsBid
      ),
      value: 0n,
    };
  }

  /** Encodes `cancelOrder` calldata for a previously signed order. */
  getCancelOrderCalldata(order: OptionsOrderLike): Hex {
    return encodeFunctionData({
      abi: optionsExchangeAbi,
      functionName: "cancelOrder",
      args: [normalizeOptionsOrder(order)],
    });
  }

  /** Builds a transaction request for `cancelOrder`. */
  buildCancelOrderTx(order: OptionsOrderLike): OptionsExchangeTransactionCall {
    return {
      to: this.address,
      data: this.getCancelOrderCalldata(order),
      value: 0n,
    };
  }

  /** Encodes `incrementNonce` calldata for invalidating older orders by maker nonce. */
  getIncrementNonceCalldata(): Hex {
    return encodeFunctionData({
      abi: optionsExchangeAbi,
      functionName: "incrementNonce",
    });
  }

  /** Encodes `setResolver` calldata for resolver access management. */
  getSetResolverCalldata(resolver: Address, allowed: boolean): Hex {
    return encodeFunctionData({
      abi: optionsExchangeAbi,
      functionName: "setResolver",
      args: [resolver, allowed],
    });
  }

  /** Encodes `setFeeReceiver` calldata for protocol fee destination updates. */
  getSetFeeReceiverCalldata(newFeeReceiver: Address): Hex {
    return encodeFunctionData({
      abi: optionsExchangeAbi,
      functionName: "setFeeReceiver",
      args: [newFeeReceiver],
    });
  }

  /** Encodes `pause` calldata for admin pause flows. */
  getPauseCalldata(): Hex {
    return encodeFunctionData({
      abi: optionsExchangeAbi,
      functionName: "pause",
    });
  }

  /** Encodes `unpause` calldata for admin resume flows. */
  getUnpauseCalldata(): Hex {
    return encodeFunctionData({
      abi: optionsExchangeAbi,
      functionName: "unpause",
    });
  }
}
