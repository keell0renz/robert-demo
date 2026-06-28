"use client";

import { useEffect, useRef } from "react";
import { RiSparkling2Line } from "@remixicon/react";
import type { EveMessage } from "eve/react";
import { cn } from "@/lib/utils/cn";
import { messageText, savedInMessage } from "./derive";
import { PromptComposer } from "./prompt-composer";

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
  const showThinking =
    isBusy && (!last || last.role === "user" || messageText(last).trim().length === 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {showThinking ? (
          <div className="chat-shimmer-text text-paragraph-sm font-medium">Designing…</div>
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

function Message({ message }: { message: EveMessage }) {
  const text = messageText(message);

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground text-paragraph-sm ml-auto max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2">
          {text}
        </div>
      </div>
    );
  }

  const saved = savedInMessage(message);
  return (
    <div className="space-y-2">
      {text ? (
        <div className="text-paragraph-sm text-foreground whitespace-pre-wrap">{text}</div>
      ) : null}
      {saved ? (
        <div
          className={cn(
            "text-label-xs inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
            "bg-success-lighter text-success-base",
          )}
        >
          <RiSparkling2Line className="size-3.5" />
          Updated the page
        </div>
      ) : null}
    </div>
  );
}
