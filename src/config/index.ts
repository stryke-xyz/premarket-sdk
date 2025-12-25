import { hardhat, Chain } from "viem/chains";
import { SUPPORTED_CHAINS } from "./markets";
import { megaETHTestnet } from "./chains";

export interface Token {
  name: string;
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  logoURI?: string;
}

export const CHAIN_ID_TO_CHAIN: Record<number, Chain> = {
  31337: hardhat,
  6343: megaETHTestnet,
};

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

export const PERMIT2_ADDRESS: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  [megaETHTestnet.id]: "0xd1739f41B25869c7457E502Db4E0eaad663535B7",
};

export const WETH: Record<SUPPORTED_CHAINS, Token> = {
  [hardhat.id]: {
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    decimals: 18,
  },
  [megaETHTestnet.id]: {
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18,
  },
};

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
    address: ZERO_ADDRESS,
    decimals: 18,
  },
};

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
    address: ZERO_ADDRESS,
    decimals: 6,
  },
};

export const USDC: Record<SUPPORTED_CHAINS, Token> = {
  [hardhat.id]: {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x851356ae760d987E095750cCeb3bC6014560891C",
    decimals: 6,
  },
  [megaETHTestnet.id]: {
    name: "USD Coin",
    symbol: "USDC",
    address: "0x31c9236db6D1280fb133F2bd7876721530049121",
    decimals: 6,
  },
};

export const LIMIT_ORDER_PROTOCOL: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  [megaETHTestnet.id]: "0xa0b7722c3F6c64010eEF97F045e1aA9126cC3e62",
};

export const COLLATERAL_TOKEN_FACTORY: Record<SUPPORTED_CHAINS, `0x${string}`> =
  {
    [hardhat.id]: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    [megaETHTestnet.id]: "0x5Ee2E49C38F5976E27CC45C5A47817e140eBB69E",
  };

export const OPTION_TOKEN_FACTORY: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  [megaETHTestnet.id]: "0x405BF5630c60E6C0c36650ba25D7BdC9533a03C6",
};

export const PRE_MARKET_OPTIONS_STRATEGY: Record<
  SUPPORTED_CHAINS,
  `0x${string}`
> = {
  [hardhat.id]: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  [megaETHTestnet.id]: "0x32034F6889174f3ea32502Dfd27Da3A9C677d83c",
};

export const OPTION_MARKET: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  [megaETHTestnet.id]: "0xB583C8d8218BfFE30bd45DB9F0E19a944Cb1deBd",
};

export const ERC6909_PROXY: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E",
  [megaETHTestnet.id]: "0xC7B997B7a113108dA08562Fe1Bc87BF1bF3424B2",
};

export const ENTRY_POINT: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  [megaETHTestnet.id]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
};

export const MOCK_PAYMASTER: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
  [megaETHTestnet.id]: ZERO_ADDRESS,
};

export const SIMPLE_ACCOUNT_FACTORY: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
  [megaETHTestnet.id]: "0xca98DA1cB523DBff9234145ecA1158110dDd40dC",
};
