import { app, BrowserWindow, ipcMain, shell } from "electron";
import path from "node:path";
import fs from "node:fs";
import type {
  ApiRequestArgs,
  ApiResponse,
  ConnectionStatus,
  EndpointHealth,
  StreamSubscribeArgs,
} from "../shared/ipc.js";
import type { Environment } from "../shared/ipc.js";
import {
  getEnvironments,
  addEnvironment,
  removeEnvironment,
  addEndpoint,
  removeEndpoint,
  setActiveEndpoint,
  getSelectedEnvironmentId,
  setSelectedEnvironmentId,
  migrateFromLocalStorage,
  updateEndpointHealth,
} from "./config-store.js";
import {
  ConnectionSupervisor,
  makeProbe,
  resolveActiveUrl,
  fetchFingerprint,
} from "./connection-supervisor.js";

const DEFAULT_TIMEOUT_MS = 10_000;

const streams = new Map<string, AbortController>();

const supervisors = new Map<string, ConnectionSupervisor>();

function getOrCreateSupervisor(environmentId: string, baseUrl: string): ConnectionSupervisor {
  let existing = supervisors.get(environmentId);
  if (existing) return existing;

  const supervisor = new ConnectionSupervisor(
    makeProbe(baseUrl),
    (status: ConnectionStatus) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win && !win.isDestroyed()) {
        win.webContents.send("connection:status", { environmentId, status });
      }
    },
  );
  supervisors.set(environmentId, supervisor);
  supervisor.start();
  return supervisor;
}

function removeSupervisor(environmentId: string): void {
  const supervisor = supervisors.get(environmentId);
  if (supervisor) {
    supervisor.destroy();
    supervisors.delete(environmentId);
  }
}

function wakeupAll(): void {
  for (const supervisor of supervisors.values()) {
    supervisor.wakeup();
  }
}

let osOffline = false;

function setOsOffline(value: boolean): void {
  if (osOffline === value) return;
  osOffline = value;
  if (!osOffline) {
    wakeupAll();
  }
}

function isAllowedBaseUrl(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function joinUrl(baseUrl: string, apiPath: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${apiPath.startsWith("/") ? "" : "/"}${apiPath}`;
}

async function handleApiRequest(args: ApiRequestArgs): Promise<ApiResponse> {
  if (!isAllowedBaseUrl(args.baseUrl)) {
    return { ok: false, status: 0, error: `Invalid environment URL: ${args.baseUrl}` };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), args.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(joinUrl(args.baseUrl, args.path), {
      method: args.method ?? "GET",
      headers: args.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: args.body !== undefined ? JSON.stringify(args.body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      // keep raw text for non-JSON responses
    }

    if (parsed && typeof parsed === "object" && "ok" in parsed) {
      const envelope = parsed as { ok: boolean; data?: unknown; error?: { message?: string } };
      if (envelope.ok) {
        return { ok: true, status: res.status, data: envelope.data };
      }
      return { ok: false, status: res.status, error: envelope.error?.message ?? `HTTP ${res.status}` };
    }

    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, data: parsed };
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError"
      ? "Request timed out"
      : err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

async function handleStreamSubscribe(
  sender: Electron.WebContents,
  args: StreamSubscribeArgs,
): Promise<void> {
  if (!isAllowedBaseUrl(args.baseUrl)) return;
  if (streams.has(args.subId)) return;

  const controller = new AbortController();
  streams.set(args.subId, controller);

  const send = (kind: "data" | "event" | "end" | "error", text: string): void => {
    if (!sender.isDestroyed()) {
      sender.send("stream:event", { subId: args.subId, kind, text });
    }
  };

  try {
    const res = await fetch(joinUrl(args.baseUrl, args.path), {
      signal: controller.signal,
      headers: { Accept: "text/event-stream" },
    });
    if (!res.ok || !res.body) {
      send("error", `HTTP ${res.status}`);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    for await (const chunk of res.body) {
      buffer += decoder.decode(chunk as Uint8Array, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        for (const line of block.split("\n")) {
          if (line.startsWith("data: ")) {
            send("data", line.slice(6));
          } else if (line.startsWith("event: ")) {
            send("event", line.slice(7));
          }
        }
      }
    }
    send("end", "");
  } catch (err) {
    if (!(err instanceof Error && err.name === "AbortError")) {
      send("error", err instanceof Error ? err.message : String(err));
    }
  } finally {
    streams.delete(args.subId);
  }
}

interface WindowBounds {
  x?: number;
  y?: number;
  width: number;
  height: number;
  maximized?: boolean;
}

function boundsFile(): string {
  return path.join(app.getPath("userData"), "window-bounds.json");
}

function loadBounds(): WindowBounds {
  try {
    const raw = fs.readFileSync(boundsFile(), "utf8");
    const parsed = JSON.parse(raw) as WindowBounds;
    if (typeof parsed.width === "number" && typeof parsed.height === "number") return parsed;
  } catch {
    // first launch or corrupt file — use defaults
  }
  return { width: 1440, height: 900 };
}

function saveBounds(win: BrowserWindow): void {
  try {
    const bounds: WindowBounds = { ...win.getNormalBounds(), maximized: win.isMaximized() };
    fs.writeFileSync(boundsFile(), JSON.stringify(bounds));
  } catch {
    // non-fatal
  }
}

function seedSupervisors(): void {
  for (const env of getEnvironments()) {
    const url = resolveActiveUrl(env.endpoints, env.activeEndpointId);
    if (url) {
      getOrCreateSupervisor(env.id, url);
    }
  }
}

function createWindow(): void {
  const saved = loadBounds();
  const win = new BrowserWindow({
    x: saved.x,
    y: saved.y,
    width: saved.width,
    height: saved.height,
    minWidth: 960,
    minHeight: 600,
    show: false,
    title: "Orbion",
    backgroundColor: "#262624",
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#262624",
      symbolColor: "#9b9891",
      height: 40,
    },
    webPreferences: {
      preload: path.join(import.meta.dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once("ready-to-show", () => {
    if (saved.maximized) win.maximize();
    win.show();
  });

  let saveTimer: NodeJS.Timeout | null = null;
  const scheduleSave = (): void => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveBounds(win), 500);
  };
  win.on("resize", scheduleSave);
  win.on("move", scheduleSave);
  win.on("close", () => saveBounds(win));

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(path.join(import.meta.dirname, "../renderer/index.html"));
  }

  win.on("focus", () => {
    wakeupAll();
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

app.on("second-instance", () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.setName("Orbion");

app.whenReady().then(() => {
  ipcMain.handle("api:request", (_event, args: ApiRequestArgs) => handleApiRequest(args));

  ipcMain.handle("stream:subscribe", (event, args: StreamSubscribeArgs) => {
    void handleStreamSubscribe(event.sender, args);
  });

  ipcMain.handle("stream:unsubscribe", (_event, subId: string) => {
    streams.get(subId)?.abort();
    streams.delete(subId);
  });

  ipcMain.handle("config:getEnvironments", () => getEnvironments());
  ipcMain.handle("config:addEnvironment", (_event, name: string, url: string, kind?: string) => {
    const env = addEnvironment(name, url, (kind as "direct" | "ssh" | "tailscale") ?? "direct");
    const activeUrl = resolveActiveUrl(env.endpoints, env.activeEndpointId);
    if (activeUrl) getOrCreateSupervisor(env.id, activeUrl);
    return env;
  });
  ipcMain.handle("config:removeEnvironment", (_event, id: string) => {
    removeSupervisor(id);
    removeEnvironment(id);
  });
  ipcMain.handle("config:addEndpoint", (_event, environmentId: string, url: string, kind: string) => {
    const ep = addEndpoint(environmentId, url, kind as "direct" | "ssh" | "tailscale");
    return ep;
  });
  ipcMain.handle("config:removeEndpoint", (_event, environmentId: string, endpointId: string) => {
    removeEndpoint(environmentId, endpointId);
  });
  ipcMain.handle("config:setActiveEndpoint", (_event, environmentId: string, endpointId: string) => {
    setActiveEndpoint(environmentId, endpointId);
    const envs = getEnvironments();
    const env = envs.find((e: Environment) => e.id === environmentId);
    if (env) {
      const url = resolveActiveUrl(env.endpoints, endpointId);
      if (url) {
        removeSupervisor(environmentId);
        getOrCreateSupervisor(environmentId, url);
      }
    }
  });
  ipcMain.handle("config:getSelectedEnvironmentId", () => getSelectedEnvironmentId());
  ipcMain.handle("config:setSelectedEnvironmentId", (_event, id: string | null) =>
    setSelectedEnvironmentId(id),
  );
  ipcMain.handle(
    "config:migrateFromLocalStorage",
    (_event, rawInstances: string, rawSelectedId: string | null) =>
      migrateFromLocalStorage(rawInstances, rawSelectedId),
  );

  ipcMain.handle("connection:getStatus", (_event, environmentId: string) => {
    const supervisor = supervisors.get(environmentId);
    return supervisor ? supervisor.getStatus() : null;
  });

  ipcMain.handle("connection:getEndpointHealth", (_event, environmentId: string): EndpointHealth[] => {
    const envs = getEnvironments();
    const env = envs.find((e: Environment) => e.id === environmentId);
    if (!env) return [];
    return env.endpoints.map((ep) => ({
      endpointId: ep.id,
      phase: ep.failureCount > 0 && ep.lastError ? "backoff" as const : "connected" as const,
      lastError: ep.lastError,
      failureCount: ep.failureCount,
    }));
  });

  ipcMain.handle("connection:retry", (_event, environmentId: string) => {
    const supervisor = supervisors.get(environmentId);
    if (supervisor) supervisor.wakeup();
  });

  ipcMain.on("connection:networkChanged", (_event, online: boolean) => {
    setOsOffline(!online);
  });

  ipcMain.handle("connection:fetchFingerprint", async (_event, baseUrl: string) => {
    return fetchFingerprint(baseUrl);
  });

  seedSupervisors();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  for (const controller of streams.values()) controller.abort();
  streams.clear();
  for (const supervisor of supervisors.values()) supervisor.destroy();
  supervisors.clear();
  if (process.platform !== "darwin") app.quit();
});
