# Tasks

## 1. Extend chat types — DONE
- [x] Add AccessMode, ApprovalRequest, QuestionRequest to types.ts
- [x] Add approval/question/interrupted/accessMode to ChatTurn
- [x] Add ApprovalRow, QuestionRow to TranscriptRow union

## 2. Approval panel — DONE
- [x] Create ApprovalPanel.tsx with approve-once/always/decline/cancel buttons
- [x] Show command or filePath in the panel

## 3. Question panel — DONE
- [x] Create QuestionPanel.tsx with option buttons + number key shortcuts
- [x] Add free-text input when allowFreeText is true
- [x] Global keyboard listener for keys 1-9 (skipped when focus in text fields)

## 4. Chat composer — DONE
- [x] Create ChatComposer.tsx with multiline textarea, auto-resize
- [x] Send/Stop toggle based on turn running state
- [x] Draft persistence per thread via drafts state
- [x] Access mode chips (Supervised / Full access)
- [x] Mode indicator badge

## 5. Transcript integration — DONE
- [x] Update useTranscript with resolveApproval, answerQuestion, interruptTurn, setTurnAccessMode
- [x] Update buildRowsFromTurns to include approval/question rows
- [x] Update TranscriptView to render approval/question rows and ChatComposer

## 6. Safe interrupt — DONE
- [x] interruptTurn marks finished + interrupted, clears activeTurnId
- [x] Composer re-enables after interrupt

## 7. Styling — DONE
- [x] CSS for composer, approval panel, question panel, access mode chips

## 8. Mock data — DONE
- [x] Updated mock-session.ts with accessMode field
