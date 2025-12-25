import { parseEther } from "viem";
import { divider, log, success, error } from "../helpers";
import { CONFIG, TEST_OPTION } from "../config";
import { makerAccount, makerWallet, orderbookApi, orderHelper } from "../setup";
import { OrderbookSyncClient } from "../../../src/sync";
import { OrderType, OrderStatus, type StoredOrder } from "../../../src";

interface Operation {
  type: "INSERT" | "DELETE";
  orderHash?: string;
}

export default async function testSyncStressTest(): Promise<boolean> {
  divider("Test 15: Sync Stress Test (10k random operations)");

  // Clear database before starting to ensure clean state
  log("Clearing database before sync stress test...");
  try {
    const clearResponse = await fetch(`${CONFIG.apiUrl}/api/orders`, {
      method: "DELETE",
    });
    const clearResult = await clearResponse.json();
    if (!clearResult.success) {
      error("Failed to clear database before sync test");
      return false;
    }
    log("✅ Database cleared");

    // Wait a bit for the sync server to process any DELETE messages from clearing
    await new Promise((resolve) => setTimeout(resolve, 500));
  } catch (e: any) {
    error(`Failed to clear database: ${e.message}`);
    return false;
  }

  const redisUrl = process.env.REDIS_URL || "ws://localhost:8080";
  const syncClient = new OrderbookSyncClient({
    redisUrl,
    snapshotUrl: CONFIG.apiUrl,
    gapRecoveryUrl: CONFIG.apiUrl,
    marketId: CONFIG.marketId,
  });

  // Track expected final state
  const expectedOrders = new Map<string, StoredOrder>();
  const operations: Operation[] = [];
  const createdOrders: Array<{
    orderHash: string;
    storedOrder: StoredOrder;
  }> = [];

  // Track changes received by sync client
  let changesReceived = 0;
  let snapshotReceived = false;

  // Set up sync client listeners
  syncClient.onSnapshot((orders) => {
    snapshotReceived = true;
    log(`📸 Snapshot received: ${orders.length} orders`);
    orders.forEach((order) => {
      expectedOrders.set(order.orderHash, order);
    });
  });

  syncClient.onChange((change) => {
    changesReceived++;

    if (change.type === "INSERT") {
      if (change.order) {
        expectedOrders.set(change.orderHash, change.order);
      }
    } else if (change.type === "DELETE") {
      expectedOrders.delete(change.orderHash);
    }
  });

  // Connect sync client
  log("Connecting sync client...");
  await syncClient.connect();

  // Wait for snapshot
  let attempts = 0;
  while (!snapshotReceived && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (!snapshotReceived) {
    error("Timeout waiting for snapshot");
    await syncClient.disconnect();
    return false;
  }

  log(`✅ Sync client connected. Starting with ${expectedOrders.size} orders`);

  // Capture initial changes count AFTER snapshot is received and sync is established
  // Wait a bit to ensure sync client is fully ready
  await new Promise((resolve) => setTimeout(resolve, 500));
  const initialChangesBeforeOps = changesReceived;

  // Generate 10k random operations
  const TOTAL_OPERATIONS = 10000;

  log(`Generating ${TOTAL_OPERATIONS} random operations...`);

  // First, create some initial orders to work with
  const INITIAL_ORDERS = 100;
  log(`Creating ${INITIAL_ORDERS} initial orders...`);

  for (let i = 0; i < INITIAL_ORDERS; i++) {
    try {
      const { order, extensionEncoded } = orderHelper.buildSellOptionsOrder({
        maker: makerAccount.address,
        makerProxyAddress: CONFIG.erc6909ProxyAddress,
        stableToken: CONFIG.usdcAddress,
        option: TEST_OPTION,
        optionAmount: parseEther("10").toString(),
        stableAmount: "100000000", // 100 USDC
      });

      const orderStruct = order.build();
      const signature = await orderHelper.signOrder(order, makerWallet);

      const storedOrder = await orderbookApi.createOrder({
        order: orderStruct,
        orderType: OrderType.SELL_OPTIONS,
        extensionEncoded,
        signature,
        marketId: CONFIG.marketId,
        option: TEST_OPTION,
        optionAmount: parseEther("10").toString(),
        stableAmount: "100000000",
        stableToken: CONFIG.usdcAddress,
        makerProxyAddress: CONFIG.erc6909ProxyAddress,
      });

      createdOrders.push({
        orderHash: storedOrder.orderHash,
        storedOrder,
      });

      operations.push({ type: "INSERT", orderHash: storedOrder.orderHash });
    } catch (e: any) {
      error(`Failed to create initial order ${i}: ${e.message}`);
    }
  }

  log(`✅ Created ${createdOrders.length} initial orders`);

  // Generate remaining random operations
  for (let i = INITIAL_ORDERS; i < TOTAL_OPERATIONS; i++) {
    const availableOrders = createdOrders.filter(
      (o) => o.storedOrder.status === OrderStatus.ACTIVE
    );

    if (availableOrders.length === 0) {
      // Can only insert if no orders available
      operations.push({ type: "INSERT" });
    } else {
      // Random operation type: 50% insertions, 50% deletions
      const rand = Math.random();
      if (rand < 0.5) {
        // 50% insertions
        operations.push({ type: "INSERT" });
      } else {
        // 50% deletions
        const randomOrder =
          availableOrders[Math.floor(Math.random() * availableOrders.length)];
        operations.push({ type: "DELETE", orderHash: randomOrder.orderHash });
      }
    }
  }

  // Shuffle operations to randomize order
  for (let i = operations.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [operations[i], operations[j]] = [operations[j], operations[i]];
  }

  log(`✅ Generated ${operations.length} random operations`);
  log(`   - INSERT: ${operations.filter((o) => o.type === "INSERT").length}`);
  log(`   - DELETE: ${operations.filter((o) => o.type === "DELETE").length}`);

  // Execute operations
  log("Executing operations...");
  let executed = 0;
  let failed = 0;

  for (const op of operations) {
    try {
      if (op.type === "INSERT") {
        const { order, optionTokenId, extensionEncoded } =
          orderHelper.buildSellOptionsOrder({
            maker: makerAccount.address,
            makerProxyAddress: CONFIG.erc6909ProxyAddress,
            stableToken: CONFIG.usdcAddress,
            option: TEST_OPTION,
            optionAmount: parseEther("10").toString(),
            stableAmount: "100000000",
          });

        const orderStruct = order.build();
        const signature = await orderHelper.signOrder(order, makerWallet);

        const storedOrder = await orderbookApi.createOrder({
          order: orderStruct,
          orderType: OrderType.SELL_OPTIONS,
          extensionEncoded,
          signature,
          marketId: CONFIG.marketId,
          option: TEST_OPTION,
          optionAmount: parseEther("10").toString(),
          stableAmount: "100000000",
          stableToken: CONFIG.usdcAddress,
          makerProxyAddress: CONFIG.erc6909ProxyAddress,
        });

        createdOrders.push({
          orderHash: storedOrder.orderHash,
          storedOrder,
        });
        executed++;
      } else if (op.type === "DELETE") {
        const orderToDeleteIndex = createdOrders.findIndex(
          (o) => o.orderHash === op.orderHash
        );
        if (orderToDeleteIndex >= 0) {
          const orderToDelete = createdOrders[orderToDeleteIndex];
          if (orderToDelete.storedOrder.status === OrderStatus.ACTIVE) {
            await orderbookApi.cancelOrder(op.orderHash!, makerAccount.address);
            // Remove the order from createdOrders array after deletion
            createdOrders.splice(orderToDeleteIndex, 1);
            executed++;
          }
        }
      }
    } catch (e: any) {
      failed++;
      if (failed <= 10 || failed % 100 === 0) {
        // Log first 10 failures with details, then every 100th failure
        const errorMsg = e.message || String(e);
        log(`   ⚠️  Operation failed (${failed} total): ${errorMsg}`);
      }
    }

    if (executed % 1000 === 0) {
      log(`   ✅ Executed ${executed} operations...`);
    }
  }

  log(`✅ Executed ${executed} operations (${failed} failed)`);

  // Wait for sync to catch up
  log("Waiting for sync client to process all changes...");
  // Use the initial count captured before operations started
  const initialChanges = initialChangesBeforeOps;

  // Wait up to 60 seconds for all changes to be received
  for (let i = 0; i < 600; i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if we're synced and no more changes coming
    if (syncClient.isSynced() && syncClient.getBufferedCount() === 0) {
      // Give it a bit more time to ensure no more messages
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (syncClient.getBufferedCount() === 0) {
        break;
      }
    }
  }

  const finalChanges = changesReceived;
  const sequenceDiff =
    syncClient.getLastSequence() - (initialChanges > 0 ? initialChanges : 0);
  log(
    `📊 Sync client received ${
      finalChanges - initialChanges
    } changes after operations (via onChange callback)`
  );
  log(`   Total changes received: ${finalChanges}`);
  log(`   Sequence advanced by: ${sequenceDiff} messages`);
  log(`   Current sequence: ${syncClient.getLastSequence()}`);
  log(`   Buffered messages: ${syncClient.getBufferedCount()}`);
  log(
    `   Expected changes: ~${executed} (each INSERT/DELETE should generate a message)`
  );

  // Get final state from API (database)
  log("Fetching final state from API...");
  const dbOrders = await orderbookApi.getActiveOrders();
  const dbOrdersMap = new Map<string, StoredOrder>();
  dbOrders.forEach((order) => {
    dbOrdersMap.set(order.orderHash, order);
  });

  log(`📊 Database has ${dbOrdersMap.size} active orders`);

  // Get final state from sync client (only active orders for comparison)
  const syncOrders = syncClient
    .getOrders()
    .filter((order) => order.status === OrderStatus.ACTIVE);
  const syncOrdersMap = new Map<string, StoredOrder>();
  syncOrders.forEach((order) => {
    syncOrdersMap.set(order.orderHash, order);
  });

  log(`📊 Sync client has ${syncOrdersMap.size} orders`);

  // Compare states
  log("Comparing states...");

  let missingInSync = 0;
  let extraInSync = 0;
  let mismatched = 0;

  // Check orders in database
  for (const [hash, dbOrder] of dbOrdersMap) {
    const syncOrder = syncOrdersMap.get(hash);

    if (!syncOrder) {
      missingInSync++;
      error(`Order ${hash.slice(0, 10)}... missing in sync client`);
    } else {
      // Compare all critical fields to ensure exact match
      const fieldsMismatch: string[] = [];

      if (dbOrder.status !== syncOrder.status) {
        fieldsMismatch.push(
          `status: ${dbOrder.status} !== ${syncOrder.status}`
        );
      }
      if (dbOrder.orderType !== syncOrder.orderType) {
        fieldsMismatch.push(
          `orderType: ${dbOrder.orderType} !== ${syncOrder.orderType}`
        );
      }
      if (dbOrder.optionAmount !== syncOrder.optionAmount) {
        fieldsMismatch.push(
          `optionAmount: ${dbOrder.optionAmount} !== ${syncOrder.optionAmount}`
        );
      }
      if (dbOrder.stableAmount !== syncOrder.stableAmount) {
        fieldsMismatch.push(
          `stableAmount: ${dbOrder.stableAmount} !== ${syncOrder.stableAmount}`
        );
      }
      if (dbOrder.filledAmount !== syncOrder.filledAmount) {
        fieldsMismatch.push(
          `filledAmount: ${dbOrder.filledAmount} !== ${syncOrder.filledAmount}`
        );
      }
      if (dbOrder.maker.toLowerCase() !== syncOrder.maker.toLowerCase()) {
        fieldsMismatch.push(`maker: ${dbOrder.maker} !== ${syncOrder.maker}`);
      }
      if (dbOrder.optionTokenId !== syncOrder.optionTokenId) {
        fieldsMismatch.push(
          `optionTokenId: ${dbOrder.optionTokenId} !== ${syncOrder.optionTokenId}`
        );
      }
      if (
        dbOrder.stableToken.toLowerCase() !==
        syncOrder.stableToken.toLowerCase()
      ) {
        fieldsMismatch.push(
          `stableToken: ${dbOrder.stableToken} !== ${syncOrder.stableToken}`
        );
      }
      if (dbOrder.marketId !== syncOrder.marketId) {
        fieldsMismatch.push(
          `marketId: ${dbOrder.marketId} !== ${syncOrder.marketId}`
        );
      }

      if (fieldsMismatch.length > 0) {
        mismatched++;
        error(`Order ${hash.slice(0, 10)}... has mismatched fields:`);
        fieldsMismatch.forEach((field) => log(`   - ${field}`));
      }
    }
  }

  // Check for extra orders in sync client
  for (const [hash] of syncOrdersMap) {
    if (!dbOrdersMap.has(hash)) {
      extraInSync++;
      error(
        `Order ${hash.slice(
          0,
          10
        )}... exists in sync client but not in database`
      );
    }
  }

  // Final results
  const passed = missingInSync === 0 && extraInSync === 0 && mismatched === 0;

  if (passed) {
    success(`✅ States match perfectly!`);
    success(`   - Database orders: ${dbOrdersMap.size}`);
    success(`   - Sync client orders: ${syncOrdersMap.size}`);
    success(`   - Total changes received: ${finalChanges}`);
  } else {
    error(`❌ State mismatch detected:`);
    error(`   - Missing in sync: ${missingInSync}`);
    error(`   - Extra in sync: ${extraInSync}`);
    error(`   - Mismatched fields: ${mismatched}`);
  }

  await syncClient.disconnect();
  log("✅ Sync stress test completed");
  return passed;
}
