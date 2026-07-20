# Archive — Overnight digest notification for PR batches

## Change ID

gh-150-overnight-pr-digest

## Issue

GitHub Issue #150 — As a user waking to many PRs, I want one digest — "10 PRs overnight: 7 safe, 2 need you, 1 conflict" — not ten pings.

## Summary of Implementation

Grouped multiple `pr-awaiting-review` inbox items into a single digest inbox item that summarizes counts by verdict, with expansion to reveal individual items. The OS notification fires once for the digest, not once per PR.

## Acceptance Criteria — Status

1. ✅ Multiple PR items arriving within a window group into a single digest summarizing counts by verdict (safe = low risk, needs you = medium/high risk, conflict = uncertain risk)
2. ✅ Expanding the digest reveals the individual items with their verdicts
3. ✅ The OS notification fires once for the digest (not once per PR)
4. ✅ The mock adapter provides sample digest items for browser-only development
5. ✅ i18n keys are added for all new UI strings

## Files Changed

- `src/shared/ipc.ts` — Added `DigestCounts` interface and `childItemIds`/`digestCounts` fields to `InboxItem`
- `src/renderer/src/services/impl/InboxService.ts` — Added `groupPrsIntoDigest()` function with verdict bucketing, `deriveItemsUngrouped()`, and `getChildItems()` method; updated `answerFleetQuery()` for digest-aware PR queries
- `src/renderer/src/services/interfaces.ts` — Added `getChildItems()` method to `IInboxService`
- `src/renderer/src/features/inbox/InboxView.tsx` — Added `DigestViewItemRow` component with expand/collapse, child PR list, and verdict count badges; added `ChevronDown` import
- `src/renderer/src/features/inbox/InboxPanel.tsx` — Added `DigestItemRowPanel` component for sidebar panel; added `ChevronDown`, `Layers`, `GitPullRequest` imports
- `src/renderer/src/App.tsx` — Added digest notification effect (single OS notification per new digest)
- `src/renderer/src/theme.css` — Added digest styles (expand/collapse, count badges, child items)
- `src/renderer/src/i18n/en.json` — Added i18n keys: `digest.expand`, `digest.collapse`, `digest.safe`, `digest.needsYou`, `digest.conflict`, `digest.childVerdict`, `digest.notifTitle`, `digest.notifBody`
- `src/renderer/src/services/mock/MockServices.ts` — Added mock digest grouping and `getChildItems()` method
- `src/visual-evidence/scenarios/gh-150-overnight-pr-digest.ts` — Playwright scenario for automated visual evidence
- `src/visual-evidence/scenario-registry.ts` — Registered the new scenario

## Evidence

Evidence is stored in `evidence/evidence.json` within this change folder.

## Archived

2026-07-20
