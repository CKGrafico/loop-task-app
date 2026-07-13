import { useCallback, useRef, useState } from "react";
import type { ChatTurn, TranscriptRow, ToolCall, ToolCallRow, ToolCallsExpanderRow, TurnFoldRow } from "./types";

const TOOL_CALLS_THRESHOLD = 3;

function buildRowsFromTurns(turns: ChatTurn[]): TranscriptRow[] {
  const rows: TranscriptRow[] = [];

  for (const turn of turns) {
    rows.push({
      id: `user-${turn.id}`,
      kind: "user-message",
      turnId: turn.id,
      content: turn.userMessage.content,
    });

    const tools = turn.assistantMessage.toolCalls ?? [];

    if (turn.finished && turn.collapsed) {
      const lastTool = tools[tools.length - 1];
      const durationSec = lastTool?.finishedAt
        ? Math.round((lastTool.finishedAt - turn.assistantMessage.startedAt) / 1000)
        : 0;
      rows.push({
        id: `fold-${turn.id}`,
        kind: "turn-fold",
        turnId: turn.id,
        toolCallCount: tools.length,
        durationSec,
      } as TurnFoldRow);
    } else {
      const visibleTools = tools;
      const hasExpander = visibleTools.length > TOOL_CALLS_THRESHOLD;

      if (hasExpander) {
        rows.push({
          id: `expander-${turn.id}`,
          kind: "tool-calls-expander",
          turnId: turn.id,
          count: visibleTools.length - TOOL_CALLS_THRESHOLD,
        } as ToolCallsExpanderRow);
      }

      const startIdx = hasExpander ? visibleTools.length - TOOL_CALLS_THRESHOLD : 0;
      for (let i = startIdx; i < visibleTools.length; i++) {
        const tc = visibleTools[i];
        rows.push({
          id: `tool-${turn.id}-${tc.id}`,
          kind: "tool-call",
          turnId: turn.id,
          toolCall: tc,
          expanded: false,
        } as ToolCallRow);
      }
    }

    const isStreaming = !turn.assistantMessage.finishedAt;
    if (turn.assistantMessage.content || isStreaming) {
      rows.push({
        id: `assistant-${turn.id}`,
        kind: "assistant-message",
        turnId: turn.id,
        content: turn.assistantMessage.content,
        streaming: isStreaming,
      });
    }
  }

  return rows;
}

export function useTranscript() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [rows, setRows] = useState<TranscriptRow[]>([]);
  const expandedToolsRef = useRef<Set<string>>(new Set());

  const rebuildRows = useCallback((newTurns: ChatTurn[]): TranscriptRow[] => {
    const newRows = buildRowsFromTurns(newTurns);
    setRows(newRows);
    return newRows;
  }, []);

  const setTurnsAndRebuild = useCallback(
    (updater: (prev: ChatTurn[]) => ChatTurn[]) => {
      setTurns((prev) => {
        const next = updater(prev);
        rebuildRows(next);
        return next;
      });
    },
    [rebuildRows],
  );

  const toggleTurnCollapse = useCallback(
    (turnId: string) => {
      setTurns((prev) => {
        const next = prev.map((t) =>
          t.id === turnId ? { ...t, collapsed: !t.collapsed } : t,
        );
        rebuildRows(next);
        return next;
      });
    },
    [rebuildRows],
  );

  const toggleToolExpand = useCallback(
    (rowId: string) => {
      setRows((prev) => {
        const expanded = new Set(expandedToolsRef.current);
        if (expanded.has(rowId)) {
          expanded.delete(rowId);
        } else {
          expanded.add(rowId);
        }
        expandedToolsRef.current = expanded;
        return prev.map((r) =>
          r.kind === "tool-call" && r.id === rowId
            ? { ...r, expanded: !r.expanded }
            : r,
        );
      });
    },
    [],
  );

  const collapseAllFinishedTurns = useCallback(() => {
    setTurns((prev) => {
      const next = prev.map((t) =>
        t.finished && !t.collapsed ? { ...t, collapsed: true } : t,
      );
      rebuildRows(next);
      return next;
    });
  }, [rebuildRows]);

  const expandAllTurns = useCallback(() => {
    setTurns((prev) => {
      const next = prev.map((t) =>
        t.collapsed ? { ...t, collapsed: false } : t,
      );
      rebuildRows(next);
      return next;
    });
  }, [rebuildRows]);

  const addTurn = useCallback(
    (turn: ChatTurn) => {
      setTurnsAndRebuild((prev) => [...prev, turn]);
    },
    [setTurnsAndRebuild],
  );

  const updateTurn = useCallback(
    (turnId: string, updater: (turn: ChatTurn) => ChatTurn) => {
      setTurnsAndRebuild((prev) =>
        prev.map((t) => (t.id === turnId ? updater(t) : t)),
      );
    },
    [setTurnsAndRebuild],
  );

  const appendAssistantContent = useCallback(
    (turnId: string, chunk: string) => {
      setTurns((prev) => {
        const next = prev.map((t) => {
          if (t.id !== turnId) return t;
          return {
            ...t,
            assistantMessage: {
              ...t.assistantMessage,
              content: t.assistantMessage.content + chunk,
            },
          };
        });
        rebuildRows(next);
        return next;
      });
    },
    [rebuildRows],
  );

  const finishTurn = useCallback(
    (turnId: string) => {
      setTurns((prev) => {
        const next = prev.map((t) => {
          if (t.id !== turnId) return t;
          return {
            ...t,
            finished: true,
            assistantMessage: {
              ...t.assistantMessage,
              finishedAt: Date.now(),
            },
          };
        });
        rebuildRows(next);
        return next;
      });
    },
    [rebuildRows],
  );

  return {
    turns,
    rows,
    toggleTurnCollapse,
    toggleToolExpand,
    collapseAllFinishedTurns,
    expandAllTurns,
    addTurn,
    updateTurn,
    appendAssistantContent,
    finishTurn,
  };
}
