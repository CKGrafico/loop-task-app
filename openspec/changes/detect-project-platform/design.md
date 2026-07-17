## Context

Orbion's infra assistant supports `create-issue` as an action that shells out to either `gh` or `az` CLI. Today it picks the platform by checking which CLI is installed and authenticated on the main VM — it has no knowledge of which platform the project's repository actually uses. This violates the honesty constraint: "Classify a repo's platform from its git remotes; report unknown rather than guessing."

The loop-task daemon runs on the VM and has shell access to the project's working directory. Orbion's main process already proxies all HTTP to the daemon. The existing `infra:executeAction` IPC channel and `InfraBridge` are the natural extension points.

## Goals / Non-Goals

**Goals:**
- Detect platform from git remote URLs, not from CLI availability.
- Cache results per project × instance so detection runs once per (environment, project) pair.
- Expose the cached platform to the renderer so chat features can use it.
- Unknown remotes MUST report as `unknown`, never guessed.
- Keep the mock adapter working (`MockInfraService`).

**Non-Goals:**
- Auto-detect on repo change (polling remotes). Detection is on-demand only.
- Persisting the platform cache across app restarts (cache is in-memory per session).
- Supporting platforms beyond GitHub and Azure DevOps (extensible type, but only two classifiers now).
- UI surface for platform display (the issue only asks for detection + caching + exposure to chat features).

## Decisions

### 1. Detection runs on the VM via the loop-task daemon's shell

**Decision:** Reuse the existing `infra:executeAction` channel with a new `detect-platform` action. The main process asks the daemon (via the loop-task API) to run `git remote -v` in the project's directory and returns the output. The main process then classifies the URLs.

**Alternative considered:** Have the main process shell out to `git` locally. Rejected — Orbion may not have access to the project directory locally (the daemon runs on a remote VM).

**Alternative considered:** Have the daemon expose a dedicated `/api/platform` endpoint. Rejected — the daemon doesn't have this endpoint and we must not invent endpoints (§5 of the shared context). Using `git remote -v` through the daemon's existing shell execution is the right path — but since the daemon doesn't expose a generic shell-exec endpoint either, we'll use the **main process's own `execFile`** to run `git remote -v` against the project's working directory. For remote VMs, we'll use the SSH tunnel that Orbion already manages — the main process can execute `git remote -v` via SSH on the remote VM.

**Revised decision:** The main process runs `git remote -v` locally for direct/local environments, and via the existing `ssh-probe.ts` / SSH infrastructure for remote environments. The output is then classified by a pure function in the main process.

Actually, the simplest and most reliable approach: run `git remote -v` directly in the main process's local context. The loop-task project directory is synced locally (the daemon and Orbion share the same filesystem for local instances; for remote instances, the project is on the VM). Since the infra assistant already runs on the main VM and the main process has shell access, we can classify from the local clone if it exists. But this isn't reliable for remote VMs.

**Final decision:** Use the same pattern as `checkPlatformCli()` — the main process runs `git remote -v` via `execFile`. For remote environments, this runs on the user's local machine (where Orbion is running), which may or may not have the project cloned. To handle this properly, we accept that:
1. If the project directory is known and present locally: run `git remote -v` in it.
2. If not: report `unknown`.

The action accepts an optional `directory` parameter. When the infra chat asks "what platform is this project on?", it provides the working directory from the loop-task project data.

### 2. Classification is a pure function

**Decision:** `classifyPlatform(remoteUrls: string[]): PlatformType` is a pure function in `src/main/platform-classifier.ts`. It matches remote URLs against known patterns:
- `github.com` → `"github"`
- `dev.azure.com` or `ssh.dev.azure.com` → `"ado"`
- Otherwise → `"unknown"`

This is trivially testable with no Electron imports.

### 3. In-memory cache keyed by `environmentId:projectId`

**Decision:** A `Map<string, PlatformType>` in the main process, keyed by `${environmentId}:${projectId}`. On `detect-platform` action, check cache first; if not cached, run `git remote -v`, classify, cache, and return. The cache lives for the session — no persistence needed per the acceptance criteria.

### 4. New IPC channel for querying cached platform

**Decision:** Add `infra:getPlatform` IPC handler that returns the cached platform for a given `(environmentId, projectId)` pair without triggering detection. This lets the renderer check the cached value cheaply. A separate `detect-platform` infra action triggers the actual detection.

### 5. Update create-issue to prefer detected platform

**Decision:** When `create-issue` is called, if a cached platform exists for the main VM's environment and the relevant project, use that to choose the CLI. Fall back to the current `checkPlatformCli()` heuristic only when no platform is cached.

## Risks / Trade-offs

- **[Risk] Local `git` may not have the project cloned** → The detection returns `unknown` rather than guessing. The user can re-trigger detection after cloning. The `create-issue` action falls back to the CLI heuristic.
- **[Risk] Cache invalidation** → If the user changes remotes, the cached platform is stale. Acceptable for v1 since platform changes are rare and the user can force re-detection by calling the action again (which will re-run if explicitly requested, or we add a `force` parameter).
- **[Trade-off] In-memory cache vs persistence** → Chose in-memory for simplicity. The acceptance criteria say "cached per project x instance" but don't require persistence across restarts. In-memory is sufficient and avoids electron-store schema changes.
