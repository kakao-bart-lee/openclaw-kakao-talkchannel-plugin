# channelData.kakao Pattern

OpenClaw plugins use `channelData` to send platform-specific responses. For Kakao, use `channelData.kakao`.

## Basic Usage

```typescript
// In your OpenClaw agent action
return {
  text: "기본 텍스트 (폴백용)",
  channelData: {
    kakao: {
      // Kakao-specific outputs here
    }
  }
};
```

## Priority Order

When `channelData.kakao` is present, the gateway builds outputs in this order:

1. **`outputs` array** (highest priority) - Direct control over all outputs
2. **Individual card fields** - Convenience shorthand for single cards
3. **Fallback** - `text` and `mediaUrls` from payload

## Using `outputs` Array (Full Control)

```typescript
channelData: {
  kakao: {
    outputs: [
      { simpleText: { text: "첫 번째 메시지" } },
      { simpleImage: { imageUrl: "https://...", altText: "이미지" } },
      { textCard: { title: "카드 제목", description: "설명" } }
    ],
    quickReplies: [
      { label: "네", action: "message", messageText: "네" },
      { label: "아니오", action: "message", messageText: "아니오" }
    ]
  }
}
```

## Using Individual Fields (Shorthand)

For simpler cases, use individual fields instead of the `outputs` array:

```typescript
// Single simpleText
channelData: {
  kakao: {
    simpleText: { text: "간단한 텍스트" }
  }
}

// Single basicCard
channelData: {
  kakao: {
    basicCard: {
      title: "상품명",
      description: "상품 설명",
      thumbnail: { imageUrl: "https://..." },
      buttons: [
        { label: "구매", action: "webLink", webLinkUrl: "https://..." }
      ]
    }
  }
}

// Multiple types (all converted to outputs)
channelData: {
  kakao: {
    simpleText: { text: "안내 메시지" },
    basicCard: { title: "추천 상품", thumbnail: { imageUrl: "..." } }
  }
}
```

## Available Fields

| Field | Type | Description |
|-------|------|-------------|
| `outputs` | `KakaoOutput[]` | Direct outputs array (max 3) |
| `quickReplies` | `KakaoQuickReply[]` | Quick reply buttons (max 10) |
| `simpleText` | object | Simple text message |
| `simpleImage` | object | Simple image |
| `textCard` | object | Text card with optional buttons |
| `basicCard` | object | Card with thumbnail and buttons |
| `commerceCard` | object | Commerce/product card |
| `listCard` | object | List card with items |
| `itemCard` | object | Item detail card |
| `carousel` | object | Carousel of cards |

## Interface Definition

```typescript
interface KakaoChannelData {
  // Direct outputs (highest priority)
  outputs?: KakaoOutput[];
  quickReplies?: KakaoQuickReply[];

  // Individual card shortcuts
  simpleText?: { text: string };
  simpleImage?: { imageUrl: string; altText?: string };
  textCard?: { title?: string; description?: string; buttons?: KakaoButton[] };
  basicCard?: { title?: string; description?: string; thumbnail: KakaoThumbnail; buttons?: KakaoButton[] };
  commerceCard?: { /* ... */ };
  listCard?: { /* ... */ };
  itemCard?: { /* ... */ };
  carousel?: { type: string; items: any[] };
}
```

## Examples

### Text with Quick Replies

```typescript
channelData: {
  kakao: {
    simpleText: { text: "어떤 것을 도와드릴까요?" },
    quickReplies: [
      { label: "주문 조회", action: "message", messageText: "주문 조회" },
      { label: "상담원 연결", action: "message", messageText: "상담원" },
      { label: "FAQ", action: "block", blockId: "faq_block_id" }
    ]
  }
}
```

### Product Recommendation

```typescript
channelData: {
  kakao: {
    basicCard: {
      title: "추천 상품",
      description: "오늘의 베스트 상품입니다",
      thumbnail: { 
        imageUrl: "https://shop.example.com/product.jpg",
        link: { web: "https://shop.example.com/product" }
      },
      buttons: [
        { label: "구매하기", action: "webLink", webLinkUrl: "https://shop.example.com/buy" },
        { label: "장바구니", action: "message", messageText: "장바구니 담기" }
      ]
    }
  }
}
```

### Multiple Messages

```typescript
channelData: {
  kakao: {
    outputs: [
      { simpleText: { text: "검색 결과입니다." } },
      { 
        basicCard: {
          title: "결과 1",
          thumbnail: { imageUrl: "https://..." },
          buttons: [{ label: "자세히", action: "webLink", webLinkUrl: "..." }]
        }
      },
      {
        basicCard: {
          title: "결과 2", 
          thumbnail: { imageUrl: "https://..." },
          buttons: [{ label: "자세히", action: "webLink", webLinkUrl: "..." }]
        }
      }
    ]
  }
}
```

## Limits

| Limit | Value |
|-------|-------|
| Max outputs | 3 |
| Max quick replies | 10 |
| Quick reply label | 14 chars |
| simpleText max | 1000 chars |
| Card title | 50 chars |
| Card description | 230 chars |
| Button label | 14 chars |

See [API Reference](./api-reference.md) for `KAKAO_LIMITS` constants.

## Fallback Behavior

If `channelData.kakao` is empty or not provided:

1. `mediaUrls` → converted to `simpleImage` outputs
2. `text` → stripped of markdown, converted to `simpleText`

```typescript
// This payload...
{
  text: "**Bold** text",
  mediaUrls: ["https://example.com/image.jpg"]
}

// ...becomes this Kakao response:
{
  version: "2.0",
  template: {
    outputs: [
      { simpleImage: { imageUrl: "https://example.com/image.jpg" } },
      { simpleText: { text: "Bold text" } }
    ]
  }
}
```
