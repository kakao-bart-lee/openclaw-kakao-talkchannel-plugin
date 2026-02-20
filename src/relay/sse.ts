import type { SSEEvent, SSEClientConfig, InboundMessage } from "../types.js";

const DEFAULT_RECONNECT_DELAY_MS = 1000;
const DEFAULT_MAX_RECONNECT_DELAY_MS = 30000;
const DEFAULT_TIMEOUT_MS = 300000; // 5 minutes - SSE connections need longer timeout

export interface SSEHandlers {
  onMessage: (msg: InboundMessage) => Promise<void>;
  onError?: (error: Error) => void;
  onReconnect?: (attempt: number) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onPairingComplete?: (data: { kakaoUserId: string; pairedAt: string }) => void;
  onPairingExpired?: (reason: string) => void;
  onSessionInvalidated?: (status: number) => void;
}

export function calculateReconnectDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  const jitter = cappedDelay * 0.2 * Math.random();
  return Math.floor(cappedDelay + jitter);
}

export function parseSSEChunk(chunk: string): { events: SSEEvent[]; consumed: number; parseErrors: number } {
  const events: SSEEvent[] = [];
  let consumed = 0;
  let searchFrom = 0;
  let parseErrors = 0;

  // Find complete events by scanning for \n\n boundaries
  while (true) {
    const boundary = chunk.indexOf("\n\n", searchFrom);
    if (boundary === -1) break;

    // Extract the event block (from consumed to boundary)
    const block = chunk.slice(consumed, boundary);
    const endPos = boundary + 2; // include the \n\n

    const currentEvent: Partial<{ event: string; data: string; id: string }> = {};
    const lines = block.split("\n");

    for (const line of lines) {
      if (line === "") continue; // skip empty lines within the block

      if (line.startsWith("event:")) {
        currentEvent.event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        currentEvent.data = line.slice(5).trim();
      } else if (line.startsWith("id:")) {
        currentEvent.id = line.slice(3).trim();
      }
    }

    if (currentEvent.event && currentEvent.data) {
      try {
        const parsedData = JSON.parse(currentEvent.data);
        events.push({
          event: currentEvent.event as SSEEvent["event"],
          data: parsedData,
          id: currentEvent.id,
        } as SSEEvent);
      } catch {
        parseErrors++;
      }
    }

    consumed = endPos;
    searchFrom = endPos;
  }

  return { events, consumed, parseErrors };
}

function createTimeoutSignal(
  timeoutMs: number,
  parentSignal?: AbortSignal
): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let parentAbortHandler: (() => void) | undefined;

  if (parentSignal) {
    parentAbortHandler = () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
    parentSignal.addEventListener("abort", parentAbortHandler, { once: true });
  }

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timeoutId);
      if (parentSignal && parentAbortHandler) {
        parentSignal.removeEventListener("abort", parentAbortHandler);
      }
    },
  };
}

export async function connectSSE(
  config: SSEClientConfig,
  handlers: SSEHandlers,
  abortSignal: AbortSignal
): Promise<void> {
  const reconnectDelayMs = config.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;
  const maxReconnectDelayMs = config.maxReconnectDelayMs ?? DEFAULT_MAX_RECONNECT_DELAY_MS;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let reconnectAttempt = 0;
  let lastEventId: string | undefined;

  while (!abortSignal.aborted) {
    const timeout = createTimeoutSignal(timeoutMs, abortSignal);

    try {
      // Use sessionToken if available, otherwise fall back to relayToken
      const token = config.sessionToken ?? config.relayToken;
      if (!token) {
        throw new Error("SSE connection requires sessionToken or relayToken");
      }

      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      };

      if (lastEventId) {
        headers["Last-Event-ID"] = lastEventId;
      }

      // Normalize URL and use v1/events endpoint
      const baseUrl = config.relayUrl.endsWith("/") ? config.relayUrl : `${config.relayUrl}/`;
      const response = await fetch(`${baseUrl}v1/events`, {
        method: "GET",
        headers,
        signal: timeout.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 410) {
          handlers.onSessionInvalidated?.(response.status);
          throw new Error(`SSE session invalidated: HTTP ${response.status}`);
        }
        throw new Error(`SSE connection failed: HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error("SSE connection failed: no response body");
      }

      reconnectAttempt = 0;
      handlers.onConnected?.();

      const reader = response.body.getReader();
      try {
        const decoder = new TextDecoder();
        let buffer = "";

        while (!abortSignal.aborted) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const { events, consumed, parseErrors } = parseSSEChunk(buffer);

          if (consumed > 0) {
            buffer = buffer.slice(consumed);
          }

          if (parseErrors > 0) {
            handlers.onError?.(new Error(`Skipped ${parseErrors} SSE event(s) with malformed JSON`));
          }

          for (const event of events) {
            if (event.id) {
              lastEventId = event.id;
            }

            if (event.event === "message") {
              try {
                await handlers.onMessage(event.data);
              } catch (msgError) {
                const err = msgError instanceof Error ? msgError : new Error(String(msgError));
                handlers.onError?.(err);
              }
            } else if (event.event === "error") {
              handlers.onError?.(new Error(event.data.message));
            } else if (event.event === "pairing_complete") {
              handlers.onPairingComplete?.(event.data);
            } else if (event.event === "pairing_expired") {
              handlers.onPairingExpired?.(event.data.reason);
            }
          }
        }
      } finally {
        reader.cancel().catch(() => {});
      }
    } catch (error) {
      if (abortSignal.aborted) {
        return;
      }

      const err = error instanceof Error ? error : new Error(String(error));

      // 401/410: 세션 무효화 → 재연결 없이 즉시 상위로 전파
      if (err.message.startsWith("SSE session invalidated")) {
        handlers.onError?.(err);
        throw err;
      }

      handlers.onError?.(err);
      handlers.onDisconnected?.();

      reconnectAttempt++;
      handlers.onReconnect?.(reconnectAttempt);

      if (config.maxRetries !== undefined && reconnectAttempt >= config.maxRetries) {
        throw new Error(`Max reconnect attempts (${config.maxRetries}) exceeded`);
      }

      const delay = calculateReconnectDelay(reconnectAttempt, reconnectDelayMs, maxReconnectDelayMs);
      await sleep(delay, abortSignal);
    } finally {
      timeout.clear();
    }
  }
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Aborted"));
      return;
    }

    const abortHandler = (): void => {
      clearTimeout(timeout);
      reject(new Error("Aborted"));
    };

    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", abortHandler);
      resolve();
    }, ms);

    signal.addEventListener("abort", abortHandler, { once: true });
  });
}
