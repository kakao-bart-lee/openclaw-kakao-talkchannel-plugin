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
  buildListCardResponse,
  buildCarouselResponse,
} from "../../../src/kakao/response";
import type { KakaoSkillResponse } from "../../../src/types";

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

    it("should include buttons when provided", () => {
      const response = buildTextCardResponse({
        title: "Card",
        buttons: [{ label: "Click", action: "message", messageText: "clicked" }],
      });

      const textCard = (response.template?.outputs[0] as { textCard: { buttons: unknown[] } }).textCard;
      expect(textCard.buttons).toHaveLength(1);
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
  });
});
