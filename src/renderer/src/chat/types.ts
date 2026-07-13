export type ToolCallStatus = "running" | "completed" | "error";

export interface ToolCall {
  id: string;
  kind: string;
  title: string;
  status: ToolCallStatus;
  output?: string;
  startedAt: number;
  finishedAt?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  startedAt: number;
  finishedAt?: boolean;
}

export interface ChatTurn {
  id: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  finished: boolean;
  collapsed: boolean;
}

export type RowKind =
  | "user-message"
  | "assistant-message"
  | "tool-call"
  | "tool-calls-expander"
  | "turn-fold";

export interface BaseRow {
  id: string;
  kind: RowKind;
  turnId: string;
}

export interface UserMessageRow extends BaseRow {
  kind: "user-message";
  content: string;
}

export interface AssistantMessageRow extends BaseRow {
  kind: "assistant-message";
  content: string;
  streaming: boolean;
}

export interface ToolCallRow extends BaseRow {
  kind: "tool-call";
  toolCall: ToolCall;
  expanded: boolean;
}

export interface ToolCallsExpanderRow extends BaseRow {
  kind: "tool-calls-expander";
  count: number;
}

export interface TurnFoldRow extends BaseRow {
  kind: "turn-fold";
  toolCallCount: number;
  durationSec: number;
}

export type TranscriptRow =
  | UserMessageRow
  | AssistantMessageRow
  | ToolCallRow
  | ToolCallsExpanderRow
  | TurnFoldRow;
