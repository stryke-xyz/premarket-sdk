import { hardhat, Chain, arbitrum, anvil } from "viem/chains";
import { SUPPORTED_CHAINS } from "./chains.js";
import { megaETH, megaETHTestnet } from "./chains.js";
import { zeroAddress } from "viem";

/** Canonical token metadata used by SDK chain configuration maps. */
export interface Token {
  name: string;
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  logoURI?: string;
}

/** Maps supported chain ids to their matching viem chain objects. */
export const CHAIN_ID_TO_CHAIN: Record<number, Chain> = {
  31337: anvil,
  6343: megaETHTestnet,
  42161: arbitrum,
  4326: megaETH,
};

/** Permit2 deployment addresses used by Stryke integrations per chain. */
export const PERMIT2_ADDRESS: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  [megaETHTestnet.id]: "0xd1739f41B25869c7457E502Db4E0eaad663535B7",
  [megaETH.id]: "0xd1739f41B25869c7457E502Db4E0eaad663535B7",
  [arbitrum.id]: "0xd1739f41B25869c7457E502Db4E0eaad663535B7",
};

/** Wrapped native asset metadata per supported chain. */
export const WETH: Record<SUPPORTED_CHAINS, Token> = {
  [anvil.id]: {
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    decimals: 18,
  },
  [megaETHTestnet.id]: {
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
  },
  [arbitrum.id]: {
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
    decimals: 18,
  },
  [megaETH.id]: {
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
  },
};

/** Primary quote or stable token metadata used in market configs. */
export const TOKEN1: Record<SUPPORTED_CHAINS, Token> = {
  [hardhat.id]: {
    name: "Token 1",
    symbol: "USDAI",
    address: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
    decimals: 18,
  },
  [megaETHTestnet.id]: {
    name: "Token 1",
    symbol: "USDAI",
    address: zeroAddress,
    decimals: 18,
  },
  [arbitrum.id]: {
    name: "Token 1",
    symbol: "USDAI",
    address: zeroAddress,
    decimals: 18,
  },
  [megaETH.id]: {
    name: "USDm",
    symbol: "USDm",
    address: "0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7",
    decimals: 18,
  },
};

/** Secondary quote or stable token metadata used in market configs. */
export const TOKEN2: Record<SUPPORTED_CHAINS, Token> = {
  [hardhat.id]: {
    name: "Token 2",
    symbol: "USDC",
    address: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
    decimals: 6,
  },
  [megaETHTestnet.id]: {
    name: "Token 2",
    symbol: "USDC",
    address: zeroAddress,
    decimals: 6,
  },
  [arbitrum.id]: {
    name: "Token 2",
    symbol: "USDC",
    address: zeroAddress,
    decimals: 6,
  },
  [megaETH.id]: {
    name: "USDT0",
    symbol: "USDT0",
    address: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
    decimals: 6,
  },
};

/** Canonical USDC metadata per supported chain. */
export const USDC: Record<SUPPORTED_CHAINS, Token> = {
  [anvil.id]: {
    name: "USD Coin",
    symbol: "USDC",
    address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    decimals: 6,
  },
  [megaETHTestnet.id]: {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x31c9236db6D1280fb133F2bd7876721530049121",
    decimals: 6,
  },
  [arbitrum.id]: {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x373ef4400b9afd99f38bca1e0b288d36e2050705",
    decimals: 6,
  },
  [megaETH.id]: {
    name: "Mock USD Coin",
    symbol: "USDC",
    address: "0xb3FD5bF1590d653b14159bD848E5536f8Fe2d941",
    decimals: 6,
  },
};

/** USDm metadata on chains where the asset is available. */
export const USDM: Partial<Record<SUPPORTED_CHAINS, Token>> = {
  [anvil.id]: {
    name: "USDm",
    symbol: "USDm",
    address: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    decimals: 18,
  },
  [megaETH.id]: {
    name: "USDm",
    symbol: "USDm",
    address: "0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7",
    decimals: 18,
  },
};

/** USDT0 metadata on chains where the asset is available. */
export const USDT0: Partial<Record<SUPPORTED_CHAINS, Token>> = {
  [megaETH.id]: {
    name: "USDT0",
    symbol: "USDT0",
    address: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
    decimals: 6,
  },
};

/** OptionMarketVault contract addresses by supported chain. */
export const OPTION_MARKET_VAULT: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [anvil.id]: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  [megaETHTestnet.id]: "0xB583C8d8218BfFE30bd45DB9F0E19a944Cb1deBd",
  [arbitrum.id]: "0xd07280a68bd53b83b6b25861016bed637b3024ed",
  [megaETH.id]: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
};

/** Exchange contract addresses by supported chain. */
export const EXCHANGE: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [anvil.id]: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  [megaETHTestnet.id]: "0xa0b7722c3F6c64010eEF97F045e1aA9126cC3e62",
  [arbitrum.id]: "0x8e25cc9aed1131c54b176ef2f0a3a5593db1554b",
  [megaETH.id]: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
};

/** MarketsRegistry contract addresses on chains where the registry is deployed. */
export const MARKETS_REGISTRY: Partial<
  Record<SUPPORTED_CHAINS, `0x${string}`>
> = {
  [anvil.id]: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  [megaETH.id]: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
};

/** ERC-4337 EntryPoint addresses used by Stryke smart accounts. */
export const ENTRY_POINT: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [anvil.id]: "0x09635F643e140090A9A8Dcd712eD6285858ceBef",
  [megaETHTestnet.id]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  [arbitrum.id]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  [megaETH.id]: "0x09635F643e140090A9A8Dcd712eD6285858ceBef",
};

/** Mock paymaster addresses used by local or test deployments. */
export const MOCK_PAYMASTER: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
  [megaETHTestnet.id]: zeroAddress,
  [arbitrum.id]: zeroAddress,
  [megaETH.id]: zeroAddress,
};

/** Simple account factory addresses by supported chain. */
export const SIMPLE_ACCOUNT_FACTORY: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [anvil.id]: "0xc5a5C42992dECbae36851359345FE25997F5C42d",
  [megaETHTestnet.id]: "0xca98DA1cB523DBff9234145ecA1158110dDd40dC",
  [arbitrum.id]: "0x70c5b7D839f85a1D84c8E77BF0E6104617Da4f34",
  [megaETH.id]: "0xc5a5C42992dECbae36851359345FE25997F5C42d",
};

/** Fee registry addresses on chains where fee routing is deployed. */
export const FEE_REGISTRY: Partial<Record<SUPPORTED_CHAINS, `0x${string}`>> = {
  [megaETH.id]: "0x7767047E9d7591d4F611Cdb36D35e885bDac30be",
};

/** Restriction module addresses for ERC token controls where available. */
export const ERC_TOKENS_RESTRICTION_MODULE: Partial<
  Record<SUPPORTED_CHAINS, `0x${string}`>
> = {
  [anvil.id]: "0x67d269191c92Caf3cD7723F116c85e6E9bf55933",
  [megaETH.id]: "0xa4f0c83Ddc6b86513ab9Fd7115F20498AeD24FC0",
};
