// Mock adapter used when window.api is absent (plain-browser dev via
// `pnpm dev:web`). Lets the UI be developed, previewed, and screenshotted
// without Electron or a running loop-task daemon.

import type { ApiResponse } from "../../shared/ipc";
import type { LoopMeta, Project, TaskDefinition } from "./types";

const now = Date.now();
const iso = (offsetMs: number): string => new Date(now + offsetMs).toISOString();

const PROJECTS: Project[] = [
  { id: "default", name: "Default", color: "#ffffff", createdAt: iso(-86400000 * 12), isSystem: true },
  { id: "etl", name: "ETL", color: "#34d399", createdAt: iso(-86400000 * 3) },
  { id: "agents", name: "Agents", color: "#a78bfa", createdAt: iso(-86400000 * 2) },
];

function loop(partial: Partial<LoopMeta> & Pick<LoopMeta, "id" | "status" | "command">): LoopMeta {
  return {
    description: undefined,
    commandArgs: [],
    cwd: "C:\\Projects\\Personal\\loop-cli",
    intervalHuman: "30m",
    maxRuns: null,
    runCount: 0,
    skippedCount: 0,
    lastExitCode: null,
    lastRunAt: null,
    nextRunAt: null,
    pid: null,
    projectId: "default",
    taskId: null,
    runHistory: [],
    ...partial,
  };
}

const LOOPS: LoopMeta[] = [
  loop({
    id: "90c8d195",
    description: "echo hello quique",
    status: "waiting",
    command: "echo",
    commandArgs: ["hello", "quique"],
    runCount: 22,
    lastExitCode: 0,
    lastRunAt: iso(-4 * 60000),
    nextRunAt: iso(26 * 60000),
    pid: 36688,
  }),
  loop({
    id: "6ea6d1ce",
    description: "echo quique 2 3 4 3",
    status: "running",
    command: "echo",
    commandArgs: ["quique", "2", "3", "4", "3"],
    runCount: 22,
    lastExitCode: 0,
    lastRunAt: iso(-30000),
    nextRunAt: null,
    pid: 41200,
  }),
  loop({
    id: "278d022d",
    description: "opencode: implement issues labeled 'implementing'",
    status: "waiting",
    command: "opencode",
    commandArgs: ["run", "find the github issue with label implementing"],
    intervalHuman: "30m",
    runCount: 19,
    lastExitCode: 0,
    lastRunAt: iso(-9 * 60000),
    nextRunAt: iso(9 * 60000),
    projectId: "agents",
  }),
  loop({
    id: "858a1b5f",
    description: "sds",
    status: "waiting",
    command: "sds",
    runCount: 33,
    lastExitCode: 1,
    lastRunAt: iso(-2 * 60000),
    nextRunAt: iso(22 * 60000),
  }),
  loop({
    id: "b44f0a91",
    description: "nightly ETL sync",
    status: "paused",
    command: "./scripts/sync.sh",
    intervalHuman: "1h",
    runCount: 7,
    lastExitCode: 0,
    lastRunAt: iso(-50 * 60000),
    nextRunAt: null,
    projectId: "etl",
  }),
];

const TASKS: TaskDefinition[] = [
  {
    id: "5bb7254e",
    name: "say hi",
    command: "echo",
    commandArgs: ["hello", "quique"],
    onSuccessTaskId: "6037fbad",
    onFailureTaskId: null,
    createdAt: iso(-86400000 * 2),
  },
  {
    id: "6037fbad",
    name: "say by",
    command: "echo",
    commandArgs: ["bye", "bye", "quiquoee"],
    onSuccessTaskId: null,
    onFailureTaskId: null,
    createdAt: iso(-86400000 * 2),
  },
  {
    id: "e84c39cc",
    name: "implement issue",
    command: "opencode",
    commandArgs: ["run", "implement the github issue"],
    onSuccessTaskId: null,
    onFailureTaskId: "6037fbad",
    createdAt: iso(-86400000),
  },
];

const LOG_SAMPLE = [
  "[11:40:11] === Run #22 started ===",
  "hello quique",
  "[11:40:11] exit 0, duration 57ms",
  "[12:10:11] === Run #23 started ===",
  "hello quique",
  "[12:10:11] exit 0, duration 52ms",
].join("\n");

export function mockRequest<T>(path: string): Promise<ApiResponse<T>> {
  const respond = (data: unknown): ApiResponse<T> => ({ ok: true, status: 200, data: data as T });

  if (path.startsWith("/api/loops/") && path.includes("/logs")) {
    return Promise.resolve(respond(LOG_SAMPLE));
  }
  if (path.startsWith("/api/loops/")) {
    const id = path.split("/")[3]?.split("?")[0];
    const found = LOOPS.find((l) => l.id === id);
    return Promise.resolve(
      found ? respond(found) : { ok: false, status: 404, error: `Not found: ${id}` },
    );
  }
  if (path.startsWith("/api/loops")) {
    return Promise.resolve(respond(LOOPS));
  }
  if (path.startsWith("/api/projects")) {
    return Promise.resolve(respond(PROJECTS));
  }
  if (path.startsWith("/api/tasks")) {
    return Promise.resolve(respond(TASKS));
  }
  return Promise.resolve({ ok: false, status: 404, error: `No mock for ${path}` });
}

export function mockSubscribeLogs(
  _loopId: string,
  onLine: (line: string) => void,
): () => void {
  let run = 24;
  const timer = setInterval(() => {
    const ts = new Date().toLocaleTimeString("en-GB");
    onLine(`[${ts}] === Run #${run} started ===`);
    onLine("hello quique");
    onLine(`[${ts}] exit 0, duration ${Math.floor(40 + Math.random() * 60)}ms`);
    run += 1;
  }, 2500);
  return () => clearInterval(timer);
}
