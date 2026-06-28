"use client";

import { useEffect, useRef } from "react";
import type { EveMessage } from "eve/react";
import { messageText } from "./derive";
import { PromptComposer } from "./prompt-composer";

// One projected message part. Eve emits text parts and the save_page
// dynamic-tool part in the order they occur, which is exactly how we render
// them — text, then the tool status, then any follow-up text on its own line.
type MessagePart = {
  type: string;
  text?: string;
  toolName?: string;
  state?: string;
};

// The conversation + composer that lives in the right rail. Wired to eve's
// projected messages (text parts + the save_page dynamic-tool part).
export function AgentChat({
  messages,
  isBusy,
  onSend,
  onStop,
}: {
  messages: readonly EveMessage[];
  isBusy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isBusy]);

  const last = messages.at(-1);
  // Eve only surfaces the save_page part once it reaches `output-available` — the
  // long tool-input streaming (the tree the model writes) shows up as nothing.
  // So the live "Designing" status is driven by `isBusy`, not the part state.
  const showThinking =
    isBusy && (!last || last.role === "user" || messageText(last).trim().length === 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message, i) => (
          <Message
            key={message.id}
            message={message}
            pending={isBusy && i === messages.length - 1}
          />
        ))}
        {showThinking ? (
          <div className="chat-shimmer-text text-paragraph-sm font-medium">Thinking…</div>
        ) : null}
      </div>
      <div className="border-border shrink-0 border-t p-3">
        <PromptComposer
          onSend={onSend}
          onStop={onStop}
          isStreaming={isBusy}
          placeholder="Ask for changes…"
        />
        <p className="text-foreground-soft mt-2 text-center text-paragraph-xs">
          The agent composes macOS primitives — it can&apos;t write arbitrary UI.
        </p>
      </div>
    </div>
  );
}

function Message({ message, pending }: { message: EveMessage; pending: boolean }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground text-paragraph-sm ml-auto max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2">
          {messageText(message)}
        </div>
      </div>
    );
  }

  const parts = message.parts as unknown as MessagePart[];
  const designed = parts.some(
    (p) => p.type === "dynamic-tool" && p.toolName === "save_page" && p.state === "output-available",
  );
  const hasText = parts.some((p) => p.type === "text" && p.text?.trim());
  // Shimmer while the turn is still working and hasn't saved yet; once the page
  // is saved it flips to a static "Designed" rendered inline (below). Each is its
  // own line — never merged with the model's prose.
  const showDesigning = pending && hasText && !designed;

  return (
    <div className="space-y-2">
      {/* Parts in natural order: intro text, then the inline "Designed" marker at
          the tool's position, then any follow-up text on its own line. */}
      {parts.map((part, i) => {
        if (part.type === "text") {
          return part.text ? (
            <div key={i} className="text-paragraph-sm text-foreground whitespace-pre-wrap">
              {part.text}
            </div>
          ) : null;
        }
        if (
          part.type === "dynamic-tool" &&
          part.toolName === "save_page" &&
          part.state === "output-available"
        ) {
          return (
            <div key={i} className="text-muted-foreground text-paragraph-sm font-medium">
              Designed
            </div>
          );
        }
        return null;
      })}
      {showDesigning ? (
        <div className="chat-shimmer-text text-paragraph-sm font-medium">Designing</div>
      ) : null}
    </div>
  );
}
