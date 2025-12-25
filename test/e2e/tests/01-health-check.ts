import { divider, log, success } from "../helpers";
import { CONFIG } from "../config";
import { orderbookApi } from "../setup";

export default async function testHealthCheck(): Promise<boolean> {
  divider("Test 1: Health Check");

  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/health`);
    const result = await response.json();
    log("Health check response:", result);

    if (result.success && result.data.status === "healthy") {
      success("API is healthy");
      return true;
    }
    return false;
  } catch (e: any) {
    console.error(`Health check failed: ${e.message}`);
    return false;
  }
}

