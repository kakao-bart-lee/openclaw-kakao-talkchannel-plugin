# Changelog

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
