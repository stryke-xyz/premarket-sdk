import { MarketDepthSyncClient } from "./order-client.js";

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

describe("MarketDepthSyncClient", () => {
  const originalWebSocket = globalThis.WebSocket;

  beforeEach(() => {
    FakeWebSocket.instances = [];
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("rejects connect when the socket closes before the initial snapshot arrives", async () => {
    const client = new MarketDepthSyncClient({
      wsUrl: "wss://example.com",
      marketId: "1",
      tokenIds: ["100"],
      maxReconnectAttempts: 0,
    });

    const connectPromise = client.connect();
    const ws = FakeWebSocket.instances[0]!;

    ws.onopen?.();
    ws.close();

    await expect(connectPromise).rejects.toThrow(
      "WebSocket closed before initial depth snapshot",
    );
  });

  it("normalizes the input price when reading depth at a price level", () => {
    const client = new MarketDepthSyncClient({
      wsUrl: "wss://example.com",
      marketId: "1",
      tokenIds: ["100"],
    });

    (
      client as unknown as {
        tokenStates: Map<
          string,
          {
            bids: Map<string, string>;
            asks: Map<string, string>;
            bestBid: string | null;
            bestAsk: string | null;
            lastPrice: string | null;
            seq: number;
          }
        >;
      }
    ).tokenStates.set("100", {
      bids: new Map([["1", "25"]]),
      asks: new Map(),
      bestBid: "1",
      bestAsk: null,
      lastPrice: null,
      seq: 1,
    });

    expect(client.getDepthAtPrice("100", "bid", "1.000000")).toBe("25");
  });
});
