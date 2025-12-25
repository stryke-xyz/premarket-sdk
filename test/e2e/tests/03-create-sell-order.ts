import { parseEther } from "viem";
import { divider, log, success, error } from "../helpers";
import { CONFIG, TEST_OPTION } from "../config";
import { makerAccount, makerWallet, orderbookApi, orderHelper } from "../setup";
import { OrderType, type StoredOrder } from "../../../src";

/**
 * Create a sell order - maker signs their own order (no operator)
 */
export default async function testCreateAndSignSellOrder(): Promise<{
  storedOrder: StoredOrder;
  signature: { r: string; vs: string };
} | null> {
  divider("Test 3: Create and Sign Sell Order");

  log("Creating sell order using SDK...");

  try {
    // Step 1: Build order locally using 1inch SDK
    log("Building order locally with 1inch SDK...");
    const { order, optionTokenId, extensionEncoded } =
      orderHelper.buildSellOptionsOrder({
        maker: makerAccount.address,
        makerProxyAddress: CONFIG.erc6909ProxyAddress,
        stableToken: CONFIG.usdcAddress,
        option: TEST_OPTION,
        optionAmount: parseEther("10").toString(),
        stableAmount: "100000000", // 100 USDC (6 decimals)
      });

    const orderStruct = order.build();

    log("Local order built:");
    log(`  salt: ${orderStruct.salt}`);
    log(`  maker: ${orderStruct.maker}`);
    log(`  receiver: ${orderStruct.receiver}`);
    log(`  makerAsset: ${orderStruct.makerAsset}`);
    log(`  takerAsset: ${orderStruct.takerAsset}`);
    log(`  makingAmount: ${orderStruct.makingAmount}`);
    log(`  takingAmount: ${orderStruct.takingAmount}`);
    log(`  makerTraits: ${orderStruct.makerTraits}`);

    const localOrderHash = order.getOrderHash(CONFIG.chainId);
    log(`  Local order hash: ${localOrderHash}`);
    log(`  Extension encoded length: ${extensionEncoded.length} chars`);

    // Step 2: Sign the order with MAKER wallet (no operator system)
    log("Signing order with MAKER wallet...");
    const signature = await orderHelper.signOrder(order, makerWallet);

    // Step 3: Send order to API (no operator field)
    log("Sending signed order to API...");
    const storedOrder = await orderbookApi.createOrder({
      orderType: OrderType.SELL_OPTIONS,
      marketId: CONFIG.marketId,
      option: TEST_OPTION,
      order: orderStruct,
      extensionEncoded,
      signature,
      optionAmount: parseEther("10").toString(),
      stableAmount: "100000000",
      stableToken: CONFIG.usdcAddress,
      makerProxyAddress: CONFIG.erc6909ProxyAddress,
      // No operator - maker signs their own order
    });

    log(`Order created: ${storedOrder.orderHash}`);
    success(`Sell order created and signed: ${storedOrder.orderHash}`);

    return { storedOrder, signature };
  } catch (e: any) {
    error(`Failed to create sell order: ${e.message}`);
    console.error("Full error:", e);
    return null;
  }
}
