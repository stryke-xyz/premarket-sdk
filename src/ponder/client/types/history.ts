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

export interface WithdrawHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  user: `0x${string}`;
  receiver: `0x${string}`;
  sharesBurnt: bigint;
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

export interface TransferCollateralSharesHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  user: `0x${string}`; // sender
  receiver: `0x${string}`; // recipient
  amount: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
  userSide: "sender" | "receiver" | "both"; // which side the user is on
}

export interface TransferOptionsSharesHistory {
  id: string;
  optionId: string;
  marketId: bigint;
  user: `0x${string}`; // original owner (from)
  receiver: `0x${string}`; // new owner (to)
  amount: bigint; // option tokens transferred
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
  userSide: "sender" | "receiver" | "both"; // which side the user is on
}

export interface OrderFillHistory {
  id: string;
  orderHash: `0x${string}`;
  maker: `0x${string}`; // order creator - earns takingAmount as premium
  taker: `0x${string}`; // order filler - pays takingAmount
  optionTokenId: bigint | null; // tokenId of option being traded (null if not option trade)
  makingAmount: bigint; // option tokens maker is selling
  takingAmount: bigint; // USDC/premium maker receives
  price: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
  userSide: "maker" | "taker"; // which side the user is on
}

export interface UserHistories {
  depositHistory: DepositHistory[];
  transferDepositHistory: TransferDepositHistory[];
  transferCollateralSharesHistory: TransferCollateralSharesHistory[];
  transferOptionsSharesHistory: TransferOptionsSharesHistory[];
  purchaseHistory: PurchaseHistory[];
  transferPositionHistory: TransferPositionHistory[];
  exerciseHistory: ExerciseHistory[];
  unwindHistory: UnwindHistory[];
  withdrawHistory: WithdrawHistory[];
  settlementHistory: SettlementHistory[];
  orderFillHistory: OrderFillHistory[];
}
