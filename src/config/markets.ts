import { hardhat, arbitrum } from "viem/chains";
import { calculateOptionTokenId } from "../shared/utils.js";
import { TOKEN1, TOKEN2, USDC } from "./index.js";
import { megaETH, megaETHTestnet } from "./chains.js";
import { SUPPORTED_CHAINS } from "./chains.js";

/**
 * Market type
 */
export type MarketType = "PRE-TGE" | "PRE-IPO";

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
  erc20CallToken: string;
  erc20PutToken: string;
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
  collateralPerBand: number;
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
// PROXY_ADDRESSES moved outside function to avoid accessing megaETH.id during module evaluation
const PROXY_ADDRESSES: Record<number, Record<string, string[]>> = {
  4326: { // megaETH.id = 4326
    "3": ["0x468b1140431855233029b1Ad90Ea9C02B738A401".toLowerCase(), "0x4C32650D6cF5C70e441CF15D7c8b4CCfD6b473aE".toLowerCase(), "0xFdb92c8F5b914B1434517F8a077D3131F1884b2e".toLowerCase(), "0xF01bdc56c513BF288E883f683Fa1F4B7e498DBAD".toLowerCase(),"0x8627D53051948296a2Bc44C127499f19520A229A".toLowerCase(),"0xb4c3Aa021c167ddcc2e8061d47ceE5EA88577cB1".toLowerCase()],
  },
};

function createBand(
  bandIndex: number,
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
    erc20CallToken: PROXY_ADDRESSES[megaETH.id]?.[marketId]?.[bandIndex] as `0x${string}` || "0x0000000000000000000000000000000000000000" as `0x${string}`,
    erc20PutToken: PROXY_ADDRESSES[megaETH.id]?.[marketId]?.[bandIndex + 1] as `0x${string}` || "0x0000000000000000000000000000000000000000" as `0x${string}`,
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
        createBand(0,"1", 1000000000n, 2000000000n),
        createBand(1,"1", 2000000000n, 5000000000n),
        createBand(2,"1", 5000000000n, 10000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 18,
      collateralToken: {
        address: TOKEN1[hardhat.id].address,
        decimals: TOKEN1[hardhat.id].decimals,
        symbol: TOKEN1[hardhat.id].symbol,
      },
      collateralPerBand: 100,
    },
    "2": {
      marketKey: "market2",
      id: "2",
      name: "Market 2",
      type: "PRE-IPO",
      bands: [
        createBand(0,"2", 1000000000n, 2000000000n),
        createBand(1,"2", 2000000000n, 5000000000n),
        createBand(2,"2", 5000000000n, 10000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 6,
      collateralToken: {
        address: TOKEN2[hardhat.id].address,
        decimals: TOKEN2[hardhat.id].decimals,
        symbol: TOKEN2[hardhat.id].symbol,
      },
      collateralPerBand: 100,
    },
  },
  [megaETHTestnet.id]: {
    "1": {
      marketKey: "market1",
      id: "1",
      name: "USDAI ICO",
      type: "PRE-TGE",
      bands: [
        createBand(0,"1", 1000000000n, 2000000000n),
        createBand(1,"1", 2000000000n, 5000000000n),
        createBand(2,"1", 5000000000n, 10000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 6,
      collateralToken: {
        address: USDC[megaETHTestnet.id].address,
        decimals: USDC[megaETHTestnet.id].decimals,
        symbol: USDC[megaETHTestnet.id].symbol,
      },
      collateralPerBand: 100,
    },
  },
  [arbitrum.id]: {
    "1": {
      marketKey: "market1",
      id: "1",
      name: "USDAI ICO",
      type: "PRE-TGE",
      bands: [
        createBand(0,"1", 1000000000n, 2000000000n),
        createBand(1,"1", 2000000000n, 5000000000n),
        createBand(2,"1", 5000000000n, 10000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 6,
      collateralToken: {
        address: USDC[arbitrum.id].address,
        decimals: USDC[arbitrum.id].decimals,
        symbol: USDC[arbitrum.id].symbol,
      },
      collateralPerBand: 100,
    },
    "2": {
      marketKey: "market1",
      id: "2",
      name: "GAIB ICO",
      type: "PRE-TGE",
      bands: [
        createBand(0,"2", 2000000000n, 3000000000n),
        createBand(1,"2", 3000000000n, 4000000000n),
        createBand(2,"2", 4000000000n, 50000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 6,
      collateralToken: {
        address: USDC[arbitrum.id].address,
        decimals: USDC[arbitrum.id].decimals,
        symbol: USDC[arbitrum.id].symbol,
      },
      collateralPerBand: 100,
    },
  },
  [megaETH.id]: {
    "1": {
      marketKey: "market1",
      id: "1",
      name: "USDAI ICO",
      type: "PRE-TGE",
      bands: [
        createBand(0,"1", 1000000000n, 2000000000n),
        createBand(1,"1", 2000000000n, 5000000000n),
        createBand(2,"1", 5000000000n, 10000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 6,
      collateralToken: {
        address: USDC[megaETH.id].address,
        decimals: USDC[megaETH.id].decimals,
        symbol: USDC[megaETH.id].symbol,
      },
      collateralPerBand: 100,
    },
    "2": {
      marketKey: "market1",
      id: "2",
      name: "GAIB ICO",
      type: "PRE-TGE",
      bands: [
        createBand(0,"2", 2000000000n, 3000000000n),
        createBand(1,"2", 3000000000n, 4000000000n),
        createBand(2,"2", 4000000000n, 50000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 6,
      collateralToken: {
        address: USDC[megaETH.id].address,
        decimals: USDC[megaETH.id].decimals,
        symbol: USDC[megaETH.id].symbol,
      },
      collateralPerBand: 100,
    },
    "3": {
      marketKey: "market1",
      id: "3",
      name: "BITCONNECT ICO",
      type: "PRE-TGE",
      bands: [
        createBand(0,"3", 2000000000n, 3000000000n),
        createBand(1,"3", 3000000000n, 4000000000n),
        createBand(2,"3", 4000000000n, 5000000000n),
      ],
      icon: "/images/usdai-icon.png",
      stableTokenDecimals: 6,
      collateralToken: {
        address: USDC[megaETH.id].address,
        decimals: USDC[megaETH.id].decimals,
        symbol: USDC[megaETH.id].symbol,
      },
      collateralPerBand: 10,
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
