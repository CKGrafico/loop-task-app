## 1. Shared Node Resolution Script

- [x] 1.1 Create `src/main/ssh-scripts.ts` with exported `NODE_RESOLVE_SCRIPT` constant containing the unified Node detection logic (PATH first, then version-manager scan in fixed order) <!-- agent: fullstack-engineer.build, depends_on: [], touches: [src/main/ssh-scripts.ts] -->

## 2. Refactor Consumers

- [x] 2.1 Refactor `src/main/ssh-probe.ts` `NODE_PROBE_SCRIPT` to embed `NODE_RESOLVE_SCRIPT` and derive `node_path` from it, keeping probe-specific output (`NODE_FOUND|path|version` / `NODE_NOT_FOUND`) <!-- agent: fullstack-engineer.build, depends_on: [1.1], touches: [src/main/ssh-probe.ts] -->
- [x] 2.2 Refactor `src/main/ssh-launch.ts` `buildLaunchScriptTemplate()` to embed `NODE_RESOLVE_SCRIPT`, assign `NODE_BIN="${node_path}"` after it, fix redundant guard, and keep launch-specific output (`NODE_FOUND|path|version` / `INSTALL_NODE_FIRST`) <!-- agent: fullstack-engineer.build, depends_on: [1.1], touches: [src/main/ssh-launch.ts] -->

## 3. Verification

- [x] 3.1 Add `tests/ssh-node-resolve.test.ts` verifying both composed scripts produce identical `node_path`/`NODE_BIN` resolution by comparing the extracted detection fragments <!-- agent: fullstack-engineer.build, depends_on: [2.1, 2.2], touches: [tests/ssh-node-resolve.test.ts] -->
- [x] 3.2 Run `pnpm typecheck` and `pnpm vitest` to confirm no regressions <!-- agent: fullstack-engineer.fast, depends_on: [2.1, 2.2, 3.1], touches: [] -->
