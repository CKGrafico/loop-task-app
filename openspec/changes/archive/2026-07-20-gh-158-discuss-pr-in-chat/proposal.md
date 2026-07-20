# gh-158 — Discuss a PR in a chat

## Summary

"Open in chat" (from inbox PR item or review mode) opens a chat session scoped to the PR's project/instance with a PR reference card inserted (number, title, verdict, link). The agent can answer questions about the PR and take review actions from that conversation.

## Problem

PRs currently surface in the inbox (as notification items) and in the review mode overlay (batch queue strip + briefing/diff view). Neither surface is conversational: the user cannot ask the agent questions about the PR, discuss trade-offs, or iteratively act on the PR through chat. The existing "open-in-chat" inbox action navigates to the instance view but doesn't carry PR context into the conversation.

## Solution

### 1. New transcript row kind: `pr-reference-card`

A compact, live reference card rendered in the chat stream. Shows PR number, title, verdict chip, risk level, author, and a clickable link. The card is read-only (no inline approve/reject — those are review-mode verbs). It provides context for the agent conversation.

### 2. "Open in chat" action wired to create a PR-scoped chat session

When the user clicks "Open in chat" on a PR inbox item or an "Open in chat" button in review mode:

- Find or create a chat session filed under the PR's project on the main VM instance.
- Navigate the user to that session.
- Insert a PR reference card row into the transcript as the first visible row (system-generated assistant message with structured metadata).
- The agent now has the PR context in the conversation and can answer questions or take actions (via MCP tools).

### 3. PR reference card in review mode

Add a "Discuss in chat" button to the review mode overlay header. Clicking it creates/opens a chat session with a PR reference card, same as the inbox action, but from within review mode. The review mode overlay stays open (user can return to it).

## Design decisions

- PR reference cards are **not** live-updating — they capture the PR state at insertion time. The agent has access to real-time PR data via infra actions (get-pr-verdict, get-pr-diff, submit-pr-review).
- No new top-level navigation. The chat session is filed under an existing project in the sidebar.
- The PR reference card is a new `TranscriptRow` kind, persisted via the existing transcript store as a special assistant message with a `pr-ref-` prefix ID and structured content in the message content (JSON payload for the card, plus a human-readable summary).

## Acceptance criteria mapping

| Criterion | Implementation |
|---|---|
| "Open in chat" opens a chat scoped to the PR's project/instance with a PR reference card inserted | Inbox `open-in-chat` action + review mode "Discuss in chat" button both create/find a session and insert a `pr-reference-card` row |
| Card shows number, title, verdict, link | `PrReferenceCardRow` renders PR number, title, verdict chip, risk level, author, and clickable URL |
| Agent can answer questions and take review actions | The agent already has infra actions for PR review; the PR reference card provides context in the conversation |
