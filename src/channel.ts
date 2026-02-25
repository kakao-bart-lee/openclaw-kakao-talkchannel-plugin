/**
 * Kakao Channel Plugin (Simplified)
 *
 * Single channel, relay mode only.
 * Integrates all adapters and configuration.
 */

import type { ResolvedKakaoTalkChannel } from "./types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { configAdapter } from "./adapters/config.js";
import { outboundAdapter } from "./adapters/outbound.js";
import { statusAdapter } from "./adapters/status.js";
import { securityAdapter } from "./adapters/security.js";
import { pairingAdapter } from "./adapters/pairing.js";
import { gatewayAdapter, getPendingPairingInfo } from "./adapters/gateway.js";
import { setupAdapter } from "./adapters/setup.js";
import { KakaoChannelConfigSchema } from "./config/schema.js";

const meta = {
  id: "kakao-talkchannel",
  label: "Kakao TalkChannel",
  selectionLabel: "카카오톡 채널",
  detailLabel: "KakaoTalk Bot",
  docsPath: "/channels/kakao-talkchannel",
  docsLabel: "kakao-talkchannel",
  blurb: "KakaoTalk 채널 챗봇을 OpenClaw에 연결합니다",
  systemImage: "message.fill",
  aliases: ["kakaotalk", "kakao-channel"],
  quickstartAllowFrom: false,
};

export const kakaoPlugin = {
  id: "kakao-talkchannel",
  meta,

  pairing: pairingAdapter,

  capabilities: {
    chatTypes: ["direct"] as const,
    reactions: false,
    threads: false,
    media: true,
    nativeCommands: false,
    blockStreaming: true,
  },

  reload: { configPrefixes: ["channels.kakao-talkchannel"] },

  configSchema: {
    schema: zodToJsonSchema(KakaoChannelConfigSchema, { target: "jsonSchema7" }) as Record<string, unknown>,
  },

  config: configAdapter,
  security: securityAdapter,
  outbound: outboundAdapter,
  status: statusAdapter,
  gateway: gatewayAdapter,
  setup: setupAdapter,
} satisfies {
  id: string;
  meta: typeof meta;
  pairing: typeof pairingAdapter;
  capabilities: {
    chatTypes: readonly string[];
    reactions: boolean;
    threads: boolean;
    media: boolean;
    nativeCommands: boolean;
    blockStreaming: boolean;
  };
  reload: { configPrefixes: string[] };
  configSchema: { schema: Record<string, unknown> };
  config: typeof configAdapter;
  security: typeof securityAdapter;
  outbound: typeof outboundAdapter;
  status: typeof statusAdapter;
  gateway: typeof gatewayAdapter;
  setup: typeof setupAdapter;
};

export type { ResolvedKakaoTalkChannel };
export { getPendingPairingInfo };
