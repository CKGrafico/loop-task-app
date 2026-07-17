## 1. Shared types and classifier

- [ ] 1.1 Add `PlatformType` (`"github" | "ado" | "unknown"`), `PlatformDetectionResult`, and extended `InfraAction` type to `src/shared/ipc.ts` <!-- agent: frontend-engineer.build, depends_on: [], touches: [src/shared/ipc.ts] -->
- [ ] 1.2 Create `src/main/platform-classifier.ts` with pure `classifyPlatform(remoteUrls: string[]): PlatformType` function <!-- agent: frontend-engineer.build, depends_on: [1.1], touches: [src/main/platform-classifier.ts] -->
- [ ] 1.3 Add unit tests for `classifyPlatform` in `src/main/__tests__/platform-classifier.test.ts` <!-- agent: frontend-engineer.build, depends_on: [1.2], touches: [src/main/__tests__/platform-classifier.test.ts] -->

## 2. Main process: detection logic and IPC

- [ ] 2.1 Add `detect-platform` case to `infra:executeAction` handler in `src/main/index.ts` — run `git remote -v` via `execFile`, classify, cache in `Map<string, PlatformType>`, return result <!-- agent: frontend-engineer.build, depends_on: [1.2], touches: [src/main/index.ts] -->
- [ ] 2.2 Add `infra:getPlatform` IPC handler in `src/main/index.ts` — return cached platform or `"unknown"` for a given (environmentId, projectId) <!-- agent: frontend-engineer.build, depends_on: [2.1], touches: [src/main/index.ts] -->
- [ ] 2.3 Update `create-issue` case in `infra:executeAction` to prefer cached platform over `checkPlatformCli()` heuristic <!-- agent: frontend-engineer.build, depends_on: [2.1], touches: [src/main/index.ts] -->

## 3. Preload bridge

- [ ] 3.1 Wire `infra:getPlatform` IPC invoke in `src/preload/index.ts` <!-- agent: frontend-engineer.build, depends_on: [2.2], touches: [src/preload/index.ts] -->

## 4. Renderer service layer

- [ ] 4.1 Add `getPlatform(environmentId: string, projectId: string)` to `IInfraService` interface in `src/renderer/src/services/interfaces.ts` <!-- agent: frontend-engineer.build, depends_on: [1.1], touches: [src/renderer/src/services/interfaces.ts] -->
- [ ] 4.2 Implement `getPlatform` in `InfraService` (`src/renderer/src/services/impl/InfraService.ts`) <!-- agent: frontend-engineer.build, depends_on: [3.1, 4.1], touches: [src/renderer/src/services/impl/InfraService.ts] -->
- [ ] 4.3 Implement `getPlatform` mock in `MockInfraService` (`src/renderer/src/services/mock/MockServices.ts`) <!-- agent: frontend-engineer.fast, depends_on: [4.1], touches: [src/renderer/src/services/mock/MockServices.ts] -->

## 5. InfraBridge type and DI

- [ ] 5.1 Add `getPlatform` method to `InfraBridge` interface in `src/shared/ipc.ts` <!-- agent: frontend-engineer.build, depends_on: [1.1], touches: [src/shared/ipc.ts] -->

## 6. i18n keys

- [ ] 6.1 Add i18n keys for platform detection errors (`infra.detectFailed`, `infra.unknownPlatform`) in `src/renderer/src/i18n/en.json` and main-process i18n keys in `src/main/index.ts` <!-- agent: frontend-engineer.fast, depends_on: [2.1], touches: [src/renderer/src/i18n/en.json] -->

## 7. Verification

- [ ] 7.1 Run `pnpm typecheck` and fix any type errors <!-- agent: frontend-engineer.fast, depends_on: [2.3, 3.1, 4.2, 4.3, 5.1, 6.1], touches: [] -->
- [ ] 7.2 Run `pnpm test` and ensure all tests pass <!-- agent: frontend-engineer.fast, depends_on: [1.3, 7.1], touches: [] -->
