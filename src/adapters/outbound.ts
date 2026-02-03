import type { ResolvedKakaoTalkChannel } from "../types.js";
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

export interface ChannelOutboundAdapter {
  deliveryMode: "direct" | "gateway";
  textChunkLimit: number;
  chunkerMode: "text" | "markdown";
  chunkMode: ChunkMode;
  chunker: (text: string, limit: number, mode?: ChunkMode) => string[];
  sendText: (ctx: OutboundContext) => Promise<OutboundResult>;
  sendMedia?: (ctx: OutboundMediaContext) => Promise<OutboundResult>;
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
};
