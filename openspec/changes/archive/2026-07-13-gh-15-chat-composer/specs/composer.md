# Spec: Chat Composer Component

## Files

- `src/renderer/src/chat/ChatComposer.tsx` — main composer widget
- `src/renderer/src/chat/ApprovalPanel.tsx` — approval request UI
- `src/renderer/src/chat/QuestionPanel.tsx` — agent question UI
- `src/renderer/src/chat/types.ts` — extended with AccessMode, ApprovalRequest, QuestionRequest
- `src/renderer/src/chat/useTranscript.ts` — new hooks for resolve/answer/interrupt
- `src/renderer/src/chat/TranscriptView.tsx` — integration point
- `src/renderer/src/theme.css` — styles for all new components

## Data Model

### AccessMode
- `"supervised"` — agent must ask before commands/file changes
- `"full"` — agent runs without prompts

### ApprovalRequest
- `id`, `turnId`, `command?`, `filePath?`, `description`, `resolved`, `decision?`
- Decisions: `"approve-once" | "approve-always" | "decline" | "cancel"`

### QuestionRequest
- `id`, `turnId`, `text`, `options: QuestionOption[]`, `singleChoice`, `allowFreeText`, `resolved`, `answer?`
- `QuestionOption`: `{ key, label }`

### ChatTurn extension
- `accessMode: AccessMode`
- `approval?: ApprovalRequest`
- `question?: QuestionRequest`
- `interrupted?: boolean`

## Composer Behavior

- Textarea with auto-resize (max 160px)
- Enter sends, Shift+Enter newline
- Send button (lime circle) → Stop button (red circle) while turn runs
- Draft text keyed by turn ID persists in state when switching contexts
- Access mode chips (Supervised / Full access) above the input
- Mode indicator shown as a small colored badge

## Approval Panel

- Embedded in composer area, above the input
- Shows description + command/filePath
- Four buttons: Approve once (lime), Always allow (lime outline), Decline (red outline), Cancel turn (muted)

## Question Panel

- Embedded in composer area, above the input
- Options rendered as buttons with key badges (1-9)
- Global keydown listener for numbers (ignored when typing in inputs)
- Optional free-text input field with Send button

## Interrupt

- Stop button calls `interruptTurn` which marks turn as finished + interrupted
- Active turn ID cleared, composer re-enables input
- No transcript corruption — the interrupted turn stays in the list with its partial content
