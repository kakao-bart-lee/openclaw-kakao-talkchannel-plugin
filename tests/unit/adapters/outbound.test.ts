/**
 * ChannelOutboundAdapter Tests
 *
 * Tests for Kakao outbound message adapter with text chunking,
 * delivery mode configuration, and message sending.
 */

import { describe, it, expect } from "vitest";
import type {
  ChannelOutboundAdapter,
  OutboundContext,
} from "../../../src/adapters/outbound.js";
import {
  outboundAdapter,
  chunkTextForKakao,
} from "../../../src/adapters/outbound.js";
import type { ResolvedKakaoTalkChannel } from "../../../src/types.js";

// ============================================================================
// Test Fixtures
// ============================================================================

const mockTalkChannel: ResolvedKakaoTalkChannel = {
  talkchannelId: "test-account-123",
  enabled: true,
  name: "Test Account",
  config: {
    enabled: true,
    channelId: "channel_123",
    dmPolicy: "open",
  },
};

const createOutboundContext = (overrides?: Partial<OutboundContext>): OutboundContext => ({
  to: "user_123",
  text: "Hello, this is a test message.",
  talkchannelId: "test-account-123",
  talkchannel: mockTalkChannel,
  ...overrides,
});

// ============================================================================
// Test Suite: Adapter Configuration
// ============================================================================

describe("ChannelOutboundAdapter - Configuration", () => {
  it("should have deliveryMode set to 'direct'", () => {
    expect(outboundAdapter.deliveryMode).toBe("direct");
  });

  it("should have textChunkLimit set to 400", () => {
    expect(outboundAdapter.textChunkLimit).toBe(400);
  });

  it("should have chunkerMode set to 'text'", () => {
    expect(outboundAdapter.chunkerMode).toBe("text");
  });

  it("should have chunkMode set to 'sentence'", () => {
    expect(outboundAdapter.chunkMode).toBe("sentence");
  });

  it("should have chunker function defined", () => {
    expect(typeof outboundAdapter.chunker).toBe("function");
  });

  it("should have sendText function defined", () => {
    expect(typeof outboundAdapter.sendText).toBe("function");
  });
});

// ============================================================================
// Test Suite: Text Chunking
// ============================================================================

describe("chunkTextForKakao", () => {
  it("should return single chunk for text under limit", () => {
    const text = "This is a short message.";
    const chunks = chunkTextForKakao(text, 500);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("should return single chunk for text exactly at limit", () => {
    const text = "a".repeat(500);
    const chunks = chunkTextForKakao(text, 500);

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("should split text at sentence boundary (period)", () => {
    const text = "First sentence. Second sentence. Third sentence.";
    const chunks = chunkTextForKakao(text, 20);

    expect(chunks.length).toBeGreaterThan(1);
    // Verify chunks don't exceed limit
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(20);
    });
  });

  it("should split text at sentence boundary (exclamation)", () => {
    const text = "First sentence! Second sentence! Third sentence!";
    const chunks = chunkTextForKakao(text, 20);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(20);
    });
  });

  it("should split text at sentence boundary (question mark)", () => {
    const text = "First question? Second question? Third question?";
    const chunks = chunkTextForKakao(text, 20);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(20);
    });
  });

  it("should handle text with no sentence boundaries", () => {
    const text = "a".repeat(1000);
    const chunks = chunkTextForKakao(text, 100);

    expect(chunks.length).toBeGreaterThan(1);
    // All chunks except possibly the last should be exactly at limit
    chunks.slice(0, -1).forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(100);
    });
  });

  it("should handle empty string", () => {
    const chunks = chunkTextForKakao("", 500);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("");
  });

  it("should preserve text content across chunks", () => {
    const text = "First. Second. Third. Fourth. Fifth.";
    const chunks = chunkTextForKakao(text, 15);
    const rejoined = chunks.join("").trim();

    // Content should be preserved (allowing for trim differences)
    expect(rejoined.replace(/\s+/g, " ")).toContain("First");
    expect(rejoined.replace(/\s+/g, " ")).toContain("Fifth");
  });

  it("should use default limit of 400 when not specified", () => {
    const text = "a".repeat(600);
    const chunks = chunkTextForKakao(text);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(400);
    });
  });
});

// ============================================================================
// Test Suite: Chunker Integration
// ============================================================================

describe("outboundAdapter.chunker", () => {
  it("should use chunkTextForKakao as chunker", () => {
    expect(outboundAdapter.chunker).toBe(chunkTextForKakao);
  });

  it("should chunk text using adapter's chunker", () => {
    const text = "a".repeat(1000);
    const chunks = outboundAdapter.chunker(text, 500);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(500);
    });
  });

  it("should respect custom limit passed to chunker", () => {
    const text = "a".repeat(500);
    const chunks = outboundAdapter.chunker(text, 100);

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.length).toBeLessThanOrEqual(100);
    });
  });
});

// ============================================================================
// Test Suite: sendText Method
// ============================================================================

describe("outboundAdapter.sendText", () => {
  it("should return OutboundResult with success flag", async () => {
    const ctx = createOutboundContext();
    const result = await outboundAdapter.sendText(ctx);

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("should return channel as 'kakao-talkchannel'", async () => {
    const ctx = createOutboundContext();
    const result = await outboundAdapter.sendText(ctx);

    expect(result.channel).toBe("kakao-talkchannel");
  });

  it("should accept OutboundContext with required fields", async () => {
    const ctx: OutboundContext = {
      to: "user_456",
      text: "Test message",
      talkchannelId: "account_789",
      talkchannel: mockTalkChannel,
    };

    const result = await outboundAdapter.sendText(ctx);
    expect(result).toBeDefined();
  });

  it("should handle long text messages", async () => {
    const longText = "a".repeat(2000);
    const ctx = createOutboundContext({ text: longText });

    const result = await outboundAdapter.sendText(ctx);
    expect(result).toBeDefined();
    expect(result.channel).toBe("kakao-talkchannel");
  });

  it("should handle empty text", async () => {
    const ctx = createOutboundContext({ text: "" });

    const result = await outboundAdapter.sendText(ctx);
    expect(result).toBeDefined();
    expect(result.channel).toBe("kakao-talkchannel");
  });

  it("should handle special characters in text", async () => {
    const specialText = "안녕하세요! 🎉 How are you? 你好";
    const ctx = createOutboundContext({ text: specialText });

    const result = await outboundAdapter.sendText(ctx);
    expect(result).toBeDefined();
    expect(result.channel).toBe("kakao-talkchannel");
  });

  it("should be an async function", () => {
    const result = outboundAdapter.sendText(createOutboundContext());
    expect(result instanceof Promise).toBe(true);
  });
});

// ============================================================================
// Test Suite: Type Safety
// ============================================================================

describe("ChannelOutboundAdapter - Type Safety", () => {
  it("should have correct interface structure", () => {
    const adapter: ChannelOutboundAdapter = outboundAdapter;

    expect(adapter.deliveryMode).toBeDefined();
    expect(adapter.textChunkLimit).toBeDefined();
    expect(adapter.chunkerMode).toBeDefined();
    expect(adapter.chunker).toBeDefined();
    expect(adapter.sendText).toBeDefined();
  });

  it("should return OutboundResult with correct shape", async () => {
    const ctx = createOutboundContext();
    const result = await outboundAdapter.sendText(ctx);

    expect(result).toHaveProperty("channel");
    expect(result).toHaveProperty("success");
    // messageId and error are optional
    expect(typeof result.success).toBe("boolean");
  });
});
