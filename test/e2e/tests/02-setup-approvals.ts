import { formatEther, formatUnits } from "viem";
import { divider, log, success } from "../helpers";
import { CONFIG, TEST_OPTION } from "../config";
import {
  publicClient,
  makerAccount,
  takerAccount,
  makerWallet,
  takerWallet,
  orderHelper,
} from "../setup";
import { ERC6909_ABI, ERC20_ABI } from "../abis";

/**
 * Setup approvals for direct order flow (no operator system):
 * - Maker: Set ERC6909Proxy as operator for option tokens (for sell orders)
 * - Taker: Set ERC6909Proxy as operator for option tokens (for filling buy orders)
 * - Taker: Approve USDC to LimitOrderProtocol (for filling sell orders)
 * - Maker: Approve USDC to LimitOrderProtocol (for buy orders where maker pays USDC)
 */
export default async function testSetupApprovals(): Promise<boolean> {
  divider("Test 2: Setup Approvals");

  try {
    const optionTokenId = orderHelper.calculateOptionTokenId(TEST_OPTION);
    log(`Option Token ID: ${optionTokenId}`);

    // Check maker's option balance
    const makerOptionBalance = await publicClient.readContract({
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "balanceOf",
      args: [makerAccount.address, BigInt(optionTokenId)],
    });
    log(`Maker option balance: ${formatEther(makerOptionBalance)}`);

    // Check maker's USDC balance
    const makerUsdcBalance = await publicClient.readContract({
      address: CONFIG.usdcAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [makerAccount.address],
    });
    log(`Maker USDC balance: ${formatUnits(makerUsdcBalance, 6)}`);

    // Check taker's USDC balance
    const takerUsdcBalance = await publicClient.readContract({
      address: CONFIG.usdcAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address],
    });
    log(`Taker USDC balance: ${formatUnits(takerUsdcBalance, 6)}`);

    // Check taker's option balance
    const takerOptionBalance = await publicClient.readContract({
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address, BigInt(optionTokenId)],
    });
    log(`Taker option balance: ${formatEther(takerOptionBalance)}`);

    // Maker: Set ERC6909Proxy as operator for option tokens (for sell orders)
    log("Maker setting ERC6909Proxy as operator for option tokens...");
    const setProxyOpTx1 = await makerWallet.writeContract({
      account: makerAccount,
      chain: makerWallet.chain,
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "setOperator",
      args: [CONFIG.erc6909ProxyAddress, true],
    });
    await publicClient.waitForTransactionReceipt({ hash: setProxyOpTx1 });
    success(`Maker set ERC6909Proxy as operator: ${setProxyOpTx1}`);

    // Taker: Set ERC6909Proxy as operator for option tokens (for filling buy orders)
    log("Taker setting ERC6909Proxy as operator for option tokens...");
    const setProxyOpTx2 = await takerWallet.writeContract({
      account: takerAccount,
      chain: takerWallet.chain,
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "setOperator",
      args: [CONFIG.erc6909ProxyAddress, true],
    });
    await publicClient.waitForTransactionReceipt({ hash: setProxyOpTx2 });
    success(`Taker set ERC6909Proxy as operator: ${setProxyOpTx2}`);

    // Taker: Approve USDC to LimitOrderProtocol (for filling sell orders)
    log("Taker approving USDC to LimitOrderProtocol...");
    const approveTx1 = await takerWallet.writeContract({
      account: takerAccount,
      chain: takerWallet.chain,
      address: CONFIG.usdcAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONFIG.limitOrderProtocolAddress, BigInt("1000000000000")], // 1M USDC
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx1 });
    success(`Taker approved USDC: ${approveTx1}`);

    // Maker: Approve USDC to LimitOrderProtocol (for buy orders where maker pays USDC)
    log("Maker approving USDC to LimitOrderProtocol...");
    const approveTx2 = await makerWallet.writeContract({
      account: makerAccount,
      chain: makerWallet.chain,
      address: CONFIG.usdcAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [CONFIG.limitOrderProtocolAddress, BigInt("1000000000000")], // 1M USDC
    });
    await publicClient.waitForTransactionReceipt({ hash: approveTx2 });
    success(`Maker approved USDC: ${approveTx2}`);

    return true;
  } catch (e: any) {
    console.error(`Setup approvals failed: ${e.message}`);
    return false;
  }
}
