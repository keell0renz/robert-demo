"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Dock, type DockApp } from "@/os/primitives/Dock";
import { WindowFrame } from "@/os/primitives/Window";
import { MenuBar, MENU_BAR_H } from "@/components/workspace/menu-bar";
import {
  DEFAULT_WALLPAPER_ID,
  WALLPAPER_STORAGE_KEY,
  wallpaperById,
} from "@/components/workspace/wallpapers";
import { deriveCodeApps } from "@/code/derive";
import { persistCodeChat } from "@/app/code/actions";
import { CodeAppWindow } from "./code-app-window";
import { CodeChat } from "./code-chat";

export type InitialCodeWorkspace = {
  sessionId: string;
  messages: unknown[] | null;
};

export type RecentCodePage = {
  id: string;
  title: string;
  prompt: string;
  updatedAt: Date;
};

type WinState = "open" | "minimized" | "closed";

// Path B's desktop — the twin of src/components/workspace/workspace.tsx. Same
// chrome (menu bar, wallpaper, windows, dock, Agent chat), but the engine is the
// Vercel AI SDK driving Claude to WRITE REACT, and each app window renders that
// React by compiling it in the browser (CodeAppWindow) instead of walking a JSON
// tree. The two desktops are deliberately identical so the only felt difference
// is what the AI produces.
export function CodeWorkspace({
  initialWorkspace,
  recentPages = [],
}: {
  initialWorkspace?: InitialCodeWorkspace | null;
  recentPages?: RecentCodePage[];
}) {
  // The workspace id is the durable identity + the /code/{id} URL. Restored from
  // a saved desktop, or minted fresh on first load.
  const [sessionId] = useState(
    () => initialWorkspace?.sessionId ?? crypto.randomUUID(),
  );

  // sessionId is stable for this component's life, so the transport (which sends
  // it in every request body so the tools know where to persist) is built once.
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/code", body: { sessionId } }),
    [sessionId],
  );

  const chat = useChat({
    transport,
    messages: (initialWorkspace?.messages ?? undefined) as never,
    onFinish: ({ messages }) => {
      void persistCodeChat(sessionId, messages as unknown[]);
    },
  });

  const messages = chat.messages;
  const isBusy = chat.status === "submitted" || chat.status === "streaming";
  const derived = useMemo(() => deriveCodeApps(messages), [messages]);
  const apps = derived.apps;

  const send = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message) return;
      void chat.sendMessage({ text: message });
    },
    [chat],
  );

  // Put the id in the URL in place (no navigation) so the workspace is reloadable.
  useEffect(() => {
    const target = `/code/${sessionId}`;
    if (window.location.pathname !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [sessionId]);

  // ── Window manager (identical to Path A) ──────────────────────────────────
  const [winState, setWinState] = useState<Record<string, WinState>>({ agent: "open" });
  const [focused, setFocused] = useState<string>("agent");
  const known = useRef<Set<string>>(new Set());

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
        setWinState((prev) => ({ ...prev, agent: prev.agent === "open" ? "closed" : "open" }));
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
    // Path B never generates image icons — the lettered tile is the icon, shown
    // immediately (no shimmer).
    iconUrl: null,
    expectIcon: false,
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
      <MenuBar
        appName={appName}
        wallpaperId={wallpaperId}
        onWallpaper={changeWallpaper}
        engine="react"
        newHref="/code"
      />

      <div
        onPointerDownCapture={onStagePointerDown}
        style={{ position: "absolute", top: MENU_BAR_H, left: 0, right: 0, bottom: 0 }}
      >
        {apps.map((app, i) => (
          <div key={app.key} data-window={app.key} style={{ display: "contents" }}>
            <CodeAppWindow
              title={app.title}
              code={app.code!}
              streaming={app.streaming}
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
            storageKey="agent-code"
            hidden={winState.agent !== "open"}
            onClose={() => setWindow("agent", "closed")}
            onMinimize={() => setWindow("agent", "minimized")}
            placement="right"
            defaultWidth={480}
            defaultHeight={660}
          >
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <CodeChat
                messages={messages}
                isBusy={isBusy}
                onSend={send}
                onStop={chat.stop}
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
            Writing code…
          </div>
        ) : null}

        <Dock onAgentClick={() => openWindow("agent")} agentRunning={winState.agent !== "closed"} apps={dockApps} />
      </div>
    </div>
  );
}
