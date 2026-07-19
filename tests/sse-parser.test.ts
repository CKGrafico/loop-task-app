import { describe, it, expect } from "vitest";
import { parseSseStream } from "../src/main/sse-parser.js";
import type { SseEvent } from "../src/main/sse-parser.js";

function toStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

function toChunkedStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<SseEvent[]> {
  const events: SseEvent[] = [];
  await parseSseStream(stream, (event) => {
    events.push(event);
  });
  return events;
}

describe("parseSseStream", () => {
  it("parses a single data line event", async () => {
    const events = await collect(toStream("data: hello\n\n"));
    expect(events).toEqual([{ kind: "data", text: "hello" }]);
  });

  it("concatenates multi-line data fields", async () => {
    const events = await collect(toStream("data: line1\ndata: line2\n\n"));
    expect(events).toEqual([{ kind: "data", text: "line1\nline2" }]);
  });

  it("dispatches event type and data separately", async () => {
    const events = await collect(toStream("event: update\ndata: payload\n\n"));
    expect(events).toEqual([
      { kind: "event", text: "update" },
      { kind: "data", text: "payload" },
    ]);
  });

  it("handles chunk boundary splitting the \\n\\n separator", async () => {
    const events = await collect(
      toChunkedStream(["data: hello\n", "\ndata: world\n\n"]),
    );
    expect(events).toEqual([
      { kind: "data", text: "hello" },
      { kind: "data", text: "world" },
    ]);
  });

  it("ignores id fields", async () => {
    const events = await collect(toStream("id: 42\ndata: hello\n\n"));
    expect(events).toEqual([{ kind: "data", text: "hello" }]);
  });

  it("ignores retry fields", async () => {
    const events = await collect(toStream("retry: 5000\ndata: hello\n\n"));
    expect(events).toEqual([{ kind: "data", text: "hello" }]);
  });

  it("ignores comment lines", async () => {
    const events = await collect(toStream(": this is a comment\ndata: hello\n\n"));
    expect(events).toEqual([{ kind: "data", text: "hello" }]);
  });

  it("parses multiple events in a single chunk", async () => {
    const events = await collect(toStream("data: first\n\ndata: second\n\n"));
    expect(events).toEqual([
      { kind: "data", text: "first" },
      { kind: "data", text: "second" },
    ]);
  });

  it("handles empty data field", async () => {
    const events = await collect(toStream("data:\n\n"));
    expect(events).toEqual([{ kind: "data", text: "" }]);
  });

  it("handles data field with no space after colon", async () => {
    const events = await collect(toStream("data:hello\n\n"));
    expect(events).toEqual([{ kind: "data", text: "hello" }]);
  });

  it("handles multi-line data with JSON containing newlines (the original bug)", async () => {
    const payload = JSON.stringify({ code: "abc\ndef" });
    const events = await collect(toStream(`data: ${payload}\n\n`));
    expect(events).toEqual([{ kind: "data", text: payload }]);
    expect(JSON.parse(events[0].text)).toEqual({ code: "abc\ndef" });
  });

  it("does not emit default 'message' event type", async () => {
    const events = await collect(toStream("data: hello\n\n"));
    const eventKinds = events.filter((e) => e.kind === "event");
    expect(eventKinds).toEqual([]);
  });

  it("handles event with all field types combined", async () => {
    const events = await collect(
      toStream("id: 1\nretry: 3000\n: comment\nevent: custom\ndata: line1\ndata: line2\n\n"),
    );
    expect(events).toEqual([
      { kind: "event", text: "custom" },
      { kind: "data", text: "line1\nline2" },
    ]);
  });
});
