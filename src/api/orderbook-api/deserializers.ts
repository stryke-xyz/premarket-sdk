import type {
  MarketStrategy,
  OptionMarket,
  OptionParams,
  Position,
  UserHistories,
} from "../../shared/types.js";

export function deserializeMarketStrategy(data: any): MarketStrategy {
  return {
    id: String(data.id),
    finalFDV: BigInt(data.finalFDV ?? "0"),
    deadline: BigInt(data.deadline ?? "0"),
    bandPrecision: BigInt(data.bandPrecision ?? "0"),
    collateralPerBandPrecision: BigInt(data.collateralPerBandPrecision ?? "0"),
    premiumRate: BigInt(data.premiumRate ?? "0"),
    depositFeeRate: BigInt(data.depositFeeRate ?? "0"),
    purchaseFeeRate: BigInt(data.purchaseFeeRate ?? "0"),
    settlementFeeRate: BigInt(data.settlementFeeRate ?? "0"),
    collateralToken: data.collateralToken as `0x${string}`,
  };
}

export function deserializeOptionMarket(data: any): OptionMarket {
  return {
    id: String(data.id),
    callToken: data.callToken as `0x${string}`,
    putToken: data.putToken as `0x${string}`,
    expiry: BigInt(data.expiry ?? "0"),
    maxTTL: BigInt(data.maxTTL ?? "0"),
    strategy: data.strategy
      ? deserializeMarketStrategy(data.strategy)
      : ({} as MarketStrategy),
    collateralToken: data.collateralToken as `0x${string}`,
    totalCollateral: BigInt(data.totalCollateral ?? "0"),
    totalCollateralAmount: BigInt(data.totalCollateralAmount ?? "0"),
    protocolFees: BigInt(data.protocolFees ?? "0"),
  };
}

export function deserializeOptionParams(data: any): OptionParams {
  return {
    id: String(data.id),
    marketId: BigInt(data.marketId ?? "0"),
    strikeLowerLimit: BigInt(data.strikeLowerLimit ?? "0"),
    strikeUpperLimit: BigInt(data.strikeUpperLimit ?? "0"),
    isPut: Boolean(data.isPut),
    collateralPerShare:
      data.collateralPerShare != null
        ? BigInt(data.collateralPerShare)
        : undefined,
  };
}

export function deserializePosition(data: any): Position {
  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    optionMarketId: String(data.optionMarketId ?? ""),
    userId: String(data.userId),
    collateralShares: BigInt(data.collateralShares ?? "0"),
    optionsShares: BigInt(data.optionsShares ?? "0"),
    premiumEarned: BigInt(data.premiumEarned ?? "0"),
    fee: BigInt(data.fee ?? "0"),
    settled: Boolean(data.settled),
    updatedAt: BigInt(data.updatedAt ?? "0"),
    updatedAtBlock: BigInt(data.updatedAtBlock ?? "0"),
    profit: BigInt(data.profit ?? "0"),
    averagePrice: BigInt(data.averagePrice ?? "0"),
    optionsSharesExercised: BigInt(data.optionsSharesExercised ?? "0"),
    premiumPaid: BigInt(data.premiumPaid ?? "0"),
    optionMarket: data.optionMarket
      ? deserializeOptionMarket(data.optionMarket)
      : undefined,
    optionParams: data.optionParams
      ? deserializeOptionParams(data.optionParams)
      : undefined,
  };
}

export function deserializeUserHistories(data: any): UserHistories {
  const deserializeHistoryItem = (item: any, fields: string[]) => {
    const result: any = { ...item };
    for (const field of fields) {
      if (result[field] != null) {
        if (typeof result[field] === "string") {
          result[field] = BigInt(result[field]);
        } else if (result[field] === null) {
          result[field] = null;
        }
      }
    }
    return result;
  };

  const bigintFields = [
    "amount",
    "collateralAmount",
    "fee",
    "timestamp",
    "blockNumber",
    "marketId",
    "profitAmount",
    "optionTokensBurnt",
    "sharesUnutilized",
    "makerLoss",
    "purchaserProfit",
    "collateralTokensToReturn",
    "collateralSharesToBurn",
    "optionSharesToBurn",
    "sharesBurnt",
    "totalCollateralSettled",
    "optionMarketId",
    "premiumAmount",
    "optionShares",
    "sharesUtilized",
    "makingAmount",
    "takingAmount",
    "price",
    "optionTokenId",
  ];

  return {
    depositHistory: (data.depositHistory || []).map((item: any) =>
      deserializeHistoryItem(item, bigintFields)
    ),
    transferDepositHistory: (data.transferDepositHistory || []).map(
      (item: any) => deserializeHistoryItem(item, bigintFields)
    ),
    transferCollateralSharesHistory: (
      data.transferCollateralSharesHistory || []
    ).map((item: any) => deserializeHistoryItem(item, bigintFields)),
    transferOptionsSharesHistory: (data.transferOptionsSharesHistory || []).map(
      (item: any) => deserializeHistoryItem(item, bigintFields)
    ),
    purchaseHistory: (data.purchaseHistory || []).map((item: any) =>
      deserializeHistoryItem(item, bigintFields)
    ),
    transferPositionHistory: (data.transferPositionHistory || []).map(
      (item: any) => deserializeHistoryItem(item, bigintFields)
    ),
    exerciseHistory: (data.exerciseHistory || []).map((item: any) =>
      deserializeHistoryItem(item, bigintFields)
    ),
    unwindHistory: (data.unwindHistory || []).map((item: any) =>
      deserializeHistoryItem(item, bigintFields)
    ),
    withdrawHistory: (data.withdrawHistory || []).map((item: any) =>
      deserializeHistoryItem(item, bigintFields)
    ),
    settlementHistory: (data.settlementHistory || []).map((item: any) =>
      deserializeHistoryItem(item, bigintFields)
    ),
    orderFillHistory: (data.orderFillHistory || []).map((item: any) => {
      const result = deserializeHistoryItem(item, bigintFields);
      if (
        result.optionTokenId != null &&
        typeof result.optionTokenId === "string"
      ) {
        result.optionTokenId = BigInt(result.optionTokenId);
      }
      return result;
    }),
  };
}
