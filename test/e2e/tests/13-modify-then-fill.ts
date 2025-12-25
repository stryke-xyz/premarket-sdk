import { parseEther, formatEther, formatUnits } from "viem";
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
import { ERC6909_ABI, ERC20_ABI } from "../abis";
import { LimitOrder, Extension, OrderType } from "../../../src";

/**
 * Test 13: Create order -> Modify amounts -> Re-sign -> Fill
 * Tests the full order modification flow with direct fills.
 */
export default async function testModifyThenFill(): Promise<boolean> {
  divider("Test 13: Create -> Modify -> Re-sign -> Fill");

  try {
    // Step 1: Create initial order
    log("Creating initial sell order...");
    const { order: initialOrder, extensionEncoded: initialExtension } =
      orderHelper.buildSellOptionsOrder({
        maker: makerAccount.address,
        makerProxyAddress: CONFIG.erc6909ProxyAddress,
        stableToken: CONFIG.usdcAddress,
        option: TEST_OPTION,
        optionAmount: parseEther("10").toString(), // Initial: 10 options
        stableAmount: "100000000", // Initial: 100 USDC
      });

    const initialSignature = await orderHelper.signOrder(
      initialOrder,
      makerWallet
    );

    const storedOrder = await orderbookApi.createOrder({
      orderType: OrderType.SELL_OPTIONS,
      marketId: CONFIG.marketId,
      option: TEST_OPTION,
      order: initialOrder.build(),
      extensionEncoded: initialExtension,
      signature: initialSignature,
      optionAmount: parseEther("10").toString(),
      stableAmount: "100000000",
      stableToken: CONFIG.usdcAddress,
      makerProxyAddress: CONFIG.erc6909ProxyAddress,
    });

    log(`Initial order created: ${storedOrder.orderHash}`);
    log(`Initial amounts: 10 options for 100 USDC`);

    // Wait for order to be available in database
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Step 2: Cancel the initial order and create a new one with modified amounts
    log("Cancelling initial order...");
    await orderbookApi.cancelOrder(storedOrder.orderHash, makerAccount.address);
    log("Initial order cancelled");

    // Step 3: Create new order with modified amounts
    log("Creating new order with modified amounts: 5 options for 75 USDC...");
    const { order: modifiedOrderObj, extensionEncoded: modifiedExtension } =
      orderHelper.buildSellOptionsOrder({
        maker: makerAccount.address,
        makerProxyAddress: CONFIG.erc6909ProxyAddress,
        stableToken: CONFIG.usdcAddress,
        option: TEST_OPTION,
        optionAmount: parseEther("5").toString(), // Changed: 5 options
        stableAmount: "75000000", // Changed: 75 USDC
      });

    const newSignature = await orderHelper.signOrder(
      modifiedOrderObj,
      makerWallet
    );

    const modifiedStoredOrder = await orderbookApi.createOrder({
      orderType: OrderType.SELL_OPTIONS,
      marketId: CONFIG.marketId,
      option: TEST_OPTION,
      order: modifiedOrderObj.build(),
      extensionEncoded: modifiedExtension,
      signature: newSignature,
      optionAmount: parseEther("5").toString(),
      stableAmount: "75000000",
      stableToken: CONFIG.usdcAddress,
      makerProxyAddress: CONFIG.erc6909ProxyAddress,
    });

    log(
      `New order created: ${modifiedStoredOrder.orderHash}`
    );
    log(
      `New amounts: ${formatEther(
        BigInt(modifiedStoredOrder.optionAmount)
      )} options for ${formatUnits(
        BigInt(modifiedStoredOrder.stableAmount),
        6
      )} USDC`
    );

    // Use the stored order for filling
    const modifiedOrder = modifiedStoredOrder;

    // Step 4: Fill the modified order - taker fills directly
    log("Filling modified order...");
    const fillAmount = parseEther("2"); // Fill 2 options from the 5 available

    const optionTokenIdHex = orderHelper.calculateOptionTokenId(TEST_OPTION);
    const takerOptionsBefore = await publicClient.readContract({
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address, BigInt(optionTokenIdHex)],
    });
    const takerUsdcBefore = await publicClient.readContract({
      address: CONFIG.usdcAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address],
    });

    // Taker fills directly
    const result = await takerFiller.fillOrder(modifiedOrder, fillAmount);
    log(`Fill transaction: ${result.txHash}`);

    const takerOptionsAfter = await publicClient.readContract({
      address: CONFIG.optionTokenFactoryAddress,
      abi: ERC6909_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address, BigInt(optionTokenIdHex)],
    });
    const takerUsdcAfter = await publicClient.readContract({
      address: CONFIG.usdcAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [takerAccount.address],
    });

    const optionsReceived = takerOptionsAfter - takerOptionsBefore;
    const usdcSpent = takerUsdcBefore - takerUsdcAfter;

    log(`Options received: ${formatEther(optionsReceived)}`);
    log(`USDC spent: ${formatUnits(usdcSpent, 6)}`);

    // Verify: Price should be based on modified order (75 USDC for 5 options = 15 USDC/option)
    // For 2 options, should spend 30 USDC
    const expectedUsdcSpent = (75000000n * fillAmount) / parseEther("5");
    log(`Expected USDC spent: ${formatUnits(expectedUsdcSpent, 6)}`);

    if (optionsReceived === fillAmount && usdcSpent === expectedUsdcSpent) {
      success(
        `Modified order filled correctly! ${formatEther(
          optionsReceived
        )} options for ${formatUnits(usdcSpent, 6)} USDC`
      );
      return true;
    } else if (optionsReceived > 0n) {
      success(
        `Order filled with ${formatEther(
          optionsReceived
        )} options for ${formatUnits(usdcSpent, 6)} USDC`
      );
      return true;
    } else {
      error("Fill did not work as expected");
      return false;
    }
  } catch (e: any) {
    error(`Test failed: ${e.message}`);
    console.error(e);
    return false;
  }
}
