// Mirrors the loop-task daemon's domain types (subset the app consumes).
// Source of truth: loop-task repo src/types.ts + GET /api/openapi.json.

export type LoopStatus = "running" | "waiting" | "paused" | "idle" | "stopped";

export interface RunRecord {
  runNumber: number;
  startedAt: string;
  exitCode: number | null;
  duration: number | null;
  logSize: number;
  status: "running" | "completed";
  logOffset: number;
}

export interface LoopMeta {
  id: string;
  description?: string;
  status: LoopStatus;
  command: string;
  commandArgs: string[];
  cwd: string;
  intervalHuman: string;
  maxRuns: number | null;
  runCount: number;
  skippedCount: number;
  lastExitCode: number | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
  sessionStartedAt?: string | null;
  createdAt?: string;
  pid: number | null;
  projectId?: string;
  taskId?: string | null;
  runHistory: RunRecord[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  isSystem?: boolean;
}

export interface TaskDefinition {
  id: string;
  name: string;
  command: string;
  commandArgs: string[];
  commandRaw?: string;
  onSuccessTaskId: string | null;
  onFailureTaskId: string | null;
  createdAt: string;
}

/** Section switcher inside an instance. */
export type Section = "loops" | "tasks" | "projects";

/** A registered loop-task daemon the app talks to. */
export interface Instance {
  id: string;
  name: string;
  baseUrl: string;
}

export type InstanceHealth = "unknown" | "ok" | "offline" | "connecting" | "backoff" | "blocked";
