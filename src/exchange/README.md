# Exchange Guide

The `exchange` module is the trading core of the SDK. It models the native
order format used by Stryke's `Exchange` contract, reproduces its EIP-712
signing schema, mirrors the most important fee and crossing math, and encodes
calldata for fills, matches, cancellation, and batching.

For most trading integrations this is the first module to understand.

## Source map

- [`index.ts`](./index.ts) re-exports the public exchange surface
- [`types.ts`](./types.ts) defines in-memory and transport-safe order types
- [`order.ts`](./order.ts) builds and validates orders
- [`eip712.ts`](./eip712.ts) defines the domain, typed data, hashing, and signer
  recovery helpers
- [`math.ts`](./math.ts) mirrors pricing, fee, and crossing math
- [`exchange-contract.ts`](./exchange-contract.ts) encodes calldata for the
  shipped `Exchange` ABI
- [`errors.ts`](./errors.ts) decodes custom errors from core protocol ABIs

## What this module is for

In plain language:

- it tells wallets exactly what they are signing
- it gives resolvers and frontends a stable order shape
- it lets backend and UI code compute prices and fill amounts the same way the
  contract does
- it builds transaction payloads without each consumer bundling its own ABI

## Core order model

The canonical in-memory order type is [`ExchangeOrder`](./types.ts). Every
numeric field is a `bigint`, so callers do not lose precision between order
construction and signature generation.

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

- `TradeType`
  - `BUY = 0`
  - `SELL = 1`
- `SignatureType`
  - `EIP712 = 0`
  - `ERC1271 = 1`
- `SerializedExchangeOrder`
  - string-safe transport version for HTTP or persistence
- `ExchangeOrderStatus`
  - `{ isFilledOrCancelled, remaining }`
- `SerializedExchangeOrderStatus`
  - string-safe status payload
- `MulticallResult`
  - helper type for multicall consumers

## Building orders

`buildExchangeOrder` in [`order.ts`](./order.ts) normalizes an order before it
is signed or serialized:

- `salt` defaults to a random 96-bit-compatible value
- `receiver` defaults to `maker`
- `signatureType` defaults to `SignatureType.EIP712`
- `makingAmount`, `takingAmount`, and `deadline` must all be positive

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

Public builder and validation helpers:

- `buildExchangeOrder(params)`
  - returns a normalized `ExchangeOrder`
- `validateExchangeOrder(order)`
  - enforces the minimal numeric invariants expected by the contract
- `isOrderExpired(order, nowSec?)`
  - compares `deadline` against a supplied or current unix timestamp
- `getExecutableMakingAmount(order, status)`
  - resolves the important status edge case where
    `remaining === 0 && !isFilledOrCancelled` means the order is still fully
    open
- `getExchangeOrderHash(order, chainId, exchangeAddress)`
  - convenience wrapper around the typed-data hashing helper

## Signing and hashing

The EIP-712 implementation in [`eip712.ts`](./eip712.ts) is the contract-aligned
source of truth for signed order payloads.

Important constants:

- `EXCHANGE_EIP712_NAME = "Exchange"`
- `EXCHANGE_EIP712_VERSION = "1"`
- `EXCHANGE_ORDER_TYPES`
  - the exact typed-data fields and enum serialization used in signatures

Public helpers:

- `getExchangeDomain(chainId, verifyingContract)`
- `getExchangeTypedData(order, chainId, verifyingContract)`
- `hashExchangeOrder(order, chainId, verifyingContract)`
- `recoverExchangeOrderSigner(order, signature, chainId, verifyingContract)`

```ts
import {
  getExchangeTypedData,
  hashExchangeOrder,
} from "@stryke-xyz/premarket-sdk";

const typedData = getExchangeTypedData(order, 4326, exchangeAddress);
const digest = hashExchangeOrder(order, 4326, exchangeAddress);
```

Use these helpers whenever you need exact parity with onchain signature checks.
That includes CI, frontend signing, backend verification, and smart-account
flows that still sign the native `Exchange` order shape.

## Serialization helpers

`serializeExchangeOrder` and `deserializeExchangeOrder` in [`types.ts`](./types.ts)
bridge the two most common representations:

- `ExchangeOrder` for local calculations and signing
- `SerializedExchangeOrder` for APIs, storage, and JSON payloads

Likewise, `serializeOrderStatus` and `deserializeOrderStatus` make it safe to
transport status objects without losing `bigint` precision.

## Math helpers

[`math.ts`](./math.ts) contains the SDK's exchange-side arithmetic helpers.
These are intentionally small, deterministic, and contract-aligned.

Public constants:

- `EXCHANGE_ONE = 10n ** 18n`
- `FEE_RATE_BASE = 1_000_000n`

Public math functions:

- `getTakingAmount(fillMakingAmount, orderMakingAmount, orderTakingAmount)`
  - floor division from maker-side fill amount to taker-side fill amount
- `getMakingAmount(fillTakingAmount, orderMakingAmount, orderTakingAmount)`
  - inverse of the above, also using floor division
- `calculateFee(grossAmount, feeRate)`
  - validates `feeRate` is within `[0, 1e6]`
- `applyFee(grossAmount, feeRate)`
  - returns `{ fee, net }`
- `getOrderPriceWad(order)`
  - normalizes price into 1e18 precision
- `optionPrmToPrmId(tokenId)`
  - canonicalizes `oPRM` token ids to the underlying even `PRM` id
- `isCrossing(orderA, orderB)`
  - detects valid crosses for complementary trades and mint/merge style matches
- `hasValidTokenPairForMatch(orderA, orderB)`
  - enforces token pairing rules for cross, mint, and merge cases

```ts
import {
  applyFee,
  getTakingAmount,
  isCrossing,
} from "@stryke-xyz/premarket-sdk";

const takingAmount = getTakingAmount(250_000n, order.makingAmount, order.takingAmount);
const { fee, net } = applyFee(takingAmount, 2_000n);
const crossing = isCrossing(buyOrder, sellOrder);
```

## Calldata builders

`ExchangeContract` in [`exchange-contract.ts`](./exchange-contract.ts) wraps the
shipped ABI and returns either raw calldata or a minimal transaction envelope.

```ts
import { ExchangeContract } from "@stryke-xyz/premarket-sdk";

const exchange = new ExchangeContract(exchangeAddress);

const fillTx = exchange.buildFillOrderTx(order, 500_000n, signature);
const matchData = exchange.getMatchOrderCalldata(
  takerOrder,
  takerSignature,
  makerOrder,
  makerSignature,
  100_000n,
  100_000n,
);
```

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

`buildFillOrderTx` and `buildMatchOrderTx` are the only helpers that currently
return a full `{ to, data, value }` transaction object. The remaining methods
return encoded calldata so the caller can place them inside a broader tx or
user operation.

Restricted/admin surfaces:

- `getSetResolverWhitelistCalldata`
- `getSetFeeReceiverCalldata`
- `getPauseCalldata`
- `getUnpauseCalldata`

These are documented here because they are part of the export surface, but they
are operationally restricted and should not be treated as general-user flows.

## Error decoding

`decodeContractError` in [`errors.ts`](./errors.ts) attempts to decode a revert
payload against the shipped `Exchange`, `OptionMarketVault`, and
`MarketsRegistry` ABIs.

It returns either `null` or:

```ts
interface DecodedContractError {
  contract: "exchange" | "optionMarketVault" | "marketsRegistry";
  name: string;
  signature: string;
  args: readonly unknown[];
}
```

This is useful for frontend error messaging, backend diagnostics, and test
assertions where raw revert bytes are not enough.

## Recommended integration pattern

1. Build a normalized order with `buildExchangeOrder` or `OrderHelper`.
2. Hash or sign using the typed-data helpers.
3. Serialize the order before sending it to the API.
4. Use `ExchangeContract` to build fill or match calldata.
5. Use `decodeContractError` when surfacing or logging contract reverts.

If you want the higher-level workflow wrapper that bundles these steps together,
continue with the [API guide](../api/README.md), which documents `OrderHelper`.
