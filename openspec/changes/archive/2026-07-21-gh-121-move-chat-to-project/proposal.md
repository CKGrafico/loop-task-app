# gh-121: Move a chat to another project from the sidebar

## Problem

A persisted chat is filed under a project in the sidebar, but there is no UI to re-file it under a different project. Users who create a chat in the wrong project, or whose project structure changes over time, have no way to move the session. Filing is furniture, not walls — it should be adjustable.

## Proposal

Add a **right-click context menu** on each session row in the sidebar with a "Move to project" submenu that lists all project names (deduped across instances). Selecting a target project updates the session's `projectName` field and, if the new project only exists on certain instances, re-points `environmentId` to an instance that contains the target project. The header reflects the change; the transcript is untouched.

### Acceptance criteria (from issue #121)

- [ ] A sidebar gesture (context menu) moves a session to another project.
- [ ] Its home scope updates to the target project (`projectName` updated; instance re-resolves to one that has it if the current instance lacks the target project).
- [ ] The header reflects the change.
- [ ] The transcript is untouched.

## Scope

| Layer | Change |
|-------|--------|
| Shared `ipc.ts` | Add `projectName` to `updateChatSession` partial pick (already present via `environmentId`/`workingDirectory` but `projectName` is currently **not** in the updateable fields) |
| Main `config-store.ts` | Add `projectName` to `updateChatSession` Partial Pick union |
| Main `ipc-validation.ts` | Validate `projectName` in `config:updateChatSession` if present |
| Main `index.ts` | Update IPC handler type to include `projectName` |
| Preload | Bridge type inherits from shared — no change needed |
| Renderer `IConfigService` / `ConfigService` / `MockServices` | Add `projectName` to `updateChatSession` Partial Pick |
| Renderer `Sidebar.tsx` | Add context menu to session rows with "Move to project" submenu listing all project names; on selection, call `updateChatSession` with new `projectName` and re-resolved `environmentId`/`workingDirectory` |
| Renderer `App.tsx` | Wire `onMoveSessionToProject` callback from Sidebar to `configService.updateChatSession` + session reload |
| Renderer `i18n/en.json` | Add context menu and move-related strings |
| Renderer `theme.css` | Context menu styles |

## Out of scope

- Drag-and-drop move (context menu is the first gesture; drag can be added later)
- Moving a session to a project that does not exist on any instance (would require loop-task project creation)
- Moving an ephemeral session (only persisted sessions appear in the sidebar, so only those can be moved)
- Changing the instance selector separately from the project move (instance changes as a side effect of the move only when required)

## Design decisions

1. **Context menu, not drag**: Right-click "Move to project" is simpler to implement, more discoverable for accessibility, and doesn't require drag-and-drop library support in a plain-CSS codebase. A future iteration can add drag if users ask for it.

2. **Instance re-resolution**: When the session is moved to a project that does not exist on the session's current instance, Orbion picks the first connected instance that has the target project. If no instance has the project, the move is rejected with an error message. The working directory is derived from the first loop's `cwd` in the target project on the new instance, or falls back to `~/<projectName>`.

3. **Transcript untouched**: The move only updates session metadata (`projectName`, potentially `environmentId`/`workingDirectory`). No transcript messages are added, deleted, or modified. A handoff divider is NOT inserted (unlike the instance-switch flow) because the user explicitly initiated the move as a filing change, not a runtime reconnection.

4. **Only persisted sessions**: Ephemeral sessions don't appear in the sidebar and therefore don't have a row to right-click. When an ephemeral session is persisted, it can then be moved.
