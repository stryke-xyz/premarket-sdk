import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";
import { OrderbookApi, OrderHelper, OrderFiller } from "../../src";
import { CONFIG } from "./config";

// Accounts
export const account0 = privateKeyToAccount(CONFIG.account0PrivateKey);
export const account1 = privateKeyToAccount(CONFIG.account1PrivateKey);
export const account2 = privateKeyToAccount(CONFIG.account2PrivateKey);
export const account3 = privateKeyToAccount(CONFIG.account3PrivateKey);

// Role assignments (no operator system - direct orders only)
export const makerAccount = account1; // Account 1 has option tokens
export const takerAccount = account2; // Account 2 is the taker

// Public client
export const publicClient: PublicClient = createPublicClient({
  chain: foundry,
  transport: http(CONFIG.rpcUrl),
});

// Wallets
export const wallet0: WalletClient = createWalletClient({
  account: account0,
  chain: foundry,
  transport: http(CONFIG.rpcUrl),
});

export const wallet1: WalletClient = createWalletClient({
  account: account1,
  chain: foundry,
  transport: http(CONFIG.rpcUrl),
});

export const wallet2: WalletClient = createWalletClient({
  account: account2,
  chain: foundry,
  transport: http(CONFIG.rpcUrl),
});

export const wallet3: WalletClient = createWalletClient({
  account: account3,
  chain: foundry,
  transport: http(CONFIG.rpcUrl),
});

// Role-specific wallets (no operator system)
export const makerWallet = wallet1; // Account 1 is the maker with option tokens
export const takerWallet = wallet2; // Account 2 is the taker

// SDK instances
export const orderbookApi = new OrderbookApi({ baseUrl: CONFIG.apiUrl });

export const orderHelper = new OrderHelper({
  chainId: CONFIG.chainId,
  optionTokenFactoryAddress: CONFIG.optionTokenFactoryAddress,
});

// Order fillers - each user fills orders directly as msg.sender
export const makerFiller = new OrderFiller(
  { chainId: CONFIG.chainId },
  publicClient,
  makerWallet
);

export const takerFiller = new OrderFiller(
  { chainId: CONFIG.chainId },
  publicClient,
  takerWallet
);

// Alias for backwards compatibility
export const orderFiller = takerFiller;
