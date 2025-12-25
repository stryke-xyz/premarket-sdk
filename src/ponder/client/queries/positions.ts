import { convertBigIntFields } from "../utils.js";
import type { Client } from "../../generated/index.js";
import type {
  CollateralPosition,
  OptionPosition,
  UserHistories,
} from "../types/index.js";
import {
  serializeCollateralPosition,
  serializeOptionPosition,
  serializeUserHistories,
} from "../types/serializers.js";

export async function getUserCollateralPositions(
  client: Client,
  userAddress: string,
  marketId: string
): Promise<CollateralPosition[]> {
  const result = await client.query({
    user: {
      __args: { id: userAddress.toLowerCase() },
      collateralPositions: {
        __args: { where: { optionMarketId: marketId }, limit: 1000 },
        items: {
          id: true,
          optionId: true,
          optionMarketId: true,
          totalCollateral: true,
          optionsMinted: true,
          optionsExercised: true,
          premiumEarned: true,
          fee: true,
          settled: true,
          updatedAt: true,
          updatedAtBlock: true,
          optionMarket: {
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

  const positions = result.user?.collateralPositions?.items || [];
  const converted = convertBigIntFields(positions);
  if (!Array.isArray(converted)) {
    throw new Error("Expected array of positions");
  }
  return converted.map((item) => serializeCollateralPosition(item));
}

export async function getUserOptionPositions(
  client: Client,
  userAddress: string,
  marketId: string
): Promise<OptionPosition[]> {
  const result = await client.query({
    user: {
      __args: { id: userAddress.toLowerCase() },
      optionsPositions: {
        __args: { where: { optionMarketId: marketId }, limit: 1000 },
        items: {
          id: true,
          tokenId: true,
          address: true,
          optionId: true,
          optionMarketId: true,
          premium: true,
          fee: true,
          profit: true,
          amount: true,
          averagePrice: true,
          updatedAt: true,
          updatedAtBlock: true,
          optionMarket: {
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

  const positions = result.user?.optionsPositions?.items || [];
  const converted = convertBigIntFields(positions);
  if (!Array.isArray(converted)) {
    throw new Error("Expected array of positions");
  }
  return converted.map((item) => serializeOptionPosition(item));
}

/**
 * Get all user option positions across all markets
 */
export async function getAllUserOptionPositions(
  client: Client,
  userAddress: string
): Promise<OptionPosition[]> {
  const result = await client.query({
    user: {
      __args: { id: userAddress.toLowerCase() },
      optionsPositions: {
        __args: { limit: 1000 },
        items: {
          id: true,
          tokenId: true,
          address: true,
          optionId: true,
          optionMarketId: true,
          premium: true,
          fee: true,
          profit: true,
          amount: true,
          averagePrice: true,
          updatedAt: true,
          updatedAtBlock: true,
          optionMarket: {
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

  const positions = result.user?.optionsPositions?.items || [];
  const converted = convertBigIntFields(positions);
  if (!Array.isArray(converted)) {
    throw new Error("Expected array of positions");
  }
  return converted.map((item) => serializeOptionPosition(item));
}

/**
 * Get all user collateral positions across all markets
 */
export async function getAllUserCollateralPositions(
  client: Client,
  userAddress: string
): Promise<CollateralPosition[]> {
  const result = await client.query({
    user: {
      __args: { id: userAddress.toLowerCase() },
      collateralPositions: {
        __args: { limit: 1000 },
        items: {
          id: true,
          optionId: true,
          optionMarketId: true,
          totalCollateral: true,
          optionsMinted: true,
          optionsExercised: true,
          premiumEarned: true,
          fee: true,
          settled: true,
          updatedAt: true,
          updatedAtBlock: true,
          optionMarket: {
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

  const positions = result.user?.collateralPositions?.items || [];
  const converted = convertBigIntFields(positions);
  if (!Array.isArray(converted)) {
    throw new Error("Expected array of positions");
  }
  return converted.map((item) => serializeCollateralPosition(item));
}

export async function getUserHistories(
  client: Client,
  userAddress: string,
  marketId: string
): Promise<UserHistories> {
  const lowerAddress = userAddress.toLowerCase();
  try {
    const result = await client.query({
      depositHistorys: {
        __args: {
          where: { marketId: marketId, receiver: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          receiver: true,
          amount: true,
          collateralAmount: true,
          fee: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      transferDepositHistorys: {
        __args: {
          where: { marketId: marketId, receiver: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          amount: true,
          collateralAmount: true,
          fee: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      purchaseHistorys: {
        __args: {
          where: { marketId: marketId, purchaser: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          purchaser: true,
          amount: true,
          premiumAmount: true,
          fee: true,
          optionShares: true,
          sharesUtilized: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      transferPositionHistorys: {
        __args: {
          where: { marketId: marketId, purchaser: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          purchaser: true,
          amount: true,
          premiumAmount: true,
          fee: true,
          optionShares: true,
          sharesUtilized: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      exerciseHistorys: {
        __args: {
          where: { marketId: marketId, exerciser: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          exerciser: true,
          amount: true,
          profitAmount: true,
          fee: true,
          optionTokensBurnt: true,
          sharesUnutilized: true,
          makerLoss: true,
          purchaserProfit: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      unwindHistorys: {
        __args: {
          where: { marketId: marketId, receiver: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          amount: true,
          collateralTokensToReturn: true,
          collateralSharesToBurn: true,
          optionSharesToBurn: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      settlementHistorys: {
        __args: {
          where: { marketId: marketId, user: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          totalCollateralSettled: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
    });

    const converted = convertBigIntFields({
      depositHistory: result.depositHistorys?.items || [],
      transferDepositHistory: result.transferDepositHistorys?.items || [],
      purchaseHistory: result.purchaseHistorys?.items || [],
      transferPositionHistory: result.transferPositionHistorys?.items || [],
      exerciseHistory: result.exerciseHistorys?.items || [],
      unwindHistory: result.unwindHistorys?.items || [],
      settlementHistory: result.settlementHistorys?.items || [],
    });
    return serializeUserHistories(converted);
  } catch (error) {
    console.error(error);
    return {
      depositHistory: [],
      transferDepositHistory: [],
      purchaseHistory: [],
      transferPositionHistory: [],
      exerciseHistory: [],
      unwindHistory: [],
      settlementHistory: [],
    };
  }
}
