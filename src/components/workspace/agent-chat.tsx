"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { RiSparkling2Line } from "@remixicon/react";
import type { EveMessage } from "eve/react";
import { messageText } from "./derive";
import { PromptComposer } from "./prompt-composer";
import type { RecentPage } from "./workspace";

const EXAMPLES = [
  "A mail app settings page with an account section and toggles",
  "A project tracker with filters, status badges, and a task list",
  "A customs declarations dashboard with a sidebar and a pending list",
];

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
  recentPages = [],
}: {
  messages: readonly EveMessage[];
  isBusy: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
  recentPages?: RecentPage[];
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const empty = messages.length === 0;

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
        {empty ? (
          <EmptyState onSend={onSend} isBusy={isBusy} recentPages={recentPages} />
        ) : null}
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

// The Agent app's first-run state: a short hero, example prompts, and a way back
// into earlier designs. This is what greets you on boot, in place of the old
// full-page landing.
function EmptyState({
  onSend,
  isBusy,
  recentPages,
}: {
  onSend: (text: string) => void;
  isBusy: boolean;
  recentPages: RecentPage[];
}) {
  return (
    <div className="fade-up">
      <div className="text-label-xs text-muted-foreground bg-muted ring-border mb-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1">
        <RiSparkling2Line className="text-primary size-3.5" />
        Generative macOS UI · Claude Opus 4.8
      </div>
      <h2 className="text-title-h5 text-foreground font-semibold tracking-tight">
        Describe an app.
      </h2>
      <p className="text-paragraph-sm text-muted-foreground mt-1.5">
        I compose a closed set of macOS primitives into a real interface on the
        desktop — then keep editing it as you chat.
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
          <div className="text-label-xs text-muted-foreground mb-2 font-medium">
            Recent designs
          </div>
          <div className="flex flex-col gap-1">
            {recentPages.slice(0, 5).map((page) => (
              <Link
                key={page.id}
                href={`/${page.id}`}
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

// Compact "3h ago" / "2d ago" label for the recent list.
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
