/**
 * Token ID utilities for OptionMarketVault
 * 
 * Token ID scheme:
 * - PRM token id: keccak256(address, marketId, tick, isCall, expiry, chainId) << 1 (even)
 * - Option PRM token id: PRM token id | 1 (odd)
 */

import { encodeAbiParameters, keccak256, parseAbiParameters } from "viem";
import type { TokenIdParams } from "./types.js";

const UINT256_MASK = (1n << 256n) - 1n;

/**
 * Calculate PRM token ID from instrument params
 * Replicates: uint256(keccak256(abi.encode(address(this), ins.marketId, ins.tick, ins.isCall, expiry, block.chainid))) << 1
 */
export function getPrmTokenId(params: TokenIdParams): bigint {
  const encoded = encodeAbiParameters(
    parseAbiParameters("address, uint256, uint256, bool, uint256, uint256"),
    [
      params.vaultAddress,
      params.marketId,
      params.tick,
      params.isCall,
      params.expiry,
      BigInt(params.chainId),
    ]
  );

  const hash = keccak256(encoded);
  const hashBigInt = BigInt(hash);

  // Left shift by 1 to make it even (PRM tokens are even)
  return (hashBigInt << 1n) & UINT256_MASK;
}

/**
 * Convert PRM token ID to option PRM token ID
 * Option PRM ids are PRM ids with the least significant bit set (odd)
 */
export function prmToOptionTokenId(prmTokenId: bigint): bigint {
  return prmTokenId | 1n;
}

/**
 * Convert option PRM token ID to PRM token ID
 * Clears the least significant bit
 */
export function optionPrmToPrm(oPrmTokenId: bigint): bigint {
  return oPrmTokenId & ~1n;
}

/**
 * Check if a token ID is a PRM token (even) or option PRM token (odd)
 */
export function isPrmToken(tokenId: bigint): boolean {
  return (tokenId & 1n) === 0n;
}

/**
 * Check if a token ID is an option PRM token (odd)
 */
export function isOptionPrmToken(tokenId: bigint): boolean {
  return (tokenId & 1n) === 1n;
}

/**
 * Get option PRM token ID from instrument params
 */
export function getOptionPrmTokenId(params: TokenIdParams): bigint {
  return prmToOptionTokenId(getPrmTokenId(params));
}

/**
 * Create a unique position ID for a user and token
 */
export function getPositionId(tokenId: bigint, userAddress: `0x${string}`): string {
  return `${tokenId.toString()}-${userAddress.toLowerCase()}`;
}
