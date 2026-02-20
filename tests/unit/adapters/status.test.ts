/**
 * ChannelStatusAdapter tests
 *
 * Relay mode only status monitoring.
 * Follows ChannelStatusAdapter<ResolvedKakaoTalkChannel> interface from openclaw/plugin-sdk.
 */
import { describe, it, expect, vi } from "vitest";
import { statusAdapter } from "../../../src/adapters/status";
import type { ResolvedKakaoTalkChannel } from "../../../src/types";
import type { ChannelAccountSnapshot } from "openclaw/plugin-sdk";

const makeAccount = (overrides: Partial<ResolvedKakaoTalkChannel["config"]> = {}): ResolvedKakaoTalkChannel => ({
  talkchannelId: "default",
  enabled: true,
  config: {
    enabled: true,
    channelId: "ch123",
    dmPolicy: "pairing",
    relayUrl: "https://relay.example.com",
    ...overrides,
  },
});

describe("ChannelStatusAdapter", () => {
  describe("defaultRuntime", () => {
    it("provides accountId, running=false, all null timestamps", () => {
      const r = statusAdapter.defaultRuntime!;
      expect(r.accountId).toBe("default");
      expect(r.running).toBe(false);
      expect(r.lastStartAt).toBeNull();
      expect(r.lastStopAt).toBeNull();
      expect(r.lastError).toBeNull();
    });

    it("connected is undefined by default", () => {
      expect(statusAdapter.defaultRuntime!.connected).toBeUndefined();
    });
  });

  describe("probeAccount", () => {
    it("calls relay /health and returns ok with latency", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await statusAdapter.probeAccount!({
        account: makeAccount(),
        timeoutMs: 5000,
        cfg: {} as any,
      });

      expect((result as any).ok).toBe(true);
      expect(typeof (result as any).latencyMs).toBe("number");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://relay.example.com/health",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("returns error when relay is unreachable", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

      const result = await statusAdapter.probeAccount!({
        account: makeAccount(),
        timeoutMs: 5000,
        cfg: {} as any,
      });

      expect((result as any).ok).toBe(false);
      expect((result as any).error).toBeDefined();
    });

    it("returns error on non-200 status", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 503 });

      const result = await statusAdapter.probeAccount!({
        account: makeAccount(),
        timeoutMs: 5000,
        cfg: {} as any,
      });

      expect((result as any).ok).toBe(false);
      expect(String((result as any).error)).toContain("503");
    });

    it("returns error when relayUrl is not configured", async () => {
      const result = await statusAdapter.probeAccount!({
        account: makeAccount({ relayUrl: undefined }),
        timeoutMs: 5000,
        cfg: {} as any,
      });

      expect((result as any).ok).toBe(false);
      expect(String((result as any).error)).toContain("relayUrl");
    });
  });

  describe("buildAccountSnapshot", () => {
    it("returns ChannelAccountSnapshot with running and connected from runtime", async () => {
      const runtime: ChannelAccountSnapshot = {
        accountId: "default",
        running: true,
        connected: true,
        lastStartAt: 1000,
        lastStopAt: null,
        lastError: null,
        lastInboundAt: 2000,
        lastOutboundAt: 3000,
      };

      const snapshot = await statusAdapter.buildAccountSnapshot!({
        account: makeAccount(),
        cfg: {} as any,
        runtime,
      });

      expect(snapshot.accountId).toBe("default");
      expect(snapshot.enabled).toBe(true);
      expect(snapshot.configured).toBe(true);
      expect(snapshot.running).toBe(true);
      expect(snapshot.connected).toBe(true);
      expect(snapshot.lastStartAt).toBe(1000);
      expect(snapshot.lastInboundAt).toBe(2000);
      expect(snapshot.lastOutboundAt).toBe(3000);
    });

    it("defaults running=false and connected=undefined when no runtime", async () => {
      const snapshot = await statusAdapter.buildAccountSnapshot!({
        account: makeAccount(),
        cfg: {} as any,
      });

      expect(snapshot.running).toBe(false);
      expect(snapshot.connected).toBeUndefined();
    });

    it("configured=false when relayUrl is absent", async () => {
      const snapshot = await statusAdapter.buildAccountSnapshot!({
        account: makeAccount({ relayUrl: undefined }),
        cfg: {} as any,
      });

      expect(snapshot.configured).toBe(false);
    });

    it("configured=false when relayUrl is empty string", async () => {
      const snapshot = await statusAdapter.buildAccountSnapshot!({
        account: makeAccount({ relayUrl: "" }),
        cfg: {} as any,
      });

      expect(snapshot.configured).toBe(false);
    });

    it("includes probe result when provided", async () => {
      const probe = { ok: true, latencyMs: 42 };

      const snapshot = await statusAdapter.buildAccountSnapshot!({
        account: makeAccount(),
        cfg: {} as any,
        probe,
      });

      expect((snapshot as any).probe).toEqual(probe);
    });
  });

  describe("collectStatusIssues", () => {
    const makeSnapshot = (overrides: Partial<ChannelAccountSnapshot> = {}): ChannelAccountSnapshot => ({
      accountId: "default",
      enabled: true,
      configured: true,
      running: true,
      lastStartAt: Date.now(),
      lastStopAt: null,
      lastError: null,
      ...overrides,
    });

    it("warns when configured but disabled", () => {
      const issues = statusAdapter.collectStatusIssues!([
        makeSnapshot({ enabled: false, configured: true, running: false }),
      ]);

      expect(issues).toContainEqual(
        expect.objectContaining({ level: "warn", message: expect.stringContaining("configured but disabled") })
      );
    });

    it("errors when probe is not ok", () => {
      const issues = statusAdapter.collectStatusIssues!([
        makeSnapshot({ probe: { ok: false, error: "Connection refused" } } as any),
      ]);

      expect(issues).toContainEqual(
        expect.objectContaining({ level: "error", message: expect.stringContaining("relay server unreachable") })
      );
    });

    it("warns when no inbound messages for 30+ minutes", () => {
      const thirtyOneMinAgo = Date.now() - 31 * 60 * 1000;

      const issues = statusAdapter.collectStatusIssues!([
        makeSnapshot({ running: true, lastInboundAt: thirtyOneMinAgo }),
      ]);

      expect(issues).toContainEqual(
        expect.objectContaining({ level: "warn", message: expect.stringContaining("has not received messages") })
      );
    });

    it("does not warn about silence within 30 minutes", () => {
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;

      const issues = statusAdapter.collectStatusIssues!([
        makeSnapshot({ running: true, lastInboundAt: fiveMinAgo }),
      ]);

      expect(issues.filter((i) => i.message.includes("has not received messages"))).toHaveLength(0);
    });

    it("does not warn about silence when not running", () => {
      const thirtyOneMinAgo = Date.now() - 31 * 60 * 1000;

      const issues = statusAdapter.collectStatusIssues!([
        makeSnapshot({ running: false, lastInboundAt: thirtyOneMinAgo }),
      ]);

      expect(issues.filter((i) => i.message.includes("has not received messages"))).toHaveLength(0);
    });

    it("returns empty array for healthy channel", () => {
      const issues = statusAdapter.collectStatusIssues!([
        makeSnapshot({ lastInboundAt: Date.now() }),
      ]);

      expect(issues).toHaveLength(0);
    });
  });
});
