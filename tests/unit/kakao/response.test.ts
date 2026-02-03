/**
 * Kakao SkillResponse Builder Tests
 * 
 * Tests for response building functions that create v2.0 format responses
 * with proper text chunking and callback handling.
 */
import { describe, it, expect } from "vitest";
import {
  buildSimpleTextResponse,
  buildCallbackAckResponse,
  buildErrorResponse,
  chunkTextForKakao,
  buildMultiTextResponse,
  stripMarkdown,
  buildSimpleImageResponse,
  buildTextCardResponse,
  buildBasicCardResponse,
  buildCommerceCardResponse,
  buildListCardResponse,
  buildItemCardResponse,
  buildCarouselResponse,
} from "../../../src/kakao/response";
import type { KakaoSkillResponse, KakaoChannelData, KakaoOutput } from "../../../src/types";

describe("Kakao Response Builder", () => {
  describe("buildSimpleTextResponse", () => {
    it("should build v2.0 response with simpleText", () => {
      const response = buildSimpleTextResponse("Hello, Kakao!");

      expect(response.version).toBe("2.0");
      expect(response.template).toBeDefined();
      expect(response.template?.outputs).toHaveLength(1);
      expect(response.template?.outputs[0]).toEqual({
        simpleText: { text: "Hello, Kakao!" },
      });
    });

    it("should not set useCallback flag", () => {
      const response = buildSimpleTextResponse("Test");

      expect(response.useCallback).toBeUndefined();
    });

    it("should handle empty string", () => {
      const response = buildSimpleTextResponse("");

      expect(response.template?.outputs[0]).toEqual({
        simpleText: { text: "" },
      });
    });

    it("should handle Korean text", () => {
      const response = buildSimpleTextResponse("안녕하세요!");

      expect(response.template?.outputs[0]).toEqual({
        simpleText: { text: "안녕하세요!" },
      });
    });

    it("should handle text with special characters", () => {
      const text = "Hello! How are you? I'm fine.";
      const response = buildSimpleTextResponse(text);

      expect(response.template?.outputs[0]).toEqual({
        simpleText: { text },
      });
    });
  });

  describe("buildCallbackAckResponse", () => {
    it("should build callback acknowledgment response", () => {
      const response = buildCallbackAckResponse();

      expect(response.version).toBe("2.0");
      expect(response.useCallback).toBe(true);
    });

    it("should not include template", () => {
      const response = buildCallbackAckResponse();

      expect(response.template).toBeUndefined();
    });

    it("should return consistent structure", () => {
      const response1 = buildCallbackAckResponse();
      const response2 = buildCallbackAckResponse();

      expect(response1).toEqual(response2);
    });
  });

  describe("buildErrorResponse", () => {
    it("should build error response with message", () => {
      const response = buildErrorResponse("Something went wrong");

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs[0]).toEqual({
        simpleText: { text: "Something went wrong" },
      });
    });

    it("should handle error message with details", () => {
      const message = "Error: Invalid request format";
      const response = buildErrorResponse(message);

      expect(response.template?.outputs[0]).toEqual({
        simpleText: { text: message },
      });
    });

    it("should not set useCallback flag", () => {
      const response = buildErrorResponse("Error");

      expect(response.useCallback).toBeUndefined();
    });
  });

  describe("chunkTextForKakao", () => {
    it("should return single chunk for short text", () => {
      const text = "Hello, world!";
      const chunks = chunkTextForKakao(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(text);
    });

    it("should use default limit of 500 characters", () => {
      const text = "a".repeat(600);
      const chunks = chunkTextForKakao(text);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(500);
      });
    });

    it("should respect custom limit", () => {
      const text = "a".repeat(300);
      const chunks = chunkTextForKakao(text, 100);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(100);
      });
    });

    it("should split at sentence boundaries (period)", () => {
      const text = "First sentence. Second sentence. Third sentence.";
      const chunks = chunkTextForKakao(text, 30);

      // Should split at periods, not in the middle of words
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(30);
      });
    });

    it("should split at exclamation mark", () => {
      const text = "First! Second! Third!";
      const chunks = chunkTextForKakao(text, 15);

      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(15);
      });
    });

    it("should split at question mark", () => {
      const text = "First? Second? Third?";
      const chunks = chunkTextForKakao(text, 15);

      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(15);
      });
    });

    it("should handle text without sentence boundaries", () => {
      const text = "a".repeat(600);
      const chunks = chunkTextForKakao(text);

      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(500);
      });
    });

    it("should preserve sentence structure", () => {
      const text = "Hello. World. How are you?";
      const chunks = chunkTextForKakao(text, 50);

      const joined = chunks.join("");
      expect(joined).toBe(text);
    });

    it("should handle empty string", () => {
      const chunks = chunkTextForKakao("");

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("");
    });

    it("should handle Korean text with sentence boundaries", () => {
      const text = "안녕하세요. 반갑습니다. 어떻게 도와드릴까요?";
      const chunks = chunkTextForKakao(text, 100);

      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("buildMultiTextResponse", () => {
    it("should build response with single text", () => {
      const response = buildMultiTextResponse(["Hello"]);

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs).toHaveLength(1);
      expect(response.template?.outputs[0]).toEqual({
        simpleText: { text: "Hello" },
      });
    });

    it("should build response with multiple texts", () => {
      const texts = ["First", "Second", "Third"];
      const response = buildMultiTextResponse(texts);

      expect(response.template?.outputs).toHaveLength(3);
      texts.forEach((text, index) => {
        expect(response.template?.outputs[index]).toEqual({
          simpleText: { text },
        });
      });
    });

    it("should enforce Kakao limit of 3 outputs maximum", () => {
      const texts = ["One", "Two", "Three", "Four", "Five"];
      const response = buildMultiTextResponse(texts);

      expect(response.template?.outputs.length).toBeLessThanOrEqual(3);
    });

    it("should handle empty array", () => {
      const response = buildMultiTextResponse([]);

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs).toHaveLength(0);
    });

    it("should not set useCallback flag", () => {
      const response = buildMultiTextResponse(["Text"]);

      expect(response.useCallback).toBeUndefined();
    });

    it("should preserve text order", () => {
      const texts = ["Alpha", "Beta", "Gamma"];
      const response = buildMultiTextResponse(texts);

      texts.forEach((text, index) => {
        expect(response.template?.outputs[index]).toEqual({
          simpleText: { text },
        });
      });
    });

    it("should handle texts with special characters", () => {
      const texts = ["Hello!", "How are you?", "I'm fine."];
      const response = buildMultiTextResponse(texts);

      expect(response.template?.outputs).toHaveLength(3);
      texts.forEach((text, index) => {
        expect(response.template?.outputs[index]).toEqual({
          simpleText: { text },
        });
      });
    });

    it("should handle Korean texts", () => {
      const texts = ["안녕하세요", "반갑습니다", "도움이 되셨나요?"];
      const response = buildMultiTextResponse(texts);

      expect(response.template?.outputs).toHaveLength(3);
      texts.forEach((text, index) => {
        expect(response.template?.outputs[index]).toEqual({
          simpleText: { text },
        });
      });
    });
  });

  describe("Response structure validation", () => {
    it("all responses should have version 2.0", () => {
      const responses: KakaoSkillResponse[] = [
        buildSimpleTextResponse("test"),
        buildCallbackAckResponse(),
        buildErrorResponse("error"),
        buildMultiTextResponse(["text"]),
      ];

      responses.forEach((response) => {
        expect(response.version).toBe("2.0");
      });
    });

    it("should not include context or data fields by default", () => {
      const response = buildSimpleTextResponse("test");

      expect(response.context).toBeUndefined();
      expect(response.data).toBeUndefined();
    });
  });

  describe("stripMarkdown", () => {
    it("should return empty string as-is", () => {
      expect(stripMarkdown("")).toBe("");
    });

    it("should return plain text as-is", () => {
      expect(stripMarkdown("Hello, world!")).toBe("Hello, world!");
    });

    it("should remove headers", () => {
      expect(stripMarkdown("# Header 1")).toBe("Header 1");
      expect(stripMarkdown("## Header 2")).toBe("Header 2");
      expect(stripMarkdown("### Header 3")).toBe("Header 3");
    });

    it("should remove bold formatting", () => {
      expect(stripMarkdown("**bold text**")).toBe("bold text");
      expect(stripMarkdown("__bold text__")).toBe("bold text");
    });

    it("should remove italic formatting", () => {
      expect(stripMarkdown("word *italic* word")).toBe("word italic word");
      expect(stripMarkdown("word _italic_ word")).toBe("word italic word");
    });

    it("should remove strikethrough", () => {
      expect(stripMarkdown("~~strikethrough~~")).toBe("strikethrough");
    });

    it("should remove code blocks", () => {
      const input = "```javascript\nconst x = 1;\n```";
      expect(stripMarkdown(input)).toBe("const x = 1;");
    });

    it("should remove inline code", () => {
      expect(stripMarkdown("use `npm install`")).toBe("use npm install");
    });

    it("should convert links to text with URL", () => {
      expect(stripMarkdown("[link](https://example.com)")).toBe("link (https://example.com)");
    });

    it("should convert images to placeholder text", () => {
      expect(stripMarkdown("![alt text](https://example.com/image.png)")).toBe("[이미지: alt text]");
    });

    it("should remove blockquotes", () => {
      expect(stripMarkdown("> quoted text")).toBe("quoted text");
    });

    it("should remove horizontal rules", () => {
      expect(stripMarkdown("text\n---\nmore text")).toBe("text\n\nmore text");
    });

    it("should convert unordered list markers to bullets", () => {
      expect(stripMarkdown("- item 1\n- item 2")).toBe("• item 1\n• item 2");
      expect(stripMarkdown("* item 1\n* item 2")).toBe("• item 1\n• item 2");
    });

    it("should remove ordered list numbers", () => {
      expect(stripMarkdown("1. item 1\n2. item 2")).toBe("item 1\nitem 2");
    });

    it("should handle complex markdown", () => {
      const input = `# Title

**Bold** and *italic* text.

- Item 1
- Item 2

\`\`\`
code block
\`\`\`

[Link](https://example.com)`;
      
      const result = stripMarkdown(input);
      expect(result).not.toContain("**");
      expect(result).not.toContain("```");
      expect(result).not.toContain("# ");
      expect(result).toContain("Bold");
      expect(result).toContain("italic");
      expect(result).toContain("Link");
    });
  });

  describe("buildSimpleImageResponse", () => {
    it("should build response with image URL", () => {
      const response = buildSimpleImageResponse("https://example.com/image.png");

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs).toHaveLength(1);
      expect(response.template?.outputs[0]).toEqual({
        simpleImage: { imageUrl: "https://example.com/image.png", altText: undefined },
      });
    });

    it("should include altText when provided", () => {
      const response = buildSimpleImageResponse("https://example.com/image.png", "Image description");

      expect(response.template?.outputs[0]).toEqual({
        simpleImage: { imageUrl: "https://example.com/image.png", altText: "Image description" },
      });
    });
  });

  describe("buildTextCardResponse", () => {
    it("should build text card with title and description", () => {
      const response = buildTextCardResponse({
        title: "Card Title",
        description: "Card description",
      });

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs[0]).toHaveProperty("textCard");
      const textCard = (response.template?.outputs[0] as { textCard: { title: string; description: string } }).textCard;
      expect(textCard.title).toBe("Card Title");
      expect(textCard.description).toBe("Card description");
    });

    it("should include message button", () => {
      const response = buildTextCardResponse({
        title: "Card",
        buttons: [{ label: "메시지 전송", action: "message", messageText: "안녕하세요" }],
      });

      const textCard = (response.template?.outputs[0] as { textCard: { buttons: Array<{ label: string; action: string; messageText: string }> } }).textCard;
      expect(textCard.buttons).toHaveLength(1);
      expect(textCard.buttons[0].action).toBe("message");
      expect(textCard.buttons[0].messageText).toBe("안녕하세요");
    });

    it("should include webLink button", () => {
      const response = buildTextCardResponse({
        title: "Card",
        buttons: [{ label: "웹사이트", action: "webLink", webLinkUrl: "https://example.com" }],
      });

      const textCard = (response.template?.outputs[0] as { textCard: { buttons: Array<{ action: string; webLinkUrl: string }> } }).textCard;
      expect(textCard.buttons[0].action).toBe("webLink");
      expect(textCard.buttons[0].webLinkUrl).toBe("https://example.com");
    });

    it("should include block button", () => {
      const response = buildTextCardResponse({
        title: "Card",
        buttons: [{ label: "블록 이동", action: "block", blockId: "block_123" }],
      });

      const textCard = (response.template?.outputs[0] as { textCard: { buttons: Array<{ action: string; blockId: string }> } }).textCard;
      expect(textCard.buttons[0].action).toBe("block");
      expect(textCard.buttons[0].blockId).toBe("block_123");
    });

    it("should include phone button", () => {
      const response = buildTextCardResponse({
        title: "Card",
        buttons: [{ label: "전화하기", action: "phone", phoneNumber: "010-1234-5678" }],
      });

      const textCard = (response.template?.outputs[0] as { textCard: { buttons: Array<{ action: string; phoneNumber: string }> } }).textCard;
      expect(textCard.buttons[0].action).toBe("phone");
      expect(textCard.buttons[0].phoneNumber).toBe("010-1234-5678");
    });

    it("should include share button", () => {
      const response = buildTextCardResponse({
        title: "Card",
        buttons: [{ label: "공유하기", action: "share" }],
      });

      const textCard = (response.template?.outputs[0] as { textCard: { buttons: Array<{ action: string }> } }).textCard;
      expect(textCard.buttons[0].action).toBe("share");
    });

    it("should include multiple buttons", () => {
      const response = buildTextCardResponse({
        title: "Card",
        buttons: [
          { label: "메시지", action: "message", messageText: "hello" },
          { label: "링크", action: "webLink", webLinkUrl: "https://example.com" },
        ],
        buttonLayout: "horizontal",
      });

      const textCard = (response.template?.outputs[0] as { textCard: { buttons: unknown[]; buttonLayout: string } }).textCard;
      expect(textCard.buttons).toHaveLength(2);
      expect(textCard.buttonLayout).toBe("horizontal");
    });

    it("should support vertical button layout", () => {
      const response = buildTextCardResponse({
        title: "Card",
        buttons: [
          { label: "버튼1", action: "message", messageText: "1" },
          { label: "버튼2", action: "message", messageText: "2" },
          { label: "버튼3", action: "message", messageText: "3" },
        ],
        buttonLayout: "vertical",
      });

      const textCard = (response.template?.outputs[0] as { textCard: { buttons: unknown[]; buttonLayout: string } }).textCard;
      expect(textCard.buttons).toHaveLength(3);
      expect(textCard.buttonLayout).toBe("vertical");
    });

    it("should include button extra data", () => {
      const response = buildTextCardResponse({
        title: "Card",
        buttons: [{ label: "버튼", action: "message", messageText: "test", extra: { key: "value" } }],
      });

      const textCard = (response.template?.outputs[0] as { textCard: { buttons: Array<{ extra: Record<string, unknown> }> } }).textCard;
      expect(textCard.buttons[0].extra).toEqual({ key: "value" });
    });
  });

  describe("buildBasicCardResponse", () => {
    it("should build basic card with thumbnail", () => {
      const response = buildBasicCardResponse({
        title: "Product",
        description: "Product description",
        thumbnail: { imageUrl: "https://example.com/thumb.png" },
      });

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs[0]).toHaveProperty("basicCard");
      const basicCard = (response.template?.outputs[0] as { basicCard: { title: string; thumbnail: { imageUrl: string } } }).basicCard;
      expect(basicCard.title).toBe("Product");
      expect(basicCard.thumbnail.imageUrl).toBe("https://example.com/thumb.png");
    });

    it("should include thumbnail with all options", () => {
      const response = buildBasicCardResponse({
        thumbnail: {
          imageUrl: "https://example.com/image.png",
          altText: "대체 텍스트",
          width: 800,
          height: 400,
          fixedRatio: true,
          link: { web: "https://example.com" },
        },
      });

      const basicCard = (response.template?.outputs[0] as { basicCard: { thumbnail: { imageUrl: string; altText: string; width: number; height: number; fixedRatio: boolean; link: { web: string } } } }).basicCard;
      expect(basicCard.thumbnail.altText).toBe("대체 텍스트");
      expect(basicCard.thumbnail.width).toBe(800);
      expect(basicCard.thumbnail.height).toBe(400);
      expect(basicCard.thumbnail.fixedRatio).toBe(true);
      expect(basicCard.thumbnail.link?.web).toBe("https://example.com");
    });

    it("should include buttons with webLink action", () => {
      const response = buildBasicCardResponse({
        thumbnail: { imageUrl: "https://example.com/thumb.png" },
        buttons: [
          { label: "구매하기", action: "webLink", webLinkUrl: "https://shop.example.com/buy" },
        ],
      });

      const basicCard = (response.template?.outputs[0] as { basicCard: { buttons: Array<{ label: string; action: string; webLinkUrl: string }> } }).basicCard;
      expect(basicCard.buttons).toHaveLength(1);
      expect(basicCard.buttons[0].label).toBe("구매하기");
      expect(basicCard.buttons[0].action).toBe("webLink");
      expect(basicCard.buttons[0].webLinkUrl).toBe("https://shop.example.com/buy");
    });

    it("should include multiple buttons with different actions", () => {
      const response = buildBasicCardResponse({
        title: "상품",
        thumbnail: { imageUrl: "https://example.com/thumb.png" },
        buttons: [
          { label: "자세히 보기", action: "webLink", webLinkUrl: "https://example.com/detail" },
          { label: "문의하기", action: "phone", phoneNumber: "1588-1234" },
        ],
        buttonLayout: "horizontal",
      });

      const basicCard = (response.template?.outputs[0] as { basicCard: { buttons: unknown[]; buttonLayout: string } }).basicCard;
      expect(basicCard.buttons).toHaveLength(2);
      expect(basicCard.buttonLayout).toBe("horizontal");
    });

    it("should support operator button", () => {
      const response = buildBasicCardResponse({
        thumbnail: { imageUrl: "https://example.com/thumb.png" },
        buttons: [{ label: "상담원 연결", action: "operator" }],
      });

      const basicCard = (response.template?.outputs[0] as { basicCard: { buttons: Array<{ action: string }> } }).basicCard;
      expect(basicCard.buttons[0].action).toBe("operator");
    });
  });

  describe("buildListCardResponse", () => {
    it("should build list card with header and items", () => {
      const response = buildListCardResponse(
        { title: "List Header" },
        [{ title: "Item 1" }, { title: "Item 2" }]
      );

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs[0]).toHaveProperty("listCard");
      const listCard = (response.template?.outputs[0] as { listCard: { header: { title: string }; items: unknown[] } }).listCard;
      expect(listCard.header.title).toBe("List Header");
      expect(listCard.items).toHaveLength(2);
    });

    it("should limit items to 5", () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ title: `Item ${i + 1}` }));
      const response = buildListCardResponse({ title: "Header" }, items);

      const listCard = (response.template?.outputs[0] as { listCard: { items: unknown[] } }).listCard;
      expect(listCard.items).toHaveLength(5);
    });

    it("should include item with description and image", () => {
      const response = buildListCardResponse(
        { title: "메뉴" },
        [
          { title: "아메리카노", description: "4,500원", imageUrl: "https://example.com/americano.png" },
          { title: "라떼", description: "5,000원", imageUrl: "https://example.com/latte.png" },
        ]
      );

      const listCard = (response.template?.outputs[0] as { listCard: { items: Array<{ title: string; description: string; imageUrl: string }> } }).listCard;
      expect(listCard.items[0].description).toBe("4,500원");
      expect(listCard.items[0].imageUrl).toBe("https://example.com/americano.png");
    });

    it("should include item with link", () => {
      const response = buildListCardResponse(
        { title: "링크 목록" },
        [{ title: "공지사항", link: { web: "https://example.com/notice" } }]
      );

      const listCard = (response.template?.outputs[0] as { listCard: { items: Array<{ link: { web: string } }> } }).listCard;
      expect(listCard.items[0].link?.web).toBe("https://example.com/notice");
    });

    it("should include item with block action", () => {
      const response = buildListCardResponse(
        { title: "메뉴" },
        [{ title: "주문하기", action: "block", blockId: "order_block_123" }]
      );

      const listCard = (response.template?.outputs[0] as { listCard: { items: Array<{ action: string; blockId: string }> } }).listCard;
      expect(listCard.items[0].action).toBe("block");
      expect(listCard.items[0].blockId).toBe("order_block_123");
    });

    it("should include item with message action", () => {
      const response = buildListCardResponse(
        { title: "FAQ" },
        [{ title: "배송 문의", action: "message", messageText: "배송 관련 문의입니다" }]
      );

      const listCard = (response.template?.outputs[0] as { listCard: { items: Array<{ action: string; messageText: string }> } }).listCard;
      expect(listCard.items[0].action).toBe("message");
      expect(listCard.items[0].messageText).toBe("배송 관련 문의입니다");
    });

    it("should include item with extra data", () => {
      const response = buildListCardResponse(
        { title: "상품" },
        [{ title: "상품A", extra: { productId: "123", category: "food" } }]
      );

      const listCard = (response.template?.outputs[0] as { listCard: { items: Array<{ extra: Record<string, unknown> }> } }).listCard;
      expect(listCard.items[0].extra).toEqual({ productId: "123", category: "food" });
    });

    it("should include buttons", () => {
      const response = buildListCardResponse(
        { title: "메뉴" },
        [{ title: "Item 1" }],
        [
          { label: "더보기", action: "webLink", webLinkUrl: "https://example.com/more" },
          { label: "공유하기", action: "share" },
        ]
      );

      const listCard = (response.template?.outputs[0] as { listCard: { buttons: Array<{ label: string; action: string }> } }).listCard;
      expect(listCard.buttons).toHaveLength(2);
      expect(listCard.buttons[0].label).toBe("더보기");
      expect(listCard.buttons[1].action).toBe("share");
    });
  });

  describe("buildCommerceCardResponse", () => {
    it("should build commerce card with price", () => {
      const response = buildCommerceCardResponse({
        title: "상품명",
        description: "상품 설명",
        price: 25000,
        thumbnails: [{ imageUrl: "https://example.com/product.png" }],
      });

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs[0]).toHaveProperty("commerceCard");
      const commerceCard = (response.template?.outputs[0] as { commerceCard: { title: string; price: number } }).commerceCard;
      expect(commerceCard.title).toBe("상품명");
      expect(commerceCard.price).toBe(25000);
    });

    it("should include discount information", () => {
      const response = buildCommerceCardResponse({
        price: 30000,
        discount: 5000,
        discountedPrice: 25000,
        thumbnails: [{ imageUrl: "https://example.com/product.png" }],
      });

      const commerceCard = (response.template?.outputs[0] as { commerceCard: { price: number; discount: number; discountedPrice: number } }).commerceCard;
      expect(commerceCard.discount).toBe(5000);
      expect(commerceCard.discountedPrice).toBe(25000);
    });

    it("should include discount rate", () => {
      const response = buildCommerceCardResponse({
        price: 30000,
        discountRate: 20,
        discountedPrice: 24000,
        thumbnails: [{ imageUrl: "https://example.com/product.png" }],
      });

      const commerceCard = (response.template?.outputs[0] as { commerceCard: { discountRate: number } }).commerceCard;
      expect(commerceCard.discountRate).toBe(20);
    });

    it("should include profile", () => {
      const response = buildCommerceCardResponse({
        price: 25000,
        thumbnails: [{ imageUrl: "https://example.com/product.png" }],
        profile: {
          title: "판매자명",
          imageUrl: "https://example.com/seller.png",
        },
      });

      const commerceCard = (response.template?.outputs[0] as { commerceCard: { profile: { title: string; imageUrl: string } } }).commerceCard;
      expect(commerceCard.profile?.title).toBe("판매자명");
    });

    it("should include currency", () => {
      const response = buildCommerceCardResponse({
        price: 25000,
        currency: "won",
        thumbnails: [{ imageUrl: "https://example.com/product.png" }],
      });

      const commerceCard = (response.template?.outputs[0] as { commerceCard: { currency: string } }).commerceCard;
      expect(commerceCard.currency).toBe("won");
    });

    it("should include buttons", () => {
      const response = buildCommerceCardResponse({
        price: 25000,
        thumbnails: [{ imageUrl: "https://example.com/product.png" }],
        buttons: [
          { label: "구매하기", action: "webLink", webLinkUrl: "https://shop.example.com/buy" },
          { label: "장바구니", action: "message", messageText: "장바구니 담기" },
        ],
        buttonLayout: "horizontal",
      });

      const commerceCard = (response.template?.outputs[0] as { commerceCard: { buttons: unknown[]; buttonLayout: string } }).commerceCard;
      expect(commerceCard.buttons).toHaveLength(2);
      expect(commerceCard.buttonLayout).toBe("horizontal");
    });
  });

  describe("buildItemCardResponse", () => {
    it("should build item card with item list", () => {
      const response = buildItemCardResponse({
        itemList: [
          { title: "항목1", description: "값1" },
          { title: "항목2", description: "값2" },
        ],
      });

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs[0]).toHaveProperty("itemCard");
      const itemCard = (response.template?.outputs[0] as { itemCard: { itemList: unknown[] } }).itemCard;
      expect(itemCard.itemList).toHaveLength(2);
    });

    it("should include thumbnail", () => {
      const response = buildItemCardResponse({
        thumbnail: { imageUrl: "https://example.com/item.png", width: 800, height: 400 },
        itemList: [{ title: "항목", description: "값" }],
      });

      const itemCard = (response.template?.outputs[0] as { itemCard: { thumbnail: { imageUrl: string } } }).itemCard;
      expect(itemCard.thumbnail?.imageUrl).toBe("https://example.com/item.png");
    });

    it("should include head", () => {
      const response = buildItemCardResponse({
        head: { title: "주문 정보" },
        itemList: [{ title: "주문번호", description: "12345" }],
      });

      const itemCard = (response.template?.outputs[0] as { itemCard: { head: { title: string } } }).itemCard;
      expect(itemCard.head?.title).toBe("주문 정보");
    });

    it("should include profile (mutually exclusive with head)", () => {
      const response = buildItemCardResponse({
        profile: { title: "OpenClaw", imageUrl: "https://example.com/profile.png" },
        itemList: [{ title: "항목", description: "값" }],
      });

      const itemCard = (response.template?.outputs[0] as { itemCard: { profile: { title: string } } }).itemCard;
      expect(itemCard.profile?.title).toBe("OpenClaw");
    });

    it("should include imageTitle", () => {
      const response = buildItemCardResponse({
        imageTitle: {
          title: "제목",
          description: "부제목",
          imageUrl: "https://example.com/icon.png",
        },
        itemList: [{ title: "항목", description: "값" }],
      });

      const itemCard = (response.template?.outputs[0] as { itemCard: { imageTitle: { title: string; description: string } } }).itemCard;
      expect(itemCard.imageTitle?.title).toBe("제목");
      expect(itemCard.imageTitle?.description).toBe("부제목");
    });

    it("should include itemListSummary", () => {
      const response = buildItemCardResponse({
        itemList: [
          { title: "상품1", description: "10,000원" },
          { title: "상품2", description: "15,000원" },
        ],
        itemListSummary: { title: "합계", description: "25,000원" },
      });

      const itemCard = (response.template?.outputs[0] as { itemCard: { itemListSummary: { title: string; description: string } } }).itemCard;
      expect(itemCard.itemListSummary?.title).toBe("합계");
      expect(itemCard.itemListSummary?.description).toBe("25,000원");
    });

    it("should include itemListAlignment", () => {
      const response = buildItemCardResponse({
        itemList: [{ title: "항목", description: "값" }],
        itemListAlignment: "right",
      });

      const itemCard = (response.template?.outputs[0] as { itemCard: { itemListAlignment: string } }).itemCard;
      expect(itemCard.itemListAlignment).toBe("right");
    });

    it("should include title and description", () => {
      const response = buildItemCardResponse({
        title: "카드 제목",
        description: "카드 설명입니다",
        itemList: [{ title: "항목", description: "값" }],
      });

      const itemCard = (response.template?.outputs[0] as { itemCard: { title: string; description: string } }).itemCard;
      expect(itemCard.title).toBe("카드 제목");
      expect(itemCard.description).toBe("카드 설명입니다");
    });

    it("should include buttons", () => {
      const response = buildItemCardResponse({
        itemList: [{ title: "항목", description: "값" }],
        buttons: [
          { label: "확인", action: "message", messageText: "확인" },
          { label: "취소", action: "block", blockId: "cancel_block" },
        ],
        buttonLayout: "vertical",
      });

      const itemCard = (response.template?.outputs[0] as { itemCard: { buttons: unknown[]; buttonLayout: string } }).itemCard;
      expect(itemCard.buttons).toHaveLength(2);
      expect(itemCard.buttonLayout).toBe("vertical");
    });
  });

  describe("buildCarouselResponse", () => {
    it("should build carousel with basic cards", () => {
      const items = [
        { basicCard: { title: "Card 1", thumbnail: { imageUrl: "https://example.com/1.png" } } },
        { basicCard: { title: "Card 2", thumbnail: { imageUrl: "https://example.com/2.png" } } },
      ];

      const response = buildCarouselResponse("basicCard", items);

      expect(response.version).toBe("2.0");
      expect(response.template?.outputs[0]).toHaveProperty("carousel");
      const carousel = (response.template?.outputs[0] as { carousel: { type: string; items: unknown[] } }).carousel;
      expect(carousel.type).toBe("basicCard");
      expect(carousel.items).toHaveLength(2);
    });

    it("should limit carousel items to 10", () => {
      const items = Array.from({ length: 15 }, (_, i) => ({
        basicCard: { title: `Card ${i + 1}`, thumbnail: { imageUrl: `https://example.com/${i}.png` } },
      }));

      const response = buildCarouselResponse("basicCard", items);

      const carousel = (response.template?.outputs[0] as { carousel: { items: unknown[] } }).carousel;
      expect(carousel.items).toHaveLength(10);
    });

    it("should build carousel with commerce cards", () => {
      const items = [
        { commerceCard: { price: 10000, thumbnails: [{ imageUrl: "https://example.com/1.png" }] } },
        { commerceCard: { price: 20000, thumbnails: [{ imageUrl: "https://example.com/2.png" }] } },
      ];

      const response = buildCarouselResponse("commerceCard", items);

      const carousel = (response.template?.outputs[0] as { carousel: { type: string; items: unknown[] } }).carousel;
      expect(carousel.type).toBe("commerceCard");
      expect(carousel.items).toHaveLength(2);
    });

    it("should build carousel with text cards", () => {
      const items = [
        { textCard: { title: "Card 1", description: "Desc 1" } },
        { textCard: { title: "Card 2", description: "Desc 2" } },
      ];

      const response = buildCarouselResponse("textCard", items);

      const carousel = (response.template?.outputs[0] as { carousel: { type: string; items: unknown[] } }).carousel;
      expect(carousel.type).toBe("textCard");
      expect(carousel.items).toHaveLength(2);
    });

    it("should build carousel with item cards", () => {
      const items = [
        { itemCard: { itemList: [{ title: "Item 1", description: "Desc 1" }] } },
        { itemCard: { itemList: [{ title: "Item 2", description: "Desc 2" }] } },
      ];

      const response = buildCarouselResponse("itemCard", items);

      const carousel = (response.template?.outputs[0] as { carousel: { type: string; items: unknown[] } }).carousel;
      expect(carousel.type).toBe("itemCard");
      expect(carousel.items).toHaveLength(2);
    });

    it("should build carousel with cards containing buttons", () => {
      const items = [
        {
          basicCard: {
            title: "Product 1",
            thumbnail: { imageUrl: "https://example.com/1.png" },
            buttons: [
              { label: "구매", action: "webLink" as const, webLinkUrl: "https://example.com/buy/1" },
            ],
          },
        },
        {
          basicCard: {
            title: "Product 2",
            thumbnail: { imageUrl: "https://example.com/2.png" },
            buttons: [
              { label: "구매", action: "webLink" as const, webLinkUrl: "https://example.com/buy/2" },
            ],
          },
        },
      ];

      const response = buildCarouselResponse("basicCard", items);

      const carousel = (response.template?.outputs[0] as { carousel: { items: Array<{ buttons: unknown[] }> } }).carousel;
      expect(carousel.items[0].buttons).toHaveLength(1);
      expect(carousel.items[1].buttons).toHaveLength(1);
    });

    it("should throw error when item type does not match carousel type", () => {
      const items = [
        { textCard: { title: "Text Card" } },
      ];

      expect(() => buildCarouselResponse("basicCard", items)).toThrow(
        "Carousel type mismatch at index 0: expected 'basicCard' but got 'textCard'"
      );
    });

    it("should throw error for invalid item types (simpleText)", () => {
      const items = [
        { simpleText: { text: "Not a card" } },
      ];

      expect(() => buildCarouselResponse("basicCard", items as any)).toThrow(
        "Invalid carousel item at index 0: expected card type"
      );
    });

    it("should throw error when mixed types in carousel", () => {
      const items = [
        { basicCard: { title: "Card 1", thumbnail: { imageUrl: "https://example.com/1.png" } } },
        { textCard: { title: "Card 2" } },
      ];

      expect(() => buildCarouselResponse("basicCard", items)).toThrow(
        "Carousel type mismatch at index 1: expected 'basicCard' but got 'textCard'"
      );
    });
  });

  describe("KakaoChannelData type usage", () => {
    it("should allow simpleText in channelData", () => {
      const channelData: KakaoChannelData = {
        simpleText: { text: "안녕하세요" },
      };

      expect(channelData.simpleText?.text).toBe("안녕하세요");
    });

    it("should allow simpleImage in channelData", () => {
      const channelData: KakaoChannelData = {
        simpleImage: { imageUrl: "https://example.com/image.png", altText: "이미지" },
      };

      expect(channelData.simpleImage?.imageUrl).toBe("https://example.com/image.png");
    });

    it("should allow basicCard in channelData", () => {
      const channelData: KakaoChannelData = {
        basicCard: {
          title: "상품",
          description: "상품 설명",
          thumbnail: { imageUrl: "https://example.com/thumb.png" },
          buttons: [
            { label: "구매", action: "webLink", webLinkUrl: "https://shop.example.com" },
          ],
        },
      };

      expect(channelData.basicCard?.title).toBe("상품");
      expect(channelData.basicCard?.buttons).toHaveLength(1);
    });

    it("should allow listCard in channelData", () => {
      const channelData: KakaoChannelData = {
        listCard: {
          header: { title: "메뉴" },
          items: [
            { title: "아메리카노", description: "4,500원" },
            { title: "라떼", description: "5,000원" },
          ],
          buttons: [{ label: "주문하기", action: "message", messageText: "주문" }],
        },
      };

      expect(channelData.listCard?.header.title).toBe("메뉴");
      expect(channelData.listCard?.items).toHaveLength(2);
    });

    it("should allow carousel in channelData", () => {
      const channelData: KakaoChannelData = {
        carousel: {
          type: "basicCard",
          items: [
            { title: "Card 1", thumbnail: { imageUrl: "https://example.com/1.png" } },
            { title: "Card 2", thumbnail: { imageUrl: "https://example.com/2.png" } },
          ],
        },
      };

      expect(channelData.carousel?.type).toBe("basicCard");
      expect(channelData.carousel?.items).toHaveLength(2);
    });

    it("should allow quickReplies in channelData", () => {
      const channelData: KakaoChannelData = {
        simpleText: { text: "무엇을 도와드릴까요?" },
        quickReplies: [
          { label: "상품 문의", action: "message", messageText: "상품 문의합니다" },
          { label: "배송 조회", action: "block", blockId: "delivery_block" },
        ],
      };

      expect(channelData.quickReplies).toHaveLength(2);
      expect(channelData.quickReplies?.[0].action).toBe("message");
      expect(channelData.quickReplies?.[1].action).toBe("block");
    });

    it("should allow outputs array in channelData", () => {
      const outputs: KakaoOutput[] = [
        { simpleText: { text: "첫 번째 메시지" } },
        { simpleImage: { imageUrl: "https://example.com/image.png" } },
      ];

      const channelData: KakaoChannelData = { outputs };

      expect(channelData.outputs).toHaveLength(2);
    });

    it("should allow commerceCard in channelData", () => {
      const channelData: KakaoChannelData = {
        commerceCard: {
          title: "프리미엄 상품",
          price: 50000,
          discount: 10000,
          discountedPrice: 40000,
          thumbnails: [{ imageUrl: "https://example.com/product.png" }],
          buttons: [
            { label: "구매하기", action: "webLink", webLinkUrl: "https://shop.example.com/buy" },
          ],
        },
      };

      expect(channelData.commerceCard?.price).toBe(50000);
      expect(channelData.commerceCard?.discountedPrice).toBe(40000);
    });

    it("should allow itemCard in channelData", () => {
      const channelData: KakaoChannelData = {
        itemCard: {
          head: { title: "주문 상세" },
          itemList: [
            { title: "상품명", description: "프리미엄 세트" },
            { title: "수량", description: "1개" },
            { title: "금액", description: "50,000원" },
          ],
          itemListSummary: { title: "합계", description: "50,000원" },
          buttons: [{ label: "확인", action: "message", messageText: "확인" }],
        },
      };

      expect(channelData.itemCard?.head?.title).toBe("주문 상세");
      expect(channelData.itemCard?.itemList).toHaveLength(3);
    });

    it("should allow textCard in channelData", () => {
      const channelData: KakaoChannelData = {
        textCard: {
          title: "알림",
          description: "새로운 메시지가 도착했습니다.",
          buttons: [
            { label: "확인", action: "message", messageText: "확인" },
            { label: "무시", action: "message", messageText: "무시" },
          ],
          buttonLayout: "horizontal",
        },
      };

      expect(channelData.textCard?.title).toBe("알림");
      expect(channelData.textCard?.buttons).toHaveLength(2);
      expect(channelData.textCard?.buttonLayout).toBe("horizontal");
    });
  });
});
