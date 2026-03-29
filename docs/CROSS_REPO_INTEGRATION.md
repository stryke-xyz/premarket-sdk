# Premarket SDK Cross-Repo Integration Guide

This document is for developers working across:

- `option-markets` (contracts)
- `premarkets-api` (backend services)
- `premarkets-interface` (frontend)
- `smart-account` (account abstraction contracts)

It focuses on integration contracts and propagation rules, not just SDK internals.

## SDK Role In The System

`premarket-sdk` is the integration boundary between protocol contracts and application repositories:

- contracts -> SDK: ABI/types/math/signing semantics
- SDK -> backend/frontend: stable builders, DTO clients, chain/constants exports

If protocol behavior changes, this repo is expected to absorb most type-level churn first.

## Canonical Upstream Dependencies

Use these sources when updating SDK behavior:

- Contract semantics: `option-markets/docs/TECHNICAL_SPEC.md`
- Contract ABIs: `option-markets/docs/abi/*.abi.json`
- Backend endpoint contracts: `premarkets-api/docs/CROSS_REPO_INTEGRATION.md`
- Smart-account contracts/flows: `smart-account/CROSS_REPO_INTEGRATION.md`

## Core SDK Surfaces

### Native order and exchange

- `src/exchange/types.ts`
- `src/exchange/order.ts`
- `src/exchange/eip712.ts`
- `src/exchange/exchange-contract.ts`
- `src/api/order-helper.ts`

Expected invariants:

- EIP-712 domain: `Exchange`, version `1`
- signed payload fields must match `IExchange.Order` exactly
- signatures are raw `0x...` bytes (not split `{r, vs}`)
- EOA signing helpers must only sign `SignatureType.EIP712`; `ERC1271` orders are built and hashed by the SDK but signed by the smart-account flow
- `SimpleAccount`-compatible `ERC1271` helpers sign the same native `Exchange` typed data with the owner key and submit the raw 65-byte signature unchanged

### Vault and registry

- `src/vault/*`: token ids, collateral math, tx helpers
- `src/registry/*`: registry contract wrappers and types

Always use vault helper methods for token-id parity (`getPrmTokenId`, `optionPrmToPrm`) instead of re-deriving formulas externally.

### API client and sync clients

- `src/api/orderbook-api/index.ts`: HTTP client used by frontend
- `src/sync/*`: depth/activity websocket clients
- `src/config/*`: chains and address constants consumed by backend/frontend

### Smart-account surfaces

- `src/config/index.ts`: `ENTRY_POINT`, `SIMPLE_ACCOUNT_FACTORY`, `ERC_TOKENS_RESTRICTION_MODULE`
- `src/smart-account.ts`: `getAddress`, `accountCount`, and deployment helper methods

Keep these aligned with `smart-account/src/SimpleAccountFactory.sol` and active deployments.

## Endpoint Contract Discipline (SDK -> API)

The SDK client should call backend endpoints with required params, not optimistic probing.

Required examples:

- `GET /orderbook/api/orders` requires `marketId` query
- `GET /orderbook/api/orders/user/:maker` requires `marketId` query
- `GET /orderbook/api/balance` requires `address` and `tokenAddress` (+ auth)

When backend contracts change, update SDK client types and methods in the same PR or immediately after.

## Frontend Consumption Contract (SDK -> Interface)

The interface should rely on SDK for:

- order build/sign/hash (`OrderHelper`, `getExchangeTypedData`)
- chain/address constants (`EXCHANGE`, `OPTION_MARKET_VAULT`, `SIMPLE_ACCOUNT_FACTORY`, etc.)
- API DTO shapes where possible (`OrderbookApi`, shared types)

Frontend should avoid copying contract math or typed-data schemas into app code.

For smart-account paths specifically, frontend should also avoid hand-rolling account address derivation and rely on SDK/factory-compatible helpers.

## Backend Consumption Contract (SDK -> API)

`premarkets-api` should use SDK exports as canonical where possible for:

- exchange/vault/registry addresses/constants
- native order hashing/signature semantics
- shared order and market types used by HTTP boundaries
- smart-account constants used by relay paths (`SIMPLE_ACCOUNT_FACTORY`, `ENTRY_POINT`)

If backend intentionally diverges (transitional storage fields, compatibility DTOs), call this out in API docs.

## Change Propagation Playbook

### Contract change arrives from `option-markets`

1. Refresh ABIs/types in SDK first.
2. Update exchange/vault/registry helpers and tests.
3. Publish local package (Verdaccio or file dependency) for API/UI validation.
4. Propagate to `premarkets-api` and `premarkets-interface`.

### Smart-account change arrives from `smart-account`

1. Update `ENTRY_POINT` / `SIMPLE_ACCOUNT_FACTORY` / related constants in `src/config/index.ts`.
2. Update `src/smart-account.ts` helper assumptions (salt, method signatures, runtime checks).
3. Publish locally and propagate to `premarkets-api` relay service and `premarkets-interface` providers/hooks.
4. Validate one sponsored transaction flow end-to-end.

### Backend endpoint change arrives from `premarkets-api`

1. Update `OrderbookApi` methods, params, and return types.
2. Update SDK docs/examples and frontend callsites.
3. Add or update integration tests for affected SDK API methods.

### Frontend requirement change arrives from `premarkets-interface`

1. Prefer adding explicit SDK helper/DTO adapters over ad-hoc app logic.
2. Keep helper naming domain-specific and contract-aligned.
3. Backfill test coverage if helper semantics change.

## Local Development Notes

- package name: `@stryke-xyz/premarket-sdk`
- common local consumption pattern:
  - publish to local Verdaccio, then install by version in API/UI repos
  - or use a temporary `file:` dependency during active development
- validate at minimum:
  - SDK unit tests
  - order submission path in `premarkets-api`
  - frontend order create/cancel flow in `premarkets-interface`
  - frontend sponsored smart-account flow (deposit/withdraw/execute-batch)

## Deprecated Compatibility Notes

- Old package aliases/imports like `@premarket/sdk` or protocol-level LOP-centric shapes should be treated as migration residue.
- New runtime paths should remain native `Exchange` first.
