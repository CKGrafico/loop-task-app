import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type {
  EvidenceAsset,
  EvidenceManifest,
  PassedEvidenceResult,
  RepoCoordinates,
} from "./types.js";

export type CommandRunner = (
  command: string,
  args: readonly string[],
  cwd: string,
) => string;

export interface VerifiedAsset {
  readonly asset: EvidenceAsset;
  readonly commitSha: string;
  readonly url: string;
}

export interface VerifiedPublication {
  readonly changeId: string;
  readonly issueNumber: number;
  readonly evidenceDirectory: string;
  readonly assets: readonly VerifiedAsset[];
  readonly markdown: string;
}

const defaultRunner: CommandRunner = (command, args, cwd) =>
  execFileSync(command, [...args], { cwd, encoding: "utf8" }).trim();

export function issueNumberFromChangeId(changeId: string): number {
  const match = /^gh-(\d+)(?:-|$)/.exec(changeId);
  if (!match) {
    throw new Error(`Cannot derive a GitHub issue number from change id "${changeId}".`);
  }
  return Number(match[1]);
}

export function resolveEvidenceDirectory(repoRoot: string, changeId: string): string {
  const active = path.join(repoRoot, "openspec", "changes", changeId, "evidence");
  if (fs.existsSync(path.join(active, "evidence.json"))) return active;

  const archiveRoot = path.join(repoRoot, "openspec", "changes", "archive");
  if (!fs.existsSync(archiveRoot)) {
    throw new Error(`Evidence not found for change "${changeId}".`);
  }

  const archived = fs.readdirSync(archiveRoot)
    .filter((entry) => entry.endsWith(`-${changeId}`))
    .sort()
    .reverse()
    .map((entry) => path.join(archiveRoot, entry, "evidence"))
    .find((candidate) => fs.existsSync(path.join(candidate, "evidence.json")));

  if (!archived) {
    throw new Error(`Evidence not found for active or archived change "${changeId}".`);
  }
  return archived;
}

export function readPassedManifest(evidenceDirectory: string): PassedEvidenceResult {
  const manifestPath = path.join(evidenceDirectory, "evidence.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as EvidenceManifest;
  if (manifest.status !== "passed") {
    throw new Error(`Evidence manifest is not passed: ${manifest.status}.`);
  }
  if (manifest.assets.length === 0) {
    throw new Error("Passed evidence manifest has no assets.");
  }
  return manifest;
}

export function resolveAssetCommit(
  repoRoot: string,
  assetPath: string,
  runner: CommandRunner = defaultRunner,
): string {
  const sha = runner("git", ["log", "-n", "1", "--format=%H", "--", assetPath], repoRoot);
  if (!sha) {
    throw new Error(`Evidence asset is not committed: ${assetPath}.`);
  }
  return sha;
}

export function verifyRemoteAsset(
  repoRoot: string,
  repo: RepoCoordinates,
  assetPath: string,
  commitSha: string,
  runner: CommandRunner = defaultRunner,
): void {
  const endpoint = `repos/${repo.owner}/${repo.name}/contents/${assetPath}?ref=${commitSha}`;
  runner("gh", ["api", endpoint, "--silent"], repoRoot);
}

export function createVerifiedPublication(
  repoRoot: string,
  changeId: string,
  repo: RepoCoordinates,
  runner: CommandRunner = defaultRunner,
): VerifiedPublication {
  const evidenceDirectory = resolveEvidenceDirectory(repoRoot, changeId);
  const manifest = readPassedManifest(evidenceDirectory);
  const assets = manifest.assets.map((asset) => {
    const commitSha = resolveAssetCommit(repoRoot, asset.path, runner);
    verifyRemoteAsset(repoRoot, repo, asset.path, commitSha, runner);
    return {
      asset,
      commitSha,
      url: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${commitSha}/${asset.path}`,
    };
  });

  return {
    changeId,
    issueNumber: issueNumberFromChangeId(changeId),
    evidenceDirectory,
    assets,
    markdown: buildVerifiedMarkdown(manifest, assets),
  };
}

export function buildVerifiedMarkdown(
  manifest: PassedEvidenceResult,
  assets: readonly VerifiedAsset[],
): string {
  const lines = ["## Visual Evidence", "", `### ${manifest.scenario.title}`, ""];
  for (const verified of assets) {
    lines.push(`#### ${verified.asset.caption}`);
    lines.push(`![${verified.asset.caption}](${verified.url})`);
    lines.push("");
  }
  lines.push("### Acceptance checks");
  for (const assertion of manifest.assertions) {
    lines.push(`- [${assertion.status === "passed" ? "x" : " "}] ${assertion.description}`);
  }
  return lines.join("\n");
}
