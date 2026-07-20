import type { LoopMeta, LoopStatus, LoopWithOrigin, FleetLoopRollup, Project } from "./types";
import type { ReachabilityState } from "../shared/ipc";

/**
 * Compute a fleet-wide rollup from per-environment loop data.
 *
 * Loops on unreachable instances are excluded from tallies — they are
 * "unknown" (greyed), not failed. This follows the reachability health
 * layer invariant: a dropped tunnel never reads as "everything failed."
 *
 * Loops on reconnecting instances are also excluded since their actual
 * state cannot be confirmed.
 */
export function computeFleetRollup(
  perEnvLoops: Record<string, LoopMeta[]>,
  environments: Array<{ id: string; name: string }>,
  perEnvProjects: Record<string, Project[]>,
  reachability: Record<string, ReachabilityState>,
): FleetLoopRollup {
  const counts: Record<LoopStatus, number> = {
    running: 0,
    waiting: 0,
    paused: 0,
    stopped: 0,
    failed: 0,
    finished: 0,
  };

  const loopsWithOrigin: LoopWithOrigin[] = [];
  const projectNames = new Set<string>();

  for (const env of environments) {
    const envReachability = reachability[env.id];

    // Skip unreachable / reconnecting instances — their loops are "unknown"
    if (envReachability === "unreachable" || envReachability === "reconnecting") {
      continue;
    }

    const envLoops = perEnvLoops[env.id] ?? [];
    const envProjects = perEnvProjects[env.id] ?? [];

    for (const loop of envLoops) {
      // Resolve the project name for this loop
      const project = envProjects.find((p) => p.id === (loop.projectId ?? "default"));
      const projectName = project?.name ?? "Default";

      projectNames.add(projectName);
      counts[loop.status]++;

      loopsWithOrigin.push({
        loop,
        environmentId: env.id,
        environmentName: env.name,
        projectName,
      });
    }
  }

  return {
    loopsWithOrigin,
    projectCount: projectNames.size,
    counts,
  };
}
