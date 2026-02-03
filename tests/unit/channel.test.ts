/**
 * Unit tests for Kakao Channel Plugin
 * 
 * Tests the main channel plugin export and its configuration.
 */

import { describe, it, expect } from "vitest";
import { kakaoPlugin } from "../../src/channel.js";

describe("kakaoPlugin", () => {
  it("has correct plugin id", () => {
    expect(kakaoPlugin.id).toBe("kakao-talkchannel");
  });

  it("has correct meta configuration", () => {
    expect(kakaoPlugin.meta).toMatchObject({
      id: "kakao-talkchannel",
      label: "Kakao TalkChannel",
      selectionLabel: "카카오톡 채널",
      docsPath: "/channels/kakao-talkchannel",
      blurb: "KakaoTalk 채널 챗봇을 OpenClaw에 연결합니다",
      aliases: ["kakaotalk", "kakao-channel"],
    });
  });

  it("has correct capabilities", () => {
    expect(kakaoPlugin.capabilities).toEqual({
      chatTypes: ["direct"],
      media: true,
      threads: false,
      reactions: false,
      nativeCommands: false,
      blockStreaming: true,
    });
  });

  it("has correct reload configuration", () => {
    expect(kakaoPlugin.reload).toEqual({
      configPrefixes: ["channels.kakao-talkchannel"],
    });
  });

  it("has all required adapters", () => {
    expect(kakaoPlugin.config).toBeDefined();
    expect(kakaoPlugin.outbound).toBeDefined();
    expect(kakaoPlugin.status).toBeDefined();
    expect(kakaoPlugin.security).toBeDefined();
    expect(kakaoPlugin.pairing).toBeDefined();
  });

  it("has configSchema defined", () => {
    expect(kakaoPlugin.configSchema).toBeDefined();
  });

  it("exports valid ChannelPlugin structure", () => {
    // Verify all required fields exist
    expect(kakaoPlugin).toHaveProperty("id");
    expect(kakaoPlugin).toHaveProperty("meta");
    expect(kakaoPlugin).toHaveProperty("capabilities");
    expect(kakaoPlugin).toHaveProperty("reload");
    expect(kakaoPlugin).toHaveProperty("configSchema");
    expect(kakaoPlugin).toHaveProperty("config");
    expect(kakaoPlugin).toHaveProperty("outbound");
    expect(kakaoPlugin).toHaveProperty("status");
    expect(kakaoPlugin).toHaveProperty("security");
    expect(kakaoPlugin).toHaveProperty("pairing");
  });
});
