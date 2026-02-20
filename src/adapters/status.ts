/**
 * Kakao Channel Status Adapter
 *
 * Relay mode only status monitoring.
 * Follows ChannelStatusAdapter<ResolvedKakaoTalkChannel> interface from openclaw/plugin-sdk.
 */

import type { ResolvedKakaoTalkChannel, ChannelAccountSnapshot } from "../types.js";

type StatusIssue = { level: "error" | "warn" | "info"; message: string };

export const statusAdapter = {
  defaultRuntime: {
    accountId: "default",
    running: false,
    lastStartAt: null,
    lastStopAt: null,
    lastError: null,
  } satisfies ChannelAccountSnapshot,

  probeAccount: async ({
    account,
    timeoutMs,
  }: {
    account: ResolvedKakaoTalkChannel;
    timeoutMs: number;
    cfg: unknown;
  }): Promise<{ ok: boolean; latencyMs?: number; error?: string }> => {
    if (!account.config.relayUrl) {
      return { ok: false, error: "relayUrl not configured" };
    }

    const start = Date.now();
    try {
      const response = await fetch(`${account.config.relayUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }

      return { ok: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { ok: false, error: String(error) };
    }
  },

  buildAccountSnapshot: ({
    account,
    runtime,
    probe,
  }: {
    account: ResolvedKakaoTalkChannel;
    cfg: unknown;
    runtime?: ChannelAccountSnapshot;
    probe?: { ok: boolean; latencyMs?: number; error?: string };
  }): ChannelAccountSnapshot => {
    const snapshot: ChannelAccountSnapshot & { probe?: typeof probe } = {
      accountId: account.talkchannelId,
      enabled: account.config.enabled,
      configured: Boolean(account.config.relayUrl),
      running: runtime?.running ?? false,
      connected: runtime?.connected,
      lastStartAt: runtime?.lastStartAt ?? null,
      lastStopAt: runtime?.lastStopAt ?? null,
      lastError: runtime?.lastError ?? null,
      lastInboundAt: runtime?.lastInboundAt ?? null,
      lastOutboundAt: runtime?.lastOutboundAt ?? null,
    };

    if (probe !== undefined) {
      snapshot.probe = probe;
    }

    return snapshot;
  },

  collectStatusIssues: (
    accounts: ChannelAccountSnapshot[]
  ): StatusIssue[] => {
    const issues: StatusIssue[] = [];

    for (const account of accounts) {
      const ext = account as ChannelAccountSnapshot & {
        probe?: { ok: boolean; error?: string };
      };

      if (ext.configured && !ext.enabled) {
        issues.push({
          level: "warn",
          message: `Kakao TalkChannel "${ext.accountId}" is configured but disabled`,
        });
      }

      if (ext.probe && !ext.probe.ok) {
        issues.push({
          level: "error",
          message: `Kakao relay server unreachable: ${ext.probe.error}`,
        });
      }

      if (ext.running && ext.lastInboundAt) {
        const silentMs = Date.now() - ext.lastInboundAt;
        if (silentMs > 30 * 60 * 1000) {
          issues.push({
            level: "warn",
            message: `Kakao TalkChannel "${ext.accountId}" has not received messages for ${Math.round(silentMs / 60000)} minutes`,
          });
        }
      }
    }

    return issues;
  },
};
