import type { EveMessage } from "eve/react";
import type { UINode } from "@/os";

// The app tools surface as `dynamic-tool` parts whose streamed `input` carries
// the tree the agent is composing and whose terminal `output` carries the
// persisted app id. We replay the whole tool stream in order to reconstruct the
// CURRENT set of apps on the desktop — create adds one, update revises it by id,
// delete removes it. The chat is the source of truth for what's on screen (the
// DB rows are the durable copy the tools write).
type ToolPart = {
  type: string;
  toolName?: string;
  toolCallId?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

export type DerivedApp = {
  /** Stable identity across the whole stream: the create call's toolCallId. */
  key: string;
  /** The persisted app id (known once create's output lands); null while streaming. */
  id: string | null;
  title: string;
  letter: string;
  tree: UINode | null;
};

export type DerivedApps = {
  /** Apps currently on the desktop, in creation order. */
  apps: DerivedApp[];
  /** The app whose tool call is mid-flight (args streaming or running), or null. */
  buildingKey: string | null;
};

const isStreaming = (state?: string) =>
  state === "input-streaming" || state === "input-available";

export function deriveApps(messages: readonly EveMessage[]): DerivedApps {
  const byKey = new Map<string, DerivedApp>();
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
      if (part.type !== "dynamic-tool" || !part.toolCallId) continue;
      const { toolName, toolCallId, state } = part;

      if (toolName === "create_application") {
        let app = byKey.get(toolCallId);
        if (!app) {
          app = { key: toolCallId, id: null, title: "Untitled", letter: "A", tree: null };
          byKey.set(toolCallId, app);
          order.push(toolCallId);
        }
        const input = part.input as
          | { title?: string; letter?: string; tree?: UINode }
          | undefined;
        if (input?.title) app.title = input.title;
        if (input?.letter) app.letter = input.letter.toUpperCase();
        if (input?.tree) app.tree = input.tree;
        const output = part.output as { id?: string } | undefined;
        if (output?.id) {
          app.id = output.id;
          idToKey.set(output.id, toolCallId);
        }
        if (isStreaming(state)) buildingKey = toolCallId;
      } else if (toolName === "update_application") {
        const input = part.input as
          | { id?: string; title?: string; letter?: string; tree?: UINode }
          | undefined;
        const key = input?.id ? idToKey.get(input.id) : undefined;
        const app = key ? byKey.get(key) : undefined;
        if (app) {
          if (input?.title) app.title = input.title;
          if (input?.letter) app.letter = input.letter.toUpperCase();
          if (input?.tree) app.tree = input.tree;
          if (isStreaming(state)) buildingKey = key!;
        }
      } else if (toolName === "delete_application") {
        const input = part.input as { id?: string } | undefined;
        const key = input?.id ? idToKey.get(input.id) : undefined;
        // Apply once the id is actually known (not while it's still streaming in).
        if (key && (state === "input-available" || state === "output-available")) {
          remove(key);
          if (input?.id) idToKey.delete(input.id);
        }
      }
    }
  }

  // Only apps with a (possibly partial) tree are renderable.
  const apps = order.map((k) => byKey.get(k)!).filter((a) => a.tree);
  return { apps, buildingKey };
}

// The concatenated assistant/user text of a message (eve splits text into parts).
export function messageText(message: EveMessage): string {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}
