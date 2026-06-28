"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useEveAgent } from "eve/react";
import { Render, type UINode } from "@/os";
import { Dock } from "@/os/primitives/Dock";
import { WindowFrame } from "@/os/primitives/Window";
import { persistChat } from "@/app/actions";
import { AgentChat } from "./agent-chat";
import { deriveArtifact } from "./derive";
import { MenuBar, MENU_BAR_H } from "./menu-bar";
import {
  DEFAULT_WALLPAPER_ID,
  WALLPAPER_STORAGE_KEY,
  wallpaperById,
} from "./wallpapers";

export type InitialPage = {
  id: string;
  title: string;
  tree: UINode;
  chatEvents: unknown[] | null;
  chatSession: Record<string, unknown> | null;
};

export type RecentPage = {
  id: string;
  title: string;
  prompt: string;
  updatedAt: Date;
};

// The whole page IS a macOS desktop. A translucent menu bar on top; a wallpapered
// stage hosting the generated artifact window AND the Agent app window; a dock
// along the floor. The Agent is the one *real* app — its dock icon opens/closes a
// genuine macOS window whose chat composes everything else on the desktop.
export function Workspace({
  initialPage,
  recentPages = [],
}: {
  initialPage?: InitialPage | null;
  recentPages?: RecentPage[];
}) {
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
  const hasTree = Boolean(tree);
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

  // ── Background ────────────────────────────────────────────────────────────
  const [wallpaperId, setWallpaperId] = useState(DEFAULT_WALLPAPER_ID);
  useEffect(() => {
    const saved = window.localStorage.getItem(WALLPAPER_STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore persisted choice on mount (SSR-safe)
    if (saved) setWallpaperId(saved);
  }, []);
  const changeWallpaper = useCallback((id: string) => {
    setWallpaperId(id);
    window.localStorage.setItem(WALLPAPER_STORAGE_KEY, id);
  }, []);
  const wallpaper = wallpaperById(wallpaperId);

  // ── Agent app window ──────────────────────────────────────────────────────
  // Boots open (it's the entry point). Closing it (red light / dock click) only
  // hides the window — the chat state lives here and persists.
  const [agentOpen, setAgentOpen] = useState(true);
  const toggleAgent = useCallback(() => setAgentOpen((o) => !o), []);

  // ⌘I still toggles the Agent app, matching the old panel shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setAgentOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Focus (drives the menu-bar app name) ──────────────────────────────────
  // Boot focused on the Agent; once an artifact exists, the generated app takes
  // the menu bar (its title), the way the frontmost app does on macOS.
  const [focused, setFocused] = useState<"agent" | "artifact">("agent");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- raise the artifact when it first appears
    if (hasTree) setFocused("artifact");
  }, [hasTree]);

  const onStagePointerDown = useCallback((e: React.PointerEvent) => {
    const win = (e.target as HTMLElement).closest("[data-window]") as HTMLElement | null;
    if (win?.dataset.window === "agent") setFocused("agent");
    else if (win?.dataset.window === "artifact") setFocused("artifact");
  }, []);

  const appName = focused === "artifact" && hasTree ? title : "Agent";

  return (
    <div
      className="os-root"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        backgroundImage: wallpaper.background,
        backgroundSize: "cover",
        backgroundPosition: "center",
        transition: "background-image 200ms ease",
      }}
    >
      <MenuBar appName={appName} wallpaperId={wallpaperId} onWallpaper={changeWallpaper} />

      {/* The desktop stage — positioned, so it's the containing block every
          window measures and drags within. */}
      <div
        onPointerDownCapture={onStagePointerDown}
        style={{ position: "absolute", top: MENU_BAR_H, left: 0, right: 0, bottom: 0 }}
      >
        {/* Artifact layer: a full-stage positioned context so the generated
            window's resize handles stay confined BELOW the Agent app (z 30). */}
        {tree ? (
          <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
            <div data-window="artifact" style={{ display: "contents" }}>
              <Render node={tree} />
            </div>
          </div>
        ) : null}

        {/* The Agent app — a real, draggable, closable macOS window floating
            above the artifact. Kept mounted (geometry persists) and hidden when
            closed. */}
        <div data-window="agent" style={{ display: "contents" }}>
          <WindowFrame
            title="Agent"
            z={30}
            hidden={!agentOpen}
            onClose={() => setAgentOpen(false)}
            placement="right"
            defaultWidth={480}
            defaultHeight={660}
          >
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <AgentChat
                messages={messages}
                isBusy={isBusy}
                onSend={send}
                onStop={agent.stop}
                recentPages={recentPages}
              />
            </div>
          </WindowFrame>
        </div>

        {derived.building ? (
          <div
            className="text-label-xs"
            style={{
              position: "absolute",
              right: 14,
              top: 12,
              zIndex: 45,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 999,
              background: "rgba(0,0,0,0.4)",
              padding: "4px 10px",
              fontWeight: 500,
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} className="animate-pulse" />
            Updating…
          </div>
        ) : null}

        <Dock onAgentClick={toggleAgent} agentRunning={agentOpen} />
      </div>
    </div>
  );
}
