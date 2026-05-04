# premarket-sdk

TypeScript SDK for Stryke premarket integrations across onchain contracts,
backend APIs, and frontend runtimes.

The package brings together:

- native `Exchange` order building, hashing, signing, math, and calldata
- `OptionMarketVault` token-id helpers, collateral math, and tx builders
- `MarketsRegistry` market serialization and admin calldata builders
- `OrderHelper` and `OrderbookApi` for application-facing integrations
- realtime sync clients for market depth and activity streams
- chain metadata, deployed addresses, and token constants
- smart-account derivation and deployment helpers
- shared transport DTOs for API and UI consumers

## Install

```bash
bun add @stryke-xyz/premarket-sdk
```

## Quick Start

```ts
import {
  EXCHANGE,
  OrderHelper,
  OrderbookApi,
  SignatureType,
  TradeType,
} from "@stryke-xyz/premarket-sdk";

const chainId = 4326;

const helper = new OrderHelper({
  chainId,
  exchangeAddress: EXCHANGE[chainId],
});

const order = helper.buildOrder({
  maker: "0x1111111111111111111111111111111111111111",
  receiver: "0x1111111111111111111111111111111111111111",
  nonce: 0n,
  marketId: 1n,
  makingAmount: 1_000_000n,
  takingAmount: 500_000n,
  deadline: 1_900_000_000n,
  tradeType: TradeType.SELL,
  signatureType: SignatureType.EIP712,
  tokenId: 42n,
});

const signature = await helper.signEip712Order(order, walletClient);
const payload = helper.serializeOrder(order);

const api = new OrderbookApi({ baseUrl: "https://example.stryke.xyz" });
await api.createOrder(
  {
    marketId: payload.marketId,
    order: payload,
    signature,
    timeInForce: "GTC",
    postOnly: false,
  },
  bearerToken,
);
```

## Source Layout

- `src/exchange`: native order model, EIP-712 helpers, order math, and exchange
  calldata builders
- `src/api`: `OrderHelper`, `OrderbookApi`, and response deserializers
- `src/vault`: token-id derivation, collateral math, and vault tx builders
- `src/registry`: market serialization and registry calldata builders
- `src/sync`: realtime depth and activity clients
- `src/config`: supported chains, token metadata, and deployed addresses
- `src/shared`: transport DTOs shared across SDK, API, and UI
- `src/utils`: reusable math, randomness, token-pair, and signature helpers
- `src/smart-account.ts`: deterministic smart-account helpers
- `src/address.ts`: address convenience wrapper
- `src/bps.ts`: basis-point helper wrapper
- `src/constants.ts`: compatibility address helpers

## Exchange Module

Source files:

- `src/exchange/index.ts`
- `src/exchange/types.ts`
- `src/exchange/order.ts`
- `src/exchange/eip712.ts`
- `src/exchange/math.ts`
- `src/exchange/exchange-contract.ts`
- `src/exchange/errors.ts`

This is the trading core of the SDK. It models Stryke's native order format,
mirrors the contract's EIP-712 schema, reproduces key fee and crossing math,
and encodes calldata for fills, matches, cancellation, and batching.

### Core order model

The canonical in-memory type is `ExchangeOrder`, where numeric fields are
stored as `bigint`.

```ts
export interface ExchangeOrder {
  salt: bigint;
  nonce: bigint;
  marketId: bigint;
  makingAmount: bigint;
  takingAmount: bigint;
  deadline: bigint;
  maker: Address;
  receiver: Address;
  tradeType: TradeType;
  signatureType: SignatureType;
  tokenId: bigint;
}
```

Related public types:

- `TradeType`: `BUY = 0`, `SELL = 1`
- `SignatureType`: `EIP712 = 0`, `ERC1271 = 1`
- `SerializedExchangeOrder`
- `ExchangeOrderStatus`
- `SerializedExchangeOrderStatus`
- `MulticallResult`

### Order building and validation

Public helpers:

- `buildExchangeOrder(params)`
- `validateExchangeOrder(order)`
- `isOrderExpired(order, nowSec?)`
- `getExecutableMakingAmount(order, status)`
- `getExchangeOrderHash(order, chainId, exchangeAddress)`

Builder behavior:

- `salt` defaults to a random 96-bit-compatible value
- `receiver` defaults to `maker`
- `signatureType` defaults to `SignatureType.EIP712`
- `makingAmount`, `takingAmount`, and `deadline` must be positive

```ts
import {
  SignatureType,
  TradeType,
  buildExchangeOrder,
} from "@stryke-xyz/premarket-sdk";

const order = buildExchangeOrder({
  maker: "0x1111111111111111111111111111111111111111",
  nonce: 12n,
  marketId: 7n,
  makingAmount: 1_000_000n,
  takingAmount: 500_000n,
  deadline: 1_900_000_000n,
  tradeType: TradeType.SELL,
  signatureType: SignatureType.EIP712,
  tokenId: 123456n,
});
```

### Signing and hashing

Important constants:

- `EXCHANGE_EIP712_NAME = "Exchange"`
- `EXCHANGE_EIP712_VERSION = "1"`
- `EXCHANGE_ORDER_TYPES`

Public helpers:

- `getExchangeDomain(chainId, verifyingContract)`
- `getExchangeTypedData(order, chainId, verifyingContract)`
- `hashExchangeOrder(order, chainId, verifyingContract)`
- `recoverExchangeOrderSigner(order, signature, chainId, verifyingContract)`

These helpers should be used anywhere exact onchain signature parity matters.

### Serialization helpers

Public helpers:

- `serializeExchangeOrder(order)`
- `deserializeExchangeOrder(order)`
- `serializeOrderStatus(status)`
- `deserializeOrderStatus(status)`

Use these when moving between bigint-based local models and JSON-safe payloads.

### Math helpers

Public constants:

- `EXCHANGE_ONE = 10n ** 18n`
- `FEE_RATE_BASE = 1_000_000n`

Public functions:

- `getTakingAmount(fillMakingAmount, orderMakingAmount, orderTakingAmount)`
- `getMakingAmount(fillTakingAmount, orderMakingAmount, orderTakingAmount)`
- `calculateFee(grossAmount, feeRate)`
- `applyFee(grossAmount, feeRate)`
- `getOrderPriceWad(order)`
- `optionPrmToPrmId(tokenId)`
- `isCrossing(orderA, orderB)`
- `hasValidTokenPairForMatch(orderA, orderB)`

### Calldata builders

`ExchangeContract` wraps the shipped ABI and returns either raw calldata or a
lightweight transaction envelope.

Public methods:

- `getFillOrderCalldata(order, fillAmount, signature)`
- `buildFillOrderTx(order, fillAmount, signature)`
- `getMatchOrderCalldata(takerOrder, takerSignature, makerOrder, makerSignature, takerFillAmount, makerFillAmount)`
- `buildMatchOrderTx(takerOrder, takerSignature, makerOrder, makerSignature, takerFillAmount, makerFillAmount)`
- `getCancelOrderCalldata(order)`
- `getIncrementNonceCalldata()`
- `getSetResolverWhitelistCalldata(resolver, isWhitelisted)`
- `getSetFeeReceiverCalldata(newFeeReceiver)`
- `getPauseCalldata()`
- `getUnpauseCalldata()`
- `getMulticallCalldata(data, allowFailure?)`

`buildFillOrderTx` and `buildMatchOrderTx` return `{ to, data, value }`.
The remaining helpers return calldata only.

Restricted or admin-oriented surfaces:

- `getSetResolverWhitelistCalldata`
- `getSetFeeReceiverCalldata`
- `getPauseCalldata`
- `getUnpauseCalldata`

### Error decoding

`decodeContractError` attempts to decode revert payloads against the shipped
`Exchange`, `OptionMarketVault`, and `MarketsRegistry` ABIs.

It returns either `null` or:

```ts
interface DecodedContractError {
  contract: "exchange" | "optionMarketVault" | "marketsRegistry";
  name: string;
  signature: string;
  args: readonly unknown[];
}
```

## API Module

Source files:

- `src/api/index.ts`
- `src/api/order-helper.ts`
- `src/api/orderbook-api/index.ts`
- `src/api/orderbook-api/deserializers.ts`
- `src/shared/types.ts`

This module gives most applications the two highest-level integration surfaces:
`OrderHelper` for working with orders and `OrderbookApi` for HTTP reads and
writes.

### OrderHelper

`OrderHelper` exists so consumers do not need to manually stitch together order
building, hashing, typed-data generation, signing, and serialization.

Constructor config:

- `chainId`
- `exchangeAddress`

Public methods:

- `buildOrder(params)`
- `buildSellOrder(params)`
- `buildBuyOrder(params)`
- `serializeOrder(order)`
- `hashOrder(order)`
- `getTypedData(order)`
- `signEip712Order(order, walletClient)`
- `signSimpleAccountOrder(order, ownerWalletClient)`
- `signOrder(order, walletClient)`
- `recoverOrderSigner(order, signature)`

```ts
const signature = await helper.signEip712Order(order, walletClient);
const payloadOrder = helper.serializeOrder(order);
const signer = await helper.recoverOrderSigner(order, signature);
```

### OrderbookApi

`OrderbookApi` is a fetch-based client that normalizes URLs, handles the
backend envelope format, exposes typed return values, and produces clearer
integration errors.

Constructor config:

- `baseUrl`
- `fetchFn?`

Public order methods:

- `createOrder(params, bearerToken)`
- `getOrder(orderHash)`
- `getOrders(marketId, maker?)` — active orders for a market, optionally scoped to a maker
- `getUserOrders(maker, marketId)` — convenience wrapper around `getOrders`

Public market methods:

- `getMarkets()`
- `getMarketRecentTrades(marketId, limit?)`
- `getMarket(marketId)`

Public user and analytics methods:

- `getUserPositions(userAddress)`
- `getUserTradingPnL(userAddress)`
- `getUserPnL(userAddress)`
- `getTokenPnL(userAddress, tokenId)`
- `getErc20PnL(userAddress, tokenAddress)`

Public history methods:

- `getUserHistories(userAddress, limit?)`
- `getMintHistory(userAddress, limit?)`
- `getRedeemHistory(userAddress, limit?)`
- `getUnwindHistory(userAddress, limit?)`
- `getTransferHistory(userAddress, limit?)`
- `getFillHistory(userAddress, limit?)`

Auth-related methods also exposed by the SDK:

- `getChallenge({ address, chainId })`
- `verifyAuth({ account, nonce, signature, chainId, expiresAt })`

Integration note:

- `getOrders` and `getUserOrders` both require a `marketId`. Returned orders
  are restricted to active and partially-filled (cancelled / fully-filled
  / expired are filtered server-side).

### Deserializers

The API returns string-heavy DTOs because JSON cannot safely transport
`bigint`. Public helpers convert those payloads into bigint-friendly objects:

- `orderToBigInt`
- `storedOrderToBigInt`
- `ordersSnapshotToBigInt`
- `marketInstrumentToBigInt`
- `marketToBigInt`
- `marketsToBigInt`
- `positionToBigInt`
- `tradingPnLToBigInt`
- `mintHistoryToBigInt`
- `redeemHistoryToBigInt`
- `unwindHistoryToBigInt`
- `transferHistoryToBigInt`
- `fillHistoryToBigInt`

## Vault Module

Source files:

- `src/vault/index.ts`
- `src/vault/types.ts`
- `src/vault/token-ids.ts`
- `src/vault/collateral.ts`
- `src/vault/transactions.ts`
- `src/vault/constants.ts`

This module is built around `OptionMarketVault`. It documents position token
derivation, collateral and settlement math, precision constants, roles, and
transaction builders.

### Vault concepts

The vault mints paired ERC-6909 position ids:

- `PRM`: collateral-side position token, always even
- `oPRM`: option claim token, always odd

Pairing rules:

- `oPrmTokenId = prmTokenId | 1`
- `optionPrmToPrm(tokenId)` clears the low bit and returns the canonical `PRM`
  id

### Public types

Main exports:

- `VaultInstrument`
- `VaultMarket`
- `PrmInfo`
- `TokenIdParams`
- `MarketParams`
- `InstrumentParams`
- `SpreadBounds`

### Precision constants and roles

Public constants:

- `VAULT_TOKEN_PRECISION = 1e18`
- `FEE_BPS_PRECISION = 1e6`
- `PNL_PRECISION = 1e18`
- `Role`
- `ROLE_NAMES`

### Token-id helpers

Public helpers:

- `getPrmTokenId(params)`
- `getOptionPrmTokenId(params)`
- `prmToOptionTokenId(prmTokenId)`
- `optionPrmToPrm(oPrmTokenId)`
- `isPrmToken(tokenId)`
- `isOptionPrmToken(tokenId)`
- `getPositionId(tokenId, userAddress)`

Implementation detail:

- `getPrmTokenId` hashes vault address, instrument fields, expiry, and
  `chainId`, then left-shifts once to force even parity

### Collateral and settlement math

Public helpers:

- `getSpreadWidth(market)`
- `getSpreadBounds(instrument, market)`
- `calculateCollateralAmount(prmAmount, instrument, market)`
- `calculatePrmAmount(collateralAmount, instrument, market)`
- `calculateSpreadProfit(instrument, market, finalTick, positionSize)`
- `calculateSpreadLoss(instrument, market, finalTick, positionSize)`
- `calculateWithdrawableCollateral(instrument, market, finalTick, positionSize)`
- `getCollateralPerPosition(instrument, market)`
- `calculateDepositFees(collateralAmount, depositFeeBps, feeBpsPrecision?)`
- `calculateRedeemFees(profitAmount, redeemFeeBps, feeBpsPrecision?)`
- `isInTheMoney(instrument, market, finalTick)`
- `calculateMoneyness(instrument, market, finalTick)`

Important behavior:

- spread width falls back to `1` when `tickSpacing <= tickSize`
- strike-scaled collateral uses `instrument.tick`
- collateral calculation rounds up when the final division is not exact
- inverse `PRM` previews use floor division
- payoff and withdraw math use deterministic `bigint` arithmetic throughout

### Transaction builders

These helpers return:

```ts
export interface TransactionCall {
  to: `0x${string}`;
  value?: bigint;
  data: Hex;
}
```

User-facing lifecycle builders:

- `buildMintTransaction(vaultAddress, instrument, amount)`
- `buildWithdrawTransaction(vaultAddress, prmTokenId, amount, receiver)`
- `buildRedeemTransaction(vaultAddress, oPrmTokenId, receiver)`
- `buildUnwindTransaction(vaultAddress, prmTokenId, amount, receiver)`
- `buildRolloverTransaction(vaultAddress, oldPrmTokenId)`
- `buildApproveTransaction(tokenAddress, spender, amount?)`
- `buildBatchedMintTransactions(collateralTokenAddress, vaultAddress, instrument, collateralAmount, prmAmount)`
- `buildSetOperatorTransaction(vaultAddress, operator, approved)`

Restricted or role-gated builders:

- `buildDelegateRedeemTransaction`
- `buildDelegateRolloverTransaction`
- `buildDelegateWithdrawTransaction`
- `buildFillMarketDeliveryTransaction`
- `buildSetRolloverEnabledTransaction`
- `buildSetRoleTransaction`
- `buildUpdateFinalTickTransaction`
- `buildUpdateMarketExpiryTransaction`
- `buildUpdateMarketExpiryFromMarketTransaction`

## Registry Module

Source files:

- `src/registry/index.ts`
- `src/registry/types.ts`
- `src/registry/markets-registry-contract.ts`

This module wraps the `MarketsRegistry` contract surface used for market
configuration and serialization.

### Public types

Main exports:

- `MarketType`
  - `ERC20xERC20`
  - `ERC20xERC6909`
- `RegistryMarket`
- `SerializedRegistryMarket`

Core fields include token addresses, sizing parameters, expiry, fee fields, and
runtime flags such as `marketType`, `isCollateralScaled`, and `nonRollable`.

Serialization helpers:

- `serializeRegistryMarket(market)`
- `deserializeRegistryMarket(market)`

### Contract wrapper

`MarketsRegistryContract` wraps the shipped ABI and returns calldata or a tx
envelope.

Public surfaces:

- `RegistryTransactionCall`
- `MarketsRegistryContract`
  - `getAddMarketCalldata(market)`
  - `buildAddMarketTx(market)`
  - `getUpdateTokenCalldata(token, isStable, isDelete)`
  - `getSetWhitelistedCalldata(account, allowed)`
  - `getUpdateMarketExpiryCalldata(marketId, expiry)`
  - `getMulticallCalldata(data)`

Important nuance:

- `buildAddMarketTx` returns a full tx object
- the remaining helpers return raw calldata only

Most registry writes are administrative and should not be treated as normal
end-user flows.

## Sync Module

Source files:

- `src/sync/index.ts`
- `src/sync/types.ts`
- `src/sync/clients/base-client.ts`
- `src/sync/clients/order-client.ts`
- `src/sync/clients/activity-client.ts`

This module contains the realtime clients used to keep frontends and services
in sync with depth and activity streams.

### Shared sync types

Public exports:

- `SyncStatus`
  - `"connecting" | "syncing" | "synced" | "recovering" | "disconnected" | "error"`

### MarketDepthSyncClient

Main config:

- `wsUrl`
- `marketId`
- `tokenIds`
- `heartbeatIntervalMs?`
- `heartbeatTimeoutMs?`
- `maxReconnectAttempts?`
- `initialReconnectDelayMs?`
- `maxReconnectDelayMs?`

Connection methods:

- `connect()`
- `disconnect()`
- `getStatus()`

Read methods:

- `getTokenIds()`
- `getTokenState(tokenId)`
- `getBids(tokenId)`
- `getAsks(tokenId)`
- `getBestBid(tokenId)`
- `getBestAsk(tokenId)`
- `getLastPrice(tokenId)`
- `getSeq(tokenId)`
- `getSpread(tokenId)`
- `getDepthAtPrice(tokenId, side, price)`

Listener hooks:

- `onStatus(callback)`
- `onSnapshot(callback)`
- `onDelta(callback)`

Public event types:

- `DepthLevel`
- `TokenDepthSnapshot`
- `DepthLevelUpdate`
- `DepthUpdate`

Implementation details captured by the client:

- invalid non-websocket URLs are rejected
- `connect()` waits for initial snapshots
- sequence ids are deduplicated and gaps trigger recovery
- equivalent price strings such as `"1"` and `"1.000000"` are normalized

### ActivitySyncClient

Config:

- `wsUrl`
- `marketId?`
- `userAddress?`
- `heartbeatIntervalMs?`
- `heartbeatTimeoutMs?`
- `maxReconnectAttempts?`
- `initialReconnectDelayMs?`
- `maxReconnectDelayMs?`

At least one of `marketId` or `userAddress` is required.

Connection methods:

- `connect()`
- `disconnect()`
- `getStatus()`

Listener hooks:

- `onStatus(callback)`
- `onOrderFill(callback)`
- `onUserFill(callback)`
- `onMarketFill(callback)`

Public event type:

- `OrderFillEvent`

## Config Module

Source files:

- `src/config/index.ts`
- `src/config/chains.ts`

This module is the SDK's deployment and chain registry. It centralizes
supported chain definitions, token metadata, and deployed contract addresses so
applications do not hardcode environment-specific values.

### Chains

Exports from `src/config/chains.ts`:

- `megaETH`
- `SUPPORTED_CHAINS`

Runtime lookup from `src/config/index.ts`:

- `CHAIN_ID_TO_CHAIN`

### Token metadata

Shared shape:

```ts
export interface Token {
  name: string;
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  logoURI?: string;
}
```

Public token maps:

- `WETH`
- `USDC`
- `USDM`
- `USDT0`

Important nuance:

- `USDM`, `USDT0`, `MARKETS_REGISTRY`, `FEE_REGISTRY`, and
  `ERC_TOKENS_RESTRICTION_MODULE` are partial maps because those deployments do
  not exist on every supported chain

### Contract address maps

Public address maps:

- `PERMIT2_ADDRESS`
- `OPTION_MARKET_VAULT`
- `EXCHANGE`
- `MARKETS_REGISTRY`
- `ENTRY_POINT`
- `SIMPLE_ACCOUNT_FACTORY`
- `FEE_REGISTRY`
- `ERC_TOKENS_RESTRICTION_MODULE`

## Shared DTOs

Source files:

- `src/shared/index.ts`
- `src/shared/types.ts`

These types are the transport layer between the SDK, the HTTP API, and
frontend consumers. Numeric fields are usually strings so they can be moved
safely over JSON.

### Order transport types

Main exports:

- `Order`
- `OrderSignature`
- `OrderStatus`
- `TimeInForce`
- `CreateOrderParams`
- `CreateOrderRequest`
- `StoredOrder`
- `MatchableOrder`
- `MatchRequest`
- `MatchedOrder`
- `MatchResult`
- `CreateOrderResult`
- `OrderResponse`
- `OrdersSnapshot`

Main order write shape:

```ts
export interface CreateOrderParams {
  marketId: string;
  order: Order;
  signature: OrderSignature;
  operator?: string;
  timeInForce?: TimeInForce;
  postOnly?: boolean;
}
```

Main order read shape:

```ts
export interface StoredOrder {
  orderHash: string;
  signature: OrderSignature;
  marketId: string;
  tokenId: string;
  remainingMakerAmount: string;
  order: Order;
  operator?: string;
  createdAt: number;
  status: OrderStatus;
  side: "bid" | "ask";
  price: number;
}
```

### Market DTOs

Public exports:

- `MarketInstrument`
- `Market`
- `MarketResponse`
- `MarketsResponse`

`MarketInstrument` carries strike-level data such as paired token ids,
top-of-book values, recent prices, collateral totals, and supply.

`Market` wraps market-level metadata such as pricing increments, token
addresses, fee fields, expiry, and nested `instruments`.

### Position and PnL DTOs

Public exports:

- `UserPosition`
- `TradingPnL`
- `UserPnL`
- `TokenPnL`
- `Erc20PnL`

### History DTOs

Public exports:

- `MintHistoryItem`
- `RedeemHistoryItem`
- `UnwindHistoryItem`
- `TransferHistoryItem`
- `OrderFillHistoryItem`
- `MarketTradeItem`
- `UserHistories`

`UserHistories` groups `mints`, `redeems`, `unwinds`, `transfers`, and
`fills`.

## Root-Level Helpers

### Smart-account helpers

Source file:

- `src/smart-account.ts`

These helpers are for deterministic account derivation and deployment checks
aligned with the `SimpleAccountFactory`-style surface used elsewhere in the
Stryke stack.

Public types:

- `SmartAccountConfig`
- `SmartAccountResult`

Public functions:

- `getCurrentSalt(accountCount)`
- `getSmartAccountAddress(client, factoryAddress, owner, depositor, salt)`
- `getAccountCount(client, factoryAddress, owner)`
- `isSmartAccountDeployed(client, address)`
- `getCurrentSmartAccount(client, factoryAddress, owner, depositor)`

Public class:

- `SmartAccountHelper`
  - `factoryAddress`
  - `getAddress(client, owner, depositor, salt)`
  - `getAccountCount(client, owner)`
  - `getCurrent(client, owner, depositor)`
  - `isDeployed(client, address)`

These helpers do not execute user operations and are intentionally small.

### Address

Source file:

- `src/address.ts`

Public surface:

- `Address.NATIVE_CURRENCY`
- `Address.zeroAddress`
- `Address.fromBigInt(val)`
- `Address.fromFirstBytes(bytes)`
- `toString()`
- `equal(other)`
- `isNative()`
- `isZero()`
- `lastHalf()`

### Bps

Source file:

- `src/bps.ts`

Public surface:

- `Bps.ZERO`
- `Bps.fromPercent(val, base?)`
- `Bps.fromFraction(val, base?)`
- `equal(other)`
- `isZero()`
- `toPercent(base?)`
- `toFraction(base?)`
- `toString()`

`Bps` constrains values to the inclusive range `[0, 10000]`.

### Compatibility constants

Source file:

- `src/constants.ts`

Public surface:

- `ZX`
- `getExchangeContract(chainId)`
- `getLimitOrderContract(chainId)`
- `getMarketsRegistryContract(chainId)`
- `getNativeOrderFactoryContract(chainId)`
- `getNativeOrderImplContract(chainId)`

The exchange and registry accessors remain useful. The native order factory and
impl helpers are mostly compatibility-oriented bridge helpers.

## Utilities

Source files:

- `src/utils/mul-div.ts`
- `src/utils/rand-bigint.ts`
- `src/utils/orderUtils.ts`

This folder contains small reusable helpers that do not belong to a single
domain module but are still part of the public SDK surface.

### `mulDiv` and `Rounding`

Public exports:

- `Rounding`
  - `Ceil`
  - `Floor`
- `mulDiv(a, b, x, rounding?)`

`mulDiv` performs integer multiplication and division in one step using
`bigint` arithmetic.

### `randBigInt`

Public export:

- `randBigInt(max)`

Behavior:

- returns a cryptographically secure random bigint in `[0, max]`
- requires `globalThis.crypto.getRandomValues`
- throws if no secure random source is available

### Order utility helpers

Public exports:

- `optionPrmToPrmTokenId(tokenId)`
- `prmToOptionPrmTokenId(prmTokenId)`
- `isComplementaryOptionTokenPair(tokenIdA, tokenIdB)`
- `verifyOrderSignature(order, signature, chainId, exchangeAddress)`

These overlap conceptually with the exchange and vault modules, but they are
useful when a caller wants the smallest possible helper surface.

## Development

```bash
bun install
bun run build
bun test src
```

Available scripts from `package.json`:

- `bun run build`
- `bun run test`
- `bun run typecheck`
- `bun run test:e2e`
- `bun run fill-orderbook`

## Legacy Docs

The repository still contains older reference material under `docs/`:

- `docs/CROSS_REPO_INTEGRATION.md`
- `docs/orderbook-integration.md`
- `docs/API_REFERENCE.md`
- `docs/refactor-docs/LimitOrderProtocol_FEE_HOWTO.md`
- `docs/refactor-docs/OptionMarketVault_AUDITOR_SPEC.md`
- `docs/refactor-docs/OptionMarketVault_CEO_SUMMARY.md`
- `docs/refactor-docs/OptionMarketVault_DEV_SPEC.md`
- `docs/refactor-docs/OptionMarketVault_PUBLIC.md`
- `docs/refactor-docs/SDK_TECHNICAL_SPEC.md`

This root README is now the single repository-level README entry point, while
the `docs/` directory remains available for deeper historical or protocol
context.
