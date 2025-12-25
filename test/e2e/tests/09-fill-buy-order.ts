import { parseEther, formatEther } from "viem";
import { divider, log, success, error } from "../helpers";
import { CONFIG, TEST_OPTION } from "../config";
import {
  publicClient,
  takerAccount,
  orderHelper,
  makerFiller,
} from "../setup";
import { ERC6909_ABI } from "../abis";
import type { StoredOrder } from "../../../src";

/**
 * Fill a buy order - seller (maker/Account 1) fills directly as msg.sender
 * 
 * For a buy order:
 * - Order maker (Account 2/taker) wants to BUY options with USDC
 * - Filler (Account 1/maker who has options) SELLS options to the buyer
 */
export default async function testFillBuyOrder(
  storedOrder: StoredOrder
): Promise<boolean> {
  divider("Test 9: Fill Buy Order On-Chain");

  if (!storedOrder) {
    error("No buy order data provided");
    return false;
  }

  // Fill 2 option tokens
  const fillAmount = parseEther("2");

  log(`Fill amount: ${formatEther(fillAmount)} options`);

  const optionTokenId = orderHelper.calculateOptionTokenId(TEST_OPTION);

  // Check buyer's (Account 2) option balance before
  const buyerOptionsBefore = await publicClient.readContract({
    address: CONFIG.optionTokenFactoryAddress,
    abi: ERC6909_ABI,
    functionName: "balanceOf",
    args: [takerAccount.address, BigInt(optionTokenId)],
  });
  log(`Buyer options before: ${formatEther(buyerOptionsBefore)}`);

  try {
    // Seller (Account 1) fills the buy order directly
    log("Seller (Account 1) filling buy order directly...");
    const result = await makerFiller.fillOrder(storedOrder, fillAmount);
    log(`Fill transaction sent: ${result.txHash}`);

    // Check buyer's option balance after
    const buyerOptionsAfter = await publicClient.readContract({
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address, BigInt(optionTokenId)],
    });
    log(`Buyer options after: ${formatEther(buyerOptionsAfter)}`);

    const optionsReceived = buyerOptionsAfter - buyerOptionsBefore;
    if (optionsReceived > 0n) {
      success(`Buy order filled! Buyer received ${formatEther(optionsReceived)} options`);
      return true;
    } else {
      error(`Buyer did not receive options`);
      return false;
    }
  } catch (e: any) {
    error(`Fill buy order failed: ${e.message}`);
    console.error(e);
    return false;
  }
}
