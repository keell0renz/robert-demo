"use client";

import Link from "next/link";
import { RiAppleLine, RiArrowRightUpLine, RiSparkling2Line, RiWindowLine } from "@remixicon/react";
import type { RecentPage } from "./workspace";
import { PromptComposer } from "./prompt-composer";
import { ThemeToggle } from "./theme-toggle";

const EXAMPLES = [
  "A customs declarations dashboard with a sidebar and a pending list",
  "A mail app settings page with an account section and toggles",
  "A project tracker with filters, status badges, and a task list",
];

// The landing view shown until the first message is sent. A hero with the
// prompt composer; on submit the workspace takes over.
export function Landing({
  onSend,
  isBusy,
  recentPages = [],
}: {
  onSend: (text: string) => void;
  isBusy: boolean;
  recentPages?: RecentPage[];
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Decorative grid background. The fade mask lives on this layer ONLY —
          putting it on a content wrapper would mask the UI itself (the composer
          and chips would render half-transparent). */}
      <div
        aria-hidden
        className="bg-grid bg-grid-fade pointer-events-none absolute inset-0 -z-10"
      />
      <header className="flex items-center justify-between px-5 py-4">
        <div className="text-label-sm text-foreground flex items-center gap-2 font-medium">
          <RiAppleLine className="size-[18px]" />
          robert-demo
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 pb-24">
        <div className="fade-up w-full max-w-2xl">
          <div className="text-label-xs text-muted-foreground bg-muted ring-border mx-auto mb-6 inline-flex w-auto items-center gap-1.5 rounded-full px-3 py-1 ring-1">
            <RiSparkling2Line className="text-primary size-3.5" />
            Generative macOS UI · Claude Opus 4.8
          </div>
          <h1 className="text-title-h2 text-foreground text-balance text-center font-semibold tracking-tight">
            Describe an app. Watch it designed in macOS.
          </h1>
          <p className="text-paragraph-lg text-muted-foreground mx-auto mt-4 max-w-xl text-balance text-center">
            The agent composes a closed set of macOS primitives into a real
            interface — then keeps editing it as you chat.
          </p>

          <div className="mt-8">
            <PromptComposer onSend={onSend} isStreaming={isBusy} />
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => onSend(ex)}
                disabled={isBusy}
                className="text-label-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 border-border bg-card rounded-full border px-3 py-1.5 transition-colors disabled:opacity-50"
              >
                {ex}
              </button>
            ))}
          </div>

          {recentPages.length > 0 ? (
            <div className="mt-14">
              <div className="text-label-xs text-muted-foreground mb-3 flex items-center gap-1.5 font-medium">
                <RiWindowLine className="size-3.5" />
                Recent designs
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {recentPages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/${page.id}`}
                    className="group border-border bg-card hover:border-foreground/20 flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-label-sm text-foreground truncate font-medium">
                        {page.title}
                      </div>
                      <div className="text-label-xs text-muted-foreground mt-0.5 truncate">
                        {page.prompt}
                      </div>
                    </div>
                    <span className="text-label-xs text-muted-foreground shrink-0">
                      {relativeTime(page.updatedAt)}
                    </span>
                    <RiArrowRightUpLine className="text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
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
