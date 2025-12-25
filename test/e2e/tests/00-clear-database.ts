import { divider, log, success, error } from "../helpers";
import { CONFIG } from "../config";
import { orderbookApi } from "../setup";

export default async function testClearDatabase(): Promise<boolean> {
  divider("Test 0: Clear Database");

  log("Clearing all orders from database...");
  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/orders`, {
      method: "DELETE",
    });
    const result = await response.json();
    log("Clear database response:", result);

    if (result.success) {
      success("All orders cleared from database");
      return true;
    }
    error("Failed to clear database");
    return false;
  } catch (e: any) {
    error(`Failed to clear database: ${e.message}`);
    return false;
  }
}

