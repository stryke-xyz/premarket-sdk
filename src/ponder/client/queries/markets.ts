import { convertBigIntFields } from "../utils.js";
import type { Client } from "../../generated/index.js";
import type { OptionMarket, Position, HourlyVolume } from "../types/index.js";
import {
  serializeOptionMarket,
  serializePosition,
  serializeHourlyVolume,
  serializeOptionParams,
} from "../types/serializers.js";

export interface MarketData {
  market: OptionMarket;
  positions: Position[];
}

export async function getMarketData(
  client: Client,
  marketId: string
): Promise<MarketData | null> {
  const result = await client.query({
    optionMarket: {
      __args: { id: marketId },
      id: true,
      callToken: true,
      putToken: true,
      expiry: true,
      maxTTL: true,
      strategy: {
        id: true,
        finalFDV: true,
        deadline: true,
        bandPrecision: true,
        collateralPerBandPrecision: true,
        premiumRate: true,
        depositFeeRate: true,
        purchaseFeeRate: true,
        settlementFeeRate: true,
        collateralToken: true,
      },
      collateralToken: true,
      totalCollateralShares: true,
      totalCollateralAmount: true,
      protocolFees: true,
      positions: {
        __args: { where: { optionMarketId: marketId }, limit: 1000 },
        items: {
          id: true,
          optionId: true,
          optionMarketId: true,
          user: {
            id: true,
          },
          collateralShares: true,
          optionsShares: true,
          optionsSharesExercised: true,
          premiumEarned: true,
          fee: true,
          settled: true,
          updatedAt: true,
          updatedAtBlock: true,
          profit: true,
          averagePrice: true,
          premiumPaid: true,
          optionParams: {
            id: true,
            marketId: true,
            strikeLowerLimit: true,
            strikeUpperLimit: true,
            isPut: true,
            collateralPerShare: true,
          },
        },
      },
    },
  });

  if (!result.optionMarket) return null;

  const converted = convertBigIntFields({
    market: result.optionMarket,
    positions: result.optionMarket.positions?.items || [],
  });

  const marketData = converted as {
    market: any;
    positions: any[];
  };

  // Serialize all positions
  const positions: Position[] = marketData.positions.map((item: any) => {
    const pos = serializePosition(item);
    return {
      ...pos,
      optionMarket: {
        ...marketData.market,
        totalCollateral: BigInt(marketData.market.totalCollateralShares ?? 0),
      },
    };
  });

  return {
    market: serializeOptionMarket({
      ...marketData.market,
      totalCollateral: marketData.market.totalCollateralShares,
    }),
    positions,
  };
}

export async function getMarkets(client: Client): Promise<OptionMarket[]> {
  const result = await client.query({
    optionMarkets: {
      __args: {},
      items: {
        id: true,
        callToken: true,
        putToken: true,
        expiry: true,
        maxTTL: true,
        strategy: {
          id: true,
          finalFDV: true,
          deadline: true,
          bandPrecision: true,
          collateralPerBandPrecision: true,
          premiumRate: true,
          depositFeeRate: true,
          purchaseFeeRate: true,
          settlementFeeRate: true,
          collateralToken: true,
        },
        collateralToken: true,
        totalCollateralShares: true,
        totalCollateralAmount: true,
        protocolFees: true,
      },
    },
  });

  const converted = convertBigIntFields(result.optionMarkets.items || []);
  if (!Array.isArray(converted)) {
    throw new Error("Expected array of markets");
  }
  return converted.map((item: any) =>
    serializeOptionMarket({
      ...item,
      totalCollateral: item.totalCollateralShares,
    })
  );
}

export async function getMarket(
  client: Client,
  marketId: string
): Promise<OptionMarket | null> {
  const result = await client.query({
    optionMarket: {
      __args: { id: marketId },
      id: true,
      callToken: true,
      putToken: true,
      expiry: true,
      maxTTL: true,
      strategy: {
        id: true,
        finalFDV: true,
        deadline: true,
        bandPrecision: true,
        collateralPerBandPrecision: true,
        premiumRate: true,
        depositFeeRate: true,
        purchaseFeeRate: true,
        settlementFeeRate: true,
        collateralToken: true,
      },
      collateralToken: true,
      totalCollateralShares: true,
      totalCollateralAmount: true,
      protocolFees: true,
    },
  });

  if (!result.optionMarket) return null;
  const converted = convertBigIntFields(result.optionMarket);
  return serializeOptionMarket({
    ...converted,
    totalCollateral: (converted as any).totalCollateralShares,
  });
}

export interface MarketPositions {
  positions: Position[];
}

export async function getMarketPositions(
  client: Client,
  marketId: string
): Promise<MarketPositions> {
  const marketData = await getMarketData(client, marketId);
  if (!marketData) {
    return { positions: [] };
  }

  return {
    positions: marketData.positions,
  };
}

/**
 * Get hourly volume data for a market within a time range
 * @param marketId - The market ID
 * @param startTimestamp - Start of the time range (unix timestamp)
 * @param endTimestamp - End of the time range (unix timestamp)
 */
export async function getHourlyVolumes(
  client: Client,
  marketId: string,
  startTimestamp: bigint,
  endTimestamp: bigint
): Promise<HourlyVolume[]> {
  const result = await client.query({
    hourlyVolumes: {
      __args: {
        where: {
          marketId: marketId,
          hourTimestamp_gte: startTimestamp,
          hourTimestamp_lte: endTimestamp,
        },
        limit: 1000,
      },
      items: {
        id: true,
        marketId: true,
        optionId: true,
        hourTimestamp: true,
        depositVolume: true,
        tradeVolume: true,
        unwindVolume: true,
        withdrawVolume: true,
        exerciseVolume: true,
        totalVolume: true,
        tradeCount: true,
      },
    },
  });

  const converted = convertBigIntFields(result.hourlyVolumes?.items || []);
  if (!Array.isArray(converted)) {
    throw new Error("Expected array of hourly volumes");
  }
  return converted.map((item) => serializeHourlyVolume(item));
}

/**
 * Get 24h volume for a specific band (optionId)
 */
export async function get24hVolume(
  client: Client,
  marketId: string,
  optionId: string
): Promise<{ totalVolume: bigint; tradeVolume: bigint; tradeCount: number }> {
  const now = BigInt(Math.floor(Date.now() / 1000));
  const twentyFourHoursAgo = now - 86400n;

  const volumes = await getHourlyVolumes(
    client,
    marketId,
    twentyFourHoursAgo,
    now
  );

  // Filter by optionId and sum
  const bandVolumes = volumes.filter((v) => v.optionId === optionId);

  let totalVolume = 0n;
  let tradeVolume = 0n;
  let tradeCount = 0;

  for (const v of bandVolumes) {
    totalVolume += v.totalVolume;
    tradeVolume += v.tradeVolume;
    tradeCount += v.tradeCount;
  }

  return { totalVolume, tradeVolume, tradeCount };
}
