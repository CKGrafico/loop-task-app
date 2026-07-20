# Fleet-mode loop bar for un-homed chats

## Problem

When a chat session has no home scope (un-homed / fleet-tier — no specific project × instance), the loop summary bar currently receives no loops and renders the empty state ("No loops yet — ask to create one"). This is misleading: the user is at the fleet level and should see estate-wide health, not a per-scope empty state.

## Proposal

Extend the loop summary bar to support a **fleet-wide rollup mode** that activates when the session is un-homed. In this mode the bar aggregates loop data from **all reachable instances** and displays:

> "across N projects: X running. Y failed"

### Acceptance criteria

1. When a session has no home scope (no `projectName` + no `environmentId`, or an explicit fleet-tier marker), the bar renders fleet totals aggregated from all reachable instances.
2. The format is: "across N projects: X running. Y failed" — only segments with nonzero counts appear.
3. Unreachable instances' loops are excluded from tallies (they show as "unknown" and do not inflate failure counts).
4. Clicking a failure segment summons loop cards, each labeled with its **project + instance** origin.
5. The next-run countdown is suppressed in fleet mode (no single next-run makes sense across the estate).

### Key design decisions

- **Rollup is computed in the existing `perEnvLoops` data path.** No new API calls or IPC channels; we just aggregate what App.tsx already polls.
- **`LoopWithOrigin`** pairs each `LoopMeta` with its originating `environmentId` + `environmentName` + `projectName`. This flows through segment-click handlers so cards can show their origin.
- **The bar detects fleet mode** via a new optional prop `fleetMode: boolean`. The parent (App.tsx / SessionChatView) sets this when the session is un-homed.
- **No new surface or navigation.** Fleet mode is a rendering mode of the existing LoopSummaryBar, not a new page.

## Touches

- `src/renderer/src/types.ts` — add `LoopWithOrigin` type
- `src/renderer/src/components/LoopSummaryBar.tsx` — add fleet rollup rendering mode
- `src/renderer/src/components/SessionChatView.tsx` — pass fleet data, handle fleet segment clicks
- `src/renderer/src/App.tsx` — detect un-homed sessions, compute fleet rollup, propagate
- `src/renderer/src/i18n/en.json` — fleet bar i18n strings
- `src/renderer/src/theme.css` — fleet bar styling
