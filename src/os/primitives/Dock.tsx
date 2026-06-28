"use client";

import { useEffect, useRef, useState } from "react";
import {
  Compass, Mail, MessageCircle, Image as ImageIcon, MapPin, Calendar,
  Music, Settings, Terminal, NotebookPen, Camera, Phone, Sparkles,
  type LucideIcon,
} from "lucide-react";

// A mock macOS dock app. `grad` is the squircle's background; `glyph` is the
// icon on top (white unless `fg` overrides for white/two-tone tiles like
// Calendar). `fill` draws the glyph solid (bubbles, handsets) for a bolder,
// more app-icon-like weight. `dot` marks it "running" (indicator beneath).
type App = {
  name: string;
  glyph: LucideIcon;
  grad: string;
  fg?: string;
  fill?: boolean;
  dot?: boolean;
  // When set, the tile shows this character instead of the glyph (the fallback
  // before/while a real icon is generated).
  letter?: string;
  // A generated icon image to show on the tile (falls back to letter/glyph on
  // error or while missing).
  iconUrl?: string | null;
  // Whether a real icon is expected (and therefore the tile should shimmer while
  // it's still missing). Path A sets this implicitly (an icon is generated after
  // the app). Path B never makes image icons, so it shows the letter at once.
  expectIcon?: boolean;
};

// macOS-ish app set. Gradients are multi-stop and vivid so each tile reads with
// depth (top-lit, saturated core) rather than as a flat swatch.
const APPS: App[] = [
  { name: "Finder", glyph: Compass, grad: "linear-gradient(180deg,#4db5ff 0%,#1c7fff 50%,#0a5ce0 100%)", dot: true },
  { name: "Safari", glyph: Compass, grad: "linear-gradient(180deg,#f4fbff 0%,#cfeaff 55%,#a9d6ff 100%)", fg: "#1c7fff" },
  { name: "Messages", glyph: MessageCircle, grad: "linear-gradient(180deg,#67f07f 0%,#34d24a 55%,#13b531 100%)", fill: true, dot: true },
  { name: "Mail", glyph: Mail, grad: "linear-gradient(180deg,#54bdff 0%,#2a86ff 55%,#1466ff 100%)" },
  { name: "Photos", glyph: ImageIcon, grad: "conic-gradient(from 215deg,#ff5f6d,#ffc371,#3ad29f,#5b8def,#c86bff,#ff5f6d)", fg: "#ffffff" },
  { name: "Maps", glyph: MapPin, grad: "linear-gradient(180deg,#8ee08c 0%,#56bd5e 55%,#33a046 100%)", fill: true },
  { name: "Calendar", glyph: Calendar, grad: "linear-gradient(180deg,#ffffff 0%,#f2f2f4 100%)", fg: "#ff3b30" },
  { name: "Notes", glyph: NotebookPen, grad: "linear-gradient(180deg,#fff3a8 0%,#ffe04d 55%,#ffcf24 100%)", fg: "#7a5a00" },
  { name: "Camera", glyph: Camera, grad: "linear-gradient(180deg,#65656b 0%,#3a3a40 55%,#1e1e22 100%)" },
  { name: "Phone", glyph: Phone, grad: "linear-gradient(180deg,#67f07f 0%,#34d24a 55%,#13b531 100%)", fill: true },
  { name: "Music", glyph: Music, grad: "linear-gradient(180deg,#ff7a90 0%,#fb3d5e 55%,#e60a3c 100%)", fill: true, dot: true },
  { name: "Terminal", glyph: Terminal, grad: "linear-gradient(180deg,#3c3c42 0%,#222226 55%,#0e0e10 100%)" },
  { name: "Settings", glyph: Settings, grad: "linear-gradient(180deg,#e2e4e8 0%,#b9bdc4 55%,#9298a1 100%)", fg: "#5b6068" },
];

// The Agent — the ONE real app on this desktop. Uses a generated logo (with the
// indigo squircle as fallback if the asset is missing) so it sits in line with
// the AI-generated app icons.
const AGENT: App = {
  name: "Agent", glyph: Sparkles,
  grad: "linear-gradient(180deg,#a78bfa 0%,#7c5cff 55%,#5b34e0 100%)", fill: true,
  iconUrl: "/agent-icon.png",
};

const SIZE = 50;   // fixed icon size — no magnification
const GAP = 12;    // breathing room between icons
const PAD_Y = 9;   // vertical glass padding — kept equal top & bottom

// One generated app on the desktop, as the dock sees it.
export type DockApp = {
  key: string;
  letter: string;
  title: string;
  running: boolean;
  onClick: () => void;
  iconUrl?: string | null;
  // See App.expectIcon — defaults to true so existing (Path A) callers are
  // unchanged; the React demo passes false to skip the icon shimmer.
  expectIcon?: boolean;
};

// Vivid macOS-y tile gradients. We can't generate real icons yet, so each app is
// a lettered squircle; the colour is picked from its letter so the same app
// keeps the same hue and adjacent apps differ.
const LETTER_GRADS = [
  "linear-gradient(180deg,#5ac8fa 0%,#0a84ff 100%)",
  "linear-gradient(180deg,#ff9f0a 0%,#ff6a00 100%)",
  "linear-gradient(180deg,#5ee084 0%,#13b531 100%)",
  "linear-gradient(180deg,#ff6f91 0%,#ff2d55 100%)",
  "linear-gradient(180deg,#bf5af2 0%,#7c3aed 100%)",
  "linear-gradient(180deg,#64d2ff 0%,#0aa5c2 100%)",
  "linear-gradient(180deg,#ffd60a 0%,#ff9f0a 100%)",
  "linear-gradient(180deg,#a2845e 0%,#6f5440 100%)",
];

function gradForLetter(letter: string): string {
  const c = letter.toUpperCase().charCodeAt(0) || 65;
  return LETTER_GRADS[c % LETTER_GRADS.length];
}

// PRIMITIVE: Dock — the liquid-glass shelf of app icons along the desktop floor.
// The glass (Layers 1–3) lives in the `.os-glass` CSS class. Each icon is a
// glossy squircle (gradient core + top sheen + inner rim + drop shadow) so the
// row reads like real, dimensional app icons rather than flat swatches.
export function Dock({
  onAgentClick,
  agentRunning,
  apps = [],
}: {
  // When provided, the Agent tile is shown as the live, clickable app (leftmost,
  // set apart by a divider). Omitted (e.g. the static /demo desktop) → no Agent.
  onAgentClick?: () => void;
  agentRunning?: boolean;
  // The generated apps to show between Agent and Trash (lettered icons).
  apps?: DockApp[];
} = {}) {
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 12,
        transform: "translateX(-50%)",
        zIndex: 40,
      }}
    >
      <div
        className="os-glass"
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: GAP,
          // Equal vertical padding — icon sits with matched space above & below.
          padding: `${PAD_Y}px 10px`,
          borderRadius: 24,
        }}
      >
        {onAgentClick ? (
          // Workspace dock: the Agent (the one real app), then a lettered tile
          // per generated app, then the trash.
          <>
            <DockIcon app={{ ...AGENT, dot: agentRunning }} onClick={onAgentClick} />
            {apps.length > 0 ? <Divider /> : null}
            {apps.map((app) => (
              <DockIcon
                key={app.key}
                app={{
                  name: app.title,
                  glyph: Sparkles, // unused — letter/icon takes over
                  grad: gradForLetter(app.letter),
                  letter: app.letter.toUpperCase(),
                  iconUrl: app.iconUrl,
                  expectIcon: app.expectIcon,
                  fg: "#ffffff",
                  dot: app.running,
                }}
                onClick={app.onClick}
              />
            ))}
          </>
        ) : (
          // Static /demo desktop: the full decorative set.
          APPS.map((app) => <DockIcon key={app.name} app={app} />)
        )}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 0.5,
        alignSelf: "stretch",
        margin: "5px 3px",
        background: "var(--os-dock-border)",
      }}
    />
  );
}

function DockIcon({ app, onClick }: { app: App; onClick?: () => void }) {
  const [hover, setHover] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  // A new icon URL (first generation, or a regeneration) is a fresh attempt —
  // clear the previous error. For `loaded`: if the image is ALREADY cached and
  // complete (the usual case after a reload), the browser fires no onLoad event,
  // so detect completeness directly — otherwise the skeleton would stick forever.
  /* eslint-disable react-hooks/set-state-in-effect -- reset/sync on iconUrl change */
  useEffect(() => {
    setImgError(false);
    const el = imgRef.current;
    setImgLoaded(Boolean(el && el.complete && el.naturalWidth > 0));
  }, [app.iconUrl]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const Glyph = app.glyph;
  const fg = app.fg ?? "#ffffff";
  const radius = SIZE * 0.235;
  const showImg = Boolean(app.iconUrl) && !imgError;
  const iconReady = showImg && imgLoaded;
  // A generated app (it has a letter) shows a skeleton shimmer until its icon is
  // actually visible — while it's being generated, and while the image loads.
  // Apps that never make an image icon (`expectIcon: false`) skip straight to
  // the letter instead of shimmering forever.
  const expectIcon = app.expectIcon ?? true;
  const showSkeleton = expectIcon && Boolean(app.letter) && !iconReady && !imgError;

  return (
    <div
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        position: "relative",
        // The flex item is exactly one icon tall (dot is absolute), so flex-end +
        // equal padding yields matched whitespace above and below the squircle.
        width: SIZE,
        height: SIZE,
        cursor: "pointer",
      }}
    >
      {/* Name label on hover. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: "calc(100% + 12px)",
          transform: `translateX(-50%) translateY(${hover ? 0 : 4}px)`,
          whiteSpace: "nowrap",
          padding: "3px 9px",
          borderRadius: 7,
          fontSize: 12,
          fontWeight: 500,
          color: "var(--os-text)",
          background: "var(--os-surface-glass)",
          backdropFilter: "var(--os-glass-blur)",
          WebkitBackdropFilter: "var(--os-glass-blur)",
          border: "0.5px solid var(--os-hairline)",
          boxShadow: "var(--os-shadow-floating)",
          pointerEvents: "none",
          opacity: hover ? 1 : 0,
          transition: "opacity 140ms ease, transform 140ms ease",
        }}
      >
        {app.name}
      </div>

      {/* The squircle. */}
      <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            background: app.grad,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // Depth: inner top sheen + bottom inner shadow + crisp drop shadow.
            boxShadow:
              "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.18), 0 3px 7px rgba(0,0,0,0.28)",
          }}
        >
          {/* Generated icon image, filling the tile, clipped to the squircle. */}
          {showImg ? (
            // eslint-disable-next-line @next/next/no-img-element -- data/api PNG, not a Next asset
            <img
              ref={imgRef}
              src={app.iconUrl ?? undefined}
              alt={app.name}
              width={SIZE}
              height={SIZE}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}

          {/* Skeleton shimmer while a generated app's icon is being made/loaded. */}
          {showSkeleton ? <div className="os-icon-skeleton" /> : null}

          {/* Glossy top-half highlight — the convex sheen real icons carry. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: radius,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0) 56%)",
              pointerEvents: "none",
            }}
          />

          {/* Letter only as a last resort if a real icon failed to load. A
              decorative app (no letter) falls back to its glyph. */}
          {app.letter && imgError ? (
            <span
              style={{
                position: "relative",
                fontSize: SIZE * 0.5,
                fontWeight: 600,
                color: fg,
                fontFamily: "var(--os-font)",
                lineHeight: 1,
                textShadow: "0 1px 1.5px rgba(0,0,0,0.3)",
              }}
            >
              {app.letter}
            </span>
          ) : !app.letter && !showImg ? (
            <Glyph
              size={SIZE * 0.52}
              strokeWidth={app.fill ? 1.5 : 2.25}
              color={fg}
              fill={app.fill ? fg : "none"}
              style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.3))", position: "relative" }}
            />
          ) : null}
        </div>

      {/* Running indicator — pinned in the bottom padding band. */}
      {app.dot && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "calc(100% + 3px)",
            transform: "translateX(-50%)",
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "var(--os-text-secondary)",
          }}
        />
      )}
    </div>
  );
}
