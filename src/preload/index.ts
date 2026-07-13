import { contextBridge, ipcRenderer } from "electron";
import type {
  ApiRequestArgs,
  ConnectionStatus,
  StreamSubscribeArgs,
  StreamEventPayload,
  LoopTaskBridge,
} from "../shared/ipc.js";

const bridge: LoopTaskBridge = {
  request: (args: ApiRequestArgs) => ipcRenderer.invoke("api:request", args),

  subscribeStream: (args: StreamSubscribeArgs) =>
    ipcRenderer.invoke("stream:subscribe", args),

  unsubscribeStream: (subId: string) =>
    ipcRenderer.invoke("stream:unsubscribe", subId),

  onStreamEvent: (cb: (payload: StreamEventPayload) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: StreamEventPayload): void => {
      cb(payload);
    };
    ipcRenderer.on("stream:event", listener);
    return () => {
      ipcRenderer.removeListener("stream:event", listener);
    };
  },

  config: {
    getInstances: () => ipcRenderer.invoke("config:getInstances"),
    addInstance: (name: string, baseUrl: string) =>
      ipcRenderer.invoke("config:addInstance", name, baseUrl),
    removeInstance: (id: string) => ipcRenderer.invoke("config:removeInstance", id),
    getSelectedInstanceId: () => ipcRenderer.invoke("config:getSelectedInstanceId"),
    setSelectedInstanceId: (id: string | null) =>
      ipcRenderer.invoke("config:setSelectedInstanceId", id),
    migrateFromLocalStorage: (rawInstances: string, rawSelectedId: string | null) =>
      ipcRenderer.invoke("config:migrateFromLocalStorage", rawInstances, rawSelectedId),
  },

  connection: {
    getStatus: (instanceId: string) =>
      ipcRenderer.invoke("connection:getStatus", instanceId) as Promise<ConnectionStatus | null>,
    retry: (instanceId: string) =>
      ipcRenderer.invoke("connection:retry", instanceId) as Promise<void>,
    onStatusChange: (cb: (instanceId: string, status: ConnectionStatus) => void) => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        instanceId: string,
        status: ConnectionStatus,
      ): void => {
        cb(instanceId, status);
      };
      ipcRenderer.on("connection:status", listener);
      return () => {
        ipcRenderer.removeListener("connection:status", listener);
      };
    },
    notifyNetworkChanged: (online: boolean) => {
      ipcRenderer.send("connection:networkChanged", online);
    },
  },
};

contextBridge.exposeInMainWorld("api", bridge);
