import { defineChain as defineChainViem } from "viem";
// USD 0x39A777BFfBF54a8366E6564626C6032DfF104b8D
// collateralTokenFactory 0xe6199c7f1843C05241bE5d98d632967A7436996c
// optionTokenFactory 0x3e0563BA483A2Ade27Ea36445F1621adCbDB67f8
// premarketStrategy 0xD79A0797E543A6226C657A7128AdABf2964b47e4
// optionMarket 0x9df85DA64076b57E045023a65a76F0d86306740D
// limitOrderProtocol 0xD01d8B0456B954e9a5dfd5709609f2601B642DF6
// collateralTokenProxy 0x6377531Eb1ba4d5eC8846C03C7931495FbEB057B
// optionTokenProxy 0xeE5c00744fca3B6d3cA03E1660464A80A6c360E8
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
