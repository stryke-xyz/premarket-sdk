import { defineChain as defineChainViem } from "viem";
import { hardhat, arbitrum } from "viem/chains";

/** Viem chain definition for MegaETH mainnet. */
export const megaETH = defineChainViem({
  id: 4326,
  name: "MegaETH",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://mainnet.megaeth.com/rpc"],
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 4895521,
    },
  },
});

/**
 * Viem chain definition for Robinhood Chain (Arbitrum Orbit L2, id 4663).
 *
 * Defined locally rather than imported from `viem/chains`: viem did not export
 * a `robinhood` chain as of 2.43.x, so importing it broke the build. Keeping it
 * here matches how megaETH is handled and avoids forcing a viem upgrade across
 * every consuming repo. Values are from the public chain registry
 * (https://chainid.network — `chainId: 4663`).
 *
 * `multicall3` is deliberately omitted: its deployment on this chain is not
 * confirmed, and a wrong address silently breaks every batched read. viem falls
 * back to individual calls when it is absent.
 */
export const robinhood = defineChainViem({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "HoodScan",
      url: "https://hoodscan.ai",
    },
  },
});

/**
 * Supported chain IDs type
 * Moved here to break circular dependency between markets.ts and index.ts
 */
export type SUPPORTED_CHAINS =
  | typeof hardhat.id
  | typeof arbitrum.id
  | typeof megaETH.id
  | typeof robinhood.id;

/** Every chain the SDK carries configuration for, in a runtime-iterable form. */
export const SUPPORTED_CHAIN_IDS = [
  hardhat.id,
  arbitrum.id,
  megaETH.id,
  robinhood.id,
] as const satisfies readonly SUPPORTED_CHAINS[];

/** Narrow an arbitrary number (e.g. from env) to a configured chain id. */
export function isSupportedChain(
  chainId: number,
): chainId is SUPPORTED_CHAINS {
  return (SUPPORTED_CHAIN_IDS as readonly number[]).includes(chainId);
}
