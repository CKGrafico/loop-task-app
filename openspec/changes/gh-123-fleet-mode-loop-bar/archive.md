# Archive: Fleet-mode loop bar for un-homed chats

**Change:** gh-123-fleet-mode-loop-bar
**Status:** Implemented on branch `feature/gh-123-fleet-mode-loop-bar`

## Summary

Extended the loop summary bar to support a **fleet-wide rollup mode** for un-homed (fleet-tier) chat sessions. When a session has no home scope (no `projectName` or no `environmentId`), the bar now aggregates loop data from all reachable instances and displays estate-wide totals instead of the previous empty state.

## What was done

1. **New types** (`types.ts`): Added `LoopWithOrigin` (pairs `LoopMeta` with its `environmentId`, `environmentName`, `projectName`) and `FleetLoopRollup` (aggregated counts + origin-tagged loops).

2. **Fleet rollup utility** (`fleet-rollup.ts`): `computeFleetRollup()` iterates all environments, skips unreachable/reconnecting instances (their loops remain "unknown" per the reachability health invariant — never inflated as failed), and returns deduplicated project count + per-status counts.

3. **LoopSummaryBar fleet mode** (`LoopSummaryBar.tsx`): Added `fleetMode` and `fleetRollup` props. When fleet mode is active, renders "across N projects: X running. Y failed" with the same clickable segment pattern. Next-run countdown is suppressed in fleet mode (no single next-run makes sense estate-wide).

4. **SessionChatView fleet segment clicks** (`SessionChatView.tsx`): When `fleetMode` is true, clicking a segment filters `fleetLoopsWithOrigin`, groups matching loops by `environmentId`, and inserts loop cards per-group with the correct originating instance. Failed loops are auto-diagnosed per their origin environment. Each fleet-mode loop card shows an origin label ("{project} on {instance}").

5. **App.tsx fleet wiring** (`App.tsx`): Detects un-homed sessions (no `projectName` or `environmentId`), computes the fleet rollup via `computeFleetRollup()`, and passes `fleetMode`, `fleetRollup`, and `fleetLoopsWithOrigin` to `SessionChatView`. For un-homed sessions, `loops` is passed as empty to prevent the scoped bar from rendering stale data.

6. **I18n** (`en.json`): Added fleet-mode loop summary strings (`fleetAcrossProjects`, `fleetRunning`, `fleetFailed`, `fleetPaused`, `fleetStopped`, `fleetFinished`, plus aria variants and empty/unknown states) and `loopCard.originLabel`.

7. **CSS** (`theme.css`): Added `.loop-summary-bar--fleet` (subtle accent-tinted background), `.loop-summary-fleet-prefix`, and `.loop-card-origin-label`.

## Files changed

- `src/renderer/src/types.ts` — added `LoopWithOrigin`, `FleetLoopRollup`
- `src/renderer/src/fleet-rollup.ts` — new file, fleet rollup computation
- `src/renderer/src/components/LoopSummaryBar.tsx` — fleet mode rendering
- `src/renderer/src/components/SessionChatView.tsx` — fleet segment clicks + origin labels
- `src/renderer/src/App.tsx` — fleet mode detection and wiring
- `src/renderer/src/i18n/en.json` — fleet i18n strings
- `src/renderer/src/theme.css` — fleet bar and origin label CSS
- `openspec/changes/gh-123-fleet-mode-loop-bar/` — proposal, tasks, archive
