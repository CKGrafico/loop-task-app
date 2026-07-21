# gh-121: Tasks

## Task 1: Add `projectName` to updatable ChatSession fields

**Agent:** frontend-engineer
**Tier:** 2
**Depends on:** —
**Touches:** `src/shared/ipc.ts`, `src/main/config-store.ts`, `src/main/ipc-validation.ts`, `src/main/index.ts`, `src/renderer/src/services/interfaces.ts`, `src/renderer/src/services/impl/ConfigService.ts`, `src/renderer/src/services/mock/MockConfigService.ts`

Add `projectName` to the `Partial<Pick<ChatSession, ...>>` type in:
- `src/shared/ipc.ts` → `ConfigBridge.updateChatSession`
- `src/main/config-store.ts` → `updateChatSession` function signature
- `src/main/ipc-validation.ts` → `config:updateChatSession` validator (validate `projectName` as non-empty string if present)
- `src/main/index.ts` → `config:updateChatSession` handler type comment
- `src/renderer/src/services/interfaces.ts` → `IConfigService.updateChatSession`

**Verification:** `pnpm typecheck` passes

---

## Task 2: Add context menu component for session rows in Sidebar

**Agent:** frontend-engineer
**Tier:** 2
**Depends on: Task 1
**Touches:** `src/renderer/src/components/Sidebar.tsx`, `src/renderer/src/theme.css`

Add a right-click context menu to session rows in the Sidebar. The menu has:
- "Move to project" option that opens a submenu listing all unique project names (from `projectNodes` passed to Sidebar)
- On click, calls `onMoveSessionToProject(sessionId, targetProjectName)` prop

Implementation notes:
- Use a simple absolute-positioned `<div>` rendered at the click coordinates (no library needed for a single-level submenu)
- Close on click outside, Escape, or after selection
- Filter out the session's current project from the move targets
- Only show the menu for persisted sessions (ephemeral sessions aren't in the sidebar)

New prop on `Sidebar`: `onMoveSessionToProject?: (sessionId: string, targetProjectName: string) => void`

CSS: `.sidebar-context-menu`, `.sidebar-context-menu-item` in `theme.css` — follow the existing dark navy floating panel aesthetic (`bg_elevated`, `border_subtle`, `radius sm`).

**Verification:** `pnpm typecheck` passes

---

## Task 3: Wire move-to-project flow in App.tsx

**Agent:** frontend-engineer
**Tier:** 2
**Depends on: Task 2
**Touches:** `src/renderer/src/App.tsx`

Add `handleMoveSessionToProject` callback in App.tsx that:
1. Finds the session by ID
2. Resolves the target project's instances (find an instance that has this project name in `perEnvProjects`)
3. If the current instance has the target project → just update `projectName`, keep `environmentId`
4. If the current instance does NOT have the target project → pick the first connected instance that does, update `projectName` + `environmentId` + `workingDirectory`
5. If NO instance has the target project → show a toast error
6. Calls `configService.updateChatSession(sessionId, { projectName, ... })` 
7. Refreshes sessions list

Wire the callback to `Sidebar`'s `onMoveSessionToProject` prop.

Also update the `onOpenProjectChat` callback area in the Sidebar JSX to pass the new prop.

**Verification:** `pnpm typecheck` passes

---

## Task 4: Add i18n strings for move-to-project

**Agent:** frontend-engineer
**Tier:** 1
**Depends on: —
**Touches:** `src/renderer/src/i18n/en.json`

Add keys:
- `sidebar.moveToProject` — "Move to project"
- `sidebar.moveToProjectError` — "No instance has the project \"{project}\""
- `sidebar.sessionMoved` — "Chat moved to \"{project}\""

**Verification:** `pnpm typecheck` passes
