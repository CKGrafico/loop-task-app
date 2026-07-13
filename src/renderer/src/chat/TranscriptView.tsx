import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { TranscriptRow, ChatTurn } from "./types";
import { useTranscript } from "./useTranscript";
import { useAutoScroll } from "./useAutoScroll";
import { MarkdownContent, ToolCallRowView } from "./MarkdownContent";
import { Icon } from "../components/Icon";

export function TranscriptView({
  initialTurns,
  streamingTurn,
}: {
  initialTurns: ChatTurn[];
  streamingTurn?: ChatTurn;
}) {
  const {
    turns,
    rows,
    toggleTurnCollapse,
    toggleToolExpand,
    collapseAllFinishedTurns,
    expandAllTurns,
    addTurn,
    appendAssistantContent,
    finishTurn,
  } = useTranscript();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showJump, setShowJump] = React.useState(false);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    isAtBottomRef.current = atBottom;
    setShowJump(!atBottom);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    isAtBottomRef.current = true;
    setShowJump(false);
  }, []);

  useEffect(() => {
    for (const turn of initialTurns) {
      addTurn(turn);
    }
  }, []);

  const streamingChunkIndexRef = useRef(0);
  const streamingContentRef = useRef(
    "I'm analyzing the codebase to understand the current architecture. Let me start by reading the relevant files.\n\n" +
    "After reviewing the project structure, here's my analysis:\n\n" +
    "The current architecture uses a three-process Electron model. The renderer is sandboxed and communicates " +
    "through a typed IPC bridge. All HTTP requests go through the main process proxy.\n\n" +
    "```typescript\n" +
    "interface TranscriptViewProps {\n" +
    "  initialTurns: ChatTurn[];\n" +
    "  streamingTurn?: ChatTurn;\n" +
    "}\n" +
    "```\n\n" +
    "The chat transcript view will integrate as a new section alongside loops, tasks, and projects. " +
    "It will use a row-based virtualized list to handle 500+ tool calls efficiently.\n\n" +
    "Key design decisions:\n" +
    "- Collapse/expand state lives in the row model, not component state\n" +
    "- Turn folding keeps finished turns compact\n" +
    "- Streaming text renders incrementally without re-rendering earlier rows\n" +
    "- Code blocks skip the highlight cache while streaming\n\n" +
    "This ensures smooth scrolling and proper virtualization even with thousands of rows.",
  );

  useEffect(() => {
    if (!streamingTurn) return;
    addTurn(streamingTurn);

    const content = streamingContentRef.current;
    let idx = 0;
    const interval = setInterval(() => {
      const chunkSize = Math.floor(Math.random() * 8) + 3;
      const chunk = content.slice(idx, idx + chunkSize);
      idx += chunkSize;
      appendAssistantContent(streamingTurn.id, chunk);
      if (idx >= content.length) {
        clearInterval(interval);
        finishTurn(streamingTurn.id);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [streamingTurn, addTurn, appendAssistantContent, finishTurn]);

  useEffect(() => {
    if (isAtBottomRef.current && scrollRef.current && rows.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rows.length]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      if (!row) return 40;
      switch (row.kind) {
        case "user-message":
          return 48;
        case "assistant-message":
          return 80;
        case "tool-call":
          return row.expanded ? 140 : 36;
        case "tool-calls-expander":
          return 36;
        case "turn-fold":
          return 40;
        default:
          return 40;
      }
    },
    overscan: 10,
  });

  const handleToggleCollapse = useCallback(
    (turnId: string) => {
      toggleTurnCollapse(turnId);
    },
    [toggleTurnCollapse],
  );

  const handleToggleTool = useCallback(
    (rowId: string) => {
      toggleToolExpand(rowId);
      setTimeout(() => virtualizer.measure(), 0);
    },
    [toggleToolExpand, virtualizer],
  );

  const renderRow = useCallback(
    (row: TranscriptRow) => {
      switch (row.kind) {
        case "user-message":
          return (
            <div className="transcript-user-msg">
              <div className="transcript-avatar user-avatar">U</div>
              <div className="transcript-msg-body">
                <MarkdownContent content={row.content} />
              </div>
            </div>
          );

        case "assistant-message":
          return (
            <div className="transcript-assistant-msg">
              <div className="transcript-avatar assistant-avatar">A</div>
              <div className="transcript-msg-body">
                <MarkdownContent
                  content={row.content}
                  streaming={row.streaming}
                />
              </div>
            </div>
          );

        case "tool-call":
          return (
            <ToolCallRowView
              toolCall={row.toolCall}
              expanded={row.expanded}
              onToggle={() => handleToggleTool(row.id)}
            />
          );

        case "tool-calls-expander":
          return (
            <button
              className="transcript-expander"
              onClick={() => handleToggleCollapse(row.turnId)}
            >
              <Icon name="chevronDown" size={12} /> {row.count} earlier tool
              calls
            </button>
          );

        case "turn-fold":
          return (
            <button
              className="transcript-turn-fold"
              onClick={() => handleToggleCollapse(row.turnId)}
            >
              <Icon name="chevronDown" size={12} /> worked for {row.durationSec}
              s · {row.toolCallCount} tool calls
            </button>
          );
      }
    },
    [handleToggleCollapse, handleToggleTool],
  );

  return (
    <div className="transcript-view">
      <div className="transcript-toolbar">
        <span className="overline">Transcript</span>
        <span className="spacer" />
        <button className="toggle small" onClick={collapseAllFinishedTurns}>
          Collapse all
        </button>
        <button className="toggle small" onClick={expandAllTurns}>
          Expand all
        </button>
        <span className="transcript-row-count">{rows.length} rows</span>
      </div>

      <div
        ref={scrollRef}
        className="transcript-scroll"
        onScroll={onScroll}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const row = rows[virtualItem.index];
            if (!row) return null;
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {renderRow(row)}
              </div>
            );
          })}
        </div>
      </div>

      {showJump && (
        <button className="transcript-jump-btn" onClick={scrollToBottom}>
          <Icon name="arrowUp" size={13} /> Jump to latest
        </button>
      )}
    </div>
  );
}
