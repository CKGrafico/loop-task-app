import { createParser } from "eventsource-parser";
import type { EventSourceMessage } from "eventsource-parser";

export interface SseEvent {
  kind: "data" | "event";
  text: string;
}

export async function parseSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: SseEvent) => void,
): Promise<void> {
  const parser = createParser({
    onEvent(message: EventSourceMessage) {
      if (message.event !== undefined && message.event !== "message") {
        onEvent({ kind: "event", text: message.event });
      }
      onEvent({ kind: "data", text: message.data });
    },
  });

  const decoder = new TextDecoder();

  for await (const chunk of body) {
    parser.feed(decoder.decode(chunk as Uint8Array, { stream: true }));
  }
}
