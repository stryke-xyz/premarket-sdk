import { type Address } from "viem";
import { divider, log, success, error } from "../helpers";
import { orderbookApi } from "../setup";
import type { StoredOrder } from "../../../src";

export default async function testCancelOrder(
  storedOrder: StoredOrder
): Promise<boolean> {
  divider("Test 8: Cancel Order");

  log(`Cancelling order: ${storedOrder.orderHash}`);

  const maker = storedOrder.maker || storedOrder.order?.maker;
  if (!maker) {
    error(`Maker address not found in storedOrder`);
    return false;
  }

  try {
    await orderbookApi.cancelOrder(storedOrder.orderHash, maker as Address);
    success("Order cancelled successfully");

    const order = await orderbookApi.getOrder(storedOrder.orderHash);
    if (order?.status === "CANCELLED") {
      success("Verified: Order status is CANCELLED");
      return true;
    }
    error("Order status not CANCELLED after cancel");
    return false;
  } catch (e: any) {
    error(`Failed to cancel order: ${e.message}`);
    return false;
  }
}

