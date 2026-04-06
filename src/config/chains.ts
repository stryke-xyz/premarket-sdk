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
 * Supported chain IDs type
 * Moved here to break circular dependency between markets.ts and index.ts
 */
export type SUPPORTED_CHAINS =
  | typeof hardhat.id
  | typeof arbitrum.id
  | typeof megaETH.id;
