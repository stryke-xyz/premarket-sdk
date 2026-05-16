import type { Address, Hex } from "viem";
import type { ExchangeOrder } from "../exchange/types.js";
import { recoverExchangeOrderSigner } from "../exchange/eip712.js";

export function optionPrmToPrmTokenId(tokenId: bigint): bigint {
  return tokenId & ~1n;
}

export function prmToOptionPrmTokenId(prmTokenId: bigint): bigint {
  return prmTokenId | 1n;
}

export function isComplementaryOptionTokenPair(
  tokenIdA: bigint,
  tokenIdB: bigint
): boolean {
  if (tokenIdA === tokenIdB) {
    return false;
  }

  return optionPrmToPrmTokenId(tokenIdA) === optionPrmToPrmTokenId(tokenIdB);
}

export async function verifyOrderSignature(
  order: ExchangeOrder,
  signature: Hex,
  chainId: number,
  exchangeAddress: Address
): Promise<Address> {
  return recoverExchangeOrderSigner(order, signature, chainId, exchangeAddress);
}
