"use client";

import { useState } from "react";
import {
  Compass, Mail, MessageCircle, Image as ImageIcon, MapPin, Calendar,
  Music, Settings, Terminal, NotebookPen, Camera, Phone, Trash2,
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

const TRASH: App = {
  name: "Trash", glyph: Trash2,
  grad: "linear-gradient(180deg,rgba(255,255,255,0.3),rgba(255,255,255,0.08))", fg: "#ffffff",
};

const SIZE = 50;   // fixed icon size — no magnification
const GAP = 12;    // breathing room between icons
const PAD_Y = 9;   // vertical glass padding — kept equal top & bottom

// PRIMITIVE: Dock — the liquid-glass shelf of app icons along the desktop floor.
// The glass (Layers 1–3) lives in the `.os-glass` CSS class. Each icon is a
// glossy squircle (gradient core + top sheen + inner rim + drop shadow) so the
// row reads like real, dimensional app icons rather than flat swatches.
export function Dock() {
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
        {APPS.map((app) => (
          <DockIcon key={app.name} app={app} />
        ))}

        {/* macOS divider before the "files/trash" section. */}
        <div
          style={{
            width: 0.5,
            alignSelf: "stretch",
            margin: "5px 3px",
            background: "var(--os-dock-border)",
          }}
        />
        <DockIcon app={TRASH} />
      </div>
    </div>
  );
}

function DockIcon({ app }: { app: App }) {
  const [hover, setHover] = useState(false);
  const Glyph = app.glyph;
  const fg = app.fg ?? "#ffffff";
  const radius = SIZE * 0.235;

  return (
    <div
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Depth: inner top sheen + bottom inner shadow + crisp drop shadow.
          boxShadow:
            "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 0 0 0.5px rgba(255,255,255,0.18), inset 0 -3px 6px rgba(0,0,0,0.18), 0 3px 7px rgba(0,0,0,0.28)",
        }}
      >
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
        <Glyph
          size={SIZE * 0.52}
          strokeWidth={app.fill ? 1.5 : 2.25}
          color={fg}
          fill={app.fill ? fg : "none"}
          style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.3))", position: "relative" }}
        />
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
