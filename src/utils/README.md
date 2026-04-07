# Utilities Guide

The `utils` folder contains small reusable helpers that do not belong to one
domain module but are still part of the SDK's public surface.

## Source map

- [`mul-div.ts`](./mul-div.ts) provides deterministic multiply-divide math with
  optional rounding up
- [`rand-bigint.ts`](./rand-bigint.ts) provides secure random bigint generation
- [`orderUtils.ts`](./orderUtils.ts) provides token-pair helpers and a
  signature-verification shortcut

## `mulDiv` and `Rounding`

`mulDiv(a, b, x, rounding?)` performs integer multiplication and division in one
step using `bigint` arithmetic.

Public exports:

- `Rounding`
  - `Ceil`
  - `Floor`
- `mulDiv(a, b, x, rounding?)`

```ts
import { Rounding, mulDiv } from "@stryke-xyz/premarket-sdk";

const floorValue = mulDiv(10n, 3n, 4n);
const ceilValue = mulDiv(10n, 3n, 4n, Rounding.Ceil);
```

This helper is especially relevant to the [Vault guide](../vault/README.md),
where collateral previews need deterministic rounding behavior.

## `randBigInt`

`randBigInt(max)` returns a cryptographically secure random bigint in the range
`[0, max]`.

```ts
import { randBigInt } from "@stryke-xyz/premarket-sdk";

const salt = randBigInt((1n << 96n) - 1n);
```

Implementation notes:

- it requires `globalThis.crypto.getRandomValues`
- it throws if no secure random source is available
- it is used by the exchange order builder for default salts

## Order utility helpers

[`orderUtils.ts`](./orderUtils.ts) exports a few low-level helpers that are
useful when app code needs token-id normalization or direct signature recovery.

Public exports:

- `optionPrmToPrmTokenId(tokenId)`
- `prmToOptionPrmTokenId(prmTokenId)`
- `isComplementaryOptionTokenPair(tokenIdA, tokenIdB)`
- `verifyOrderSignature(order, signature, chainId, exchangeAddress)`

```ts
import {
  isComplementaryOptionTokenPair,
  verifyOrderSignature,
} from "@stryke-xyz/premarket-sdk";

const complementary = isComplementaryOptionTokenPair(100n, 101n);
const signer = await verifyOrderSignature(
  order,
  signature,
  4326,
  exchangeAddress,
);
```

Relationship to the domain modules:

- the token-id helpers overlap conceptually with the [Vault guide](../vault/README.md)
  and [Exchange guide](../exchange/README.md)
- `verifyOrderSignature` is a thin convenience wrapper around exchange
  EIP-712 signer recovery

When you want the richer context and invariants, prefer the domain guides. When
you want the smallest possible helper for a utility task, this module is the
right place.
