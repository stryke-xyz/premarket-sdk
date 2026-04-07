# premarket-sdk

TypeScript SDK for Stryke premarket integrations across:

- `option-markets` contracts (`Exchange`, `MarketsRegistry`, `OptionMarketVault`)
- `smart-account` contracts (`SimpleAccountFactory`, `EntryPoint`)
- `premarkets-api` HTTP and WebSocket services
- `premarkets-interface` frontend runtime

This package is the shared integration layer between onchain contracts and the
application stack. It gives product teams one place to build orders, hash and
sign typed data, encode contract calls, read market and user data, subscribe to
live updates, and consume deployment constants.

## What This Package Provides

- native `Exchange` order builders, hashing, typed-data signing helpers, and
  calldata builders
- `OptionMarketVault` token-id helpers, collateral math, and transaction
  builders
- `MarketsRegistry` market serialization and contract calldata builders
- `OrderHelper` and `OrderbookApi` for backend and frontend integrations
- realtime sync clients for market depth and activity streams
- chain definitions, token metadata, and deployed contract addresses
- smart-account address derivation and deployment checks
- shared DTOs used by HTTP clients and frontend consumers

## Documentation Map

The new documentation set lives alongside the legacy docs during migration.
Start here, then drill into the module guide that matches the surface you are
integrating.

### Module guides

- [Exchange guide](./src/exchange/README.md)
- [Vault guide](./src/vault/README.md)
- [Registry guide](./src/registry/README.md)
- [API guide](./src/api/README.md)
- [Sync guide](./src/sync/README.md)
- [Config guide](./src/config/README.md)
- [Shared types guide](./src/shared/README.md)
- [Utilities guide](./src/utils/README.md)

### Root-level exports

The package root also exports a handful of single-file helpers that do not live
under one directory package:

- `smart-account`
  - Source: [`src/smart-account.ts`](./src/smart-account.ts)
  - Public surfaces: `SmartAccountHelper`, `getCurrentSalt`,
    `getSmartAccountAddress`, `getAccountCount`,
    `isSmartAccountDeployed`, `getCurrentSmartAccount`,
    `SmartAccountConfig`, `SmartAccountResult`
- `address`
  - Source: [`src/address.ts`](./src/address.ts)
  - Public surface: `Address`
- `bps`
  - Source: [`src/bps.ts`](./src/bps.ts)
  - Public surface: `Bps`
- compatibility and address helpers
  - Source: [`src/constants.ts`](./src/constants.ts)
  - Public surfaces: `ZX`, `getExchangeContract`,
    `getLimitOrderContract`, `getMarketsRegistryContract`,
    `getNativeOrderFactoryContract`, `getNativeOrderImplContract`
- generic utilities
  - Source: [`src/utils/mul-div.ts`](./src/utils/mul-div.ts),
    [`src/utils/rand-bigint.ts`](./src/utils/rand-bigint.ts),
    [`src/utils/orderUtils.ts`](./src/utils/orderUtils.ts)
  - Public surfaces: `mulDiv`, `Rounding`, `randBigInt`,
    `optionPrmToPrmTokenId`, `prmToOptionPrmTokenId`,
    `isComplementaryOptionTokenPair`, `verifyOrderSignature`

## Quick Start

The SDK is designed so an integrator can stay inside the package root for most
common workflows.

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

const payload = helper.serializeOrder(order);

const api = new OrderbookApi({ baseUrl: "https://example.stryke.xyz" });
await api.queryOrders({ marketId: payload.marketId });
```

For the exact order model, fill semantics, fee math, and typed-data schema, use
the [Exchange guide](./src/exchange/README.md). For API payloads and response
DTOs, use the [API guide](./src/api/README.md) and
[Shared types guide](./src/shared/README.md).

## Smart-Account Helpers

The package root exports the smart-account helpers from
[`src/smart-account.ts`](./src/smart-account.ts). These helpers are for
deterministic account derivation and deployment checks that match the
`SimpleAccountFactory`-style contract surface used by the wider Stryke stack.

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

```ts
import {
  SIMPLE_ACCOUNT_FACTORY,
  SmartAccountHelper,
} from "@stryke-xyz/premarket-sdk";

const helper = new SmartAccountHelper({
  factoryAddress: SIMPLE_ACCOUNT_FACTORY[4326],
});

const account = await helper.getCurrent(client, owner, depositor);
```

These helpers are intentionally small. They do not execute user operations or
act as a full account-abstraction SDK. Their job is to keep address derivation
and deployment checks aligned with the factory contract.

## Address And Bps Helpers

Two utility classes are exported from the package root for common app-side
operations.

### `Address`

Source: [`src/address.ts`](./src/address.ts)

Public surfaces:

- `Address.NATIVE_CURRENCY`
- `Address.zeroAddress`
- `Address.fromBigInt(val)`
- `Address.fromFirstBytes(bytes)`
- `toString()`
- `equal(other)`
- `isNative()`
- `isZero()`
- `lastHalf()`

This helper wraps address normalization and a few convenience checks that are
useful in UI and backend code.

### `Bps`

Source: [`src/bps.ts`](./src/bps.ts)

Public surfaces:

- `Bps.ZERO`
- `Bps.fromPercent(val, base?)`
- `Bps.fromFraction(val, base?)`
- `equal(other)`
- `isZero()`
- `toPercent(base?)`
- `toFraction(base?)`
- `toString()`

`Bps` is a small helper around basis-point values in the inclusive range
`[0, 10000]`.

## Compatibility Constants And Utilities

### Constants helpers

Source: [`src/constants.ts`](./src/constants.ts)

Public surfaces:

- `ZX`
- `getExchangeContract(chainId)`
- `getLimitOrderContract(chainId)`
- `getMarketsRegistryContract(chainId)`
- `getNativeOrderFactoryContract(chainId)`
- `getNativeOrderImplContract(chainId)`

The exchange and registry accessors are still useful. The native order factory
and impl helpers are compatibility-oriented and should be treated as legacy
bridge helpers rather than the center of new integrations.

### Utility functions

For the detailed utility reference, use the
[Utilities guide](./src/utils/README.md). The public root-level utility exports
are:

- `mulDiv`
- `Rounding`
- `randBigInt`
- `optionPrmToPrmTokenId`
- `prmToOptionPrmTokenId`
- `isComplementaryOptionTokenPair`
- `verifyOrderSignature`

## Documentation Principles

The new docs aim to serve both technical readers and product-adjacent readers:

- each module guide starts with purpose and system role
- every guide links directly to source files that implement the behavior
- public exports are documented in terms of both intent and exact runtime shape
- examples stay realistic and contract-aligned
- restricted or sensitive surfaces are acknowledged, but the docs avoid becoming
  an admin or auth operations manual

## Install

```bash
bun add @stryke-xyz/premarket-sdk
```

## Development

```bash
bun install
bun run build
bun test src
```

## Source Layout

- [`src/exchange`](./src/exchange): native order model, typed-data, math, and
  exchange calldata builders
- [`src/vault`](./src/vault): token-id helpers, collateral math, and vault
  transaction builders
- [`src/registry`](./src/registry): market serialization and registry calldata
  builders
- [`src/api`](./src/api): `OrderHelper`, `OrderbookApi`, and deserializers
- [`src/sync`](./src/sync): realtime market depth and activity clients
- [`src/config`](./src/config): chains, addresses, and token constants
- [`src/shared`](./src/shared): transport DTOs used across SDK, API, and UI

## Legacy Docs

The current docs remain available during the transition:

- [Cross-repo guide](./docs/CROSS_REPO_INTEGRATION.md)
- [Orderbook integration quick reference](./docs/orderbook-integration.md)
- [SDK API reference](./docs/API_REFERENCE.md)
- [Refactor notes and protocol specs](./docs/refactor-docs)

Once the new documentation set is fully adopted, these older guides can be
trimmed or removed with less migration risk.
