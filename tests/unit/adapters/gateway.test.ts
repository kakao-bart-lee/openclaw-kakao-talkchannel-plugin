/**
 * Gateway Adapter tests (Simplified)
 *
 * Relay mode only.
 * Uses OpenClaw standard naming: account, startAccount, stopAccount
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ResolvedKakaoTalkChannel } from "../../../src/types";
import {
  userActivity,
  cleanupExpiredUserActivity,
  shouldShowSessionWarning,
  tryParseKakaoCard,
  resetCleanupCounter,
  getPendingPairingInfo,
  MAX_USER_ACTIVITY_SIZE,
  USER_ACTIVITY_TTL_MS,
} from "../../../src/adapters/gateway";

vi.mock("../../../src/runtime.js", () => ({
  getKakaoRuntime: () => ({
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  }),
}));

vi.mock("../../../src/relay/stream.js", () => ({
  startRelayStream: vi.fn().mockResolvedValue(undefined),
}));

const { gatewayAdapter } = await import("../../../src/adapters/gateway");

describe("Gateway Adapter (Simplified)", () => {
  let mockAccount: ResolvedKakaoTalkChannel;
  let mockAbortSignal: AbortSignal;
  let mockOnMessage: ReturnType<typeof vi.fn>;
  let mockLog: { info: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockAccount = {
      talkchannelId: "default",
      enabled: true,
      config: {
        enabled: true,
        channelId: "channel123",
        dmPolicy: "pairing",
        relayUrl: "https://relay.example.com",
      },
    };

    mockAbortSignal = new AbortController().signal;
    mockOnMessage = vi.fn(async () => {}) as any;
    mockLog = {
      info: vi.fn() as any,
      error: vi.fn() as any,
    };

    // Clear state between tests
    userActivity.clear();
    resetCleanupCounter();
  });

  describe("startAccount", () => {
    it("should always start SSE stream (relay mode only)", async () => {
      const ctx = {
        account: mockAccount,
        cfg: {},
        abortSignal: mockAbortSignal,
        onMessage: mockOnMessage,
        log: mockLog,
      };

      await expect(gatewayAdapter.startAccount(ctx as any)).resolves.toBeUndefined();
    });

    it("should log info message when starting", async () => {
      const ctx = {
        account: mockAccount,
        cfg: {},
        abortSignal: mockAbortSignal,
        onMessage: mockOnMessage,
        log: mockLog,
      };

      await gatewayAdapter.startAccount(ctx as any);

      expect(mockLog.info).toHaveBeenCalled();
      const logMessage = mockLog.info.mock.calls[0]?.[0] ?? "";
      expect(logMessage.toLowerCase()).toContain("sse");
    });

    it("should handle abort signal", async () => {
      const controller = new AbortController();
      const ctx = {
        account: mockAccount,
        cfg: {},
        abortSignal: controller.signal,
        onMessage: mockOnMessage,
        log: mockLog,
      };

      const startPromise = gatewayAdapter.startAccount(ctx as any);
      controller.abort();

      await expect(startPromise).resolves.toBeUndefined();
    });

    it("should accept optional log parameter", async () => {
      const ctx = {
        account: mockAccount,
        cfg: {},
        abortSignal: mockAbortSignal,
        onMessage: mockOnMessage,
        // log is optional
      };

      await expect(gatewayAdapter.startAccount(ctx as any)).resolves.toBeUndefined();
    });

    it("should call onMessage callback when message received", async () => {
      const ctx = {
        account: mockAccount,
        cfg: {},
        abortSignal: mockAbortSignal,
        onMessage: mockOnMessage,
        log: mockLog,
      };

      await gatewayAdapter.startAccount(ctx as any);
      expect(typeof ctx.onMessage).toBe("function");
    });
  });

  describe("stopAccount", () => {
    it("should stop account", async () => {
      const ctx = {
        accountId: "default",
      };

      await expect(gatewayAdapter.stopAccount(ctx)).resolves.toBeUndefined();
    });

    it("should handle multiple stop calls", async () => {
      const ctx = {
        accountId: "default",
      };

      await gatewayAdapter.stopAccount(ctx);
      await gatewayAdapter.stopAccount(ctx);

      expect(true).toBe(true);
    });
  });

  describe("userActivity TTL management", () => {
    it("should clean up expired entries", () => {
      // Add entry with old timestamp
      userActivity.set("old-user", {
        messageCount: 10,
        lastWarningCount: 0,
        lastAccessedAt: Date.now() - USER_ACTIVITY_TTL_MS - 1000,
      });

      // Add fresh entry
      userActivity.set("fresh-user", {
        messageCount: 5,
        lastWarningCount: 0,
        lastAccessedAt: Date.now(),
      });

      const removed = cleanupExpiredUserActivity();

      expect(removed).toBe(1);
      expect(userActivity.has("old-user")).toBe(false);
      expect(userActivity.has("fresh-user")).toBe(true);
    });

    it("should respect MAX_USER_ACTIVITY_SIZE constant", () => {
      expect(MAX_USER_ACTIVITY_SIZE).toBe(10000);
    });

    it("should respect USER_ACTIVITY_TTL_MS constant (24 hours)", () => {
      expect(USER_ACTIVITY_TTL_MS).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("shouldShowSessionWarning", () => {
    it("should not warn before 50 messages", () => {
      for (let i = 1; i < 50; i++) {
        expect(shouldShowSessionWarning("user1")).toBe(false);
      }
    });

    it("should warn at exactly 50 messages", () => {
      for (let i = 1; i < 50; i++) {
        shouldShowSessionWarning("user2");
      }
      expect(shouldShowSessionWarning("user2")).toBe(true); // 50th
    });

    it("should not warn at 51 messages", () => {
      for (let i = 1; i <= 50; i++) {
        shouldShowSessionWarning("user3");
      }
      expect(shouldShowSessionWarning("user3")).toBe(false); // 51st
    });

    it("should warn again at 100 messages", () => {
      for (let i = 1; i < 100; i++) {
        shouldShowSessionWarning("user4");
      }
      expect(shouldShowSessionWarning("user4")).toBe(true); // 100th
    });

    it("should update lastAccessedAt timestamp", () => {
      const before = Date.now();
      shouldShowSessionWarning("user5");
      const after = Date.now();

      const activity = userActivity.get("user5")!;
      expect(activity.lastAccessedAt).toBeGreaterThanOrEqual(before);
      expect(activity.lastAccessedAt).toBeLessThanOrEqual(after);
    });
  });

  describe("tryParseKakaoCard", () => {
    it("should parse valid textCard", () => {
      const json = '{"textCard":{"title":"Test","description":"Desc"}}';
      const result = tryParseKakaoCard(json);
      expect(result).not.toBeNull();
      expect(result!.textCard).toBeDefined();
      expect(result!.textCard!.title).toBe("Test");
    });

    it("should parse valid basicCard", () => {
      const json = '{"basicCard":{"title":"Test","thumbnail":{"imageUrl":"https://example.com/img.jpg"}}}';
      const result = tryParseKakaoCard(json);
      expect(result).not.toBeNull();
      expect(result!.basicCard).toBeDefined();
    });

    it("should reject card key with non-object value", () => {
      const json = '{"textCard":"not an object"}';
      const result = tryParseKakaoCard(json);
      expect(result).toBeNull();
    });

    it("should reject card key with array value", () => {
      const json = '{"textCard":[1,2,3]}';
      const result = tryParseKakaoCard(json);
      expect(result).toBeNull();
    });

    it("should reject card key with null value", () => {
      const json = '{"textCard":null}';
      const result = tryParseKakaoCard(json);
      expect(result).toBeNull();
    });

    it("should accept outputs as array", () => {
      const json = '{"outputs":[{"simpleText":{"text":"hello"}}]}';
      const result = tryParseKakaoCard(json);
      expect(result).not.toBeNull();
      expect(result!.outputs).toHaveLength(1);
    });

    it("should reject outputs as non-array", () => {
      const json = '{"outputs":"not an array"}';
      const result = tryParseKakaoCard(json);
      expect(result).toBeNull();
    });

    it("should accept quickReplies as array", () => {
      const json = '{"quickReplies":[{"label":"test","action":"message","messageText":"hi"}]}';
      const result = tryParseKakaoCard(json);
      expect(result).not.toBeNull();
    });

    it("should reject quickReplies as non-array", () => {
      const json = '{"quickReplies":"not an array"}';
      const result = tryParseKakaoCard(json);
      expect(result).toBeNull();
    });

    it("should return null for non-JSON text", () => {
      expect(tryParseKakaoCard("hello world")).toBeNull();
    });

    it("should return null for JSON without card keys", () => {
      expect(tryParseKakaoCard('{"name":"test"}')).toBeNull();
    });

    it("should return null for non-object JSON", () => {
      expect(tryParseKakaoCard('[1,2,3]')).toBeNull();
    });

    it("should return null for invalid JSON starting with {", () => {
      expect(tryParseKakaoCard('{invalid json}')).toBeNull();
    });
  });

  describe("getPendingPairingInfo", () => {
    it("should return null when no pairing info exists", () => {
      expect(getPendingPairingInfo("account1")).toBeNull();
    });

    it("should return null for unknown accountId", () => {
      // Even after another account has pairing info, unknown account returns null
      expect(getPendingPairingInfo("nonexistent")).toBeNull();
    });

    it("should return and clear pairing info by accountId", async () => {
      // Trigger pairing via startAccount (startRelayStream is mocked)
      const { startRelayStream } = await import("../../../src/relay/stream.js");
      const mockStartRelayStream = vi.mocked(startRelayStream);

      // Capture the callbacks passed to startRelayStream
      mockStartRelayStream.mockImplementation(
        async (_account, _onMessage, _signal, _opts, callbacks) => {
          callbacks?.onPairingRequired?.("CODE-1234", 300);
        }
      );

      const ctx = {
        account: mockAccount,
        accountId: "test-account",
        cfg: {},
        abortSignal: new AbortController().signal,
        log: mockLog,
      };

      await gatewayAdapter.startAccount(ctx as any);

      // Should return pairing info for the correct accountId
      const info = getPendingPairingInfo("test-account");
      expect(info).toEqual({ pairingCode: "CODE-1234", expiresIn: 300 });

      // Should be cleared after reading
      expect(getPendingPairingInfo("test-account")).toBeNull();
    });

    it("should isolate pairing info between accounts", async () => {
      const { startRelayStream } = await import("../../../src/relay/stream.js");
      const mockStartRelayStream = vi.mocked(startRelayStream);

      // First account
      mockStartRelayStream.mockImplementationOnce(
        async (_account, _onMessage, _signal, _opts, callbacks) => {
          callbacks?.onPairingRequired?.("CODE-AAAA", 300);
        }
      );

      await gatewayAdapter.startAccount({
        account: mockAccount,
        accountId: "account-a",
        cfg: {},
        abortSignal: new AbortController().signal,
        log: mockLog,
      } as any);

      // Second account
      mockStartRelayStream.mockImplementationOnce(
        async (_account, _onMessage, _signal, _opts, callbacks) => {
          callbacks?.onPairingRequired?.("CODE-BBBB", 600);
        }
      );

      await gatewayAdapter.startAccount({
        account: mockAccount,
        accountId: "account-b",
        cfg: {},
        abortSignal: new AbortController().signal,
        log: mockLog,
      } as any);

      // Each account should get its own pairing info
      expect(getPendingPairingInfo("account-a")).toEqual({ pairingCode: "CODE-AAAA", expiresIn: 300 });
      expect(getPendingPairingInfo("account-b")).toEqual({ pairingCode: "CODE-BBBB", expiresIn: 600 });
    });

    it("should fallback to first entry when no accountId provided", async () => {
      const { startRelayStream } = await import("../../../src/relay/stream.js");
      const mockStartRelayStream = vi.mocked(startRelayStream);

      mockStartRelayStream.mockImplementationOnce(
        async (_account, _onMessage, _signal, _opts, callbacks) => {
          callbacks?.onPairingRequired?.("CODE-FALLBACK", 120);
        }
      );

      await gatewayAdapter.startAccount({
        account: mockAccount,
        accountId: "some-account",
        cfg: {},
        abortSignal: new AbortController().signal,
        log: mockLog,
      } as any);

      // No accountId → returns first entry
      const info = getPendingPairingInfo();
      expect(info).toEqual({ pairingCode: "CODE-FALLBACK", expiresIn: 120 });
    });
  });
});
