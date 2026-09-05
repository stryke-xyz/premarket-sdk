import { hardhat, type Chain, arbitrum, anvil } from "viem/chains";
import { SUPPORTED_CHAINS } from "./chains.js";
import { megaETH, robinhood } from "./chains.js";

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
  42161: arbitrum,
  4326: megaETH,
  4663: robinhood,
};

/** Permit2 deployment addresses used by Stryke integrations per chain. */
export const PERMIT2_ADDRESS: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [hardhat.id]: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
  [megaETH.id]: "0xd1739f41B25869c7457E502Db4E0eaad663535B7",
  [arbitrum.id]: "0xd1739f41B25869c7457E502Db4E0eaad663535B7",
  [robinhood.id]: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
};

/** Wrapped native asset metadata per supported chain. */
export const WETH: Record<SUPPORTED_CHAINS, Token> = {
  [anvil.id]: {
    name: "Wrapped Ether",
    symbol: "WETH",
    address: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
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
    address: "0xfea7870d12cde9d742f0200b087aa2f3266c320b",
    decimals: 18,
  },
  [robinhood.id]: {
    name: "WETH",
    symbol: "WETH",
    address: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
    decimals: 18,
  },
};

/** Canonical USDC metadata on chains where USDC is deployed. */
export const USDC: Partial<Record<SUPPORTED_CHAINS, Token>> = {
  [anvil.id]: {
    name: "USD Coin",
    symbol: "USDC",
    address: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
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
    address: "0x4a425525a8823301c5d8b660517e9402e32ba44f",
    decimals: 6,
  },
};

/** Global Dollar metadata on Robinhood Chain. */
export const USDG: Partial<Record<SUPPORTED_CHAINS, Token>> = {
  [robinhood.id]: {
    name: "Global Dollar",
    symbol: "USDG",
    address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
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
    address: "0xda0e24716328ee0fc99ff834d07ec22c874f936e",
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

/**
 * The stablecoin each chain settles collateral in.
 *
 * This is NOT the same asset everywhere — MegaETH and anvil use USDm, arbitrum
 * uses USDC, and Robinhood Chain uses USDG. Call sites used to reach for
 * `USDM[chainId]` directly, which silently yields `undefined` on any chain that
 * does not have USDm and made the collateral asset a per-file assumption. Read
 * collateral from here instead. Total (not `Partial`) on purpose: a chain with
 * no collateral token cannot host a market, so a missing entry must fail the
 * build rather than surface as `undefined` at runtime.
 */
export const COLLATERAL_TOKEN: Record<SUPPORTED_CHAINS, Token> = {
  [anvil.id]: USDM[anvil.id]!,
  [arbitrum.id]: USDC[arbitrum.id]!,
  [megaETH.id]: USDM[megaETH.id]!,
  [robinhood.id]: USDG[robinhood.id]!,
};

/** OptionMarketVault contract addresses by supported chain. */
export const OPTION_MARKET_VAULT: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [anvil.id]: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  [arbitrum.id]: "0xd07280a68bd53b83b6b25861016bed637b3024ed",
  [megaETH.id]: "0x9341e3e0e4056cc9c299220931c0214bafea907a",
  [robinhood.id]: "0x57DfE841B48De14C0D11cBEeeA63356FA780b977",
};

/** Exchange contract addresses by supported chain. */
export const EXCHANGE: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [anvil.id]: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  [arbitrum.id]: "0x8e25cc9aed1131c54b176ef2f0a3a5593db1554b",
  [megaETH.id]: "0xde4de2de1c9f7a5d527bd09cd50ef6e4d072ce91",
  [robinhood.id]: "0xcEDC3e3672C0fEa688B3AB3FfD416C31552a432f",
};

/**
 * OptionsExchange contract addresses by supported chain.
 *
 * A separate deployment from {@link EXCHANGE}, not a replacement: covered
 * (options) markets settle here, ordinary pair-mint markets keep settling
 * through the Exchange. The two sign under different EIP-712 domains, so an
 * order routed to the wrong one cannot be recovered, let alone filled.
 *
 * The zero address marks a chain where the contract is not deployed yet.
 * {@link getChainConfig} treats those as absent rather than resolving them, so
 * a placeholder cannot masquerade as a live deployment.
 */
export const OPTIONS_EXCHANGE: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [anvil.id]: "0x0000000000000000000000000000000000000000",
  [arbitrum.id]: "0x0000000000000000000000000000000000000000",
  [megaETH.id]: "0x0000000000000000000000000000000000000000",
  [robinhood.id]: "0x0000000000000000000000000000000000000000",
};

/** MarketsRegistry contract addresses on chains where the registry is deployed. */
export const MARKETS_REGISTRY: Partial<
  Record<SUPPORTED_CHAINS, `0x${string}`>
> = {
  [anvil.id]: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  [megaETH.id]: "0x054fd1041ce021218b743abb956be47903533fc9",
  [robinhood.id]: "0x13d10E7bEf522b57c60A0F6D74601ec832DB79fF",
};

/** Configured protocol owner for deployments where the owner is published. */
export const CONFIGURED_OWNER: Partial<
  Record<SUPPORTED_CHAINS, `0x${string}`>
> = {
  [robinhood.id]: "0xE0D8dF790b2c2522b05b4bF2b6fFF38423DF1B3e",
};

/** CommunityMarketManager contract addresses on chains where it is deployed. */
export const COMMUNITY_MARKET_MANAGER: Partial<
  Record<SUPPORTED_CHAINS, `0x${string}`>
> = {
  [megaETH.id]: "0xb350A87e86b637bf79229240bc2AdFB015AdBD67",
};

/** ERC-4337 EntryPoint addresses used by Stryke smart accounts. */
export const ENTRY_POINT: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [anvil.id]: "0x09635F643e140090A9A8Dcd712eD6285858ceBef",
  [arbitrum.id]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  [megaETH.id]: "0xB1c05b498Cb58568B2470369FEB98B00702063dA",
  [robinhood.id]: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
};

/** Simple account factory addresses by supported chain. */
export const SIMPLE_ACCOUNT_FACTORY: Record<SUPPORTED_CHAINS, `0x${string}`> = {
  [anvil.id]: "0xc5a5C42992dECbae36851359345FE25997F5C42d",
  [arbitrum.id]: "0x70c5b7D839f85a1D84c8E77BF0E6104617Da4f34",
  [megaETH.id]: "0x92A00fc48Ad3dD4A8b5266a8F467a52Ac784fC83",
  [robinhood.id]: "0x2C93cF8A7c753EE1D544DA0F2499b986091D6053",
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
  [megaETH.id]: "0x820583d6dAccA0d48F50B9C2B6Ea4d6440250CC2",
  [robinhood.id]: "0xA8E5571B4b6e96b195757399f3c2343611dEeDBd",
};
