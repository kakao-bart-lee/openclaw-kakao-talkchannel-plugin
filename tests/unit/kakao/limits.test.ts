import { describe, it, expect } from "vitest";
import {
  KAKAO_LIMITS,
  validateSimpleText,
  validateCardTitle,
  validateCardDescription,
  validateButton,
  validateQuickReply,
  validateQuickReplies,
  validateOutputCount,
  validateCarouselItemCount,
  validateListItemCount,
} from "../../../src/kakao/limits.js";

describe("KAKAO_LIMITS constants", () => {
  it("should have correct text limits", () => {
    expect(KAKAO_LIMITS.SIMPLE_TEXT_MAX).toBe(1000);
    expect(KAKAO_LIMITS.SIMPLE_TEXT_VISIBLE).toBe(400);
  });

  it("should have correct card limits", () => {
    expect(KAKAO_LIMITS.CARD_TITLE).toBe(50);
    expect(KAKAO_LIMITS.CARD_DESCRIPTION).toBe(230);
  });

  it("should have correct button/reply limits", () => {
    expect(KAKAO_LIMITS.BUTTON_LABEL).toBe(14);
    expect(KAKAO_LIMITS.QUICK_REPLY_LABEL).toBe(14);
    expect(KAKAO_LIMITS.QUICK_REPLIES_MAX).toBe(10);
  });

  it("should have correct output/item limits", () => {
    expect(KAKAO_LIMITS.OUTPUTS_MAX).toBe(3);
    expect(KAKAO_LIMITS.CAROUSEL_MIN).toBe(2);
    expect(KAKAO_LIMITS.CAROUSEL_MAX).toBe(10);
    expect(KAKAO_LIMITS.LIST_ITEMS_MIN).toBe(2);
    expect(KAKAO_LIMITS.LIST_ITEMS_MAX).toBe(5);
  });
});

describe("validateSimpleText", () => {
  it("should accept text within limit", () => {
    expect(validateSimpleText("Hello")).toEqual({ valid: true });
    expect(validateSimpleText("a".repeat(1000))).toEqual({ valid: true });
  });

  it("should reject text exceeding limit", () => {
    const result = validateSimpleText("a".repeat(1001));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("1000");
      expect(result.error).toContain("1001");
    }
  });
});

describe("validateCardTitle", () => {
  it("should accept title within limit", () => {
    expect(validateCardTitle("Short title")).toEqual({ valid: true });
    expect(validateCardTitle("a".repeat(50))).toEqual({ valid: true });
  });

  it("should reject title exceeding limit", () => {
    const result = validateCardTitle("a".repeat(51));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("50");
    }
  });
});

describe("validateCardDescription", () => {
  it("should accept description within limit", () => {
    expect(validateCardDescription("Short desc")).toEqual({ valid: true });
    expect(validateCardDescription("a".repeat(230))).toEqual({ valid: true });
  });

  it("should reject description exceeding limit", () => {
    const result = validateCardDescription("a".repeat(231));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("230");
    }
  });
});

describe("validateButton", () => {
  it("should accept button with valid label", () => {
    expect(validateButton({ label: "Click me", action: "message" })).toEqual({ valid: true });
    expect(validateButton({ label: "a".repeat(14), action: "webLink" })).toEqual({ valid: true });
  });

  it("should reject button with label exceeding limit", () => {
    const result = validateButton({ label: "a".repeat(15), action: "message" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("14");
    }
  });
});

describe("validateQuickReply", () => {
  it("should accept quick reply with valid label", () => {
    expect(validateQuickReply({ label: "Yes", action: "message" })).toEqual({ valid: true });
  });

  it("should reject quick reply with label exceeding limit", () => {
    const result = validateQuickReply({ label: "a".repeat(15), action: "message" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("14");
    }
  });
});

describe("validateQuickReplies", () => {
  it("should accept array within limit", () => {
    const replies = Array(10).fill(null).map((_, i) => ({ label: `Option ${i}`, action: "message" as const }));
    expect(validateQuickReplies(replies)).toEqual({ valid: true });
  });

  it("should reject array exceeding max count", () => {
    const replies = Array(11).fill(null).map((_, i) => ({ label: `O${i}`, action: "message" as const }));
    const result = validateQuickReplies(replies);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("10");
    }
  });

  it("should reject if any reply has invalid label", () => {
    const replies = [
      { label: "Valid", action: "message" as const },
      { label: "a".repeat(15), action: "message" as const },
    ];
    const result = validateQuickReplies(replies);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("Quick reply 1");
    }
  });
});

describe("validateOutputCount", () => {
  it("should accept count within limit", () => {
    expect(validateOutputCount(1)).toEqual({ valid: true });
    expect(validateOutputCount(3)).toEqual({ valid: true });
  });

  it("should reject count exceeding limit", () => {
    const result = validateOutputCount(4);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("3");
    }
  });
});

describe("validateCarouselItemCount", () => {
  it("should accept count within range", () => {
    expect(validateCarouselItemCount(2)).toEqual({ valid: true });
    expect(validateCarouselItemCount(10)).toEqual({ valid: true });
  });

  it("should reject count below minimum", () => {
    const result = validateCarouselItemCount(1);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("at least 2");
    }
  });

  it("should reject count above maximum", () => {
    const result = validateCarouselItemCount(11);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("max of 10");
    }
  });
});

describe("validateListItemCount", () => {
  it("should accept count within range", () => {
    expect(validateListItemCount(2)).toEqual({ valid: true });
    expect(validateListItemCount(5)).toEqual({ valid: true });
  });

  it("should reject count below minimum", () => {
    const result = validateListItemCount(1);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("at least 2");
    }
  });

  it("should reject count above maximum", () => {
    const result = validateListItemCount(6);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain("max of 5");
    }
  });
});
