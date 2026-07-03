import { contextBridge, ipcRenderer } from "electron";
import type {
  ApiRequestArgs,
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
};

contextBridge.exposeInMainWorld("api", bridge);
