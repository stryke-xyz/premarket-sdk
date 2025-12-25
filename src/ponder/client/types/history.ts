export interface DepositHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  receiver: `0x${string}`;
  amount: bigint;
  collateralAmount: bigint;
  fee: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface TransferDepositHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  amount: bigint;
  collateralAmount: bigint;
  fee: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface PurchaseHistory {
  id: string;
  optionId: string;
  purchaser: `0x${string}`;
  amount: bigint;
  premiumAmount: bigint;
  fee: bigint;
  optionShares: bigint;
  sharesUtilized: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface TransferPositionHistory {
  id: string;
  optionId: string;
  purchaser: `0x${string}`;
  amount: bigint;
  premiumAmount: bigint;
  fee: bigint;
  optionShares: bigint;
  sharesUtilized: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface ExerciseHistory {
  id: string;
  optionId: string;
  exerciser: `0x${string}`;
  amount: bigint;
  profitAmount: bigint;
  fee: bigint;
  optionTokensBurnt: bigint;
  sharesUnutilized: bigint;
  makerLoss: bigint | null;
  purchaserProfit: bigint | null;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface UnwindHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  amount: bigint;
  collateralTokensToReturn: bigint;
  collateralSharesToBurn: bigint;
  optionSharesToBurn: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface SettlementHistory {
  id: string;
  optionId: string;
  optionMarketId: string;
  totalCollateralSettled: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
}

export interface UserHistories {
  depositHistory: DepositHistory[];
  transferDepositHistory: TransferDepositHistory[];
  purchaseHistory: PurchaseHistory[];
  transferPositionHistory: TransferPositionHistory[];
  exerciseHistory: ExerciseHistory[];
  unwindHistory: UnwindHistory[];
  settlementHistory: SettlementHistory[];
}




