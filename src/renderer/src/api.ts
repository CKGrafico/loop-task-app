import type { ApiResponse, StreamEventPayload } from "../../shared/ipc";
import type { Instance, LoopMeta, Project, TaskDefinition } from "./types";
import { mockRequest, mockSubscribeLogs } from "./mock";

export const isMock = typeof window !== "undefined" && !window.api;

// ── REST ──────────────────────────────────────────────────────────────

export async function apiRequest<T = unknown>(
  instance: Instance,
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
): Promise<ApiResponse<T>> {
  if (!window.api) {
    return mockRequest<T>(path);
  }
  return window.api.request<T>({ baseUrl: instance.baseUrl, path, method, body });
}

export function fetchLoops(instance: Instance): Promise<ApiResponse<LoopMeta[]>> {
  return apiRequest<LoopMeta[]>(instance, "/api/loops");
}

export function fetchLoop(instance: Instance, id: string): Promise<ApiResponse<LoopMeta>> {
  return apiRequest<LoopMeta>(instance, `/api/loops/${encodeURIComponent(id)}`);
}

export function fetchProjects(instance: Instance): Promise<ApiResponse<Project[]>> {
  return apiRequest<Project[]>(instance, "/api/projects");
}

export function fetchTasks(instance: Instance): Promise<ApiResponse<TaskDefinition[]>> {
  return apiRequest<TaskDefinition[]>(instance, "/api/tasks");
}

export function fetchLogs(
  instance: Instance,
  loopId: string,
  tail: number,
): Promise<ApiResponse<string>> {
  return apiRequest<string>(instance, `/api/loops/${encodeURIComponent(loopId)}/logs?tail=${tail}`);
}

// ── SSE log streaming ────────────────────────────────────────────────
// One global listener dispatches stream events to per-subscription callbacks.

interface LogStreamHandlers {
  onLine: (line: string) => void;
  onClose?: () => void;
}

const handlers = new Map<string, LogStreamHandlers>();
let globalUnlisten: (() => void) | null = null;

function ensureGlobalListener(): void {
  if (globalUnlisten || !window.api) return;
  globalUnlisten = window.api.onStreamEvent((payload: StreamEventPayload) => {
    const handler = handlers.get(payload.subId);
    if (!handler) return;
    if (payload.kind === "data") {
      handler.onLine(payload.text);
    } else if (payload.kind === "end" || payload.kind === "error") {
      handler.onClose?.();
      handlers.delete(payload.subId);
    }
  });
}

/**
 * Follow a loop's log via SSE. Returns an unsubscribe function.
 * In mock mode, emits synthetic lines on an interval.
 */
export function subscribeLogs(
  instance: Instance,
  loopId: string,
  onLine: (line: string) => void,
  onClose?: () => void,
): () => void {
  if (!window.api) {
    return mockSubscribeLogs(loopId, onLine);
  }

  ensureGlobalListener();
  const subId = crypto.randomUUID();
  handlers.set(subId, { onLine, onClose });

  void window.api.subscribeStream({
    subId,
    baseUrl: instance.baseUrl,
    path: `/api/loops/${encodeURIComponent(loopId)}/logs/stream?tail=0`,
  });

  return () => {
    handlers.delete(subId);
    void window.api?.unsubscribeStream(subId);
  };
}
