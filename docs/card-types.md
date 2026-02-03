# Kakao Card Types

Complete examples for all Kakao 오픈빌더 card types supported by this plugin.

## simpleText

Basic text message.

```typescript
{
  simpleText: {
    text: "안녕하세요! 무엇을 도와드릴까요?"
  }
}
```

**Limits:**
- `text`: max 1000 chars (400 visible without "더보기")

## simpleImage

Single image message.

```typescript
{
  simpleImage: {
    imageUrl: "https://example.com/image.jpg",
    altText: "이미지 설명"  // optional
  }
}
```

**Requirements:**
- `imageUrl`: HTTPS URL, must be publicly accessible
- Supported formats: JPG, PNG

## textCard

Card with text and optional buttons (no thumbnail).

```typescript
{
  textCard: {
    title: "알림",                    // optional, max 50 chars
    description: "새로운 메시지가 도착했습니다.\n확인해주세요.",  // optional, max 230 chars
    buttons: [                        // optional, max 3
      { label: "확인", action: "message", messageText: "확인" },
      { label: "나중에", action: "message", messageText: "나중에" }
    ],
    buttonLayout: "horizontal"        // optional: "horizontal" | "vertical"
  }
}
```

## basicCard

Card with thumbnail image, text, and buttons.

```typescript
{
  basicCard: {
    title: "오늘의 추천 상품",         // optional, max 50 chars
    description: "신선한 과일 세트",   // optional, max 230 chars
    thumbnail: {                      // required
      imageUrl: "https://example.com/fruit.jpg",
      altText: "과일 세트 이미지",    // optional
      width: 800,                     // optional
      height: 600,                    // optional
      fixedRatio: true,               // optional
      link: {                         // optional - click action
        web: "https://shop.example.com/product/123"
      }
    },
    buttons: [
      { 
        label: "구매하기", 
        action: "webLink", 
        webLinkUrl: "https://shop.example.com/buy/123" 
      },
      { 
        label: "장바구니", 
        action: "message", 
        messageText: "장바구니에 담아주세요" 
      }
    ],
    buttonLayout: "horizontal"
  }
}
```

## commerceCard

Product/commerce card with price information.

```typescript
{
  commerceCard: {
    title: "프리미엄 선물 세트",
    description: "엄선된 재료로 만든 선물 세트",
    price: 50000,                     // required
    currency: "won",                  // optional, default "won"
    discount: 10000,                  // optional - discount amount
    discountRate: 20,                 // optional - discount percentage  
    discountedPrice: 40000,           // optional - final price
    thumbnails: [                     // required, array
      {
        imageUrl: "https://example.com/gift-set.jpg",
        altText: "선물 세트"
      }
    ],
    profile: {                        // optional - seller info
      imageUrl: "https://example.com/shop-logo.png",
      nickname: "프리미엄 샵",
      title: "공식 판매처"
    },
    buttons: [
      { label: "구매", action: "webLink", webLinkUrl: "https://..." },
      { label: "문의", action: "phone", phoneNumber: "02-1234-5678" }
    ]
  }
}
```

## listCard

Card with header and list items.

```typescript
{
  listCard: {
    header: {                         // required
      title: "주문 내역",
      imageUrl: "https://example.com/order-icon.png"  // optional
    },
    items: [                          // required, 2-5 items
      {
        title: "아메리카노",
        description: "ICE / Grande",
        imageUrl: "https://example.com/americano.jpg",
        link: { web: "https://..." },
        action: "message",
        messageText: "아메리카노 재주문"
      },
      {
        title: "카페라떼",
        description: "HOT / Tall",
        imageUrl: "https://example.com/latte.jpg"
      },
      {
        title: "캐모마일",
        description: "HOT / Grande"
      }
    ],
    buttons: [
      { label: "전체 내역", action: "webLink", webLinkUrl: "https://..." },
      { label: "재주문", action: "message", messageText: "재주문" }
    ]
  }
}
```

**Limits:**
- `items`: min 2, max 5

## itemCard

Detailed item card for receipts, tickets, etc.

```typescript
{
  itemCard: {
    thumbnail: {
      imageUrl: "https://example.com/receipt-bg.jpg"
    },
    head: {
      title: "결제 완료"
    },
    profile: {
      imageUrl: "https://example.com/shop-logo.png",
      nickname: "카페 오픈클로"
    },
    imageTitle: {
      title: "주문번호: A-1234",
      description: "2024년 1월 15일",
      imageUrl: "https://example.com/qr-code.png"
    },
    itemList: [                       // required
      { title: "아메리카노", description: "4,500원" },
      { title: "카페라떼", description: "5,000원" },
      { title: "케이크", description: "6,500원" }
    ],
    itemListAlignment: "right",       // optional: "left" | "right"
    itemListSummary: {                // optional
      title: "총 결제금액",
      description: "16,000원"
    },
    title: "감사합니다",              // optional
    description: "다음에 또 방문해주세요",  // optional
    buttons: [
      { label: "영수증 보기", action: "webLink", webLinkUrl: "https://..." },
      { label: "리뷰 작성", action: "message", messageText: "리뷰 작성" }
    ]
  }
}
```

## carousel

Scrollable horizontal list of cards.

```typescript
{
  carousel: {
    type: "basicCard",                // required: "basicCard" | "commerceCard" | "itemCard" | "textCard"
    items: [                          // 2-10 items
      {
        // basicCard fields (without "basicCard" wrapper)
        title: "상품 1",
        description: "첫 번째 상품",
        thumbnail: { imageUrl: "https://example.com/1.jpg" },
        buttons: [
          { label: "보기", action: "webLink", webLinkUrl: "https://..." }
        ]
      },
      {
        title: "상품 2",
        description: "두 번째 상품",
        thumbnail: { imageUrl: "https://example.com/2.jpg" },
        buttons: [
          { label: "보기", action: "webLink", webLinkUrl: "https://..." }
        ]
      },
      {
        title: "상품 3",
        description: "세 번째 상품",
        thumbnail: { imageUrl: "https://example.com/3.jpg" },
        buttons: [
          { label: "보기", action: "webLink", webLinkUrl: "https://..." }
        ]
      }
    ]
  }
}
```

**Limits:**
- `items`: min 2, max 10

### textCard Carousel

```typescript
{
  carousel: {
    type: "textCard",
    items: [
      {
        title: "FAQ 1",
        description: "자주 묻는 질문 1에 대한 답변입니다.",
        buttons: [{ label: "자세히", action: "message", messageText: "FAQ1 자세히" }]
      },
      {
        title: "FAQ 2", 
        description: "자주 묻는 질문 2에 대한 답변입니다.",
        buttons: [{ label: "자세히", action: "message", messageText: "FAQ2 자세히" }]
      }
    ]
  }
}
```

## Button Types

All cards support these button actions:

```typescript
// Web link
{ label: "웹사이트", action: "webLink", webLinkUrl: "https://example.com" }

// Send message
{ label: "메시지", action: "message", messageText: "보낼 메시지" }

// Trigger block
{ label: "블록", action: "block", blockId: "block_id_here" }

// Share
{ label: "공유", action: "share" }

// Phone call
{ label: "전화", action: "phone", phoneNumber: "02-1234-5678" }

// Connect to operator
{ label: "상담원", action: "operator" }

// OS-specific link (app deep link)
{ 
  label: "앱 열기", 
  action: "osLink", 
  osLink: { 
    ios: "myapp://path",
    android: "myapp://path"
  }
}
```

**Limits:**
- `label`: max 14 chars
- Max buttons per card: 3

## Quick Replies

Add quick reply buttons to any response:

```typescript
{
  outputs: [
    { simpleText: { text: "어떤 것을 선택하시겠어요?" } }
  ],
  quickReplies: [
    { label: "옵션 1", action: "message", messageText: "옵션 1 선택" },
    { label: "옵션 2", action: "message", messageText: "옵션 2 선택" },
    { label: "취소", action: "message", messageText: "취소" }
  ]
}
```

**Quick Reply Actions:**
- `message`: Send messageText
- `block`: Trigger blockId

**Limits:**
- Max 10 quick replies
- Label max 14 chars

## Complete Limits Reference

| Element | Limit |
|---------|-------|
| Outputs per response | 3 |
| simpleText text | 1000 chars |
| Card title | 50 chars |
| Card description | 230 chars |
| Button label | 14 chars |
| Buttons per card | 3 |
| Quick replies | 10 |
| Quick reply label | 14 chars |
| Carousel items | 2-10 |
| List items | 2-5 |

See [API Reference](./api-reference.md) for validation functions.
