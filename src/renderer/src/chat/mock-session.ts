import type { ChatTurn, ToolCall, ToolCallStatus } from "./types";

let idCounter = 0;
function uid(): string {
  idCounter += 1;
  return `tc-${idCounter}`;
}

function toolCall(overrides: Partial<ToolCall> & { kind: string; title: string }): ToolCall {
  const now = Date.now();
  return {
    id: uid(),
    status: "completed" as ToolCallStatus,
    startedAt: now,
    finishedAt: now + 50,
    output: undefined,
    ...overrides,
  };
}

const TOOL_KINDS = ["read", "write", "edit", "bash", "grep", "glob", "search", "fetch"] as const;

function fakeToolCalls(count: number, startAt: number): ToolCall[] {
  const calls: ToolCall[] = [];
  let t = startAt;
  for (let i = 0; i < count; i++) {
    const kind = TOOL_KINDS[i % TOOL_KINDS.length];
    const status: ToolCallStatus = Math.random() > 0.05 ? "completed" : "error";
    const duration = Math.floor(40 + Math.random() * 300);
    calls.push(
      toolCall({
        kind,
        title: `${kind} ${kind === "bash" ? "npm run test" : kind === "read" ? `src/module-${i}.ts` : kind === "write" ? `src/feature-${i}.ts` : kind === "edit" ? `src/component-${i}.tsx` : kind === "grep" ? `"pattern-${i}"` : kind === "glob" ? `**/*.test.ts` : kind === "search" ? `"query-${i}"` : `https://api.example.com/${i}`}`,
        status,
        startedAt: t,
        finishedAt: t + duration,
        output:
          status === "completed"
            ? `Output from ${kind} call #${i + 1}\nDone in ${duration}ms`
            : `Error: ${kind} failed with exit code 1`,
      }),
    );
    t += duration + Math.floor(Math.random() * 200);
  }
  return calls;
}

export function generateMockSession(turnCount: number, toolCallsPerTurn: number): ChatTurn[] {
  const turns: ChatTurn[] = [];
  let t = Date.now() - turnCount * 30000;

  const userPrompts = [
    "Implement the chat transcript view component",
    "Fix the auto-scroll behavior when new messages arrive",
    "Add syntax highlighting for code blocks",
    "Create the mock adapter for testing",
    "Implement turn folding with expand/collapse",
    "Add the virtualized list with tanstack-virtual",
    "Wire up the streaming text renderer",
    "Build the tool call row component",
    "Add the jump-to-latest floating button",
    "Write the CSS for the transcript view",
  ];

  const assistantResponses = [
    "I'll implement the chat transcript view. Let me start by setting up the data model and virtual list.\n\nThe transcript uses a row-based model where each visible row is a typed data object. This keeps collapse/expand state in the model rather than component state, which is essential for virtualization to work correctly.",
    "Fixed the auto-scroll. The key insight is tracking whether the user is at the live edge via a ref, not state, so the virtualizer doesn't cause re-renders.\n\n```typescript\nconst isAtBottom = useRef(true);\nconst handleScroll = () => {\n  isAtBottom.current = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 40;\n};\n```",
    "Added `rehype-highlight` for code blocks. The markdown renderer now supports:\n\n- Syntax highlighting via highlight.js\n- Copy button on code blocks\n- Cache skipping during streaming to avoid partial-block issues",
    "Created the mock adapter that generates sessions with 500+ tool calls. Each turn gets a configurable number of tool calls with realistic kind/title/status distributions.",
    "Implemented turn folding. When a turn finishes, its tool calls and intermediate chatter collapse behind a single \"worked for Ns\" row. The running turn never folds.\n\n> **Note**: Collapse state lives in the row model, not React state, so virtualization can't recycle it away.",
    "Set up `@tanstack/react-virtual` for the transcript list. The virtualizer handles:\n\n- Dynamic row heights via measurements\n- Overscan for smooth scrolling\n- Efficient DOM recycling",
    "The streaming renderer now appends text as it arrives without re-rendering earlier rows. Markdown is parsed incrementally.\n\nKey optimization: **skip the highlight cache while a block is still streaming**, otherwise partial code gets stuck in it.",
    "Tool call rows render as one compact line each — icon by kind, title, status glyph. They expand on click to show the output.\n\n| Kind | Icon | Status |\n|------|------|--------|\n| read | 📄 | ✓ |\n| bash | ⌨️ | ✓ |\n| write | ✏️ | ✗ |",
    "Added the floating \"jump to latest\" button. It appears when the user scrolls up from the live edge and disappears when they scroll back down or click it.",
    "All CSS done. The transcript view follows the Orbion design system:\n\n- `bg_log` surface for the transcript area\n- `bg_elevated` for tool call rows\n- Hairline borders between sections\n- Monospace for code and tool output",
  ];

  for (let i = 0; i < turnCount; i++) {
    const toolCalls = fakeToolCalls(toolCallsPerTurn, t);
    const userMsgAt = t;
    const assistantStart = t + 800;
    const assistantEnd = toolCalls.length > 0
      ? (toolCalls[toolCalls.length - 1]?.finishedAt ?? assistantStart + 5000) + 200
      : assistantStart + 2000;

    turns.push({
      id: uid(),
      userMessage: {
        id: uid(),
        role: "user",
        content: userPrompts[i % userPrompts.length],
        startedAt: userMsgAt,
      },
      assistantMessage: {
        id: uid(),
        role: "assistant",
        content: assistantResponses[i % assistantResponses.length],
        toolCalls,
        startedAt: assistantStart,
        finishedAt: assistantEnd,
      },
      finished: i < turnCount - 1,
      collapsed: false,
    });

    t = assistantEnd + Math.floor(Math.random() * 5000 + 1000);
  }

  return turns;
}

export function generateStreamingTurn(): ChatTurn {
  const now = Date.now();
  return {
    id: uid(),
    userMessage: {
      id: uid(),
      role: "user",
      content: "Stream a long response to test the virtualized transcript",
      startedAt: now,
    },
    assistantMessage: {
      id: uid(),
      role: "assistant",
      content: "",
      toolCalls: [],
      startedAt: now + 200,
      finishedAt: undefined,
    },
    finished: false,
    collapsed: false,
  };
}
