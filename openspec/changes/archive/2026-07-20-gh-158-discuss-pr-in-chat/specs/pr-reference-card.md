# PR Reference Card spec

## Row kind: `pr-reference-card`

### Data shape

```typescript
interface PrReferenceCardRow extends BaseRow {
  kind: "pr-reference-card";
  prNumber: number;
  prTitle: string;
  prRepo: string;
  prAuthor: string;
  prUrl: string;
  prVerdict?: PrVerdict;
}
```

### Rendering

- Compact card with left accent border (uses the risk-level color — green for low, amber for medium, red for high, grey for uncertain).
- Top row: `#prNumber` in bold + prTitle truncated + verdict chip.
- Second row: `repo` + author login + clickable "Open on GitHub" link.
- The card is read-only. No approve/reject buttons — those are review-mode verbs.

### Persistence

Persisted as a single `TranscriptMessage` with:
- `id`: `pr-ref-{timestamp}`
- `role`: "assistant"
- `content`: JSON string `{ kind: "pr-reference-card", prNumber, prTitle, prRepo, prAuthor, prUrl, prVerdict }`
- `environmentId`: the environment ID the PR belongs to

On transcript reload, the `useTranscript` hook recognizes `pr-ref-` prefix messages and reconstructs the `PrReferenceCardRow`.

### Insertion

Triggered by:
1. Inbox "Open in chat" action on a `pr-awaiting-review` item.
2. Review mode "Discuss in chat" button.
3. Both paths: find/create a session → navigate → insert the card row.
