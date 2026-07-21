import { execFile } from "node:child_process";
import type { PlatformType } from "../shared/ipc.js";

export interface PlatformDetection {
  platform: PlatformType;
  remotes: string[];
}

/**
 * Classify the hosting platform from a set of git remote URLs.
 *
 * Recognised patterns:
 * - **GitHub**: `github.com` in HTTPS or SSH form.
 * - **Azure DevOps**: `dev.azure.com` or `ssh.dev.azure.com`.
 *
 * If *any* remote matches a known platform, that platform is returned.
 * If remotes match *multiple* known platforms, the first match wins
 * (in the order: github → ado).
 * Unknown or empty remotes yield `"unknown"`.
 */
export function classifyPlatform(remoteUrls: string[]): PlatformType {
  for (const url of remoteUrls) {
    const lower = url.toLowerCase();

    // GitHub: https://github.com/... or git@github.com:...
    if (lower.includes("github.com")) {
      return "github";
    }

    // Azure DevOps: https://dev.azure.com/... or ssh://git@ssh.dev.azure.com/...
    if (lower.includes("dev.azure.com") || lower.includes("ssh.dev.azure.com")) {
      return "ado";
    }
  }

  return "unknown";
}

/**
 * Parse `git remote -v` output into an array of unique remote URLs.
 *
 * Input format (one line per remote per direction):
 * ```
 * origin  https://github.com/org/repo.git (fetch)
 * origin  https://github.com/org/repo.git (push)
 * upstream        git@github.com:org/repo.git (fetch)
 * ```
 *
 * Returns unique URLs only (deduped — fetch and push with the same URL
 * produce one entry).
 */
export function parseGitRemoteOutput(output: string): string[] {
  const urls = new Set<string>();

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Format: <name>\t<url> (fetch|push)
    const tabIdx = trimmed.indexOf("\t");
    if (tabIdx === -1) continue;

    const afterTab = trimmed.slice(tabIdx + 1);
    const parenIdx = afterTab.lastIndexOf(" (");
    const url = parenIdx !== -1 ? afterTab.slice(0, parenIdx).trim() : afterTab.trim();

    if (url) urls.add(url);
  }

  return [...urls];
}

/** Session-scoped cache: `${environmentId}:${projectId}` → detected platform. */
export const platformCache = new Map<string, PlatformType>();

export function platformCacheKey(environmentId: string, projectId: string): string {
  return `${environmentId}:${projectId}`;
}

/**
 * Detect the hosting platform by inspecting git remotes in a directory.
 * Returns both the classified platform and the parsed remote URLs from
 * a single `git remote -v` execution.
 * Falls back to `{ platform: "unknown", remotes: [] }` on failure.
 */
export function detectPlatform(directory: string): Promise<PlatformDetection> {
  return new Promise((resolve) => {
    execFile("git", ["remote", "-v"], { cwd: directory, timeout: 10_000 }, (err, stdout) => {
      if (err) {
        resolve({ platform: "unknown", remotes: [] });
        return;
      }
      const urls = parseGitRemoteOutput(stdout);
      resolve({
        platform: classifyPlatform(urls),
        remotes: urls,
      });
    });
  });
}
