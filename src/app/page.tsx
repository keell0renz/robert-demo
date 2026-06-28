"use client";

import { useEveAgent, type EveMessage } from "eve/react";
import Link from "next/link";
import { useState } from "react";

const EXAMPLES = [
  "A customs declarations dashboard with a sidebar and a pending list",
  "A settings page for a mail app with toggles and an account section",
  "A project tasks list with filters and status badges",
];

// Pull the most recent save_page result out of the streamed message parts.
// eve follows the AI SDK UIMessage convention: a typed tool surfaces as a
// `tool-save_page` part (or `dynamic-tool`) carrying `output` once it resolves.
type LooseToolPart = {
  type: string;
  toolName?: string;
  output?: unknown;
  result?: unknown;
};
function findGenerated(
  messages: readonly EveMessage[],
): { id: string; url: string } | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    for (const part of messages[i].parts as unknown as LooseToolPart[]) {
      const isSave =
        part.type === "tool-save_page" ||
        (part.type === "dynamic-tool" && part.toolName === "save_page");
      if (!isSave) continue;
      const out = (part.output ?? part.result) as { id?: string; url?: string } | undefined;
      if (out && typeof out.url === "string" && typeof out.id === "string") {
        return { id: out.id, url: out.url };
      }
    }
  }
  return null;
}

export default function Home() {
  const [input, setInput] = useState("");
  const agent = useEveAgent();
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const generated = findGenerated(agent.data.messages);

  function submit(message: string) {
    const text = message.trim();
    if (!text || isBusy) return;
    void agent.send({ message: text });
    setInput("");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">robert-demo</h1>
        <p className="text-sm text-black/55 dark:text-white/55">
          Describe a page. The agent designs it in a macOS-style component system and
          renders it.
        </p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the agent to design a page…"
          disabled={isBusy}
          className="flex-1 rounded-lg border border-black/15 px-3 py-2 text-sm outline-none focus:border-black/40 disabled:opacity-50 dark:border-white/20"
        />
        <button
          type="submit"
          disabled={isBusy}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {isBusy ? "Designing…" : "Design"}
        </button>
      </form>

      {agent.data.messages.length === 0 ? (
        <div className="flex flex-col gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => submit(ex)}
              className="rounded-lg border border-black/10 px-3 py-2 text-left text-sm text-black/70 transition-colors hover:border-black/25 dark:border-white/15 dark:text-white/70"
            >
              {ex}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3">
        {agent.data.messages.map((message) => {
          const text = message.parts
            .map((p) => (p.type === "text" ? p.text : ""))
            .join("");
          if (!text) return null;
          return (
            <div key={message.id} className="whitespace-pre-wrap text-sm">
              <span className="font-medium">
                {message.role === "user" ? "You: " : "Agent: "}
              </span>
              {text}
            </div>
          );
        })}
        {isBusy && !generated ? (
          <div className="text-sm text-black/45 dark:text-white/45">
            Composing the interface…
          </div>
        ) : null}
      </div>

      {generated ? (
        <Link
          href={generated.url}
          className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 transition-colors hover:border-black/25 dark:border-white/15 dark:bg-white/[0.04]"
        >
          <span className="text-sm font-medium">Open the generated page →</span>
          <span className="font-mono text-xs text-black/45 dark:text-white/45">
            {generated.url}
          </span>
        </Link>
      ) : null}
    </main>
  );
}
