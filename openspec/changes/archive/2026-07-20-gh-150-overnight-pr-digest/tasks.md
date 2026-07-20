# Tasks — Overnight digest notification for PR batches

## 1 — Shared types & contracts

- [ ] 1.1 Add `childItemIds?: string[]` field to `InboxItem` in `src/shared/ipc.ts` for digest child references
- [ ] 1.2 Add `digestTitle?: string` and `digestCounts?: DigestCounts` fields to `InboxItem` for pre-computed digest summary
- [ ] 1.3 Add `DigestCounts` interface to `src/shared/ipc.ts` with safe/needsYou/conflict/total counts
- [ ] 1.4 Add `"digest"` case to `kindToNotificationType` if missing, confirm it returns `"digest"`

## 2 — Inbox service: digest grouping logic

- [ ] 2.1 Add `groupPrsIntoDigests()` function to `InboxService.ts` that groups `pr-awaiting-review` items into digest items when count >= 2
- [ ] 2.2 Implement verdict bucketing: safe (low), needsYou (medium/high), conflict (uncertain/no-verdict)
- [ ] 2.3 Generate digest title from counts: e.g. "3 PRs overnight: 2 safe, 1 needs you"
- [ ] 2.4 Add `getAvailableActions` for digest kind → `["dismiss", "open-in-chat"]`
- [ ] 2.5 Add `getResolutionReasonForItem` for digest → `"watch-cleared"`
- [ ] 2.6 In `deriveItems()`, call grouping function after PR derivation; individual PR items that belong to a digest are excluded from the final list, their IDs stored in `childItemIds`
- [ ] 2.7 Update `answerFleetQuery()` to show digest summary instead of individual PR items
- [ ] 2.8 Fix auto-resolution: digest resolves when all children resolve or are dismissed

## 3 — UI: expandable digest in InboxView & InboxPanel

- [ ] 3.1 Add `DigestItemRow` component to `InboxView.tsx` with expand/collapse toggle, summary line, and child item list
- [ ] 3.2 Add `DigestItemRow` component to `InboxPanel.tsx` (sidebar panel variant)
- [ ] 3.3 Add digest expand/collapse CSS to `theme.css`
- [ ] 3.4 Add `Layers` icon rendering for digest kind (already imported in InboxView)

## 4 — OS notification: single notification for digest

- [ ] 4.1 Add `usePrDigestNotification` hook or extend existing `useNativeNotifications` to detect when a new digest appears and fire a single OS notification with the digest summary
- [ ] 4.2 Suppress individual PR notifications when they belong to a digest

## 5 — i18n

- [ ] 5.1 Add i18n keys for digest: title template, verdict category labels, expand/collapse labels

## 6 — Mock adapter

- [ ] 6.1 Add mock digest items with sample PRs to `MockServices.ts`

## 7 — Verification

- [ ] 7.1 Run `pnpm typecheck` and fix any type errors
