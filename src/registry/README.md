# Registry Guide

The `registry` module wraps the `MarketsRegistry` contract surface that the SDK
needs for market configuration and market serialization. It is intentionally
small: the goal is to keep market definitions consistent across contracts,
backend services, and frontend consumers.

## Source map

- [`index.ts`](./index.ts) re-exports the public registry surface
- [`types.ts`](./types.ts) defines market structs and serializers
- [`markets-registry-contract.ts`](./markets-registry-contract.ts) encodes
  `MarketsRegistry` calldata

## What this module is for

In plain language:

- it describes the market configuration shape used across the system
- it converts that shape between `bigint` form and string-safe transport form
- it encodes the registry's live write surface without each consumer shipping
  its own ABI wrapper

## Market types

[`types.ts`](./types.ts) exports the registry's main data model:

- `MarketType`
  - `ERC20xERC20`
  - `ERC20xERC6909`
- `RegistryMarket`
  - bigint-based market definition used in code
- `SerializedRegistryMarket`
  - string-safe market definition for JSON payloads and config files

Core fields include:

- token addresses: `underlying`, `collateral`, `delivery`, `owner`
- sizing and strike metadata: `tickSize`, `tickSpacing`, `tokensPerTickSize`
- expiry and fee fields: `expiry`, `depositFeeBps`, `redeemFeeBps`,
  `makerFeeBps`, `takerFeeBps`, `rolloverFeeBps`
- runtime flags: `marketType`, `isCollateralScaled`, `nonRollable`

Serialization helpers:

- `serializeRegistryMarket(market)`
- `deserializeRegistryMarket(market)`

```ts
import {
  MarketType,
  serializeRegistryMarket,
} from "@stryke-xyz/premarket-sdk";

const market = serializeRegistryMarket({
  underlying: "0x1111111111111111111111111111111111111111",
  collateral: "0x2222222222222222222222222222222222222222",
  delivery: "0x3333333333333333333333333333333333333333",
  owner: "0x4444444444444444444444444444444444444444",
  tickSize: 100n,
  tickSpacing: 100n,
  tokensPerTickSize: 1_000_000n,
  expiry: 1_900_000_000n,
  depositFeeBps: 0n,
  redeemFeeBps: 0n,
  makerFeeBps: 2_000n,
  takerFeeBps: 2_000n,
  rolloverFeeBps: 0n,
  marketType: MarketType.ERC20xERC6909,
  isCollateralScaled: false,
  nonRollable: false,
});
```

## Contract wrapper

`MarketsRegistryContract` in
[`markets-registry-contract.ts`](./markets-registry-contract.ts) wraps the
shipped registry ABI and returns either calldata or a minimal tx envelope.

```ts
import {
  MarketType,
  MarketsRegistryContract,
} from "@stryke-xyz/premarket-sdk";

const registry = new MarketsRegistryContract(registryAddress);

const tx = registry.buildAddMarketTx({
  underlying: "0x1111111111111111111111111111111111111111",
  collateral: "0x2222222222222222222222222222222222222222",
  delivery: "0x3333333333333333333333333333333333333333",
  owner: "0x4444444444444444444444444444444444444444",
  tickSize: 100n,
  tickSpacing: 100n,
  tokensPerTickSize: 1_000_000n,
  expiry: 1_900_000_000n,
  depositFeeBps: 0n,
  redeemFeeBps: 0n,
  makerFeeBps: 2_000n,
  takerFeeBps: 2_000n,
  rolloverFeeBps: 0n,
  marketType: MarketType.ERC20xERC6909,
  isCollateralScaled: false,
  nonRollable: false,
});
```

Public surfaces:

- `RegistryTransactionCall`
  - `{ to, value?, data }`
- `MarketsRegistryContract`
  - `getAddMarketCalldata(market)`
  - `buildAddMarketTx(market)`
  - `getUpdateTokenCalldata(token, isStable, isDelete)`
  - `getSetWhitelistedCalldata(account, allowed)`
  - `getUpdateMarketExpiryCalldata(marketId, expiry)`
  - `getMulticallCalldata(data)`

Important nuance:

- only `buildAddMarketTx` currently returns a full transaction object
- the remaining helpers return raw calldata, which is often what relayers,
  deployment scripts, or admin consoles actually want

## Restricted surfaces

Most registry writes are administrative by nature. The SDK documents them
because they are exported and useful to privileged tooling, but they should not
be treated as ordinary end-user operations:

- `getAddMarketCalldata`
- `buildAddMarketTx`
- `getUpdateTokenCalldata`
- `getSetWhitelistedCalldata`
- `getUpdateMarketExpiryCalldata`
- `getMulticallCalldata`

## How this module fits with the rest of the SDK

- the [Vault guide](../vault/README.md) uses registry-aligned market fields for
  collateral and settlement math
- the [Config guide](../config/README.md) ships deployed registry addresses
- the [API guide](../api/README.md) returns market DTOs that map naturally back
  to `RegistryMarket`-style concepts

When protocol market semantics change, this module is one of the first places
that should be updated, because downstream consumers assume it represents the
canonical market shape.
