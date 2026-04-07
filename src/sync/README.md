# Sync Guide

The `sync` module contains the SDK's realtime clients. These clients keep a
frontend or service in sync with depth and activity streams without each
consumer rewriting its own websocket lifecycle, reconnect, sequencing, and
normalization logic.

## Source map

- [`index.ts`](./index.ts) re-exports the public sync surface
- [`types.ts`](./types.ts) defines shared lifecycle and sequencing types
- [`clients/base-client.ts`](./clients/base-client.ts) provides an extensible
  base class for Redis-backed sequenced streams
- [`clients/order-client.ts`](./clients/order-client.ts) implements
  market-depth syncing
- [`clients/activity-client.ts`](./clients/activity-client.ts) implements order
  fill activity syncing

## What this module is for

In plain language:

- it keeps a local orderbook view current
- it emits lifecycle updates such as connecting, syncing, and recovering
- it gives callers normalized callback hooks instead of raw websocket messages

## Shared sync types

[`types.ts`](./types.ts) exports the shared lifecycle and sequencing model:

- `SyncStatus`
  - `"connecting" | "syncing" | "synced" | "recovering" | "disconnected" | "error"`
- `OrderChange`
  - a single `INSERT`, `UPDATE`, or `DELETE` orderbook mutation
- `SequencedMessage`
  - `{ seq, previousSeq, marketId, change, timestamp }`
- `SyncClientConfig`
  - base config shape for sequenced sync clients

## MarketDepthSyncClient

`MarketDepthSyncClient` is the main realtime client for market depth. It keeps
token-level bid and ask books, tracks per-token sequence ids, normalizes price
keys, handles reconnect logic, and exposes readable snapshot and delta hooks.

### Config

`MarketDepthClientConfig` from [`clients/order-client.ts`](./clients/order-client.ts):

- `wsUrl`
- `marketId`
- `tokenIds`
- `heartbeatIntervalMs?`
- `heartbeatTimeoutMs?`
- `maxReconnectAttempts?`
- `initialReconnectDelayMs?`
- `maxReconnectDelayMs?`

### Connection methods

- `connect()`
- `disconnect()`
- `getStatus()`

### Read methods

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

### Listener hooks

- `onStatus(callback)`
- `onSnapshot(callback)`
- `onDelta(callback)`

### Public event types

- `DepthLevel`
- `TokenDepthSnapshot`
- `DepthLevelUpdate`
- `DepthChangeEvent`
- `DepthUpdate`

```ts
import { MarketDepthSyncClient } from "@stryke-xyz/premarket-sdk";

const client = new MarketDepthSyncClient({
  wsUrl: "wss://example.stryke.xyz",
  marketId: "12",
  tokenIds: ["123", "124"],
});

client.onSnapshot((snapshots) => {
  console.log("initial snapshots", snapshots);
});

client.onDelta((marketId, update) => {
  console.log("delta", marketId, update);
});

await client.connect();
```

Useful details captured by the implementation:

- the client rejects invalid non-websocket URLs
- it waits for initial snapshots before resolving `connect()`
- it deduplicates sequence ids and detects gaps
- depth lookups normalize equivalent price strings like `"1"` and `"1.000000"`

## ActivitySyncClient

`ActivitySyncClient` subscribes to order-fill activity for a market, a user, or
both. It is intentionally simpler than the depth client because it does not
maintain a mutable book; it forwards fill events as they arrive.

### Config

`ActivityClientConfig` from [`clients/activity-client.ts`](./clients/activity-client.ts):

- `wsUrl`
- `marketId?`
- `userAddress?`
- `heartbeatIntervalMs?`
- `heartbeatTimeoutMs?`
- `maxReconnectAttempts?`
- `initialReconnectDelayMs?`
- `maxReconnectDelayMs?`

At least one of `marketId` or `userAddress` is required.

### Connection methods

- `connect()`
- `disconnect()`
- `getStatus()`

### Listener hooks

- `onStatus(callback)`
- `onOrderFill(callback)`
- `onUserFill(callback)`
- `onMarketFill(callback)`

### Event type

- `OrderFillEvent`

```ts
import { ActivitySyncClient } from "@stryke-xyz/premarket-sdk";

const activity = new ActivitySyncClient({
  wsUrl: "wss://example.stryke.xyz",
  marketId: "12",
});

activity.onMarketFill((event) => {
  console.log("fill", event.orderHash, event.makingAmount, event.takingAmount);
});

await activity.connect();
```

## BaseSyncClient

`BaseSyncClient` in [`clients/base-client.ts`](./clients/base-client.ts) is an
advanced extension surface for sequenced Redis-backed streams. It is exported so
integrators can build their own sync clients on the same foundation when
necessary.

Public methods:

- `connect()`
- `disconnect()`
- `getStatus()`
- `isSynced()`
- `getLastSequence()`
- `getBufferedCount()`
- `onStatus(callback)`
- `onChange(callback)`
- `onSnapshot(callback)`

What it handles for subclasses:

- websocket subscription lifecycle
- initial snapshot gating
- sequence ordering and deduplication
- full resync on gap detection
- listener registration and notification

What subclasses must provide:

- `fetchSnapshot()`
- `applyMessage(message)`

If you do not need to build a custom client, prefer `MarketDepthSyncClient` or
`ActivitySyncClient`.

## Recommended usage

- use `MarketDepthSyncClient` when the UI needs an interactive orderbook
- use `ActivitySyncClient` when the UI needs trade tape or user activity feeds
- use `BaseSyncClient` only when you are creating a new specialized sync client
  on top of the same sequencing model

For snapshot DTOs used alongside these streams, see the
[Shared types guide](../shared/README.md).
