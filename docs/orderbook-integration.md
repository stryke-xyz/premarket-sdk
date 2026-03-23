# Orderbook integration (Exchange-based)

This guide reflects the current SDK and core contracts:

- `Exchange`
- `MarketsRegistry`
- `OptionMarketVault`

## Build order

```ts
import { OrderHelper, TradeType } from "@premarket/sdk";

const helper = new OrderHelper({
  chainId: 4326,
  exchangeAddress: "0x...",
});

const order = helper.buildOrder({
  maker: "0xmaker...",
  nonce: 10n,
  marketId: 1n,
  makingAmount: 1000n,
  takingAmount: 900n,
  deadline: 1_900_000_000n,
  tradeType: TradeType.BUY,
  tokenId: 42n,
});

const signature = await helper.signOrder(order, walletClient);
const payloadOrder = helper.serializeOrder(order);
```

## Submit order

```ts
import { OrderbookApi } from "@premarket/sdk";

const api = new OrderbookApi({ baseUrl: "https://..." });
await api.createOrder(
  {
    marketId: payloadOrder.marketId,
    order: payloadOrder,
    signature,
    timeInForce: "GTC",
  },
  bearerToken,
);
```

## Fill and match

```ts
import { ExchangeContract } from "@premarket/sdk";

const exchange = new ExchangeContract("0xexchange...");
const tx = exchange.buildFillOrderTx(payloadOrder, 500n, signature);
```

## Vault helpers

Use `buildMintTransaction`, `buildWithdrawTransaction`, `buildRedeemTransaction`,
`buildDelegateRedeemTransaction`, `buildDelegateWithdrawTransaction`, and
`buildFillMarketDeliveryTransaction` for settlement lifecycle operations.

## Registry helpers

Use `MarketsRegistryContract` only for the live `MarketsRegistry` callable
surface such as `addMarket`, `updateToken`, `setWhitelisted`, and
`updateMarketExpiry`.

Delivery-filled state is tracked on `OptionMarketVault.marketDeliveryFilled`,
not on `MarketsRegistry`.
