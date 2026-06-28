// mirror-ui — Chat shared types
// These types are shared across ChatComposer, ChatMessage, ChatThread, ChatLayout.

export type ChatMessageRole = "user" | "assistant";

export type ChatMessageStatus = "complete" | "streaming" | "typing" | "stopped" | "error";

export type AttachmentItem = {
  id: string;
  name: string;
  /** File extension in upper-case, e.g. "PDF" */
  ext: string;
  /** Object URL or remote URL for images */
  url?: string;
  type: "file" | "image";
  /** uploading = in flight; error = failed upload */
  uploadStatus?: "uploading" | "error";
};

// A tool the assistant invoked during a turn (e.g. web search). Generic so the
// tool-call UI can render any tool, not just one.
export type ChatToolInvocation = {
  /** Tool call id. */
  id: string;
  /** Tool name as the provider reports it, e.g. "web_search". */
  name: string;
  /** Lifecycle collapsed to what the UI cares about. */
  state: "running" | "done" | "error";
  /** Optional input the tool ran with (e.g. a web-search query), shown faded
   *  when the provider exposes it — search results carry it; many tools won't. */
  query?: string;
  /** Present on a successful `create_excel` call: the file name plus the
   *  spreadsheet spec, so the UI can offer an ephemeral download by re-POSTing
   *  the spec. Kept as `unknown` so this generic chat layer stays decoupled from
   *  the Copilot's Excel schema. */
  download?: { fileName: string; spec: unknown };
  /** What the tool ran with and returned, for an expandable "show details"
   *  panel. Both pre-stringified + truncated for display. */
  detail?: { input?: string; output?: string };
};

// A web source that grounded the reply (provider-native citations).
export type ChatSource = {
  id: string;
  url: string;
  /** Page title when the provider supplies one; UI falls back to the hostname. */
  title?: string;
};

export type ChatThreadMessage = {
  id: string;
  role: ChatMessageRole;
  status: ChatMessageStatus;
  content: string;
  contentType?: "text" | "file" | "image";
  attachments?: AttachmentItem[];
  /** Tools invoked during this turn (assistant only). */
  toolInvocations?: ChatToolInvocation[];
  /** Citations grounding this turn (assistant only). */
  sources?: ChatSource[];
  /** ISO date string for date-divider grouping */
  timestamp?: string;
  /** Avatar src for assistant; omit for user */
  avatarSrc?: string;
  /** Avatar fallback initials for assistant */
  avatarFallback?: string;
};
