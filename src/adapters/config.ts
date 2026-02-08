/**
 * Kakao Channel Config Adapter (Simplified)
 *
 * Single channel, relay mode only.
 * Uses OpenClaw standard accounts structure: channels.kakao-talkchannel.accounts.<accountId>
 */

import type { ResolvedKakaoTalkChannel } from "../types.js";
import { KakaoAccountConfigSchema } from "../config/schema.js";

/**
 * ChannelConfigAdapter interface
 * Uses OpenClaw standard naming: accountId, resolveAccount, etc.
 */
export interface ChannelConfigAdapter<T> {
  listAccountIds: (cfg: unknown) => string[];
  resolveAccount: (cfg: unknown, accountId: string) => T;
  defaultAccountId: (cfg: unknown) => string;
  isConfigured: (account: T) => boolean;
  isEnabled: (account: T) => boolean;
}

type ConfigObject = Record<string, unknown>;

/**
 * Get the kakao-talkchannel config object
 */
function getKakaoTalkchannelConfig(cfg: unknown): ConfigObject | undefined {
  if (!cfg || typeof cfg !== "object") return undefined;
  const channels = (cfg as ConfigObject).channels;
  if (!channels || typeof channels !== "object") return undefined;
  const talkchannelConfig = (channels as ConfigObject)["kakao-talkchannel"];
  if (!talkchannelConfig || typeof talkchannelConfig !== "object") return undefined;
  return talkchannelConfig as ConfigObject;
}

/**
 * Get accounts object from kakao-talkchannel config
 * Returns empty object if not present (will use defaults)
 */
function getAccounts(cfg: unknown): ConfigObject {
  const talkchannelConfig = getKakaoTalkchannelConfig(cfg);
  if (!talkchannelConfig) return {};
  const accounts = talkchannelConfig.accounts;
  if (!accounts || typeof accounts !== "object") return {};
  return accounts as ConfigObject;
}

/**
 * Get account config by accountId
 * Falls back to default account if not found
 */
function getAccountConfig(cfg: unknown, accountId: string): unknown {
  const accounts = getAccounts(cfg);
  const account = accounts[accountId];

  if (account && typeof account === "object") {
    return account;
  }

  // Return empty object - schema will apply defaults
  return {};
}

/**
 * Resolve Kakao TalkChannel from configuration
 * Uses schema defaults if no config provided
 */
function resolveKakaoTalkChannel(cfg: unknown, accountId: string): ResolvedKakaoTalkChannel {
  const rawConfig = getAccountConfig(cfg, accountId);

  // Validate and apply defaults using schema (empty object gets all defaults)
  const validationResult = KakaoAccountConfigSchema.safeParse(rawConfig);

  if (!validationResult.success) {
    const errors = validationResult.error.issues
      .map((issue: { path: (string | number)[]; message: string }) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid Kakao TalkChannel configuration: ${errors}`);
  }

  const config = validationResult.data;

  // Determine token source
  let tokenSource: "config" | "env" | "session" | "none" = "none";
  if (config.sessionToken) {
    tokenSource = "session";
  } else if (config.relayToken) {
    tokenSource = "config";
  } else if (process.env.OPENCLAW_TALKCHANNEL_RELAY_TOKEN) {
    tokenSource = "env";
  }

  return {
    talkchannelId: accountId,
    config,
    enabled: config.enabled,
    name: (rawConfig as unknown as ConfigObject).name as string | undefined,
    channelId: config.channelId,
    tokenSource,
  };
}

/**
 * Kakao channel configuration adapter (simplified)
 * Uses OpenClaw standard accounts structure
 */
export const configAdapter: ChannelConfigAdapter<ResolvedKakaoTalkChannel> = {
  listAccountIds: (cfg) => {
    const accounts = getAccounts(cfg);
    const ids = Object.keys(accounts);
    // Always return at least ["default"] for zero-config support
    return ids.length > 0 ? ids : ["default"];
  },

  resolveAccount: (cfg, accountId) => {
    return resolveKakaoTalkChannel(cfg, accountId ?? "default");
  },

  defaultAccountId: (_cfg) => {
    return "default";
  },

  isConfigured: (_account) => {
    // For relay mode: always configured (can auto-create session)
    return true;
  },

  isEnabled: (account) => {
    return account.config.enabled;
  },
};
