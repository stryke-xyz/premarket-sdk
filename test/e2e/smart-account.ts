import type { Address, Hex, PublicClient, WalletClient } from "viem";
import { encodeAbiParameters, encodeFunctionData, concat } from "viem";
import { type PrivateKeyAccount } from "viem/accounts";

/**
 * Simple EIP-1271 Smart Account for testing
 *
 * This simulates a basic smart contract wallet that:
 * 1. Has an owner (EOA)
 * 2. Implements isValidSignature (EIP-1271) by verifying the owner's signature
 * 3. Can execute arbitrary calls
 */

// ABI for the SimpleSmartAccount
export const SIMPLE_SMART_ACCOUNT_ABI = [
  {
    type: "constructor",
    inputs: [{ name: "_owner", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isValidSignature",
    inputs: [
      { name: "hash", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes4" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "execute",
    inputs: [
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [{ name: "", type: "bytes" }],
    stateMutability: "payable",
  },
] as const;

/**
 * Minimal SimpleSmartAccount bytecode
 *
 * Solidity equivalent:
 * ```solidity
 * contract SimpleSmartAccount {
 *     address public owner;
 *     bytes4 constant EIP1271_MAGIC = 0x1626ba7e;
 *
 *     constructor(address _owner) { owner = _owner; }
 *
 *     function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4) {
 *         require(signature.length == 65, "Invalid sig length");
 *         bytes32 r; bytes32 s; uint8 v;
 *         assembly {
 *             r := calldataload(signature.offset)
 *             s := calldataload(add(signature.offset, 32))
 *             v := byte(0, calldataload(add(signature.offset, 64)))
 *         }
 *         address signer = ecrecover(hash, v, r, s);
 *         return signer == owner ? EIP1271_MAGIC : bytes4(0xffffffff);
 *     }
 *
 *     function execute(address target, uint256 value, bytes calldata data) external payable returns (bytes memory) {
 *         require(msg.sender == owner, "Only owner");
 *         (bool success, bytes memory result) = target.call{value: value}(data);
 *         require(success, "Call failed");
 *         return result;
 *     }
 * }
 * ```
 */
const SIMPLE_SMART_ACCOUNT_BYTECODE =
  "0x608060405234801561001057600080fd5b506040516104f83803806104f883398101604081905261002f91610054565b600080546001600160a01b0319166001600160a01b0392909216919091179055610084565b60006020828403121561006657600080fd5b81516001600160a01b038116811461007d57600080fd5b9392505050565b610465806100936000396000f3fe60806040526004361061003f5760003560e01c80631626ba7e146100445780638da5cb5b14610089578063b61d27f6146100c6575b600080fd5b34801561005057600080fd5b5061006461005f366004610267565b6100e6565b6040516001600160e01b031990911681526020015b60405180910390f35b34801561009557600080fd5b506000546100a9906001600160a01b031681565b6040516001600160a01b039091168152602001610080565b6100d96100d43660046102dc565b6101a8565b604051610080919061039c565b6000604182146100f95750600019610180565b600080848060200190518101906101109190610267565b5050600086815260200190506041838383604051600081526020016040526040516101579493929190938452602084019290925260f81b6001600160f81b031916604083015260418201526061019056fea2646970667358221220815a87c0891e99e4faf0ec26e0e4c6a01b73c87ea6c7e18e8ed7d0c8f9e8d8e164736f6c63430008140033";

// Alternative: Pre-computed CREATE2 deployment for deterministic addresses
// For simplicity in tests, we use regular deployment

export interface SmartAccountInfo {
  address: Address;
  owner: PrivateKeyAccount;
}

/**
 * Deploy a SimpleSmartAccount contract using anvil's deployContract
 */
export async function deploySimpleSmartAccount(
  publicClient: PublicClient,
  ownerWallet: WalletClient,
  ownerAccount: PrivateKeyAccount
): Promise<SmartAccountInfo> {
  // Encode constructor arguments (owner address)
  const constructorArgs = encodeAbiParameters(
    [{ type: "address" }],
    [ownerAccount.address]
  );

  // Deploy bytecode + constructor args
  const deployData = concat([
    SIMPLE_SMART_ACCOUNT_BYTECODE as Hex,
    constructorArgs,
  ]);

  // Send deployment transaction using sendTransaction
  const hash = await ownerWallet.sendTransaction({
    account: ownerAccount,
    chain: ownerWallet.chain,
    data: deployData,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) {
    throw new Error("Smart account deployment failed - no contract address");
  }

  return {
    address: receipt.contractAddress,
    owner: ownerAccount,
  };
}

/**
 * Sign a hash as the smart account owner for EIP-1271
 * Returns the full 65-byte signature (r, s, v format)
 */
export async function signAsSmartAccountOwner(
  hash: Hex,
  ownerWallet: WalletClient,
  ownerAccount: PrivateKeyAccount
): Promise<Hex> {
  // Sign the hash with the owner's key using signMessage with raw hash
  // This produces a 65-byte signature in r,s,v format
  const signature = await ownerWallet.signMessage({
    account: ownerAccount,
    message: { raw: hash },
  });

  return signature;
}

/**
 * Execute a call through the smart account
 */
export async function executeFromSmartAccount(
  publicClient: PublicClient,
  ownerWallet: WalletClient,
  ownerAccount: PrivateKeyAccount,
  smartAccountAddress: Address,
  target: Address,
  value: bigint,
  data: Hex
): Promise<Hex> {
  const hash = await ownerWallet.writeContract({
    account: ownerAccount,
    chain: ownerWallet.chain,
    address: smartAccountAddress,
    abi: SIMPLE_SMART_ACCOUNT_ABI,
    functionName: "execute",
    args: [target, value, data],
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/**
 * Approve ERC20 tokens from the smart account
 */
export async function approveFromSmartAccount(
  publicClient: PublicClient,
  ownerWallet: WalletClient,
  ownerAccount: PrivateKeyAccount,
  smartAccountAddress: Address,
  tokenAddress: Address,
  spender: Address,
  amount: bigint
): Promise<Hex> {
  const data = encodeFunctionData({
    abi: [
      {
        name: "approve",
        type: "function",
        inputs: [
          { name: "spender", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
    ],
    functionName: "approve",
    args: [spender, amount],
  });

  return executeFromSmartAccount(
    publicClient,
    ownerWallet,
    ownerAccount,
    smartAccountAddress,
    tokenAddress,
    0n,
    data
  );
}

/**
 * Set approval for ERC6909 tokens from the smart account
 */
export async function setOperatorFromSmartAccount(
  publicClient: PublicClient,
  ownerWallet: WalletClient,
  ownerAccount: PrivateKeyAccount,
  smartAccountAddress: Address,
  erc6909Address: Address,
  operator: Address,
  approved: boolean
): Promise<Hex> {
  const data = encodeFunctionData({
    abi: [
      {
        name: "setOperator",
        type: "function",
        inputs: [
          { name: "operator", type: "address" },
          { name: "approved", type: "bool" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
    ],
    functionName: "setOperator",
    args: [operator, approved],
  });

  return executeFromSmartAccount(
    publicClient,
    ownerWallet,
    ownerAccount,
    smartAccountAddress,
    erc6909Address,
    0n,
    data
  );
}
