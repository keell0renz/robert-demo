import type { UIMessage } from "ai";

// The Path-B equivalent of src/components/workspace/derive.ts. The AI SDK
// surfaces each tool call as a `tool-<name>` part whose streamed `input` carries
// the code the model is writing and whose terminal `output` carries the
// persisted app id. We replay the whole stream in order to reconstruct the
// CURRENT set of apps on the desktop — create adds one, update revises it by id,
// delete removes it. The chat is the source of truth for what's on screen (the
// code_apps rows are the durable copy the tools write).

type ToolPart = {
  type: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

export type DerivedCodeApp = {
  /** Stable identity across the stream: the create call's toolCallId. */
  key: string;
  /** The persisted app id (known once create's output lands); null while streaming. */
  id: string | null;
  title: string;
  letter: string;
  /** The React source the model is writing (may be partial while streaming). */
  code: string | null;
  /** True while this app's tool args are still streaming — the `code` is partial
   *  and not safe to compile yet (compiling it would just throw a syntax error). */
  streaming: boolean;
};

export type DerivedCodeApps = {
  apps: DerivedCodeApp[];
  /** The app whose tool call is mid-flight (args streaming or running), or null. */
  buildingKey: string | null;
};

const isStreaming = (state?: string) =>
  state === "input-streaming" || state === "input-available";

export function deriveCodeApps(messages: readonly UIMessage[]): DerivedCodeApps {
  const byKey = new Map<string, DerivedCodeApp>();
  const order: string[] = [];
  const idToKey = new Map<string, string>();
  let buildingKey: string | null = null;

  const remove = (key: string) => {
    byKey.delete(key);
    const i = order.indexOf(key);
    if (i >= 0) order.splice(i, 1);
    if (buildingKey === key) buildingKey = null;
  };

  for (const message of messages) {
    for (const part of message.parts as unknown as ToolPart[]) {
      const { type, toolCallId, state } = part;
      if (!toolCallId) continue;

      if (type === "tool-create_react_app") {
        let app = byKey.get(toolCallId);
        if (!app) {
          app = { key: toolCallId, id: null, title: "Untitled", letter: "A", code: null, streaming: true };
          byKey.set(toolCallId, app);
          order.push(toolCallId);
        }
        const input = part.input as
          | { title?: string; letter?: string; code?: string }
          | undefined;
        if (input?.title) app.title = input.title;
        if (input?.letter) app.letter = input.letter.toUpperCase();
        if (typeof input?.code === "string") app.code = input.code;
        const output = part.output as { id?: string } | undefined;
        if (output?.id) {
          app.id = output.id;
          idToKey.set(output.id, toolCallId);
        }
        // The code is complete and safe to compile once the args stop streaming
        // (state input-available/output-available). Only `input-streaming` means
        // the source is still half-written.
        app.streaming = state === "input-streaming";
        if (isStreaming(state)) buildingKey = toolCallId;
      } else if (type === "tool-update_react_app") {
        const input = part.input as
          | { id?: string; title?: string; letter?: string; code?: string }
          | undefined;
        const key = input?.id ? idToKey.get(input.id) : undefined;
        const app = key ? byKey.get(key) : undefined;
        if (app) {
          if (input?.title) app.title = input.title;
          if (input?.letter) app.letter = input.letter.toUpperCase();
          if (typeof input?.code === "string") app.code = input.code;
          app.streaming = state === "input-streaming";
          if (isStreaming(state)) buildingKey = key!;
        }
      } else if (type === "tool-delete_react_app") {
        const input = part.input as { id?: string } | undefined;
        const key = input?.id ? idToKey.get(input.id) : undefined;
        if (key && (state === "input-available" || state === "output-available")) {
          remove(key);
          if (input?.id) idToKey.delete(input.id);
        }
      }
    }
  }

  // Only apps with (possibly partial) code are renderable.
  const apps = order.map((k) => byKey.get(k)!).filter((a) => a.code);
  return { apps, buildingKey };
}

// The concatenated assistant/user text of a message.
export function codeMessageText(message: UIMessage): string {
  return message.parts
    .map((p) => (p.type === "text" ? (p as { text: string }).text : ""))
    .join("");
}
