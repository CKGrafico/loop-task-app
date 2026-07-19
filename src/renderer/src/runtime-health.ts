/**
 * Runtime health chip — derives a compact runtime usability state from existing
 * signals (reachability, daemon health, OpenCode status, environment metadata)
 * so the user can see at a glance whether an instance's runtime is usable before
 * they chat.
 *
 * States:
 *  - "ok"            → runtime available, server up, credentials valid
 *  - "not-running"   → runtime installed but server is not running
 *  - "not-installed" → runtime binary not found on the instance
 *  - "auth-problem"  → runtime reachable but credentials are invalid or missing
 *  - "unreachable"   → instance is unreachable (overrides everything else)
 */

import type { Environment, EnvironmentHealth, ReachabilityState, AgentRuntime, RuntimeState } from "./types";
import type { OpenCodeConnectionStatus } from "../../shared/ipc";
import { standaloneIntl } from "./i18n";

export type RuntimeHealthState =
  | "ok"
  | "not-running"
  | "not-installed"
  | "auth-problem"
  | "unreachable";

export interface RuntimeHealthInfo {
  state: RuntimeHealthState;
  /** Human-readable reason for the state (shown on hover/tap). */
  reason: string;
}

/**
 * Derive the runtime health info for an environment from existing signals.
 *
 * Derivation priority:
 *  1. If the instance is unreachable → "unreachable"
 *  2. If daemon is not connected → use stored runtimeState as best-effort
 *  3. If agent runtime is opencode, use OpenCodeConnectionStatus for fine-grained state
 *  4. Otherwise use the coarser environment.runtimeState
 */
export function deriveRuntimeHealth(
  environment: Environment,
  health: EnvironmentHealth,
  reachability: ReachabilityState | undefined,
  openCodeStatus: OpenCodeConnectionStatus | undefined,
  runtimeState: RuntimeState | undefined,
): RuntimeHealthInfo {
  // 1. Unreachable instance overrides everything
  if (reachability === "unreachable" || reachability === "reconnecting") {
    return {
      state: "unreachable",
      reason: standaloneIntl.formatMessage({ id: "runtimeHealth.unreachableReason" }),
    };
  }

  // 2. Daemon not connected — can't determine runtime health freshly
  if (health !== "ok") {
    // If we have a stored runtimeState, use that as a best-effort signal
    if (runtimeState === "unavailable") {
      return {
        state: "not-installed",
        reason: standaloneIntl.formatMessage({ id: "runtimeHealth.notInstalledReason" }),
      };
    }
    return {
      state: "unreachable",
      reason: standaloneIntl.formatMessage({ id: "runtimeHealth.daemonDownReason" }),
    };
  }

  // 3. For opencode, inspect OpenCodeConnectionStatus for fine-grained state
  const agentRuntime = environment.agentRuntime;

  if (agentRuntime === "opencode" && openCodeStatus) {
    return deriveOpenCodeHealth(openCodeStatus, runtimeState);
  }

  // 4. For claude (or unknown runtime), use runtimeState
  return deriveFromRuntimeState(runtimeState, agentRuntime);
}

function deriveOpenCodeHealth(
  status: OpenCodeConnectionStatus,
  runtimeState: RuntimeState | undefined,
): RuntimeHealthInfo {
  // Auth problem
  if (status.errorKind === "unauthenticated") {
    return {
      state: "auth-problem",
      reason: extractErrorMessage(status.errorMessage)
        ?? standaloneIntl.formatMessage({ id: "runtimeHealth.authProblemReason" }),
    };
  }

  if (status.errorKind === "rejected") {
    return {
      state: "auth-problem",
      reason: extractErrorMessage(status.errorMessage)
        ?? standaloneIntl.formatMessage({ id: "runtimeHealth.rejectedReason" }),
    };
  }

  // Unreachable / not running
  if (status.errorKind === "unreachable") {
    // Distinguish "not installed" vs "not running"
    if (runtimeState === "unavailable") {
      return {
        state: "not-installed",
        reason: standaloneIntl.formatMessage({ id: "runtimeHealth.notInstalledReason" }),
      };
    }
    return {
      state: "not-running",
      reason: extractErrorMessage(status.errorMessage)
        ?? standaloneIntl.formatMessage({ id: "runtimeHealth.notRunningReason" }),
    };
  }

  // Version too old
  if (status.errorKind === "version") {
    return {
      state: "not-running",
      reason: extractErrorMessage(status.errorMessage)
        ?? standaloneIntl.formatMessage({ id: "runtimeHealth.versionTooOldReason" }),
    };
  }

  // Authenticated with connected providers
  if (status.authState === "authenticated") {
    return {
      state: "ok",
      reason: standaloneIntl.formatMessage({ id: "runtimeHealth.okReason" }),
    };
  }

  // Authenticated but no providers — still an auth problem
  if (status.authState === "unauthenticated") {
    return {
      state: "auth-problem",
      reason: standaloneIntl.formatMessage({ id: "runtimeHealth.authProblemReason" }),
    };
  }

  // Unknown — fall back to runtimeState
  return deriveFromRuntimeState(runtimeState, "opencode");
}

function deriveFromRuntimeState(
  runtimeState: RuntimeState | undefined,
  agentRuntime: AgentRuntime | undefined,
): RuntimeHealthInfo {
  const label = agentRuntime === "claude" ? "Claude Code" : agentRuntime === "opencode" ? "OpenCode" : "Runtime";

  switch (runtimeState) {
    case "available":
      return {
        state: "ok",
        reason: standaloneIntl.formatMessage({ id: "runtimeHealth.okReason" }),
      };
    case "unavailable":
      return {
        state: "not-installed",
        reason: standaloneIntl.formatMessage({ id: "runtimeHealth.notInstalledLabelReason" }, { label }),
      };
    case "unknown":
    default:
      return {
        state: "not-running",
        reason: standaloneIntl.formatMessage({ id: "runtimeHealth.unknownReason" }, { label }),
      };
  }
}

/** Extract a plain string from an I18nMessage or string error. */
function extractErrorMessage(msg: string | import("../../shared/ipc").I18nMessage | null): string | null {
  if (!msg) return null;
  if (typeof msg === "string") return msg;
  // I18nMessage — return the key as a best-effort readable string
  return msg.key;
}

/** Color token for each runtime health state. */
export const RUNTIME_HEALTH_COLORS: Record<RuntimeHealthState, string> = {
  ok: "var(--health-ok)",
  "not-running": "var(--health-connecting)",
  "not-installed": "var(--health-offline)",
  "auth-problem": "var(--health-blocked)",
  unreachable: "var(--health-unknown)",
};
