import { convertBigIntFields } from "../utils.js";
import type { Client } from "../../generated/index.js";
import type {
  OptionMarket,
  CollateralPosition,
  OptionPosition,
  HourlyVolume,
} from "../types/index.js";
import {
  serializeOptionMarket,
  serializeCollateralPosition,
  serializeOptionPosition,
  serializeHourlyVolume,
} from "../types/serializers.js";

export interface MarketData {
  market: OptionMarket;
  collateralPositions: CollateralPosition[];
  optionPositions: OptionPosition[];
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
      totalCollateral: true,
      totalCollateralAmount: true,
      protocolFees: true,
      collateralPositions: {
        __args: { where: { optionMarketId: marketId }, limit: 1000 },
        items: {
          id: true,
          totalCollateral: true,
          optionsMinted: true,
          optionsExercised: true,
          settled: true,
          fee: true,
        },
      },
      optionPositions: {
        __args: { where: { optionMarketId: marketId }, limit: 1000 },
        items: {
          id: true,
          address: true,
          premium: true,
          fee: true,
          profit: true,
          amount: true,
          averagePrice: true,
        },
      },
    },
  });

  if (!result.optionMarket) return null;

  const converted = convertBigIntFields({
    market: result.optionMarket,
    collateralPositions: result.optionMarket.collateralPositions?.items || [],
    optionPositions: result.optionMarket.optionPositions?.items || [],
  });

  const marketData = converted as {
    market: any;
    collateralPositions: any[];
    optionPositions: any[];
  };
  return {
    market: serializeOptionMarket(marketData.market),
    collateralPositions: marketData.collateralPositions.map(
      serializeCollateralPosition
    ),
    optionPositions: marketData.optionPositions.map(serializeOptionPosition),
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
        totalCollateral: true,
        totalCollateralAmount: true,
        protocolFees: true,
      },
    },
  });

  const converted = convertBigIntFields(result.optionMarkets.items || []);
  if (!Array.isArray(converted)) {
    throw new Error("Expected array of markets");
  }
  return converted.map((item) => serializeOptionMarket(item));
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
      totalCollateral: true,
      totalCollateralAmount: true,
      protocolFees: true,
    },
  });

  if (!result.optionMarket) return null;
  const converted = convertBigIntFields(result.optionMarket);
  return serializeOptionMarket(converted);
}

export interface MarketPositions {
  collateralPositions: CollateralPosition[];
  optionPositions: OptionPosition[];
}

export async function getMarketPositions(
  client: Client,
  marketId: string
): Promise<MarketPositions> {
  const marketData = await getMarketData(client, marketId);
  if (!marketData) {
    return { collateralPositions: [], optionPositions: [] };
  }

  return {
    collateralPositions: marketData.collateralPositions,
    optionPositions: marketData.optionPositions,
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
          marketId: BigInt(marketId),
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
