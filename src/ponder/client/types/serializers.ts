import type {
  MarketStrategy,
  OptionMarket,
  OptionParams,
  HourlyVolume,
  Position,
  DepositHistory,
  TransferDepositHistory,
  TransferCollateralSharesHistory,
  TransferOptionsSharesHistory,
  PurchaseHistory,
  TransferPositionHistory,
  ExerciseHistory,
  UnwindHistory,
  WithdrawHistory,
  SettlementHistory,
  OrderFillHistory,
  UserHistories,
} from "./index.js";

/**
 * Serialize raw GraphQL query result into MarketStrategy type
 */
export function serializeMarketStrategy(data: any): MarketStrategy {
  return {
    id: String(data.id),
    finalFDV: BigInt(data.finalFDV ?? 0),
    deadline: BigInt(data.deadline ?? 0),
    bandPrecision: BigInt(data.bandPrecision ?? 0),
    collateralPerBandPrecision: BigInt(data.collateralPerBandPrecision ?? 0),
    premiumRate: BigInt(data.premiumRate ?? 0),
    depositFeeRate: BigInt(data.depositFeeRate ?? 0),
    purchaseFeeRate: BigInt(data.purchaseFeeRate ?? 0),
    settlementFeeRate: BigInt(data.settlementFeeRate ?? 0),
    collateralToken: data.collateralToken as `0x${string}`,
  };
}

/**
 * Serialize raw GraphQL query result into OptionParams type
 */
export function serializeOptionParams(data: any): OptionParams {
  return {
    id: String(data.id),
    marketId: BigInt(data.marketId ?? 0),
    strikeLowerLimit: BigInt(data.strikeLowerLimit ?? 0),
    strikeUpperLimit: BigInt(data.strikeUpperLimit ?? 0),
    isPut: Boolean(data.isPut),
    collateralPerShare:
      data.collateralPerShare != null
        ? BigInt(data.collateralPerShare)
        : undefined,
  };
}

/**
 * Serialize raw GraphQL query result into OptionMarket type
 */
export function serializeOptionMarket(data: any): OptionMarket {
  return {
    id: String(data.id),
    callToken: data.callToken as `0x${string}`,
    putToken: data.putToken as `0x${string}`,
    expiry: BigInt(data.expiry ?? 0),
    maxTTL: BigInt(data.maxTTL ?? 0),
    strategy: serializeMarketStrategy(data.strategy),
    collateralToken: data.collateralToken as `0x${string}`,
    totalCollateral: BigInt(data.totalCollateral ?? 0),
    totalCollateralAmount: BigInt(data.totalCollateralAmount ?? 0),
    protocolFees: BigInt(data.protocolFees ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into HourlyVolume type
 */
export function serializeHourlyVolume(data: any): HourlyVolume {
  return {
    id: String(data.id),
    marketId: BigInt(data.marketId ?? 0),
    optionId: String(data.optionId ?? ""),
    hourTimestamp: BigInt(data.hourTimestamp ?? 0),
    depositVolume: BigInt(data.depositVolume ?? 0),
    tradeVolume: BigInt(data.tradeVolume ?? 0),
    unwindVolume: BigInt(data.unwindVolume ?? 0),
    withdrawVolume: BigInt(data.withdrawVolume ?? 0),
    exerciseVolume: BigInt(data.exerciseVolume ?? 0),
    totalVolume: BigInt(data.totalVolume ?? 0),
    tradeCount: Number(data.tradeCount ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into Position type
 */
export function serializePosition(data: any): Position {
  // Extract userId from user relation (user.id) or fallback to direct userId/user field
  const userId =
    data.userId ??
    (typeof data.user === "object" && data.user?.id
      ? data.user.id
      : data.user) ??
    "";

  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    optionMarketId: String(data.optionMarketId ?? ""),
    userId: String(userId),
    collateralShares: BigInt(data.collateralShares ?? 0),
    optionsShares: BigInt(data.optionsShares ?? 0),
    premiumEarned: BigInt(data.premiumEarned ?? 0),
    fee: BigInt(data.fee ?? 0),
    settled: Boolean(data.settled),
    updatedAt: BigInt(data.updatedAt ?? 0),
    updatedAtBlock: BigInt(data.updatedAtBlock ?? 0),
    profit: BigInt(data.profit ?? 0),
    averagePrice: BigInt(data.averagePrice ?? 0),
    optionsSharesExercised: BigInt(data.optionsSharesExercised ?? 0),
    premiumPaid: BigInt(data.premiumPaid ?? 0),
    optionMarket: data.optionMarket
      ? serializeOptionMarket(data.optionMarket)
      : undefined,
    optionParams: data.optionParams
      ? serializeOptionParams(data.optionParams)
      : undefined,
  };
}

/**
 * Serialize raw GraphQL query result into DepositHistory type
 */
export function serializeDepositHistory(data: any): DepositHistory {
  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    marketId: BigInt(data.marketId ?? 0),
    receiver: data.receiver as `0x${string}`,
    amount: BigInt(data.amount ?? 0),
    collateralAmount: BigInt(data.collateralAmount ?? 0),
    fee: BigInt(data.fee ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into TransferDepositHistory type
 */
export function serializeTransferDepositHistory(
  data: any
): TransferDepositHistory {
  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    marketId: BigInt(data.marketId ?? 0),
    amount: BigInt(data.amount ?? 0),
    collateralAmount: BigInt(data.collateralAmount ?? 0),
    fee: BigInt(data.fee ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into PurchaseHistory type
 */
export function serializePurchaseHistory(data: any): PurchaseHistory {
  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    purchaser: data.purchaser as `0x${string}`,
    amount: BigInt(data.amount ?? 0),
    premiumAmount: BigInt(data.premiumAmount ?? 0),
    fee: BigInt(data.fee ?? 0),
    optionShares: BigInt(data.optionShares ?? 0),
    sharesUtilized: BigInt(data.sharesUtilized ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into TransferPositionHistory type
 */
export function serializeTransferPositionHistory(
  data: any
): TransferPositionHistory {
  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    purchaser: data.purchaser as `0x${string}`,
    amount: BigInt(data.amount ?? 0),
    premiumAmount: BigInt(data.premiumAmount ?? 0),
    fee: BigInt(data.fee ?? 0),
    optionShares: BigInt(data.optionShares ?? 0),
    sharesUtilized: BigInt(data.sharesUtilized ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into ExerciseHistory type
 */
export function serializeExerciseHistory(data: any): ExerciseHistory {
  // Extract exerciser from user field (user is the exerciser in the query)
  const exerciser =
    typeof data.user === "object" && data.user?.id ? data.user.id : data.user;

  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    exerciser: exerciser as `0x${string}`,
    amount: BigInt(data.amount ?? 0),
    profitAmount: BigInt(data.profitAmount ?? 0),
    fee: BigInt(data.fee ?? 0),
    optionTokensBurnt: BigInt(data.optionTokensBurnt ?? 0),
    sharesUnutilized: BigInt(data.sharesUnutilized ?? 0),
    makerLoss: data.makerLoss != null ? BigInt(data.makerLoss) : null,
    purchaserProfit:
      data.purchaserProfit != null ? BigInt(data.purchaserProfit) : null,
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into UnwindHistory type
 */
export function serializeUnwindHistory(data: any): UnwindHistory {
  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    marketId: BigInt(data.marketId ?? 0),
    amount: BigInt(data.amount ?? 0),
    collateralTokensToReturn: BigInt(data.collateralTokensToReturn ?? 0),
    collateralSharesToBurn: BigInt(data.collateralSharesToBurn ?? 0),
    optionSharesToBurn: BigInt(data.optionSharesToBurn ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into SettlementHistory type
 */
export function serializeSettlementHistory(data: any): SettlementHistory {
  // Extract marketId - it might be in optionMarketId or marketId field
  const optionMarketId = data.optionMarketId ?? data.marketId ?? "";

  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    optionMarketId: String(optionMarketId),
    totalCollateralSettled: BigInt(data.totalCollateralSettled ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into WithdrawHistory type
 */
export function serializeWithdrawHistory(data: any): WithdrawHistory {
  const user =
    typeof data.user === "object" && data.user?.id ? data.user.id : data.user;
  const receiver =
    typeof data.receiver === "object" && data.receiver?.id
      ? data.receiver.id
      : data.receiver;

  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    marketId: BigInt(data.marketId ?? 0),
    user: user as `0x${string}`,
    receiver: receiver as `0x${string}`,
    sharesBurnt: BigInt(data.sharesBurnt ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
  };
}

/**
 * Serialize raw GraphQL query result into TransferCollateralSharesHistory type
 */
export function serializeTransferCollateralSharesHistory(
  data: any
): TransferCollateralSharesHistory {
  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    marketId: BigInt(data.marketId ?? 0),
    user: data.user as `0x${string}`,
    receiver: data.receiver as `0x${string}`,
    amount: BigInt(data.amount ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
    userSide: data.userSide || "sender", // "sender" | "receiver" | "both"
  };
}

/**
 * Serialize raw GraphQL query result into TransferOptionsSharesHistory type
 */
export function serializeTransferOptionsSharesHistory(
  data: any
): TransferOptionsSharesHistory {
  return {
    id: String(data.id),
    optionId: String(data.optionId ?? ""),
    marketId: BigInt(data.marketId ?? 0),
    user: data.user as `0x${string}`,
    receiver: data.receiver as `0x${string}`,
    amount: BigInt(data.amount ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
    userSide: data.userSide || "sender", // "sender" | "receiver" | "both"
  };
}

/**
 * Serialize raw GraphQL query result into OrderFillHistory type
 */
export function serializeOrderFillHistory(data: any): OrderFillHistory {
  // Extract maker and taker from user objects if they're relations
  const maker =
    typeof data.maker === "object" && data.maker?.id
      ? data.maker.id
      : data.maker;
  const taker =
    typeof data.taker === "object" && data.taker?.id
      ? data.taker.id
      : data.taker;

  return {
    id: String(data.id),
    orderHash: data.orderHash as `0x${string}`,
    maker: maker as `0x${string}`,
    taker: taker as `0x${string}`,
    optionTokenId:
      data.optionTokenId != null ? BigInt(data.optionTokenId) : null,
    makingAmount: BigInt(data.makingAmount ?? 0),
    takingAmount: BigInt(data.takingAmount ?? 0),
    price: BigInt(data.price ?? 0),
    transactionHash: data.transactionHash as `0x${string}`,
    blockNumber: BigInt(data.blockNumber ?? 0),
    timestamp: BigInt(data.timestamp ?? 0),
    userSide: data.userSide || "maker", // "maker" | "taker"
  };
}

/**
 * Serialize raw GraphQL query result into UserHistories type
 */
export function serializeUserHistories(data: any): UserHistories {
  return {
    depositHistory: (data.depositHistory || []).map(serializeDepositHistory),
    transferDepositHistory: (data.transferDepositHistory || []).map(
      serializeTransferDepositHistory
    ),
    transferCollateralSharesHistory: (
      data.transferCollateralSharesHistory || []
    ).map(serializeTransferCollateralSharesHistory),
    transferOptionsSharesHistory: (data.transferOptionsSharesHistory || []).map(
      serializeTransferOptionsSharesHistory
    ),
    purchaseHistory: (data.purchaseHistory || []).map(serializePurchaseHistory),
    transferPositionHistory: (data.transferPositionHistory || []).map(
      serializeTransferPositionHistory
    ),
    exerciseHistory: (data.exerciseHistory || []).map(serializeExerciseHistory),
    unwindHistory: (data.unwindHistory || []).map(serializeUnwindHistory),
    withdrawHistory: (data.withdrawHistory || []).map(serializeWithdrawHistory),
    settlementHistory: (data.settlementHistory || []).map(
      serializeSettlementHistory
    ),
    orderFillHistory: (data.orderFillHistory || []).map(
      serializeOrderFillHistory
    ),
  };
}
