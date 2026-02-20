/**
 * /card command - 카카오 카드 메시지 빌더
 *
 * 지원 타입: text, basic, list, commerce
 *
 * 사용법:
 *   /card text "제목" "설명" [--buttons "버튼1|url,버튼2|msg"] [--quick "옵션1,옵션2"]
 *   /card basic "제목" "설명" --image <url> [--buttons "버튼|url"] [--quick "옵션1,옵션2"]
 *   /card list "헤더" "항목1|설명1,항목2|설명2" [--buttons "버튼|url"] [--quick "옵션1,옵션2"]
 *   /card commerce "상품명" --price 15000 --image <url> [--description "설명"] [--discount 2000] [--buttons "버튼|url"]
 */

import type {
  KakaoButton,
  KakaoQuickReply,
  KakaoSkillResponse,
  InboundMessage,
  ResolvedKakaoTalkChannel,
} from "../types.js";
import { sendReply } from "../relay/client.js";

type Log =
  | {
      info: (msg: string) => void;
      warn: (msg: string) => void;
      error: (msg: string) => void;
    }
  | undefined;

// ============================================================================
// Argument parsing
// ============================================================================

export interface ParsedCardArgs {
  type: string;
  args: string[];
  flags: Record<string, string>;
}

/**
 * /card 커맨드 인수 파싱
 *
 * 입력 형식: `<type> "arg1" "arg2" --flag1 value1 --flag2 "value2"`
 * - 따옴표로 묶인 문자열 → 위치 인수 (args)
 * - `--key value` 또는 `--key "value"` → 플래그 (flags)
 * - 플래그의 따옴표 값은 위치 인수로 중복 수집되지 않음
 */
export function parseCardArgs(input: string): ParsedCardArgs {
  const trimmed = input.trim();

  const typeMatch = trimmed.match(/^(\w+)/);
  if (!typeMatch) {
    return { type: "", args: [], flags: {} };
  }

  const type = typeMatch[1].toLowerCase();
  const rest = trimmed.slice(typeMatch[0].length).trim();

  const args: string[] = [];
  const flags: Record<string, string> = {};

  // --flag "value" 또는 --flag value 를 먼저 매칭하고,
  // 나머지 따옴표 문자열을 위치 인수로 수집
  const regex = /--(\w+)\s+(?:"([^"]*?)"|(\S+))|"([^"]*?)"/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rest)) !== null) {
    if (match[1] !== undefined) {
      // --flag value
      flags[match[1]] = match[2] ?? match[3] ?? "";
    } else if (match[4] !== undefined) {
      // "positional arg"
      args.push(match[4]);
    }
  }

  return { type, args, flags };
}

// ============================================================================
// Button parsing
// ============================================================================

/**
 * 버튼 문자열 파싱
 *
 * 형식: "라벨1|데이터1,라벨2|데이터2"
 * - 데이터가 http(s):// 로 시작 → webLink
 * - 데이터가 전화번호 형식 (7자리 이상 숫자/기호) → phone
 * - 그 외 → message
 * - 최대 3개 (카카오 제한)
 */
export function parseButtons(input: string): KakaoButton[] {
  if (!input.trim()) return [];

  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((item) => {
      const pipeIndex = item.lastIndexOf("|");
      if (pipeIndex === -1) {
        return { label: item, action: "message" as const, messageText: item };
      }

      const label = item.slice(0, pipeIndex).trim();
      const data = item.slice(pipeIndex + 1).trim();

      if (data.startsWith("http://") || data.startsWith("https://")) {
        return { label, action: "webLink" as const, webLinkUrl: data };
      }

      if (/^[\d\-+\s]+$/.test(data) && data.replace(/\D/g, "").length >= 7) {
        return { label, action: "phone" as const, phoneNumber: data };
      }

      return { label, action: "message" as const, messageText: data };
    });
}

// ============================================================================
// QuickReply parsing
// ============================================================================

/**
 * 빠른 응답 버튼 파싱
 *
 * 형식: "라벨1,라벨2,라벨3"
 * - 모두 message action (messageText = label)
 * - 최대 10개 (카카오 제한)
 */
export function parseQuickReplies(input: string): KakaoQuickReply[] {
  if (!input.trim()) return [];

  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((label) => ({
      label,
      action: "message" as const,
      messageText: label,
    }));
}

// ============================================================================
// Usage error helper
// ============================================================================

function buildUsageError(type: string, usage: string): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          textCard: {
            title: `/card ${type} 사용법`,
            description: usage,
          },
        },
      ],
    },
  };
}

// ============================================================================
// Card builders
// ============================================================================

export function buildTextCard(args: string[], flags: Record<string, string>): KakaoSkillResponse {
  const title = args[0];
  const description = args[1];

  if (!title && !description) {
    return buildUsageError(
      "text",
      '/card text "제목" "설명" [--buttons "버튼1|url,버튼2|msg"] [--quick "옵션1,옵션2"]',
    );
  }

  const buttons = flags.buttons ? parseButtons(flags.buttons) : undefined;
  const quickReplies = flags.quick ? parseQuickReplies(flags.quick) : undefined;

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          textCard: {
            ...(title && { title }),
            ...(description && { description }),
            ...(buttons?.length && { buttons }),
          },
        },
      ],
      ...(quickReplies?.length && { quickReplies }),
    },
  };
}

export function buildBasicCard(args: string[], flags: Record<string, string>): KakaoSkillResponse {
  const imageUrl = flags.image;

  if (!imageUrl) {
    return buildUsageError(
      "basic",
      '/card basic "제목" "설명" --image <url> [--buttons "버튼|url"] [--quick "옵션1,옵션2"]',
    );
  }

  const title = args[0];
  const description = args[1];
  const buttons = flags.buttons ? parseButtons(flags.buttons) : undefined;
  const quickReplies = flags.quick ? parseQuickReplies(flags.quick) : undefined;

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          basicCard: {
            ...(title && { title }),
            ...(description && { description }),
            thumbnail: { imageUrl },
            ...(buttons?.length && { buttons }),
          },
        },
      ],
      ...(quickReplies?.length && { quickReplies }),
    },
  };
}

export function buildListCard(args: string[], flags: Record<string, string>): KakaoSkillResponse {
  const headerTitle = args[0];
  const itemsStr = args[1];

  if (!headerTitle || !itemsStr) {
    return buildUsageError(
      "list",
      '/card list "헤더" "항목1|설명1,항목2|설명2" [--buttons "버튼|url"] [--quick "옵션1,옵션2"]',
    );
  }

  const items = itemsStr
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5) // KAKAO_LIMITS.LIST_ITEMS_MAX = 5
    .map((item) => {
      const pipeIndex = item.lastIndexOf("|");
      if (pipeIndex === -1) {
        return { title: item };
      }
      const title = item.slice(0, pipeIndex).trim();
      const description = item.slice(pipeIndex + 1).trim() || undefined;
      return { title, ...(description && { description }) };
    });

  if (items.length < 2) {
    return buildUsageError("list", "listCard는 항목이 최소 2개 필요합니다. 예: \"항목1|설명1,항목2|설명2\"");
  }

  const buttons = flags.buttons ? parseButtons(flags.buttons) : undefined;
  const quickReplies = flags.quick ? parseQuickReplies(flags.quick) : undefined;

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          listCard: {
            header: { title: headerTitle },
            items,
            ...(buttons?.length && { buttons }),
          },
        },
      ],
      ...(quickReplies?.length && { quickReplies }),
    },
  };
}

export function buildCommerceCard(
  args: string[],
  flags: Record<string, string>,
): KakaoSkillResponse {
  const title = args[0];
  const priceStr = flags.price;

  if (!title || !priceStr) {
    return buildUsageError(
      "commerce",
      '/card commerce "상품명" --price 15000 [--description "설명"] [--discount 2000] [--image <url>] [--buttons "버튼|url"]',
    );
  }

  const price = parseInt(priceStr, 10);
  if (isNaN(price)) {
    return buildUsageError("commerce", "가격은 숫자여야 합니다. 예: --price 15000");
  }

  const imageUrl = flags.image;
  if (!imageUrl) {
    return buildUsageError(
      "commerce",
      '/card commerce "상품명" --price 15000 --image <url> [--description "설명"] [--discount 2000] [--buttons "버튼|url"]',
    );
  }

  const description = flags.description ?? args[1];

  let discount: number | undefined;
  if (flags.discount !== undefined) {
    discount = parseInt(flags.discount, 10);
    if (isNaN(discount)) {
      return buildUsageError("commerce", "할인 금액은 숫자여야 합니다. 예: --discount 2000");
    }
  }

  const buttons = flags.buttons ? parseButtons(flags.buttons) : undefined;
  const quickReplies = flags.quick ? parseQuickReplies(flags.quick) : undefined;

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          commerceCard: {
            title,
            ...(description && { description }),
            price,
            currency: "won",
            ...(discount !== undefined && { discount }),
            thumbnails: [{ imageUrl }],
            ...(buttons?.length && { buttons }),
          },
        },
      ],
      ...(quickReplies?.length && { quickReplies }),
    },
  };
}

export function buildCardHelpResponse(): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          listCard: {
            header: { title: "카드 커맨드 목록" },
            items: [
              { title: "/card text", description: '"제목" "설명" [--buttons] [--quick]' },
              { title: "/card basic", description: '"제목" "설명" --image <url> [--buttons]' },
              { title: "/card list", description: '"헤더" "항목1|설명,항목2|설명" [--buttons]' },
              {
                title: "/card commerce",
                description: '"상품명" --price 15000 --image <url> [--discount]',
              },
            ],
          },
        },
      ],
    },
  };
}

// ============================================================================
// Main handler
// ============================================================================

export async function handleCardCommand(
  msg: InboundMessage,
  _account: ResolvedKakaoTalkChannel,
  _accountId: string,
  relayUrl: string,
  relayToken: string,
  log?: Log,
): Promise<void> {
  const messageText = msg.normalized.text?.trim() ?? "";
  const argsStr = messageText.slice("/card".length).trim();

  let response: KakaoSkillResponse;

  if (!argsStr) {
    response = buildCardHelpResponse();
  } else {
    const { type, args, flags } = parseCardArgs(argsStr);

    switch (type) {
      case "text":
        response = buildTextCard(args, flags);
        break;
      case "basic":
        response = buildBasicCard(args, flags);
        break;
      case "list":
        response = buildListCard(args, flags);
        break;
      case "commerce":
        response = buildCommerceCard(args, flags);
        break;
      default:
        response = buildCardHelpResponse();
    }
  }

  log?.info(`[kakao-talkchannel] /card: ${messageText.slice(0, 60)}`);
  await sendReply({ relayUrl, relayToken }, msg.id, response);
}
