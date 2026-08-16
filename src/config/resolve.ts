/**
 * Single entry point for "give me everything configured for chain X".
 *
 * Every consumer (frontend, orderbook, order-queue, sponsorship, fill-sender)
 * previously reached into the individual address maps and indexed them with a
 * chain id — or worse, with a hardcoded `megaETH.id` while *claiming* to be
 * chain-agnostic. That made a misconfigured deployment silently resolve the
 * wrong chain's contracts. Resolve once, here, and fail loudly instead.
 *
 * Deliberately env-agnostic: the SDK is consumed by Vite (`import.meta.env`)
 * and Bun/Node (`process.env`) alike, so each consumer reads its own env and
 * passes the id in.
 */
import type { Chain } from "viem";
import {
  CHAIN_ID_TO_CHAIN,
  COLLATERAL_TOKEN,
  COMMUNITY_MARKET_MANAGER,
  ENTRY_POINT,
  ERC_TOKENS_RESTRICTION_MODULE,
  EXCHANGE,
  FEE_REGISTRY,
  MARKETS_REGISTRY,
  OPTION_MARKET_VAULT,
  PERMIT2_ADDRESS,
  SIMPLE_ACCOUNT_FACTORY,
  WETH,
  type Token,
} from "./index.js";
import {
  isSupportedChain,
  SUPPORTED_CHAIN_IDS,
  type SUPPORTED_CHAINS,
} from "./chains.js";

/** Addresses that must exist for a chain to serve markets at all. */
export interface RequiredContracts {
  exchange: `0x${string}`;
  optionMarketVault: `0x${string}`;
  entryPoint: `0x${string}`;
  simpleAccountFactory: `0x${string}`;
  permit2: `0x${string}`;
}

/** Addresses that legitimately vary by deployment maturity. */
export interface OptionalContracts {
  marketsRegistry?: `0x${string}`;
  feeRegistry?: `0x${string}`;
  communityMarketManager?: `0x${string}`;
  ercTokensRestrictionModule?: `0x${string}`;
}

export interface ChainConfig {
  chainId: SUPPORTED_CHAINS;
  chain: Chain;
  /** The stablecoin this chain settles collateral in. Varies per chain. */
  collateral: Token;
  weth: Token;
  contracts: RequiredContracts & OptionalContracts;
}

export class UnsupportedChainError extends Error {
  constructor(chainId: number) {
    super(
      `Chain ${chainId} is not configured in the SDK. ` +
        `Supported chains: ${SUPPORTED_CHAIN_IDS.join(", ")}.`,
    );
    this.name = "UnsupportedChainError";
  }
}

export class MissingChainAddressError extends Error {
  constructor(chainId: number, missing: string[]) {
    super(
      `Chain ${chainId} is missing required contract address(es): ` +
        `${missing.join(", ")}. Add them to the SDK config before deploying ` +
        `against this chain.`,
    );
    this.name = "MissingChainAddressError";
  }
}

/**
 * Resolve the full configuration bundle for a chain.
 *
 * Throws on an unsupported chain id, and on a supported chain that is missing a
 * required address. Both are deployment misconfigurations that are far cheaper
 * to catch at boot than to debug as a wrong-contract transaction in production.
 */
export function getChainConfig(chainId: number): ChainConfig {
  if (!isSupportedChain(chainId)) throw new UnsupportedChainError(chainId);

  const contracts: RequiredContracts & OptionalContracts = {
    exchange: EXCHANGE[chainId],
    optionMarketVault: OPTION_MARKET_VAULT[chainId],
    entryPoint: ENTRY_POINT[chainId],
    simpleAccountFactory: SIMPLE_ACCOUNT_FACTORY[chainId],
    permit2: PERMIT2_ADDRESS[chainId],
    marketsRegistry: MARKETS_REGISTRY[chainId],
    feeRegistry: FEE_REGISTRY[chainId],
    communityMarketManager: COMMUNITY_MARKET_MANAGER[chainId],
    ercTokensRestrictionModule: ERC_TOKENS_RESTRICTION_MODULE[chainId],
  };

  // An address map can carry a key whose value is "" or undefined; treat both as
  // absent so a placeholder entry cannot masquerade as a real deployment.
  const missing = (
    [
      "exchange",
      "optionMarketVault",
      "entryPoint",
      "simpleAccountFactory",
      "permit2",
    ] as const
  ).filter((k) => {
    const v = contracts[k];
    return !v || v === "0x" || /^0x0{40}$/i.test(v);
  });
  if (missing.length > 0) throw new MissingChainAddressError(chainId, missing);

  const chain = CHAIN_ID_TO_CHAIN[chainId];
  if (!chain) throw new UnsupportedChainError(chainId);

  return {
    chainId,
    chain,
    collateral: COLLATERAL_TOKEN[chainId],
    weth: WETH[chainId],
    contracts,
  };
}

/**
 * Non-throwing form, for call sites that want to render a "chain not supported"
 * state rather than crash (e.g. a wallet connected to the wrong network).
 */
export function tryGetChainConfig(chainId: number): ChainConfig | null {
  try {
    return getChainConfig(chainId);
  } catch {
    return null;
  }
}
