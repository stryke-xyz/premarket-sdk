import {
  hashTypedData,
  recoverTypedDataAddress,
  type Address,
  type Hex,
} from "viem";
import type { ExchangeOrder } from "./types.js";

export const EXCHANGE_EIP712_NAME = "Exchange";
export const EXCHANGE_EIP712_VERSION = "1";

export const EXCHANGE_ORDER_TYPES = {
  Order: [
    { name: "salt", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "marketId", type: "uint256" },
    { name: "makingAmount", type: "uint256" },
    { name: "takingAmount", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "receiver", type: "address" },
    { name: "tradeType", type: "uint8" },
    { name: "signatureType", type: "uint8" },
    { name: "tokenId", type: "uint256" },
  ],
} as const;

export function getExchangeDomain(chainId: number, verifyingContract: Address) {
  return {
    name: EXCHANGE_EIP712_NAME,
    version: EXCHANGE_EIP712_VERSION,
    chainId,
    verifyingContract,
  } as const;
}

export function getExchangeTypedData(
  order: ExchangeOrder,
  chainId: number,
  verifyingContract: Address
) {
  return {
    domain: getExchangeDomain(chainId, verifyingContract),
    types: EXCHANGE_ORDER_TYPES,
    primaryType: "Order" as const,
    message: order,
  };
}

export function hashExchangeOrder(
  order: ExchangeOrder,
  chainId: number,
  verifyingContract: Address
): Hex {
  return hashTypedData(getExchangeTypedData(order, chainId, verifyingContract));
}

export async function recoverExchangeOrderSigner(
  order: ExchangeOrder,
  signature: Hex,
  chainId: number,
  verifyingContract: Address
): Promise<Address> {
  return recoverTypedDataAddress({
    ...getExchangeTypedData(order, chainId, verifyingContract),
    signature,
  });
}
