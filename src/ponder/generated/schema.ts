// @ts-nocheck
export type Scalars = {
    JSON: any,
    BigInt: any,
    Boolean: boolean,
    String: string,
    Int: number,
}

export interface PageInfo {
    hasNextPage: Scalars['Boolean']
    hasPreviousPage: Scalars['Boolean']
    startCursor?: Scalars['String']
    endCursor?: Scalars['String']
    __typename: 'PageInfo'
}

export interface Meta {
    status?: Scalars['JSON']
    __typename: 'Meta'
}

export interface Query {
    global?: Global
    globals: GlobalPage
    user?: User
    users: UserPage
    optionMarket?: OptionMarket
    optionMarkets: OptionMarketPage
    marketStrategy?: MarketStrategy
    marketStrategys: MarketStrategyPage
    optionParams?: OptionParams
    optionParamss: OptionParamsPage
    collateralPosition?: CollateralPosition
    collateralPositions: CollateralPositionPage
    optionPosition?: OptionPosition
    optionPositions: OptionPositionPage
    depositHistory?: DepositHistory
    depositHistorys: DepositHistoryPage
    transferDepositHistory?: TransferDepositHistory
    transferDepositHistorys: TransferDepositHistoryPage
    purchaseHistory?: PurchaseHistory
    purchaseHistorys: PurchaseHistoryPage
    transferPositionHistory?: TransferPositionHistory
    transferPositionHistorys: TransferPositionHistoryPage
    exerciseHistory?: ExerciseHistory
    exerciseHistorys: ExerciseHistoryPage
    unwindHistory?: UnwindHistory
    unwindHistorys: UnwindHistoryPage
    orderFillHistory?: OrderFillHistory
    orderFillHistorys: OrderFillHistoryPage
    orderCancelHistory?: OrderCancelHistory
    orderCancelHistorys: OrderCancelHistoryPage
    settlementHistory?: SettlementHistory
    settlementHistorys: SettlementHistoryPage
    hourlyVolume?: HourlyVolume
    hourlyVolumes: HourlyVolumePage
    _meta?: Meta
    __typename: 'Query'
}

export interface Global {
    id: Scalars['String']
    feeReceiver: Scalars['String']
    collateralTokenFactory: Scalars['String']
    optionTokenFactory: Scalars['String']
    totalMarkets: Scalars['BigInt']
    updatedAt: Scalars['BigInt']
    updatedAtBlock: Scalars['BigInt']
    markets?: OptionMarketPage
    __typename: 'Global'
}

export interface OptionMarketPage {
    items: OptionMarket[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'OptionMarketPage'
}

export interface OptionMarket {
    id: Scalars['String']
    globalId: Scalars['String']
    marketId: Scalars['BigInt']
    callToken: Scalars['String']
    putToken: Scalars['String']
    expiry: Scalars['BigInt']
    maxTTL: Scalars['BigInt']
    strategy?: MarketStrategy
    collateralToken: Scalars['String']
    totalCollateral: Scalars['BigInt']
    totalCollateralAmount: Scalars['BigInt']
    protocolFees: Scalars['BigInt']
    createdAt: Scalars['BigInt']
    createdAtBlock: Scalars['BigInt']
    updatedAt: Scalars['BigInt']
    updatedAtBlock: Scalars['BigInt']
    global?: Global
    collateralPositions?: CollateralPositionPage
    optionPositions?: OptionPositionPage
    __typename: 'OptionMarket'
}

export interface MarketStrategy {
    id: Scalars['String']
    finalFDV: Scalars['BigInt']
    deadline: Scalars['BigInt']
    bandPrecision: Scalars['BigInt']
    collateralPerBandPrecision: Scalars['BigInt']
    premiumRate: Scalars['BigInt']
    depositFeeRate: Scalars['BigInt']
    purchaseFeeRate: Scalars['BigInt']
    settlementFeeRate: Scalars['BigInt']
    collateralToken: Scalars['String']
    createdAt: Scalars['BigInt']
    createdAtBlock: Scalars['BigInt']
    updatedAt: Scalars['BigInt']
    updatedAtBlock: Scalars['BigInt']
    __typename: 'MarketStrategy'
}

export interface CollateralPositionPage {
    items: CollateralPosition[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'CollateralPositionPage'
}

export interface CollateralPosition {
    id: Scalars['String']
    optionId: Scalars['String']
    optionMarketId: Scalars['String']
    user?: User
    totalCollateral: Scalars['BigInt']
    optionsMinted: Scalars['BigInt']
    optionsExercised: Scalars['BigInt']
    premiumEarned: Scalars['BigInt']
    fee: Scalars['BigInt']
    settled: Scalars['Boolean']
    updatedAt: Scalars['BigInt']
    updatedAtBlock: Scalars['BigInt']
    optionParams?: OptionParams
    optionMarket?: OptionMarket
    __typename: 'CollateralPosition'
}

export interface User {
    id: Scalars['String']
    updatedAt: Scalars['BigInt']
    updatedAtBlock: Scalars['BigInt']
    optionsPositions?: OptionPositionPage
    collateralPositions?: CollateralPositionPage
    depositHistory?: DepositHistoryPage
    transferDepositHistory?: TransferDepositHistoryPage
    purchaseHistory?: PurchaseHistoryPage
    exerciseHistory?: ExerciseHistoryPage
    unwindHistory?: UnwindHistoryPage
    transferPositionHistory?: TransferPositionHistoryPage
    settlementHistory?: SettlementHistoryPage
    __typename: 'User'
}

export interface OptionPositionPage {
    items: OptionPosition[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'OptionPositionPage'
}

export interface OptionPosition {
    id: Scalars['String']
    tokenId: Scalars['BigInt']
    address: Scalars['String']
    optionId: Scalars['String']
    optionMarketId: Scalars['String']
    user?: User
    premium: Scalars['BigInt']
    fee: Scalars['BigInt']
    profit: Scalars['BigInt']
    amount: Scalars['BigInt']
    averagePrice: Scalars['BigInt']
    updatedAt: Scalars['BigInt']
    updatedAtBlock: Scalars['BigInt']
    optionParams?: OptionParams
    optionMarket?: OptionMarket
    __typename: 'OptionPosition'
}

export interface OptionParams {
    id: Scalars['String']
    marketId: Scalars['BigInt']
    strikeLowerLimit: Scalars['BigInt']
    strikeUpperLimit: Scalars['BigInt']
    isPut: Scalars['Boolean']
    collateralPerShare?: Scalars['BigInt']
    createdAt: Scalars['BigInt']
    createdAtBlock: Scalars['BigInt']
    collateralPositions?: CollateralPositionPage
    optionPositions?: OptionPositionPage
    __typename: 'OptionParams'
}

export interface DepositHistoryPage {
    items: DepositHistory[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'DepositHistoryPage'
}

export interface DepositHistory {
    id: Scalars['String']
    optionId: Scalars['String']
    marketId: Scalars['BigInt']
    user?: User
    receiver: Scalars['String']
    amount: Scalars['BigInt']
    collateralAmount: Scalars['BigInt']
    fee: Scalars['BigInt']
    transactionHash: Scalars['String']
    blockNumber: Scalars['BigInt']
    timestamp: Scalars['BigInt']
    __typename: 'DepositHistory'
}

export interface TransferDepositHistoryPage {
    items: TransferDepositHistory[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'TransferDepositHistoryPage'
}

export interface TransferDepositHistory {
    id: Scalars['String']
    optionId: Scalars['String']
    marketId: Scalars['BigInt']
    user?: User
    receiver?: User
    amount: Scalars['BigInt']
    collateralAmount: Scalars['BigInt']
    fee: Scalars['BigInt']
    transactionHash: Scalars['String']
    blockNumber: Scalars['BigInt']
    timestamp: Scalars['BigInt']
    __typename: 'TransferDepositHistory'
}

export interface PurchaseHistoryPage {
    items: PurchaseHistory[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'PurchaseHistoryPage'
}

export interface PurchaseHistory {
    id: Scalars['String']
    optionId: Scalars['String']
    marketId: Scalars['BigInt']
    maker?: User
    receiver?: User
    purchaser: Scalars['String']
    amount: Scalars['BigInt']
    premiumAmount: Scalars['BigInt']
    fee: Scalars['BigInt']
    optionShares: Scalars['BigInt']
    sharesUtilized: Scalars['BigInt']
    transactionHash: Scalars['String']
    blockNumber: Scalars['BigInt']
    timestamp: Scalars['BigInt']
    __typename: 'PurchaseHistory'
}

export interface ExerciseHistoryPage {
    items: ExerciseHistory[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'ExerciseHistoryPage'
}

export interface ExerciseHistory {
    id: Scalars['String']
    optionId: Scalars['String']
    marketId: Scalars['BigInt']
    maker?: User
    receiver?: User
    exerciser: Scalars['String']
    amount: Scalars['BigInt']
    profitAmount: Scalars['BigInt']
    fee: Scalars['BigInt']
    optionTokensBurnt: Scalars['BigInt']
    sharesUnutilized: Scalars['BigInt']
    makerLoss?: Scalars['BigInt']
    purchaserProfit?: Scalars['BigInt']
    transactionHash: Scalars['String']
    blockNumber: Scalars['BigInt']
    timestamp: Scalars['BigInt']
    __typename: 'ExerciseHistory'
}

export interface UnwindHistoryPage {
    items: UnwindHistory[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'UnwindHistoryPage'
}

export interface UnwindHistory {
    id: Scalars['String']
    optionId: Scalars['String']
    marketId: Scalars['BigInt']
    user?: User
    receiver?: User
    amount: Scalars['BigInt']
    collateralTokensToReturn: Scalars['BigInt']
    collateralSharesToBurn: Scalars['BigInt']
    optionSharesToBurn: Scalars['BigInt']
    transactionHash: Scalars['String']
    blockNumber: Scalars['BigInt']
    timestamp: Scalars['BigInt']
    __typename: 'UnwindHistory'
}

export interface TransferPositionHistoryPage {
    items: TransferPositionHistory[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'TransferPositionHistoryPage'
}

export interface TransferPositionHistory {
    id: Scalars['String']
    optionId: Scalars['String']
    marketId: Scalars['BigInt']
    maker?: User
    receiver?: User
    purchaser: Scalars['String']
    amount: Scalars['BigInt']
    premiumAmount: Scalars['BigInt']
    fee: Scalars['BigInt']
    optionShares: Scalars['BigInt']
    sharesUtilized: Scalars['BigInt']
    transactionHash: Scalars['String']
    blockNumber: Scalars['BigInt']
    timestamp: Scalars['BigInt']
    __typename: 'TransferPositionHistory'
}

export interface SettlementHistoryPage {
    items: SettlementHistory[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'SettlementHistoryPage'
}

export interface SettlementHistory {
    id: Scalars['String']
    optionId: Scalars['String']
    marketId: Scalars['BigInt']
    user?: User
    totalCollateralSettled: Scalars['BigInt']
    transactionHash: Scalars['String']
    blockNumber: Scalars['BigInt']
    timestamp: Scalars['BigInt']
    __typename: 'SettlementHistory'
}

export interface GlobalPage {
    items: Global[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'GlobalPage'
}

export interface UserPage {
    items: User[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'UserPage'
}

export interface MarketStrategyPage {
    items: MarketStrategy[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'MarketStrategyPage'
}

export interface OptionParamsPage {
    items: OptionParams[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'OptionParamsPage'
}

export interface OrderFillHistory {
    id: Scalars['String']
    orderHash: Scalars['String']
    maker: Scalars['String']
    taker: Scalars['String']
    optionTokenId?: Scalars['BigInt']
    makingAmount: Scalars['BigInt']
    takingAmount: Scalars['BigInt']
    remainingAmount: Scalars['BigInt']
    transactionHash: Scalars['String']
    blockNumber: Scalars['BigInt']
    timestamp: Scalars['BigInt']
    __typename: 'OrderFillHistory'
}

export interface OrderFillHistoryPage {
    items: OrderFillHistory[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'OrderFillHistoryPage'
}

export interface OrderCancelHistory {
    id: Scalars['String']
    orderHash: Scalars['String']
    transactionHash: Scalars['String']
    blockNumber: Scalars['BigInt']
    timestamp: Scalars['BigInt']
    __typename: 'OrderCancelHistory'
}

export interface OrderCancelHistoryPage {
    items: OrderCancelHistory[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'OrderCancelHistoryPage'
}

export interface HourlyVolume {
    id: Scalars['String']
    marketId: Scalars['BigInt']
    optionId: Scalars['String']
    hourTimestamp: Scalars['BigInt']
    depositVolume: Scalars['BigInt']
    tradeVolume: Scalars['BigInt']
    unwindVolume: Scalars['BigInt']
    withdrawVolume: Scalars['BigInt']
    exerciseVolume: Scalars['BigInt']
    totalVolume: Scalars['BigInt']
    tradeCount: Scalars['Int']
    updatedAt: Scalars['BigInt']
    updatedAtBlock: Scalars['BigInt']
    optionParams?: OptionParams
    __typename: 'HourlyVolume'
}

export interface HourlyVolumePage {
    items: HourlyVolume[]
    pageInfo: PageInfo
    totalCount: Scalars['Int']
    __typename: 'HourlyVolumePage'
}

export interface PageInfoGenqlSelection{
    hasNextPage?: boolean | number
    hasPreviousPage?: boolean | number
    startCursor?: boolean | number
    endCursor?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface MetaGenqlSelection{
    status?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface QueryGenqlSelection{
    global?: (GlobalGenqlSelection & { __args: {id: Scalars['String']} })
    globals?: (GlobalPageGenqlSelection & { __args?: {where?: (GlobalFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    user?: (UserGenqlSelection & { __args: {id: Scalars['String']} })
    users?: (UserPageGenqlSelection & { __args?: {where?: (UserFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    optionMarket?: (OptionMarketGenqlSelection & { __args: {id: Scalars['String']} })
    optionMarkets?: (OptionMarketPageGenqlSelection & { __args?: {where?: (OptionMarketFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    marketStrategy?: (MarketStrategyGenqlSelection & { __args: {id: Scalars['String']} })
    marketStrategys?: (MarketStrategyPageGenqlSelection & { __args?: {where?: (MarketStrategyFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    optionParams?: (OptionParamsGenqlSelection & { __args: {id: Scalars['String']} })
    optionParamss?: (OptionParamsPageGenqlSelection & { __args?: {where?: (OptionParamsFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    collateralPosition?: (CollateralPositionGenqlSelection & { __args: {id: Scalars['String']} })
    collateralPositions?: (CollateralPositionPageGenqlSelection & { __args?: {where?: (CollateralPositionFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    optionPosition?: (OptionPositionGenqlSelection & { __args: {id: Scalars['String']} })
    optionPositions?: (OptionPositionPageGenqlSelection & { __args?: {where?: (OptionPositionFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    depositHistory?: (DepositHistoryGenqlSelection & { __args: {id: Scalars['String']} })
    depositHistorys?: (DepositHistoryPageGenqlSelection & { __args?: {where?: (DepositHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    transferDepositHistory?: (TransferDepositHistoryGenqlSelection & { __args: {id: Scalars['String']} })
    transferDepositHistorys?: (TransferDepositHistoryPageGenqlSelection & { __args?: {where?: (TransferDepositHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    purchaseHistory?: (PurchaseHistoryGenqlSelection & { __args: {id: Scalars['String']} })
    purchaseHistorys?: (PurchaseHistoryPageGenqlSelection & { __args?: {where?: (PurchaseHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    transferPositionHistory?: (TransferPositionHistoryGenqlSelection & { __args: {id: Scalars['String']} })
    transferPositionHistorys?: (TransferPositionHistoryPageGenqlSelection & { __args?: {where?: (TransferPositionHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    exerciseHistory?: (ExerciseHistoryGenqlSelection & { __args: {id: Scalars['String']} })
    exerciseHistorys?: (ExerciseHistoryPageGenqlSelection & { __args?: {where?: (ExerciseHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    unwindHistory?: (UnwindHistoryGenqlSelection & { __args: {id: Scalars['String']} })
    unwindHistorys?: (UnwindHistoryPageGenqlSelection & { __args?: {where?: (UnwindHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    orderFillHistory?: (OrderFillHistoryGenqlSelection & { __args: {id: Scalars['String']} })
    orderFillHistorys?: (OrderFillHistoryPageGenqlSelection & { __args?: {where?: (OrderFillHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    orderCancelHistory?: (OrderCancelHistoryGenqlSelection & { __args: {id: Scalars['String']} })
    orderCancelHistorys?: (OrderCancelHistoryPageGenqlSelection & { __args?: {where?: (OrderCancelHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    settlementHistory?: (SettlementHistoryGenqlSelection & { __args: {id: Scalars['String']} })
    settlementHistorys?: (SettlementHistoryPageGenqlSelection & { __args?: {where?: (SettlementHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    hourlyVolume?: (HourlyVolumeGenqlSelection & { __args: {id: Scalars['String']} })
    hourlyVolumes?: (HourlyVolumePageGenqlSelection & { __args?: {where?: (HourlyVolumeFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    _meta?: MetaGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface GlobalGenqlSelection{
    id?: boolean | number
    feeReceiver?: boolean | number
    collateralTokenFactory?: boolean | number
    optionTokenFactory?: boolean | number
    totalMarkets?: boolean | number
    updatedAt?: boolean | number
    updatedAtBlock?: boolean | number
    markets?: (OptionMarketPageGenqlSelection & { __args?: {where?: (OptionMarketFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OptionMarketPageGenqlSelection{
    items?: OptionMarketGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OptionMarketGenqlSelection{
    id?: boolean | number
    globalId?: boolean | number
    marketId?: boolean | number
    callToken?: boolean | number
    putToken?: boolean | number
    expiry?: boolean | number
    maxTTL?: boolean | number
    strategy?: MarketStrategyGenqlSelection
    collateralToken?: boolean | number
    totalCollateral?: boolean | number
    totalCollateralAmount?: boolean | number
    protocolFees?: boolean | number
    createdAt?: boolean | number
    createdAtBlock?: boolean | number
    updatedAt?: boolean | number
    updatedAtBlock?: boolean | number
    global?: GlobalGenqlSelection
    collateralPositions?: (CollateralPositionPageGenqlSelection & { __args?: {where?: (CollateralPositionFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    optionPositions?: (OptionPositionPageGenqlSelection & { __args?: {where?: (OptionPositionFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface MarketStrategyGenqlSelection{
    id?: boolean | number
    finalFDV?: boolean | number
    deadline?: boolean | number
    bandPrecision?: boolean | number
    collateralPerBandPrecision?: boolean | number
    premiumRate?: boolean | number
    depositFeeRate?: boolean | number
    purchaseFeeRate?: boolean | number
    settlementFeeRate?: boolean | number
    collateralToken?: boolean | number
    createdAt?: boolean | number
    createdAtBlock?: boolean | number
    updatedAt?: boolean | number
    updatedAtBlock?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface CollateralPositionPageGenqlSelection{
    items?: CollateralPositionGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface CollateralPositionGenqlSelection{
    id?: boolean | number
    optionId?: boolean | number
    optionMarketId?: boolean | number
    user?: UserGenqlSelection
    totalCollateral?: boolean | number
    optionsMinted?: boolean | number
    optionsExercised?: boolean | number
    premiumEarned?: boolean | number
    fee?: boolean | number
    settled?: boolean | number
    updatedAt?: boolean | number
    updatedAtBlock?: boolean | number
    optionParams?: OptionParamsGenqlSelection
    optionMarket?: OptionMarketGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UserGenqlSelection{
    id?: boolean | number
    updatedAt?: boolean | number
    updatedAtBlock?: boolean | number
    optionsPositions?: (OptionPositionPageGenqlSelection & { __args?: {where?: (OptionPositionFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    collateralPositions?: (CollateralPositionPageGenqlSelection & { __args?: {where?: (CollateralPositionFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    depositHistory?: (DepositHistoryPageGenqlSelection & { __args?: {where?: (DepositHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    transferDepositHistory?: (TransferDepositHistoryPageGenqlSelection & { __args?: {where?: (TransferDepositHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    purchaseHistory?: (PurchaseHistoryPageGenqlSelection & { __args?: {where?: (PurchaseHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    exerciseHistory?: (ExerciseHistoryPageGenqlSelection & { __args?: {where?: (ExerciseHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    unwindHistory?: (UnwindHistoryPageGenqlSelection & { __args?: {where?: (UnwindHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    transferPositionHistory?: (TransferPositionHistoryPageGenqlSelection & { __args?: {where?: (TransferPositionHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    settlementHistory?: (SettlementHistoryPageGenqlSelection & { __args?: {where?: (SettlementHistoryFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OptionPositionPageGenqlSelection{
    items?: OptionPositionGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OptionPositionGenqlSelection{
    id?: boolean | number
    tokenId?: boolean | number
    address?: boolean | number
    optionId?: boolean | number
    optionMarketId?: boolean | number
    user?: UserGenqlSelection
    premium?: boolean | number
    fee?: boolean | number
    profit?: boolean | number
    amount?: boolean | number
    averagePrice?: boolean | number
    updatedAt?: boolean | number
    updatedAtBlock?: boolean | number
    optionParams?: OptionParamsGenqlSelection
    optionMarket?: OptionMarketGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OptionParamsGenqlSelection{
    id?: boolean | number
    marketId?: boolean | number
    strikeLowerLimit?: boolean | number
    strikeUpperLimit?: boolean | number
    isPut?: boolean | number
    collateralPerShare?: boolean | number
    createdAt?: boolean | number
    createdAtBlock?: boolean | number
    collateralPositions?: (CollateralPositionPageGenqlSelection & { __args?: {where?: (CollateralPositionFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    optionPositions?: (OptionPositionPageGenqlSelection & { __args?: {where?: (OptionPositionFilter | null), orderBy?: (Scalars['String'] | null), orderDirection?: (Scalars['String'] | null), before?: (Scalars['String'] | null), after?: (Scalars['String'] | null), limit?: (Scalars['Int'] | null)} })
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface CollateralPositionFilter {AND?: ((CollateralPositionFilter | null)[] | null),OR?: ((CollateralPositionFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),optionMarketId?: (Scalars['String'] | null),optionMarketId_not?: (Scalars['String'] | null),optionMarketId_in?: ((Scalars['String'] | null)[] | null),optionMarketId_not_in?: ((Scalars['String'] | null)[] | null),optionMarketId_contains?: (Scalars['String'] | null),optionMarketId_not_contains?: (Scalars['String'] | null),optionMarketId_starts_with?: (Scalars['String'] | null),optionMarketId_ends_with?: (Scalars['String'] | null),optionMarketId_not_starts_with?: (Scalars['String'] | null),optionMarketId_not_ends_with?: (Scalars['String'] | null),user?: (Scalars['String'] | null),user_not?: (Scalars['String'] | null),user_in?: ((Scalars['String'] | null)[] | null),user_not_in?: ((Scalars['String'] | null)[] | null),user_contains?: (Scalars['String'] | null),user_not_contains?: (Scalars['String'] | null),user_starts_with?: (Scalars['String'] | null),user_ends_with?: (Scalars['String'] | null),user_not_starts_with?: (Scalars['String'] | null),user_not_ends_with?: (Scalars['String'] | null),totalCollateral?: (Scalars['BigInt'] | null),totalCollateral_not?: (Scalars['BigInt'] | null),totalCollateral_in?: ((Scalars['BigInt'] | null)[] | null),totalCollateral_not_in?: ((Scalars['BigInt'] | null)[] | null),totalCollateral_gt?: (Scalars['BigInt'] | null),totalCollateral_lt?: (Scalars['BigInt'] | null),totalCollateral_gte?: (Scalars['BigInt'] | null),totalCollateral_lte?: (Scalars['BigInt'] | null),optionsMinted?: (Scalars['BigInt'] | null),optionsMinted_not?: (Scalars['BigInt'] | null),optionsMinted_in?: ((Scalars['BigInt'] | null)[] | null),optionsMinted_not_in?: ((Scalars['BigInt'] | null)[] | null),optionsMinted_gt?: (Scalars['BigInt'] | null),optionsMinted_lt?: (Scalars['BigInt'] | null),optionsMinted_gte?: (Scalars['BigInt'] | null),optionsMinted_lte?: (Scalars['BigInt'] | null),optionsExercised?: (Scalars['BigInt'] | null),optionsExercised_not?: (Scalars['BigInt'] | null),optionsExercised_in?: ((Scalars['BigInt'] | null)[] | null),optionsExercised_not_in?: ((Scalars['BigInt'] | null)[] | null),optionsExercised_gt?: (Scalars['BigInt'] | null),optionsExercised_lt?: (Scalars['BigInt'] | null),optionsExercised_gte?: (Scalars['BigInt'] | null),optionsExercised_lte?: (Scalars['BigInt'] | null),premiumEarned?: (Scalars['BigInt'] | null),premiumEarned_not?: (Scalars['BigInt'] | null),premiumEarned_in?: ((Scalars['BigInt'] | null)[] | null),premiumEarned_not_in?: ((Scalars['BigInt'] | null)[] | null),premiumEarned_gt?: (Scalars['BigInt'] | null),premiumEarned_lt?: (Scalars['BigInt'] | null),premiumEarned_gte?: (Scalars['BigInt'] | null),premiumEarned_lte?: (Scalars['BigInt'] | null),fee?: (Scalars['BigInt'] | null),fee_not?: (Scalars['BigInt'] | null),fee_in?: ((Scalars['BigInt'] | null)[] | null),fee_not_in?: ((Scalars['BigInt'] | null)[] | null),fee_gt?: (Scalars['BigInt'] | null),fee_lt?: (Scalars['BigInt'] | null),fee_gte?: (Scalars['BigInt'] | null),fee_lte?: (Scalars['BigInt'] | null),settled?: (Scalars['Boolean'] | null),settled_not?: (Scalars['Boolean'] | null),settled_in?: ((Scalars['Boolean'] | null)[] | null),settled_not_in?: ((Scalars['Boolean'] | null)[] | null),updatedAt?: (Scalars['BigInt'] | null),updatedAt_not?: (Scalars['BigInt'] | null),updatedAt_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_gt?: (Scalars['BigInt'] | null),updatedAt_lt?: (Scalars['BigInt'] | null),updatedAt_gte?: (Scalars['BigInt'] | null),updatedAt_lte?: (Scalars['BigInt'] | null),updatedAtBlock?: (Scalars['BigInt'] | null),updatedAtBlock_not?: (Scalars['BigInt'] | null),updatedAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_gt?: (Scalars['BigInt'] | null),updatedAtBlock_lt?: (Scalars['BigInt'] | null),updatedAtBlock_gte?: (Scalars['BigInt'] | null),updatedAtBlock_lte?: (Scalars['BigInt'] | null)}

export interface OptionPositionFilter {AND?: ((OptionPositionFilter | null)[] | null),OR?: ((OptionPositionFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),tokenId?: (Scalars['BigInt'] | null),tokenId_not?: (Scalars['BigInt'] | null),tokenId_in?: ((Scalars['BigInt'] | null)[] | null),tokenId_not_in?: ((Scalars['BigInt'] | null)[] | null),tokenId_gt?: (Scalars['BigInt'] | null),tokenId_lt?: (Scalars['BigInt'] | null),tokenId_gte?: (Scalars['BigInt'] | null),tokenId_lte?: (Scalars['BigInt'] | null),address?: (Scalars['String'] | null),address_not?: (Scalars['String'] | null),address_in?: ((Scalars['String'] | null)[] | null),address_not_in?: ((Scalars['String'] | null)[] | null),address_contains?: (Scalars['String'] | null),address_not_contains?: (Scalars['String'] | null),address_starts_with?: (Scalars['String'] | null),address_ends_with?: (Scalars['String'] | null),address_not_starts_with?: (Scalars['String'] | null),address_not_ends_with?: (Scalars['String'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),optionMarketId?: (Scalars['String'] | null),optionMarketId_not?: (Scalars['String'] | null),optionMarketId_in?: ((Scalars['String'] | null)[] | null),optionMarketId_not_in?: ((Scalars['String'] | null)[] | null),optionMarketId_contains?: (Scalars['String'] | null),optionMarketId_not_contains?: (Scalars['String'] | null),optionMarketId_starts_with?: (Scalars['String'] | null),optionMarketId_ends_with?: (Scalars['String'] | null),optionMarketId_not_starts_with?: (Scalars['String'] | null),optionMarketId_not_ends_with?: (Scalars['String'] | null),user?: (Scalars['String'] | null),user_not?: (Scalars['String'] | null),user_in?: ((Scalars['String'] | null)[] | null),user_not_in?: ((Scalars['String'] | null)[] | null),user_contains?: (Scalars['String'] | null),user_not_contains?: (Scalars['String'] | null),user_starts_with?: (Scalars['String'] | null),user_ends_with?: (Scalars['String'] | null),user_not_starts_with?: (Scalars['String'] | null),user_not_ends_with?: (Scalars['String'] | null),premium?: (Scalars['BigInt'] | null),premium_not?: (Scalars['BigInt'] | null),premium_in?: ((Scalars['BigInt'] | null)[] | null),premium_not_in?: ((Scalars['BigInt'] | null)[] | null),premium_gt?: (Scalars['BigInt'] | null),premium_lt?: (Scalars['BigInt'] | null),premium_gte?: (Scalars['BigInt'] | null),premium_lte?: (Scalars['BigInt'] | null),fee?: (Scalars['BigInt'] | null),fee_not?: (Scalars['BigInt'] | null),fee_in?: ((Scalars['BigInt'] | null)[] | null),fee_not_in?: ((Scalars['BigInt'] | null)[] | null),fee_gt?: (Scalars['BigInt'] | null),fee_lt?: (Scalars['BigInt'] | null),fee_gte?: (Scalars['BigInt'] | null),fee_lte?: (Scalars['BigInt'] | null),profit?: (Scalars['BigInt'] | null),profit_not?: (Scalars['BigInt'] | null),profit_in?: ((Scalars['BigInt'] | null)[] | null),profit_not_in?: ((Scalars['BigInt'] | null)[] | null),profit_gt?: (Scalars['BigInt'] | null),profit_lt?: (Scalars['BigInt'] | null),profit_gte?: (Scalars['BigInt'] | null),profit_lte?: (Scalars['BigInt'] | null),amount?: (Scalars['BigInt'] | null),amount_not?: (Scalars['BigInt'] | null),amount_in?: ((Scalars['BigInt'] | null)[] | null),amount_not_in?: ((Scalars['BigInt'] | null)[] | null),amount_gt?: (Scalars['BigInt'] | null),amount_lt?: (Scalars['BigInt'] | null),amount_gte?: (Scalars['BigInt'] | null),amount_lte?: (Scalars['BigInt'] | null),averagePrice?: (Scalars['BigInt'] | null),averagePrice_not?: (Scalars['BigInt'] | null),averagePrice_in?: ((Scalars['BigInt'] | null)[] | null),averagePrice_not_in?: ((Scalars['BigInt'] | null)[] | null),averagePrice_gt?: (Scalars['BigInt'] | null),averagePrice_lt?: (Scalars['BigInt'] | null),averagePrice_gte?: (Scalars['BigInt'] | null),averagePrice_lte?: (Scalars['BigInt'] | null),updatedAt?: (Scalars['BigInt'] | null),updatedAt_not?: (Scalars['BigInt'] | null),updatedAt_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_gt?: (Scalars['BigInt'] | null),updatedAt_lt?: (Scalars['BigInt'] | null),updatedAt_gte?: (Scalars['BigInt'] | null),updatedAt_lte?: (Scalars['BigInt'] | null),updatedAtBlock?: (Scalars['BigInt'] | null),updatedAtBlock_not?: (Scalars['BigInt'] | null),updatedAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_gt?: (Scalars['BigInt'] | null),updatedAtBlock_lt?: (Scalars['BigInt'] | null),updatedAtBlock_gte?: (Scalars['BigInt'] | null),updatedAtBlock_lte?: (Scalars['BigInt'] | null)}

export interface DepositHistoryPageGenqlSelection{
    items?: DepositHistoryGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface DepositHistoryGenqlSelection{
    id?: boolean | number
    optionId?: boolean | number
    marketId?: boolean | number
    user?: UserGenqlSelection
    receiver?: boolean | number
    amount?: boolean | number
    collateralAmount?: boolean | number
    fee?: boolean | number
    transactionHash?: boolean | number
    blockNumber?: boolean | number
    timestamp?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface DepositHistoryFilter {AND?: ((DepositHistoryFilter | null)[] | null),OR?: ((DepositHistoryFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),user?: (Scalars['String'] | null),user_not?: (Scalars['String'] | null),user_in?: ((Scalars['String'] | null)[] | null),user_not_in?: ((Scalars['String'] | null)[] | null),user_contains?: (Scalars['String'] | null),user_not_contains?: (Scalars['String'] | null),user_starts_with?: (Scalars['String'] | null),user_ends_with?: (Scalars['String'] | null),user_not_starts_with?: (Scalars['String'] | null),user_not_ends_with?: (Scalars['String'] | null),receiver?: (Scalars['String'] | null),receiver_not?: (Scalars['String'] | null),receiver_in?: ((Scalars['String'] | null)[] | null),receiver_not_in?: ((Scalars['String'] | null)[] | null),receiver_contains?: (Scalars['String'] | null),receiver_not_contains?: (Scalars['String'] | null),receiver_starts_with?: (Scalars['String'] | null),receiver_ends_with?: (Scalars['String'] | null),receiver_not_starts_with?: (Scalars['String'] | null),receiver_not_ends_with?: (Scalars['String'] | null),amount?: (Scalars['BigInt'] | null),amount_not?: (Scalars['BigInt'] | null),amount_in?: ((Scalars['BigInt'] | null)[] | null),amount_not_in?: ((Scalars['BigInt'] | null)[] | null),amount_gt?: (Scalars['BigInt'] | null),amount_lt?: (Scalars['BigInt'] | null),amount_gte?: (Scalars['BigInt'] | null),amount_lte?: (Scalars['BigInt'] | null),collateralAmount?: (Scalars['BigInt'] | null),collateralAmount_not?: (Scalars['BigInt'] | null),collateralAmount_in?: ((Scalars['BigInt'] | null)[] | null),collateralAmount_not_in?: ((Scalars['BigInt'] | null)[] | null),collateralAmount_gt?: (Scalars['BigInt'] | null),collateralAmount_lt?: (Scalars['BigInt'] | null),collateralAmount_gte?: (Scalars['BigInt'] | null),collateralAmount_lte?: (Scalars['BigInt'] | null),fee?: (Scalars['BigInt'] | null),fee_not?: (Scalars['BigInt'] | null),fee_in?: ((Scalars['BigInt'] | null)[] | null),fee_not_in?: ((Scalars['BigInt'] | null)[] | null),fee_gt?: (Scalars['BigInt'] | null),fee_lt?: (Scalars['BigInt'] | null),fee_gte?: (Scalars['BigInt'] | null),fee_lte?: (Scalars['BigInt'] | null),transactionHash?: (Scalars['String'] | null),transactionHash_not?: (Scalars['String'] | null),transactionHash_in?: ((Scalars['String'] | null)[] | null),transactionHash_not_in?: ((Scalars['String'] | null)[] | null),transactionHash_contains?: (Scalars['String'] | null),transactionHash_not_contains?: (Scalars['String'] | null),transactionHash_starts_with?: (Scalars['String'] | null),transactionHash_ends_with?: (Scalars['String'] | null),transactionHash_not_starts_with?: (Scalars['String'] | null),transactionHash_not_ends_with?: (Scalars['String'] | null),blockNumber?: (Scalars['BigInt'] | null),blockNumber_not?: (Scalars['BigInt'] | null),blockNumber_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_not_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_gt?: (Scalars['BigInt'] | null),blockNumber_lt?: (Scalars['BigInt'] | null),blockNumber_gte?: (Scalars['BigInt'] | null),blockNumber_lte?: (Scalars['BigInt'] | null),timestamp?: (Scalars['BigInt'] | null),timestamp_not?: (Scalars['BigInt'] | null),timestamp_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_gt?: (Scalars['BigInt'] | null),timestamp_lt?: (Scalars['BigInt'] | null),timestamp_gte?: (Scalars['BigInt'] | null),timestamp_lte?: (Scalars['BigInt'] | null)}

export interface TransferDepositHistoryPageGenqlSelection{
    items?: TransferDepositHistoryGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface TransferDepositHistoryGenqlSelection{
    id?: boolean | number
    optionId?: boolean | number
    marketId?: boolean | number
    user?: UserGenqlSelection
    receiver?: UserGenqlSelection
    amount?: boolean | number
    collateralAmount?: boolean | number
    fee?: boolean | number
    transactionHash?: boolean | number
    blockNumber?: boolean | number
    timestamp?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface TransferDepositHistoryFilter {AND?: ((TransferDepositHistoryFilter | null)[] | null),OR?: ((TransferDepositHistoryFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),user?: (Scalars['String'] | null),user_not?: (Scalars['String'] | null),user_in?: ((Scalars['String'] | null)[] | null),user_not_in?: ((Scalars['String'] | null)[] | null),user_contains?: (Scalars['String'] | null),user_not_contains?: (Scalars['String'] | null),user_starts_with?: (Scalars['String'] | null),user_ends_with?: (Scalars['String'] | null),user_not_starts_with?: (Scalars['String'] | null),user_not_ends_with?: (Scalars['String'] | null),receiver?: (Scalars['String'] | null),receiver_not?: (Scalars['String'] | null),receiver_in?: ((Scalars['String'] | null)[] | null),receiver_not_in?: ((Scalars['String'] | null)[] | null),receiver_contains?: (Scalars['String'] | null),receiver_not_contains?: (Scalars['String'] | null),receiver_starts_with?: (Scalars['String'] | null),receiver_ends_with?: (Scalars['String'] | null),receiver_not_starts_with?: (Scalars['String'] | null),receiver_not_ends_with?: (Scalars['String'] | null),amount?: (Scalars['BigInt'] | null),amount_not?: (Scalars['BigInt'] | null),amount_in?: ((Scalars['BigInt'] | null)[] | null),amount_not_in?: ((Scalars['BigInt'] | null)[] | null),amount_gt?: (Scalars['BigInt'] | null),amount_lt?: (Scalars['BigInt'] | null),amount_gte?: (Scalars['BigInt'] | null),amount_lte?: (Scalars['BigInt'] | null),collateralAmount?: (Scalars['BigInt'] | null),collateralAmount_not?: (Scalars['BigInt'] | null),collateralAmount_in?: ((Scalars['BigInt'] | null)[] | null),collateralAmount_not_in?: ((Scalars['BigInt'] | null)[] | null),collateralAmount_gt?: (Scalars['BigInt'] | null),collateralAmount_lt?: (Scalars['BigInt'] | null),collateralAmount_gte?: (Scalars['BigInt'] | null),collateralAmount_lte?: (Scalars['BigInt'] | null),fee?: (Scalars['BigInt'] | null),fee_not?: (Scalars['BigInt'] | null),fee_in?: ((Scalars['BigInt'] | null)[] | null),fee_not_in?: ((Scalars['BigInt'] | null)[] | null),fee_gt?: (Scalars['BigInt'] | null),fee_lt?: (Scalars['BigInt'] | null),fee_gte?: (Scalars['BigInt'] | null),fee_lte?: (Scalars['BigInt'] | null),transactionHash?: (Scalars['String'] | null),transactionHash_not?: (Scalars['String'] | null),transactionHash_in?: ((Scalars['String'] | null)[] | null),transactionHash_not_in?: ((Scalars['String'] | null)[] | null),transactionHash_contains?: (Scalars['String'] | null),transactionHash_not_contains?: (Scalars['String'] | null),transactionHash_starts_with?: (Scalars['String'] | null),transactionHash_ends_with?: (Scalars['String'] | null),transactionHash_not_starts_with?: (Scalars['String'] | null),transactionHash_not_ends_with?: (Scalars['String'] | null),blockNumber?: (Scalars['BigInt'] | null),blockNumber_not?: (Scalars['BigInt'] | null),blockNumber_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_not_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_gt?: (Scalars['BigInt'] | null),blockNumber_lt?: (Scalars['BigInt'] | null),blockNumber_gte?: (Scalars['BigInt'] | null),blockNumber_lte?: (Scalars['BigInt'] | null),timestamp?: (Scalars['BigInt'] | null),timestamp_not?: (Scalars['BigInt'] | null),timestamp_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_gt?: (Scalars['BigInt'] | null),timestamp_lt?: (Scalars['BigInt'] | null),timestamp_gte?: (Scalars['BigInt'] | null),timestamp_lte?: (Scalars['BigInt'] | null)}

export interface PurchaseHistoryPageGenqlSelection{
    items?: PurchaseHistoryGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PurchaseHistoryGenqlSelection{
    id?: boolean | number
    optionId?: boolean | number
    marketId?: boolean | number
    maker?: UserGenqlSelection
    receiver?: UserGenqlSelection
    purchaser?: boolean | number
    amount?: boolean | number
    premiumAmount?: boolean | number
    fee?: boolean | number
    optionShares?: boolean | number
    sharesUtilized?: boolean | number
    transactionHash?: boolean | number
    blockNumber?: boolean | number
    timestamp?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface PurchaseHistoryFilter {AND?: ((PurchaseHistoryFilter | null)[] | null),OR?: ((PurchaseHistoryFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),maker?: (Scalars['String'] | null),maker_not?: (Scalars['String'] | null),maker_in?: ((Scalars['String'] | null)[] | null),maker_not_in?: ((Scalars['String'] | null)[] | null),maker_contains?: (Scalars['String'] | null),maker_not_contains?: (Scalars['String'] | null),maker_starts_with?: (Scalars['String'] | null),maker_ends_with?: (Scalars['String'] | null),maker_not_starts_with?: (Scalars['String'] | null),maker_not_ends_with?: (Scalars['String'] | null),receiver?: (Scalars['String'] | null),receiver_not?: (Scalars['String'] | null),receiver_in?: ((Scalars['String'] | null)[] | null),receiver_not_in?: ((Scalars['String'] | null)[] | null),receiver_contains?: (Scalars['String'] | null),receiver_not_contains?: (Scalars['String'] | null),receiver_starts_with?: (Scalars['String'] | null),receiver_ends_with?: (Scalars['String'] | null),receiver_not_starts_with?: (Scalars['String'] | null),receiver_not_ends_with?: (Scalars['String'] | null),purchaser?: (Scalars['String'] | null),purchaser_not?: (Scalars['String'] | null),purchaser_in?: ((Scalars['String'] | null)[] | null),purchaser_not_in?: ((Scalars['String'] | null)[] | null),purchaser_contains?: (Scalars['String'] | null),purchaser_not_contains?: (Scalars['String'] | null),purchaser_starts_with?: (Scalars['String'] | null),purchaser_ends_with?: (Scalars['String'] | null),purchaser_not_starts_with?: (Scalars['String'] | null),purchaser_not_ends_with?: (Scalars['String'] | null),amount?: (Scalars['BigInt'] | null),amount_not?: (Scalars['BigInt'] | null),amount_in?: ((Scalars['BigInt'] | null)[] | null),amount_not_in?: ((Scalars['BigInt'] | null)[] | null),amount_gt?: (Scalars['BigInt'] | null),amount_lt?: (Scalars['BigInt'] | null),amount_gte?: (Scalars['BigInt'] | null),amount_lte?: (Scalars['BigInt'] | null),premiumAmount?: (Scalars['BigInt'] | null),premiumAmount_not?: (Scalars['BigInt'] | null),premiumAmount_in?: ((Scalars['BigInt'] | null)[] | null),premiumAmount_not_in?: ((Scalars['BigInt'] | null)[] | null),premiumAmount_gt?: (Scalars['BigInt'] | null),premiumAmount_lt?: (Scalars['BigInt'] | null),premiumAmount_gte?: (Scalars['BigInt'] | null),premiumAmount_lte?: (Scalars['BigInt'] | null),fee?: (Scalars['BigInt'] | null),fee_not?: (Scalars['BigInt'] | null),fee_in?: ((Scalars['BigInt'] | null)[] | null),fee_not_in?: ((Scalars['BigInt'] | null)[] | null),fee_gt?: (Scalars['BigInt'] | null),fee_lt?: (Scalars['BigInt'] | null),fee_gte?: (Scalars['BigInt'] | null),fee_lte?: (Scalars['BigInt'] | null),optionShares?: (Scalars['BigInt'] | null),optionShares_not?: (Scalars['BigInt'] | null),optionShares_in?: ((Scalars['BigInt'] | null)[] | null),optionShares_not_in?: ((Scalars['BigInt'] | null)[] | null),optionShares_gt?: (Scalars['BigInt'] | null),optionShares_lt?: (Scalars['BigInt'] | null),optionShares_gte?: (Scalars['BigInt'] | null),optionShares_lte?: (Scalars['BigInt'] | null),sharesUtilized?: (Scalars['BigInt'] | null),sharesUtilized_not?: (Scalars['BigInt'] | null),sharesUtilized_in?: ((Scalars['BigInt'] | null)[] | null),sharesUtilized_not_in?: ((Scalars['BigInt'] | null)[] | null),sharesUtilized_gt?: (Scalars['BigInt'] | null),sharesUtilized_lt?: (Scalars['BigInt'] | null),sharesUtilized_gte?: (Scalars['BigInt'] | null),sharesUtilized_lte?: (Scalars['BigInt'] | null),transactionHash?: (Scalars['String'] | null),transactionHash_not?: (Scalars['String'] | null),transactionHash_in?: ((Scalars['String'] | null)[] | null),transactionHash_not_in?: ((Scalars['String'] | null)[] | null),transactionHash_contains?: (Scalars['String'] | null),transactionHash_not_contains?: (Scalars['String'] | null),transactionHash_starts_with?: (Scalars['String'] | null),transactionHash_ends_with?: (Scalars['String'] | null),transactionHash_not_starts_with?: (Scalars['String'] | null),transactionHash_not_ends_with?: (Scalars['String'] | null),blockNumber?: (Scalars['BigInt'] | null),blockNumber_not?: (Scalars['BigInt'] | null),blockNumber_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_not_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_gt?: (Scalars['BigInt'] | null),blockNumber_lt?: (Scalars['BigInt'] | null),blockNumber_gte?: (Scalars['BigInt'] | null),blockNumber_lte?: (Scalars['BigInt'] | null),timestamp?: (Scalars['BigInt'] | null),timestamp_not?: (Scalars['BigInt'] | null),timestamp_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_gt?: (Scalars['BigInt'] | null),timestamp_lt?: (Scalars['BigInt'] | null),timestamp_gte?: (Scalars['BigInt'] | null),timestamp_lte?: (Scalars['BigInt'] | null)}

export interface ExerciseHistoryPageGenqlSelection{
    items?: ExerciseHistoryGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ExerciseHistoryGenqlSelection{
    id?: boolean | number
    optionId?: boolean | number
    marketId?: boolean | number
    maker?: UserGenqlSelection
    receiver?: UserGenqlSelection
    exerciser?: boolean | number
    amount?: boolean | number
    profitAmount?: boolean | number
    fee?: boolean | number
    optionTokensBurnt?: boolean | number
    sharesUnutilized?: boolean | number
    makerLoss?: boolean | number
    purchaserProfit?: boolean | number
    transactionHash?: boolean | number
    blockNumber?: boolean | number
    timestamp?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface ExerciseHistoryFilter {AND?: ((ExerciseHistoryFilter | null)[] | null),OR?: ((ExerciseHistoryFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),maker?: (Scalars['String'] | null),maker_not?: (Scalars['String'] | null),maker_in?: ((Scalars['String'] | null)[] | null),maker_not_in?: ((Scalars['String'] | null)[] | null),maker_contains?: (Scalars['String'] | null),maker_not_contains?: (Scalars['String'] | null),maker_starts_with?: (Scalars['String'] | null),maker_ends_with?: (Scalars['String'] | null),maker_not_starts_with?: (Scalars['String'] | null),maker_not_ends_with?: (Scalars['String'] | null),receiver?: (Scalars['String'] | null),receiver_not?: (Scalars['String'] | null),receiver_in?: ((Scalars['String'] | null)[] | null),receiver_not_in?: ((Scalars['String'] | null)[] | null),receiver_contains?: (Scalars['String'] | null),receiver_not_contains?: (Scalars['String'] | null),receiver_starts_with?: (Scalars['String'] | null),receiver_ends_with?: (Scalars['String'] | null),receiver_not_starts_with?: (Scalars['String'] | null),receiver_not_ends_with?: (Scalars['String'] | null),exerciser?: (Scalars['String'] | null),exerciser_not?: (Scalars['String'] | null),exerciser_in?: ((Scalars['String'] | null)[] | null),exerciser_not_in?: ((Scalars['String'] | null)[] | null),exerciser_contains?: (Scalars['String'] | null),exerciser_not_contains?: (Scalars['String'] | null),exerciser_starts_with?: (Scalars['String'] | null),exerciser_ends_with?: (Scalars['String'] | null),exerciser_not_starts_with?: (Scalars['String'] | null),exerciser_not_ends_with?: (Scalars['String'] | null),amount?: (Scalars['BigInt'] | null),amount_not?: (Scalars['BigInt'] | null),amount_in?: ((Scalars['BigInt'] | null)[] | null),amount_not_in?: ((Scalars['BigInt'] | null)[] | null),amount_gt?: (Scalars['BigInt'] | null),amount_lt?: (Scalars['BigInt'] | null),amount_gte?: (Scalars['BigInt'] | null),amount_lte?: (Scalars['BigInt'] | null),profitAmount?: (Scalars['BigInt'] | null),profitAmount_not?: (Scalars['BigInt'] | null),profitAmount_in?: ((Scalars['BigInt'] | null)[] | null),profitAmount_not_in?: ((Scalars['BigInt'] | null)[] | null),profitAmount_gt?: (Scalars['BigInt'] | null),profitAmount_lt?: (Scalars['BigInt'] | null),profitAmount_gte?: (Scalars['BigInt'] | null),profitAmount_lte?: (Scalars['BigInt'] | null),fee?: (Scalars['BigInt'] | null),fee_not?: (Scalars['BigInt'] | null),fee_in?: ((Scalars['BigInt'] | null)[] | null),fee_not_in?: ((Scalars['BigInt'] | null)[] | null),fee_gt?: (Scalars['BigInt'] | null),fee_lt?: (Scalars['BigInt'] | null),fee_gte?: (Scalars['BigInt'] | null),fee_lte?: (Scalars['BigInt'] | null),optionTokensBurnt?: (Scalars['BigInt'] | null),optionTokensBurnt_not?: (Scalars['BigInt'] | null),optionTokensBurnt_in?: ((Scalars['BigInt'] | null)[] | null),optionTokensBurnt_not_in?: ((Scalars['BigInt'] | null)[] | null),optionTokensBurnt_gt?: (Scalars['BigInt'] | null),optionTokensBurnt_lt?: (Scalars['BigInt'] | null),optionTokensBurnt_gte?: (Scalars['BigInt'] | null),optionTokensBurnt_lte?: (Scalars['BigInt'] | null),sharesUnutilized?: (Scalars['BigInt'] | null),sharesUnutilized_not?: (Scalars['BigInt'] | null),sharesUnutilized_in?: ((Scalars['BigInt'] | null)[] | null),sharesUnutilized_not_in?: ((Scalars['BigInt'] | null)[] | null),sharesUnutilized_gt?: (Scalars['BigInt'] | null),sharesUnutilized_lt?: (Scalars['BigInt'] | null),sharesUnutilized_gte?: (Scalars['BigInt'] | null),sharesUnutilized_lte?: (Scalars['BigInt'] | null),makerLoss?: (Scalars['BigInt'] | null),makerLoss_not?: (Scalars['BigInt'] | null),makerLoss_in?: ((Scalars['BigInt'] | null)[] | null),makerLoss_not_in?: ((Scalars['BigInt'] | null)[] | null),makerLoss_gt?: (Scalars['BigInt'] | null),makerLoss_lt?: (Scalars['BigInt'] | null),makerLoss_gte?: (Scalars['BigInt'] | null),makerLoss_lte?: (Scalars['BigInt'] | null),purchaserProfit?: (Scalars['BigInt'] | null),purchaserProfit_not?: (Scalars['BigInt'] | null),purchaserProfit_in?: ((Scalars['BigInt'] | null)[] | null),purchaserProfit_not_in?: ((Scalars['BigInt'] | null)[] | null),purchaserProfit_gt?: (Scalars['BigInt'] | null),purchaserProfit_lt?: (Scalars['BigInt'] | null),purchaserProfit_gte?: (Scalars['BigInt'] | null),purchaserProfit_lte?: (Scalars['BigInt'] | null),transactionHash?: (Scalars['String'] | null),transactionHash_not?: (Scalars['String'] | null),transactionHash_in?: ((Scalars['String'] | null)[] | null),transactionHash_not_in?: ((Scalars['String'] | null)[] | null),transactionHash_contains?: (Scalars['String'] | null),transactionHash_not_contains?: (Scalars['String'] | null),transactionHash_starts_with?: (Scalars['String'] | null),transactionHash_ends_with?: (Scalars['String'] | null),transactionHash_not_starts_with?: (Scalars['String'] | null),transactionHash_not_ends_with?: (Scalars['String'] | null),blockNumber?: (Scalars['BigInt'] | null),blockNumber_not?: (Scalars['BigInt'] | null),blockNumber_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_not_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_gt?: (Scalars['BigInt'] | null),blockNumber_lt?: (Scalars['BigInt'] | null),blockNumber_gte?: (Scalars['BigInt'] | null),blockNumber_lte?: (Scalars['BigInt'] | null),timestamp?: (Scalars['BigInt'] | null),timestamp_not?: (Scalars['BigInt'] | null),timestamp_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_gt?: (Scalars['BigInt'] | null),timestamp_lt?: (Scalars['BigInt'] | null),timestamp_gte?: (Scalars['BigInt'] | null),timestamp_lte?: (Scalars['BigInt'] | null)}

export interface UnwindHistoryPageGenqlSelection{
    items?: UnwindHistoryGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UnwindHistoryGenqlSelection{
    id?: boolean | number
    optionId?: boolean | number
    marketId?: boolean | number
    user?: UserGenqlSelection
    receiver?: UserGenqlSelection
    amount?: boolean | number
    collateralTokensToReturn?: boolean | number
    collateralSharesToBurn?: boolean | number
    optionSharesToBurn?: boolean | number
    transactionHash?: boolean | number
    blockNumber?: boolean | number
    timestamp?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UnwindHistoryFilter {AND?: ((UnwindHistoryFilter | null)[] | null),OR?: ((UnwindHistoryFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),user?: (Scalars['String'] | null),user_not?: (Scalars['String'] | null),user_in?: ((Scalars['String'] | null)[] | null),user_not_in?: ((Scalars['String'] | null)[] | null),user_contains?: (Scalars['String'] | null),user_not_contains?: (Scalars['String'] | null),user_starts_with?: (Scalars['String'] | null),user_ends_with?: (Scalars['String'] | null),user_not_starts_with?: (Scalars['String'] | null),user_not_ends_with?: (Scalars['String'] | null),receiver?: (Scalars['String'] | null),receiver_not?: (Scalars['String'] | null),receiver_in?: ((Scalars['String'] | null)[] | null),receiver_not_in?: ((Scalars['String'] | null)[] | null),receiver_contains?: (Scalars['String'] | null),receiver_not_contains?: (Scalars['String'] | null),receiver_starts_with?: (Scalars['String'] | null),receiver_ends_with?: (Scalars['String'] | null),receiver_not_starts_with?: (Scalars['String'] | null),receiver_not_ends_with?: (Scalars['String'] | null),amount?: (Scalars['BigInt'] | null),amount_not?: (Scalars['BigInt'] | null),amount_in?: ((Scalars['BigInt'] | null)[] | null),amount_not_in?: ((Scalars['BigInt'] | null)[] | null),amount_gt?: (Scalars['BigInt'] | null),amount_lt?: (Scalars['BigInt'] | null),amount_gte?: (Scalars['BigInt'] | null),amount_lte?: (Scalars['BigInt'] | null),collateralTokensToReturn?: (Scalars['BigInt'] | null),collateralTokensToReturn_not?: (Scalars['BigInt'] | null),collateralTokensToReturn_in?: ((Scalars['BigInt'] | null)[] | null),collateralTokensToReturn_not_in?: ((Scalars['BigInt'] | null)[] | null),collateralTokensToReturn_gt?: (Scalars['BigInt'] | null),collateralTokensToReturn_lt?: (Scalars['BigInt'] | null),collateralTokensToReturn_gte?: (Scalars['BigInt'] | null),collateralTokensToReturn_lte?: (Scalars['BigInt'] | null),collateralSharesToBurn?: (Scalars['BigInt'] | null),collateralSharesToBurn_not?: (Scalars['BigInt'] | null),collateralSharesToBurn_in?: ((Scalars['BigInt'] | null)[] | null),collateralSharesToBurn_not_in?: ((Scalars['BigInt'] | null)[] | null),collateralSharesToBurn_gt?: (Scalars['BigInt'] | null),collateralSharesToBurn_lt?: (Scalars['BigInt'] | null),collateralSharesToBurn_gte?: (Scalars['BigInt'] | null),collateralSharesToBurn_lte?: (Scalars['BigInt'] | null),optionSharesToBurn?: (Scalars['BigInt'] | null),optionSharesToBurn_not?: (Scalars['BigInt'] | null),optionSharesToBurn_in?: ((Scalars['BigInt'] | null)[] | null),optionSharesToBurn_not_in?: ((Scalars['BigInt'] | null)[] | null),optionSharesToBurn_gt?: (Scalars['BigInt'] | null),optionSharesToBurn_lt?: (Scalars['BigInt'] | null),optionSharesToBurn_gte?: (Scalars['BigInt'] | null),optionSharesToBurn_lte?: (Scalars['BigInt'] | null),transactionHash?: (Scalars['String'] | null),transactionHash_not?: (Scalars['String'] | null),transactionHash_in?: ((Scalars['String'] | null)[] | null),transactionHash_not_in?: ((Scalars['String'] | null)[] | null),transactionHash_contains?: (Scalars['String'] | null),transactionHash_not_contains?: (Scalars['String'] | null),transactionHash_starts_with?: (Scalars['String'] | null),transactionHash_ends_with?: (Scalars['String'] | null),transactionHash_not_starts_with?: (Scalars['String'] | null),transactionHash_not_ends_with?: (Scalars['String'] | null),blockNumber?: (Scalars['BigInt'] | null),blockNumber_not?: (Scalars['BigInt'] | null),blockNumber_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_not_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_gt?: (Scalars['BigInt'] | null),blockNumber_lt?: (Scalars['BigInt'] | null),blockNumber_gte?: (Scalars['BigInt'] | null),blockNumber_lte?: (Scalars['BigInt'] | null),timestamp?: (Scalars['BigInt'] | null),timestamp_not?: (Scalars['BigInt'] | null),timestamp_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_gt?: (Scalars['BigInt'] | null),timestamp_lt?: (Scalars['BigInt'] | null),timestamp_gte?: (Scalars['BigInt'] | null),timestamp_lte?: (Scalars['BigInt'] | null)}

export interface TransferPositionHistoryPageGenqlSelection{
    items?: TransferPositionHistoryGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface TransferPositionHistoryGenqlSelection{
    id?: boolean | number
    optionId?: boolean | number
    marketId?: boolean | number
    maker?: UserGenqlSelection
    receiver?: UserGenqlSelection
    purchaser?: boolean | number
    amount?: boolean | number
    premiumAmount?: boolean | number
    fee?: boolean | number
    optionShares?: boolean | number
    sharesUtilized?: boolean | number
    transactionHash?: boolean | number
    blockNumber?: boolean | number
    timestamp?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface TransferPositionHistoryFilter {AND?: ((TransferPositionHistoryFilter | null)[] | null),OR?: ((TransferPositionHistoryFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),maker?: (Scalars['String'] | null),maker_not?: (Scalars['String'] | null),maker_in?: ((Scalars['String'] | null)[] | null),maker_not_in?: ((Scalars['String'] | null)[] | null),maker_contains?: (Scalars['String'] | null),maker_not_contains?: (Scalars['String'] | null),maker_starts_with?: (Scalars['String'] | null),maker_ends_with?: (Scalars['String'] | null),maker_not_starts_with?: (Scalars['String'] | null),maker_not_ends_with?: (Scalars['String'] | null),receiver?: (Scalars['String'] | null),receiver_not?: (Scalars['String'] | null),receiver_in?: ((Scalars['String'] | null)[] | null),receiver_not_in?: ((Scalars['String'] | null)[] | null),receiver_contains?: (Scalars['String'] | null),receiver_not_contains?: (Scalars['String'] | null),receiver_starts_with?: (Scalars['String'] | null),receiver_ends_with?: (Scalars['String'] | null),receiver_not_starts_with?: (Scalars['String'] | null),receiver_not_ends_with?: (Scalars['String'] | null),purchaser?: (Scalars['String'] | null),purchaser_not?: (Scalars['String'] | null),purchaser_in?: ((Scalars['String'] | null)[] | null),purchaser_not_in?: ((Scalars['String'] | null)[] | null),purchaser_contains?: (Scalars['String'] | null),purchaser_not_contains?: (Scalars['String'] | null),purchaser_starts_with?: (Scalars['String'] | null),purchaser_ends_with?: (Scalars['String'] | null),purchaser_not_starts_with?: (Scalars['String'] | null),purchaser_not_ends_with?: (Scalars['String'] | null),amount?: (Scalars['BigInt'] | null),amount_not?: (Scalars['BigInt'] | null),amount_in?: ((Scalars['BigInt'] | null)[] | null),amount_not_in?: ((Scalars['BigInt'] | null)[] | null),amount_gt?: (Scalars['BigInt'] | null),amount_lt?: (Scalars['BigInt'] | null),amount_gte?: (Scalars['BigInt'] | null),amount_lte?: (Scalars['BigInt'] | null),premiumAmount?: (Scalars['BigInt'] | null),premiumAmount_not?: (Scalars['BigInt'] | null),premiumAmount_in?: ((Scalars['BigInt'] | null)[] | null),premiumAmount_not_in?: ((Scalars['BigInt'] | null)[] | null),premiumAmount_gt?: (Scalars['BigInt'] | null),premiumAmount_lt?: (Scalars['BigInt'] | null),premiumAmount_gte?: (Scalars['BigInt'] | null),premiumAmount_lte?: (Scalars['BigInt'] | null),fee?: (Scalars['BigInt'] | null),fee_not?: (Scalars['BigInt'] | null),fee_in?: ((Scalars['BigInt'] | null)[] | null),fee_not_in?: ((Scalars['BigInt'] | null)[] | null),fee_gt?: (Scalars['BigInt'] | null),fee_lt?: (Scalars['BigInt'] | null),fee_gte?: (Scalars['BigInt'] | null),fee_lte?: (Scalars['BigInt'] | null),optionShares?: (Scalars['BigInt'] | null),optionShares_not?: (Scalars['BigInt'] | null),optionShares_in?: ((Scalars['BigInt'] | null)[] | null),optionShares_not_in?: ((Scalars['BigInt'] | null)[] | null),optionShares_gt?: (Scalars['BigInt'] | null),optionShares_lt?: (Scalars['BigInt'] | null),optionShares_gte?: (Scalars['BigInt'] | null),optionShares_lte?: (Scalars['BigInt'] | null),sharesUtilized?: (Scalars['BigInt'] | null),sharesUtilized_not?: (Scalars['BigInt'] | null),sharesUtilized_in?: ((Scalars['BigInt'] | null)[] | null),sharesUtilized_not_in?: ((Scalars['BigInt'] | null)[] | null),sharesUtilized_gt?: (Scalars['BigInt'] | null),sharesUtilized_lt?: (Scalars['BigInt'] | null),sharesUtilized_gte?: (Scalars['BigInt'] | null),sharesUtilized_lte?: (Scalars['BigInt'] | null),transactionHash?: (Scalars['String'] | null),transactionHash_not?: (Scalars['String'] | null),transactionHash_in?: ((Scalars['String'] | null)[] | null),transactionHash_not_in?: ((Scalars['String'] | null)[] | null),transactionHash_contains?: (Scalars['String'] | null),transactionHash_not_contains?: (Scalars['String'] | null),transactionHash_starts_with?: (Scalars['String'] | null),transactionHash_ends_with?: (Scalars['String'] | null),transactionHash_not_starts_with?: (Scalars['String'] | null),transactionHash_not_ends_with?: (Scalars['String'] | null),blockNumber?: (Scalars['BigInt'] | null),blockNumber_not?: (Scalars['BigInt'] | null),blockNumber_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_not_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_gt?: (Scalars['BigInt'] | null),blockNumber_lt?: (Scalars['BigInt'] | null),blockNumber_gte?: (Scalars['BigInt'] | null),blockNumber_lte?: (Scalars['BigInt'] | null),timestamp?: (Scalars['BigInt'] | null),timestamp_not?: (Scalars['BigInt'] | null),timestamp_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_gt?: (Scalars['BigInt'] | null),timestamp_lt?: (Scalars['BigInt'] | null),timestamp_gte?: (Scalars['BigInt'] | null),timestamp_lte?: (Scalars['BigInt'] | null)}

export interface SettlementHistoryPageGenqlSelection{
    items?: SettlementHistoryGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface SettlementHistoryGenqlSelection{
    id?: boolean | number
    optionId?: boolean | number
    marketId?: boolean | number
    user?: UserGenqlSelection
    totalCollateralSettled?: boolean | number
    transactionHash?: boolean | number
    blockNumber?: boolean | number
    timestamp?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface SettlementHistoryFilter {AND?: ((SettlementHistoryFilter | null)[] | null),OR?: ((SettlementHistoryFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),user?: (Scalars['String'] | null),user_not?: (Scalars['String'] | null),user_in?: ((Scalars['String'] | null)[] | null),user_not_in?: ((Scalars['String'] | null)[] | null),user_contains?: (Scalars['String'] | null),user_not_contains?: (Scalars['String'] | null),user_starts_with?: (Scalars['String'] | null),user_ends_with?: (Scalars['String'] | null),user_not_starts_with?: (Scalars['String'] | null),user_not_ends_with?: (Scalars['String'] | null),totalCollateralSettled?: (Scalars['BigInt'] | null),totalCollateralSettled_not?: (Scalars['BigInt'] | null),totalCollateralSettled_in?: ((Scalars['BigInt'] | null)[] | null),totalCollateralSettled_not_in?: ((Scalars['BigInt'] | null)[] | null),totalCollateralSettled_gt?: (Scalars['BigInt'] | null),totalCollateralSettled_lt?: (Scalars['BigInt'] | null),totalCollateralSettled_gte?: (Scalars['BigInt'] | null),totalCollateralSettled_lte?: (Scalars['BigInt'] | null),transactionHash?: (Scalars['String'] | null),transactionHash_not?: (Scalars['String'] | null),transactionHash_in?: ((Scalars['String'] | null)[] | null),transactionHash_not_in?: ((Scalars['String'] | null)[] | null),transactionHash_contains?: (Scalars['String'] | null),transactionHash_not_contains?: (Scalars['String'] | null),transactionHash_starts_with?: (Scalars['String'] | null),transactionHash_ends_with?: (Scalars['String'] | null),transactionHash_not_starts_with?: (Scalars['String'] | null),transactionHash_not_ends_with?: (Scalars['String'] | null),blockNumber?: (Scalars['BigInt'] | null),blockNumber_not?: (Scalars['BigInt'] | null),blockNumber_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_not_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_gt?: (Scalars['BigInt'] | null),blockNumber_lt?: (Scalars['BigInt'] | null),blockNumber_gte?: (Scalars['BigInt'] | null),blockNumber_lte?: (Scalars['BigInt'] | null),timestamp?: (Scalars['BigInt'] | null),timestamp_not?: (Scalars['BigInt'] | null),timestamp_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_gt?: (Scalars['BigInt'] | null),timestamp_lt?: (Scalars['BigInt'] | null),timestamp_gte?: (Scalars['BigInt'] | null),timestamp_lte?: (Scalars['BigInt'] | null)}

export interface OptionMarketFilter {AND?: ((OptionMarketFilter | null)[] | null),OR?: ((OptionMarketFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),globalId?: (Scalars['String'] | null),globalId_not?: (Scalars['String'] | null),globalId_in?: ((Scalars['String'] | null)[] | null),globalId_not_in?: ((Scalars['String'] | null)[] | null),globalId_contains?: (Scalars['String'] | null),globalId_not_contains?: (Scalars['String'] | null),globalId_starts_with?: (Scalars['String'] | null),globalId_ends_with?: (Scalars['String'] | null),globalId_not_starts_with?: (Scalars['String'] | null),globalId_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),callToken?: (Scalars['String'] | null),callToken_not?: (Scalars['String'] | null),callToken_in?: ((Scalars['String'] | null)[] | null),callToken_not_in?: ((Scalars['String'] | null)[] | null),callToken_contains?: (Scalars['String'] | null),callToken_not_contains?: (Scalars['String'] | null),callToken_starts_with?: (Scalars['String'] | null),callToken_ends_with?: (Scalars['String'] | null),callToken_not_starts_with?: (Scalars['String'] | null),callToken_not_ends_with?: (Scalars['String'] | null),putToken?: (Scalars['String'] | null),putToken_not?: (Scalars['String'] | null),putToken_in?: ((Scalars['String'] | null)[] | null),putToken_not_in?: ((Scalars['String'] | null)[] | null),putToken_contains?: (Scalars['String'] | null),putToken_not_contains?: (Scalars['String'] | null),putToken_starts_with?: (Scalars['String'] | null),putToken_ends_with?: (Scalars['String'] | null),putToken_not_starts_with?: (Scalars['String'] | null),putToken_not_ends_with?: (Scalars['String'] | null),expiry?: (Scalars['BigInt'] | null),expiry_not?: (Scalars['BigInt'] | null),expiry_in?: ((Scalars['BigInt'] | null)[] | null),expiry_not_in?: ((Scalars['BigInt'] | null)[] | null),expiry_gt?: (Scalars['BigInt'] | null),expiry_lt?: (Scalars['BigInt'] | null),expiry_gte?: (Scalars['BigInt'] | null),expiry_lte?: (Scalars['BigInt'] | null),maxTTL?: (Scalars['BigInt'] | null),maxTTL_not?: (Scalars['BigInt'] | null),maxTTL_in?: ((Scalars['BigInt'] | null)[] | null),maxTTL_not_in?: ((Scalars['BigInt'] | null)[] | null),maxTTL_gt?: (Scalars['BigInt'] | null),maxTTL_lt?: (Scalars['BigInt'] | null),maxTTL_gte?: (Scalars['BigInt'] | null),maxTTL_lte?: (Scalars['BigInt'] | null),strategy?: (Scalars['String'] | null),strategy_not?: (Scalars['String'] | null),strategy_in?: ((Scalars['String'] | null)[] | null),strategy_not_in?: ((Scalars['String'] | null)[] | null),strategy_contains?: (Scalars['String'] | null),strategy_not_contains?: (Scalars['String'] | null),strategy_starts_with?: (Scalars['String'] | null),strategy_ends_with?: (Scalars['String'] | null),strategy_not_starts_with?: (Scalars['String'] | null),strategy_not_ends_with?: (Scalars['String'] | null),collateralToken?: (Scalars['String'] | null),collateralToken_not?: (Scalars['String'] | null),collateralToken_in?: ((Scalars['String'] | null)[] | null),collateralToken_not_in?: ((Scalars['String'] | null)[] | null),collateralToken_contains?: (Scalars['String'] | null),collateralToken_not_contains?: (Scalars['String'] | null),collateralToken_starts_with?: (Scalars['String'] | null),collateralToken_ends_with?: (Scalars['String'] | null),collateralToken_not_starts_with?: (Scalars['String'] | null),collateralToken_not_ends_with?: (Scalars['String'] | null),totalCollateral?: (Scalars['BigInt'] | null),totalCollateral_not?: (Scalars['BigInt'] | null),totalCollateral_in?: ((Scalars['BigInt'] | null)[] | null),totalCollateral_not_in?: ((Scalars['BigInt'] | null)[] | null),totalCollateral_gt?: (Scalars['BigInt'] | null),totalCollateral_lt?: (Scalars['BigInt'] | null),totalCollateral_gte?: (Scalars['BigInt'] | null),totalCollateral_lte?: (Scalars['BigInt'] | null),totalCollateralAmount?: (Scalars['BigInt'] | null),totalCollateralAmount_not?: (Scalars['BigInt'] | null),totalCollateralAmount_in?: ((Scalars['BigInt'] | null)[] | null),totalCollateralAmount_not_in?: ((Scalars['BigInt'] | null)[] | null),totalCollateralAmount_gt?: (Scalars['BigInt'] | null),totalCollateralAmount_lt?: (Scalars['BigInt'] | null),totalCollateralAmount_gte?: (Scalars['BigInt'] | null),totalCollateralAmount_lte?: (Scalars['BigInt'] | null),protocolFees?: (Scalars['BigInt'] | null),protocolFees_not?: (Scalars['BigInt'] | null),protocolFees_in?: ((Scalars['BigInt'] | null)[] | null),protocolFees_not_in?: ((Scalars['BigInt'] | null)[] | null),protocolFees_gt?: (Scalars['BigInt'] | null),protocolFees_lt?: (Scalars['BigInt'] | null),protocolFees_gte?: (Scalars['BigInt'] | null),protocolFees_lte?: (Scalars['BigInt'] | null),createdAt?: (Scalars['BigInt'] | null),createdAt_not?: (Scalars['BigInt'] | null),createdAt_in?: ((Scalars['BigInt'] | null)[] | null),createdAt_not_in?: ((Scalars['BigInt'] | null)[] | null),createdAt_gt?: (Scalars['BigInt'] | null),createdAt_lt?: (Scalars['BigInt'] | null),createdAt_gte?: (Scalars['BigInt'] | null),createdAt_lte?: (Scalars['BigInt'] | null),createdAtBlock?: (Scalars['BigInt'] | null),createdAtBlock_not?: (Scalars['BigInt'] | null),createdAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),createdAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),createdAtBlock_gt?: (Scalars['BigInt'] | null),createdAtBlock_lt?: (Scalars['BigInt'] | null),createdAtBlock_gte?: (Scalars['BigInt'] | null),createdAtBlock_lte?: (Scalars['BigInt'] | null),updatedAt?: (Scalars['BigInt'] | null),updatedAt_not?: (Scalars['BigInt'] | null),updatedAt_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_gt?: (Scalars['BigInt'] | null),updatedAt_lt?: (Scalars['BigInt'] | null),updatedAt_gte?: (Scalars['BigInt'] | null),updatedAt_lte?: (Scalars['BigInt'] | null),updatedAtBlock?: (Scalars['BigInt'] | null),updatedAtBlock_not?: (Scalars['BigInt'] | null),updatedAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_gt?: (Scalars['BigInt'] | null),updatedAtBlock_lt?: (Scalars['BigInt'] | null),updatedAtBlock_gte?: (Scalars['BigInt'] | null),updatedAtBlock_lte?: (Scalars['BigInt'] | null)}

export interface GlobalPageGenqlSelection{
    items?: GlobalGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface GlobalFilter {AND?: ((GlobalFilter | null)[] | null),OR?: ((GlobalFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),feeReceiver?: (Scalars['String'] | null),feeReceiver_not?: (Scalars['String'] | null),feeReceiver_in?: ((Scalars['String'] | null)[] | null),feeReceiver_not_in?: ((Scalars['String'] | null)[] | null),feeReceiver_contains?: (Scalars['String'] | null),feeReceiver_not_contains?: (Scalars['String'] | null),feeReceiver_starts_with?: (Scalars['String'] | null),feeReceiver_ends_with?: (Scalars['String'] | null),feeReceiver_not_starts_with?: (Scalars['String'] | null),feeReceiver_not_ends_with?: (Scalars['String'] | null),collateralTokenFactory?: (Scalars['String'] | null),collateralTokenFactory_not?: (Scalars['String'] | null),collateralTokenFactory_in?: ((Scalars['String'] | null)[] | null),collateralTokenFactory_not_in?: ((Scalars['String'] | null)[] | null),collateralTokenFactory_contains?: (Scalars['String'] | null),collateralTokenFactory_not_contains?: (Scalars['String'] | null),collateralTokenFactory_starts_with?: (Scalars['String'] | null),collateralTokenFactory_ends_with?: (Scalars['String'] | null),collateralTokenFactory_not_starts_with?: (Scalars['String'] | null),collateralTokenFactory_not_ends_with?: (Scalars['String'] | null),optionTokenFactory?: (Scalars['String'] | null),optionTokenFactory_not?: (Scalars['String'] | null),optionTokenFactory_in?: ((Scalars['String'] | null)[] | null),optionTokenFactory_not_in?: ((Scalars['String'] | null)[] | null),optionTokenFactory_contains?: (Scalars['String'] | null),optionTokenFactory_not_contains?: (Scalars['String'] | null),optionTokenFactory_starts_with?: (Scalars['String'] | null),optionTokenFactory_ends_with?: (Scalars['String'] | null),optionTokenFactory_not_starts_with?: (Scalars['String'] | null),optionTokenFactory_not_ends_with?: (Scalars['String'] | null),totalMarkets?: (Scalars['BigInt'] | null),totalMarkets_not?: (Scalars['BigInt'] | null),totalMarkets_in?: ((Scalars['BigInt'] | null)[] | null),totalMarkets_not_in?: ((Scalars['BigInt'] | null)[] | null),totalMarkets_gt?: (Scalars['BigInt'] | null),totalMarkets_lt?: (Scalars['BigInt'] | null),totalMarkets_gte?: (Scalars['BigInt'] | null),totalMarkets_lte?: (Scalars['BigInt'] | null),updatedAt?: (Scalars['BigInt'] | null),updatedAt_not?: (Scalars['BigInt'] | null),updatedAt_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_gt?: (Scalars['BigInt'] | null),updatedAt_lt?: (Scalars['BigInt'] | null),updatedAt_gte?: (Scalars['BigInt'] | null),updatedAt_lte?: (Scalars['BigInt'] | null),updatedAtBlock?: (Scalars['BigInt'] | null),updatedAtBlock_not?: (Scalars['BigInt'] | null),updatedAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_gt?: (Scalars['BigInt'] | null),updatedAtBlock_lt?: (Scalars['BigInt'] | null),updatedAtBlock_gte?: (Scalars['BigInt'] | null),updatedAtBlock_lte?: (Scalars['BigInt'] | null)}

export interface UserPageGenqlSelection{
    items?: UserGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface UserFilter {AND?: ((UserFilter | null)[] | null),OR?: ((UserFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),updatedAt?: (Scalars['BigInt'] | null),updatedAt_not?: (Scalars['BigInt'] | null),updatedAt_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_gt?: (Scalars['BigInt'] | null),updatedAt_lt?: (Scalars['BigInt'] | null),updatedAt_gte?: (Scalars['BigInt'] | null),updatedAt_lte?: (Scalars['BigInt'] | null),updatedAtBlock?: (Scalars['BigInt'] | null),updatedAtBlock_not?: (Scalars['BigInt'] | null),updatedAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_gt?: (Scalars['BigInt'] | null),updatedAtBlock_lt?: (Scalars['BigInt'] | null),updatedAtBlock_gte?: (Scalars['BigInt'] | null),updatedAtBlock_lte?: (Scalars['BigInt'] | null)}

export interface MarketStrategyPageGenqlSelection{
    items?: MarketStrategyGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface MarketStrategyFilter {AND?: ((MarketStrategyFilter | null)[] | null),OR?: ((MarketStrategyFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),finalFDV?: (Scalars['BigInt'] | null),finalFDV_not?: (Scalars['BigInt'] | null),finalFDV_in?: ((Scalars['BigInt'] | null)[] | null),finalFDV_not_in?: ((Scalars['BigInt'] | null)[] | null),finalFDV_gt?: (Scalars['BigInt'] | null),finalFDV_lt?: (Scalars['BigInt'] | null),finalFDV_gte?: (Scalars['BigInt'] | null),finalFDV_lte?: (Scalars['BigInt'] | null),deadline?: (Scalars['BigInt'] | null),deadline_not?: (Scalars['BigInt'] | null),deadline_in?: ((Scalars['BigInt'] | null)[] | null),deadline_not_in?: ((Scalars['BigInt'] | null)[] | null),deadline_gt?: (Scalars['BigInt'] | null),deadline_lt?: (Scalars['BigInt'] | null),deadline_gte?: (Scalars['BigInt'] | null),deadline_lte?: (Scalars['BigInt'] | null),bandPrecision?: (Scalars['BigInt'] | null),bandPrecision_not?: (Scalars['BigInt'] | null),bandPrecision_in?: ((Scalars['BigInt'] | null)[] | null),bandPrecision_not_in?: ((Scalars['BigInt'] | null)[] | null),bandPrecision_gt?: (Scalars['BigInt'] | null),bandPrecision_lt?: (Scalars['BigInt'] | null),bandPrecision_gte?: (Scalars['BigInt'] | null),bandPrecision_lte?: (Scalars['BigInt'] | null),collateralPerBandPrecision?: (Scalars['BigInt'] | null),collateralPerBandPrecision_not?: (Scalars['BigInt'] | null),collateralPerBandPrecision_in?: ((Scalars['BigInt'] | null)[] | null),collateralPerBandPrecision_not_in?: ((Scalars['BigInt'] | null)[] | null),collateralPerBandPrecision_gt?: (Scalars['BigInt'] | null),collateralPerBandPrecision_lt?: (Scalars['BigInt'] | null),collateralPerBandPrecision_gte?: (Scalars['BigInt'] | null),collateralPerBandPrecision_lte?: (Scalars['BigInt'] | null),premiumRate?: (Scalars['BigInt'] | null),premiumRate_not?: (Scalars['BigInt'] | null),premiumRate_in?: ((Scalars['BigInt'] | null)[] | null),premiumRate_not_in?: ((Scalars['BigInt'] | null)[] | null),premiumRate_gt?: (Scalars['BigInt'] | null),premiumRate_lt?: (Scalars['BigInt'] | null),premiumRate_gte?: (Scalars['BigInt'] | null),premiumRate_lte?: (Scalars['BigInt'] | null),depositFeeRate?: (Scalars['BigInt'] | null),depositFeeRate_not?: (Scalars['BigInt'] | null),depositFeeRate_in?: ((Scalars['BigInt'] | null)[] | null),depositFeeRate_not_in?: ((Scalars['BigInt'] | null)[] | null),depositFeeRate_gt?: (Scalars['BigInt'] | null),depositFeeRate_lt?: (Scalars['BigInt'] | null),depositFeeRate_gte?: (Scalars['BigInt'] | null),depositFeeRate_lte?: (Scalars['BigInt'] | null),purchaseFeeRate?: (Scalars['BigInt'] | null),purchaseFeeRate_not?: (Scalars['BigInt'] | null),purchaseFeeRate_in?: ((Scalars['BigInt'] | null)[] | null),purchaseFeeRate_not_in?: ((Scalars['BigInt'] | null)[] | null),purchaseFeeRate_gt?: (Scalars['BigInt'] | null),purchaseFeeRate_lt?: (Scalars['BigInt'] | null),purchaseFeeRate_gte?: (Scalars['BigInt'] | null),purchaseFeeRate_lte?: (Scalars['BigInt'] | null),settlementFeeRate?: (Scalars['BigInt'] | null),settlementFeeRate_not?: (Scalars['BigInt'] | null),settlementFeeRate_in?: ((Scalars['BigInt'] | null)[] | null),settlementFeeRate_not_in?: ((Scalars['BigInt'] | null)[] | null),settlementFeeRate_gt?: (Scalars['BigInt'] | null),settlementFeeRate_lt?: (Scalars['BigInt'] | null),settlementFeeRate_gte?: (Scalars['BigInt'] | null),settlementFeeRate_lte?: (Scalars['BigInt'] | null),collateralToken?: (Scalars['String'] | null),collateralToken_not?: (Scalars['String'] | null),collateralToken_in?: ((Scalars['String'] | null)[] | null),collateralToken_not_in?: ((Scalars['String'] | null)[] | null),collateralToken_contains?: (Scalars['String'] | null),collateralToken_not_contains?: (Scalars['String'] | null),collateralToken_starts_with?: (Scalars['String'] | null),collateralToken_ends_with?: (Scalars['String'] | null),collateralToken_not_starts_with?: (Scalars['String'] | null),collateralToken_not_ends_with?: (Scalars['String'] | null),createdAt?: (Scalars['BigInt'] | null),createdAt_not?: (Scalars['BigInt'] | null),createdAt_in?: ((Scalars['BigInt'] | null)[] | null),createdAt_not_in?: ((Scalars['BigInt'] | null)[] | null),createdAt_gt?: (Scalars['BigInt'] | null),createdAt_lt?: (Scalars['BigInt'] | null),createdAt_gte?: (Scalars['BigInt'] | null),createdAt_lte?: (Scalars['BigInt'] | null),createdAtBlock?: (Scalars['BigInt'] | null),createdAtBlock_not?: (Scalars['BigInt'] | null),createdAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),createdAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),createdAtBlock_gt?: (Scalars['BigInt'] | null),createdAtBlock_lt?: (Scalars['BigInt'] | null),createdAtBlock_gte?: (Scalars['BigInt'] | null),createdAtBlock_lte?: (Scalars['BigInt'] | null),updatedAt?: (Scalars['BigInt'] | null),updatedAt_not?: (Scalars['BigInt'] | null),updatedAt_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_gt?: (Scalars['BigInt'] | null),updatedAt_lt?: (Scalars['BigInt'] | null),updatedAt_gte?: (Scalars['BigInt'] | null),updatedAt_lte?: (Scalars['BigInt'] | null),updatedAtBlock?: (Scalars['BigInt'] | null),updatedAtBlock_not?: (Scalars['BigInt'] | null),updatedAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_gt?: (Scalars['BigInt'] | null),updatedAtBlock_lt?: (Scalars['BigInt'] | null),updatedAtBlock_gte?: (Scalars['BigInt'] | null),updatedAtBlock_lte?: (Scalars['BigInt'] | null)}

export interface OptionParamsPageGenqlSelection{
    items?: OptionParamsGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OptionParamsFilter {AND?: ((OptionParamsFilter | null)[] | null),OR?: ((OptionParamsFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),strikeLowerLimit?: (Scalars['BigInt'] | null),strikeLowerLimit_not?: (Scalars['BigInt'] | null),strikeLowerLimit_in?: ((Scalars['BigInt'] | null)[] | null),strikeLowerLimit_not_in?: ((Scalars['BigInt'] | null)[] | null),strikeLowerLimit_gt?: (Scalars['BigInt'] | null),strikeLowerLimit_lt?: (Scalars['BigInt'] | null),strikeLowerLimit_gte?: (Scalars['BigInt'] | null),strikeLowerLimit_lte?: (Scalars['BigInt'] | null),strikeUpperLimit?: (Scalars['BigInt'] | null),strikeUpperLimit_not?: (Scalars['BigInt'] | null),strikeUpperLimit_in?: ((Scalars['BigInt'] | null)[] | null),strikeUpperLimit_not_in?: ((Scalars['BigInt'] | null)[] | null),strikeUpperLimit_gt?: (Scalars['BigInt'] | null),strikeUpperLimit_lt?: (Scalars['BigInt'] | null),strikeUpperLimit_gte?: (Scalars['BigInt'] | null),strikeUpperLimit_lte?: (Scalars['BigInt'] | null),isPut?: (Scalars['Boolean'] | null),isPut_not?: (Scalars['Boolean'] | null),isPut_in?: ((Scalars['Boolean'] | null)[] | null),isPut_not_in?: ((Scalars['Boolean'] | null)[] | null),collateralPerShare?: (Scalars['BigInt'] | null),collateralPerShare_not?: (Scalars['BigInt'] | null),collateralPerShare_in?: ((Scalars['BigInt'] | null)[] | null),collateralPerShare_not_in?: ((Scalars['BigInt'] | null)[] | null),collateralPerShare_gt?: (Scalars['BigInt'] | null),collateralPerShare_lt?: (Scalars['BigInt'] | null),collateralPerShare_gte?: (Scalars['BigInt'] | null),collateralPerShare_lte?: (Scalars['BigInt'] | null),createdAt?: (Scalars['BigInt'] | null),createdAt_not?: (Scalars['BigInt'] | null),createdAt_in?: ((Scalars['BigInt'] | null)[] | null),createdAt_not_in?: ((Scalars['BigInt'] | null)[] | null),createdAt_gt?: (Scalars['BigInt'] | null),createdAt_lt?: (Scalars['BigInt'] | null),createdAt_gte?: (Scalars['BigInt'] | null),createdAt_lte?: (Scalars['BigInt'] | null),createdAtBlock?: (Scalars['BigInt'] | null),createdAtBlock_not?: (Scalars['BigInt'] | null),createdAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),createdAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),createdAtBlock_gt?: (Scalars['BigInt'] | null),createdAtBlock_lt?: (Scalars['BigInt'] | null),createdAtBlock_gte?: (Scalars['BigInt'] | null),createdAtBlock_lte?: (Scalars['BigInt'] | null)}

export interface OrderFillHistoryGenqlSelection{
    id?: boolean | number
    orderHash?: boolean | number
    maker?: boolean | number
    taker?: boolean | number
    optionTokenId?: boolean | number
    makingAmount?: boolean | number
    takingAmount?: boolean | number
    remainingAmount?: boolean | number
    transactionHash?: boolean | number
    blockNumber?: boolean | number
    timestamp?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OrderFillHistoryPageGenqlSelection{
    items?: OrderFillHistoryGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OrderFillHistoryFilter {AND?: ((OrderFillHistoryFilter | null)[] | null),OR?: ((OrderFillHistoryFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),orderHash?: (Scalars['String'] | null),orderHash_not?: (Scalars['String'] | null),orderHash_in?: ((Scalars['String'] | null)[] | null),orderHash_not_in?: ((Scalars['String'] | null)[] | null),orderHash_contains?: (Scalars['String'] | null),orderHash_not_contains?: (Scalars['String'] | null),orderHash_starts_with?: (Scalars['String'] | null),orderHash_ends_with?: (Scalars['String'] | null),orderHash_not_starts_with?: (Scalars['String'] | null),orderHash_not_ends_with?: (Scalars['String'] | null),maker?: (Scalars['String'] | null),maker_not?: (Scalars['String'] | null),maker_in?: ((Scalars['String'] | null)[] | null),maker_not_in?: ((Scalars['String'] | null)[] | null),maker_contains?: (Scalars['String'] | null),maker_not_contains?: (Scalars['String'] | null),maker_starts_with?: (Scalars['String'] | null),maker_ends_with?: (Scalars['String'] | null),maker_not_starts_with?: (Scalars['String'] | null),maker_not_ends_with?: (Scalars['String'] | null),taker?: (Scalars['String'] | null),taker_not?: (Scalars['String'] | null),taker_in?: ((Scalars['String'] | null)[] | null),taker_not_in?: ((Scalars['String'] | null)[] | null),taker_contains?: (Scalars['String'] | null),taker_not_contains?: (Scalars['String'] | null),taker_starts_with?: (Scalars['String'] | null),taker_ends_with?: (Scalars['String'] | null),taker_not_starts_with?: (Scalars['String'] | null),taker_not_ends_with?: (Scalars['String'] | null),optionTokenId?: (Scalars['BigInt'] | null),optionTokenId_not?: (Scalars['BigInt'] | null),optionTokenId_in?: ((Scalars['BigInt'] | null)[] | null),optionTokenId_not_in?: ((Scalars['BigInt'] | null)[] | null),optionTokenId_gt?: (Scalars['BigInt'] | null),optionTokenId_lt?: (Scalars['BigInt'] | null),optionTokenId_gte?: (Scalars['BigInt'] | null),optionTokenId_lte?: (Scalars['BigInt'] | null),makingAmount?: (Scalars['BigInt'] | null),makingAmount_not?: (Scalars['BigInt'] | null),makingAmount_in?: ((Scalars['BigInt'] | null)[] | null),makingAmount_not_in?: ((Scalars['BigInt'] | null)[] | null),makingAmount_gt?: (Scalars['BigInt'] | null),makingAmount_lt?: (Scalars['BigInt'] | null),makingAmount_gte?: (Scalars['BigInt'] | null),makingAmount_lte?: (Scalars['BigInt'] | null),takingAmount?: (Scalars['BigInt'] | null),takingAmount_not?: (Scalars['BigInt'] | null),takingAmount_in?: ((Scalars['BigInt'] | null)[] | null),takingAmount_not_in?: ((Scalars['BigInt'] | null)[] | null),takingAmount_gt?: (Scalars['BigInt'] | null),takingAmount_lt?: (Scalars['BigInt'] | null),takingAmount_gte?: (Scalars['BigInt'] | null),takingAmount_lte?: (Scalars['BigInt'] | null),remainingAmount?: (Scalars['BigInt'] | null),remainingAmount_not?: (Scalars['BigInt'] | null),remainingAmount_in?: ((Scalars['BigInt'] | null)[] | null),remainingAmount_not_in?: ((Scalars['BigInt'] | null)[] | null),remainingAmount_gt?: (Scalars['BigInt'] | null),remainingAmount_lt?: (Scalars['BigInt'] | null),remainingAmount_gte?: (Scalars['BigInt'] | null),remainingAmount_lte?: (Scalars['BigInt'] | null),transactionHash?: (Scalars['String'] | null),transactionHash_not?: (Scalars['String'] | null),transactionHash_in?: ((Scalars['String'] | null)[] | null),transactionHash_not_in?: ((Scalars['String'] | null)[] | null),transactionHash_contains?: (Scalars['String'] | null),transactionHash_not_contains?: (Scalars['String'] | null),transactionHash_starts_with?: (Scalars['String'] | null),transactionHash_ends_with?: (Scalars['String'] | null),transactionHash_not_starts_with?: (Scalars['String'] | null),transactionHash_not_ends_with?: (Scalars['String'] | null),blockNumber?: (Scalars['BigInt'] | null),blockNumber_not?: (Scalars['BigInt'] | null),blockNumber_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_not_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_gt?: (Scalars['BigInt'] | null),blockNumber_lt?: (Scalars['BigInt'] | null),blockNumber_gte?: (Scalars['BigInt'] | null),blockNumber_lte?: (Scalars['BigInt'] | null),timestamp?: (Scalars['BigInt'] | null),timestamp_not?: (Scalars['BigInt'] | null),timestamp_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_gt?: (Scalars['BigInt'] | null),timestamp_lt?: (Scalars['BigInt'] | null),timestamp_gte?: (Scalars['BigInt'] | null),timestamp_lte?: (Scalars['BigInt'] | null)}

export interface OrderCancelHistoryGenqlSelection{
    id?: boolean | number
    orderHash?: boolean | number
    transactionHash?: boolean | number
    blockNumber?: boolean | number
    timestamp?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OrderCancelHistoryPageGenqlSelection{
    items?: OrderCancelHistoryGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface OrderCancelHistoryFilter {AND?: ((OrderCancelHistoryFilter | null)[] | null),OR?: ((OrderCancelHistoryFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),orderHash?: (Scalars['String'] | null),orderHash_not?: (Scalars['String'] | null),orderHash_in?: ((Scalars['String'] | null)[] | null),orderHash_not_in?: ((Scalars['String'] | null)[] | null),orderHash_contains?: (Scalars['String'] | null),orderHash_not_contains?: (Scalars['String'] | null),orderHash_starts_with?: (Scalars['String'] | null),orderHash_ends_with?: (Scalars['String'] | null),orderHash_not_starts_with?: (Scalars['String'] | null),orderHash_not_ends_with?: (Scalars['String'] | null),transactionHash?: (Scalars['String'] | null),transactionHash_not?: (Scalars['String'] | null),transactionHash_in?: ((Scalars['String'] | null)[] | null),transactionHash_not_in?: ((Scalars['String'] | null)[] | null),transactionHash_contains?: (Scalars['String'] | null),transactionHash_not_contains?: (Scalars['String'] | null),transactionHash_starts_with?: (Scalars['String'] | null),transactionHash_ends_with?: (Scalars['String'] | null),transactionHash_not_starts_with?: (Scalars['String'] | null),transactionHash_not_ends_with?: (Scalars['String'] | null),blockNumber?: (Scalars['BigInt'] | null),blockNumber_not?: (Scalars['BigInt'] | null),blockNumber_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_not_in?: ((Scalars['BigInt'] | null)[] | null),blockNumber_gt?: (Scalars['BigInt'] | null),blockNumber_lt?: (Scalars['BigInt'] | null),blockNumber_gte?: (Scalars['BigInt'] | null),blockNumber_lte?: (Scalars['BigInt'] | null),timestamp?: (Scalars['BigInt'] | null),timestamp_not?: (Scalars['BigInt'] | null),timestamp_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),timestamp_gt?: (Scalars['BigInt'] | null),timestamp_lt?: (Scalars['BigInt'] | null),timestamp_gte?: (Scalars['BigInt'] | null),timestamp_lte?: (Scalars['BigInt'] | null)}

export interface HourlyVolumeGenqlSelection{
    id?: boolean | number
    marketId?: boolean | number
    optionId?: boolean | number
    hourTimestamp?: boolean | number
    depositVolume?: boolean | number
    tradeVolume?: boolean | number
    unwindVolume?: boolean | number
    withdrawVolume?: boolean | number
    exerciseVolume?: boolean | number
    totalVolume?: boolean | number
    tradeCount?: boolean | number
    updatedAt?: boolean | number
    updatedAtBlock?: boolean | number
    optionParams?: OptionParamsGenqlSelection
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface HourlyVolumePageGenqlSelection{
    items?: HourlyVolumeGenqlSelection
    pageInfo?: PageInfoGenqlSelection
    totalCount?: boolean | number
    __typename?: boolean | number
    __scalar?: boolean | number
}

export interface HourlyVolumeFilter {AND?: ((HourlyVolumeFilter | null)[] | null),OR?: ((HourlyVolumeFilter | null)[] | null),id?: (Scalars['String'] | null),id_not?: (Scalars['String'] | null),id_in?: ((Scalars['String'] | null)[] | null),id_not_in?: ((Scalars['String'] | null)[] | null),id_contains?: (Scalars['String'] | null),id_not_contains?: (Scalars['String'] | null),id_starts_with?: (Scalars['String'] | null),id_ends_with?: (Scalars['String'] | null),id_not_starts_with?: (Scalars['String'] | null),id_not_ends_with?: (Scalars['String'] | null),marketId?: (Scalars['BigInt'] | null),marketId_not?: (Scalars['BigInt'] | null),marketId_in?: ((Scalars['BigInt'] | null)[] | null),marketId_not_in?: ((Scalars['BigInt'] | null)[] | null),marketId_gt?: (Scalars['BigInt'] | null),marketId_lt?: (Scalars['BigInt'] | null),marketId_gte?: (Scalars['BigInt'] | null),marketId_lte?: (Scalars['BigInt'] | null),optionId?: (Scalars['String'] | null),optionId_not?: (Scalars['String'] | null),optionId_in?: ((Scalars['String'] | null)[] | null),optionId_not_in?: ((Scalars['String'] | null)[] | null),optionId_contains?: (Scalars['String'] | null),optionId_not_contains?: (Scalars['String'] | null),optionId_starts_with?: (Scalars['String'] | null),optionId_ends_with?: (Scalars['String'] | null),optionId_not_starts_with?: (Scalars['String'] | null),optionId_not_ends_with?: (Scalars['String'] | null),hourTimestamp?: (Scalars['BigInt'] | null),hourTimestamp_not?: (Scalars['BigInt'] | null),hourTimestamp_in?: ((Scalars['BigInt'] | null)[] | null),hourTimestamp_not_in?: ((Scalars['BigInt'] | null)[] | null),hourTimestamp_gt?: (Scalars['BigInt'] | null),hourTimestamp_lt?: (Scalars['BigInt'] | null),hourTimestamp_gte?: (Scalars['BigInt'] | null),hourTimestamp_lte?: (Scalars['BigInt'] | null),depositVolume?: (Scalars['BigInt'] | null),depositVolume_not?: (Scalars['BigInt'] | null),depositVolume_in?: ((Scalars['BigInt'] | null)[] | null),depositVolume_not_in?: ((Scalars['BigInt'] | null)[] | null),depositVolume_gt?: (Scalars['BigInt'] | null),depositVolume_lt?: (Scalars['BigInt'] | null),depositVolume_gte?: (Scalars['BigInt'] | null),depositVolume_lte?: (Scalars['BigInt'] | null),tradeVolume?: (Scalars['BigInt'] | null),tradeVolume_not?: (Scalars['BigInt'] | null),tradeVolume_in?: ((Scalars['BigInt'] | null)[] | null),tradeVolume_not_in?: ((Scalars['BigInt'] | null)[] | null),tradeVolume_gt?: (Scalars['BigInt'] | null),tradeVolume_lt?: (Scalars['BigInt'] | null),tradeVolume_gte?: (Scalars['BigInt'] | null),tradeVolume_lte?: (Scalars['BigInt'] | null),unwindVolume?: (Scalars['BigInt'] | null),unwindVolume_not?: (Scalars['BigInt'] | null),unwindVolume_in?: ((Scalars['BigInt'] | null)[] | null),unwindVolume_not_in?: ((Scalars['BigInt'] | null)[] | null),unwindVolume_gt?: (Scalars['BigInt'] | null),unwindVolume_lt?: (Scalars['BigInt'] | null),unwindVolume_gte?: (Scalars['BigInt'] | null),unwindVolume_lte?: (Scalars['BigInt'] | null),withdrawVolume?: (Scalars['BigInt'] | null),withdrawVolume_not?: (Scalars['BigInt'] | null),withdrawVolume_in?: ((Scalars['BigInt'] | null)[] | null),withdrawVolume_not_in?: ((Scalars['BigInt'] | null)[] | null),withdrawVolume_gt?: (Scalars['BigInt'] | null),withdrawVolume_lt?: (Scalars['BigInt'] | null),withdrawVolume_gte?: (Scalars['BigInt'] | null),withdrawVolume_lte?: (Scalars['BigInt'] | null),exerciseVolume?: (Scalars['BigInt'] | null),exerciseVolume_not?: (Scalars['BigInt'] | null),exerciseVolume_in?: ((Scalars['BigInt'] | null)[] | null),exerciseVolume_not_in?: ((Scalars['BigInt'] | null)[] | null),exerciseVolume_gt?: (Scalars['BigInt'] | null),exerciseVolume_lt?: (Scalars['BigInt'] | null),exerciseVolume_gte?: (Scalars['BigInt'] | null),exerciseVolume_lte?: (Scalars['BigInt'] | null),totalVolume?: (Scalars['BigInt'] | null),totalVolume_not?: (Scalars['BigInt'] | null),totalVolume_in?: ((Scalars['BigInt'] | null)[] | null),totalVolume_not_in?: ((Scalars['BigInt'] | null)[] | null),totalVolume_gt?: (Scalars['BigInt'] | null),totalVolume_lt?: (Scalars['BigInt'] | null),totalVolume_gte?: (Scalars['BigInt'] | null),totalVolume_lte?: (Scalars['BigInt'] | null),tradeCount?: (Scalars['Int'] | null),tradeCount_not?: (Scalars['Int'] | null),tradeCount_in?: ((Scalars['Int'] | null)[] | null),tradeCount_not_in?: ((Scalars['Int'] | null)[] | null),tradeCount_gt?: (Scalars['Int'] | null),tradeCount_lt?: (Scalars['Int'] | null),tradeCount_gte?: (Scalars['Int'] | null),tradeCount_lte?: (Scalars['Int'] | null),updatedAt?: (Scalars['BigInt'] | null),updatedAt_not?: (Scalars['BigInt'] | null),updatedAt_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAt_gt?: (Scalars['BigInt'] | null),updatedAt_lt?: (Scalars['BigInt'] | null),updatedAt_gte?: (Scalars['BigInt'] | null),updatedAt_lte?: (Scalars['BigInt'] | null),updatedAtBlock?: (Scalars['BigInt'] | null),updatedAtBlock_not?: (Scalars['BigInt'] | null),updatedAtBlock_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_not_in?: ((Scalars['BigInt'] | null)[] | null),updatedAtBlock_gt?: (Scalars['BigInt'] | null),updatedAtBlock_lt?: (Scalars['BigInt'] | null),updatedAtBlock_gte?: (Scalars['BigInt'] | null),updatedAtBlock_lte?: (Scalars['BigInt'] | null)}


    const PageInfo_possibleTypes: string[] = ['PageInfo']
    export const isPageInfo = (obj?: { __typename?: any } | null): obj is PageInfo => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPageInfo"')
      return PageInfo_possibleTypes.includes(obj.__typename)
    }
    


    const Meta_possibleTypes: string[] = ['Meta']
    export const isMeta = (obj?: { __typename?: any } | null): obj is Meta => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isMeta"')
      return Meta_possibleTypes.includes(obj.__typename)
    }
    


    const Query_possibleTypes: string[] = ['Query']
    export const isQuery = (obj?: { __typename?: any } | null): obj is Query => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isQuery"')
      return Query_possibleTypes.includes(obj.__typename)
    }
    


    const Global_possibleTypes: string[] = ['Global']
    export const isGlobal = (obj?: { __typename?: any } | null): obj is Global => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isGlobal"')
      return Global_possibleTypes.includes(obj.__typename)
    }
    


    const OptionMarketPage_possibleTypes: string[] = ['OptionMarketPage']
    export const isOptionMarketPage = (obj?: { __typename?: any } | null): obj is OptionMarketPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOptionMarketPage"')
      return OptionMarketPage_possibleTypes.includes(obj.__typename)
    }
    


    const OptionMarket_possibleTypes: string[] = ['OptionMarket']
    export const isOptionMarket = (obj?: { __typename?: any } | null): obj is OptionMarket => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOptionMarket"')
      return OptionMarket_possibleTypes.includes(obj.__typename)
    }
    


    const MarketStrategy_possibleTypes: string[] = ['MarketStrategy']
    export const isMarketStrategy = (obj?: { __typename?: any } | null): obj is MarketStrategy => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isMarketStrategy"')
      return MarketStrategy_possibleTypes.includes(obj.__typename)
    }
    


    const CollateralPositionPage_possibleTypes: string[] = ['CollateralPositionPage']
    export const isCollateralPositionPage = (obj?: { __typename?: any } | null): obj is CollateralPositionPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isCollateralPositionPage"')
      return CollateralPositionPage_possibleTypes.includes(obj.__typename)
    }
    


    const CollateralPosition_possibleTypes: string[] = ['CollateralPosition']
    export const isCollateralPosition = (obj?: { __typename?: any } | null): obj is CollateralPosition => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isCollateralPosition"')
      return CollateralPosition_possibleTypes.includes(obj.__typename)
    }
    


    const User_possibleTypes: string[] = ['User']
    export const isUser = (obj?: { __typename?: any } | null): obj is User => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isUser"')
      return User_possibleTypes.includes(obj.__typename)
    }
    


    const OptionPositionPage_possibleTypes: string[] = ['OptionPositionPage']
    export const isOptionPositionPage = (obj?: { __typename?: any } | null): obj is OptionPositionPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOptionPositionPage"')
      return OptionPositionPage_possibleTypes.includes(obj.__typename)
    }
    


    const OptionPosition_possibleTypes: string[] = ['OptionPosition']
    export const isOptionPosition = (obj?: { __typename?: any } | null): obj is OptionPosition => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOptionPosition"')
      return OptionPosition_possibleTypes.includes(obj.__typename)
    }
    


    const OptionParams_possibleTypes: string[] = ['OptionParams']
    export const isOptionParams = (obj?: { __typename?: any } | null): obj is OptionParams => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOptionParams"')
      return OptionParams_possibleTypes.includes(obj.__typename)
    }
    


    const DepositHistoryPage_possibleTypes: string[] = ['DepositHistoryPage']
    export const isDepositHistoryPage = (obj?: { __typename?: any } | null): obj is DepositHistoryPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isDepositHistoryPage"')
      return DepositHistoryPage_possibleTypes.includes(obj.__typename)
    }
    


    const DepositHistory_possibleTypes: string[] = ['DepositHistory']
    export const isDepositHistory = (obj?: { __typename?: any } | null): obj is DepositHistory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isDepositHistory"')
      return DepositHistory_possibleTypes.includes(obj.__typename)
    }
    


    const TransferDepositHistoryPage_possibleTypes: string[] = ['TransferDepositHistoryPage']
    export const isTransferDepositHistoryPage = (obj?: { __typename?: any } | null): obj is TransferDepositHistoryPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isTransferDepositHistoryPage"')
      return TransferDepositHistoryPage_possibleTypes.includes(obj.__typename)
    }
    


    const TransferDepositHistory_possibleTypes: string[] = ['TransferDepositHistory']
    export const isTransferDepositHistory = (obj?: { __typename?: any } | null): obj is TransferDepositHistory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isTransferDepositHistory"')
      return TransferDepositHistory_possibleTypes.includes(obj.__typename)
    }
    


    const PurchaseHistoryPage_possibleTypes: string[] = ['PurchaseHistoryPage']
    export const isPurchaseHistoryPage = (obj?: { __typename?: any } | null): obj is PurchaseHistoryPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPurchaseHistoryPage"')
      return PurchaseHistoryPage_possibleTypes.includes(obj.__typename)
    }
    


    const PurchaseHistory_possibleTypes: string[] = ['PurchaseHistory']
    export const isPurchaseHistory = (obj?: { __typename?: any } | null): obj is PurchaseHistory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isPurchaseHistory"')
      return PurchaseHistory_possibleTypes.includes(obj.__typename)
    }
    


    const ExerciseHistoryPage_possibleTypes: string[] = ['ExerciseHistoryPage']
    export const isExerciseHistoryPage = (obj?: { __typename?: any } | null): obj is ExerciseHistoryPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isExerciseHistoryPage"')
      return ExerciseHistoryPage_possibleTypes.includes(obj.__typename)
    }
    


    const ExerciseHistory_possibleTypes: string[] = ['ExerciseHistory']
    export const isExerciseHistory = (obj?: { __typename?: any } | null): obj is ExerciseHistory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isExerciseHistory"')
      return ExerciseHistory_possibleTypes.includes(obj.__typename)
    }
    


    const UnwindHistoryPage_possibleTypes: string[] = ['UnwindHistoryPage']
    export const isUnwindHistoryPage = (obj?: { __typename?: any } | null): obj is UnwindHistoryPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isUnwindHistoryPage"')
      return UnwindHistoryPage_possibleTypes.includes(obj.__typename)
    }
    


    const UnwindHistory_possibleTypes: string[] = ['UnwindHistory']
    export const isUnwindHistory = (obj?: { __typename?: any } | null): obj is UnwindHistory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isUnwindHistory"')
      return UnwindHistory_possibleTypes.includes(obj.__typename)
    }
    


    const TransferPositionHistoryPage_possibleTypes: string[] = ['TransferPositionHistoryPage']
    export const isTransferPositionHistoryPage = (obj?: { __typename?: any } | null): obj is TransferPositionHistoryPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isTransferPositionHistoryPage"')
      return TransferPositionHistoryPage_possibleTypes.includes(obj.__typename)
    }
    


    const TransferPositionHistory_possibleTypes: string[] = ['TransferPositionHistory']
    export const isTransferPositionHistory = (obj?: { __typename?: any } | null): obj is TransferPositionHistory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isTransferPositionHistory"')
      return TransferPositionHistory_possibleTypes.includes(obj.__typename)
    }
    


    const SettlementHistoryPage_possibleTypes: string[] = ['SettlementHistoryPage']
    export const isSettlementHistoryPage = (obj?: { __typename?: any } | null): obj is SettlementHistoryPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isSettlementHistoryPage"')
      return SettlementHistoryPage_possibleTypes.includes(obj.__typename)
    }
    


    const SettlementHistory_possibleTypes: string[] = ['SettlementHistory']
    export const isSettlementHistory = (obj?: { __typename?: any } | null): obj is SettlementHistory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isSettlementHistory"')
      return SettlementHistory_possibleTypes.includes(obj.__typename)
    }
    


    const GlobalPage_possibleTypes: string[] = ['GlobalPage']
    export const isGlobalPage = (obj?: { __typename?: any } | null): obj is GlobalPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isGlobalPage"')
      return GlobalPage_possibleTypes.includes(obj.__typename)
    }
    


    const UserPage_possibleTypes: string[] = ['UserPage']
    export const isUserPage = (obj?: { __typename?: any } | null): obj is UserPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isUserPage"')
      return UserPage_possibleTypes.includes(obj.__typename)
    }
    


    const MarketStrategyPage_possibleTypes: string[] = ['MarketStrategyPage']
    export const isMarketStrategyPage = (obj?: { __typename?: any } | null): obj is MarketStrategyPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isMarketStrategyPage"')
      return MarketStrategyPage_possibleTypes.includes(obj.__typename)
    }
    


    const OptionParamsPage_possibleTypes: string[] = ['OptionParamsPage']
    export const isOptionParamsPage = (obj?: { __typename?: any } | null): obj is OptionParamsPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOptionParamsPage"')
      return OptionParamsPage_possibleTypes.includes(obj.__typename)
    }
    


    const OrderFillHistory_possibleTypes: string[] = ['OrderFillHistory']
    export const isOrderFillHistory = (obj?: { __typename?: any } | null): obj is OrderFillHistory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOrderFillHistory"')
      return OrderFillHistory_possibleTypes.includes(obj.__typename)
    }
    


    const OrderFillHistoryPage_possibleTypes: string[] = ['OrderFillHistoryPage']
    export const isOrderFillHistoryPage = (obj?: { __typename?: any } | null): obj is OrderFillHistoryPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOrderFillHistoryPage"')
      return OrderFillHistoryPage_possibleTypes.includes(obj.__typename)
    }
    


    const OrderCancelHistory_possibleTypes: string[] = ['OrderCancelHistory']
    export const isOrderCancelHistory = (obj?: { __typename?: any } | null): obj is OrderCancelHistory => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOrderCancelHistory"')
      return OrderCancelHistory_possibleTypes.includes(obj.__typename)
    }
    


    const OrderCancelHistoryPage_possibleTypes: string[] = ['OrderCancelHistoryPage']
    export const isOrderCancelHistoryPage = (obj?: { __typename?: any } | null): obj is OrderCancelHistoryPage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isOrderCancelHistoryPage"')
      return OrderCancelHistoryPage_possibleTypes.includes(obj.__typename)
    }
    


    const HourlyVolume_possibleTypes: string[] = ['HourlyVolume']
    export const isHourlyVolume = (obj?: { __typename?: any } | null): obj is HourlyVolume => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isHourlyVolume"')
      return HourlyVolume_possibleTypes.includes(obj.__typename)
    }
    


    const HourlyVolumePage_possibleTypes: string[] = ['HourlyVolumePage']
    export const isHourlyVolumePage = (obj?: { __typename?: any } | null): obj is HourlyVolumePage => {
      if (!obj?.__typename) throw new Error('__typename is missing in "isHourlyVolumePage"')
      return HourlyVolumePage_possibleTypes.includes(obj.__typename)
    }
    