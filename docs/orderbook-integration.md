# Orderbook Integration (Exchange Native)

This guide reflects the current `@stryke-xyz/premarket-sdk` integration model.

## Build and sign an order

```ts
import { OrderHelper, SignatureType, TradeType } from "@stryke-xyz/premarket-sdk";

const helper = new OrderHelper({
  chainId: 4326,
  exchangeAddress: "0xCf24f40D2dd88084e9C28FE34Ba9E24AFDACb7C2",
});

const order = helper.buildOrder({
  salt: 1n,
  nonce: 0n,
  marketId: 1n,
  makingAmount: 1_000_000n,
  takingAmount: 500_000n,
  deadline: 1_900_000_000n,
  maker: "0x1111111111111111111111111111111111111111",
  receiver: "0x1111111111111111111111111111111111111111",
  tradeType: TradeType.SELL,
  signatureType: SignatureType.EIP712,
  tokenId: 42n,
});

const signature = await helper.signEip712Order(order, walletClient);
const payloadOrder = helper.serializeOrder(order);
```

`signEip712Order` is only for `SignatureType.EIP712` orders. For smart-account /
`ERC1271` orders, build/hash/serialize the order with the SDK and obtain the signature
bytes from the smart-account signing flow without rewriting `signatureType`.

## Build and sign a SimpleAccount ERC1271 order

```ts
import { OrderHelper, SignatureType, TradeType } from "@stryke-xyz/premarket-sdk";

const helper = new OrderHelper({
  chainId: 4326,
  exchangeAddress: "0xCf24f40D2dd88084e9C28FE34Ba9E24AFDACb7C2",
});

const order = helper.buildOrder({
  salt: 2n,
  nonce: 1n,
  marketId: 1n,
  makingAmount: 1_000_000n,
  takingAmount: 500_000n,
  deadline: 1_900_000_000n,
  maker: "0xSimpleAccount",
  receiver: "0xSimpleAccount",
  tradeType: TradeType.SELL,
  signatureType: SignatureType.ERC1271,
  tokenId: 42n,
});

const signature = await helper.signSimpleAccountOrder(order, ownerWalletClient);
const payloadOrder = helper.serializeOrder(order);
```

`signSimpleAccountOrder` assumes the maker contract is `SimpleAccount`-compatible:
- `Exchange` passes the raw native `Exchange` order hash into `isValidSignature(hash, signature)`
- the maker account validates plain `r || s || v` ECDSA bytes from its owner
- the returned signature bytes are submitted unchanged to the backend or `Exchange`

## Submit order to backend

```ts
import { OrderbookApi } from "@stryke-xyz/premarket-sdk";

const api = new OrderbookApi({ baseUrl: "http://127.0.0.1:3000" });

await api.createOrder(
  {
    marketId: payloadOrder.marketId,
    order: payloadOrder,
    signature,
    timeInForce: "GTC",
    postOnly: false,
  },
  bearerToken,
);
```

## Query orders correctly (required params)

```ts
// /orderbook/api/orders requires marketId; returns active + partially-filled orders.
const snapshot = await api.getOrders("1");

// Pass maker to scope to a single user's open orders.
const mine = await api.getUserOrders(
  "0x1111111111111111111111111111111111111111",
  "1",
);
```

## Build on-chain fill tx

```ts
import { ExchangeContract } from "@stryke-xyz/premarket-sdk";

const exchange = new ExchangeContract("0xCf24f40D2dd88084e9C28FE34Ba9E24AFDACb7C2");
const tx = exchange.buildFillOrderTx(payloadOrder, 500_000n, signature);
```

## Vault and registry notes

- Use vault tx helpers for lifecycle (`mint`, `redeem`, `withdraw`, delivery flows).
- Use `MarketsRegistryContract` for market config and token approval operations.
- Delivery-filled state is on `OptionMarketVault.marketDeliveryFilled`, not on registry.
