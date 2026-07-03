import type { LoopTaskBridge } from "../../shared/ipc";

declare global {
  interface Window {
    /** Injected by the Electron preload. Absent in plain-browser dev (mock mode). */
    api?: LoopTaskBridge;
  }
}

export {};
