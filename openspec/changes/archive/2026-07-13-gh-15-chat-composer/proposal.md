# Chat Composer — Approvals, Questions and Access Modes

## Why

With the transcript and the OpenCode connection in place, this closes the loop: send a prompt to a VM, watch it work, answer its questions, approve its actions.

## What

- **Composer**: multiline input with a send button that turns into stop while a turn runs. Draft text persists per thread, so switching threads doesn't eat a half-written prompt.
- **Approvals** dock into the composer area instead of floating in the transcript. Four choices: approve once, always allow for this session, decline, cancel the turn. The panel shows which command or file the agent wants.
- **Agent questions** render their options as buttons, selectable with keys 1-9 when focus is outside a text field. Single-choice questions advance on pick; a free-text answer stays available.
- **Access mode** per thread: Supervised (agent asks before commands and file changes) or Full access (no prompts). Visible in the composer, switchable mid-session.
- **Interrupt** is safe: stop cancels the current turn without corrupting the transcript.

## Acceptance Criteria

- [ ] Prompt, streamed answer, follow-up: works end to end against one VM
- [ ] An approval request blocks the turn until answered and all four decisions behave as named
- [ ] Number keys answer option questions
- [ ] Mode switch takes effect on the next turn and is shown on the thread
