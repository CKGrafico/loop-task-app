# Tasks — gh-158 Discuss a PR in a chat

## Task 1: Add PrReferenceCardRow type and row kind
- **Agent:** frontend-engineer
- **Tier:** 2
- **Depends on:** —
- **Touches:** `src/renderer/src/chat/types.ts`
- **Description:** Add `"pr-reference-card"` to `RowKind` union. Add `PrReferenceCardRow` interface with fields: `prNumber`, `prTitle`, `prRepo`, `prAuthor`, `prUrl`, `prVerdict?`. Add it to the `TranscriptRow` union.

## Task 2: Handle pr-reference-card in useTranscript hook
- **Agent:** frontend-engineer
- **Tier:** 2
- **Depends on:** Task 1
- **Touches:** `src/renderer/src/chat/useTranscript.ts`
- **Description:** Add `insertPrReferenceCard(params)` function to the hook return. Recognize `pr-ref-` prefix transcript messages on reload and reconstruct `PrReferenceCardRow`. Add parsing logic in the message-to-rows conversion.

## Task 3: Create PrReferenceCard component
- **Agent:** frontend-engineer
- **Tier:** 2
- **Depends on:** Task 1
- **Touches:** `src/renderer/src/components/PrReferenceCard.tsx`, `src/renderer/src/theme.css`
- **Description:** Create the visual component. Left accent border (risk-color), PR number + title + verdict chip, repo + author + link. Add CSS styles matching the existing visual language (dark warm-gray theme, floating rounded panels).

## Task 4: Render PrReferenceCardRow in SessionChatView
- **Agent:** frontend-engineer
- **Tier:** 2
- **Depends on:** Task 2, Task 3
- **Touches:** `src/renderer/src/components/SessionChatView.tsx`
- **Description:** Add a `case "pr-reference-card"` to the row rendering switch. Render `<PrReferenceCard>`.

## Task 5: Wire "Open in chat" for PR inbox items
- **Agent:** frontend-engineer
- **Tier:** 3
- **Depends on:** Task 2
- **Touches:** `src/renderer/src/App.tsx`, `src/renderer/src/features/inbox/InboxPanel.tsx`
- **Description:** Update the `onOpenInChat` handler in App.tsx: when the inbox item is `pr-awaiting-review`, find/create a session for the PR's project on the main VM instance, navigate to the session, and insert a PR reference card. Also mark the session title as the PR description.

## Task 6: Add "Discuss in chat" button to review mode overlay
- **Agent:** frontend-engineer
- **Tier:** 2
- **Depends on:** Task 2
- **Touches:** `src/renderer/src/features/review/ReviewModeOverlay.tsx`
- **Description:** Add a "Discuss in chat" button next to the existing action buttons. On click, exit review mode, find/create a session, insert a PR reference card, and navigate.

## Task 7: Add i18n keys
- **Agent:** frontend-engineer
- **Tier:** 1
- **Depends on:** —
- **Touches:** `src/renderer/src/i18n/en.json`
- **Description:** Add keys: `prReferenceCard.title`, `prReferenceCard.openOnPlatform`, `reviewMode.discussInChat`, `session.titlePr` (for PR-titled sessions), `inbox.action.openInChat` (already exists), `prReferenceCard.noVerdict`.

## Task 8: Add `pr-reference-card` to getAvailableActions for PR items
- **Agent:** frontend-engineer
- **Tier:** 1
- **Depends on:** —
- **Touches:** `src/renderer/src/services/impl/InboxService.ts` or wherever `availableActions` is computed
- **Description:** Ensure `open-in-chat` is in the `availableActions` list for `pr-awaiting-review` items.
