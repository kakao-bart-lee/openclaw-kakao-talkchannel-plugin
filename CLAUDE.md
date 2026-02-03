# Kakao TalkChannel - 에이전트 가이드

카카오톡 채널로 다양한 형태의 메시지를 보낼 수 있습니다.

## ⚠️ 중요 규칙

**카드 메시지를 보낼 때는 JSON만 단독으로 보내세요.**

```
❌ 잘못된 예:
"결과입니다! {"textCard":{"title":"결과"}}"

✅ 올바른 예:
{"textCard":{"title":"결과","description":"설명"}}
```

일반 텍스트와 JSON을 섞으면 카드로 변환되지 않습니다.

---

## 말풍선 타입

### 1. 일반 텍스트 (기본)
그냥 텍스트로 응답하면 됩니다.
```
안녕하세요! 무엇을 도와드릴까요?
```

### 2. textCard - 텍스트 카드
텍스트와 버튼을 함께 보여줍니다.

```json
{"textCard":{"title":"제목","description":"설명 텍스트","buttons":[{"label":"버튼1","action":"message","messageText":"버튼1 클릭"}]}}
```

### 3. basicCard - 이미지 카드
썸네일 이미지와 텍스트, 버튼을 함께 보여줍니다.

```json
{"basicCard":{"title":"제목","description":"설명","thumbnail":{"imageUrl":"https://example.com/image.jpg"},"buttons":[{"label":"자세히 보기","action":"webLink","webLinkUrl":"https://example.com"}]}}
```

### 4. listCard - 리스트 카드
여러 항목을 리스트로 보여줍니다.

```json
{"listCard":{"header":{"title":"리스트 제목"},"items":[{"title":"항목 1","description":"설명 1"},{"title":"항목 2","description":"설명 2"}],"buttons":[{"label":"더보기","action":"webLink","webLinkUrl":"https://example.com"}]}}
```

### 5. commerceCard - 커머스 카드
상품 정보를 보여줍니다.

```json
{"commerceCard":{"title":"상품명","description":"상품 설명","price":15000,"discount":2000,"thumbnails":[{"imageUrl":"https://example.com/product.jpg"}],"buttons":[{"label":"구매하기","action":"webLink","webLinkUrl":"https://example.com/buy"}]}}
```

### 6. simpleImage - 이미지만
이미지만 보내고 싶을 때 사용합니다.

```json
{"simpleImage":{"imageUrl":"https://example.com/image.jpg","altText":"이미지 설명"}}
```

### 7. carousel - 캐러셀 (슬라이드)
여러 카드를 좌우로 넘길 수 있게 보여줍니다.

```json
{"carousel":{"type":"basicCard","items":[{"title":"카드1","thumbnail":{"imageUrl":"https://example.com/1.jpg"}},{"title":"카드2","thumbnail":{"imageUrl":"https://example.com/2.jpg"}}]}}
```

---

## 버튼 타입

| action | 설명 | 필수 필드 |
|--------|------|-----------|
| `message` | 사용자가 메시지 전송 | `messageText` |
| `webLink` | 웹페이지 열기 | `webLinkUrl` |
| `phone` | 전화 걸기 | `phoneNumber` |
| `share` | 공유하기 | - |
| `operator` | 상담원 연결 | - |

### 버튼 예시
```json
{"label":"홈페이지","action":"webLink","webLinkUrl":"https://example.com"}
{"label":"전화하기","action":"phone","phoneNumber":"02-1234-5678"}
{"label":"선택","action":"message","messageText":"이것을 선택합니다"}
```

---

## quickReplies - 빠른 응답 버튼

카드 하단에 빠른 선택 버튼을 추가합니다. 최대 10개.

```json
{"textCard":{"title":"어떤 것을 선택하시겠어요?"},"quickReplies":[{"label":"옵션 A","action":"message","messageText":"A 선택"},{"label":"옵션 B","action":"message","messageText":"B 선택"},{"label":"옵션 C","action":"message","messageText":"C 선택"}]}
```

---

## 언제 카드를 사용하나요?

### 카드 사용 ✅
- 사용자에게 선택지를 제공할 때
- 버튼이 필요한 액션이 있을 때
- 이미지와 함께 정보를 보여줄 때
- 리스트 형태의 데이터를 보여줄 때
- 상품/서비스 정보를 보여줄 때

### 일반 텍스트 사용 ✅
- 일반 대화
- 간단한 답변
- 긴 설명이 필요할 때
- 코드나 로그를 보여줄 때

---

## 제한사항

- 한 번에 최대 3개의 말풍선 (outputs)
- quickReplies 최대 10개
- 버튼 최대 3개 (카드당)
- carousel 아이템 최대 10개
