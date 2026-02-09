import type { ResolvedKakaoTalkChannel, KakaoSkillResponse } from "../types.js";
import { chunkTextForKakao as chunkTextForKakaoImpl, type ChunkMode } from "../kakao/response.js";

export interface OutboundContext {
  to: string;
  text: string;
  talkchannelId: string;
  talkchannel: ResolvedKakaoTalkChannel;
}

export interface OutboundMediaContext extends OutboundContext {
  mediaUrl: string;
  mediaType?: "image" | "video" | "file";
  altText?: string;
}

export interface OutboundResult {
  channel: "kakao-talkchannel";
  success: boolean;
  messageId?: string;
  error?: string;
}

/** sendPayload 전용 컨텍스트 */
export interface SendPayloadContext {
  to: string;
  talkchannelId: string;
  talkchannel: ResolvedKakaoTalkChannel;
  messageId: string;
  response: KakaoSkillResponse;
}

export interface ChannelOutboundAdapter {
  deliveryMode: "direct" | "gateway";
  textChunkLimit: number;
  chunkerMode: "text" | "markdown";
  chunkMode: ChunkMode;
  chunker: (text: string, limit: number, mode?: ChunkMode) => string[];
  sendText: (ctx: OutboundContext) => Promise<OutboundResult>;
  sendMedia?: (ctx: OutboundMediaContext) => Promise<OutboundResult>;
  sendPayload?: (ctx: SendPayloadContext) => Promise<OutboundResult>;
}

export function chunkTextForKakao(text: string, limit: number = 400, mode: ChunkMode = "sentence"): string[] {
  return chunkTextForKakaoImpl(text, limit, mode);
}

export const outboundAdapter: ChannelOutboundAdapter = {
  deliveryMode: "direct",
  textChunkLimit: 400,
  chunkerMode: "text",
  chunkMode: "sentence",
  chunker: chunkTextForKakao,

  sendText: async (_ctx: OutboundContext): Promise<OutboundResult> => {
    return { channel: "kakao-talkchannel", success: true };
  },

  sendMedia: async (_ctx: OutboundMediaContext): Promise<OutboundResult> => {
    return { channel: "kakao-talkchannel", success: true };
  },

  /**
   * 카카오 카드/구조화 메시지를 릴레이 서버로 직접 전송한다.
   * 향후 gateway deliver 로직을 이 메서드로 통합할 수 있다.
   *
   * @see docs/upstream-patterns.md - sendPayload 패턴
   */
  sendPayload: async (_ctx: SendPayloadContext): Promise<OutboundResult> => {
    // TODO: sendReply()를 호출하여 릴레이 서버로 전송
    return { channel: "kakao-talkchannel", success: true };
  },
};
