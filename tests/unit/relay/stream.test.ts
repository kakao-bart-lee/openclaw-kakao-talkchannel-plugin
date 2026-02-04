import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ResolvedKakaoTalkChannel } from "../../../src/types";
import { sanitizeTokenFromLog } from "../../../src/relay/stream";

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

// Mock the session module
vi.mock("../../../src/relay/session.js", () => ({
  createSession: vi.fn(),
  DEFAULT_RELAY_URL: "https://k.tess.dev/",
}));

describe("Relay Stream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("startRelayStream", () => {
    it("should export startRelayStream function", async () => {
      const { startRelayStream } = await import("../../../src/relay/stream.js");
      expect(typeof startRelayStream).toBe("function");
    });

    it("should use default relayUrl when not specified", async () => {
      const { startRelayStream } = await import("../../../src/relay/stream.js");
      const { createSession } = await import("../../../src/relay/session.js");

      // Mock createSession to return success
      vi.mocked(createSession).mockResolvedValue({
        ok: true,
        data: {
          sessionToken: "test_session_token",
          pairingCode: "ABCD-1234",
          expiresIn: 300,
          status: "pending_pairing",
        },
      });

      const mockAccount: ResolvedKakaoTalkChannel = {
        talkchannelId: "test",
        enabled: true,
        config: {
          enabled: true,
          dmPolicy: "open",
        },
      };

      const controller = new AbortController();
      const mockOnMessage = vi.fn();
      const mockOnPairingRequired = vi.fn();

      // Start the stream (will abort immediately)
      controller.abort();

      try {
        await startRelayStream(
          mockAccount,
          mockOnMessage,
          controller.signal,
          {},
          { onPairingRequired: mockOnPairingRequired }
        );
      } catch {
        // Expected to throw due to abort
      }

      // Verify createSession was called with default URL
      expect(createSession).toHaveBeenCalledWith("https://k.tess.dev/");
    });

    it("should call onPairingRequired callback when creating new session", async () => {
      const { startRelayStream } = await import("../../../src/relay/stream.js");
      const { createSession } = await import("../../../src/relay/session.js");

      vi.mocked(createSession).mockResolvedValue({
        ok: true,
        data: {
          sessionToken: "test_session_token",
          pairingCode: "ABCD-1234",
          expiresIn: 300,
          status: "pending_pairing",
        },
      });

      const mockAccount: ResolvedKakaoTalkChannel = {
        talkchannelId: "test",
        enabled: true,
        config: {
          enabled: true,
          dmPolicy: "open",
        },
      };

      const controller = new AbortController();
      const mockOnMessage = vi.fn();
      const mockOnPairingRequired = vi.fn();

      controller.abort();

      try {
        await startRelayStream(
          mockAccount,
          mockOnMessage,
          controller.signal,
          {},
          { onPairingRequired: mockOnPairingRequired }
        );
      } catch {
        // Expected
      }

      expect(mockOnPairingRequired).toHaveBeenCalledWith("ABCD-1234", 300);
    });

    it("should use sessionToken from config if available", async () => {
      const { startRelayStream } = await import("../../../src/relay/stream.js");
      const { createSession } = await import("../../../src/relay/session.js");

      const mockAccount: ResolvedKakaoTalkChannel = {
        talkchannelId: "test",
        enabled: true,
        config: {
          enabled: true,
          sessionToken: "existing_session_token",
          dmPolicy: "open",
        },
      };

      const controller = new AbortController();
      const mockOnMessage = vi.fn();

      controller.abort();

      try {
        await startRelayStream(mockAccount, mockOnMessage, controller.signal);
      } catch {
        // Expected
      }

      // Should not call createSession when sessionToken exists
      expect(createSession).not.toHaveBeenCalled();
    });

    it("should use relayToken from config if available", async () => {
      const { startRelayStream } = await import("../../../src/relay/stream.js");
      const { createSession } = await import("../../../src/relay/session.js");

      const mockAccount: ResolvedKakaoTalkChannel = {
        talkchannelId: "test",
        enabled: true,
        config: {
          enabled: true,
          relayToken: "config_relay_token",
          dmPolicy: "open",
        },
      };

      const controller = new AbortController();
      const mockOnMessage = vi.fn();

      controller.abort();

      try {
        await startRelayStream(mockAccount, mockOnMessage, controller.signal);
      } catch {
        // Expected
      }

      // Should not call createSession when relayToken exists
      expect(createSession).not.toHaveBeenCalled();
    });

    it("should throw error when session creation fails", async () => {
      const { startRelayStream } = await import("../../../src/relay/stream.js");
      const { createSession } = await import("../../../src/relay/session.js");

      vi.mocked(createSession).mockResolvedValue({
        ok: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Connection refused",
        },
      });

      const mockAccount: ResolvedKakaoTalkChannel = {
        talkchannelId: "test",
        enabled: true,
        config: {
          enabled: true,
          dmPolicy: "open",
        },
      };

      const controller = new AbortController();
      const mockOnMessage = vi.fn();

      await expect(
        startRelayStream(mockAccount, mockOnMessage, controller.signal)
      ).rejects.toThrow("Failed to create session: Connection refused");
    });
  });

  describe("sanitizeTokenFromLog", () => {
    it("should mask Bearer token pattern", () => {
      const msg = "Error: Bearer abc123def456 is invalid";
      expect(sanitizeTokenFromLog(msg)).toBe("Error: Bearer *** is invalid");
    });

    it("should mask token= query parameter", () => {
      const msg = "URL: https://example.com?token=secret123&foo=bar";
      expect(sanitizeTokenFromLog(msg)).toBe("URL: https://example.com?token=***&foo=bar");
    });

    it("should mask sessionToken= pattern", () => {
      const msg = "Config: sessionToken=my-secret-token&other=value";
      expect(sanitizeTokenFromLog(msg)).toBe("Config: sessionToken=***&other=value");
    });

    it("should mask Authorization header pattern", () => {
      const msg = "Header: Authorization: Bearer xyz789";
      expect(sanitizeTokenFromLog(msg)).toBe("Header: Authorization: ***");
    });

    it("should handle messages with no tokens", () => {
      const msg = "Normal log message without tokens";
      expect(sanitizeTokenFromLog(msg)).toBe("Normal log message without tokens");
    });

    it("should mask multiple token patterns in single message", () => {
      const msg = "token=abc123 and Bearer def456";
      const result = sanitizeTokenFromLog(msg);
      expect(result).not.toContain("abc123");
      expect(result).not.toContain("def456");
    });

    it("should be safe to call on already-sanitized messages", () => {
      const msg = "token=secret123 and Bearer abc456";
      const once = sanitizeTokenFromLog(msg);
      const twice = sanitizeTokenFromLog(once);
      // Double-sanitization should not leak anything or produce garbled output
      expect(twice).not.toContain("secret123");
      expect(twice).not.toContain("abc456");
    });
  });

  describe("exports", () => {
    it("should re-export SSE functions", async () => {
      const stream = await import("../../../src/relay/stream.js");

      expect(typeof stream.connectSSE).toBe("function");
      expect(typeof stream.parseSSEChunk).toBe("function");
      expect(typeof stream.calculateReconnectDelay).toBe("function");
    });
  });
});
