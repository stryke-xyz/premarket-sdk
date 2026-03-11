# Orderbook integration (Exchange-based)

This SDK now targets `Exchange` + `MarketsRegistry` + `OptionMarketVault`.

## Core flow

1. Build an `Exchange` order with `OrderHelper`.
2. Sign typed data (EIP-712) with maker wallet.
3. Submit `{ marketId, order, signature, ... }` to your orderbook API.
4. Fill/match on-chain via `ExchangeContract` tx builders.

## Build and sign

```ts
import {
  OrderHelper,
  TradeType,
  SignatureType,
} from "@premarket/sdk";

const helper = new OrderHelper({
  chainId: 4326,
  exchangeAddress: "0x...",
});

const order = helper.buildOrder({
  maker: "0xmaker...",
  receiver: "0xreceiver...", // optional, defaults to maker
  nonce: 12n,
  marketId: 7n,
  makingAmount: 1_000_000n,
  takingAmount: 500_000n,
  deadline: 1_900_000_000n,
  tradeType: TradeType.SELL,
  signatureType: SignatureType.EIP712,
  tokenId: 123456n,
});

const signature = await helper.signOrder(order, walletClient); // 0x...
const orderPayload = helper.serializeOrder(order);
```

## Create API payload

```ts
import { OrderbookApi } from "@premarket/sdk";

const api = new OrderbookApi({ baseUrl: "https://..." });

await api.createOrder(
  {
    marketId: orderPayload.marketId,
    order: orderPayload,
    signature,
    timeInForce: "GTC",
    postOnly: false,
  },
  bearerToken,
);
```

## On-chain execution helpers

```ts
import { ExchangeContract } from "@premarket/sdk";

const exchange = new ExchangeContract("0xexchange...");

const fillTx = exchange.buildFillOrderTx(orderPayload, 100000n, signature);
// { to, data, value }
```

## Notes

- Old `LimitOrderProtocol`/extension/makerTraits flows are removed from public SDK exports.
- Signature is now raw `0x...` bytes (not `{ r, vs }`).
- `OrderStatus` interpretation for `remaining = 0` and non-terminal status is handled via `getExecutableMakingAmount`.
