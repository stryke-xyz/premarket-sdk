# Orderbook integration

This doc covers how to **build and sign orders** before posting them to the orderbook API. The relevant modules are:

- **`OrderHelper`** – build limit orders (ERC20 or options) and sign them.
- **`OrderbookApi`** – HTTP client for creating orders, querying orders, depth, and markets.

---

## 1. Setting up orders before posting

You must build the order, sign it, then send the serialized order + extension + signature to the API. The API does not build or sign for you.

### 1.1 Create an OrderHelper

```ts
import { OrderHelper } from "@premarket/sdk";
import { OPTION_TOKEN_FACTORY } from "@premarket/sdk"; // or your chain config

const orderHelper = new OrderHelper({
  chainId: 4326,
  optionTokenFactoryAddress: OPTION_TOKEN_FACTORY[4326],
});
```

### 1.2 Build the order (options vs ERC20)

**Sell options** (maker gives options, receives stable):

```ts
const { order, extensionEncoded } = orderHelper.buildSellOptionsOrder({
  maker: smartAccountAddress,
  makerProxyAddress: erc6909ProxyAddress, // maker’s ERC6909 proxy
  stableToken: usdcAddress,
  optionAmount: "1000000000000000000", // 1e18 units
  stableAmount: "500000", // USDC (6 decimals)
  optionTokenId: instrument.oPrmTokenId || instrument.prmTokenId,
  expiresAt: BigInt(Math.floor(Date.now() / 1000) + 86400), // optional
});
```

**Buy options** (maker gives stable, receives options):

```ts
const { order, extensionEncoded } = orderHelper.buildBuyOptionsOrder({
  maker: smartAccountAddress,
  makerProxyAddress: erc6909ProxyAddress,
  stableToken: usdcAddress,
  optionAmount: "1000000000000000000",
  stableAmount: "500000",
  optionTokenId: instrument.oPrmTokenId || instrument.prmTokenId,
  expiresAt: optionalExpiresAt,
});
```

**ERC20 (e.g. pre-TGE) orders:**

```ts
const { order, extensionEncoded } = orderHelper.buildERC20Order({
  maker: smartAccountAddress,
  buyingToken: tokenYouReceive,
  sellingToken: tokenYouGive,
  makingAmount: amountYouGive,
  takingAmount: amountYouReceive,
  expiresAt: optionalExpiresAt,
});
```

For ERC20 orders, `extensionEncoded` is `'0'`; for options you use the value returned from the builder.

### 1.3 Sign the order

Sign with the smart accounts owner wallet. The signature is EIP-712 over the limit-order struct.

```ts
const signature = await orderHelper.signOrder(order, walletClient);
// => { r: string; vs: string }
```

`walletClient` must be a viem `WalletClient` with an `account`

### 1.4 Build the API payload and post

The API expects the **serialized** order (string fields), not the `LimitOrder` object. Use `order.build()` for that.

```ts
import { OrderbookApi } from "@premarket/sdk";

const api = new OrderbookApi({ baseUrl: "https://..." });

const createParams = {
  marketId,
  order: order.build(), // { salt, maker, receiver, makerAsset, takerAsset, makingAmount, takingAmount, makerTraits }
  extensionEncoded,
  signature,
  operator: subKeyAddress,
  timeInForce: "GTC", // optional: "FOK" | "FAK" | "GTC" | "GTD"
  postOnly: false, // optional
};

const storedOrder = await api.createOrder(createParams, bearerToken);
```

Summary: **OrderHelper** (build + sign) → **order.build()** + extension + signature → **OrderbookApi.createOrder()**.

## You can view the http response in our api page

## 3. Quick reference

| Goal                           | Use                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Build + sign order before POST | `OrderHelper` (buildSellOptionsOrder / buildBuyOptionsOrder / buildERC20Order) → signOrder → order.build()    |
| POST order to API              | `OrderbookApi.createOrder({ marketId, order: order.build(), extensionEncoded, signature, ... }, bearerToken)` |
| Fill order (EOA maker)         | `OrderFiller.buildFillOrderParams` / `fillOrder` or `fillOrderTo`                                             |
| Fill order (contract maker)    | `OrderFiller.buildFillContractOrderParams` / `fillContractOrder` or `fillContractOrderTo` + owner signature   |
| Get order / depth / markets    | `OrderbookApi.getOrder`, `getDepthSnapshot`, `getMarket`, `getUserOrders`, etc.                               |

Types: `CreateOrderParams`, `StoredOrder`, `Order`, `OrderSignature`, `Option` are in `@premarket/sdk` (from `shared/types`).

---

## 4. Smart account and vault (mint, withdraw, redeem)

**Smart account** (factory with `getAddress(owner, depositor, salt)` and `accountCount(owner)`):

```ts
import {
  SmartAccountHelper,
  getCurrentSmartAccount,
  SIMPLE_ACCOUNT_FACTORY,
} from "@premarket/sdk";

const factoryAddress = SIMPLE_ACCOUNT_FACTORY[chainId];
const helper = new SmartAccountHelper({ factoryAddress });
const { address, salt, deployed } = await helper.getCurrent(
  publicClient,
  owner,
  depositor,
);
// or: getCurrentSmartAccount(publicClient, factoryAddress, owner, depositor);
```

**Vault transactions** (OptionMarketVault mint / withdraw / redeem / unwind):

```ts
import {
  buildMintTransaction,
  buildWithdrawTransaction,
  buildRedeemTransaction,
  buildUnwindTransaction,
  buildApproveTransaction,
  buildBatchedMintTransactions,
} from "@premarket/sdk";

// Deposit collateral → get PRM + oPRM
const mintTx = buildMintTransaction(
  vaultAddress,
  { marketId, tick, isCall },
  prmAmount,
);

// Unwind (before expiry) or withdraw (after settlement)
const withdrawTx = buildWithdrawTransaction(vaultAddress, prmTokenId);
// or buildUnwindTransaction(vaultAddress, prmTokenId);

// Redeem oPRM after expiry to claim profit
const redeemTx = buildRedeemTransaction(vaultAddress, oPrmTokenId);

// Approve + mint in one batch (e.g. for a single UserOp)
const batch = buildBatchedMintTransactions(
  collateralTokenAddress,
  vaultAddress,
  { marketId, tick, isCall },
  collateralAmount,
  prmAmount,
);
```

Each builder returns `{ to, data, value? }`. To **submit** these (e.g. mint, withdraw, redeem) you use the **sponsor API** (backend pays gas). The frontend uses the sponsor API like this:

**1. Build one or more transactions** (SDK above):

```ts
const mintTx = buildMintTransaction(
  vaultAddress,
  { marketId, tick, isCall },
  prmAmount,
);
// For batched: const txs = [approveTx, mintTx];
```

**2. Get the smart account nonce** (read from chain):

```ts
// Smart account contract exposes signatureNonce()
const currentNonce = await publicClient.readContract({
  address: smartAccountAddress,
  abi: parseAbi(["function signatureNonce() view returns (uint256)"]),
  functionName: "signatureNonce",
});
const nextNonce = currentNonce + 1n;
```

**3. Sign the sponsor message** (owner key signs; EIP-191):

```ts
import { keccak256, encodePacked } from "viem";

const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // e.g. 10 min
const messageHash = keccak256(
  encodePacked(
    ["address", "uint256", "uint256", "uint256"],
    [smartAccountAddress, nextNonce, deadline, BigInt(chainId)],
  ),
);
const signature = await ownerWallet.signMessage({
  message: { raw: messageHash },
});
```

**4. POST to the sponsor endpoint** (your app may proxy to `{BASE}/orderbook/api/smart-account/sponsor`):

```ts
const body = {
  txData: {
    dest: [mintTx.to],
    value: [mintTx.value?.toString() ?? "0"],
    func: [mintTx.data ?? "0x"],
    deadline: deadline.toString(),
  },
  signature, // hex from step 3
  accountData: {
    owner: ownerAddress,
    depositor: depositorAddress,
    salt: salt.toString(),
  },
};

const res = await fetch("/api/smart-account/sponsor", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-chain-id": chainId.toString(),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  },
  body: JSON.stringify(body),
});
const { success, data } = await res.json();
// data.hash is the transaction hash once mined
```

For **multiple txs in one batch** (e.g. approve + mint), use arrays: `dest: [tx1.to, tx2.to]`, `value: [tx1.value ?? "0", tx2.value ?? "0"]`, `func: [tx1.data, tx2.data]`. After a successful sponsored tx, the smart account’s nonce increments; use the new nonce for the next request.

Token ID helpers: `prmToOptionTokenId`, `optionPrmToPrm` from `@premarket/sdk` (vault).
