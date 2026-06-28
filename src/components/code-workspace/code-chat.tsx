"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { RiSparkling2Line } from "@remixicon/react";
import type { UIMessage } from "ai";
import { codeMessageText } from "@/code/derive";
import { PromptComposer } from "@/components/workspace/prompt-composer";
import type { RecentCodePage } from "./code-workspace";

const EXAMPLES = [
  "A working calculator",
  "A pomodoro timer that actually counts down",
  "A to-do list I can add, check off, and delete items in",
];

type MessagePart = {
  type: string;
  text?: string;
  state?: string;
};

// The conversation + composer in the Agent window — the Path-B twin of
// AgentChat. Wired to the Vercel AI SDK's UIMessages (text parts + the
// create/update/delete react-app tool parts).
export function CodeChat({
  messages,
  isBusy,
  onSend,
  onStop,
  recentPages = [],
}: {
  messages: readonly UIMessage[];
  isBusy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  recentPages?: RecentCodePage[];
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const empty = messages.length === 0;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isBusy]);

  const last = messages.at(-1);
  const showThinking =
    isBusy && (!last || last.role === "user" || codeMessageText(last).trim().length === 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {empty ? <EmptyState onSend={onSend} isBusy={isBusy} recentPages={recentPages} /> : null}
        {messages.map((message, i) => (
          <Message key={message.id} message={message} pending={isBusy && i === messages.length - 1} />
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
          placeholder="Ask for an app…"
        />
      </div>
    </div>
  );
}

function EmptyState({
  onSend,
  isBusy,
  recentPages,
}: {
  onSend: (text: string) => void;
  isBusy: boolean;
  recentPages: RecentCodePage[];
}) {
  return (
    <div className="fade-up">
      <div className="text-label-xs text-muted-foreground bg-muted ring-border mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1">
        <RiSparkling2Line className="text-primary size-3.5" />
        Generative React UI · Claude Opus 4.8
      </div>
      <h2 className="text-title-h5 text-foreground font-semibold tracking-tight">
        Describe an app.
      </h2>
      <p className="text-paragraph-sm text-muted-foreground mt-1.5">
        I write a real, interactive React component — compiled and run live in your
        browser — then keep editing it as you chat.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => onSend(ex)}
            disabled={isBusy}
            className="text-label-sm text-foreground hover:border-foreground/20 border-border bg-card cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      {recentPages.length > 0 ? (
        <div className="mt-6">
          <div className="text-label-xs text-muted-foreground mb-2 font-medium">Recent desktops</div>
          <div className="flex flex-col gap-1">
            {recentPages.slice(0, 5).map((page) => (
              <Link
                key={page.id}
                href={`/code/${page.id}`}
                className="group hover:bg-muted -mx-1.5 flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors"
              >
                <span className="text-label-sm text-foreground min-w-0 flex-1 truncate font-medium">
                  {page.title}
                </span>
                <span className="text-label-xs text-muted-foreground shrink-0">
                  {relativeTime(page.updatedAt)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function relativeTime(date: Date): string {
  const d = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function toolVerb(type: string): string | null {
  switch (type) {
    case "tool-create_react_app":
      return "Wrote";
    case "tool-update_react_app":
      return "Updated";
    case "tool-delete_react_app":
      return "Removed";
    default:
      return null;
  }
}

function Message({ message, pending }: { message: UIMessage; pending: boolean }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground text-paragraph-sm ml-auto max-w-[85%] rounded-2xl rounded-br-md px-3.5 py-2">
          {codeMessageText(message)}
        </div>
      </div>
    );
  }

  const parts = message.parts as unknown as MessagePart[];
  const acted = parts.some((p) => toolVerb(p.type) && p.state === "output-available");
  const hasText = parts.some((p) => p.type === "text" && p.text?.trim());
  const showBuilding = pending && hasText && !acted;

  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        if (part.type === "text") {
          return part.text ? (
            <div key={i} className="text-paragraph-sm text-foreground whitespace-pre-wrap">
              {part.text}
            </div>
          ) : null;
        }
        const verb = toolVerb(part.type);
        if (verb && part.state === "output-available") {
          return (
            <div key={i} className="text-muted-foreground text-paragraph-sm font-medium">
              {verb}
            </div>
          );
        }
        return null;
      })}
      {showBuilding ? (
        <div className="chat-shimmer-text text-paragraph-sm font-medium">Writing</div>
      ) : null}
    </div>
  );
}
