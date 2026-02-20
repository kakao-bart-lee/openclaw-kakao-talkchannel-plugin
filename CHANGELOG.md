# Changelog

## [0.5.0](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/compare/kakao-talkchannel-v0.4.1...kakao-talkchannel-v0.5.0) (2026-02-20)


### Features

* /card 커맨드로 카카오 카드 메시지 빌드 지원 ([#39](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/39)) ([1b65306](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/1b6530668177b2c05fa99887612bad6aa34c61be))
* 채널 헬스 모니터 연동을 위한 connected 상태 추적 구현 ([#37](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/37)) ([e39bda9](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/e39bda92cfbb80b21660b139260bd7ada6e128b8))

## [0.4.1](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/compare/kakao-talkchannel-v0.4.0...kakao-talkchannel-v0.4.1) (2026-02-16)


### Bug Fixes

* 401/410 에러 시 토큰 무효화 및 재연결 중단 ([#34](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/34)) ([6351b44](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/6351b44509e463413b470dd78ed0ba7da69696ee))
* resolve relayToken missing error in sendReply ([#31](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/31)) ([e7d744d](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/e7d744d075586c326c0b4ae6346d0e2d4528e407))
* sendReply 401/410 에러 시 토큰 무효화 및 재연결 중단 ([0bf0bec](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/0bf0bec8245ef40cc6932774c4ff8c1b409e24ec))
* use DEFAULT_RELAY_URL constant instead of hardcoded URL ([5ead655](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/5ead655f2be066a8ee0cfa2be97662ac0d77d372))
* 페어링 성공 후 메시지 송신 시 relayToken 에러 수정 ([#31](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/31)) ([090e67a](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/090e67a979b2aaf69bae583a5797b990eb283ebb))

## [0.4.0](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/compare/kakao-talkchannel-v0.3.2...kakao-talkchannel-v0.4.0) (2026-02-08)


### Features

* OpenClaw v2026.2.6 호환성 업데이트 및 responsePrefix 지원 ([#21](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/21)) ([b94664f](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/b94664f190e15b4536e38f1f1ad65d8b327bff51))

## [0.3.2](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/compare/kakao-talkchannel-v0.3.1...kakao-talkchannel-v0.3.2) (2026-02-04)


### Bug Fixes

* SSE 버퍼 파싱, 토큰 위생처리, 메모리 관리 등 코드 리뷰 이슈 수정 ([71f647c](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/71f647c6619cc45686dfeeb02f18ecc2cc5479a7))

## [0.3.1](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/compare/kakao-talkchannel-v0.3.0...kakao-talkchannel-v0.3.1) (2026-02-04)


### Bug Fixes

* JSON 형태 카드 메시지 파싱 지원 ([#16](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/16)) ([6ddac0e](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/6ddac0e760d2fef8caec75c157bb3984d8fd1cdb))

## [0.3.0](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/compare/kakao-talkchannel-v0.2.0...kakao-talkchannel-v0.3.0) (2026-02-03)


### Features

* add sendMedia to outbound adapter and API documentation ([#15](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/15)) ([fae5831](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/fae5831e63d180365ca34eda484eb5dde8438a9c))
* configurable text chunking with multiple modes ([#13](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/13)) ([c634cd8](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/c634cd856e7eab223405980dba2c3d541df5f705)), closes [#11](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/11)
* 이미지/카드 말풍선 타입 및 마크다운 제거 기능 추가 ([#4](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/4)) ([aa15259](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/aa15259d6f903c4547c9a8943b28083b571fd1ea))


### Bug Fixes

* capabilities.media, osLink button, validation constants ([#14](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/issues/14)) ([b35a8ce](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/b35a8cece5d65a60f87c3da9c2b14a6df4173d22))

## [0.2.0](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/compare/kakao-talkchannel-v0.1.0...kakao-talkchannel-v0.2.0) (2026-02-02)


### ⚠ BREAKING CHANGES

* **relay:** SSE endpoint changed from /messages/stream to /v1/events

### Features

* initial implementation of Kakao TalkChannel plugin ([2663ae7](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/2663ae78a710e37c6a86ac716ffead6db08925b8))
* **relay:** add session-based authentication for simplified setup ([7e3982a](https://github.com/kakao-bart-lee/openclaw-kakao-talkchannel-plugin/commit/7e3982aaf216ef35059289a70ca104ed8695d3ab))
