import { parseEther, formatEther } from "viem";
import { divider, log, success, error } from "../helpers";
import { CONFIG, TEST_OPTION } from "../config";
import {
  publicClient,
  makerAccount,
  takerAccount,
  makerWallet,
  orderbookApi,
  orderHelper,
  takerFiller,
} from "../setup";
import { ERC6909_ABI } from "../abis";
import { OrderType } from "../../../src";

/**
 * Test 10: Create sell order (maker signs) + Taker fills directly
 * This is the standard direct flow with no operator system.
 */
export default async function testCreateAndFillSellOrder(): Promise<boolean> {
  divider("Test 10: Create Sell Order + Taker Fills Directly");

  try {
    // Step 1: Build sell order - maker is Account 1
    log("Building sell order with Account 1 as maker...");
    const { order, optionTokenId, extensionEncoded } =
      orderHelper.buildSellOptionsOrder({
        maker: makerAccount.address,
        makerProxyAddress: CONFIG.erc6909ProxyAddress,
        stableToken: CONFIG.usdcAddress,
        option: TEST_OPTION,
        optionAmount: parseEther("2").toString(),
        stableAmount: "20000000", // 20 USDC
      });
    const orderStruct = order.build();

    // Step 2: Sign with MAKER wallet directly (no operator system)
    log("Signing order with MAKER wallet (Account 1)...");
    const signature = await orderHelper.signOrder(order, makerWallet);

    // Step 3: Create order
    log("Sending signed order to API...");
    const storedOrder = await orderbookApi.createOrder({
      orderType: OrderType.SELL_OPTIONS,
      marketId: CONFIG.marketId,
      option: TEST_OPTION,
      order: orderStruct,
      extensionEncoded,
      signature,
      optionAmount: parseEther("2").toString(),
      stableAmount: "20000000",
      stableToken: CONFIG.usdcAddress,
      makerProxyAddress: CONFIG.erc6909ProxyAddress,
    });

    log(`Order created: ${storedOrder.orderHash}`);

    // Fetch order from API with retry
    log("Fetching order from API...");
    let fetchedOrder = await orderbookApi.getOrder(storedOrder.orderHash);

    if (!fetchedOrder) {
      log("First fetch returned null, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      fetchedOrder = await orderbookApi.getOrder(storedOrder.orderHash);
    }

    if (!fetchedOrder) {
      error("Failed to fetch order from API");
      return false;
    }

    log("Order fetched successfully");

    // Step 4: Taker fills directly
    log("Taker (Account 2) filling order directly...");
    const fillAmount = parseEther("1"); // Fill 1 option

    const optionTokenIdHex = orderHelper.calculateOptionTokenId(TEST_OPTION);
    const takerOptionsBefore = await publicClient.readContract({
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address, BigInt(optionTokenIdHex)],
    });

    const result = await takerFiller.fillOrder(fetchedOrder, fillAmount);
    log(`Fill transaction: ${result.txHash}`);

    const takerOptionsAfter = await publicClient.readContract({
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address, BigInt(optionTokenIdHex)],
    });

    const optionsReceived = takerOptionsAfter - takerOptionsBefore;
    if (optionsReceived > 0n) {
      success(`Order filled! Taker received ${formatEther(optionsReceived)} options`);
      return true;
    } else {
      error("Taker did not receive options");
      return false;
    }
  } catch (e: any) {
    error(`Test failed: ${e.message}`);
    console.error(e);
    return false;
  }
}
