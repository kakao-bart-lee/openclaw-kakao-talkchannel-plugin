/**
 * Kakao Channel Gateway Adapter (Simplified)
 *
 * Relay mode only - always starts SSE stream.
 * Uses OpenClaw standard naming: account, startAccount, stopAccount
 *
 * Message dispatch follows OpenClaw pattern:
 * SSE message → finalizeInboundContext → dispatchReplyWithBufferedBlockDispatcher
 */

import type {
  ResolvedKakaoTalkChannel,
  InboundMessage,
  KakaoSkillResponse,
  KakaoOutput,
  KakaoChannelData,
  DeliverPayload,
} from "../types.js";
import { startRelayStream, type StreamCallbacks } from "../relay/stream.js";
import { getKakaoRuntime } from "../runtime.js";
import { sendReply } from "../relay/client.js";
import { stripMarkdown } from "../kakao/response.js";

function buildOutputsFromChannelData(kakaoData: KakaoChannelData): KakaoOutput[] {
  if (kakaoData.outputs && kakaoData.outputs.length > 0) {
    return kakaoData.outputs;
  }

  const outputs: KakaoOutput[] = [];

  if (kakaoData.simpleText) {
    outputs.push({ simpleText: kakaoData.simpleText });
  }
  if (kakaoData.simpleImage) {
    outputs.push({ simpleImage: kakaoData.simpleImage });
  }
  if (kakaoData.textCard) {
    outputs.push({ textCard: kakaoData.textCard });
  }
  if (kakaoData.basicCard) {
    outputs.push({ basicCard: kakaoData.basicCard });
  }
  if (kakaoData.commerceCard) {
    outputs.push({ commerceCard: kakaoData.commerceCard });
  }
  if (kakaoData.listCard) {
    outputs.push({ listCard: kakaoData.listCard });
  }
  if (kakaoData.itemCard) {
    outputs.push({ itemCard: kakaoData.itemCard });
  }
  if (kakaoData.carousel) {
    outputs.push({ carousel: kakaoData.carousel });
  }

  return outputs;
}

export interface GatewayContext {
  account: ResolvedKakaoTalkChannel;
  accountId: string;
  cfg: unknown;
  abortSignal: AbortSignal;
  log?: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
  };
}

export interface StopAccountContext {
  accountId: string;
}

export interface StartAccountResult {
  pairingCode?: string;
  expiresIn?: number;
}

// Store for pairing info to be retrieved later
let pendingPairingInfo: { pairingCode: string; expiresIn: number } | null = null;

export function getPendingPairingInfo(): { pairingCode: string; expiresIn: number } | null {
  const info = pendingPairingInfo;
  pendingPairingInfo = null; // Clear after reading
  return info;
}

/**
 * Build OpenClaw message context from InboundMessage
 */
function buildMessageContext(
  msg: InboundMessage,
  account: ResolvedKakaoTalkChannel,
  accountId: string
): Record<string, unknown> {
  const { normalized } = msg;
  const sessionKey = `agent:main:kakao-talkchannel:dm:${normalized.userId}`;

  return {
    // Message content
    Body: normalized.text,
    RawBody: normalized.text,
    BodyForAgent: normalized.text,
    BodyForCommands: normalized.text,

    // Identifiers
    From: `kakao:${normalized.userId}`,
    To: `kakao:${normalized.channelId}`,
    Provider: "kakao-talkchannel",
    Surface: "kakao-talkchannel",
    MessageSid: msg.id,
    MessageSidFull: msg.id,

    // Routing
    SessionKey: sessionKey,
    AccountId: accountId,

    // Chat context (always DM for now)
    ChatType: "direct",
    Timestamp: msg.createdAt ? new Date(msg.createdAt).getTime() : Date.now(),

    // Sender details
    SenderId: normalized.userId,

    // Control (authorize commands for paired users)
    CommandAuthorized: true,
  };
}

/**
 * Handle inbound message by dispatching to OpenClaw agent system
 */
async function handleInboundMessage(
  msg: InboundMessage,
  account: ResolvedKakaoTalkChannel,
  accountId: string,
  cfg: unknown,
  log?: GatewayContext["log"]
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runtime = getKakaoRuntime() as any;
  const channel = runtime.channel;

  log?.info(`[kakao-talkchannel:${account.talkchannelId}] Received message: ${msg.id}`);

  // Build and finalize message context
  const rawCtx = buildMessageContext(msg, account, accountId);
  const ctxPayload = channel.reply.finalizeInboundContext(rawCtx);

  // Get relay config for sending replies
  const relayUrl = account.config.relayUrl ?? "https://kakao-relay.talelapse.in";
  const relayToken = account.config.sessionToken ?? account.config.relayToken ?? "";

  // Dispatch to OpenClaw agent system
  await channel.reply.dispatchReplyWithBufferedBlockDispatcher({
    ctx: ctxPayload,
    cfg,
    dispatcherOptions: {
      deliver: async (payload: DeliverPayload) => {
        const template: KakaoSkillResponse["template"] = { outputs: [] };
        const kakaoData = payload.channelData?.kakao;

        if (kakaoData) {
          const channelOutputs = buildOutputsFromChannelData(kakaoData);
          template.outputs.push(...channelOutputs);

          if (kakaoData.quickReplies && kakaoData.quickReplies.length > 0) {
            template.quickReplies = kakaoData.quickReplies.slice(0, 10);
          }
        }

        if (template.outputs.length === 0) {
          if (payload.mediaUrls && payload.mediaUrls.length > 0) {
            for (const url of payload.mediaUrls.slice(0, 3)) {
              template.outputs.push({ simpleImage: { imageUrl: url } });
            }
          }

          if (payload.text) {
            const plainText = stripMarkdown(payload.text);
            template.outputs.push({ simpleText: { text: plainText } });
          }
        }

        if (template.outputs.length === 0) return;

        template.outputs = template.outputs.slice(0, 3);

        const response: KakaoSkillResponse = {
          version: "2.0",
          template,
        };

        try {
          await sendReply(
            { relayUrl, relayToken },
            msg.id,
            response
          );
          log?.info(`[kakao-talkchannel:${account.talkchannelId}] Reply sent for ${msg.id}`);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          log?.error(`[kakao-talkchannel:${account.talkchannelId}] Reply failed: ${errMsg}`);
        }
      },
      onReplyStart: async () => {
        // Could send typing indicator if supported
      },
      onIdle: async () => {
        // Stop typing indicator
      },
      onError: (err: Error, info: { kind: string }) => {
        log?.error(`[kakao-talkchannel:${account.talkchannelId}] Dispatch ${info.kind} error: ${err.message}`);
      },
    },
  });
}

export const gatewayAdapter = {
  startAccount: async (ctx: GatewayContext): Promise<void> => {
    const { account, accountId, cfg, abortSignal, log } = ctx;

    log?.info(
      `[kakao-talkchannel:${account.talkchannelId}] Starting SSE stream to ${account.config.relayUrl}`
    );

    const callbacks: StreamCallbacks = {
      onPairingRequired: (pairingCode, expiresIn) => {
        // Store pairing info for later retrieval
        pendingPairingInfo = { pairingCode, expiresIn };

        // Log the pairing code prominently
        log?.info(`[kakao-talkchannel:${account.talkchannelId}] ========================================`);
        log?.info(`[kakao-talkchannel:${account.talkchannelId}] 🔗 페어링 코드: ${pairingCode}`);
        log?.info(`[kakao-talkchannel:${account.talkchannelId}] 카카오톡에서 /pair ${pairingCode} 입력하세요`);
        log?.info(`[kakao-talkchannel:${account.talkchannelId}] 유효시간: ${Math.floor(expiresIn / 60)}분`);
        log?.info(`[kakao-talkchannel:${account.talkchannelId}] ========================================`);
      },
      onPairingComplete: (kakaoUserId) => {
        log?.info(`[kakao-talkchannel:${account.talkchannelId}] ✅ 페어링 완료: ${kakaoUserId}`);
      },
      onPairingExpired: (reason) => {
        log?.info(`[kakao-talkchannel:${account.talkchannelId}] ⚠️ 페어링 만료: ${reason}`);
      },
    };

    // Message handler that dispatches to OpenClaw
    const onMessage = async (msg: InboundMessage): Promise<void> => {
      await handleInboundMessage(msg, account, accountId, cfg, log);
    };

    return startRelayStream(account, onMessage, abortSignal, {}, callbacks, log);
  },

  stopAccount: async (_ctx: StopAccountContext): Promise<void> => {
    return Promise.resolve();
  },

  getPendingPairingInfo,
};
