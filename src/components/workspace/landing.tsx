"use client";

import { RiAppleLine, RiSparkling2Line } from "@remixicon/react";
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
}: {
  onSend: (text: string) => void;
  isBusy: boolean;
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
        </div>
      </div>
    </div>
  );
}
