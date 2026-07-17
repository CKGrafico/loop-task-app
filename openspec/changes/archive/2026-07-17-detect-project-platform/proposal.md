## Why

Orbion's infra assistant can create issues using `gh` (GitHub) or `az` (Azure DevOps) CLIs, but it currently has no way to know which platform a project's repository actually uses. The `create-issue` action guesses by checking which CLI is installed and authenticated on the **main VM**, not the project's actual repo. This means a project hosted on Azure DevOps whose VM also has `gh` installed would incorrectly use GitHub. Per the honesty constraints (issue §8), "Classify a repo's platform from its git remotes; report unknown rather than guessing." The platform must be detected from the repo's remotes and cached per project × instance so that platform-specific commands are chosen correctly.

## What Changes

- Add a new `detect-platform` infra action that inspects a project directory's git remotes (via the loop-task daemon's shell access on the instance) and classifies the platform as `github`, `ado`, or `unknown`.
- Cache the detected platform result per project × instance (keyed by `environmentId` × `projectId`) in the main process, so repeated queries are instant and don't re-run git.
- Expose the cached platform to the renderer via a new IPC channel (`infra:getPlatform`) and a new method on the `IInfraService` interface.
- Update the `create-issue` infra action to use the detected platform when available, falling back to the current CLI-check heuristic only when no platform is cached.
- Add a mock counterpart for browser-only dev.
- Add supporting i18n keys for error messages.

## Capabilities

### New Capabilities
- `platform-detection`: Detects a project's hosting platform (GitHub vs Azure DevOps vs unknown) from git remote URLs, with caching per project × instance.

### Modified Capabilities
<!-- No existing capability specs have requirement-level changes. -->

## Impact

- **Main process** (`src/main/index.ts`): new IPC handler `infra:getPlatform`, extension of `infra:executeAction` for `detect-platform` action, in-memory platform cache, git remote URL classification logic.
- **Shared IPC** (`src/shared/ipc.ts`): new types `PlatformType`, `PlatformDetectionResult`, `InfraAction` extended with `"detect-platform"`, new `InfraBridge` method.
- **Preload** (`src/preload/index.ts`): wire new IPC channel.
- **Renderer services** (`src/renderer/src/services/interfaces.ts`, `impl/InfraService.ts`, `mock/MockServices.ts`): new `getPlatform` method on `IInfraService`.
- **i18n** (`src/renderer/src/i18n/en.json`, main i18n keys): error messages for detection failures.
- **Tests**: unit tests for the git remote URL classifier (pure function, no Electron dependency).
