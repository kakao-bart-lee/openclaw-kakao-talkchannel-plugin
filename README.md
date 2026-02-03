# OpenClaw Kakao TalkChannel Plugin

카카오톡 채널을 OpenClaw에 연결하는 플러그인입니다.

[English](./README.en.md)

---

## 사용자 가이드

### 설치

OpenClaw에게 말하세요:

> "카카오톡 플러그인 설치해줘"

그게 끝입니다. OpenClaw가 알아서 설치합니다.

### 카카오톡 연결

1. OpenClaw에게 **"카카오톡 연결해줘"**
2. OpenClaw가 페어링 코드 제공 (예: `ABCD-1234`)
3. [카카오톡 채널](http://pf.kakao.com/_scexbC) 접속
4. 채팅창에 `/pair ABCD-1234` 입력
5. 연결 완료!

> **중요**: 반드시 OpenClaw가 먼저 코드를 생성합니다.

### 문제 해결

| 문제 | OpenClaw에게 요청 |
|------|------------------|
| 플러그인이 안 됨 | "플러그인 진단해줘" |
| 채널이 안 보임 | "게이트웨이 재시작해줘" |
| 페어링이 안 됨 | "카카오톡 연결해줘" (처음부터 다시) |

---

## OpenClaw 에이전트 가이드

> 이 섹션은 OpenClaw가 참조하는 자동화 지침입니다.

### 플러그인 설치 요청 시

사용자가 "카카오톡 플러그인 설치", "카톡 연동" 등을 요청하면:

```bash
# 1. 설치
openclaw plugins install @openclaw/kakao-talkchannel

# 2. 확인 (kakao-talkchannel이 loaded 상태인지)
openclaw plugins list

# 3. 게이트웨이 재시작
openclaw gateway restart

# 4. 채널 확인
openclaw channels list
```

### 카카오톡 연결 요청 시

사용자가 "카카오톡 연결", "카톡 연동" 등을 요청하면:

1. 페어링 코드 생성
2. 사용자에게 안내:
   > "카카오톡 채널(http://pf.kakao.com/_scexbC)에서 `/pair {코드}`를 입력하세요"
3. 페어링 완료 대기

### 로컬 플러그인 설치 요청 시

사용자가 경로를 지정하며 로컬 설치를 요청하면:

```bash
# 링크 모드 (개발용, 소스 수정 즉시 반영)
openclaw plugins install -l {경로}

# 복사 모드
openclaw plugins install {경로}
```

---

## 카드 메시지

에이전트가 JSON 형식으로 응답하면 카카오톡 카드로 자동 변환됩니다.

### 지원 카드 타입

| 타입 | 설명 |
|------|------|
| `textCard` | 텍스트 + 버튼 |
| `basicCard` | 이미지 + 텍스트 + 버튼 |
| `listCard` | 리스트 형태 |
| `commerceCard` | 상품 카드 |
| `simpleImage` | 이미지만 |
| `carousel` | 여러 카드 슬라이드 |

### 예시: textCard

```json
{"textCard":{"title":"제목","description":"설명","buttons":[{"label":"버튼","action":"message","messageText":"클릭!"}]}}
```

### 예시: basicCard

```json
{"basicCard":{"title":"제목","description":"설명","thumbnail":{"imageUrl":"https://example.com/image.jpg"},"buttons":[{"label":"자세히","action":"webLink","webLinkUrl":"https://example.com"}]}}
```

### 버튼 액션

| action | 설명 | 필수 필드 |
|--------|------|-----------|
| `message` | 메시지 전송 | `messageText` |
| `webLink` | 웹 링크 | `webLinkUrl` |
| `phone` | 전화 걸기 | `phoneNumber` |
| `share` | 공유하기 | - |

### quickReplies (빠른 응답)

```json
{"textCard":{"title":"선택하세요"},"quickReplies":[{"label":"A","action":"message","messageText":"A"},{"label":"B","action":"message","messageText":"B"}]}
```

> **참고**: 일반 텍스트는 그대로 전송됩니다. JSON 형식일 때만 카드로 변환됩니다.
> 
> **주의**: 카드를 보낼 때는 JSON만 단독으로 보내야 합니다. 텍스트와 섞으면 변환되지 않습니다.

자세한 내용은 [CLAUDE.md](./CLAUDE.md)를 참조하세요.

---

## 설정 레퍼런스

대부분의 경우 설정이 필요 없습니다. 설치 후 바로 사용 가능합니다.

### 설정 파일 위치

`~/.openclaw/openclaw.json` 또는 `config.yaml`

### 사용자 설정

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `enabled` | 채널 활성화 | `true` |
| `dmPolicy` | DM 정책 | `"pairing"` |
| `allowFrom` | 허용 사용자 목록 (`allowlist` 모드) | - |

#### dmPolicy 옵션

| 값 | 설명 |
|----|------|
| `pairing` | 페어링된 사용자만 (기본값, 권장) |
| `allowlist` | `allowFrom` 목록의 사용자만 |
| `open` | 모든 사용자 |
| `disabled` | DM 비활성화 |

### 고급 설정 (대부분 불필요)

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `channelId` | 채널 식별자 | 자동 |
| `relayUrl` | 릴레이 서버 | `https://k.tess.dev/` |
| `relayToken` | 릴레이 토큰 | 환경변수 또는 자동 |

### 설정 예시

```json
{
  "channels": {
    "kakao-talkchannel": {
      "accounts": {
        "default": {
          "enabled": true,
          "dmPolicy": "pairing"
        }
      }
    }
  }
}
```

---

## 라이선스

MIT
