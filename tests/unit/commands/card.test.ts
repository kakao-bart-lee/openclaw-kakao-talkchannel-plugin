import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseCardArgs,
  parseButtons,
  parseQuickReplies,
  buildTextCard,
  buildBasicCard,
  buildListCard,
  buildCommerceCard,
  buildCardHelpResponse,
  handleCardCommand,
} from "../../../src/commands/card";

vi.mock("../../../src/relay/client.js", () => ({
  sendReply: vi.fn().mockResolvedValue({ success: true }),
  RelayHttpError: class RelayHttpError extends Error {},
}));

const { sendReply } = await import("../../../src/relay/client.js");

// ============================================================================
// parseCardArgs
// ============================================================================

describe("parseCardArgs", () => {
  it("extracts type from first word", () => {
    expect(parseCardArgs('text "제목" "설명"').type).toBe("text");
  });

  it("lowercases the type", () => {
    expect(parseCardArgs('TEXT "제목"').type).toBe("text");
  });

  it("extracts positional args from quoted strings", () => {
    const { args } = parseCardArgs('text "제목" "설명"');
    expect(args).toEqual(["제목", "설명"]);
  });

  it("extracts flag with quoted value", () => {
    const { flags } = parseCardArgs('text "제목" --buttons "확인|https://a.com"');
    expect(flags.buttons).toBe("확인|https://a.com");
  });

  it("extracts flag with unquoted value", () => {
    const { flags } = parseCardArgs('commerce "상품" --price 15000');
    expect(flags.price).toBe("15000");
  });

  it("extracts multiple flags", () => {
    const { flags } = parseCardArgs('commerce "상품" --price 15000 --discount 2000');
    expect(flags.price).toBe("15000");
    expect(flags.discount).toBe("2000");
  });

  it("does not capture flag value as positional arg", () => {
    const { args } = parseCardArgs('text "제목" --buttons "버튼|url"');
    expect(args).toEqual(["제목"]);
  });

  it("returns empty type for empty input", () => {
    const result = parseCardArgs("");
    expect(result.type).toBe("");
    expect(result.args).toEqual([]);
    expect(result.flags).toEqual({});
  });

  it("handles flags before positional args", () => {
    const { args, flags } = parseCardArgs('text --buttons "확인|url" "제목" "설명"');
    expect(flags.buttons).toBe("확인|url");
    expect(args).toEqual(["제목", "설명"]);
  });
});

// ============================================================================
// parseButtons
// ============================================================================

describe("parseButtons", () => {
  it("returns empty array for empty string", () => {
    expect(parseButtons("")).toEqual([]);
  });

  it("creates webLink action for http URL", () => {
    const result = parseButtons("홈|https://example.com");
    expect(result).toEqual([{ label: "홈", action: "webLink", webLinkUrl: "https://example.com" }]);
  });

  it("creates webLink action for http:// URL", () => {
    const result = parseButtons("홈|http://example.com");
    expect(result[0].action).toBe("webLink");
  });

  it("creates message action for plain text", () => {
    const result = parseButtons("취소|취소합니다");
    expect(result).toEqual([{ label: "취소", action: "message", messageText: "취소합니다" }]);
  });

  it("creates phone action for phone number", () => {
    const result = parseButtons("전화|02-1234-5678");
    expect(result).toEqual([{ label: "전화", action: "phone", phoneNumber: "02-1234-5678" }]);
  });

  it("parses multiple buttons separated by comma", () => {
    const result = parseButtons("A|https://a.com,B|메시지");
    expect(result).toHaveLength(2);
    expect(result[0].action).toBe("webLink");
    expect(result[1].action).toBe("message");
  });

  it("limits to 3 buttons", () => {
    const result = parseButtons("A|a,B|b,C|c,D|d");
    expect(result).toHaveLength(3);
  });

  it("handles button without pipe separator", () => {
    const result = parseButtons("버튼");
    expect(result).toEqual([{ label: "버튼", action: "message", messageText: "버튼" }]);
  });

  it("ignores empty segments", () => {
    const result = parseButtons("A|a,,B|b");
    expect(result).toHaveLength(2);
  });
});

// ============================================================================
// parseQuickReplies
// ============================================================================

describe("parseQuickReplies", () => {
  it("returns empty array for empty string", () => {
    expect(parseQuickReplies("")).toEqual([]);
  });

  it("creates message action quick replies from comma-separated labels", () => {
    const result = parseQuickReplies("옵션A,옵션B");
    expect(result).toEqual([
      { label: "옵션A", action: "message", messageText: "옵션A" },
      { label: "옵션B", action: "message", messageText: "옵션B" },
    ]);
  });

  it("limits to 10 quick replies", () => {
    const input = Array.from({ length: 15 }, (_, i) => `옵션${i}`).join(",");
    expect(parseQuickReplies(input)).toHaveLength(10);
  });

  it("ignores empty segments", () => {
    const result = parseQuickReplies("A,,B");
    expect(result).toHaveLength(2);
  });
});

// ============================================================================
// buildTextCard
// ============================================================================

describe("buildTextCard", () => {
  it("builds textCard with title and description", () => {
    const result = buildTextCard(["제목", "설명"], {});
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toBe("제목");
    expect(card.description).toBe("설명");
  });

  it("works with title only", () => {
    const result = buildTextCard(["제목만"], {});
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toBe("제목만");
    expect(card.description).toBeUndefined();
  });

  it("includes buttons when --buttons flag is provided", () => {
    const result = buildTextCard(["제목", "설명"], { buttons: "확인|https://example.com" });
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.buttons).toHaveLength(1);
    expect(card.buttons[0].action).toBe("webLink");
  });

  it("includes quickReplies when --quick flag is provided", () => {
    const result = buildTextCard(["제목", "설명"], { quick: "옵션A,옵션B" });
    expect(result.template?.quickReplies).toHaveLength(2);
  });

  it("returns usage error when both title and description are absent", () => {
    const result = buildTextCard([], {});
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });

  it("does not include buttons key when none provided", () => {
    const result = buildTextCard(["제목"], {});
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.buttons).toBeUndefined();
  });
});

// ============================================================================
// buildBasicCard
// ============================================================================

describe("buildBasicCard", () => {
  it("builds basicCard with image", () => {
    const result = buildBasicCard(["제목", "설명"], { image: "https://example.com/img.jpg" });
    const card = (result.template?.outputs[0] as any).basicCard;
    expect(card.thumbnail.imageUrl).toBe("https://example.com/img.jpg");
    expect(card.title).toBe("제목");
    expect(card.description).toBe("설명");
  });

  it("returns usage error when --image is missing", () => {
    const result = buildBasicCard(["제목", "설명"], {});
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });

  it("includes buttons when provided", () => {
    const result = buildBasicCard(["제목"], {
      image: "https://example.com/img.jpg",
      buttons: "자세히|https://example.com",
    });
    const card = (result.template?.outputs[0] as any).basicCard;
    expect(card.buttons).toHaveLength(1);
  });

  it("includes quickReplies when provided", () => {
    const result = buildBasicCard([], {
      image: "https://example.com/img.jpg",
      quick: "옵션A,옵션B",
    });
    expect(result.template?.quickReplies).toHaveLength(2);
  });

  it("works without title or description", () => {
    const result = buildBasicCard([], { image: "https://example.com/img.jpg" });
    const card = (result.template?.outputs[0] as any).basicCard;
    expect(card.thumbnail.imageUrl).toBe("https://example.com/img.jpg");
    expect(card.title).toBeUndefined();
  });
});

// ============================================================================
// buildListCard
// ============================================================================

describe("buildListCard", () => {
  it("builds listCard with header and items", () => {
    const result = buildListCard(["헤더", "항목1|설명1,항목2|설명2"], {});
    const card = (result.template?.outputs[0] as any).listCard;
    expect(card.header.title).toBe("헤더");
    expect(card.items).toHaveLength(2);
    expect(card.items[0].title).toBe("항목1");
    expect(card.items[0].description).toBe("설명1");
  });

  it("handles items without description", () => {
    const result = buildListCard(["헤더", "항목1,항목2"], {});
    const card = (result.template?.outputs[0] as any).listCard;
    expect(card.items[0].title).toBe("항목1");
    expect(card.items[0].description).toBeUndefined();
  });

  it("limits items to 5", () => {
    const items = "A|a,B|b,C|c,D|d,E|e,F|f";
    const result = buildListCard(["헤더", items], {});
    const card = (result.template?.outputs[0] as any).listCard;
    expect(card.items).toHaveLength(5);
  });

  it("includes buttons when provided", () => {
    const result = buildListCard(["헤더", "항목1|설명1,항목2|설명2"], {
      buttons: "더보기|https://example.com",
    });
    const card = (result.template?.outputs[0] as any).listCard;
    expect(card.buttons).toHaveLength(1);
  });

  it("returns usage error when header is missing", () => {
    const result = buildListCard([], {});
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });

  it("returns usage error when items string is missing", () => {
    const result = buildListCard(["헤더만"], {});
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });

  it("returns usage error when items count is less than 2", () => {
    const result = buildListCard(["헤더", "항목하나만"], {});
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });
});

// ============================================================================
// buildCommerceCard
// ============================================================================

describe("buildCommerceCard", () => {
  const BASE_FLAGS = { price: "15000", image: "https://example.com/img.jpg" };

  it("builds commerceCard with title, price and image", () => {
    const result = buildCommerceCard(["상품명"], BASE_FLAGS);
    const card = (result.template?.outputs[0] as any).commerceCard;
    expect(card.title).toBe("상품명");
    expect(card.price).toBe(15000);
    expect(card.currency).toBe("won");
    expect(card.thumbnails[0].imageUrl).toBe("https://example.com/img.jpg");
  });

  it("includes discount when provided", () => {
    const result = buildCommerceCard(["상품명"], { ...BASE_FLAGS, discount: "2000" });
    const card = (result.template?.outputs[0] as any).commerceCard;
    expect(card.discount).toBe(2000);
  });

  it("uses second positional arg as description", () => {
    const result = buildCommerceCard(["상품명", "상품 설명"], BASE_FLAGS);
    const card = (result.template?.outputs[0] as any).commerceCard;
    expect(card.description).toBe("상품 설명");
  });

  it("prefers --description flag over positional arg", () => {
    const result = buildCommerceCard(["상품명", "위치 설명"], {
      ...BASE_FLAGS,
      description: "플래그 설명",
    });
    const card = (result.template?.outputs[0] as any).commerceCard;
    expect(card.description).toBe("플래그 설명");
  });

  it("returns usage error when title is missing", () => {
    const result = buildCommerceCard([], BASE_FLAGS);
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });

  it("returns usage error when price is missing", () => {
    const result = buildCommerceCard(["상품명"], { image: "https://example.com/img.jpg" });
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });

  it("returns usage error for non-numeric price", () => {
    const result = buildCommerceCard(["상품명"], { ...BASE_FLAGS, price: "abc" });
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });

  it("returns usage error when --image is missing", () => {
    const result = buildCommerceCard(["상품명"], { price: "15000" });
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });

  it("returns usage error for non-numeric discount", () => {
    const result = buildCommerceCard(["상품명"], { ...BASE_FLAGS, discount: "abc" });
    const card = (result.template?.outputs[0] as any).textCard;
    expect(card.title).toContain("사용법");
  });

  it("does not include discount when not provided", () => {
    const result = buildCommerceCard(["상품명"], BASE_FLAGS);
    const card = (result.template?.outputs[0] as any).commerceCard;
    expect(card.discount).toBeUndefined();
  });

  it("includes buttons when provided", () => {
    const result = buildCommerceCard(["상품명"], {
      ...BASE_FLAGS,
      buttons: "구매|https://shop.example.com",
    });
    const card = (result.template?.outputs[0] as any).commerceCard;
    expect(card.buttons).toHaveLength(1);
  });
});

// ============================================================================
// buildCardHelpResponse
// ============================================================================

describe("buildCardHelpResponse", () => {
  it("returns version 2.0", () => {
    expect(buildCardHelpResponse().version).toBe("2.0");
  });

  it("returns a listCard with card command list", () => {
    const result = buildCardHelpResponse();
    const card = (result.template?.outputs[0] as any).listCard;
    expect(card.header.title).toBeDefined();
    expect(card.items.length).toBeGreaterThanOrEqual(4);
  });
});

// ============================================================================
// handleCardCommand
// ============================================================================

describe("handleCardCommand", () => {
  const mockSendReply = vi.mocked(sendReply);

  const mockMsg = (text: string) => ({
    id: "msg-001",
    conversationKey: "conv-001",
    normalized: { userId: "user-001", text, channelId: "ch-001" },
    createdAt: new Date().toISOString(),
  });

  const mockAccount = {
    talkchannelId: "default",
    enabled: true,
    config: {
      enabled: true,
      relayUrl: "https://relay.example.com",
      dmPolicy: "pairing" as const,
    },
  };

  const mockLog = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendReply with textCard response for /card text", async () => {
    await handleCardCommand(
      mockMsg('/card text "제목" "설명"') as any,
      mockAccount as any,
      "acc-001",
      "https://relay.example.com",
      "token-abc",
      mockLog,
    );

    expect(mockSendReply).toHaveBeenCalledOnce();
    const response = mockSendReply.mock.calls[0][2];
    expect(response.version).toBe("2.0");
    const card = (response.template?.outputs[0] as any).textCard;
    expect(card.title).toBe("제목");
  });

  it("returns help when no subcommand given", async () => {
    await handleCardCommand(
      mockMsg("/card") as any,
      mockAccount as any,
      "acc-001",
      "https://relay.example.com",
      "token-abc",
      mockLog,
    );

    expect(mockSendReply).toHaveBeenCalledOnce();
    const response = mockSendReply.mock.calls[0][2];
    const card = (response.template?.outputs[0] as any).listCard;
    expect(card).toBeDefined();
  });

  it("returns help for unknown card type", async () => {
    await handleCardCommand(
      mockMsg("/card unknown") as any,
      mockAccount as any,
      "acc-001",
      "https://relay.example.com",
      "token-abc",
      mockLog,
    );

    expect(mockSendReply).toHaveBeenCalledOnce();
    const response = mockSendReply.mock.calls[0][2];
    const card = (response.template?.outputs[0] as any).listCard;
    expect(card).toBeDefined();
  });
});
