import { hardhat, arbitrum } from "viem/chains";
import { calculateOptionTokenId } from "../shared/utils.js";
import { TOKEN1, TOKEN2, USDC } from "./index.js";
import { megaETHTestnet } from "./chains.js";

/**
 * Market type
 */
export type MarketType = "PRE-TGE" | "PRE-IPO";

export type SUPPORTED_CHAINS = 31337 | 6343;

/**
 * Band configuration with strike limits and token IDs
 */
export interface Band {
  strikeLowerLimit: bigint;
  strikeUpperLimit: bigint;
  strikeLowerDisplay: string;
  strikeUpperDisplay: string;
  callTokenId: string;
  putTokenId: string;
}

/**
 * Collateral token configuration
 */
export interface CollateralToken {
  address: `0x${string}`;
  decimals: number;
  symbol: string;
}

/**
 * Market configuration
 */
export interface MarketConfig {
  marketKey: string;
  id: string;
  name: string;
  type: MarketType;
  bands: Band[];
  icon?: string;
  stableTokenDecimals?: number;
  collateralToken: CollateralToken;
}

/**
 * Helper function to format strike value for display
 */
function formatStrikeValue(value: bigint): string {
  const num = Number(value);
  if (num >= 1e9) {
    return `${num / 1e9}B`;
  }
  if (num >= 1e6) {
    return `${num / 1e6}M`;
  }
  if (num >= 1e3) {
    return `${num / 1e3}K`;
  }
  return num.toString();
}

/**
 * Helper function to create a band with calculated token IDs and display values
 */
function createBand(
  marketId: string,
  strikeLowerLimit: bigint,
  strikeUpperLimit: bigint
): Band {
  return {
    strikeLowerLimit,
    strikeUpperLimit,
    strikeLowerDisplay: formatStrikeValue(strikeLowerLimit),
    strikeUpperDisplay: formatStrikeValue(strikeUpperLimit),
    callTokenId: calculateOptionTokenId({
      marketId,
      strikeLowerLimit: strikeLowerLimit.toString(),
      strikeUpperLimit: strikeUpperLimit.toString(),
      isPut: false,
    }),
    putTokenId: calculateOptionTokenId({
      marketId,
      strikeLowerLimit: strikeLowerLimit.toString(),
      strikeUpperLimit: strikeUpperLimit.toString(),
      isPut: true,
    }),
  };
}

/**
 * Market configurations per chain
 */
export const CHAIN_MARKET_CONFIGS: Record<
  SUPPORTED_CHAINS,
  Record<string, MarketConfig>
> = {
  [hardhat.id]: {
    "1": {
      marketKey: "market1",
      id: "1",
      name: "Market 1",
      type: "PRE-TGE",
      bands: [
        createBand("1", 1000000000n, 2000000000n),
        createBand("1", 2000000000n, 5000000000n),
        createBand("1", 5000000000n, 10000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 18,
      collateralToken: {
        address: TOKEN1[hardhat.id].address,
        decimals: TOKEN1[hardhat.id].decimals,
        symbol: TOKEN1[hardhat.id].symbol,
      },
    },
    "2": {
      marketKey: "market2",
      id: "2",
      name: "Market 2",
      type: "PRE-IPO",
      bands: [
        createBand("2", 1000000000n, 2000000000n),
        createBand("2", 2000000000n, 5000000000n),
        createBand("2", 5000000000n, 10000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 6,
      collateralToken: {
        address: TOKEN2[hardhat.id].address,
        decimals: TOKEN2[hardhat.id].decimals,
        symbol: TOKEN2[hardhat.id].symbol,
      },
    },
  },
  [megaETHTestnet.id]: {
    "1": {
      marketKey: "market1",
      id: "1",
      name: "USDAI ICO",
      type: "PRE-TGE",
      bands: [
        createBand("1", 1000000000n, 2000000000n),
        createBand("1", 2000000000n, 5000000000n),
        createBand("1", 5000000000n, 10000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 18,
      collateralToken: {
        address: USDC[megaETHTestnet.id].address,
        decimals: USDC[megaETHTestnet.id].decimals,
        symbol: USDC[megaETHTestnet.id].symbol,
      },
    },
  },
};

/**
 * Get market config by ID for a specific chain
 */
export function getMarketConfig(
  marketId: string,
  chainId: SUPPORTED_CHAINS
): MarketConfig | undefined {
  return CHAIN_MARKET_CONFIGS[chainId]?.[marketId];
}

/**
 * Get all market configs as an array for a specific chain
 */
export function getAllMarketConfigs(chainId: SUPPORTED_CHAINS): MarketConfig[] {
  return Object.values(CHAIN_MARKET_CONFIGS[chainId] || {});
}

/**
 * Get the collateral token for a specific market on a specific chain
 */
export function getMarketCollateralToken(
  marketId: string,
  chainId: SUPPORTED_CHAINS
): CollateralToken | undefined {
  const config = getMarketConfig(marketId, chainId);
  return config?.collateralToken;
}
