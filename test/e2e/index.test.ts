import { test } from "bun:test";
import { divider, log } from "./helpers";
import { CONFIG } from "./config";
import {
  account0,
  makerAccount,
  takerAccount,
  account3,
  orderbookApi,
} from "./setup";

// Import all tests
import testClearDatabase from "./tests/00-clear-database";
import testHealthCheck from "./tests/01-health-check";
import testSetupApprovals from "./tests/02-setup-approvals";
import testCreateAndSignSellOrder from "./tests/03-create-sell-order";
import testFillOrderOnChain from "./tests/04-fill-order";
import testCreateBuyOrder from "./tests/05-create-buy-order";
import testGetActiveOrders from "./tests/06-get-active-orders";
import testCancelOrder from "./tests/08-cancel-order";
import testFillBuyOrder from "./tests/09-fill-buy-order";
import testCreateAndFillSellOrder from "./tests/10-create-no-op-fill-with-op";
import testCreateAndFillSellOrderVariant from "./tests/11-create-with-op-fill-direct";
import testCreateAndFillBothDirect from "./tests/12-create-fill-both-direct";
import testModifyThenFill from "./tests/13-modify-then-fill";
// Smart account test disabled - requires properly compiled EIP-1271 contract bytecode
// import testSmartAccountOrder from "./tests/14-smart-account-order";
import testSyncStressTest from "./tests/15-sync-stress-test";

async function runAllTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║       Orderbook API E2E Test Suite                 ║");
  console.log("║       (Direct Order Flow - No Operator System)     ║");
  console.log("╚════════════════════════════════════════════════════╝");

  console.log("\n📋 Configuration:");
  console.log(`   API URL: ${CONFIG.apiUrl}`);
  console.log(`   RPC URL: ${CONFIG.rpcUrl}`);
  console.log(`   Chain ID: ${CONFIG.chainId}`);
  console.log(`   Market ID: ${CONFIG.marketId}`);
  console.log(`   LimitOrderProtocol: ${CONFIG.limitOrderProtocolAddress}`);
  console.log(`   OptionTokenFactory: ${CONFIG.optionTokenFactoryAddress}`);
  console.log(`   USDC: ${CONFIG.usdcAddress}`);
  console.log(`   Collateral Token: ${CONFIG.collateralTokenAddress}`);
  console.log(`\n   Test Accounts:`);
  console.log(`     Account 0 (Unused): ${account0.address}`);
  console.log(`     Account 1 (Maker): ${makerAccount.address}`);
  console.log(`     Account 2 (Taker): ${takerAccount.address}`);
  console.log(`     Account 3 (Unused): ${account3.address}`);
  console.log(`\n   ERC6909 Proxy (shared): ${CONFIG.erc6909ProxyAddress}`);

  const results: { test: string; passed: boolean }[] = [];

  // Setup tests
  results.push({ test: "Clear Database", passed: await testClearDatabase() });
  results.push({ test: "Health Check", passed: await testHealthCheck() });
  results.push({
    test: "Setup Approvals",
    passed: await testSetupApprovals(),
  });

  // Test 3 & 4: Create and fill sell order
  const sellOrderData = await testCreateAndSignSellOrder();
  results.push({
    test: "Create & Sign Sell Order",
    passed: !!sellOrderData,
  });

  if (sellOrderData && sellOrderData.storedOrder) {
    log(
      `sellOrderData.storedOrder keys: ${Object.keys(
        sellOrderData.storedOrder
      ).join(", ")}`
    );
    log(
      `sellOrderData.storedOrder.orderHash: ${sellOrderData.storedOrder.orderHash}`
    );

    // FETCH the order from the API with retry, then fill
    let fetchedOrder = await orderbookApi.getOrder(
      sellOrderData.storedOrder.orderHash
    );

    if (!fetchedOrder) {
      log("First fetch returned null, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 100));
      fetchedOrder = await orderbookApi.getOrder(
        sellOrderData.storedOrder.orderHash
      );
    }

    if (!fetchedOrder) {
      console.error("Failed to fetch order from API after retry");
      results.push({ test: "Fill Order On-Chain", passed: false });
    } else {
      results.push({
        test: "Fill Order On-Chain",
        passed: await testFillOrderOnChain(fetchedOrder),
      });
    }
  } else {
    results.push({ test: "Fill Order On-Chain", passed: false });
  }

  // Test 5: Create buy order
  const buyOrder = await testCreateBuyOrder();
  results.push({
    test: "Create Buy Order",
    passed: !!buyOrder,
  });

  // Test 6: Get active orders
  const activeOrders = await testGetActiveOrders();
  results.push({
    test: "Get Active Orders",
    passed: activeOrders.length >= 1,
  });

  // Test 7: Cancel order
  let orderToCancel: any = null;
  if (buyOrder?.storedOrder) {
    log("Fetching buy order from API for canceling...");
    orderToCancel = await orderbookApi.getOrder(buyOrder.storedOrder.orderHash);
  }
  if (orderToCancel) {
    results.push({
      test: "Cancel Order",
      passed: await testCancelOrder(orderToCancel),
    });
  } else {
    results.push({ test: "Cancel Order", passed: false });
  }

  // Test 9: Fill buy order (create a fresh buy order and fill it)
  try {
    divider("Test 9: Create Fresh Buy Order for Fill Test");
    const freshBuyOrder = await testCreateBuyOrder();
    if (freshBuyOrder?.storedOrder) {
      log(`Fetching order: ${freshBuyOrder.storedOrder.orderHash}`);
      let fetchedBuyOrder = await orderbookApi.getOrder(
        freshBuyOrder.storedOrder.orderHash
      );

      if (!fetchedBuyOrder) {
        log("First fetch returned null, retrying...");
        await new Promise((resolve) => setTimeout(resolve, 100));
        fetchedBuyOrder = await orderbookApi.getOrder(
          freshBuyOrder.storedOrder.orderHash
        );
      }

      log(`Fetched order: ${fetchedBuyOrder ? "found" : "null"}`);
      if (fetchedBuyOrder) {
        results.push({
          test: "Fill Buy Order",
          passed: await testFillBuyOrder(fetchedBuyOrder),
        });
      } else {
        console.error("Failed to fetch fresh buy order from API after retry");
        results.push({ test: "Fill Buy Order", passed: false });
      }
    } else {
      console.error("Failed to create fresh buy order");
      results.push({ test: "Fill Buy Order", passed: false });
    }
  } catch (e: any) {
    console.error(`Fill buy order test failed: ${e.message}`);
    console.error(e);
    results.push({ test: "Fill Buy Order", passed: false });
  }

  // Tests 10-13: Direct order scenarios
  try {
    results.push({
      test: "Sell Order + Direct Fill (Test 10)",
      passed: await testCreateAndFillSellOrder(),
    });
  } catch (e: any) {
    console.error(`Test 10 failed: ${e.message}`);
    results.push({ test: "Sell Order + Direct Fill (Test 10)", passed: false });
  }

  try {
    results.push({
      test: "Sell Order Variant + Direct Fill (Test 11)",
      passed: await testCreateAndFillSellOrderVariant(),
    });
  } catch (e: any) {
    console.error(`Test 11 failed: ${e.message}`);
    results.push({
      test: "Sell Order Variant + Direct Fill (Test 11)",
      passed: false,
    });
  }

  try {
    results.push({
      test: "Create + Fill Both Direct (Test 12)",
      passed: await testCreateAndFillBothDirect(),
    });
  } catch (e: any) {
    console.error(`Test 12 failed: ${e.message}`);
    results.push({
      test: "Create + Fill Both Direct (Test 12)",
      passed: false,
    });
  }

  try {
    results.push({
      test: "Modify Order Then Fill (Test 13)",
      passed: await testModifyThenFill(),
    });
  } catch (e: any) {
    console.error(`Test 13 failed: ${e.message}`);
    results.push({ test: "Modify Order Then Fill (Test 13)", passed: false });
  }

  // Test 14: Smart Account Order - DISABLED (requires compiled EIP-1271 contract)
  // When you have a properly compiled SimpleSmartAccount contract, enable this:
  // try {
  //   results.push({
  //     test: "Smart Account Order",
  //     passed: await testSmartAccountOrder(),
  //   });
  // } catch (e: any) {
  //   console.error(`Test 14 failed: ${e.message}`);
  //   results.push({ test: "Smart Account Order", passed: false });
  // }

  try {
    results.push({
      test: "Sync Stress Test (10k operations)",
      passed: await testSyncStressTest(),
    });
  } catch (e: any) {
    console.error(`Test 15 failed: ${e.message}`);
    results.push({ test: "Sync Stress Test (Test 15)", passed: false });
  }

  // Summary
  divider("Test Results Summary");

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.passed) {
      console.log(`  ✅ ${result.test}`);
      passed++;
    } else {
      console.log(`  ❌ ${result.test}`);
      failed++;
    }
  }

  console.log("\n" + "─".repeat(50));
  console.log(
    `  Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`
  );
  console.log("─".repeat(50) + "\n");

  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests using Bun's test framework
test(
  "E2E Orderbook API Test Suite",
  async () => {
    await runAllTests();
  },
  { timeout: 900000 } // 15 minutes timeout
);
