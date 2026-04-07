# API Guide

The `api` module gives the SDK two high-level integration surfaces:

- `OrderHelper`
  - a workflow helper for building, hashing, serializing, signing, and
    recovering orders
- `OrderbookApi`
  - the HTTP client for orderbook, market, user, history, and analytics reads

This is the module most frontend and backend product teams use directly.

## Source map

- [`index.ts`](./index.ts) re-exports the public API surface
- [`order-helper.ts`](./order-helper.ts) wraps exchange helpers into an
  integration-friendly class
- [`orderbook-api/index.ts`](./orderbook-api/index.ts) implements the HTTP
  client
- [`orderbook-api/deserializers.ts`](./orderbook-api/deserializers.ts) converts
  string-heavy responses into bigint-friendly client-side objects
- [`../shared/types.ts`](../shared/types.ts) defines the request and response
  DTOs consumed by `OrderbookApi`

## OrderHelper

`OrderHelper` exists so most consumers do not need to manually stitch together
`buildExchangeOrder`, `getExchangeTypedData`, `hashExchangeOrder`, and the
serialization helpers.

```ts
import {
  OrderHelper,
  SignatureType,
  TradeType,
} from "@stryke-xyz/premarket-sdk";

const helper = new OrderHelper({
  chainId: 4326,
  exchangeAddress: "0xCf24f40D2dd88084e9C28FE34Ba9E24AFDACb7C2",
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
```

### Constructor config

`OrderHelperConfig`:

- `chainId`
  - used for hashing and typed-data generation
- `exchangeAddress`
  - the verifying contract used in EIP-712 signatures

### Public methods

- `buildOrder(params)`
  - generic normalized order builder
- `buildSellOrder(params)`
  - convenience helper that pins `tradeType = SELL`
- `buildBuyOrder(params)`
  - convenience helper that pins `tradeType = BUY`
- `serializeOrder(order)`
  - converts `ExchangeOrder` into `SerializedExchangeOrder`
- `hashOrder(order)`
  - EIP-712 digest for the configured chain and exchange address
- `getTypedData(order)`
  - typed-data payload suitable for a wallet signer
- `signEip712Order(order, walletClient)`
  - only valid for `SignatureType.EIP712`
- `signSimpleAccountOrder(order, ownerWalletClient)`
  - only valid for `SignatureType.ERC1271`
  - intended for `SimpleAccount`-compatible flows where the maker contract
    validates a raw owner signature against the native order hash
- `signOrder(order, walletClient)`
  - compatibility alias for `signEip712Order`
- `recoverOrderSigner(order, signature)`
  - recovers the address that signed the order payload

```ts
const signature = await helper.signEip712Order(order, walletClient);
const payloadOrder = helper.serializeOrder(order);
const signer = await helper.recoverOrderSigner(order, signature);
```

## OrderbookApi

`OrderbookApi` is a fetch-based client that understands the backend's envelope
format, normalizes URLs, surfaces clearer errors, and exposes typed return
values for the main public read and write flows.

```ts
import { OrderbookApi } from "@stryke-xyz/premarket-sdk";

const api = new OrderbookApi({
  baseUrl: "https://example.stryke.xyz",
});
```

### Constructor config

`OrderbookApiConfig` from [`../shared/types.ts`](../shared/types.ts):

- `baseUrl`
  - root URL for the backend
- `fetchFn?`
  - optional injected `fetch` implementation for tests or custom runtimes

## Order endpoints

Public order methods:

- `createOrder(params, bearerToken)`
  - creates a new order with bearer auth
- `getOrder(orderHash)`
  - returns `StoredOrder | null`
- `queryOrders(params)`
  - list endpoint for orderbook snapshots
- `getUserOrders(maker, marketId)`
  - market-scoped user order lookup
- `getDepthSnapshot(marketId, tokenId)`
  - point-in-time depth snapshot for a market and token pair

```ts
const api = new OrderbookApi({ baseUrl: "https://example.stryke.xyz" });

await api.createOrder(
  {
    marketId: payloadOrder.marketId,
    order: payloadOrder,
    signature,
    timeInForce: "GTC",
    postOnly: false,
  },
  bearerToken,
);

const snapshot = await api.queryOrders({ marketId: "1", limit: 50 });
const mine = await api.getUserOrders(
  "0x1111111111111111111111111111111111111111",
  "1",
);
```

Important integration note:

- `getUserOrders` enforces `marketId` at runtime
- `queryOrders` accepts an optional `marketId` in its TypeScript type, but the
  documented backend contract expects callers to provide one for reliable
  integration behavior

## Market endpoints

Public market methods:

- `getMarkets()`
  - returns `MarketsResponse["data"]`
- `getMarketRecentTrades(marketId, limit?)`
  - returns `MarketTradeItem[]`
- `getMarket(marketId)`
  - returns `MarketResponse["data"] | null`

```ts
const markets = await api.getMarkets();
const market = await api.getMarket("12");
const trades = await api.getMarketRecentTrades("12", 25);
```

## User positions and PnL

Public user analytics methods:

- `getUserPositions(userAddress)`
- `getUserTradingPnL(userAddress)`
- `getUserPnL(userAddress)`
- `getTokenPnL(userAddress, tokenId)`
- `getErc20PnL(userAddress, tokenAddress)`

These methods return the shared transport DTOs documented in the
[Shared types guide](../shared/README.md).

```ts
const positions = await api.getUserPositions(userAddress);
const trading = await api.getUserTradingPnL(userAddress);
const summary = await api.getUserPnL(userAddress);
```

## Histories

Public history methods:

- `getUserHistories(userAddress, limit?)`
- `getMintHistory(userAddress, limit?)`
- `getRedeemHistory(userAddress, limit?)`
- `getUnwindHistory(userAddress, limit?)`
- `getTransferHistory(userAddress, limit?)`
- `getFillHistory(userAddress, limit?)`

These methods are useful when a frontend needs user-facing activity feeds, or
when a backend wants typed access to grouped historical data without hand-rolled
endpoint wrappers.

## Deserializers

The API returns string-heavy DTOs because JSON cannot safely transport `bigint`
values. [`orderbook-api/deserializers.ts`](./orderbook-api/deserializers.ts)
provides opt-in conversion helpers for clients that prefer `bigint` values.

Public helpers:

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

```ts
import {
  marketsToBigInt,
  OrderbookApi,
} from "@stryke-xyz/premarket-sdk";

const api = new OrderbookApi({ baseUrl: "https://example.stryke.xyz" });
const marketData = await api.getMarkets();
const bigintMarketData = marketsToBigInt(marketData);
```

## Public request and response types

The API client relies on the DTOs exported from [`../shared/types.ts`](../shared/types.ts).
The most important public request and response shapes are:

- order write and read types
  - `CreateOrderParams`
  - `CreateOrderRequest`
  - `StoredOrder`
  - `OrderQueryParams`
  - `OrdersSnapshot`
  - `QueryOrdersResponse`
  - `DepthSnapshot`
- market types
  - `Market`
  - `MarketInstrument`
  - `MarketResponse`
  - `MarketsResponse`
  - `MarketTradeItem`
- user and analytics types
  - `UserPosition`
  - `TradingPnL`
  - `UserPnL`
  - `TokenPnL`
  - `Erc20PnL`
  - `UserHistories`
  - `MintHistoryItem`
  - `RedeemHistoryItem`
  - `UnwindHistoryItem`
  - `TransferHistoryItem`
  - `OrderFillHistoryItem`

Those interfaces are broken down field-by-field in the
[Shared types guide](../shared/README.md).

## Restricted and sensitive surfaces

`OrderbookApi` also exposes auth helpers:

- `getChallenge({ address, chainId })`
- `verifyAuth({ account, nonce, signature, chainId, expiresAt })`

These methods are part of the public SDK surface, but this document does not
provide a field-by-field auth payload reference. The goal of the new docs is to
cover the general integration contract well without turning the repository docs
into an auth operations manual.

## How to choose between exchange and api modules

- use the [Exchange guide](../exchange/README.md) when you need low-level order
  math, typed-data primitives, or calldata builders
- use this module when you want the ergonomics most applications need:
  `OrderHelper`, `OrderbookApi`, and optional bigint deserializers
