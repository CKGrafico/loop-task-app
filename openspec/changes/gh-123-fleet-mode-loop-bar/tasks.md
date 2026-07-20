# Tasks: Fleet-mode loop bar for un-homed chats

## Task 1: Add `LoopWithOrigin` type  
**Agent:** frontend-engineer  
**Tier:** 1  
**Depends on:** —  
**Touches:** `src/renderer/src/types.ts`

Add a `LoopWithOrigin` type that pairs a `LoopMeta` with its fleet-local metadata:
```ts
export interface LoopWithOrigin {
  loop: LoopMeta;
  environmentId: string;
  environmentName: string;
  projectName: string;
}
```

## Task 2: Add fleet-rollup utility  
**Agent:** frontend-engineer  
**Tier:** 1  
**Depends on:** Task 1  
**Touches:** new file `src/renderer/src/fleet-rollup.ts`

Create `computeFleetRollup(perEnvLoops, environments, perEnvProjects, reachability)` that:
- Iterates all environments
- Skips unreachable instances (their loops = unknown, excluded from counts)
- Returns `{ loopsWithOrigin: LoopWithOrigin[]; projectCount: number; counts: Record<LoopStatus, number> }`
- Derives `projectCount` as the deduplicated count of project names across reachable instances

## Task 3: Update `LoopSummaryBar` for fleet mode  
**Agent:** frontend-engineer  
**Tier:** 2  
**Depends on:** Task 1  
**Touches:** `src/renderer/src/components/LoopSummaryBar.tsx`

- Add optional `fleetMode?: boolean` prop
- Add optional `fleetRollup?: { projectCount: number; counts: Record<LoopStatus, number> }` prop
- When `fleetMode` is true:
  - Render "across N projects: X running. Y failed" format
  - Skip the next-run countdown
  - Click handler emits `LoopSegmentKind` as before (the parent resolves which loops match)

## Task 4: Update `SessionChatView` for fleet segment clicks  
**Agent:** frontend-engineer  
**Tier:** 2  
**Depends on:** Task 2, Task 3  
**Touches:** `src/renderer/src/components/SessionChatView.tsx`

- Accept `fleetLoopsWithOrigin: LoopWithOrigin[]` prop
- When `fleetMode` is true and a segment is clicked:
  - Filter `fleetLoopsWithOrigin` by the segment's status
  - Insert loop cards with the correct `environmentId` per loop
  - Failed loops get auto-diagnosed (same as existing path, but using the loop's origin env)

## Task 5: Wire fleet mode in `App.tsx`  
**Agent:** frontend-engineer  
**Tier:** 2  
**Depends on:** Task 4  
**Touches:** `src/renderer/src/App.tsx`

- Detect un-homed sessions (session has no `projectName` or no `environmentId`)
- Compute fleet rollup via `computeFleetRollup()`
- Pass `fleetMode`, `fleetRollup`, `fleetLoopsWithOrigin` to `SessionChatView`
- For un-homed sessions, pass empty `loops` to SessionChatView and set `fleetMode=true`

## Task 6: Add i18n messages and CSS  
**Agent:** frontend-engineer  
**Tier:** 1  
**Depends on:** Task 3  
**Touches:** `src/renderer/src/i18n/en.json`, `src/renderer/src/theme.css`

- Add `loopSummary.fleetRollup` i18n entries:
  - `fleetAcrossProjects`: "across {projectCount, plural, one {1 project} other {# projects}}"
  - `fleetRunning`: "{count} running"
  - `fleetRunningAria`: "Show {count} running loop{count, plural, one {} other {s}} across the fleet"
  - `fleetFailed`: "{count} failed"
  - `fleetFailedAria`: "Show {count} failed loop{count, plural, one {} other {s}} across the fleet"
  - `fleetPaused`: "{count} paused"
  - `fleetPausedAria`: "Show {count} paused loop{count, plural, one {} other {s}} across the fleet"
  - `fleetStopped`: "{count} stopped"
  - `fleetStoppedAria`: "Show {count} stopped loop{count, plural, one {} other {s}} across the fleet"
  - `fleetFinished`: "{count} finished"  
  - `fleetFinishedAria`: "Show {count} finished loop{count, plural, one {} other {s}} across the fleet"
  - `fleetEmptyState`: "No loops across the fleet — add an instance to begin"
  - `fleetUnknownState`: "{count} loops across the fleet — status unknown"
- Add `.loop-summary-bar--fleet` CSS class (subtle fleet indicator)
