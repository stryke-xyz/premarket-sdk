/**
 * Deserializers for API responses
 * 
 * Note: Most endpoints now return pre-formatted string values,
 * so minimal deserialization is needed. These helpers are provided
 * for cases where BigInt conversion is preferred on the client side.
 */

import type {
  Market,
  MarketInstrument,
  UserPosition,
  TradingPnL,
  UserHistories,
  MintHistoryItem,
  RedeemHistoryItem,
  UnwindHistoryItem,
  TransferHistoryItem,
  OrderFillHistoryItem,
} from "../../shared/types.js";

export interface BigIntMarketInstrument {
  id: string;
  name: string;
  tick: bigint;
  isCall: boolean;
  prmTokenId: bigint;
  oPrmTokenId: bigint;
  expiry: bigint;
  lastPrice: bigint | null;
  bestBid: bigint | null;
  bestAsk: bigint | null;
  totalCollateral: bigint;
  totalPrmSupply: bigint;
  totalOprmSupply: bigint;
}

export interface BigIntMarket {
  groupId: string;
  name: string;
  description: string;
  specification: string;
  minOrderAmount: bigint;
  createdAt: bigint;
  creator: string;
  priceIncrement: bigint;
  minPrice: bigint;
  maxPrice: bigint;
  instruments: BigIntMarketInstrument[];
  collateral: string;
  underlying: string;
  delivery: string;
  owner: string;
  tickSize: bigint;
  tickSpacing: bigint;
  tokensPerTickSize: bigint;
  expiry: bigint;
  depositFeeBps: bigint;
  redeemFeeBps: bigint;
  makerFeeBps: bigint;
  takerFeeBps: bigint;
  rolloverFeeBps: bigint;
  totalCollateral: bigint;
  marketType: "ERC20xERC20" | "ERC20xERC6909";
  isCollateralScaled: boolean;
  nonRollable: boolean;
}

function parseOptionalBigInt(value: string | null): bigint | null {
  return value == null ? null : BigInt(value);
}

function parseIsCall(value: MarketInstrument["isCall"]): boolean {
  return value === true || value === 1;
}

/**
 * Convert string market instrument fields to BigInt.
 */
export function marketInstrumentToBigInt(
  instrument: MarketInstrument
): BigIntMarketInstrument {
  return {
    id: instrument.id,
    name: instrument.name,
    tick: BigInt(instrument.tick),
    isCall: parseIsCall(instrument.isCall),
    prmTokenId: BigInt(instrument.prmTokenId),
    oPrmTokenId: BigInt(instrument.oPrmTokenId),
    expiry: BigInt(instrument.expiry),
    lastPrice: parseOptionalBigInt(instrument.lastPrice),
    bestBid: parseOptionalBigInt(instrument.bestBid),
    bestAsk: parseOptionalBigInt(instrument.bestAsk),
    totalCollateral: BigInt(instrument.totalCollateral),
    totalPrmSupply: BigInt(instrument.totalPrmSupply),
    totalOprmSupply: BigInt(instrument.totalOprmSupply),
  };
}

/**
 * Convert string market fields to BigInt while preserving addresses and labels.
 */
export function marketToBigInt(market: Market): BigIntMarket {
  return {
    groupId: market.groupId,
    name: market.name,
    description: market.description,
    specification: market.specification,
    minOrderAmount: BigInt(market.minOrderAmount),
    createdAt: BigInt(market.createdAt),
    creator: market.creator,
    priceIncrement: BigInt(market.priceIncrement),
    minPrice: BigInt(market.minPrice),
    maxPrice: BigInt(market.maxPrice),
    instruments: market.instruments.map(marketInstrumentToBigInt),
    collateral: market.collateral,
    underlying: market.underlying,
    delivery: market.delivery,
    owner: market.owner,
    tickSize: BigInt(market.tickSize),
    tickSpacing: BigInt(market.tickSpacing),
    tokensPerTickSize: BigInt(market.tokensPerTickSize),
    expiry: BigInt(market.expiry),
    depositFeeBps: BigInt(market.depositFeeBps),
    redeemFeeBps: BigInt(market.redeemFeeBps),
    makerFeeBps: BigInt(market.makerFeeBps),
    takerFeeBps: BigInt(market.takerFeeBps),
    rolloverFeeBps: BigInt(market.rolloverFeeBps),
    totalCollateral: BigInt(market.totalCollateral),
    marketType: market.marketType,
    isCollateralScaled: market.isCollateralScaled,
    nonRollable: market.nonRollable,
  };
}

/**
 * Convert a market list response payload to BigInt.
 */
export function marketsToBigInt(data: {
  markets: Market[];
  total: number;
}): {
  markets: BigIntMarket[];
  total: number;
} {
  return {
    markets: data.markets.map(marketToBigInt),
    total: data.total,
  };
}

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
    role: fill.role ?? "taker",
    transactionHash: fill.transactionHash,
    blockNumber: BigInt(fill.blockNumber),
    timestamp: BigInt(fill.timestamp),
  };
}
