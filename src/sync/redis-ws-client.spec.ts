import { RedisWsClient } from "./redis-ws-client.js";

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static OPEN = 1;

  readyState = FakeWebSocket.OPEN;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  sent: string[] = [];

  constructor(public readonly url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(payload: string) {
    this.sent.push(payload);
  }

  close() {
    this.onclose?.();
  }
}

describe("RedisWsClient", () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("does not reconnect after an intentional close", async () => {
    const client = new RedisWsClient("wss://example.com");

    expect(FakeWebSocket.instances).toHaveLength(1);

    client.close();
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});
