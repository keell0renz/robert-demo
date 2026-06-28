"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEveAgent } from "eve/react";
import { AppWindow } from "@/os";
import { Dock, type DockApp } from "@/os/primitives/Dock";
import { WindowFrame } from "@/os/primitives/Window";
import { persistChat } from "@/app/actions";
import { AgentChat } from "./agent-chat";
import { deriveApps } from "./derive";
import { MenuBar, MENU_BAR_H } from "./menu-bar";
import {
  DEFAULT_WALLPAPER_ID,
  WALLPAPER_STORAGE_KEY,
  wallpaperById,
} from "./wallpapers";

export type InitialWorkspace = {
  sessionId: string;
  chatEvents: unknown[] | null;
  chatSession: Record<string, unknown> | null;
};

export type RecentPage = {
  id: string;
  title: string;
  prompt: string;
  updatedAt: Date;
};

// A window can be on the desktop, minimized to the dock, or closed. The app/chat
// state survives all three — only the window's visibility changes.
type WinState = "open" | "minimized" | "closed";

// The desktop is the whole page. A translucent menu bar on top; a wallpapered
// stage hosting many app windows + the Agent app window; a dock with the Agent
// and one lettered icon per generated app. The Agent's chat composes everything
// else: its create/update/delete tools add and revise the app windows live.
export function Workspace({
  initialWorkspace,
  recentPages = [],
}: {
  initialWorkspace?: InitialWorkspace | null;
  recentPages?: RecentPage[];
}) {
  const agent = useEveAgent({
    initialEvents: (initialWorkspace?.chatEvents ?? undefined) as never,
    initialSession: (initialWorkspace?.chatSession ?? undefined) as never,
    onFinish: (snapshot) => {
      const sid = snapshot.session?.sessionId ?? initialWorkspace?.sessionId ?? null;
      if (!sid) return;
      void persistChat(sid, {
        events: snapshot.events as unknown[],
        session: (snapshot.session ?? null) as unknown as Record<string, unknown> | null,
      });
    },
  });

  const messages = agent.data.messages;
  const isBusy = agent.status === "submitted" || agent.status === "streaming";
  const derived = useMemo(() => deriveApps(messages), [messages]);
  const apps = derived.apps;

  const send = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message) return;
      void agent.send({ message });
    },
    [agent],
  );

  // Once the session id is known, put it in the URL in place (no navigation) so
  // the workspace is reloadable.
  const sessionId = agent.session?.sessionId ?? initialWorkspace?.sessionId ?? null;
  useEffect(() => {
    if (!sessionId) return;
    const target = `/${sessionId}`;
    if (window.location.pathname !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [sessionId]);

  // ── Window manager ────────────────────────────────────────────────────────
  // Per-window visibility, keyed by app key (and "agent"). Focus drives stacking
  // and the menu-bar app name.
  const [winState, setWinState] = useState<Record<string, WinState>>({ agent: "open" });
  const [focused, setFocused] = useState<string>("agent");
  const known = useRef<Set<string>>(new Set());

  // Auto-open (and focus) apps the moment they first appear in the stream.
  useEffect(() => {
    const fresh = apps.filter((a) => !known.current.has(a.key));
    if (fresh.length === 0) return;
    fresh.forEach((a) => known.current.add(a.key));
    setWinState((prev) => {
      const next = { ...prev };
      fresh.forEach((a) => {
        next[a.key] = "open";
      });
      return next;
    });
    setFocused(fresh[fresh.length - 1].key);
  }, [apps]);

  const openWindow = useCallback((key: string) => {
    setWinState((prev) => ({ ...prev, [key]: "open" }));
    setFocused(key);
  }, []);
  const setWindow = useCallback((key: string, state: WinState) => {
    setWinState((prev) => ({ ...prev, [key]: state }));
  }, []);

  // ⌘I toggles the Agent app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setWinState((prev) => ({
          ...prev,
          agent: prev.agent === "open" ? "closed" : "open",
        }));
        setFocused("agent");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onStagePointerDown = useCallback((e: React.PointerEvent) => {
    const win = (e.target as HTMLElement).closest("[data-window]") as HTMLElement | null;
    if (win?.dataset.window) setFocused(win.dataset.window);
  }, []);

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

  const z = (key: string) => (focused === key ? 30 : 20);
  const focusedApp = apps.find((a) => a.key === focused);
  const appName = focused === "agent" ? "Agent" : (focusedApp?.title ?? "Finder");

  const dockApps: DockApp[] = apps.map((a) => ({
    key: a.key,
    letter: a.letter,
    title: a.title,
    running: winState[a.key] === "open" || winState[a.key] === "minimized",
    onClick: () => openWindow(a.key),
  }));

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

      <div
        onPointerDownCapture={onStagePointerDown}
        style={{ position: "absolute", top: MENU_BAR_H, left: 0, right: 0, bottom: 0 }}
      >
        {apps.map((app, i) => (
          <div key={app.key} data-window={app.key} style={{ display: "contents" }}>
            <AppWindow
              tree={app.tree!}
              z={z(app.key)}
              offset={i + 1}
              storageKey={app.id ?? app.key}
              hidden={winState[app.key] !== "open"}
              onClose={() => setWindow(app.key, "closed")}
              onMinimize={() => setWindow(app.key, "minimized")}
            />
          </div>
        ))}

        <div data-window="agent" style={{ display: "contents" }}>
          <WindowFrame
            title="Agent"
            z={z("agent")}
            storageKey="agent"
            hidden={winState.agent !== "open"}
            onClose={() => setWindow("agent", "closed")}
            onMinimize={() => setWindow("agent", "minimized")}
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

        {derived.buildingKey ? (
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
            Designing…
          </div>
        ) : null}

        <Dock onAgentClick={() => openWindow("agent")} agentRunning={winState.agent !== "closed"} apps={dockApps} />
      </div>
    </div>
  );
}
