"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useTheme } from "next-themes";
import {
  RiAppleFill,
  RiAddLine,
  RiImageLine,
  RiMoonLine,
  RiSunLine,
} from "@remixicon/react";
import { WallpaperModal } from "./wallpaper-picker";

// The macOS menu bar: the thin translucent strip pinned to the top of the
// desktop. Left = Apple menu + the focused app's name (bold) + faux app menus.
// Right = the workspace controls reframed as menu-bar extras (New, Background,
// theme) and a live clock. Styled entirely with `--os-*` tokens so it reads
// correctly over any wallpaper in both light and dark.
export const MENU_BAR_H = 28;

// The decorative app menus next to the bold app name — non-functional, pure
// macOS texture.
const APP_MENUS = ["File", "Edit", "View", "Window", "Help"];

export function MenuBar({
  appName,
  wallpaperId,
  onWallpaper,
  engine = "json",
  newHref = "/",
}: {
  appName: string;
  wallpaperId: string;
  onWallpaper: (id: string) => void;
  // Which generation engine this desktop runs. Drives the "New" target and the
  // JSON⇄React switcher pill. Defaults keep the original (Path A) desktop intact.
  engine?: "json" | "react";
  newHref?: string;
}) {
  const [bgOpen, setBgOpen] = useState(false);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: MENU_BAR_H,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        background: "var(--os-surface-glass)",
        backdropFilter: "var(--os-glass-blur)",
        WebkitBackdropFilter: "var(--os-glass-blur)",
        borderBottom: "0.5px solid var(--os-hairline)",
        color: "var(--os-text)",
        fontSize: 13,
        userSelect: "none",
      }}
    >
      {/* Left: Apple menu, the focused app's name, then its (faux) menus. */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
        <MenuButton aria-label="Apple menu">
          <RiAppleFill size={15} style={{ display: "block" }} />
        </MenuButton>
        <MenuButton style={{ fontWeight: 600 }}>{appName}</MenuButton>
        {APP_MENUS.map((m) => (
          <MenuButton key={m} className="hide-cramped">
            {m}
          </MenuButton>
        ))}
      </div>

      {/* Right: workspace controls as menu-bar extras + the clock. */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <EngineSwitch engine={engine} />
        <div style={{ width: 0.5, height: 14, margin: "0 4px", background: "var(--os-hairline)" }} />
        <MenuButton onClick={() => window.location.assign(newHref)}>
          <RiAddLine size={14} style={{ marginRight: 4 }} />
          New
        </MenuButton>
        <MenuButton onClick={() => setBgOpen(true)}>
          <RiImageLine size={14} style={{ marginRight: 4 }} />
          Background
        </MenuButton>
        <ThemeExtra />
        <div style={{ width: 0.5, height: 14, margin: "0 4px", background: "var(--os-hairline)" }} />
        <Clock />
      </div>

      {bgOpen ? (
        <WallpaperModal
          selectedId={wallpaperId}
          onSelect={onWallpaper}
          onClose={() => setBgOpen(false)}
        />
      ) : null}
    </div>
  );
}

// The JSON⇄React engine switcher — the one control that ties the two demos
// together. A tiny segmented pill in the menu bar; the inactive half is a link
// to the other desktop. This is what makes the two versions read as "side by
// side": you flip between the spec-driven and the code-driven engine in place.
function EngineSwitch({ engine }: { engine: "json" | "react" }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        padding: 1,
        borderRadius: 7,
        background: "var(--os-fill-soft)",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <EngineSeg label="JSON" href="/" active={engine === "json"} />
      <EngineSeg label="React" href="/code" active={engine === "react"} />
    </div>
  );
}

function EngineSeg({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a
      href={active ? undefined : href}
      title={
        label === "JSON"
          ? "Spec engine: AI emits a closed JSON vocabulary, rendered by a safe interpreter"
          : "Code engine: AI writes real React, compiled & evaluated in your browser"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 16,
        padding: "0 8px",
        borderRadius: 6,
        textDecoration: "none",
        cursor: active ? "default" : "pointer",
        color: active ? "var(--os-text)" : "var(--os-text-secondary)",
        background: active ? "var(--os-control-bg)" : "transparent",
        boxShadow: active ? "var(--os-shadow-button)" : "none",
      }}
    >
      {label}
    </a>
  );
}

// A menu-bar item: flush text/icon with a rounded hover fill, matching macOS.
function MenuButton({
  children,
  onClick,
  style,
  className,
  ...rest
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
} & React.HTMLAttributes<HTMLButtonElement>) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 20,
        padding: "0 8px",
        borderRadius: 6,
        border: "none",
        background: hover ? "var(--os-fill-soft)" : "transparent",
        color: "inherit",
        fontSize: 13,
        lineHeight: 1,
        cursor: "default",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// Light/dark switch, rendered as an icon-only menu extra. Mount guard avoids an
// SSR icon mismatch.
function ThemeExtra() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount guard
  useEffect(() => setMounted(true), []);
  const isDark = resolvedTheme === "dark";
  return (
    <MenuButton onClick={() => setTheme(isDark ? "light" : "dark")} aria-label="Toggle theme">
      {mounted && isDark ? <RiSunLine size={15} /> : <RiMoonLine size={15} />}
    </MenuButton>
  );
}

// The live menu-bar clock — "Sat Jun 28  9:41 AM". Ticks once a minute. Renders
// nothing until mounted so server and client markup agree.
function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start ticking on mount
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const label = now
    ? `${now.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}  ${now.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "";

  return (
    <span style={{ padding: "0 6px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", minWidth: 132, textAlign: "right" }}>
      {label}
    </span>
  );
}
