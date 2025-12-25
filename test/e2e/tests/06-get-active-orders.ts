import { divider, log, success, error } from "../helpers";
import { orderbookApi } from "../setup";
import type { StoredOrder } from "../../../src";

export default async function testGetActiveOrders(): Promise<StoredOrder[]> {
  divider("Test 6: Get Active Orders");

  try {
    const orders = await orderbookApi.getActiveOrders();
    log(`Found ${orders.length} active orders`);
    success(`Found ${orders.length} active orders`);
    return orders;
  } catch (e: any) {
    error(`Failed to get active orders: ${e.message}`);
    return [];
  }
}

