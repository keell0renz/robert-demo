import type { EveMessage } from "eve/react";
import type { UINode } from "@/os";

// The save_page tool surfaces as a `dynamic-tool` part whose streamed `input`
// carries the tree the agent is composing and whose terminal `output` carries
// the persisted page id. Walk all messages and take the LATEST of each, so the
// artifact zone always shows the newest design and the URL tracks the page.
type ToolPart = {
  type: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
};

export type DerivedArtifact = {
  tree: UINode | null;
  pageId: string | null;
  /** A save_page call is mid-flight (args still streaming or running). */
  building: boolean;
};

export function deriveArtifact(messages: readonly EveMessage[]): DerivedArtifact {
  let tree: UINode | null = null;
  let pageId: string | null = null;
  let building = false;

  for (const message of messages) {
    for (const part of message.parts as unknown as ToolPart[]) {
      if (part.type !== "dynamic-tool" || part.toolName !== "save_page") continue;
      const input = part.input as { tree?: UINode } | undefined;
      if (input?.tree) tree = input.tree;
      const output = part.output as { id?: string } | undefined;
      if (output?.id) pageId = output.id;
      building = part.state === "input-streaming" || part.state === "input-available";
    }
  }

  return { tree, pageId, building };
}

// The concatenated assistant/user text of a message (eve splits text into parts).
export function messageText(message: EveMessage): string {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

