## Archive: gh-176-node-detect-dedup

### What changed

Extracted duplicated Node.js binary detection shell script from `ssh-probe.ts` and `ssh-launch.ts` into a shared `src/main/ssh-scripts.ts` module exporting `NODE_RESOLVE_SCRIPT`.

### Files modified

- `src/main/ssh-scripts.ts` (new): shared `NODE_RESOLVE_SCRIPT` constant
- `src/main/ssh-probe.ts`: imports and embeds `NODE_RESOLVE_SCRIPT` in `NODE_PROBE_SCRIPT`
- `src/main/ssh-launch.ts`: imports and embeds `NODE_RESOLVE_SCRIPT` in `buildLaunchScriptTemplate()`, bridges `NODE_BIN="${node_path}"`, fixes redundant guard
- `tests/ssh-node-resolve.test.ts` (new): 11 tests verifying script identity, embedding, guard fix, and absence of inline scan loops

### Bugs fixed

- Redundant guard `if [ -z "$NODE_BIN" ] || [ "$NODE_BIN" = "" ]` replaced with `if [ -z "$NODE_BIN" ]`
- Divergent quoting between probe and launch scripts normalized via shared fragment

### Verification

- `pnpm vitest run tests/ssh-node-resolve.test.ts`: 11/11 passed
- `pnpm vitest run tests/ssh-loop-task-onboarding.test.ts tests/ssh-validation.test.ts tests/ssh-tunnel-kill.test.ts`: 53/53 passed
- No new typecheck errors in modified files
