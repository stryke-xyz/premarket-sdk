/**
 * OptionMarketVault transaction builders: mint (deposit), withdraw, redeem, unwind.
 * Use these to build calldata for sponsored txs or direct sends.
 */

import { encodeFunctionData, maxUint256, parseAbi, type Hex } from "viem";
import type { VaultInstrument } from "./types.js";

const optionMarketVaultAbi = parseAbi([
  "function mint((uint256 marketId, uint256 tick, bool isCall) ins, uint256 amt) external returns (uint256 prmTokenId, uint256 oPrmTokenId)",
  "function withdraw(uint256 prmTokenId) external",
  "function redeem(uint256 oPrmTokenId) external returns (uint256 profit)",
]);

const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
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
  amount: bigint
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
 * Uses the 1-arg overload: withdraw(prmTokenId).
 *
 * @param vaultAddress - OptionMarketVault contract address
 * @param prmTokenId - PRM token id (even number)
 */
export function buildWithdrawTransaction(
  vaultAddress: `0x${string}`,
  prmTokenId: bigint
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "withdraw",
      args: [prmTokenId],
    }),
  };
}

/**
 * Build a redeem transaction: option holders redeem oPRM tokens to claim profit after expiry.
 *
 * @param vaultAddress - OptionMarketVault contract address
 * @param oPrmTokenId - Option PRM token id (odd number)
 */
export function buildRedeemTransaction(
  vaultAddress: `0x${string}`,
  oPrmTokenId: bigint
): TransactionCall {
  return {
    to: vaultAddress,
    data: encodeFunctionData({
      abi: optionMarketVaultAbi,
      functionName: "redeem",
      args: [oPrmTokenId],
    }),
  };
}

/**
 * Build an unwind transaction (alias for withdraw).
 * Burns both PRM and oPRM to reclaim collateral before expiry.
 */
export function buildUnwindTransaction(
  vaultAddress: `0x${string}`,
  prmTokenId: bigint
): TransactionCall {
  return buildWithdrawTransaction(vaultAddress, prmTokenId);
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
  amount: bigint = maxUint256
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
  prmAmount: bigint
): TransactionCall[] {
  return [
    buildApproveTransaction(
      collateralTokenAddress,
      vaultAddress,
      collateralAmount
    ),
    buildMintTransaction(vaultAddress, instrument, prmAmount),
  ];
}
