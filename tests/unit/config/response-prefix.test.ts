/**
 * responsePrefix 호환성 검증 테스트
 *
 * OpenClaw v2026.2.6+ 에서 도입된 계단식 해석(account → channel → global)과
 * 플러그인의 호환성을 확인한다.
 *
 * 핵심 원칙: 플러그인은 responsePrefix를 스키마에 선언만 하고,
 * 런타임에서 직접 처리하지 않는다. 코어가 normalizeReplyPayload()에서 담당.
 */
import { describe, it, expect } from "vitest";
import {
  KakaoAccountConfigSchema,
  KakaoChannelConfigSchema,
} from "../../../src/config/schema";

describe("responsePrefix 호환성", () => {
  describe("스키마 파싱", () => {
    it("responsePrefix 문자열을 올바르게 파싱한다", () => {
      const result = KakaoAccountConfigSchema.safeParse({
        responsePrefix: "[카카오] ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.responsePrefix).toBe("[카카오] ");
      }
    });

    it("responsePrefix 생략 시 undefined", () => {
      const result = KakaoAccountConfigSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.responsePrefix).toBeUndefined();
      }
    });

    it("빈 문자열 prefix도 허용한다", () => {
      const result = KakaoAccountConfigSchema.safeParse({
        responsePrefix: "",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.responsePrefix).toBe("");
      }
    });

    it("숫자 타입 prefix는 거부한다", () => {
      const result = KakaoAccountConfigSchema.safeParse({
        responsePrefix: 42,
      });
      expect(result.success).toBe(false);
    });

    it("배열 타입 prefix는 거부한다", () => {
      const result = KakaoAccountConfigSchema.safeParse({
        responsePrefix: ["a", "b"],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("계정별 독립 설정", () => {
    it("계정마다 다른 responsePrefix를 설정할 수 있다", () => {
      const config = {
        accounts: {
          default: { responsePrefix: "[기본] " },
          vip: { responsePrefix: "[VIP] " },
          plain: {},
        },
      };

      const result = KakaoChannelConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accounts?.default?.responsePrefix).toBe("[기본] ");
        expect(result.data.accounts?.vip?.responsePrefix).toBe("[VIP] ");
        expect(result.data.accounts?.plain?.responsePrefix).toBeUndefined();
      }
    });
  });

  describe("플러그인 런타임 비개입 확인", () => {
    it("outboundAdapter에 responsePrefix 처리 로직이 없다", async () => {
      const { outboundAdapter } = await import(
        "../../../src/adapters/outbound"
      );

      // outbound adapter는 prefix 관련 필드/메서드가 없어야 한다
      expect(outboundAdapter).not.toHaveProperty("responsePrefix");
      expect(outboundAdapter).not.toHaveProperty("applyPrefix");
    });

    it("gateway의 deliver 함수는 text를 가공 없이 전달한다", async () => {
      const { tryParseKakaoCard } = await import(
        "../../../src/adapters/gateway"
      );

      // tryParseKakaoCard는 prefix가 붙은 텍스트도 그대로 처리한다
      // (prefix 제거 로직이 없어야 함)
      const prefixedText = "[카카오] 안녕하세요";
      const result = tryParseKakaoCard(prefixedText);
      // prefix가 붙은 일반 텍스트는 카드가 아니므로 null
      expect(result).toBeNull();
    });

    it("prefix가 붙은 JSON 카드는 카드로 파싱되지 않는다 (코어가 처리)", async () => {
      // 코어가 prefix를 텍스트 앞에 붙이므로, JSON 앞에 prefix가 붙으면
      // tryParseKakaoCard()가 카드로 인식하지 않는다 (정상 동작)
      const { tryParseKakaoCard } = await import(
        "../../../src/adapters/gateway"
      );
      const prefixedJson = '[카카오] {"textCard":{"title":"테스트"}}';
      expect(tryParseKakaoCard(prefixedJson)).toBeNull();
    });
  });
});
