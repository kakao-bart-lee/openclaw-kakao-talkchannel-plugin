# API Reference

## Response Builders

### `buildSimpleTextResponse(text: string)`

Build a Kakao SkillResponse with simpleText output.

```typescript
import { buildSimpleTextResponse } from "@openclaw/kakao-talkchannel";

const response = buildSimpleTextResponse("안녕하세요!");
// { version: "2.0", template: { outputs: [{ simpleText: { text: "안녕하세요!" } }] } }
```

### `buildSimpleImageResponse(imageUrl: string, altText?: string)`

Build a response with simpleImage output.

```typescript
const response = buildSimpleImageResponse(
  "https://example.com/image.jpg",
  "상품 이미지"
);
```

### `buildTextCardResponse(options)`

Build a response with textCard output.

```typescript
const response = buildTextCardResponse({
  title: "알림",
  description: "새로운 메시지가 있습니다.",
  buttons: [
    { label: "확인", action: "message", messageText: "확인했습니다" }
  ]
});
```

### `buildBasicCardResponse(options)`

Build a response with basicCard output.

```typescript
const response = buildBasicCardResponse({
  title: "상품명",
  description: "상품 설명",
  thumbnail: { imageUrl: "https://example.com/thumb.jpg" },
  buttons: [
    { label: "구매하기", action: "webLink", webLinkUrl: "https://shop.example.com" }
  ]
});
```

### `buildCarouselResponse(type, items)`

Build a response with carousel output.

```typescript
const response = buildCarouselResponse("basicCard", [
  { basicCard: { title: "상품1", thumbnail: { imageUrl: "..." } } },
  { basicCard: { title: "상품2", thumbnail: { imageUrl: "..." } } },
]);
```

## Text Processing

### `chunkTextForKakao(text, limit?, mode?)`

Split text into chunks respecting Kakao's character limits.

```typescript
import { chunkTextForKakao } from "@openclaw/kakao-talkchannel";

// Default: 400 chars, sentence mode
const chunks = chunkTextForKakao(longText);

// Custom limit and mode
const chunks = chunkTextForKakao(longText, 500, "newline");
```

**Modes:**
- `sentence` (default): Split at sentence boundaries (. ! ?)
- `newline`: Split at paragraph boundaries (blank lines)
- `length`: Hard split at exact character limit

### `stripMarkdown(text: string)`

Remove markdown formatting for Kakao (which doesn't support markdown).

```typescript
import { stripMarkdown } from "@openclaw/kakao-talkchannel";

const plain = stripMarkdown("**Bold** and *italic*");
// "Bold and italic"
```

## Validation

### `KAKAO_LIMITS`

Constants for Kakao API limits.

```typescript
import { KAKAO_LIMITS } from "@openclaw/kakao-talkchannel";

KAKAO_LIMITS.SIMPLE_TEXT_MAX      // 1000
KAKAO_LIMITS.SIMPLE_TEXT_VISIBLE  // 400
KAKAO_LIMITS.CARD_TITLE           // 50
KAKAO_LIMITS.CARD_DESCRIPTION     // 230
KAKAO_LIMITS.BUTTON_LABEL         // 14
KAKAO_LIMITS.QUICK_REPLY_LABEL    // 14
KAKAO_LIMITS.QUICK_REPLIES_MAX    // 10
KAKAO_LIMITS.OUTPUTS_MAX          // 3
KAKAO_LIMITS.CAROUSEL_MIN         // 2
KAKAO_LIMITS.CAROUSEL_MAX         // 10
KAKAO_LIMITS.LIST_ITEMS_MIN       // 2
KAKAO_LIMITS.LIST_ITEMS_MAX       // 5
```

### Validation Functions

```typescript
import {
  validateSimpleText,
  validateCardTitle,
  validateButton,
  validateQuickReplies,
} from "@openclaw/kakao-talkchannel";

const result = validateSimpleText(text);
if (!result.valid) {
  console.error(result.error);
}
```

## Types

### `KakaoSkillPayload`

Incoming message from Kakao.

```typescript
interface KakaoSkillPayload {
  intent: KakaoIntent;
  userRequest: KakaoUserRequest;
  bot: KakaoBot;
  action: KakaoAction;
}
```

### `KakaoSkillResponse`

Response to send back to Kakao.

```typescript
interface KakaoSkillResponse {
  version: "2.0";
  useCallback?: boolean;
  template?: KakaoSkillTemplate;
  context?: KakaoContextControl;
  data?: Record<string, unknown>;
}
```

### `KakaoButton`

Button configuration.

```typescript
interface KakaoButton {
  label: string;
  action: "webLink" | "message" | "block" | "share" | "phone" | "operator" | "osLink";
  webLinkUrl?: string;
  messageText?: string;
  blockId?: string;
  phoneNumber?: string;
  osLink?: { ios?: string; android?: string };
  extra?: Record<string, unknown>;
}
```

### `KakaoQuickReply`

Quick reply configuration.

```typescript
interface KakaoQuickReply {
  label: string;
  action: "message" | "block";
  messageText?: string;
  blockId?: string;
  extra?: Record<string, unknown>;
}
```
