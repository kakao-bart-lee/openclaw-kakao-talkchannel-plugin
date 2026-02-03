import type { KakaoButton, KakaoQuickReply } from "../types.js";

export const KAKAO_LIMITS = {
  SIMPLE_TEXT_MAX: 1000,
  SIMPLE_TEXT_VISIBLE: 400,

  CARD_TITLE: 50,
  CARD_DESCRIPTION: 230,

  BUTTON_LABEL: 14,
  QUICK_REPLY_LABEL: 14,
  QUICK_REPLIES_MAX: 10,

  OUTPUTS_MAX: 3,
  CAROUSEL_MIN: 2,
  CAROUSEL_MAX: 10,
  LIST_ITEMS_MIN: 2,
  LIST_ITEMS_MAX: 5,
} as const;

export type ValidationResult = { valid: true } | { valid: false; error: string };

export function validateSimpleText(text: string): ValidationResult {
  if (text.length > KAKAO_LIMITS.SIMPLE_TEXT_MAX) {
    return {
      valid: false,
      error: `Text exceeds ${KAKAO_LIMITS.SIMPLE_TEXT_MAX} characters (got ${text.length})`,
    };
  }
  return { valid: true };
}

export function validateCardTitle(title: string): ValidationResult {
  if (title.length > KAKAO_LIMITS.CARD_TITLE) {
    return {
      valid: false,
      error: `Card title exceeds ${KAKAO_LIMITS.CARD_TITLE} characters (got ${title.length})`,
    };
  }
  return { valid: true };
}

export function validateCardDescription(description: string): ValidationResult {
  if (description.length > KAKAO_LIMITS.CARD_DESCRIPTION) {
    return {
      valid: false,
      error: `Card description exceeds ${KAKAO_LIMITS.CARD_DESCRIPTION} characters (got ${description.length})`,
    };
  }
  return { valid: true };
}

export function validateButton(button: KakaoButton): ValidationResult {
  if (button.label.length > KAKAO_LIMITS.BUTTON_LABEL) {
    return {
      valid: false,
      error: `Button label exceeds ${KAKAO_LIMITS.BUTTON_LABEL} characters (got ${button.label.length})`,
    };
  }
  return { valid: true };
}

export function validateQuickReply(reply: KakaoQuickReply): ValidationResult {
  if (reply.label.length > KAKAO_LIMITS.QUICK_REPLY_LABEL) {
    return {
      valid: false,
      error: `Quick reply label exceeds ${KAKAO_LIMITS.QUICK_REPLY_LABEL} characters (got ${reply.label.length})`,
    };
  }
  return { valid: true };
}

export function validateQuickReplies(replies: KakaoQuickReply[]): ValidationResult {
  if (replies.length > KAKAO_LIMITS.QUICK_REPLIES_MAX) {
    return {
      valid: false,
      error: `Quick replies exceed max of ${KAKAO_LIMITS.QUICK_REPLIES_MAX} (got ${replies.length})`,
    };
  }
  for (let i = 0; i < replies.length; i++) {
    const result = validateQuickReply(replies[i]);
    if (!result.valid) {
      return { valid: false, error: `Quick reply ${i}: ${result.error}` };
    }
  }
  return { valid: true };
}

export function validateOutputCount(count: number): ValidationResult {
  if (count > KAKAO_LIMITS.OUTPUTS_MAX) {
    return {
      valid: false,
      error: `Outputs exceed max of ${KAKAO_LIMITS.OUTPUTS_MAX} (got ${count})`,
    };
  }
  return { valid: true };
}

export function validateCarouselItemCount(count: number): ValidationResult {
  if (count < KAKAO_LIMITS.CAROUSEL_MIN) {
    return {
      valid: false,
      error: `Carousel requires at least ${KAKAO_LIMITS.CAROUSEL_MIN} items (got ${count})`,
    };
  }
  if (count > KAKAO_LIMITS.CAROUSEL_MAX) {
    return {
      valid: false,
      error: `Carousel exceeds max of ${KAKAO_LIMITS.CAROUSEL_MAX} items (got ${count})`,
    };
  }
  return { valid: true };
}

export function validateListItemCount(count: number): ValidationResult {
  if (count < KAKAO_LIMITS.LIST_ITEMS_MIN) {
    return {
      valid: false,
      error: `List requires at least ${KAKAO_LIMITS.LIST_ITEMS_MIN} items (got ${count})`,
    };
  }
  if (count > KAKAO_LIMITS.LIST_ITEMS_MAX) {
    return {
      valid: false,
      error: `List exceeds max of ${KAKAO_LIMITS.LIST_ITEMS_MAX} items (got ${count})`,
    };
  }
  return { valid: true };
}
