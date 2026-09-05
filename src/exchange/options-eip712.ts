import {
  hashTypedData,
  recoverTypedDataAddress,
  type Address,
  type Hex,
} from "viem";
import type { OptionsOrder } from "./options-types.js";

/**
 * EIP-712 domain name used by the options exchange contract.
 *
 * Distinct from the ordinary exchange's "Exchange" on purpose: the two books are
 * separate deployments with different order structs, and a shared domain name
 * would let a signature intended for one be replayed against the other.
 */
export const OPTIONS_EXCHANGE_EIP712_NAME = "OptionsExchange";
/** EIP-712 domain version used by the options exchange contract. */
export const OPTIONS_EXCHANGE_EIP712_VERSION = "1";

/**
 * Typed-data schema for covered order signing and signature recovery.
 *
 * Field order must match `ORDER_TYPEHASH` in OptionsExchange.sol exactly — the
 * contract hashes a flat `abi.encode`, so a reordered member yields a digest the
 * contract will never recover the maker from.
 */
export const OPTIONS_EXCHANGE_ORDER_TYPES = {
  Order: [
    { name: "salt", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "marketId", type: "uint256" },
    { name: "tokenId", type: "uint256" },
    { name: "qty", type: "uint256" },
    { name: "limitPremium", type: "uint256" },
    { name: "maxUnderlying", type: "uint256" },
    { name: "minUnderlying", type: "uint256" },
    { name: "deadline", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "receiver", type: "address" },
    { name: "side", type: "uint8" },
    { name: "intent", type: "uint8" },
    { name: "signatureType", type: "uint8" },
  ],
} as const;

/** Builds the EIP-712 domain object for a chain and options exchange address. */
export function getOptionsExchangeDomain(
  chainId: number,
  verifyingContract: Address
) {
  return {
    name: OPTIONS_EXCHANGE_EIP712_NAME,
    version: OPTIONS_EXCHANGE_EIP712_VERSION,
    chainId,
    verifyingContract,
  } as const;
}

/** Returns the full typed-data payload expected by wallet signers. */
export function getOptionsExchangeTypedData(
  order: OptionsOrder,
  chainId: number,
  verifyingContract: Address
) {
  return {
    domain: getOptionsExchangeDomain(chainId, verifyingContract),
    types: OPTIONS_EXCHANGE_ORDER_TYPES,
    primaryType: "Order" as const,
    message: order,
  };
}

/** Hashes an order exactly as `hashOrder` does for signature checks. */
export function hashOptionsExchangeOrder(
  order: OptionsOrder,
  chainId: number,
  verifyingContract: Address
): Hex {
  return hashTypedData(
    getOptionsExchangeTypedData(order, chainId, verifyingContract)
  );
}

/** Recovers the signer address from a covered order signature. */
export async function recoverOptionsExchangeOrderSigner(
  order: OptionsOrder,
  signature: Hex,
  chainId: number,
  verifyingContract: Address
): Promise<Address> {
  return recoverTypedDataAddress({
    ...getOptionsExchangeTypedData(order, chainId, verifyingContract),
    signature,
  });
}
