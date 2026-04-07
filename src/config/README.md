# Config Guide

The `config` module is the SDK's deployment and chain registry. It provides the
named chain objects, token metadata, and contract addresses that other modules
expect callers to use instead of hardcoding environment-specific values in each
app.

## Source map

- [`index.ts`](./index.ts) exports token metadata, contract addresses, and the
  `CHAIN_ID_TO_CHAIN` lookup
- [`chains.ts`](./chains.ts) defines custom chain objects and the
  `SUPPORTED_CHAINS` type

## What this module is for

In plain language:

- it centralizes deployed addresses
- it gives frontend and backend code a common view of supported chains
- it keeps order builders, API clients, and smart-account helpers pointed at
  the same runtime contracts

## Chains

[`chains.ts`](./chains.ts) exports:

- `megaETH`
  - custom viem chain definition for chain id `4326`
- `SUPPORTED_CHAINS`
  - TypeScript union of the currently supported chain ids

[`index.ts`](./index.ts) then maps those ids into a runtime lookup:

- `CHAIN_ID_TO_CHAIN`

```ts
import {
  CHAIN_ID_TO_CHAIN,
  megaETH,
} from "@stryke-xyz/premarket-sdk";

const chain = CHAIN_ID_TO_CHAIN[megaETH.id];
```

## Token metadata

`Token` is the shared metadata shape for config entries:

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

## Contract address maps

Public address maps:

- `PERMIT2_ADDRESS`
- `OPTION_MARKET_VAULT`
- `EXCHANGE`
- `MARKETS_REGISTRY`
- `ENTRY_POINT`
- `SIMPLE_ACCOUNT_FACTORY`
- `FEE_REGISTRY`
- `ERC_TOKENS_RESTRICTION_MODULE`

```ts
import {
  EXCHANGE,
  OPTION_MARKET_VAULT,
  SIMPLE_ACCOUNT_FACTORY,
} from "@stryke-xyz/premarket-sdk";

const chainId = 4326;

const exchangeAddress = EXCHANGE[chainId];
const vaultAddress = OPTION_MARKET_VAULT[chainId];
const factoryAddress = SIMPLE_ACCOUNT_FACTORY[chainId];
```

## How this module fits with the rest of the SDK

- the [Exchange guide](../exchange/README.md) uses `EXCHANGE`
- the [Vault guide](../vault/README.md) uses `OPTION_MARKET_VAULT`
- the [Registry guide](../registry/README.md) uses `MARKETS_REGISTRY`
- the root package's smart-account helpers use `SIMPLE_ACCOUNT_FACTORY` and
  `ENTRY_POINT`

## Operational guidance

If upstream deployments change, this module should be updated before app teams
scatter new addresses across their own repositories. This is one of the main
places where the SDK adds value as an integration boundary.
