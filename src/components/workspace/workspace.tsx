"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  RiAddLine,
  RiAppleLine,
  RiArrowRightUpLine,
  RiLayoutRightLine,
  RiWindowLine,
} from "@remixicon/react";
import { useEveAgent } from "eve/react";
import { Render, type UINode } from "@/os";
import { persistChat } from "@/app/actions";
import { AgentChat } from "./agent-chat";
import { deriveArtifact } from "./derive";
import { Landing } from "./landing";
import { RAIL_DEFAULT, RAIL_MAX, RAIL_MIN, RightRail } from "./right-rail";
import { ThemeToggle } from "./theme-toggle";

export type InitialPage = {
  id: string;
  title: string;
  tree: UINode;
  chatEvents: unknown[] | null;
  chatSession: Record<string, unknown> | null;
};

const TOPBAR_H = 52;

export function Workspace({ initialPage }: { initialPage?: InitialPage | null }) {
  const agent = useEveAgent({
    initialEvents: (initialPage?.chatEvents ?? undefined) as never,
    initialSession: (initialPage?.chatSession ?? undefined) as never,
    onFinish: (snapshot) => {
      const id = deriveArtifact(snapshot.data.messages).pageId ?? initialPage?.id ?? null;
      if (!id) return;
      void persistChat(id, {
        events: snapshot.events as unknown[],
        session: (snapshot.session ?? null) as unknown as Record<string, unknown> | null,
      });
    },
  });

  const messages = agent.data.messages;
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const derived = useMemo(() => deriveArtifact(messages), [messages]);

  const tree = derived.tree ?? initialPage?.tree ?? null;
  const pageId = derived.pageId ?? initialPage?.id ?? null;
  const hasStarted = Boolean(initialPage) || messages.length > 0;
  const title =
    (tree?.props?.title as string | undefined) ?? initialPage?.title ?? "Untitled";

  const send = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message) return;
      void agent.send({ message });
    },
    [agent],
  );

  // Once the first artifact exists, assign /{id} in place — no navigation, the
  // durable session keeps streaming into the same mounted component.
  useEffect(() => {
    if (!pageId) return;
    const target = `/${pageId}`;
    if (window.location.pathname !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [pageId]);

  // ── Rail state ────────────────────────────────────────────────────────────
  const [railOpen, setRailOpen] = useState(true);
  const [railWidth, setRailWidth] = useState(RAIL_DEFAULT);
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem("rail-width"));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted width on mount (SSR-safe)
    if (saved >= RAIL_MIN && saved <= RAIL_MAX) setRailWidth(saved);
  }, []);

  const changeWidth = useCallback((w: number) => {
    setRailWidth(w);
    window.localStorage.setItem("rail-width", String(w));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setRailOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!hasStarted) {
    return <Landing onSend={send} isBusy={isBusy} />;
  }

  const paddingRight = railOpen ? railWidth : 0;

  return (
    <>
      <div
        className="bg-background min-h-dvh"
        style={{ paddingRight, transition: resizing ? "none" : "padding 200ms ease-out" }}
      >
        <header
          className="border-border bg-card/80 sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 backdrop-blur"
          style={{ height: TOPBAR_H }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <RiAppleLine className="size-[18px] shrink-0" />
            <span className="text-label-sm text-foreground truncate font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            {pageId ? (
              <Link
                href={`/${pageId}`}
                target="_blank"
                className="text-label-xs text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors"
              >
                Open <RiArrowRightUpLine className="size-3.5" />
              </Link>
            ) : null}
            <Link
              href="/"
              className="text-label-xs text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <RiAddLine className="size-3.5" /> New
            </Link>
            <ThemeToggle />
            {!railOpen ? (
              <button
                onClick={() => setRailOpen(true)}
                aria-label="Open panel"
                title="Open panel  ⌘I"
                className="text-foreground-soft hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg transition-colors"
              >
                <RiLayoutRightLine className="size-[18px]" />
              </button>
            ) : null}
          </div>
        </header>

        <main style={{ minHeight: `calc(100dvh - ${TOPBAR_H}px)` }}>
          <ArtifactStage tree={tree} building={derived.building} />
        </main>
      </div>

      <RightRail
        open={railOpen}
        width={railWidth}
        title="Agent"
        onClose={() => setRailOpen(false)}
        onWidthChange={changeWidth}
        onResizingChange={setResizing}
      >
        <AgentChat messages={messages} isBusy={isBusy} onSend={send} onStop={agent.stop} />
      </RightRail>
    </>
  );
}

// The macOS artifact zone: the wallpapered .os-root stage hosting the rendered
// Window. Shows a skeleton until the first tree streams in.
function ArtifactStage({ tree, building }: { tree: UINode | null; building: boolean }) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  return (
    <div
      ref={stageRef}
      className="os-root relative flex h-full w-full items-center justify-center p-6 sm:p-10"
      style={{ minHeight: "inherit", background: "var(--os-wallpaper)" }}
    >
      {tree ? (
        <>
          <Render node={tree} />
          {building ? (
            <div className="text-label-xs absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 font-medium text-white backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Updating…
            </div>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 text-white/90">
          <div className="grid size-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <RiWindowLine className="size-7 animate-pulse" />
          </div>
          <div className="text-paragraph-sm font-medium">Designing your interface…</div>
        </div>
      )}
    </div>
  );
}
