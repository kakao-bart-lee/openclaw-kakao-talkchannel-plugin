import type { ResolvedKakaoTalkChannel, InboundMessage } from "../types.js";
import { connectSSE } from "./sse.js";
import { getKakaoRuntime } from "../runtime.js";
import { createSession, DEFAULT_RELAY_URL } from "./session.js";

export interface StreamOptions {
  maxRetries?: number;
}

export interface StreamCallbacks {
  onPairingRequired?: (pairingCode: string, expiresIn: number) => void;
  onPairingComplete?: (kakaoUserId: string) => void;
  onPairingExpired?: (reason: string) => void;
  onTokenResolved?: (sessionToken: string, relayUrl: string) => void;
  onSessionInvalidated?: (status: number) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

const DEFAULT_STREAM_OPTIONS: Required<StreamOptions> = {
  maxRetries: 10,
};

/**
 * Sanitize tokens and sensitive values from log messages.
 * Masks Bearer tokens, token= params, sessionToken= params, and UUID-like patterns in auth context.
 */
export function sanitizeTokenFromLog(message: string): string {
  let sanitized = message;
  // Authorization header with Bearer (match the whole "Authorization: Bearer <token>")
  sanitized = sanitized.replace(/Authorization:\s*Bearer\s+[^\s,;]+/gi, "Authorization: ***");
  // Standalone Bearer token pattern (not preceded by "Authorization:")
  sanitized = sanitized.replace(/Bearer\s+[^\s,;]+/gi, "Bearer ***");
  // sessionToken=<value> pattern
  sanitized = sanitized.replace(/sessionToken=[^&\s]+/gi, "sessionToken=***");
  // token=<value> pattern (query params) — exclude already-handled sessionToken
  sanitized = sanitized.replace(/(?<!session)token=[^&\s]+/gi, "token=***");
  return sanitized;
}

/**
 * Resolve the authentication token for relay connection
 *
 * Priority:
 * 1. sessionToken from config
 * 2. relayToken from config
 * 3. OPENCLAW_TALKCHANNEL_RELAY_TOKEN environment variable
 * 4. Create new session (returns pairing code via callback)
 */
async function resolveToken(
  talkchannel: ResolvedKakaoTalkChannel,
  callbacks: StreamCallbacks
): Promise<{ token: string; relayUrl: string; isNewSession: boolean }> {
  const relayUrl = talkchannel.config.relayUrl ?? DEFAULT_RELAY_URL;

  // 1. Check sessionToken
  if (talkchannel.config.sessionToken) {
    return { token: talkchannel.config.sessionToken, relayUrl, isNewSession: false };
  }

  // 2. Check relayToken
  if (talkchannel.config.relayToken) {
    return { token: talkchannel.config.relayToken, relayUrl, isNewSession: false };
  }

  // 3. Check environment variable
  const envToken = process.env.OPENCLAW_TALKCHANNEL_RELAY_TOKEN;
  if (envToken) {
    return { token: envToken, relayUrl, isNewSession: false };
  }

  // 4. Create new session
  const result = await createSession(relayUrl);
  if (!result.ok) {
    throw new Error(`Failed to create session: ${result.error.message}`);
  }

  // Notify about pairing requirement
  callbacks.onPairingRequired?.(result.data.pairingCode, result.data.expiresIn);

  return { token: result.data.sessionToken, relayUrl, isNewSession: true };
}

export async function startRelayStream(
  talkchannel: ResolvedKakaoTalkChannel,
  onMessage: (msg: InboundMessage) => Promise<void>,
  abortSignal: AbortSignal,
  opts: StreamOptions = {},
  callbacks: StreamCallbacks = {},
  log?: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void }
): Promise<void> {
  const runtime = getKakaoRuntime();
  const logger = log ?? runtime.logger;
  const options = { ...DEFAULT_STREAM_OPTIONS, ...opts };

  // Resolve token (may create new session)
  logger.info(`[kakao:${talkchannel.talkchannelId}] Resolving token...`);
  const { token, relayUrl, isNewSession } = await resolveToken(talkchannel, callbacks);
  logger.info(`[kakao:${talkchannel.talkchannelId}] Token resolved (newSession=${isNewSession})`);

  // Notify about resolved token
  callbacks.onTokenResolved?.(token, relayUrl);

  const { reconnectDelayMs, maxReconnectDelayMs } = talkchannel.config;

  await connectSSE(
    {
      relayUrl,
      sessionToken: token,
      reconnectDelayMs,
      maxReconnectDelayMs,
      maxRetries: options.maxRetries,
    },
    {
      onMessage: async (msg) => {
        await onMessage(msg);
      },
      onConnected: () => {
        logger.info(`[kakao:${talkchannel.talkchannelId}] SSE connected to ${relayUrl}`);
        callbacks.onConnected?.();
      },
      onDisconnected: () => {
        callbacks.onDisconnected?.();
      },
      onError: (error) => {
        const sanitizedError = sanitizeTokenFromLog(error.message);
        logger.warn(`[kakao:${talkchannel.talkchannelId}] SSE error: ${sanitizedError}`);
      },
      onReconnect: (attempt) => {
        logger.info(`[kakao:${talkchannel.talkchannelId}] SSE reconnecting (attempt ${attempt}/${options.maxRetries})`);
      },
      onPairingComplete: (data) => {
        logger.info(`[kakao:${talkchannel.talkchannelId}] Pairing complete: ${data.kakaoUserId}`);
        callbacks.onPairingComplete?.(data.kakaoUserId);
      },
      onPairingExpired: (reason) => {
        logger.warn(`[kakao:${talkchannel.talkchannelId}] Pairing expired: ${reason}`);
        callbacks.onPairingExpired?.(reason);
      },
      onSessionInvalidated: (status) => {
        logger.warn(`[kakao:${talkchannel.talkchannelId}] Session invalidated: HTTP ${status}`);
        callbacks.onSessionInvalidated?.(status);
      },
    },
    abortSignal
  );
}

export { connectSSE, parseSSEChunk, calculateReconnectDelay } from "./sse.js";
