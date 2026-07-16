import { cid, useInject } from "inversify-hooks";
import type { ApiResponse, StreamEventPayload } from "../../shared/ipc";
import type { Environment, LoopMeta, Project, TaskDefinition } from "./types";
import type { IApiService, IStreamService } from "./services/interfaces";

export function resolveBaseUrl(env: Environment): string {
  if (env.activeEndpointId) {
    const ep = env.endpoints.find((e) => e.id === env.activeEndpointId);
    if (ep) return ep.url;
  }
  return env.endpoints.length > 0 ? env.endpoints[0].url : "";
}

export function useApi(): {
  fetchLoops: (env: Environment) => Promise<ApiResponse<LoopMeta[]>>;
  fetchLoop: (env: Environment, id: string) => Promise<ApiResponse<LoopMeta>>;
  fetchProjects: (env: Environment) => Promise<ApiResponse<Project[]>>;
  fetchTasks: (env: Environment) => Promise<ApiResponse<TaskDefinition[]>>;
  fetchLogs: (env: Environment, loopId: string, tail: number) => Promise<ApiResponse<string>>;
  fetchSettings: (env: Environment) => Promise<ApiResponse<DaemonSettings>>;
  subscribeLogs: (env: Environment, loopId: string, onLine: (line: string) => void, onClose?: () => void) => () => void;
} {
  const [apiService] = useInject<IApiService>(cid.IApiService);

  const apiRequest = <T = unknown>(
    env: Environment,
    path: string,
    method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
    body?: unknown,
  ): Promise<ApiResponse<T>> => {
    const baseUrl = resolveBaseUrl(env);
    return apiService.request<T>({ baseUrl, path, method, body });
  };

  const fetchLoops = (env: Environment): Promise<ApiResponse<LoopMeta[]>> =>
    apiRequest<LoopMeta[]>(env, "/api/loops");

  const fetchLoop = (env: Environment, id: string): Promise<ApiResponse<LoopMeta>> =>
    apiRequest<LoopMeta>(env, `/api/loops/${encodeURIComponent(id)}`);

  const fetchProjects = (env: Environment): Promise<ApiResponse<Project[]>> =>
    apiRequest<Project[]>(env, "/api/projects");

  const fetchTasks = (env: Environment): Promise<ApiResponse<TaskDefinition[]>> =>
    apiRequest<TaskDefinition[]>(env, "/api/tasks");

  const fetchLogs = (env: Environment, loopId: string, tail: number): Promise<ApiResponse<string>> =>
    apiRequest<string>(env, `/api/loops/${encodeURIComponent(loopId)}/logs?tail=${tail}`);

  const fetchSettings = (env: Environment): Promise<ApiResponse<DaemonSettings>> =>
    apiRequest<DaemonSettings>(env, "/api/settings");

  const subscribeLogs = (
    env: Environment,
    loopId: string,
    onLine: (line: string) => void,
    onClose?: () => void,
  ): (() => void) => {
    const [streamService] = useInject<IStreamService>(cid.IStreamService);
    const subId = crypto.randomUUID();

    const baseUrl = resolveBaseUrl(env);
    void streamService.subscribeStream({
      subId,
      baseUrl,
      path: `/api/loops/${encodeURIComponent(loopId)}/logs/stream?tail=0`,
    });

    const unsub = streamService.onStreamEvent((payload: StreamEventPayload) => {
      if (payload.subId !== subId) return;
      if (payload.kind === "data") onLine(payload.text);
      else if (payload.kind === "end" || payload.kind === "error") {
        onClose?.();
        void streamService.unsubscribeStream(subId);
      }
    });

    return () => {
      unsub();
      void streamService.unsubscribeStream(subId);
    };
  };

  return { fetchLoops, fetchLoop, fetchProjects, fetchTasks, fetchLogs, fetchSettings, subscribeLogs };
}

export interface DaemonSettings {
  httpApiEnabled: boolean;
  mcpApiEnabled: boolean;
  httpApiHost: string;
}

// Standalone functions for components that can't use hooks (e.g. inside effects)
// These use the container directly
import { container } from "inversify-hooks";
import type { ApiRequestArgs } from "../../shared/ipc";

export function apiRequest<T = unknown>(
  env: Environment,
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
): Promise<ApiResponse<T>> {
  const apiService = container.resolve<IApiService>("IApiService");
  const baseUrl = resolveBaseUrl(env);
  return apiService.request<T>({ baseUrl, path, method, body });
}
