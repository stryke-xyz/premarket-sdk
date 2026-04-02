/**
 * Smart account (ERC-4337 / custom factory) helpers.
 * Matches the UI pattern: factory has getAddress(owner, depositor, salt) and accountCount(owner).
 * Owner = sub-key / signer; depositor = EOA that can deposit/withdraw.
 */

import { parseAbi } from "viem";
import type { PublicClient } from "viem";

const factoryAbi = parseAbi([
  "function getAddress(address owner, address depositor, uint256 salt) view returns (address)",
  "function accountCount(address owner) view returns (uint256)",
]);

export interface SmartAccountConfig {
  factoryAddress: `0x${string}`;
}

/** Resolved smart-account address, salt, and deployment status for a user pair. */
export interface SmartAccountResult {
  address: `0x${string}`;
  salt: bigint;
  deployed: boolean;
}

/**
 * Get the salt used for the "current" smart account (most recently created for this owner).
 * accountCount is the number of accounts created; salt 0 is first, so current salt = accountCount - 1 when count > 0.
 */
export function getCurrentSalt(accountCount: bigint): bigint {
  return accountCount === 0n ? 0n : accountCount - 1n;
}

/**
 * Get the computed smart account address for owner + depositor + salt.
 */
export async function getSmartAccountAddress(
  client: PublicClient,
  factoryAddress: `0x${string}`,
  owner: `0x${string}`,
  depositor: `0x${string}`,
  salt: bigint
): Promise<`0x${string}`> {
  const address = await client.readContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: "getAddress",
    args: [owner, depositor, salt],
  });
  return address as `0x${string}`;
}

/**
 * Get account count for an owner (number of smart accounts created for this owner).
 */
export async function getAccountCount(
  client: PublicClient,
  factoryAddress: `0x${string}`,
  owner: `0x${string}`
): Promise<bigint> {
  return client.readContract({
    address: factoryAddress,
    abi: factoryAbi,
    functionName: "accountCount",
    args: [owner],
  }) as Promise<bigint>;
}

/**
 * Check if the account at address is deployed (has code).
 */
export async function isSmartAccountDeployed(
  client: PublicClient,
  address: `0x${string}`
): Promise<boolean> {
  const code = await client.getCode({ address });
  return code !== undefined && code !== "0x" && code.length > 2;
}

/**
 * Get the current smart account for owner + depositor: same as UI SmartAccountProvider.
 * Uses salt = accountCount === 0 ? 0 : accountCount - 1 and returns address + deployed status.
 */
export async function getCurrentSmartAccount(
  client: PublicClient,
  factoryAddress: `0x${string}`,
  owner: `0x${string}`,
  depositor: `0x${string}`
): Promise<SmartAccountResult> {
  const accountCount = await getAccountCount(client, factoryAddress, owner);
  const salt = getCurrentSalt(accountCount);
  const address = await getSmartAccountAddress(
    client,
    factoryAddress,
    owner,
    depositor,
    salt
  );
  const deployed = await isSmartAccountDeployed(client, address);
  return { address, salt, deployed };
}

/**
 * Convenience wrapper around the smart-account helper functions with shared factory config.
 */
export class SmartAccountHelper {
  constructor(public config: SmartAccountConfig) { }

  /** Returns the configured smart-account factory address. */
  get factoryAddress(): `0x${string}` {
    return this.config.factoryAddress;
  }

  /** Computes the deterministic account address for owner, depositor, and salt. */
  async getAddress(
    client: PublicClient,
    owner: `0x${string}`,
    depositor: `0x${string}`,
    salt: bigint
  ): Promise<`0x${string}`> {
    return getSmartAccountAddress(
      client,
      this.factoryAddress,
      owner,
      depositor,
      salt
    );
  }

  /** Reads how many accounts have been created for an owner. */
  async getAccountCount(
    client: PublicClient,
    owner: `0x${string}`
  ): Promise<bigint> {
    return getAccountCount(client, this.factoryAddress, owner);
  }

  /** Resolves the most recently used account for an owner and depositor pair. */
  async getCurrent(
    client: PublicClient,
    owner: `0x${string}`,
    depositor: `0x${string}`
  ): Promise<SmartAccountResult> {
    return getCurrentSmartAccount(
      client,
      this.factoryAddress,
      owner,
      depositor
    );
  }

  /** Checks whether code is already deployed at the supplied account address. */
  async isDeployed(
    client: PublicClient,
    address: `0x${string}`
  ): Promise<boolean> {
    return isSmartAccountDeployed(client, address);
  }
}
