## 1. Shared types & persistence

- [ ] 1.1 Add optional `environmentId` field to `TranscriptMessage` in `src/shared/ipc.ts` <!-- agent: frontend-engineer.build, depends_on: [], touches: [src/shared/ipc.ts] -->
- [ ] 1.2 Update main-process transcript-store to persist and read `environmentId` on messages <!-- agent: frontend-engineer.build, depends_on: [1.1], touches: [src/main/transcript-store.ts] -->
- [ ] 1.3 Update mock transcript service to pass through `environmentId` on append/update <!-- agent: frontend-engineer.build, depends_on: [1.1], touches: [src/renderer/src/services/mock/MockServices.ts] -->

## 2. Instance switch with interrupt

- [ ] 2.1 Refactor `handleInstanceSwitch` in `App.tsx` to interrupt any active generation before re-pointing the session <!-- agent: frontend-engineer.build, depends_on: [], touches: [src/renderer/src/App.tsx] -->
- [ ] 2.2 Clear `activeTurnId` in `SessionChatView` when instance switch occurs (so stale stream events from the old instance are ignored) <!-- agent: frontend-engineer.build, depends_on: [2.1], touches: [src/renderer/src/components/SessionChatView.tsx] -->
- [ ] 2.3 Call `mcpService.connect(newEnvironmentId)` after the switch to refresh MCP tools for the new instance <!-- agent: frontend-engineer.build, depends_on: [2.1], touches: [src/renderer/src/App.tsx] -->

## 3. Handoff divider row

- [ ] 3.1 Add `InstanceHandoffRow` type and `"instance-handoff"` row kind to `src/renderer/src/chat/types.ts` <!-- agent: frontend-engineer.build, depends_on: [], touches: [src/renderer/src/chat/types.ts] -->
- [ ] 3.2 Update `messagesToChatTurns` in `useTranscript.ts` to detect `instance-switch-*` messages and produce `InstanceHandoffRow` rows instead of pairing them as assistant turns <!-- agent: frontend-engineer.build, depends_on: [3.1], touches: [src/renderer/src/chat/useTranscript.ts] -->
- [ ] 3.3 Add `fromInstance`/`toInstance` metadata to the instance-switch transcript message so the divider can display both names <!-- agent: frontend-engineer.build, depends_on: [2.1, 3.1], touches: [src/renderer/src/App.tsx, src/shared/ipc.ts] -->

## 4. Instance attribution rendering

- [ ] 4.1 Pass `environments` list to `SessionChatView` so it can resolve `environmentId` to instance names <!-- agent: frontend-engineer.build, depends_on: [1.1], touches: [src/renderer/src/components/SessionChatView.tsx, src/renderer/src/App.tsx] -->
- [ ] 4.2 Render "on \<instance\>" attribution label on assistant messages that carry `environmentId` <!-- agent: frontend-engineer.build, depends_on: [4.1, 1.1], touches: [src/renderer/src/components/SessionChatView.tsx] -->
- [ ] 4.3 Render `InstanceHandoffRow` as a visual divider with old → new instance names in `SessionChatView.tsx` <!-- agent: frontend-engineer.build, depends_on: [3.2, 3.3, 5.1], touches: [src/renderer/src/components/SessionChatView.tsx] -->

## 5. Styling & i18n

- [ ] 5.1 Add CSS for handoff divider (centered, muted, separator lines) in `theme.css` <!-- agent: frontend-engineer.build, depends_on: [], touches: [src/renderer/src/theme.css] -->
- [ ] 5.2 Add CSS for "on \<instance\>" attribution label in `theme.css` <!-- agent: frontend-engineer.build, depends_on: [], touches: [src/renderer/src/theme.css] -->
- [ ] 5.3 Add i18n keys for handoff divider text and attribution label in `en.json` <!-- agent: frontend-engineer.fast, depends_on: [], touches: [src/renderer/src/i18n/en.json] -->
- [ ] 5.4 Update the `instanceSelector.switchedInstance` i18n message to match the new divider style <!-- agent: frontend-engineer.fast, depends_on: [5.3], touches: [src/renderer/src/i18n/en.json] -->

## 6. Verification

- [ ] 6.1 Run TypeScript type-check across main/preload/renderer and fix any errors <!-- agent: frontend-engineer.fast, depends_on: [1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4], touches: [] -->
- [ ] 6.2 Verify mock adapter works with `environmentId` field and handoff rows <!-- agent: frontend-engineer.fast, depends_on: [1.3, 3.2, 6.1], touches: [] -->
