# Shared Types Guide

The `shared` module collects the DTOs that move between the SDK, the HTTP API,
and frontend consumers. These types are intentionally transport-oriented:
numeric fields are usually strings so they can be serialized safely over JSON.

## Source map

- [`index.ts`](./index.ts) re-exports the shared surface
- [`types.ts`](./types.ts) defines order, market, PnL, history, and snapshot DTOs

## Why this module matters

These types are the glue between:

- `OrderbookApi` in the [API guide](../api/README.md)
- frontend state and caches
- backend responses and request payloads
- SDK helpers that need a JSON-safe representation of onchain data

## Order transport types

### `Order`

`Order` is the serialized transport-safe order shape used by HTTP payloads:

```ts
export interface Order {
  salt: string;
  nonce: string;
  marketId: string;
  makingAmount: string;
  takingAmount: string;
  deadline: string;
  maker: string;
  receiver: string;
  tradeType: number;
  signatureType: number;
  tokenId: string;
}
```

Related order types:

- `OrderSignature`
  - raw `0x...` signature bytes
- `OrderStatus`
  - `OPEN`, `PARTIALLY_FILLED`, `FULLY_FILLED`, `CANCELLED`, `EXPIRED`
- `TimeInForce`
  - `FOK`, `FAK`, `GTC`, `GTD`
- `CreateOrderParams`
  - request body for `OrderbookApi.createOrder`
- `CreateOrderRequest`
  - alias of `CreateOrderParams`
- `StoredOrder`
  - persisted order record including status, side, price, remaining amount, and
    timestamps
- `MatchableOrder`
  - alias of `StoredOrder`
- `MatchRequest`
  - matching-oriented request model
- `MatchedOrder`
  - one resolved match leg
- `MatchResult`
  - aggregate match outcome
- `CreateOrderResult`
  - order creation result plus match details
- `OrderQueryParams`
  - query filters for list reads
- `OrderResponse`
  - generic envelope shape used by some backend responses
- `OrdersSnapshot`
  - `{ orders, count }`
- `QueryOrdersResponse`
  - paginated query result with `limit` and `offset`
- `DepthSnapshot`
  - point-in-time depth view for one market and token pair

### `CreateOrderParams`

This is the main order write payload:

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

### `StoredOrder`

This is the main order read model:

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

## Market DTOs

The market section of [`types.ts`](./types.ts) defines what the API returns for
catalog and single-market reads.

Public types:

- `MarketInstrument`
- `Market`
- `MarketResponse`
- `MarketsResponse`

`MarketInstrument` carries the tradable strike-level data:

- ids and labels
- `tick`, `isSpread`, `isCall`
- paired token ids: `prmTokenId`, `oPrmTokenId`
- top-of-book and recent price fields
- collateral and supply totals

`Market` wraps the market-level metadata:

- identifiers and descriptive fields
- price band and increment fields
- token addresses for `underlying`, `collateral`, and `delivery`
- fee fields and expiry
- `marketType`, `isCollateralScaled`, `nonRollable`
- nested `instruments`

`MarketsResponse` has the shape:

```ts
{
  success: true;
  data: {
    markets: Market[];
    total: number;
  };
}
```

## Position and PnL DTOs

Public types:

- `UserPosition`
- `TradingPnL`
- `UserPnL`
- `TokenPnL`
- `Erc20PnL`

These types separate position-level accounting from trading-level accounting:

- `UserPosition`
  - current holding and realized position PnL for one token id
- `TradingPnL`
  - realized trading activity grouped by asset and optional token id
- `UserPnL`
  - top-level aggregate summary
- `TokenPnL`
  - combined position and trading breakdown for one ERC-6909 token id
- `Erc20PnL`
  - combined trading breakdown for one ERC-20 token address

Use these types when rendering user dashboards or analytics screens.

## History DTOs

Public history types:

- `MintHistoryItem`
- `RedeemHistoryItem`
- `UnwindHistoryItem`
- `TransferHistoryItem`
- `OrderFillHistoryItem`
- `MarketTradeItem`
  - alias of `OrderFillHistoryItem`
- `UserHistories`

`UserHistories` groups the main public activity feeds:

```ts
export interface UserHistories {
  mints: MintHistoryItem[];
  redeems: RedeemHistoryItem[];
  unwinds: UnwindHistoryItem[];
  transfers: TransferHistoryItem[];
  fills: OrderFillHistoryItem[];
}
```

The individual item types carry the fields that matter to product experiences:

- transaction hash and block context
- token ids and amount strings
- sender, receiver, maker, and taker addresses where applicable
- timestamps suitable for activity feeds

## Depth snapshot type

`DepthSnapshot` is the HTTP snapshot companion to the realtime sync clients. It
contains the current bid and ask ladders plus market and token identifiers.

This type is commonly paired with the [Sync guide](../sync/README.md), where
`MarketDepthSyncClient` turns snapshot state into a continuously updated local
book.

## Sensitive and restricted DTOs

`types.ts` also exports `AuthChallenge`. The SDK keeps that type public because
the auth helpers use it, but this guide intentionally does not provide a full
field-by-field auth payload walkthrough. The focus here is the general public
integration contract used by application code.

## How to use these types well

- use `OrderHelper` or exchange serializers when converting between bigint
  orders and `Order`
- treat numeric strings as exact values, not display-formatted strings
- convert to `bigint` only at the application boundary where you need math
- prefer the deserializers in [`../api/orderbook-api/deserializers.ts`](../api/orderbook-api/deserializers.ts)
  when you want typed bigint conversion rather than ad hoc parsing
