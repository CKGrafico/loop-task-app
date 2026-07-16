# feat: chat transcript view

## Summary
A virtualized transcript component for chat sessions where every visible row is typed data. Long agent runs produce hundreds of tool calls — a naive message list dies on them. Building this before the composer keeps scope honest.

## What changed
- Added `src/renderer/src/chat/` module with types, transcript model, virtualized view, markdown+highlight rendering, and mock adapter
- Added "chat" section to the segmented tabs and App routing
- Uses `@tanstack/react-virtual` for virtualization, `react-markdown` + `rehype-highlight` for rendering
- Row kinds: user-message, assistant-message, tool-call (expandable), tool-calls-expander, turn-fold
- Collapse/expand state lives in the row model (not component state) so virtualization can't recycle it
- Auto-scroll with "jump to latest" floating button
- Code blocks get syntax highlighting and copy button
- Mock adapter generates 50 turns × 12 tool calls = 600 tool calls for stress testing
- Streaming support: assistant text renders as it arrives with typing indicator

## Acceptance criteria met
- [x] A session with 500+ tool calls scrolls smoothly (virtualized via tanstack-virtual)
- [x] Finished turns collapse; expanding one restores the full activity
- [x] Streaming text doesn't cause visible re-layout of earlier rows
- [x] Works against the mock adapter so it's testable without a VM

## Files added
- `src/renderer/src/chat/types.ts` — Row kind types (UserMessageRow, AssistantMessageRow, ToolCallRow, ToolCallsExpanderRow, TurnFoldRow)
- `src/renderer/src/chat/useTranscript.ts` — Transcript state management (build rows from turns, toggle collapse/expand, append streaming content)
- `src/renderer/src/chat/useAutoScroll.ts` — Auto-scroll hook with isAtBottom tracking and jump-to-latest
- `src/renderer/src/chat/MarkdownContent.tsx` — Markdown renderer with code highlighting, copy button, typing indicator, tool call row component
- `src/renderer/src/chat/TranscriptView.tsx` — Main virtualized transcript view with toolbar (collapse/expand all)
- `src/renderer/src/chat/mock-session.ts` — Mock adapter generating 500+ tool calls

## Files modified
- `src/renderer/src/types.ts` — Added "chat" to Section union
- `src/renderer/src/App.tsx` — Imported TranscriptView, added chat section routing
- `src/renderer/src/components/SegmentedTabs.tsx` — Added "Chat" tab
- `src/renderer/src/theme.css` — Added transcript view CSS (~300 lines: rows, code blocks, tool calls, turn folds, jump button, highlight.js overrides)
- `package.json` — Added @tanstack/react-virtual, react-markdown, rehype-highlight, highlight.js
