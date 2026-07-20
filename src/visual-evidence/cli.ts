#!/usr/bin/env node
/**
 * Visual-evidence CLI entrypoint.
 *
 * Usage:
 *   pnpm visual-evidence --change <change-id>
 *   pnpm visual-evidence --input .orbion/context/<change-id>.json
 *
 * Reads the input, resolves the OpenSpec change, runs the visual-evidence
 * pipeline, prints the evidence PR markdown to stdout, and writes
 * evidence.json into the change's evidence/ folder.
 *
 * Exit codes:
 *   0 — passed or correctly skipped
 *   1 — failed (scenario assertions failed)
 *   2 — blocked (input/launch scenario unresolvable)
 *   3 — invalid input
 */
import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { validateInput, runVisualEvidence } from "./run.js";
import { resolveConfig, findRepoRoot } from "./config.js";
import { writeManifest } from "./manifest.js";
import { generatePrMarkdown } from "./pr-markdown.js";
import type { RepoCoordinates } from "./types.js";

interface ParsedArgs {
  change?: string;
  input?: string;
}

function parseCliArgs(argv: readonly string[]): ParsedArgs {
  const { values } = parseArgs({
    args: argv as string[],
    options: {
      change: { type: "string" },
      input: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  });
  return { change: values.change, input: values.input };
}

function readInputFile(p: string): unknown {
  if (!fs.existsSync(p)) {
    throw new Error(`Input file not found: ${p}`);
  }
  const raw = fs.readFileSync(p, "utf8");
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Input file is not valid JSON: ${p}\n${(err as Error).message}`);
  }
}

function resolveHeadSha(repoRoot: string): string {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return "main";
  }
}

function resolveCurrentBranch(repoRoot: string): string | undefined {
  try {
    return execFileSync("git", ["branch", "--show-current"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return undefined;
  }
}

function resolveRepo(): RepoCoordinates {
  // The canonical repo is fixed per AGENTS.md; `gh repo view` would be the
  // preferred source but we degrade gracefully when gh is unavailable.
  try {
    const out = execFileSync(
      "gh",
      ["repo", "view", "CKGrafico/orbion", "--json", "owner,name"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    const parsed = JSON.parse(out) as { owner: { login: string }; name: string };
    return { owner: parsed.owner.login, name: parsed.name };
  } catch {
    return { owner: "CKGrafico", name: "orbion" };
  }
}

async function main(): Promise<number> {
  let parsed: ParsedArgs;
  try {
    parsed = parseCliArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Invalid CLI arguments: ${(err as Error).message}`);
    console.error("Usage: pnpm visual-evidence --change <change-id> | --input <path>");
    return 3;
  }

  if (!parsed.change && !parsed.input) {
    console.error("Either --change <id> or --input <path> is required.");
    console.error("Usage: pnpm visual-evidence --change <change-id> | --input <path>");
    return 3;
  }

  let inputObj: unknown;
  if (parsed.input) {
    try {
      inputObj = readInputFile(parsed.input);
    } catch (err) {
      console.error((err as Error).message);
      return 3;
    }
    if (parsed.change) {
      // --change is allowed alongside --input to override changeId
      const obj = inputObj as Record<string, unknown>;
      obj["changeId"] = parsed.change;
      inputObj = obj;
    }
  } else {
    inputObj = { changeId: parsed.change };
  }

  let input;
  try {
    input = validateInput(inputObj);
  } catch (err) {
    console.error("Input validation failed:");
    console.error((err as Error).message);
    return 3;
  }

  const repoRoot = findRepoRoot();
  const config = resolveConfig();
  const sha = process.env.ORBION_VISUAL_EVIDENCE_SHA ?? resolveHeadSha(repoRoot);
  const branch = process.env.ORBION_VISUAL_EVIDENCE_BRANCH ?? resolveCurrentBranch(repoRoot);
  const repo = resolveRepo();

  let result;
  try {
    result = await runVisualEvidence(input, { config, repo, sha, skipBuild: process.env.ORBION_VISUAL_EVIDENCE_SKIP_BUILD === "1" });
  } catch (err) {
    console.error(`Visual-evidence run failed unexpectedly: ${(err as Error).message}`);
    return 1;
  }

  // For skipped/blocked: write a manifest so the run is auditable.
  if (result.status === "skipped" || result.status === "blocked") {
    try {
      writeManifest(repoRoot, input.changeId, config, {
        changeId: result.changeId,
        required: result.required,
        status: result.status,
      }, { repo, sha, reason: result.reason });
    } catch {
      // best-effort
    }
    console.log(`Visual evidence: ${result.status.toUpperCase()} — ${result.reason}`);
    return 0;
  }

  if (result.status === "failed") {
    try {
      writeManifest(repoRoot, input.changeId, config, {
        changeId: result.changeId,
        required: result.required,
        status: result.status,
      }, {
        repo,
        sha,
        scenario: result.scenario,
        assertions: result.assertions,
        temporaryArtifacts: result.temporaryArtifacts,
        failedStep: result.failedStep,
        error: result.error,
      });
    } catch {
      // best-effort
    }
    console.error(`Visual evidence FAILED — step "${result.failedStep}": ${result.error}`);
    return 1;
  }

  // passed — re-generate prMarkdown anchored to the head SHA and emit stdout
  const prMarkdown = generatePrMarkdown(result, repo, sha);
  console.log(prMarkdown);
  console.error(`\nVisual evidence PASSED for ${result.changeId}.`);
  console.error(`Branch: ${branch ?? "<unknown>"}  SHA: ${sha}`);
  console.error(`Assets:`);
  for (const asset of result.assets) {
    console.error(`  - ${path.join(repoRoot, asset.path)} (${asset.bytes} bytes, ${asset.format})`);
  }
  return 0;
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((err) => {
    console.error(`Unhandled error: ${(err as Error).message}`);
    process.exit(1);
  });
