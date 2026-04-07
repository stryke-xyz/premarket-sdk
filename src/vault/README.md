# Vault Guide

The `vault` module documents the SDK surface built around
`OptionMarketVault`. It covers token-id derivation, collateral and settlement
math, role constants, and transaction builders for mint, redeem, withdraw,
rollover, and related flows.

## Source map

- [`index.ts`](./index.ts) re-exports the public vault surface
- [`types.ts`](./types.ts) defines vault-level structs used across helpers
- [`token-ids.ts`](./token-ids.ts) derives `PRM` and `oPRM` token ids
- [`collateral.ts`](./collateral.ts) mirrors collateral and payoff math
- [`transactions.ts`](./transactions.ts) builds calldata and transaction envelopes
- [`constants.ts`](./constants.ts) exports precision constants and role enums

## What this module is for

In plain language:

- it tells integrators how option position tokens are identified
- it lets frontends and services estimate collateral, fees, and payouts without
  re-implementing Solidity math
- it gives callers ABI-backed transaction builders for the public vault flows

## Vault concepts

The vault mints paired ERC-6909 position ids:

- `PRM`
  - the collateral-side position token
  - always even
- `oPRM`
  - the option claim token
  - always odd

The pairing rule is simple and intentional:

- `oPrmTokenId = prmTokenId | 1`
- `optionPrmToPrm(tokenId)` clears the low bit and returns the canonical `PRM`
  id whether the input is already `PRM` or `oPRM`

This convention is used throughout the SDK and should be treated as canonical.

## Public types

The main type definitions live in [`types.ts`](./types.ts):

- `VaultInstrument`
  - `{ marketId, tick, isCall }`
  - used when minting or describing a strike-side instrument
- `VaultMarket`
  - bigint-based market shape matching the vault and registry configuration
- `PrmInfo`
  - metadata associated with a minted `PRM` family
- `TokenIdParams`
  - the full parameter set needed to derive a token id

[`collateral.ts`](./collateral.ts) also exports calculation-specific types:

- `MarketParams`
- `InstrumentParams`
- `SpreadBounds`

These smaller helper types are useful when callers only need the math helpers
and not the full market struct.

## Precision constants and roles

[`constants.ts`](./constants.ts) exposes the shared vault constants:

- `VAULT_TOKEN_PRECISION = 1e18`
- `FEE_BPS_PRECISION = 1e6`
- `PNL_PRECISION = 1e18`
- `Role`
  - typed enum for vault role ids
- `ROLE_NAMES`
  - a friendly lookup from numeric role to display label

Use these constants instead of hardcoding precision values in app code.

## Token-id helpers

[`token-ids.ts`](./token-ids.ts) is the public source of truth for position-id
derivation.

Public helpers:

- `getPrmTokenId(params)`
  - derives the even `PRM` token id from vault address, instrument, expiry, and
    `chainId`
- `getOptionPrmTokenId(params)`
  - derives the odd `oPRM` token id
- `prmToOptionTokenId(prmTokenId)`
- `optionPrmToPrm(oPrmTokenId)`
- `isPrmToken(tokenId)`
- `isOptionPrmToken(tokenId)`
- `getPositionId(tokenId, userAddress)`
  - stable string key for app-side storage keyed by token and user

```ts
import {
  getOptionPrmTokenId,
  optionPrmToPrm,
} from "@stryke-xyz/premarket-sdk";

const oPrmTokenId = getOptionPrmTokenId({
  vaultAddress: "0xVault",
  marketId: 12n,
  tick: 1500n,
  isCall: true,
  expiry: 1_735_689_600n,
  chainId: 4326,
});

const prmTokenId = optionPrmToPrm(oPrmTokenId);
```

Implementation detail worth remembering:

- `getPrmTokenId` hashes the vault address, instrument fields, expiry, and
  `chainId`, then left-shifts once to force even parity

## Collateral and settlement math

[`collateral.ts`](./collateral.ts) mirrors the important deterministic math used
by the vault contract. This makes it safe to pre-compute values in the UI or a
backend without sacrificing contract parity.

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

```ts
import {
  calculateCollateralAmount,
  calculateWithdrawableCollateral,
} from "@stryke-xyz/premarket-sdk";

const collateral = calculateCollateralAmount(
  1_000_000_000_000_000_000n,
  { marketId: 1n, tick: 1500n, isCall: true },
  {
    tickSize: 100n,
    tickSpacing: 100n,
    tokensPerTickSize: 1_000_000n,
    isCollateralScaled: false,
  },
);

const withdrawable = calculateWithdrawableCollateral(
  { marketId: 1n, tick: 1500n, isCall: true },
  {
    tickSize: 100n,
    tickSpacing: 100n,
    tokensPerTickSize: 1_000_000n,
    isCollateralScaled: false,
  },
  1_600n,
  1_000_000_000_000_000_000n,
);
```

Important behavior captured by the SDK:

- spread width falls back to `1` when `tickSpacing <= tickSize`
- strike-scaled collateral uses `instrument.tick`
- collateral calculation rounds up when the final division is not exact
- inverse `PRM` previews use floor division
- payoff and withdraw math use deterministic `bigint` arithmetic throughout

## Transaction builders

[`transactions.ts`](./transactions.ts) contains ABI-backed transaction builders.
These return a lightweight `TransactionCall`:

```ts
export interface TransactionCall {
  to: `0x${string}`;
  value?: bigint;
  data: Hex;
}
```

### User-facing lifecycle builders

- `buildMintTransaction(vaultAddress, instrument, amount)`
- `buildWithdrawTransaction(vaultAddress, prmTokenId, amount, receiver)`
- `buildRedeemTransaction(vaultAddress, oPrmTokenId, receiver)`
- `buildUnwindTransaction(vaultAddress, prmTokenId, amount, receiver)`
- `buildRolloverTransaction(vaultAddress, oldPrmTokenId)`
- `buildApproveTransaction(tokenAddress, spender, amount?)`
- `buildBatchedMintTransactions(collateralTokenAddress, vaultAddress, instrument, collateralAmount, prmAmount)`
- `buildSetOperatorTransaction(vaultAddress, operator, approved)`

```ts
import {
  buildApproveTransaction,
  buildMintTransaction,
} from "@stryke-xyz/premarket-sdk";

const approve = buildApproveTransaction(collateralToken, vaultAddress);
const mint = buildMintTransaction(
  vaultAddress,
  { marketId: 12n, tick: 1500n, isCall: true },
  1_000_000_000_000_000_000n,
);
```

### Restricted and role-gated builders

These functions are exported because they are part of the SDK, but they belong
to operational or keeper-style flows rather than ordinary end-user integrations:

- `buildDelegateRedeemTransaction`
- `buildDelegateRolloverTransaction`
- `buildDelegateWithdrawTransaction`
- `buildFillMarketDeliveryTransaction`
- `buildSetRolloverEnabledTransaction`
- `buildSetRoleTransaction`
- `buildUpdateFinalTickTransaction`
- `buildUpdateMarketExpiryTransaction`
- `buildUpdateMarketExpiryFromMarketTransaction`

They should usually be used by privileged services, market operators, or
automation code that already understands the relevant role checks.

## Typical integration patterns

### 1. Preview before mint

Use the math helpers and token-id helpers together:

1. derive the target `PRM` or `oPRM` id
2. compute required collateral with `calculateCollateralAmount`
3. build `approve` and `mint` calls

### 2. Display settlement outcomes

Use:

- `isInTheMoney`
- `calculateSpreadProfit`
- `calculateRedeemFees`
- `calculateWithdrawableCollateral`

This gives UI code a contract-aligned preview for both option holders and
collateral providers.

### 3. Build sponsored or batched flows

`buildBatchedMintTransactions` is especially helpful when a frontend or relayer
needs to bundle approval and minting into one user operation or multicall-like
flow.

For market configuration and market serialization, continue with the
[Registry guide](../registry/README.md).
