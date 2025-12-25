import { pad, toHex, type Hex, recoverAddress, concat } from "viem";
import { LimitOrder } from "../limit-order";
import type { OrderSignature } from "../shared/types.js";

/**
 * Build makerAssetSuffix for ERC6909 extension
 */
export function buildMakerAssetSuffix(
  tokenAddress: string,
  tokenId: Hex
): string {
  const tokenPadded = pad(tokenAddress as Hex, { size: 32 }).slice(2);
  const tokenIdPadded = pad(tokenId, { size: 32 }).slice(2);
  const offsetPadded = pad(toHex(192), { size: 32 }).slice(2);
  const lengthPadded = pad(toHex(0), { size: 32 }).slice(2);
  return "0x" + tokenPadded + tokenIdPadded + offsetPadded + lengthPadded;
}

/**
 * Decode asset suffix (makerAssetSuffix or takerAssetSuffix) to extract token address and tokenId
 * Format: 0x + [32 bytes padded token address] + [32 bytes tokenId] + [32 bytes offset] + [32 bytes length]
 */
export function decodeAssetSuffix(suffix: string): {
  token: `0x${string}`;
  tokenId: bigint;
} | null {
  if (suffix === "0x" || suffix.length < 130) return null;

  const data = suffix.slice(2); // Remove 0x prefix

  if (data.length < 128) return null; // Need at least 64 bytes (128 hex chars) for address + tokenId

  // Token address is in the last 20 bytes (40 hex chars) of the first 32-byte chunk
  // Bytes 0-31: padded address (address is in bytes 12-31, hex chars 24-64)
  const tokenAddressHex = ("0x" + data.slice(24, 64)) as `0x${string}`;

  // TokenId is in the second 32-byte chunk
  // Bytes 32-63: tokenId (hex chars 64-128)
  const tokenIdHex = "0x" + data.slice(64, 128);
  const tokenId = BigInt(tokenIdHex);

  return {
    token: tokenAddressHex,
    tokenId,
  };
}

/**
 * Verify order signature and recover signer address
 */
export async function verifyOrderSignature(
  limitOrder: LimitOrder,
  signature: OrderSignature,
  chainId: number
): Promise<string> {
  const orderHash = limitOrder.getOrderHash(chainId) as Hex;

  // Extract v from vs
  const vsBigInt = BigInt(signature.vs);
  const v = vsBigInt >> BigInt(255) === BigInt(1) ? 28 : 27;
  const sMask = (BigInt(1) << BigInt(255)) - BigInt(1);
  const s = pad(toHex(vsBigInt & sMask), { size: 32 });

  // Reconstruct full signature
  const fullSignature = concat([signature.r as Hex, s, toHex(v)]);

  const recoveredAddress = await recoverAddress({
    hash: orderHash,
    signature: fullSignature,
  });

  return recoveredAddress.toLowerCase();
}
