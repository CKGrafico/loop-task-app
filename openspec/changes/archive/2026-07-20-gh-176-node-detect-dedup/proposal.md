## Why

Node.js version detection / resolution shell logic is copy-pasted between `ssh-probe.ts` (NODE_PROBE_SCRIPT, lines 27-59) and `ssh-launch.ts` (buildLaunchScriptTemplate, lines 218-239). The two copies have diverged: different variable names, different quoting styles (`${HOME}/` vs `"$HOME/"`), and a redundant/broken guard in the launch script (`if [ -z "$NODE_BIN" ] || [ "$NODE_BIN" = "" ]`). Any future change to detection order must be applied in both places, or probe and launch will find different Node binaries on the same VM, causing silent version mismatches.

## What Changes

- Extract the shared Node resolution logic into a new `src/main/ssh-scripts.ts` module exporting a single `NODE_RESOLVE_SCRIPT` constant
- Refactor `NODE_PROBE_SCRIPT` in `ssh-probe.ts` to embed `NODE_RESOLVE_SCRIPT` and add its probe-specific output logic on top
- Refactor `buildLaunchScriptTemplate()` in `ssh-launch.ts` to embed `NODE_RESOLVE_SCRIPT` and add its launch-specific output logic on top
- Fix the redundant guard: `if [ -z "$NODE_BIN" ] || [ "$NODE_BIN" = "" ]` becomes `if [ -z "$NODE_BIN" ]`
- Normalize quoting to a single consistent style across both scripts
- Add a Vitest test verifying both composed scripts produce identical Node resolution logic given the same simulated filesystem state

## Capabilities

### New Capabilities
- `node-resolve-shared`: Shared shell script constant for Node.js binary detection across probe and launch scripts

### Modified Capabilities
- `ssh-loop-task-onboarding`: Probe and launch scripts now share a single Node resolution implementation instead of duplicated copies

## Impact

- `src/main/ssh-scripts.ts` (new): shared `NODE_RESOLVE_SCRIPT` constant
- `src/main/ssh-probe.ts`: imports `NODE_RESOLVE_SCRIPT`, rewrites `NODE_PROBE_SCRIPT` to use it
- `src/main/ssh-launch.ts`: imports `NODE_RESOLVE_SCRIPT`, rewrites `buildLaunchScriptTemplate()` to use it, fixes redundant guard
- `tests/ssh-node-resolve.test.ts` (new): tests script identity and behavior consistency
