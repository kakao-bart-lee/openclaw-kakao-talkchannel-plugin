/**
 * Kakao SkillResponse Builder
 *
 * Builds v2.0 format responses for Kakao Channel Plugin.
 * Handles text chunking for 500-char visible limit (1000 char total).
 *
 * Reference: docs/relay-server-api-spec.md
 */

import type {
  KakaoSkillResponse,
  KakaoOutput,
  KakaoThumbnail,
  KakaoButton,
  KakaoListItem,
  KakaoItemListItem,
  KakaoBasicCard,
  KakaoTextCard,
  KakaoCommerceCard,
  KakaoListCard,
  KakaoItemCard,
} from "../types.js";

/**
 * Strip markdown formatting from text for Kakao (which doesn't support markdown)
 *
 * Handles:
 * - Headers (# ## ### etc.)
 * - Bold (**text** or __text__)
 * - Italic (*text* or _text_)
 * - Strikethrough (~~text~~)
 * - Code blocks (```code``` and `inline code`)
 * - Links ([text](url)) -> text (url)
 * - Images (![alt](url)) -> [이미지: alt]
 * - Blockquotes (> text)
 * - Horizontal rules (--- or ***)
 * - List markers (* - + and numbered lists)
 *
 * @param text - Text with potential markdown formatting
 * @returns Plain text with markdown stripped
 */
export function stripMarkdown(text: string): string {
  if (!text) return text;

  let result = text;

  // Remove code blocks first (```lang\ncode\n```)
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    const content = match.replace(/```\w*\n?/g, "").replace(/```$/g, "");
    return content.trim();
  });

  // Remove inline code (`code`)
  result = result.replace(/`([^`]+)`/g, "$1");

  // Convert images ![alt](url) -> [이미지: alt]
  result = result.replace(/!\[([^\]]*)\]\([^)]+\)/g, "[이미지: $1]");

  // Convert links [text](url) -> text (url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

  // Remove headers (# ## ### etc.) - keep the text
  result = result.replace(/^#{1,6}\s+/gm, "");

  // Remove bold (**text** or __text__)
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  result = result.replace(/__([^_]+)__/g, "$1");

  // Remove italic (*text* or _text_) - avoid matching list items at line start
  result = result.replace(/(?<!\n|\*)\*([^*\n]+)\*(?!\*)/g, "$1");
  result = result.replace(/(?<!\n|_)_([^_\n]+)_(?!_)/g, "$1");

  // Remove strikethrough (~~text~~)
  result = result.replace(/~~([^~]+)~~/g, "$1");

  // Remove blockquotes (> text) - keep the text
  result = result.replace(/^>\s?/gm, "");

  // Remove horizontal rules (---, ***, ___)
  result = result.replace(/^[-*_]{3,}\s*$/gm, "");

  // Clean up list markers at line start, preserve content
  // Unordered lists: * - +
  result = result.replace(/^[\s]*[-*+]\s+/gm, "• ");

  // Ordered lists: 1. 2. etc.
  result = result.replace(/^[\s]*\d+\.\s+/gm, "");

  // Clean up multiple consecutive newlines
  result = result.replace(/\n{3,}/g, "\n\n");

  // Trim whitespace
  result = result.trim();

  return result;
}

/**
 * Build v2.0 response with simpleText output
 *
 * @param text - Text content to send
 * @returns KakaoSkillResponse with simpleText template
 */
export function buildSimpleTextResponse(text: string): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ simpleText: { text } }],
    },
  };
}

/**
 * Build callback acknowledgment response
 *
 * Used when processing will take longer than 5 seconds.
 * Tells Kakao to wait for callback via callbackUrl.
 *
 * @returns KakaoSkillResponse with useCallback flag
 */
export function buildCallbackAckResponse(): KakaoSkillResponse {
  return {
    version: "2.0",
    useCallback: true,
  };
}

/**
 * Build error response
 *
 * @param message - Error message to display to user
 * @returns KakaoSkillResponse with error message
 */
export function buildErrorResponse(message: string): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ simpleText: { text: message } }],
    },
  };
}

export type ChunkMode = "sentence" | "newline" | "length";

const DEFAULT_CHUNK_LIMIT = 400;

function chunkBySentence(text: string, limit: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }

    const substring = remaining.substring(0, limit);
    const lastSentenceEnd = Math.max(
      substring.lastIndexOf("."),
      substring.lastIndexOf("!"),
      substring.lastIndexOf("?")
    );

    if (lastSentenceEnd > 0) {
      chunks.push(remaining.substring(0, lastSentenceEnd + 1));
      remaining = remaining.substring(lastSentenceEnd + 1).trim();
    } else {
      chunks.push(remaining.substring(0, limit));
      remaining = remaining.substring(limit).trim();
    }
  }

  return chunks;
}

function chunkByNewline(text: string, limit: number): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    if (currentChunk.length === 0) {
      if (trimmed.length <= limit) {
        currentChunk = trimmed;
      } else {
        chunks.push(...chunkBySentence(trimmed, limit));
      }
    } else if (currentChunk.length + 2 + trimmed.length <= limit) {
      currentChunk += "\n\n" + trimmed;
    } else {
      chunks.push(currentChunk);
      if (trimmed.length <= limit) {
        currentChunk = trimmed;
      } else {
        chunks.push(...chunkBySentence(trimmed, limit));
        currentChunk = "";
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function chunkByLength(text: string, limit: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      chunks.push(remaining);
      break;
    }
    chunks.push(remaining.substring(0, limit));
    remaining = remaining.substring(limit);
  }

  return chunks;
}

export function chunkTextForKakao(
  text: string,
  limit: number = DEFAULT_CHUNK_LIMIT,
  mode: ChunkMode = "sentence"
): string[] {
  if (!text || text.length <= limit) {
    return [text];
  }

  switch (mode) {
    case "newline":
      return chunkByNewline(text, limit);
    case "length":
      return chunkByLength(text, limit);
    case "sentence":
    default:
      return chunkBySentence(text, limit);
  }
}

export function buildMultiTextResponse(texts: string[]): KakaoSkillResponse {
  const outputs: KakaoOutput[] = texts.slice(0, 3).map((text) => ({
    simpleText: { text },
  }));

  return {
    version: "2.0",
    template: { outputs },
  };
}

export function buildSimpleImageResponse(
  imageUrl: string,
  altText?: string
): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ simpleImage: { imageUrl, altText } }],
    },
  };
}

export function buildTextCardResponse(
  options: KakaoTextCard["textCard"]
): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ textCard: options }],
    },
  };
}

export function buildBasicCardResponse(
  options: KakaoBasicCard["basicCard"]
): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ basicCard: options }],
    },
  };
}

export function buildCommerceCardResponse(
  options: KakaoCommerceCard["commerceCard"]
): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ commerceCard: options }],
    },
  };
}

export function buildListCardResponse(
  header: KakaoListItem,
  items: KakaoListItem[],
  buttons?: KakaoButton[]
): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ listCard: { header, items: items.slice(0, 5), buttons } }],
    },
  };
}

export function buildItemCardResponse(
  options: KakaoItemCard["itemCard"]
): KakaoSkillResponse {
  return {
    version: "2.0",
    template: {
      outputs: [{ itemCard: options }],
    },
  };
}

export function buildCarouselResponse(
  type: "basicCard" | "commerceCard" | "itemCard" | "textCard",
  items: KakaoOutput[]
): KakaoSkillResponse {
  const carouselItems = items.slice(0, 10).map((item, index) => {
    const itemType = "basicCard" in item ? "basicCard"
      : "commerceCard" in item ? "commerceCard"
      : "itemCard" in item ? "itemCard"
      : "textCard" in item ? "textCard"
      : null;

    if (!itemType) {
      throw new Error(`Invalid carousel item at index ${index}: expected card type`);
    }

    if (itemType !== type) {
      throw new Error(
        `Carousel type mismatch at index ${index}: expected '${type}' but got '${itemType}'`
      );
    }

    if ("basicCard" in item) return item.basicCard;
    if ("commerceCard" in item) return item.commerceCard;
    if ("itemCard" in item) return item.itemCard;
    if ("textCard" in item) return item.textCard;
    throw new Error(`Unreachable`);
  });

  return {
    version: "2.0",
    template: {
      outputs: [{ carousel: { type, items: carouselItems } }],
    },
  };
}

export type {
  KakaoThumbnail,
  KakaoButton,
  KakaoListItem,
  KakaoItemListItem,
  KakaoBasicCard,
  KakaoTextCard,
  KakaoCommerceCard,
  KakaoListCard,
  KakaoItemCard,
};
