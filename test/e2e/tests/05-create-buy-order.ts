import { parseEther } from "viem";
import { divider, log, success, error } from "../helpers";
import { CONFIG, TEST_OPTION } from "../config";
import {
  takerAccount,
  takerWallet,
  orderbookApi,
  orderHelper,
} from "../setup";
import { OrderType, type StoredOrder } from "../../../src";

/**
 * Create a buy order - maker signs their own order (no operator)
 * For buy orders: maker = buyer (pays USDC), taker = seller (provides options)
 * Here we use takerAccount as the buyer (maker of the buy order)
 */
export default async function testCreateBuyOrder(): Promise<{
  storedOrder: StoredOrder;
  signature: { r: string; vs: string };
} | null> {
  divider("Test 5: Create Buy Order");

  log("Creating buy order using SDK...");

  try {
    // Step 1: Build order locally using 1inch SDK
    log("Building order locally with 1inch SDK...");
    const { order, optionTokenId, extensionEncoded } =
      orderHelper.buildBuyOptionsOrder({
        maker: takerAccount.address, // Buyer is the maker of buy order
        makerProxyAddress: CONFIG.erc6909ProxyAddress,
        stableToken: CONFIG.usdcAddress,
        option: TEST_OPTION,
        optionAmount: parseEther("5").toString(),
        stableAmount: "50000000", // 50 USDC
      });
    const orderStruct = order.build();

    // Step 2: Sign the order with MAKER wallet (buyer signs their own buy order)
    log("Signing order with buyer wallet (maker of buy order)...");
    const signature = await orderHelper.signOrder(order, takerWallet);

    // Step 3: Send order to API (no operator)
    log("Sending signed order to API...");
    const storedOrder = await orderbookApi.createOrder({
      orderType: OrderType.BUY_OPTIONS,
      marketId: CONFIG.marketId,
      option: TEST_OPTION,
      order: orderStruct,
      extensionEncoded,
      signature,
      optionAmount: parseEther("5").toString(),
      stableAmount: "50000000",
      stableToken: CONFIG.usdcAddress,
      makerProxyAddress: CONFIG.erc6909ProxyAddress,
      // No operator - maker signs their own order
    });

    log(`Order created: ${storedOrder.orderHash}`);
    success(`Buy order created and signed: ${storedOrder.orderHash}`);

    return { storedOrder, signature };
  } catch (e: any) {
    error(`Failed to create buy order: ${e.message}`);
    console.error("Full error:", e);
    return null;
  }
}
