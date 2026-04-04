import { ActivitySyncClient } from "./activity-client.js";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static OPEN = 1;
  static CLOSED = 3;

  readyState = FakeWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  sent: string[] = [];

  constructor(public readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }
}

describe("ActivitySyncClient", () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("waits for subscription acknowledgement before resolving connect", async () => {
    const client = new ActivitySyncClient({
      wsUrl: "wss://example.com",
      marketId: "1",
    });

    let resolved = false;
    const connectPromise = client.connect().then(() => {
      resolved = true;
    });
    const ws = FakeWebSocket.instances[0]!;

    ws.onopen?.();
    await Promise.resolve();

    expect(resolved).toBe(false);
    expect(client.getStatus()).toBe("connecting");

    ws.onmessage?.({
      data: JSON.stringify({
        type: "subscribed",
        channel: "orders_matched",
      }),
    });
    await connectPromise;

    expect(client.getStatus()).toBe("synced");
  });

  it("rejects connect if the server returns a subscription error", async () => {
    const client = new ActivitySyncClient({
      wsUrl: "wss://example.com",
      marketId: "1",
    });

    const connectPromise = client.connect();
    const ws = FakeWebSocket.instances[0]!;

    ws.onopen?.();
    ws.onmessage?.({
      data: JSON.stringify({
        type: "error",
        message: "forbidden",
      }),
    });

    await expect(connectPromise).rejects.toThrow("forbidden");
  });
});
