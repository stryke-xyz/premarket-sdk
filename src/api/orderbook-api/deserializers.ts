/**
 * Deserializers for API responses
 * 
 * Note: Most endpoints now return pre-formatted string values,
 * so minimal deserialization is needed. These helpers are provided
 * for cases where BigInt conversion is preferred on the client side.
 */

import type {
  Erc6909Market,
  UserPosition,
  TradingPnL,
  UserHistories,
  MintHistoryItem,
  RedeemHistoryItem,
  UnwindHistoryItem,
  TransferHistoryItem,
  OrderFillHistoryItem,
} from "../../shared/types.js";

/**
 * Convert string amounts to BigInt for a position
 */
export function positionToBigInt(pos: UserPosition): {
  id: string;
  tokenId: bigint;
  holding: bigint;
  totalCost: bigint;
  totalProceeds: bigint;
  realizedPnL: bigint;
  updatedAt: bigint;
} {
  return {
    id: pos.id,
    tokenId: BigInt(pos.tokenId),
    holding: BigInt(pos.holding),
    totalCost: BigInt(pos.totalCost),
    totalProceeds: BigInt(pos.totalProceeds),
    realizedPnL: BigInt(pos.realizedPnL),
    updatedAt: BigInt(pos.updatedAt),
  };
}

/**
 * Convert string amounts to BigInt for trading PnL
 */
export function tradingPnLToBigInt(trading: TradingPnL): {
  id: string;
  asset: `0x${string}`;
  tokenId: bigint | null;
  totalBought: bigint;
  totalSold: bigint;
  totalSpent: bigint;
  totalReceived: bigint;
  realizedPnL: bigint;
  updatedAt: bigint;
} {
  return {
    id: trading.id,
    asset: trading.asset,
    tokenId: trading.tokenId ? BigInt(trading.tokenId) : null,
    totalBought: BigInt(trading.totalBought),
    totalSold: BigInt(trading.totalSold),
    totalSpent: BigInt(trading.totalSpent),
    totalReceived: BigInt(trading.totalReceived),
    realizedPnL: BigInt(trading.realizedPnL),
    updatedAt: BigInt(trading.updatedAt),
  };
}

/**
 * Convert string amounts to BigInt for ERC6909 market data
 * Returns null if market has no onchain optionMarketVault
 */
export function marketToBigInt(market: Erc6909Market): {
  id: string;
  marketId: bigint;
  underlying: `0x${string}`;
  collateral: `0x${string}`;
  delivery: `0x${string}`;
  owner: `0x${string}`;
  creator: `0x${string}`;
  tickSize: bigint;
  tickSpacing: bigint;
  tokensPerTickSize: bigint;
  expiry: bigint;
  depositFeeBps: bigint;
  redeemFeeBps: bigint;
  isCollateralScaled: boolean;
  totalPrmMinted: bigint;
  totalCollateralDeposited: bigint;
  totalFeesCollected: bigint;
  createdAt: bigint;
  updatedAt: bigint;
} | null {
  if (!market.marketId || !market.optionMarketVault) {
    return null;
  }
  const vault = market.optionMarketVault;
  return {
    id: market.id,
    marketId: BigInt(market.marketId),
    underlying: vault.underlying,
    collateral: vault.collateral,
    delivery: vault.delivery,
    owner: vault.owner,
    creator: vault.creator,
    tickSize: BigInt(vault.tickSize),
    tickSpacing: BigInt(vault.tickSpacing),
    tokensPerTickSize: BigInt(vault.tokensPerTickSize),
    expiry: BigInt(vault.expiry),
    depositFeeBps: BigInt(vault.depositFeeBps),
    redeemFeeBps: BigInt(vault.redeemFeeBps),
    isCollateralScaled: vault.isCollateralScaled,
    totalPrmMinted: BigInt(vault.totalPrmMinted),
    totalCollateralDeposited: BigInt(vault.totalCollateralDeposited),
    totalFeesCollected: BigInt(vault.totalFeesCollected),
    createdAt: BigInt(vault.createdAt),
    updatedAt: BigInt(vault.updatedAt),
  };
}

/**
 * Convert string amounts to BigInt for mint history
 */
export function mintHistoryToBigInt(mint: MintHistoryItem): {
  id: string;
  marketId: bigint;
  prmTokenId: bigint;
  oPrmTokenId: bigint;
  minter: `0x${string}`;
  amount: bigint;
  collateralAmount: bigint;
  fees: bigint;
  tick: bigint;
  isCall: boolean;
  expiry: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
} {
  return {
    id: mint.id,
    marketId: BigInt(mint.marketId),
    prmTokenId: BigInt(mint.prmTokenId),
    oPrmTokenId: BigInt(mint.oPrmTokenId),
    minter: mint.minter,
    amount: BigInt(mint.amount),
    collateralAmount: BigInt(mint.collateralAmount),
    fees: BigInt(mint.fees),
    tick: BigInt(mint.tick),
    isCall: mint.isCall,
    expiry: BigInt(mint.expiry),
    transactionHash: mint.transactionHash,
    blockNumber: BigInt(mint.blockNumber),
    timestamp: BigInt(mint.timestamp),
  };
}

/**
 * Convert string amounts to BigInt for redeem history
 */
export function redeemHistoryToBigInt(redeem: RedeemHistoryItem): {
  id: string;
  oPrmTokenId: bigint;
  prmTokenId: bigint;
  redeemer: `0x${string}`;
  balance: bigint;
  profit: bigint;
  fees: bigint;
  finalTick: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
} {
  return {
    id: redeem.id,
    oPrmTokenId: BigInt(redeem.oPrmTokenId),
    prmTokenId: BigInt(redeem.prmTokenId),
    redeemer: redeem.redeemer,
    balance: BigInt(redeem.balance),
    profit: BigInt(redeem.profit),
    fees: BigInt(redeem.fees),
    finalTick: BigInt(redeem.finalTick),
    transactionHash: redeem.transactionHash,
    blockNumber: BigInt(redeem.blockNumber),
    timestamp: BigInt(redeem.timestamp),
  };
}

/**
 * Convert string amounts to BigInt for unwind history
 */
export function unwindHistoryToBigInt(unwind: UnwindHistoryItem): {
  id: string;
  marketId: bigint;
  prmTokenId: bigint;
  oPrmTokenId: bigint;
  account: `0x${string}`;
  prmBalance: bigint;
  oPrmBalance: bigint;
  collateralReturned: bigint;
  tick: bigint;
  isCall: boolean;
  expiry: bigint;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
} {
  return {
    id: unwind.id,
    marketId: BigInt(unwind.marketId),
    prmTokenId: BigInt(unwind.prmTokenId),
    oPrmTokenId: BigInt(unwind.oPrmTokenId),
    account: unwind.account,
    prmBalance: BigInt(unwind.prmBalance),
    oPrmBalance: BigInt(unwind.oPrmBalance),
    collateralReturned: BigInt(unwind.collateralReturned),
    tick: BigInt(unwind.tick),
    isCall: unwind.isCall,
    expiry: BigInt(unwind.expiry),
    transactionHash: unwind.transactionHash,
    blockNumber: BigInt(unwind.blockNumber),
    timestamp: BigInt(unwind.timestamp),
  };
}

/**
 * Convert string amounts to BigInt for transfer history
 */
export function transferHistoryToBigInt(transfer: TransferHistoryItem): {
  id: string;
  vaultId: string;
  caller: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}`;
  tokenId: bigint;
  amount: bigint;
  direction: "sent" | "received";
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
} {
  return {
    id: transfer.id,
    vaultId: transfer.vaultId,
    caller: transfer.caller,
    from: transfer.from,
    to: transfer.to,
    tokenId: BigInt(transfer.tokenId),
    amount: BigInt(transfer.amount),
    direction: transfer.direction,
    transactionHash: transfer.transactionHash,
    blockNumber: BigInt(transfer.blockNumber),
    timestamp: BigInt(transfer.timestamp),
  };
}

/**
 * Convert string amounts to BigInt for fill history
 */
export function fillHistoryToBigInt(fill: OrderFillHistoryItem): {
  id: string;
  orderHash: `0x${string}`;
  maker: `0x${string}`;
  taker: `0x${string}`;
  makerAsset: `0x${string}`;
  takerAsset: `0x${string}`;
  makingAmount: bigint;
  takingAmount: bigint;
  tradeType: string;
  optionTokenId: bigint | null;
  role: "maker" | "taker";
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  timestamp: bigint;
} {
  return {
    id: fill.id,
    orderHash: fill.orderHash,
    maker: fill.maker,
    taker: fill.taker,
    makerAsset: fill.makerAsset,
    takerAsset: fill.takerAsset,
    makingAmount: BigInt(fill.makingAmount),
    takingAmount: BigInt(fill.takingAmount),
    tradeType: fill.tradeType,
    optionTokenId: fill.optionTokenId ? BigInt(fill.optionTokenId) : null,
    role: fill.role,
    transactionHash: fill.transactionHash,
    blockNumber: BigInt(fill.blockNumber),
    timestamp: BigInt(fill.timestamp),
  };
}
