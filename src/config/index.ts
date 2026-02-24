import { hardhat, Chain, arbitrum } from "viem/chains";
import { SUPPORTED_CHAINS } from "./chains";
import { megaETH, megaETHTestnet } from "./chains";

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
  42161: arbitrum,
  4326: megaETH,
};

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

export const PERMIT2_ADDRESS: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  [megaETHTestnet.id]: "0xd1739f41B25869c7457E502Db4E0eaad663535B7",
  [megaETH.id]: "0xd1739f41B25869c7457E502Db4E0eaad663535B7",
  [arbitrum.id]: "0xd1739f41B25869c7457E502Db4E0eaad663535B7",
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
  [arbitrum.id]: {
    name: "Token 1",
    symbol: "USDAI",
    address: ZERO_ADDRESS,
    decimals: 18,
  },
  [megaETH.id]: {
    name: "USDm",
    symbol: "USDm",
    address: "0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7",
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
  [arbitrum.id]: {
    name: "Token 2",
    symbol: "USDC",
    address: ZERO_ADDRESS,
    decimals: 6,
  },
  [megaETH.id]: {
    name: "USDT0",
    symbol: "USDT0",
    address: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
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

export const USDM: Partial<Record<SUPPORTED_CHAINS, Token>> = {
  [megaETH.id]: {
    name: "USDm",
    symbol: "USDm",
    address: "0xFAfDdbb3FC7688494971a79cc65DCa3EF82079E7",
    decimals: 18,
  },
};

export const USDT0: Partial<Record<SUPPORTED_CHAINS, Token>> = {
  [megaETH.id]: {
    name: "USDT0",
    symbol: "USDT0",
    address: "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb",
    decimals: 6,
  },
};

export const OPTION_MARKET_VAULT: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  [megaETHTestnet.id]: "0xB583C8d8218BfFE30bd45DB9F0E19a944Cb1deBd",
  [arbitrum.id]: "0xd07280a68bd53b83b6b25861016bed637b3024ed",
  [megaETH.id]: "0x1b24F86AB31C999f417222781b96A9e2EFeB80a7",
};

export const LIMIT_ORDER_PROTOCOL: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  [megaETHTestnet.id]: "0xa0b7722c3F6c64010eEF97F045e1aA9126cC3e62",
  [arbitrum.id]: "0x8e25cc9aed1131c54b176ef2f0a3a5593db1554b",
  [megaETH.id]: "0xCf24f40D2dd88084e9C28FE34Ba9E24AFDACb7C2",
};

export const COLLATERAL_TOKEN_FACTORY: Record<SUPPORTED_CHAINS, `0x${string}`> =
{
  [hardhat.id]: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  [megaETHTestnet.id]: "0x5Ee2E49C38F5976E27CC45C5A47817e140eBB69E",
  [arbitrum.id]: "0xa1ff5ee51f8fa0a6408032be2c9568cd39dcb479",
  [megaETH.id]: "0x3e0563ba483a2ade27ea36445f1621adcbdb67f8",
};

export const OPTION_TOKEN_FACTORY: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  [megaETHTestnet.id]: "0x405BF5630c60E6C0c36650ba25D7BdC9533a03C6",
  [arbitrum.id]: "0x9c3c6b7820d2610b6ef9649d4a47b53e579fe331",
  [megaETH.id]: "0xd79a0797e543a6226c657a7128adabf2964b47e4",
};

export const PRE_MARKET_OPTIONS_STRATEGY: Record<
  SUPPORTED_CHAINS,
  `0x${string}`
> = {
  [hardhat.id]: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  [megaETHTestnet.id]: "0x32034F6889174f3ea32502Dfd27Da3A9C677d83c",
  [arbitrum.id]: "0xa60e31bb222ff579debedc0f40b12e4586221a6c",
  [megaETH.id]: "0x9df85da64076b57e045023a65a76f0d86306740d",
};

export const OPTION_MARKET: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  [megaETHTestnet.id]: "0xB583C8d8218BfFE30bd45DB9F0E19a944Cb1deBd",
  [arbitrum.id]: "0xd07280a68bd53b83b6b25861016bed637b3024ed",
  [megaETH.id]: "0x1b24F86AB31C999f417222781b96A9e2EFeB80a7",
};

export const ERC6909_PROXY: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690",
  [megaETHTestnet.id]: "0xC7B997B7a113108dA08562Fe1Bc87BF1bF3424B2",
  [arbitrum.id]: "0x7ddb3df04ac685e2f1da6fd638403e531682eb65",
  [megaETH.id]: "0xEE7f074Af2A7EbE27475b12A758e60C73504B576",
};

export const ENTRY_POINT: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
  [megaETHTestnet.id]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  [arbitrum.id]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  [megaETH.id]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
};

export const MOCK_PAYMASTER: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
  [megaETHTestnet.id]: ZERO_ADDRESS,
  [arbitrum.id]: ZERO_ADDRESS,
  [megaETH.id]: ZERO_ADDRESS,
};

export const SIMPLE_ACCOUNT_FACTORY: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
  [megaETHTestnet.id]: "0xca98DA1cB523DBff9234145ecA1158110dDd40dC",
  [arbitrum.id]: "0x70c5b7D839f85a1D84c8E77BF0E6104617Da4f34",
  [megaETH.id]: "0x2934fbf21906719B24ba26aE62FA3fBD68a16CB3",
};

export const OPTION_MARKET_VAULT_OWNER: Partial<Record<
  SUPPORTED_CHAINS,
  `0x${string}`
>> = {
  [megaETH.id]: "0xE0D8dF790b2c2522b05b4bF2b6fFF38423DF1B3e",
};

export const OPTION_MARKET_VAULT_KEEPER: Partial<Record<
  SUPPORTED_CHAINS,
  `0x${string}`
>> = {
  [megaETH.id]: "0x0d6D72Bd9F436D24b9b11F21A929C6AAa8075611",
};

export const LIMIT_ORDER_PROTOCOL_MULTICALL: Partial<Record<
  SUPPORTED_CHAINS,
  `0x${string}`
>> = {
  [megaETH.id]: "0xa1B7bCb613F3644d1c369250Cb33D6ee0A19e2cE",
};

export const FEE_REGISTRY: Partial<Record<SUPPORTED_CHAINS, `0x${string}`>> = {
  [megaETH.id]: "0x7767047E9d7591d4F611Cdb36D35e885bDac30be",
};

export const ERC_TOKENS_RESTRICTION_MODULE: Partial<Record<
  SUPPORTED_CHAINS,
  `0x${string}`
>> = {
  [megaETH.id]: "0xa4f0c83Ddc6b86513ab9Fd7115F20498AeD24FC0",
};
