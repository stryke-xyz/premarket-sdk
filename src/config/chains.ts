import { defineChain as defineChainViem } from "viem";

export const megaETHTestnet = defineChainViem({
  id: 6343,
  name: "MegaETH Testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://carrot.megaeth.com/rpc"],
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 4549927,
    },
  },
});
