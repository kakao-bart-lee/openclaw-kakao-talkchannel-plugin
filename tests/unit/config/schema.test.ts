import { describe, it, expect } from "vitest";
import {
  KakaoAccountConfigSchema,
  KakaoChannelConfigSchema,
  validateAccountConfig,
  validateChannelConfig,
} from "../../../src/config/schema";

describe("Config Schema (Simplified)", () => {
  describe("KakaoAccountConfigSchema", () => {
    it("should accept minimal relay mode config", () => {
      const config = {
        enabled: true,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
        expect(result.data.dmPolicy).toBe("pairing");
        expect(result.data.relayUrl).toBe("https://k.tess.dev/");
      }
    });

    it("should accept full relay mode config", () => {
      const config = {
        enabled: true,
        channelId: "channel123",
        dmPolicy: "pairing",
        relayUrl: "https://relay.example.com",
        relayToken: "secret_token",
        reconnectDelayMs: 2000,
        maxReconnectDelayMs: 15000,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.relayUrl).toBe("https://relay.example.com");
        expect(result.data.relayToken).toBe("secret_token");
        expect(result.data.reconnectDelayMs).toBe(2000);
        expect(result.data.maxReconnectDelayMs).toBe(15000);
      }
    });

    it("should apply default values", () => {
      const config = {};

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
        expect(result.data.dmPolicy).toBe("pairing");
        expect(result.data.relayUrl).toBe("https://k.tess.dev/");
        expect(result.data.reconnectDelayMs).toBe(1000);
        expect(result.data.maxReconnectDelayMs).toBe(30000);
      }
    });

    it("should allow channelId to be optional", () => {
      const config = {
        enabled: true,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.channelId).toBeUndefined();
      }
    });

    it("should reject empty channelId", () => {
      const config = {
        channelId: "",
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject invalid dmPolicy", () => {
      const config = {
        dmPolicy: "invalid",
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject reconnectDelayMs below minimum", () => {
      const config = {
        reconnectDelayMs: 100,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject reconnectDelayMs above maximum", () => {
      const config = {
        reconnectDelayMs: 60000,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject maxReconnectDelayMs below minimum", () => {
      const config = {
        maxReconnectDelayMs: 1000,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject maxReconnectDelayMs above maximum", () => {
      const config = {
        maxReconnectDelayMs: 120000,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should accept any string for relayUrl (no URL validation for AJV compatibility)", () => {
      const config = {
        relayUrl: "https://relay.example.com",
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.relayUrl).toBe("https://relay.example.com");
      }
    });

    it("should accept valid allowFrom array", () => {
      const config = {
        allowFrom: ["user1", "user2"],
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.allowFrom).toEqual(["user1", "user2"]);
      }
    });

    it("should apply default textChunkLimit of 400", () => {
      const config = {};

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.textChunkLimit).toBe(400);
      }
    });

    it("should accept custom textChunkLimit within range", () => {
      const config = {
        textChunkLimit: 1000,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.textChunkLimit).toBe(1000);
      }
    });

    it("should reject textChunkLimit below minimum", () => {
      const config = {
        textChunkLimit: 50,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should reject textChunkLimit above maximum", () => {
      const config = {
        textChunkLimit: 2000,
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });

    it("should apply default chunkMode of sentence", () => {
      const config = {};

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chunkMode).toBe("sentence");
      }
    });

    it("should accept valid chunkMode values", () => {
      for (const mode of ["sentence", "newline", "length"]) {
        const result = KakaoAccountConfigSchema.safeParse({ chunkMode: mode });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.chunkMode).toBe(mode);
        }
      }
    });

    it("should reject invalid chunkMode", () => {
      const config = {
        chunkMode: "invalid",
      };

      const result = KakaoAccountConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
    });
  });

  describe("KakaoChannelConfigSchema (wrapper)", () => {
    it("should accept empty config (accounts optional)", () => {
      const config = {};

      const result = KakaoChannelConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("should accept config with accounts", () => {
      const config = {
        accounts: {
          default: {
            enabled: true,
            sessionToken: "test-token",
          },
        },
      };

      const result = KakaoChannelConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accounts?.default?.enabled).toBe(true);
      }
    });
  });

  describe("validateAccountConfig", () => {
    it("should return ok: true for valid config", () => {
      const result = validateAccountConfig({});
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.enabled).toBe(true);
      }
    });

    it("should return ok: true for config with channelId", () => {
      const result = validateAccountConfig({ channelId: "ch1" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.channelId).toBe("ch1");
      }
    });

    it("should return ok: false with errors for invalid config", () => {
      const result = validateAccountConfig({ reconnectDelayMs: 100 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain("reconnectDelayMs");
      }
    });

    it("should format error paths correctly", () => {
      const result = validateAccountConfig({ reconnectDelayMs: 100 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some(e => e.includes("reconnectDelayMs"))).toBe(true);
      }
    });
  });

  describe("validateChannelConfig", () => {
    it("should return ok: true for empty config", () => {
      const result = validateChannelConfig({});
      expect(result.ok).toBe(true);
    });

    it("should return ok: true for config with accounts", () => {
      const result = validateChannelConfig({
        accounts: {
          default: { enabled: true },
        },
      });
      expect(result.ok).toBe(true);
    });
  });
});
