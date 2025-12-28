import { convertBigIntFields } from "../utils.js";
import type { Client } from "../../generated/index.js";
import type {
  OrderFillHistory,
  Position,
  UserHistories,
} from "../types/index.js";
import {
  serializePosition,
  serializeUserHistories,
} from "../types/serializers.js";

/**
 * Get user positions for a specific market
 */
export async function getUserPositions(
  client: Client,
  userAddress: string,
  marketId: string
): Promise<Position[]> {
  const result = await client.query({
    user: {
      __args: { id: userAddress.toLowerCase() },
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
            totalCollateralShares: true,
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

  const positions = (result.user?.positions as any)?.items || [];
  const converted = convertBigIntFields(positions);
  if (!Array.isArray(converted)) {
    throw new Error("Expected array of positions");
  }
  return converted.map((item) => serializePosition(item));
}

/**
 * Get all user positions across all markets
 */
export async function getAllUserPositions(
  client: Client,
  userAddress: string
): Promise<Position[]> {
  const result = await client.query({
    user: {
      __args: { id: userAddress.toLowerCase() },
      positions: {
        __args: { limit: 1000 },
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
            totalCollateralShares: true,
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

  const positions = (result.user?.positions as any)?.items || [];
  const converted = convertBigIntFields(positions);
  if (!Array.isArray(converted)) {
    throw new Error("Expected array of positions");
  }
  return converted.map((item) => serializePosition(item));
}

export async function getUserHistories(
  client: Client,
  userAddress: string,
  marketId: string
): Promise<UserHistories> {
  const lowerAddress = userAddress.toLowerCase();
  try {
    // Single query: get all histories for the market, filter by user in where clause where possible
    const result = await client.query({
      depositHistorys: {
        __args: {
          where: { marketId, user: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          user: { id: true },
          amount: true,
          collateralAmount: true,
          fee: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      transferCollateralSharesHistorys: {
        __args: {
          where: {
            marketId,
            OR: [{ user: lowerAddress }, { receiver: lowerAddress }],
          },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          user: { id: true },
          receiver: { id: true },
          amount: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      transferOptionsSharesHistorys: {
        __args: {
          where: {
            marketId,
            OR: [{ user: lowerAddress }, { receiver: lowerAddress }],
          },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          user: { id: true },
          receiver: { id: true },
          amount: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      exerciseHistorys: {
        __args: {
          where: { marketId, user: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          user: { id: true },
          amount: true,
          profitAmount: true,
          fee: true,
          optionTokensBurnt: true,
          sharesUnutilized: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      unwindHistorys: {
        __args: {
          where: { marketId, user: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          user: { id: true },
          amount: true,
          collateralTokensToReturn: true,
          collateralSharesToBurn: true,
          optionSharesToBurn: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      withdrawHistorys: {
        __args: {
          where: {
            marketId,
            receiver: lowerAddress,
          },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          user: { id: true },
          receiver: { id: true },
          sharesBurnt: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      orderFillHistorys: {
        __args: {
          limit: 1000,
          where: {
            marketId,
            OR: [{ maker: lowerAddress }, { taker: lowerAddress }],
          },
        },
        items: {
          marketId: true,
          id: true,
          orderHash: true,
          maker: {
            id: true,
          },
          taker: {
            id: true,
          },
          optionTokenId: true,
          makingAmount: true,
          takingAmount: true,
          price: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
      settlementHistorys: {
        __args: {
          where: { marketId, user: lowerAddress },
          limit: 1000,
        },
        items: {
          id: true,
          optionId: true,
          marketId: true,
          user: { id: true },
          totalCollateralSettled: true,
          transactionHash: true,
          blockNumber: true,
          timestamp: true,
        },
      },
    });

    // Results already filtered by user in query, just extract and process
    const depositHistory = result.depositHistorys?.items || [];
    const allTransferCollateralSharesHistory =
      result.transferCollateralSharesHistorys?.items || [];
    const allTransferOptionsSharesHistory =
      result.transferOptionsSharesHistorys?.items || [];
    const exerciseHistory = result.exerciseHistorys?.items || [];
    const unwindHistory = result.unwindHistorys?.items || [];
    const withdrawHistory = result.withdrawHistorys?.items || [];
    const settlementHistory = result.settlementHistorys?.items || [];

    // Process transfers to determine which side the user is on
    const transferCollateralSharesHistory =
      allTransferCollateralSharesHistory.map((item) => {
        const user = typeof item.user === "object" ? item.user.id : item.user;
        const receiver =
          typeof item.receiver === "object" ? item.receiver.id : item.receiver;
        const userLower = user?.toLowerCase();
        const receiverLower = receiver?.toLowerCase();

        let userSide: "sender" | "receiver" | "both" = "sender";
        if (userLower === lowerAddress && receiverLower === lowerAddress) {
          userSide = "both";
        } else if (receiverLower === lowerAddress) {
          userSide = "receiver";
        }

        return {
          ...item,
          user,
          receiver,
          userSide,
        };
      });

    const transferOptionsSharesHistory = allTransferOptionsSharesHistory.map(
      (item) => {
        const user = typeof item.user === "object" ? item.user.id : item.user;
        const receiver =
          typeof item.receiver === "object" ? item.receiver.id : item.receiver;
        const userLower = user?.toLowerCase();
        const receiverLower = receiver?.toLowerCase();

        let userSide: "sender" | "receiver" | "both" = "sender";
        if (userLower === lowerAddress && receiverLower === lowerAddress) {
          userSide = "both";
        } else if (receiverLower === lowerAddress) {
          userSide = "receiver";
        }

        return {
          ...item,
          user,
          receiver,
          userSide,
        };
      }
    );

    // Process order fills where user is maker or taker
    const allOrderFillHistory = result.orderFillHistorys?.items || [];
    const makerOrderFills: OrderFillHistory[] = [];
    const takerOrderFills: OrderFillHistory[] = [];

    for (const item of allOrderFillHistory) {
      const maker = typeof item.maker === "object" ? item.maker.id : item.maker;
      const taker = typeof item.taker === "object" ? item.taker.id : item.taker;
      const makerLower = maker?.toLowerCase();
      const takerLower = taker?.toLowerCase();

      const processedItem = {
        ...item,
        maker,
        taker,
      };

      // Check if user is maker
      if (makerLower === lowerAddress) {
        makerOrderFills.push({
          id: String(item.id),
          orderHash: item.orderHash as `0x${string}`,
          maker: maker as `0x${string}`,
          taker: taker as `0x${string}`,
          optionTokenId:
            item.optionTokenId != null ? BigInt(item.optionTokenId) : null,
          makingAmount: BigInt(item.makingAmount ?? 0),
          takingAmount: BigInt(item.takingAmount ?? 0),
          price: BigInt(item.price ?? 0),
          transactionHash: item.transactionHash as `0x${string}`,
          blockNumber: BigInt(item.blockNumber ?? 0),
          timestamp: BigInt(item.timestamp ?? 0),
          userSide: "maker" as const,
        });
      }

      // Check if user is taker
      if (takerLower === lowerAddress) {
        takerOrderFills.push({
          id: String(item.id),
          orderHash: item.orderHash as `0x${string}`,
          maker: maker as `0x${string}`,
          taker: taker as `0x${string}`,
          optionTokenId:
            item.optionTokenId != null ? BigInt(item.optionTokenId) : null,
          makingAmount: BigInt(item.makingAmount ?? 0),
          takingAmount: BigInt(item.takingAmount ?? 0),
          price: BigInt(item.price ?? 0),
          transactionHash: item.transactionHash as `0x${string}`,
          blockNumber: BigInt(item.blockNumber ?? 0),
          timestamp: BigInt(item.timestamp ?? 0),
          userSide: "taker" as const,
        });
      }

      // If user is both maker and taker (same address), item is already added to both arrays above
    }

    // Combine for the final result (for serialization)
    const orderFillHistory = [...makerOrderFills, ...takerOrderFills];

    const converted = convertBigIntFields({
      depositHistory: depositHistory.map((item) => ({
        ...item,
        receiver: item.user, // Map user to receiver for DepositHistory type
      })),
      transferDepositHistory: transferCollateralSharesHistory.map((item) => ({
        ...item,
        collateralAmount: item.amount, // Use amount as collateralAmount
        fee: 0n, // Not available in new schema
      })),
      transferCollateralSharesHistory: transferCollateralSharesHistory,
      transferOptionsSharesHistory: transferOptionsSharesHistory,
      purchaseHistory: [], // PurchaseHistory table doesn't exist in new schema
      transferPositionHistory: transferOptionsSharesHistory.map((item) => ({
        ...item,
        purchaser: item.receiver, // Map receiver to purchaser for TransferPositionHistory type
        premiumAmount: 0n, // Not available in new schema
        fee: 0n, // Not available in new schema
        optionShares: item.amount, // Use amount as optionShares
        sharesUtilized: 0n, // Not available in new schema
      })),
      exerciseHistory: exerciseHistory.map((item) => ({
        ...item,
        makerLoss: null, // Not available in new schema
        purchaserProfit: null, // Not available in new schema
      })),
      unwindHistory: unwindHistory,
      withdrawHistory: withdrawHistory,
      settlementHistory: settlementHistory,
      orderFillHistory: orderFillHistory,
    });
    return serializeUserHistories(converted);
  } catch (error) {
    console.error(error);
    return {
      depositHistory: [],
      transferDepositHistory: [],
      transferCollateralSharesHistory: [],
      transferOptionsSharesHistory: [],
      purchaseHistory: [],
      transferPositionHistory: [],
      exerciseHistory: [],
      unwindHistory: [],
      withdrawHistory: [],
      settlementHistory: [],
      orderFillHistory: [],
    };
  }
}
