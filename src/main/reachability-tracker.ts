import type { ConnectionPhase } from "../shared/ipc.js";
import type { ReachabilityState, ReachabilityStatus } from "../shared/ipc.js";

/**
 * Derives per-environment reachability from the ConnectionSupervisor's phase.
 *
 * Reachability is its own health layer, separate from loop status:
 * - "connected": phase === "connected" (daemon API reachable and responding)
 * - "reconnecting": phase === "connecting" | "backoff" (auto-reconnect in progress)
 * - "unreachable": phase === "offline" | "blocked" (no path to daemon)
 *
 * This state is NEVER derived from loop exit codes. A dropped tunnel never
 * renders as "loop failed" — loops on an unreachable instance show as "unknown".
 */
export class ReachabilityTracker {
  private states = new Map<string, ReachabilityStatus>();
  private listeners: ((status: ReachabilityStatus) => void)[] = [];
  private destroyed = false;

  /**
   * Called by the connection supervisor whenever an environment's phase changes.
   * Derives the reachability state from the connection phase.
   */
  handleConnectionPhaseChange(
    environmentId: string,
    phase: ConnectionPhase,
  ): void {
    if (this.destroyed) return;

    const newState = phaseToReachability(phase);
    const existing = this.states.get(environmentId);

    // Skip if unchanged
    if (existing && existing.state === newState) return;

    const status: ReachabilityStatus = {
      environmentId,
      state: newState,
      changedAt: new Date().toISOString(),
    };

    this.states.set(environmentId, status);
    this.emitChange(status);
  }

  /**
   * Remove an environment from tracking (e.g. when the environment is deleted).
   */
  removeEnvironment(environmentId: string): void {
    this.states.delete(environmentId);
  }

  /**
   * Get current reachability for a single environment.
   */
  getStatus(environmentId: string): ReachabilityStatus | null {
    return this.states.get(environmentId) ?? null;
  }

  /**
   * Get current reachability for all tracked environments.
   */
  getAll(): ReachabilityStatus[] {
    return [...this.states.values()];
  }

  /**
   * Subscribe to reachability state changes.
   */
  onStatusChange(cb: (status: ReachabilityStatus) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  destroy(): void {
    this.destroyed = true;
    this.listeners.length = 0;
    this.states.clear();
  }

  private emitChange(status: ReachabilityStatus): void {
    for (const listener of this.listeners) {
      listener(status);
    }
  }
}

/**
 * Map a ConnectionPhase to a ReachabilityState.
 *
 * This is the core derivation that enforces "reachability is its own health
 * layer, separate from loop status." The mapping uses ONLY tunnel and API
 * health signals — never loop exit codes.
 */
export function phaseToReachability(phase: ConnectionPhase): ReachabilityState {
  switch (phase) {
    case "connected":
      return "connected";
    case "connecting":
    case "backoff":
      return "reconnecting";
    case "offline":
    case "blocked":
      return "unreachable";
    default:
      return "unreachable";
  }
}
