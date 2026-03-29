# premarket-sdk

TypeScript SDK for Stryke premarket integrations across:

- `option-markets` contracts (`Exchange`, `MarketsRegistry`, `OptionMarketVault`)
- `smart-account` contracts (`SimpleAccountFactory`, `EntryPoint`)
- `premarkets-api` HTTP/WebSocket services
- `premarkets-interface` frontend runtime

## What This Package Provides

- native `Exchange` order builders, hashing, typed-data signing helpers
- contract transaction builders for exchange, vault, and registry flows
- orderbook/premarket API client (`OrderbookApi`)
- realtime sync clients for depth/activity streams
- chain/address constants used by backend and frontend repos

## Docs

- Cross-repo guide: `docs/CROSS_REPO_INTEGRATION.md`
- Orderbook integration quick reference: `docs/orderbook-integration.md`

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

- `src/exchange`: native order model, typed-data, exchange tx helpers
- `src/vault`: token-id helpers, collateral math, vault tx helpers
- `src/registry`: markets registry contract wrapper/types
- `src/api`: `OrderbookApi` and order helper
- `src/sync`: websocket sync clients
- `src/config`: chains, addresses, token constants
