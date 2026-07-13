/**
 * Connection supervisor — owns the full lifecycle of a single instance's
 * connection health. Replaces the raw "did the last 5s poll succeed?" model
 * with explicit phases, exponential backoff, and error classification.
 *
 * One supervisor per registered instance, living in the main process.
 */

// ── Types ────────────────────────────────────────────────────────────

export type ConnectionPhase =
  | "offline"
  | "connecting"
  | "connected"
  | "backoff"
  | "blocked";

export type ErrorClass = "transient" | "blocking";

export interface ConnectionStatus {
  phase: ConnectionPhase;
  lastError: string | null;
  errorClass: ErrorClass | null;
  /** How many consecutive failures (resets after STABLE_MS). */
  failureCount: number;
  /** Current backoff delay in ms (1s, 2s, 4s, 8s, 16s cap). */
  backoffMs: number;
  /** Epoch-ms of the last successful connection. */
  lastConnectedAt: number | null;
}

interface ProbeResult {
  ok: boolean;
  status: number;
  error: string | null;
}

// ── Constants ────────────────────────────────────────────────────────

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 16_000;
const STABLE_MS = 30_000;
const PROBE_TIMEOUT_MS = 5_000;

// ── Error classification ─────────────────────────────────────────────

function classifyError(
  status: number,
  errorMessage: string | null,
): ErrorClass {
  if (status === 401 || status === 403) return "blocking";
  if (errorMessage) {
    const lower = errorMessage.toLowerCase();
    if (
      lower.includes("invalid instance url") ||
      lower.includes("unsupported protocol")
    ) {
      return "blocking";
    }
  }
  return "transient";
}

function isNetworkDownError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("enetunreach") ||
    lower.includes("econnrefused") ||
    lower.includes("getaddrinfo enotfound") ||
    lower.includes("network is unreachable") ||
    lower.includes("net::err_network_changed") ||
    lower.includes("net::err_internet_disconnected") ||
    lower.includes("net::err_name_not_resolved") ||
    lower.includes("net::err_connection_refused") ||
    lower.includes("request timed out")
  );
}

// ── Supervisor ───────────────────────────────────────────────────────

export class ConnectionSupervisor {
  private phase: ConnectionPhase = "offline";
  private lastError: string | null = null;
  private errorClass: ErrorClass | null = null;
  private failureCount = 0;
  private backoffMs = INITIAL_BACKOFF_MS;
  private lastConnectedAt: number | null = null;
  private connectedSince: number | null = null;

  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private stableCheckTimer: ReturnType<typeof setInterval> | null = null;
  private probeInFlight = false;
  private destroyed = false;

  private readonly onChange: (status: ConnectionStatus) => void;
  private readonly probe: () => Promise<ProbeResult>;

  constructor(
    probe: () => Promise<ProbeResult>,
    onChange: (status: ConnectionStatus) => void,
  ) {
    this.probe = probe;
    this.onChange = onChange;
  }

  // ── Public API ───────────────────────────────────────────────────

  start(): void {
    if (this.destroyed) return;
    this.scheduleConnect();
  }

  destroy(): void {
    this.destroyed = true;
    this.clearRetryTimer();
    this.clearStableCheck();
  }

  wakeup(): void {
    if (this.destroyed) return;

    if (this.phase === "backoff") {
      this.clearRetryTimer();
      this.scheduleConnect();
    } else if (this.phase === "offline") {
      this.scheduleConnect();
    } else if (this.phase === "blocked") {
      this.scheduleConnect();
    }
  }

  getStatus(): ConnectionStatus {
    return {
      phase: this.phase,
      lastError: this.lastError,
      errorClass: this.errorClass,
      failureCount: this.failureCount,
      backoffMs: this.backoffMs,
      lastConnectedAt: this.lastConnectedAt,
    };
  }

  // ── Connection lifecycle ──────────────────────────────────────────

  private scheduleConnect(): void {
    if (this.destroyed || this.probeInFlight) return;

    this.setPhase("connecting");
    this.probeInFlight = true;

    this.probe()
      .then((result) => {
        if (this.destroyed) return;
        this.probeInFlight = false;
        this.handleProbeResult(result);
      })
      .catch(() => {
        if (this.destroyed) return;
        this.probeInFlight = false;
        this.handleProbeResult({ ok: false, status: 0, error: "Probe failed" });
      });
  }

  private handleProbeResult(result: ProbeResult): void {
    if (this.destroyed) return;

    if (result.ok) {
      this.onConnected();
      return;
    }

    this.onError(result.status, result.error);
  }

  private onConnected(): void {
    this.failureCount = 0;
    this.backoffMs = INITIAL_BACKOFF_MS;
    this.lastError = null;
    this.errorClass = null;
    this.lastConnectedAt = Date.now();
    this.connectedSince = Date.now();

    this.clearRetryTimer();
    this.startStableCheck();
    this.setPhase("connected");
  }

  private onError(status: number, errorMessage: string | null): void {
    const cls = classifyError(status, errorMessage);
    this.errorClass = cls;

    if (cls === "blocking") {
      this.lastError = errorMessage ?? `HTTP ${status}`;
      this.clearRetryTimer();
      this.clearStableCheck();
      this.setPhase("blocked");
      return;
    }

    if (errorMessage && isNetworkDownError(errorMessage)) {
      this.lastError = errorMessage;
      this.connectedSince = null;
      this.clearRetryTimer();
      this.clearStableCheck();
      this.setPhase("offline");
      return;
    }

    this.failureCount++;
    this.lastError = errorMessage ?? `HTTP ${status}`;
    this.connectedSince = null;
    this.clearStableCheck();

    this.backoffMs = Math.min(
      INITIAL_BACKOFF_MS * Math.pow(2, this.failureCount - 1),
      MAX_BACKOFF_MS,
    );

    this.setPhase("backoff");
    this.scheduleRetry();
  }

  // ── Retry scheduling ──────────────────────────────────────────────

  private scheduleRetry(): void {
    if (this.destroyed) return;
    this.clearRetryTimer();

    const delay = this.backoffMs;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.scheduleConnect();
    }, delay);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer !== null) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  // ── Stable-connection check ──────────────────────────────────────

  private startStableCheck(): void {
    this.clearStableCheck();

    this.stableCheckTimer = setInterval(() => {
      if (this.destroyed) {
        this.clearStableCheck();
        return;
      }

      if (this.connectedSince && Date.now() - this.connectedSince >= STABLE_MS) {
        this.failureCount = 0;
        this.backoffMs = INITIAL_BACKOFF_MS;
        this.connectedSince = Date.now();
      }
    }, 5_000);
  }

  private clearStableCheck(): void {
    if (this.stableCheckTimer !== null) {
      clearInterval(this.stableCheckTimer);
      this.stableCheckTimer = null;
    }
  }

  // ── State emission ────────────────────────────────────────────────

  private setPhase(next: ConnectionPhase): void {
    if (this.phase === next) return;
    this.phase = next;
    this.emitChange();
  }

  private emitChange(): void {
    if (this.destroyed) return;
    this.onChange(this.getStatus());
  }
}

// ── Helpers for main process ─────────────────────────────────────────

export function makeProbe(baseUrl: string): () => Promise<ProbeResult> {
  return async (): Promise<ProbeResult> => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

      const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/loops`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        return { ok: false, status: res.status, error: `HTTP ${res.status}` };
      }

      const text = await res.text();
      let parsed: unknown = text;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        // keep raw text
      }

      if (parsed && typeof parsed === "object" && "ok" in parsed) {
        const envelope = parsed as { ok: boolean; error?: { message?: string } };
        if (envelope.ok) {
          return { ok: true, status: res.status, error: null };
        }
        return {
          ok: false,
          status: res.status,
          error: envelope.error?.message ?? `HTTP ${res.status}`,
        };
      }

      return { ok: true, status: res.status, error: null };
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Request timed out"
          : err instanceof Error
            ? err.message
            : String(err);
      return { ok: false, status: 0, error: message };
    }
  };
}
