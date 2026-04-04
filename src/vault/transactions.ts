/**
 * OptionMarketVault transaction builders: mint (deposit), withdraw, redeem, unwind.
 * Use these to build calldata for sponsored txs or direct sends.
 */
import {
  encodeFunctionData,
  erc20Abi,
  maxUint256,
  parseAbi,
  type Address,
  type Hex,
} from "viem";
import type { VaultInstrument } from "./types.js";

const optionMarketVaultAbi = parseAbi([
  "function mint((uint256 marketId, uint256 tick, bool isCall) ins, uint256 amt) external returns (uint256 prmTokenId, uint256 oPrmTokenId)",
  "function withdraw(uint256 prmTokenId, uint256 amount, address rec) external",
  "function redeem(uint256 oPrmTokenId, address rec) external returns (uint256 profit)",
  "function delegateRedeem(uint256 oPrmTokenId, address rec) external returns (uint256 profit)",
  "function delegateRollover(uint256 oldPrmTokenId, address holder) external returns (uint256 newPrmTokenId, uint256 newOPrmTokenId, uint256 newAmount)",
  "function delegateWithdraw(uint256 prmTokenId, uint256 amount, address owner, address rec) external",
  "function fillMarketDelivery(uint256 marketId, uint256 amount) external",
  "function rollover(uint256 oldPrmTokenId) external returns (uint256 newPrmTokenId, uint256 newOPrmTokenId, uint256 newAmount)",
  "function setOperator(address operator, bool approved) external returns (bool)",
  "function setRole(address addr, uint8 role, bool enabled) external",
  "function setRolloverEnabled(bool enabled) external",
  "function updateFinalTick(uint256 marketId, uint256 tick) external",
  "function updateMarketExpiry(uint256 marketId, uint256 expiry) external",
  "function updateMarketExpiryFromMarket(uint256 marketId, uint256 expiry) external",
]);
export interface TransactionCall {
  to: `0x${string}`;
  value?: bigint;
  data: Hex;
}

/**
 * Build a mint (deposit) transaction: deposit collateral to receive PRM + oPRM tokens.
 * @param vaultAddress - OptionMarketVault contract address
 * @param instrument - { marketId, tick, isCall }
 * @param amount - Position size in VAULT_TOKEN_PRECISION (1e18) units
 */
export function buildMintTransaction(
  vaultAddress: `0x${string}`,
  instrument: VaultInstrument,
  amount: bigint,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "mint",
      args: [
        {
          marketId: instrument.marketId,
          tick: instrument.tick,
          isCall: instrument.isCall,
        },
        amount,
      ],
    }),
  };
}

/**
 * Build a withdraw transaction (unwind or post-settlement).
 * Before expiry: unwind (burns PRM + oPRM, returns collateral).
 * After expiry: settle and return collateral minus loss.
 *
 * @param vaultAddress - OptionMarketVault contract address
 * @param prmTokenId - PRM token id (even number)
 * @param amount - Amount to withdraw/unwind (in vault token precision, 1e18)
 * @param receiver - Address to receive collateral
 */
export function buildWithdrawTransaction(
  vaultAddress: `0x${string}`,
  prmTokenId: bigint,
  amount: bigint,
  receiver: Address,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "withdraw",
      args: [prmTokenId, amount, receiver],
    }),
  };
}

/**
 * Build a redeem transaction: option holders redeem oPRM tokens to claim profit after expiry.
 *
 * @param vaultAddress - OptionMarketVault contract address
 * @param oPrmTokenId - Option PRM token id (odd number)
 * @param receiver - Address to receive profit
 */
export function buildRedeemTransaction(
  vaultAddress: `0x${string}`,
  oPrmTokenId: bigint,
  receiver: Address,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "redeem",
      args: [oPrmTokenId, receiver],
    }),
  };
}

/**
 * Build a delegated redeem transaction. Callable only by RedeemKeeper role.
 */
export function buildDelegateRedeemTransaction(
  vaultAddress: `0x${string}`,
  oPrmTokenId: bigint,
  receiver: Address,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "delegateRedeem",
      args: [oPrmTokenId, receiver],
    }),
  };
}

/**
 * Build a delegated rollover transaction. Callable only by RolloverKeeper role.
 */
export function buildDelegateRolloverTransaction(
  vaultAddress: `0x${string}`,
  oldPrmTokenId: bigint,
  holder: Address,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "delegateRollover",
      args: [oldPrmTokenId, holder],
    }),
  };
}

/**
 * Build an unwind transaction (alias for withdraw).
 * Burns both PRM and oPRM to reclaim collateral before expiry.
 *
 * @param vaultAddress - OptionMarketVault contract address
 * @param prmTokenId - PRM token id (even number)
 * @param amount - Amount to unwind (in vault token precision, 1e18)
 * @param receiver - Address to receive collateral
 */
export function buildUnwindTransaction(
  vaultAddress: `0x${string}`,
  prmTokenId: bigint,
  amount: bigint,
  receiver: Address,
): TransactionCall {
  return buildWithdrawTransaction(vaultAddress, prmTokenId, amount, receiver);
}

/**
 * Build a delegated withdraw transaction. Callable only by WithdrawKeeper role.
 */
export function buildDelegateWithdrawTransaction(
  vaultAddress: `0x${string}`,
  prmTokenId: bigint,
  amount: bigint,
  owner: Address,
  receiver: Address,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "delegateWithdraw",
      args: [prmTokenId, amount, owner, receiver],
    }),
  };
}

/**
 * Build market delivery funding transaction for physical settlement markets.
 */
export function buildFillMarketDeliveryTransaction(
  vaultAddress: `0x${string}`,
  marketId: bigint,
  amount: bigint,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "fillMarketDelivery",
      args: [marketId, amount],
    }),
  };
}

/**
 * Build a rollover preference update transaction.
 */
export function buildSetRolloverEnabledTransaction(
  vaultAddress: `0x${string}`,
  enabled: boolean,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "setRolloverEnabled",
      args: [enabled],
    }),
  };
}

/**
 * Build operator approval transaction for ERC6909 delegated transfers.
 */
export function buildSetOperatorTransaction(
  vaultAddress: `0x${string}`,
  operator: Address,
  approved: boolean,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "setOperator",
      args: [operator, approved],
    }),
  };
}

/**
 * Build role update transaction (owner only).
 */
export function buildSetRoleTransaction(
  vaultAddress: `0x${string}`,
  account: Address,
  role: number,
  enabled: boolean,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "setRole",
      args: [account, role, enabled],
    }),
  };
}

/**
 * Build final tick update transaction (FinalTickKeeper role).
 */
export function buildUpdateFinalTickTransaction(
  vaultAddress: `0x${string}`,
  marketId: bigint,
  tick: bigint,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "updateFinalTick",
      args: [marketId, tick],
    }),
  };
}

/**
 * Build market expiry update transaction (MarketFinalizer role).
 */
export function buildUpdateMarketExpiryTransaction(
  vaultAddress: `0x${string}`,
  marketId: bigint,
  expiry: bigint,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "updateMarketExpiry",
      args: [marketId, expiry],
    }),
  };
}

/**
 * Build a market-owned expiry update transaction.
 */
export function buildUpdateMarketExpiryFromMarketTransaction(
  vaultAddress: `0x${string}`,
  marketId: bigint,
  expiry: bigint,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "updateMarketExpiryFromMarket",
      args: [marketId, expiry],
    }),
  };
}

/**
 * Build a direct rollover transaction for caller-held expired PRM.
 */
export function buildRolloverTransaction(
  vaultAddress: `0x${string}`,
  oldPrmTokenId: bigint,
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "rollover",
      args: [oldPrmTokenId],
    }),
  };
}

/**
 * Build an ERC20 approve transaction (e.g. collateral approve before mint).
 *
 * @param tokenAddress - Collateral token (e.g. USDC)
 * @param spender - Vault address
 * @param amount - Defaults to maxUint256 for infinite approval
 */
export function buildApproveTransaction(
  tokenAddress: `0x${string}`,
  spender: `0x${string}`,
  amount: bigint = maxUint256,
): TransactionCall {
  return {
    to: tokenAddress,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "approve",
      args: [spender, amount],
    }),
  };
}

/**
 * Build approve + mint in one batch (e.g. for a single UserOp).
 *
 * @param collateralTokenAddress - Collateral token address
 * @param vaultAddress - OptionMarketVault address
 * @param instrument - { marketId, tick, isCall }
 * @param collateralAmount - Amount to approve (usually same as prmAmount in collateral units)
 * @param prmAmount - Position size in 1e18 for mint
 */
export function buildBatchedMintTransactions(
  collateralTokenAddress: `0x${string}`,
  vaultAddress: `0x${string}`,
  instrument: VaultInstrument,
  collateralAmount: bigint,
  prmAmount: bigint,
): TransactionCall[] {
  return [
    buildApproveTransaction(
      collateralTokenAddress,
      vaultAddress,
      collateralAmount,
    ),
    buildMintTransaction(vaultAddress, instrument, prmAmount),
  ];
}
