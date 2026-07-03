import type { LoopStatus } from "./types";

// Status palette matches the loop-task TUI theme so both products read the same.
export const STATUS_COLORS: Record<LoopStatus, string> = {
  running: "#4ade80",
  waiting: "#38bdf8",
  paused: "#facc15",
  idle: "#fb923c",
  stopped: "#f87171",
};

export function timeAgo(isoDate: string | null): string {
  if (!isoDate) return "—";
  const diff = Date.now() - new Date(isoDate).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function timeUntil(isoDate: string | null): string {
  if (!isoDate) return "—";
  const diff = Math.max(0, new Date(isoDate).getTime() - Date.now());
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return "now";
  if (secs < 60) return `in ${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.floor(hrs / 24)}d`;
}

export function commandLine(command: string, args: string[]): string {
  return [command, ...args].join(" ").trim();
}

export function hostLabel(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    return url.host;
  } catch {
    return baseUrl;
  }
}
