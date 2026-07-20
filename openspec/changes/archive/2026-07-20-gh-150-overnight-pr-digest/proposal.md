# Overnight digest notification for PR batches

## Issue

GitHub Issue #150 — As a user waking to many PRs, I want one digest — "10 PRs overnight: 7 safe, 2 need you, 1 conflict" — not ten pings.

## Summary

Group multiple `pr-awaiting-review` inbox items that arrive within a time window into a single digest inbox item that summarizes counts by verdict, with expanding to reveal individual items. The OS notification fires once for the digest, not once per PR.

## Acceptance Criteria

1. Multiple PR items arriving within a window group into a single digest item summarizing counts by verdict (safe = low risk, needs you = medium/high risk, conflict = uncertain risk).
2. Expanding the digest reveals the individual PR items with their verdicts.
3. The OS notification fires once for the digest (title like "3 PRs overnight: 2 safe, 1 needs you").
4. Digest items self-resolve when all child PRs resolve.
5. Dismissing the digest dismisses all child items.
6. The mock adapter provides sample digest items for browser-only development.
7. i18n keys are added for all new UI strings.

## Design Decisions

- **Grouping window**: PRs polled within the same 60-second polling cycle are batched together. Since `PrPollingService` polls every 60s, all newly-appeared PRs in a single poll batch form one digest. PRs from successive polls accumulate into the same digest if one already exists.
- **Verdict categories**: Group PRs by risk level into three buckets:
  - "safe" = low risk (verdict.riskLevel === "low")
  - "needs you" = medium/high risk (verdict.riskLevel === "medium" | "high")
  - "conflict" = uncertain risk (verdict.riskLevel === "uncertain" or verdict not yet computed)
- **Inbox item children**: A new `childItemIds` field on `InboxItem` (for `kind: "digest"`) holds references to the grouped PR item IDs. The digest expands inline to show child items.
- **Digest generation**: After `deriveItems()` runs, a second pass groups `pr-awaiting-review` items into digest items. Individual PR items are hidden when they belong to a digest. Single PRs (no batch) are shown individually (no digest for a single item unless it's part of a growing batch).
- **Minimum batch size**: A digest is created only when 2+ PRs are awaiting review. Single PRs remain as individual items. This avoids creating a digest wrapper for a single notification.

## Scope

This change does NOT implement:
- Digest grouping for non-PR item types (loop failures, outages, etc.)
- Customize digest grouping window (future consideration)
- PR review mode (separate issue)
