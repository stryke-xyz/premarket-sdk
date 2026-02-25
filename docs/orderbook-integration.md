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
import { OPTION_MARKET_VAULT } from "@premarket/sdk"; // or your chain config

const orderHelper = new OrderHelper({
  chainId: 4326,
  optionMarketVaultAddress: OPTION_MARKET_VAULT[4326],
});
```

Constructor requires `chainId` and `optionMarketVaultAddress` (required for options orders).

### 1.2 Build the order (options vs ERC20)

**Sell options** (maker gives options, receives stable):

```ts
const { order, extensionEncoded, optionTokenId, calldata } =
  orderHelper.buildSellOptionsOrder({
    maker: smartAccountAddress,
    makerProxyAddress: erc6909ProxyAddress, // maker's ERC6909 proxy
    stableToken: usdcAddress,
    optionAmount: "1000000000000000000", // 1e18 units
    stableAmount: "500000", // USDC (6 decimals)
    optionTokenId: instrument.oPrmTokenId || instrument.prmTokenId,
    feeId: optionalFeeIdBytes32, // optional, bytes32 fee routing id
    marketId: marketId, // optional, for API validation
    expiresAt: BigInt(Math.floor(Date.now() / 1000) + 86400), // optional
  });
```

**Buy options** (maker gives stable, receives options):

```ts
const { order, extensionEncoded, optionTokenId, calldata } =
  orderHelper.buildBuyOptionsOrder({
    maker: smartAccountAddress,
    makerProxyAddress: erc6909ProxyAddress,
    stableToken: usdcAddress,
    optionAmount: "1000000000000000000",
    stableAmount: "500000",
    optionTokenId: instrument.oPrmTokenId || instrument.prmTokenId,
    marketId: marketId, // required
    feeId: optionalFeeIdBytes32, // optional, bytes32 fee routing id
    expiresAt: optionalExpiresAt,
  });
```

**ERC20 (e.g. pre-TGE) orders:**

```ts
const { order, extensionEncoded, calldata } = orderHelper.buildERC20Order({
  maker: smartAccountAddress,
  buyingToken: tokenYouReceive,
  sellingToken: tokenYouGive,
  makingAmount: amountYouGive,
  takingAmount: amountYouReceive,
  feeId: optionalFeeIdBytes32, // optional
  marketId: marketId, // optional
  expiresAt: optionalExpiresAt,
});
```

- **buildSellOptionsOrder** params: `maker`, `makerProxyAddress`, `stableToken`, `optionAmount`, `stableAmount`, `optionTokenId`, optional `feeId`, `marketId`, `expiresAt`. Returns: `{ order, extensionEncoded, optionTokenId, calldata }`.
- **buildBuyOptionsOrder** params: same plus **required** `marketId`. Returns: `{ order, extensionEncoded, optionTokenId, calldata }`.
- **buildERC20Order** params: `maker`, `buyingToken`, `sellingToken`, `makingAmount`, `takingAmount`, optional `feeId`, `marketId`, `expiresAt`. Returns: `{ order, extensionEncoded, calldata }`.

For ERC20 orders without extension, `extensionEncoded` is `'0'`; for options use the value returned from the builder.

### 1.3 Sign the order

Sign with the smart account's owner wallet. The signature is EIP-712 over the limit-order struct.

```ts
const signature = await orderHelper.signOrder(order, walletClient);
// => Promise<{ r: string; vs: string }>
```

`walletClient` must be a viem `WalletClient` with an `account`.

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
  expiresAt: 1234567890, // optional, number (seconds)
};

const storedOrder = await api.createOrder(createParams, bearerToken);
```

**CreateOrderParams** (all fields): `marketId`, `order`, `extensionEncoded`, `signature`, optional `operator`, `expiresAt`, `timeInForce`, `postOnly`.

Summary: **OrderHelper** (build + sign) → **order.build()** + extension + signature → **OrderbookApi.createOrder()**.

---

## 2. Quick reference

| Goal                           | Use                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Build + sign order before POST | `OrderHelper` (buildSellOptionsOrder / buildBuyOptionsOrder / buildERC20Order) → signOrder → order.build()    |
| POST order to API              | `OrderbookApi.createOrder({ marketId, order: order.build(), extensionEncoded, signature, ... }, bearerToken)` |
| Fill order (EOA maker)         | `OrderFiller.buildFillOrderParams` / `fillOrder` or `fillOrderTo`                                             |
| Fill order (contract maker)    | `OrderFiller.buildFillContractOrderParams` / `fillContractOrder` or `fillContractOrderTo` + owner signature   |
| Get order / depth / markets    | `OrderbookApi.getOrder`, `getDepthSnapshot`, `getMarket`, `getUserOrders`, etc.                               |

Types: `CreateOrderParams`, `StoredOrder`, `Order`, `OrderSignature`, `Option` are in `@premarket/sdk` (from `shared/types`).

---

## 3. Smart account and vault (mint, withdraw, redeem)

**Smart account** – The factory exposes `getAddress(owner, depositor, salt)` and `accountCount(owner)`. Owner is the signer (e.g. sub-key); depositor is the EOA (e.g. connected wallet).

**Frontend pattern (single account, salt 0):** Many UIs use a fixed salt of 0 and compute the address once:

```ts
import { SIMPLE_ACCOUNT_FACTORY } from "@premarket/sdk";
import { parseAbi } from "viem";

const factoryAbi = parseAbi([
  "function getAddress(address owner, address depositor, uint256 salt) view returns (address)",
  "function accountCount(address owner) view returns (uint256)",
  "function createAccount(address owner, uint256 salt) returns (address)",
]);

const factoryAddress = SIMPLE_ACCOUNT_FACTORY[chainId];
const owner = subKeyAddress; // signer
const depositor = account.address; // EOA

const smartAccountAddress = await publicClient.readContract({
  address: factoryAddress,
  abi: factoryAbi,
  functionName: "getAddress",
  args: [owner, depositor, 0n],
});

const code = await publicClient.getCode({ address: smartAccountAddress });
const deployed = code !== undefined && code !== "0x" && code.length > 2;
```

To **deploy** the account, call the factory’s `createAccount(owner, 0n)` via your wallet (e.g. `writeContract`).

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
const withdrawTx = buildWithdrawTransaction(
  vaultAddress,
  prmTokenId,
  amount,
  receiverAddress,
);
// or buildUnwindTransaction(vaultAddress, prmTokenId, amount, receiverAddress);

// Redeem oPRM after expiry to claim profit
const redeemTx = buildRedeemTransaction(
  vaultAddress,
  oPrmTokenId,
  receiverAddress,
);

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

For **multiple txs in one batch** (e.g. approve + mint), use arrays: `dest: [tx1.to, tx2.to]`, `value: [tx1.value ?? "0", tx2.value ?? "0"]`, `func: [tx1.data, tx2.data]`. After a successful sponsored tx, the smart account's nonce increments; use the new nonce for the next request.

Token ID helpers: `prmToOptionTokenId`, `optionPrmToPrm` from `@premarket/sdk` (vault).

---

## 4. Awaiting a sponsored tx from the relayer

When the backend submits a sponsored transaction (e.g. an order fill), it may return **relayer info** (`relayerId`, `transactionId`) instead of the final tx hash. Your app can poll the relayer to get the transaction hash once it is confirmed.

**Relayer proxy (auth-proxy):** The auth-proxy exposes a GET-only relayer route (e.g. `/relayer/`) that forwards to the relayer service. Requests require Bearer auth and `x-chain-id`. Your frontend typically calls an app route like `/api/relayer/tx`, which proxies to this.

**Poll for tx hash:** Send GET requests with query params `relayerId` and `transactionId`, and headers `x-chain-id` and `Authorization: Bearer <accessToken>`. The response has a `data` object with:

- `status` – `"confirmed"`, `"mined"`, or `"success"` when the tx is final; `"failed"`, `"cancelled"`, or `"rejected"` for terminal failure.
- `hash` or `transaction_hash` – the on-chain tx hash when status is success.

Example polling function (use a getter for the token so it is read on each attempt):

```ts
import type { Hash } from "viem";

export async function pollRelayerForTxHash(
  relayerId: string,
  transactionId: string,
  chainId: number,
  accessToken: () => string | null,
  maxAttempts = 5,
): Promise<Hash | null> {
  const delays = [500, 500, 1000, 2000, 2000];

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, delays[i] ?? 2000));

    try {
      const token = accessToken();
      const res = await fetch(
        `/api/relayer/tx?relayerId=${encodeURIComponent(relayerId)}&transactionId=${encodeURIComponent(transactionId)}`,
        {
          headers: {
            "x-chain-id": chainId.toString(),
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) continue;

      const data = await res.json();
      const txData = data?.data;
      const status = txData?.status?.toLowerCase();

      if (
        status === "failed" ||
        status === "cancelled" ||
        status === "rejected"
      ) {
        return null;
      }
      if (
        status !== "confirmed" &&
        status !== "mined" &&
        status !== "success"
      ) {
        continue;
      }
      const hash = txData?.hash ?? txData?.transaction_hash;
      if (hash) return hash as Hash;
    } catch (err) {
      console.warn("[pollRelayer] Attempt failed:", err);
    }
  }
  return null;
}
```

After a successful order or fill that returns `fillRelayer: { relayerId, transactionId }`, call this in the background (e.g. fire-and-forget) so the UI can show the tx hash or link to the explorer once the relayer confirms the tx.
