"use client";

import { useState, type ReactNode } from "react";

// PRIMITIVE: Window — the frame + title bar with traffic lights baked in.
// Children lay out in a row (Sidebar + Content, or just Content).
export function Window({ title = "Untitled", children }: { title?: string; children?: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--os-window-bg)",
        borderRadius: "var(--os-radius-window)",
        boxShadow: "var(--os-shadow-window)",
        overflow: "hidden",
        width: 820,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TitleBar title={title} />
      <div style={{ display: "flex", flex: 1, minHeight: 420 }}>{children}</div>
    </div>
  );
}

function TitleBar({ title }: { title: string }) {
  const [hover, setHover] = useState(false);
  const lights = [
    { c: "var(--os-tl-red)", g: "×" },
    { c: "var(--os-tl-yellow)", g: "−" },
    { c: "var(--os-tl-green)", g: "+" },
  ];
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 38,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid var(--os-hairline)",
        position: "relative",
        background: "var(--os-window-bg)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {lights.map((l, i) => (
          <span
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: l.c,
              boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.2)",
              fontSize: 9,
              fontWeight: 700,
              lineHeight: "12px",
              textAlign: "center",
              color: hover ? "rgba(0,0,0,0.5)" : "transparent",
              cursor: "default",
              userSelect: "none",
            }}
          >
            {l.g}
          </span>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--os-text)",
          pointerEvents: "none",
        }}
      >
        {title}
      </div>
    </div>
  );
}
