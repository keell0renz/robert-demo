"use client";

import { useEveAgent } from "eve/react";
import { useState } from "react";

// Minimal smoke-test chat against the eve backend (Claude Opus 4.8). useEveAgent
// talks to the same-origin /eve/v1/* routes mounted by withEve in next.config.
// The real macOS-style generative UI is built on top of this.
export default function Home() {
  const [input, setInput] = useState("");
  const agent = useEveAgent();
  const isBusy = agent.status === "submitted" || agent.status === "streaming";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">robert-demo</h1>

      <div className="flex flex-1 flex-col gap-3">
        {agent.data.messages.map((message) => (
          <div key={message.id} className="whitespace-pre-wrap">
            <span className="font-medium">
              {message.role === "user" ? "You: " : "AI: "}
            </span>
            {message.parts.map((part, i) =>
              part.type === "text" ? (
                <span key={`${message.id}-${i}`}>{part.text}</span>
              ) : null,
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const message = input.trim();
          if (!message) return;
          void agent.send({ message });
          setInput("");
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the agent to design a page…"
          disabled={isBusy}
          className="flex-1 rounded-md border border-black/15 px-3 py-2 outline-none focus:border-black/40 dark:border-white/20"
        />
        <button
          type="submit"
          disabled={isBusy}
          className="rounded-md bg-foreground px-4 py-2 text-background disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}
