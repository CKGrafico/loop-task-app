# Archive — gh-158 Discuss a PR in a chat

## Summary

Implemented "Open in chat" for PR inbox items and "Discuss in chat" button in review mode. Both paths create a chat session scoped to the PR's project/instance and insert a PR reference card into the transcript.

## Acceptance criteria

| Criterion | Status |
|---|---|
| "Open in chat" opens a chat scoped to the PR's project/instance with a PR reference card inserted | ✅ Implemented |
| Card shows number, title, verdict, link | ✅ Implemented |
| Agent can answer questions and take review actions from that conversation | ✅ Supported via existing infra actions |

## Implementation details

### New files
- `src/renderer/src/components/PrReferenceCard.tsx` — Compact PR reference card component (number, title, verdict chip, risk level, author, repo, link)
- `openspec/changes/gh-158-discuss-pr-in-chat/` — Change artifacts (proposal, specs, tasks, evidence)

### Modified files
- `src/renderer/src/chat/types.ts` — Added `pr-reference-card` to `RowKind` union and `PrReferenceCardRow` interface
- `src/renderer/src/chat/useTranscript.ts` — Added `insertPrReferenceCard`, `isPrReferenceCardMessage`, `parsePrReferenceCardMessage`, and pr-ref state management throughout
- `src/renderer/src/components/SessionChatView.tsx` — Added rendering case for `pr-reference-card` rows
- `src/renderer/src/features/review/ReviewModeOverlay.tsx` — Added `onDiscussInChat` prop and "Discuss in chat" button
- `src/renderer/src/App.tsx` — Wired `onOpenInChat` for PR items to create sessions with PR reference cards; wired `onDiscussInChat` for review mode
- `src/renderer/src/i18n/en.json` — Added i18n keys for `prReferenceCard.*` and `reviewMode.discussInChat`
- `src/renderer/src/theme.css` — Added CSS for `.pr-reference-card`, `.transcript-pr-reference-card`, and `.review-mode-action-discuss`
- `ARCHITECTURE.md` — Documented the `pr-reference-card` transcript row kind and updated component listing

## Design decisions

- PR reference cards are read-only — no inline approve/reject. Review actions are verbs of review mode; the chat provides conversational context.
- Cards are persisted as system messages with `pr-ref-` ID prefix, following the established pattern for transcript-row kinds.
- The `onOpenInChat` handler creates a titled, persisted session automatically (no ephemeral scratch session for PRs).
- The review mode "Discuss in chat" button exits review mode before opening the chat, keeping the interaction clean.
