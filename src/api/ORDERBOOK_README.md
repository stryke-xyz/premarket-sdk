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
} from "@stryke-xyz/premarket-sdk";

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

const signature = await helper.signEip712Order(order, walletClient); // 0x...
const orderPayload = helper.serializeOrder(order);
```

`signEip712Order` is intentionally EOA-only and requires
`signatureType: SignatureType.EIP712`. For smart-account / `ERC1271` orders, use
`signSimpleAccountOrder` for `SimpleAccount`-compatible makers, or otherwise use
`buildOrder`, `getTypedData`, and `hashOrder`, then source the signature bytes from the
maker account flow.

## Build and sign with SimpleAccount / ERC1271

```ts
const smartAccountOrder = helper.buildOrder({
  maker: "0xSimpleAccount...",
  receiver: "0xSimpleAccount...",
  nonce: 13n,
  marketId: 7n,
  makingAmount: 1_000_000n,
  takingAmount: 500_000n,
  deadline: 1_900_000_000n,
  tradeType: TradeType.SELL,
  signatureType: SignatureType.ERC1271,
  tokenId: 123456n,
});

const smartAccountSignature = await helper.signSimpleAccountOrder(
  smartAccountOrder,
  ownerWalletClient
); // raw 65-byte r||s||v
```

`signSimpleAccountOrder` assumes the maker contract verifies the raw native `Exchange`
EIP-712 order hash with plain ECDSA bytes from its owner, as `SimpleAccount` does.

## Create API payload

```ts
import { OrderbookApi } from "@stryke-xyz/premarket-sdk";

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
import { ExchangeContract } from "@stryke-xyz/premarket-sdk";

const exchange = new ExchangeContract("0xexchange...");

const fillTx = exchange.buildFillOrderTx(orderPayload, 100000n, signature);
// { to, data, value }
```

## Notes

- Old `LimitOrderProtocol`/extension/makerTraits flows are removed from public SDK exports.
- Signature is now raw `0x...` bytes (not `{ r, vs }`).
- `signSimpleAccountOrder` is for `SimpleAccount`-compatible `ERC1271` maker accounts, not arbitrary contract wallets.
- `OrderStatus` interpretation for `remaining = 0` and non-terminal status is handled via `getExecutableMakingAmount`.
- `buildSetExerciseWindowTransaction` was removed to match the current `OptionMarketVault` ABI.
- `MarketsRegistryContract` now tracks only the live `MarketsRegistry` callable surface.
- Delivery-filled state belongs to `OptionMarketVault.marketDeliveryFilled(marketId, expiry)`, not `MarketsRegistry`.
- Orderbook query endpoints are parameterized: `/orderbook/api/orders` and `/orderbook/api/orders/user/:maker` require `marketId`.
- `OrderbookApi.getUserOrders(maker, marketId)` requires `marketId`.
