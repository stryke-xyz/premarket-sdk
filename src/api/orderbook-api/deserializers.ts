/**
 * Deserializers for API responses
 * 
 * Note: Most endpoints now return pre-formatted string values,
 * so minimal deserialization is needed. These helpers are provided
 * for cases where BigInt conversion is preferred on the client side.
 */

import type {
  Erc20Submarket,
  Market,
  MarketInstrument,
  SpreadType,
  UserPosition,
  TradingPnL,
  UserHistories,
  MintHistoryItem,
  RedeemHistoryItem,
  UnwindHistoryItem,
  TransferHistoryItem,
  OrderFillHistoryItem,
} from "../../shared/types.js";

export interface BigIntBaseMarketInstrument {
  id: string;
  name: string;
  tick: bigint;
  isCall: boolean;
  isSpread: boolean;
  spreadType: SpreadType;
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

export interface BigIntVanillaMarketInstrument
  extends BigIntBaseMarketInstrument {
  isSpread: false;
  spreadType: "vanilla";
}

export interface BigIntSpreadMarketInstrument
  extends BigIntBaseMarketInstrument {
  isSpread: true;
  spreadType: "standard" | "absolute";
  lower: bigint;
  upper: bigint;
}

export type BigIntMarketInstrument =
  | BigIntVanillaMarketInstrument
  | BigIntSpreadMarketInstrument;

export interface BigIntBaseMarket {
  id: string;
  groupId: string | null;
  groupName: string | null;
  type: "erc6909" | "erc20";
  name: string;
  description: string;
  specification: string;
  minOrderAmount: bigint;
  createdAt: bigint;
  priceIncrement: bigint;
  minPrice: bigint;
  maxPrice: bigint;
  collateralToken: string;
  collateralDecimals: number;
  maxDecimals: bigint | null;
  marketType: "ERC20xERC20" | "ERC20xERC6909";
  logoUri: string | null;
  hasFinalTick: boolean;
}

export interface BigIntErc6909Market extends BigIntBaseMarket {
  type: "erc6909";
  creator: string;
  instruments: BigIntMarketInstrument[];
  collateral: string;
  underlying: string;
  delivery: string;
  isSpread: boolean;
  spreadType: SpreadType;
  useAbsoluteSpreadCollateral: boolean;
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
  isCollateralScaled: boolean;
  nonRollable: boolean;
}

export interface BigIntErc20Submarket {
  id: string;
  marketId: string;
  name: string;
  tokenAddress: string;
  tokenDecimals: number;
  lastPrice: bigint | null;
  bestBid: bigint | null;
  bestAsk: bigint | null;
}

export interface BigIntErc20Market extends BigIntBaseMarket {
  type: "erc20";
  underlying: string | null;
  underlyingDecimals: number | null;
  instruments: BigIntErc20Submarket[];
  /** @deprecated Use `instruments` instead. */
  submarkets?: BigIntErc20Submarket[];
}

export type BigIntMarket = BigIntErc6909Market | BigIntErc20Market;

function parseOptionalBigInt(value: string | null): bigint | null {
  return value == null ? null : BigInt(value);
}

function parseIsCall(value: boolean | 0 | 1): boolean {
  return value === true || value === 1;
}

function submarketToBigInt(submarket: Erc20Submarket): BigIntErc20Submarket {
  return {
    id: submarket.id,
    marketId: submarket.marketId ?? submarket.id,
    name: submarket.name,
    tokenAddress: submarket.tokenAddress,
    tokenDecimals: submarket.tokenDecimals,
    lastPrice: parseOptionalBigInt(submarket.lastPrice),
    bestBid: parseOptionalBigInt(submarket.bestBid),
    bestAsk: parseOptionalBigInt(submarket.bestAsk),
  };
}

/**
 * Convert string market instrument fields to BigInt.
 */
export function marketInstrumentToBigInt(
  instrument: MarketInstrument
): BigIntMarketInstrument {
  const baseInstrument: BigIntBaseMarketInstrument = {
    id: instrument.id,
    name: instrument.name,
    tick: BigInt(instrument.tick),
    isCall: parseIsCall(instrument.isCall),
    isSpread: instrument.isSpread,
    spreadType: instrument.spreadType,
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

  if (!instrument.isSpread) {
    return baseInstrument as BigIntVanillaMarketInstrument;
  }

  return {
    ...baseInstrument,
    isSpread: true,
    spreadType: instrument.spreadType,
    lower: BigInt(instrument.lower),
    upper: BigInt(instrument.upper),
  };
}

/**
 * Convert string market fields to BigInt while preserving addresses and labels.
 */
export function marketToBigInt(market: Market): BigIntMarket {
  const baseMarket: BigIntBaseMarket = {
    id: market.id,
    groupId: market.groupId,
    groupName: market.groupName ?? null,
    type: market.type,
    name: market.name,
    description: market.description,
    specification: market.specification,
    minOrderAmount: BigInt(market.minOrderAmount),
    createdAt: BigInt(market.createdAt),
    priceIncrement: BigInt(market.priceIncrement),
    minPrice: BigInt(market.minPrice),
    maxPrice: BigInt(market.maxPrice),
    collateralToken: market.collateralToken,
    collateralDecimals: market.collateralDecimals,
    maxDecimals: parseOptionalBigInt(market.maxDecimals),
    marketType: market.marketType,
    logoUri: market.logoUri ?? null,
    hasFinalTick: market.hasFinalTick ?? false,
  };

  if (market.type === "erc20") {
    return {
      ...baseMarket,
      type: "erc20",
      underlying: market.underlying,
      underlyingDecimals: market.underlyingDecimals,
      instruments: (market.instruments ?? market.submarkets ?? []).map(submarketToBigInt),
    };
  }

  return {
    ...baseMarket,
    type: "erc6909",
    creator: market.creator,
    instruments: market.instruments.map(marketInstrumentToBigInt),
    collateral: market.collateral,
    underlying: market.underlying,
    delivery: market.delivery,
    isSpread: market.isSpread,
    spreadType: market.spreadType,
    useAbsoluteSpreadCollateral: market.useAbsoluteSpreadCollateral,
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
