import { OrderbookApi } from "./index.js";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
}

describe("OrderbookApi", () => {
  it("normalizes the base URL and keeps zero-value query params", async () => {
    let requestedUrl = "";

    const api = new OrderbookApi({
      baseUrl: "https://sdk.stryke.xyz///",
      fetchFn: (async (input) => {
        requestedUrl = String(input);

        return jsonResponse({
          success: true,
          data: {
            orders: [],
            count: 0,
            limit: 0,
            offset: 0,
          },
        });
      }) as typeof fetch,
    });

    await api.queryOrders({ limit: 0, offset: 0 });

    expect(requestedUrl).toBe(
      "https://sdk.stryke.xyz/orderbook/api/orders?limit=0&offset=0",
    );
  });

  it("returns null for 404 order lookups without requiring a JSON body", async () => {
    const api = new OrderbookApi({
      baseUrl: "https://sdk.stryke.xyz",
      fetchFn: (async () =>
        new Response("Not found", {
          status: 404,
          headers: {
            "Content-Type": "text/plain",
          },
        })) as typeof fetch,
    });

    await expect(api.getOrder("0xabc")).resolves.toBeNull();
  });

  it("throws a clear error when an upstream endpoint stops returning JSON", async () => {
    const api = new OrderbookApi({
      baseUrl: "https://sdk.stryke.xyz",
      fetchFn: (async () =>
        new Response("<html>bad gateway</html>", {
          status: 502,
          statusText: "Bad Gateway",
          headers: {
            "Content-Type": "text/html",
          },
        })) as typeof fetch,
    });

    await expect(api.getMarkets()).rejects.toThrow(
      "Failed to fetch markets: expected a JSON response (status 502)",
    );
  });
});
