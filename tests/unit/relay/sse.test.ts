import { describe, it, expect, vi } from "vitest";
import {
  calculateReconnectDelay,
  parseSSEChunk,
} from "../../../src/relay/sse";

describe("SSE Client", () => {
  describe("calculateReconnectDelay", () => {
    it("should calculate exponential backoff with jitter", () => {
      const delay = calculateReconnectDelay(0, 1000, 30000);
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(1200);
    });

    it("should increase delay exponentially with each attempt", () => {
      const delay0 = calculateReconnectDelay(0, 1000, 30000);
      const delay1 = calculateReconnectDelay(1, 1000, 30000);
      const delay2 = calculateReconnectDelay(2, 1000, 30000);

      expect(delay1).toBeGreaterThan(delay0);
      expect(delay2).toBeGreaterThan(delay1);
    });

    it("should cap delay at maxDelayMs", () => {
      const delay = calculateReconnectDelay(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000 + 5000 * 0.2);
    });

    it("should include jitter in calculation", () => {
      const delays = Array.from({ length: 10 }, () =>
        calculateReconnectDelay(1, 1000, 30000)
      );
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe("parseSSEChunk", () => {
    it("should parse single message event", () => {
      const chunk = `event: message
data: {"id":"msg_1","timestamp":1234567890}

`;
      const { events, consumed } = parseSSEChunk(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].event).toBe("message");
      expect(events[0].data).toEqual({ id: "msg_1", timestamp: 1234567890 });
      expect(consumed).toBe(chunk.length);
    });

    it("should parse ping event", () => {
      const chunk = `event: ping
data: {}

`;
      const { events } = parseSSEChunk(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].event).toBe("ping");
      expect(events[0].data).toEqual({});
    });

    it("should parse error event", () => {
      const chunk = `event: error
data: {"code":"AUTH_FAILED","message":"Invalid token"}

`;
      const { events } = parseSSEChunk(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].event).toBe("error");
      expect(events[0].data).toEqual({ code: "AUTH_FAILED", message: "Invalid token" });
    });

    it("should parse event with id", () => {
      const chunk = `event: message
id: evt_123
data: {"id":"msg_1"}

`;
      const { events } = parseSSEChunk(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe("evt_123");
    });

    it("should parse multiple events in single chunk", () => {
      const chunk = `event: ping
data: {}

event: message
data: {"id":"msg_1"}

event: message
data: {"id":"msg_2"}

`;
      const { events } = parseSSEChunk(chunk);

      expect(events).toHaveLength(3);
      expect(events[0].event).toBe("ping");
      expect(events[1].event).toBe("message");
      expect(events[2].event).toBe("message");
    });

    it("should skip malformed JSON and report parseErrors", () => {
      const chunk = `event: message
data: {invalid json}

event: message
data: {"id":"msg_1"}

`;
      const { events, parseErrors } = parseSSEChunk(chunk);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({ id: "msg_1" });
      expect(parseErrors).toBe(1);
    });

    it("should return zero parseErrors for valid events", () => {
      const chunk = `event: message
data: {"id":"msg_1"}

`;
      const { events, parseErrors } = parseSSEChunk(chunk);

      expect(events).toHaveLength(1);
      expect(parseErrors).toBe(0);
    });

    it("should handle incomplete events (not consumed)", () => {
      const chunk = `event: message
data: {"id":"msg_1"}`;

      const { events, consumed } = parseSSEChunk(chunk);
      expect(events).toHaveLength(0);
      expect(consumed).toBe(0);
    });

    it("should handle empty chunk", () => {
      const { events, consumed } = parseSSEChunk("");
      expect(events).toHaveLength(0);
      expect(consumed).toBe(0);
    });

    // New tests for consumed byte tracking
    it("should return correct consumed bytes for complete events", () => {
      const event1 = "event: message\ndata: {\"id\":\"1\"}\n\n";
      const incomplete = "event: message\ndata: {\"id\":\"2\"}";
      const chunk = event1 + incomplete;

      const { events, consumed } = parseSSEChunk(chunk);

      expect(events).toHaveLength(1);
      expect(consumed).toBe(event1.length);
    });

    it("should not consume incomplete events at end of buffer", () => {
      const chunk = `event: ping
data: {}

event: message
data: {"id":"msg_1"}`;

      const { events, consumed } = parseSSEChunk(chunk);

      // Only the ping event's part should be consumed
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe("ping");
      expect(consumed).toBeGreaterThan(0);
      expect(consumed).toBeLessThan(chunk.length);
    });

    it("should correctly handle split events across multiple chunks", () => {
      const fullChunk = `event: message\ndata: {"id":"msg_1"}\n\n`;
      const partial = `event: message\ndata: {"id":"ms`;

      // First chunk: complete event + partial
      const { events: events1, consumed: consumed1 } = parseSSEChunk(fullChunk + partial);
      expect(events1).toHaveLength(1);

      // Remaining buffer
      const remaining = (fullChunk + partial).slice(consumed1);
      expect(remaining).toBe(partial);

      // Second chunk: remaining + rest of event
      const { events: events2 } = parseSSEChunk(remaining + `g_2"}\n\n`);
      expect(events2).toHaveLength(1);
      expect(events2[0].data).toEqual({ id: "msg_2" });
    });
  });

  describe("connectSSE session invalidation", () => {
    it("should call onSessionInvalidated and throw on 401 without reconnecting", async () => {
      const { connectSSE } = await import("../../../src/relay/sse");

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const controller = new AbortController();
      const onSessionInvalidated = vi.fn();
      const onReconnect = vi.fn();
      const onError = vi.fn();

      try {
        await expect(
          connectSSE(
            {
              relayUrl: "https://example.com",
              sessionToken: "expired-token",
              reconnectDelayMs: 1,
              maxReconnectDelayMs: 1,
              maxRetries: 5,
            },
            {
              onMessage: vi.fn(),
              onSessionInvalidated,
              onReconnect,
              onError,
            },
            controller.signal
          )
        ).rejects.toThrow("SSE session invalidated: HTTP 401");

        expect(onSessionInvalidated).toHaveBeenCalledWith(401);
        expect(onReconnect).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("should call onSessionInvalidated and throw on 410 without reconnecting", async () => {
      const { connectSSE } = await import("../../../src/relay/sse");

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 410,
        statusText: "Gone",
      });

      const controller = new AbortController();
      const onSessionInvalidated = vi.fn();
      const onReconnect = vi.fn();

      try {
        await expect(
          connectSSE(
            {
              relayUrl: "https://example.com",
              sessionToken: "expired-token",
              reconnectDelayMs: 1,
              maxReconnectDelayMs: 1,
              maxRetries: 5,
            },
            {
              onMessage: vi.fn(),
              onSessionInvalidated,
              onReconnect,
            },
            controller.signal
          )
        ).rejects.toThrow("SSE session invalidated: HTTP 410");

        expect(onSessionInvalidated).toHaveBeenCalledWith(410);
        expect(onReconnect).not.toHaveBeenCalled();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("should still reconnect on non-auth HTTP errors (e.g., 503)", async () => {
      const { connectSSE } = await import("../../../src/relay/sse");

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
      });

      const controller = new AbortController();
      const onSessionInvalidated = vi.fn();
      const onReconnect = vi.fn();

      try {
        await expect(
          connectSSE(
            {
              relayUrl: "https://example.com",
              sessionToken: "valid-token",
              reconnectDelayMs: 1,
              maxReconnectDelayMs: 1,
              maxRetries: 2,
            },
            {
              onMessage: vi.fn(),
              onSessionInvalidated,
              onReconnect,
            },
            controller.signal
          )
        ).rejects.toThrow("Max reconnect attempts (2) exceeded");

        expect(onSessionInvalidated).not.toHaveBeenCalled();
        expect(onReconnect).toHaveBeenCalledTimes(2);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("connectSSE maxRetries", () => {
    it("should throw after maxRetries is exceeded", async () => {
      const { connectSSE } = await import("../../../src/relay/sse");

      // Mock fetch to always fail, triggering reconnect attempts
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Connection failed"));

      const controller = new AbortController();
      const onReconnect = vi.fn();
      const onError = vi.fn();

      try {
        await expect(
          connectSSE(
            {
              relayUrl: "https://example.com",
              sessionToken: "test-token",
              reconnectDelayMs: 1,
              maxReconnectDelayMs: 1,
              maxRetries: 3,
            },
            {
              onMessage: vi.fn(),
              onReconnect,
              onError,
            },
            controller.signal
          )
        ).rejects.toThrow("Max reconnect attempts (3) exceeded");

        expect(onReconnect).toHaveBeenCalledTimes(3);
        expect(onReconnect).toHaveBeenLastCalledWith(3);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("connectSSE onDisconnected", () => {
    it("should call onDisconnected when connection drops before reconnect", async () => {
      const { connectSSE } = await import("../../../src/relay/sse");

      const originalFetch = globalThis.fetch;
      // First call fails → triggers onDisconnected before reconnect; second call also fails → maxRetries hit
      globalThis.fetch = vi.fn().mockRejectedValue(new Error("Connection reset"));

      const controller = new AbortController();
      const onDisconnected = vi.fn();
      const onError = vi.fn();

      try {
        await expect(
          connectSSE(
            {
              relayUrl: "https://example.com",
              sessionToken: "test-token",
              reconnectDelayMs: 1,
              maxReconnectDelayMs: 1,
              maxRetries: 1,
            },
            {
              onMessage: vi.fn(),
              onDisconnected,
              onError,
            },
            controller.signal
          )
        ).rejects.toThrow();

        expect(onDisconnected).toHaveBeenCalledTimes(1);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("should NOT call onDisconnected on 401 session invalidation", async () => {
      const { connectSSE } = await import("../../../src/relay/sse");

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      });

      const controller = new AbortController();
      const onDisconnected = vi.fn();
      const onSessionInvalidated = vi.fn();

      try {
        await expect(
          connectSSE(
            {
              relayUrl: "https://example.com",
              sessionToken: "expired-token",
              reconnectDelayMs: 1,
              maxReconnectDelayMs: 1,
              maxRetries: 3,
            },
            {
              onMessage: vi.fn(),
              onDisconnected,
              onSessionInvalidated,
            },
            controller.signal
          )
        ).rejects.toThrow("SSE session invalidated");

        expect(onDisconnected).not.toHaveBeenCalled();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("should NOT call onDisconnected when aborted", async () => {
      const { connectSSE } = await import("../../../src/relay/sse");

      const originalFetch = globalThis.fetch;
      const controller = new AbortController();
      controller.abort();

      const onDisconnected = vi.fn();

      globalThis.fetch = vi.fn().mockRejectedValue(new Error("aborted"));

      try {
        await connectSSE(
          {
            relayUrl: "https://example.com",
            sessionToken: "test-token",
            reconnectDelayMs: 1,
            maxReconnectDelayMs: 1,
          },
          { onMessage: vi.fn(), onDisconnected },
          controller.signal
        );

        expect(onDisconnected).not.toHaveBeenCalled();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
