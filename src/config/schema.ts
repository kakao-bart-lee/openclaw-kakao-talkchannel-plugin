/**
 * Zod schemas for Kakao plugin configuration validation
 *
 * Simplified: Single channel + Relay mode only
 * Direct mode and multi-channel support are planned for future releases.
 */
import { z } from "zod";

export const DEFAULT_RELAY_URL = "https://k.tess.dev/";

/**
 * Single account configuration schema
 */
export const KakaoAccountConfigSchema = z.object({
  // ─────────────────────────────────────────────────────────────
  // 사용자 설정 (문서화됨)
  // ─────────────────────────────────────────────────────────────
  /** 채널 활성화 여부 */
  enabled: z.boolean().default(true),

  /** DM 정책: pairing(페어링 필요), allowlist(허용 목록), open(모두 허용), disabled(비활성) */
  dmPolicy: z.enum(["pairing", "allowlist", "open", "disabled"]).default("pairing"),

  /** dmPolicy가 "allowlist"일 때 허용할 사용자 ID 목록 */
  allowFrom: z.array(z.string()).optional(),

  /**
   * 응답 접두사 — OpenClaw 코어가 configSchema에서 직접 읽어
   * 에이전트 응답 앞에 자동 삽입한다. 플러그인 런타임에서 별도 처리 불필요.
   */
  responsePrefix: z.string().optional(),

  // ─────────────────────────────────────────────────────────────
  // 고급 설정 (대부분의 사용자는 설정 불필요)
  // ─────────────────────────────────────────────────────────────
  /** @advanced 채널 식별자 (선택) - 페어링 기반 식별 시 불필요 */
  channelId: z.string().min(1, "channelId는 필수입니다").optional(),

  /** @advanced 릴레이 서버 URL - 기본값 사용 권장 */
  relayUrl: z.string().default(DEFAULT_RELAY_URL),

  /** @advanced 릴레이 인증 토큰 - 환경변수 OPENCLAW_TALKCHANNEL_RELAY_TOKEN 사용 권장 */
  relayToken: z.string().optional(),

  // ─────────────────────────────────────────────────────────────
  // 내부 설정 (자동 관리, 문서화하지 않음)
  // ─────────────────────────────────────────────────────────────
  /** @internal 세션 토큰 - 자동 생성됨 */
  sessionToken: z.string().optional(),

  /** @internal SSE 재연결 초기 지연 시간 (ms) */
  reconnectDelayMs: z.number().min(500).max(10000).default(1000),

  /** @internal SSE 재연결 최대 지연 시간 (ms) */
  maxReconnectDelayMs: z.number().min(5000).max(60000).default(30000),

  // ─────────────────────────────────────────────────────────────
  // 텍스트 처리 설정
  // ─────────────────────────────────────────────────────────────
  /** 텍스트 청크 최대 길이 (카카오 simpleText: 400자 표시, 1000자 전체) */
  textChunkLimit: z.number()
    .min(100, "textChunkLimit은 최소 100자 이상이어야 합니다")
    .max(1000, "textChunkLimit은 최대 1000자 이하여야 합니다")
    .default(400),

  /** 텍스트 청킹 모드: sentence(문장 경계), newline(빈 줄), length(정확한 길이) */
  chunkMode: z.enum(["sentence", "newline", "length"]).default("sentence"),
});

/**
 * Full channel configuration schema with accounts wrapper
 *
 * Structure: channels.kakao-talkchannel.accounts.<accountId>
 */
export const KakaoChannelConfigSchema = z.object({
  accounts: z.record(z.string(), KakaoAccountConfigSchema).optional(),
});

/**
 * Inferred types from schemas
 */
export type KakaoAccountConfig = z.infer<typeof KakaoAccountConfigSchema>;
export type KakaoChannelConfig = z.infer<typeof KakaoChannelConfigSchema>;

// Re-export for backwards compatibility
export { KakaoAccountConfigSchema as KakaoTalkChannelConfigSchema };

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: string[] };

/**
 * Format Zod validation errors into readable strings
 */
function formatZodErrors(issues: z.ZodIssue[]): string[] {
  return issues.map(issue => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

/**
 * Validate account configuration with friendly error messages
 */
export function validateAccountConfig(input: unknown): ValidationResult<KakaoAccountConfig> {
  const result = KakaoAccountConfigSchema.safeParse(input);

  if (result.success) {
    return { ok: true, data: result.data };
  }

  return { ok: false, errors: formatZodErrors(result.error.issues) };
}

/**
 * Validate full channel configuration with friendly error messages
 */
export function validateChannelConfig(input: unknown): ValidationResult<KakaoChannelConfig> {
  const result = KakaoChannelConfigSchema.safeParse(input);

  if (result.success) {
    return { ok: true, data: result.data };
  }

  return { ok: false, errors: formatZodErrors(result.error.issues) };
}
