import { parseUnits, parseEther, formatEther, formatUnits } from "viem";
import { divider, log, success, error } from "../helpers";
import { CONFIG, TEST_OPTION } from "../config";
import { publicClient, takerAccount, orderHelper, orderFiller } from "../setup";
import { ERC6909_ABI } from "../abis";
import type { StoredOrder } from "../../../src";

export default async function testFillOrderOnChain(
  storedOrder: StoredOrder
): Promise<boolean> {
  divider("Test 4: Fill Order On-Chain");

  if (!storedOrder) {
    error("No order data provided");
    return false;
  }

  const fillAmount = parseUnits("5", 6); // Fill 5 option tokens (half the order)

  log(`Fill amount: ${formatEther(fillAmount)} options`);

  // Get balances before
  const optionTokenId = orderHelper.calculateOptionTokenId(TEST_OPTION);

  const takerOptionsBefore = await publicClient.readContract({
    address: CONFIG.optionTokenFactoryAddress,
    abi: ERC6909_ABI,
    functionName: "balanceOf",
    args: [takerAccount.address, BigInt(optionTokenId)],
  });

  // Fill the order using SDK
  log("Filling order with taker (Account 2) as target...");

  try {
    const result = await orderFiller.fillOrderTo(
      storedOrder,
      fillAmount,
      takerAccount.address
    );
    log(`Fill transaction sent: ${result.txHash}`);
    log(`Transaction hash: ${result.txHash}`);
    log(`Making amount: ${formatEther(result.makingAmount)}`);
    log(`Taking amount: ${formatUnits(result.takingAmount, 6)}`);

    const takerOptionsAfter = await publicClient.readContract({
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address, BigInt(optionTokenId)],
    });

    // Verify the fill
    const optionsTransferred = takerOptionsAfter - takerOptionsBefore;
    if (optionsTransferred === parseEther("0.5")) {
      success(
        `Order filled! Taker received ${formatEther(
          optionsTransferred
        )} options`
      );
      return true;
    } else {
      error(`Unexpected fill amount: ${formatEther(optionsTransferred)}`);
      return false;
    }
  } catch (e: any) {
    error(`Fill failed: ${e.message}`);
    console.error(e);
    return false;
  }
}
