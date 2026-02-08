import { describe, it, expect } from "vitest";
import type {
  KakaoSkillPayload,
  KakaoSkillResponse,
  ResolvedKakaoTalkChannel,
  KakaoButton,
  KakaoOsLink,
  InboundMessage,
} from "../../src/types";
import type { KakaoAccountConfig } from "../../src/config/schema";

describe("Kakao Types", () => {
  describe("KakaoSkillPayload", () => {
    it("should accept valid payload structure", () => {
      const payload: KakaoSkillPayload = {
        intent: { id: "i1", name: "test" },
        userRequest: {
          timezone: "Asia/Seoul",
          utterance: "안녕",
          lang: "ko",
          user: {
            id: "user123",
            type: "botUserKey",
            properties: {},
          },
        },
        bot: { id: "b1", name: "bot" },
        action: {
          id: "a1",
          name: "action",
          params: {},
          detailParams: {},
          clientExtra: {},
        },
      };
      expect(payload.userRequest.utterance).toBe("안녕");
    });

    it("should support optional callbackUrl", () => {
      const payload: KakaoSkillPayload = {
        intent: { id: "i1", name: "test" },
        userRequest: {
          timezone: "Asia/Seoul",
          utterance: "test",
          lang: "ko",
          user: { id: "u1", type: "botUserKey", properties: {} },
          callbackUrl: "https://bot-api.kakao.com/callback/xxx",
        },
        bot: { id: "b1", name: "bot" },
        action: { id: "a1", name: "action", params: {}, detailParams: {}, clientExtra: {} },
      };
      expect(payload.userRequest.callbackUrl).toBeDefined();
    });
  });

  describe("KakaoSkillResponse", () => {
    it("should require version 2.0", () => {
      const response: KakaoSkillResponse = {
        version: "2.0",
      };
      expect(response.version).toBe("2.0");
    });

    it("should support useCallback flag", () => {
      const response: KakaoSkillResponse = {
        version: "2.0",
        useCallback: true,
      };
      expect(response.useCallback).toBe(true);
    });

    it("should support template with outputs", () => {
      const response: KakaoSkillResponse = {
        version: "2.0",
        template: {
          outputs: [{ simpleText: { text: "Hello" } }],
        },
      };
      expect(response.template?.outputs).toHaveLength(1);
    });
  });

  describe("KakaoAccountConfig (Zod-inferred)", () => {
    it("should have required fields with defaults applied", () => {
      const config: KakaoAccountConfig = {
        enabled: true,
        dmPolicy: "pairing",
        relayUrl: "https://k.tess.dev/",
        reconnectDelayMs: 1000,
        maxReconnectDelayMs: 30000,
        textChunkLimit: 400,
        chunkMode: "sentence",
      };
      expect(config.enabled).toBe(true);
    });

    it("should support optional fields", () => {
      const config: KakaoAccountConfig = {
        enabled: true,
        channelId: "channel123",
        dmPolicy: "pairing",
        relayUrl: "https://relay.example.com",
        relayToken: "token123",
        responsePrefix: "[카카오] ",
        reconnectDelayMs: 1000,
        maxReconnectDelayMs: 30000,
        textChunkLimit: 400,
        chunkMode: "sentence",
      };
      expect(config.relayUrl).toBeDefined();
      expect(config.responsePrefix).toBe("[카카오] ");
    });
  });

  describe("ResolvedKakaoTalkChannel", () => {
    it("should contain talkchannelId and config", () => {
      const resolved: ResolvedKakaoTalkChannel = {
        talkchannelId: "default",
        config: {
          enabled: true,
          dmPolicy: "pairing",
          relayUrl: "https://k.tess.dev/",
          reconnectDelayMs: 1000,
          maxReconnectDelayMs: 30000,
          textChunkLimit: 400,
          chunkMode: "sentence",
        },
        enabled: true,
        name: "Test Account",
      };
      expect(resolved.talkchannelId).toBe("default");
    });
  });

  describe("KakaoButton", () => {
    it("should support all button actions", () => {
      const actions: KakaoButton["action"][] = [
        "webLink", "message", "block", "share", "phone", "operator", "osLink"
      ];
      actions.forEach(action => {
        const button: KakaoButton = { label: "Test", action };
        expect(button.action).toBe(action);
      });
    });

    it("should support osLink with platform-specific URLs", () => {
      const osLink: KakaoOsLink = {
        ios: "kakaomap://route?sp=37.5,127.0",
        android: "intent://route?sp=37.5,127.0#Intent;scheme=kakaomap;end",
      };
      const button: KakaoButton = {
        label: "지도에서 보기",
        action: "osLink",
        osLink,
      };
      expect(button.osLink?.ios).toContain("kakaomap");
      expect(button.osLink?.android).toContain("intent");
    });
  });

  describe("InboundMessage", () => {
    it("should match relay server spec", () => {
      const msg: InboundMessage = {
        id: "msg_123",
        conversationKey: "conv_123",
        kakaoPayload: {} as KakaoSkillPayload,
        normalized: {
          userId: "user1",
          text: "Hello",
          channelId: "ch1",
        },
        createdAt: new Date().toISOString(),
      };
      expect(msg.normalized.userId).toBe("user1");
    });
  });
});
