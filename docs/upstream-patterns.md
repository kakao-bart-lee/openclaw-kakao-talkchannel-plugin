# 업스트림 채널 패턴 분석

OpenClaw 코어 및 다른 채널 플러그인(LINE, Feishu, device-pair)에서 참고할 수 있는 패턴을 정리합니다.

## LINE 플러그인 패턴

### Quick Reply 배치

LINE 플러그인은 청크 분할 시 quick reply를 **마지막 청크에만** 부착합니다.

```
chunk 1 → 전송 (quick reply 없음)
chunk 2 → 전송 (quick reply 없음)
chunk 3 → 전송 (quick reply 부착)
```

**카카오 적용 가능성**: 현재 카카오 플러그인은 단일 응답에 quick reply를 포함하므로 즉시 적용 불필요. 다만 멀티 청크 응답 시 동일 패턴 적용을 검토할 수 있음.

### Flex Message 빌더

LINE은 구조화된 메시지를 Flex Message JSON으로 변환하는 빌더 유틸리티를 제공합니다.

**카카오 적용 가능성**: 카카오 카드 빌더 유틸리티(`src/kakao/payload.ts`)에 해당하며, 현재 `tryParseKakaoCard()`로 구현되어 있음.

## Feishu 플러그인 패턴

### 미디어 전송 폴백

Feishu는 미디어(이미지, 파일) 전송 실패 시 **URL 텍스트로 폴백**합니다:

```
이미지 전송 시도 → 실패 → "[이미지] https://example.com/img.jpg" 텍스트 전송
```

**카카오 적용 가능성**: `sendPayload()` 구현 시 미디어 전송 실패 폴백으로 적용 가능. 우선순위: 중간.

### Typing Indicator

Feishu는 응답 생성 중 타이핑 인디케이터를 표시합니다.

**카카오 적용 가능성**: 카카오 챗봇 API에는 타이핑 인디케이터가 없으므로 적용 불가.

## device-pair 플러그인 패턴

### registerCommand

`registerCommand()`를 사용하여 채널별 커맨드를 OpenClaw 커맨드 시스템에 등록합니다:

```typescript
api.registerCommand({
  name: "pair",
  description: "페어링 코드로 연결",
  handler: async (ctx) => { /* ... */ },
});
```

**카카오 적용 가능성**: 현재 `/help`, `/session` 등의 커맨드를 gateway 내부에서 처리 중. `registerCommand`로 전환하면 코어의 커맨드 검색/자동완성 기능과 연동 가능. 우선순위: 높음.

## 적용 로드맵

| 우선순위 | 패턴 | 출처 | 상태 |
|---------|------|------|------|
| 높음 | `registerCommand` 기반 커맨드 등록 | device-pair | 타입 정의 완료 (gateway 미연동) |
| 높음 | `sendPayload` 채널 어댑터 메서드 | 코어 인터페이스 | 인터페이스 + no-op 스텁 (미구현) |
| 중간 | 미디어 전송 URL 폴백 | Feishu | 향후 구현 |
| 낮음 | Quick reply 마지막 청크 배치 | LINE | 멀티청크 지원 시 |
| 불가 | Typing indicator | Feishu | 카카오 API 미지원 |

## 후속 작업

- [ ] `registerCommand`로 기존 `/help`, `/session` 등 커맨드 마이그레이션
- [ ] `sendPayload()` 본격 구현 (카카오 카드 + simpleText 지원)
- [ ] 미디어 전송 실패 시 URL 폴백 로직 추가
- [ ] 멀티 청크 응답 시 quick reply 마지막 청크 배치
