import { BrowserWindow } from "electron";

/**
 * Module-level reference to the main Orbion window.
 * Set once in createWindow(), cleared on close.
 */
let mainWindow: BrowserWindow | null = null;

/**
 * Store the main window reference. Called from createWindow().
 * Automatically clears the reference when the window closes.
 */
export function setMainWindow(win: BrowserWindow): void {
  mainWindow = win;
  win.on("closed", () => {
    mainWindow = null;
  });
}

/**
 * Returns the main Orbion BrowserWindow, or null if it has been
 * destroyed or not yet created. Replaces all
 * `BrowserWindow.getAllWindows()[0]` call sites with a single
 * deterministic, isDestroyed-safe accessor.
 */
export function getMainWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  mainWindow = null;
  return null;
}
