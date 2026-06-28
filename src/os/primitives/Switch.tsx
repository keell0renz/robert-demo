"use client";

import { useState } from "react";

// PRIMITIVE: Switch — a macOS toggle, optionally labelled.
export function Switch({ label, on = false }: { label?: string; on?: boolean }) {
  const [active, setActive] = useState(on);
  const toggle = (
    <button
      role="switch"
      aria-checked={active}
      onClick={() => setActive((a) => !a)}
      style={{
        width: 38,
        height: 22,
        flexShrink: 0,
        borderRadius: "var(--os-radius-pill)",
        border: "none",
        padding: 0,
        cursor: "default",
        background: active ? "var(--os-green)" : "var(--os-fill-soft)",
        boxShadow: active ? "none" : "inset 0 0 0 1px var(--os-hairline)",
        transition: "background 150ms",
        position: "relative",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: active ? 18 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
          transition: "left 150ms",
        }}
      />
    </button>
  );
  if (!label) return toggle;
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", fontSize: 13, color: "var(--os-text)" }}>
      <span style={{ flex: 1 }}>{label}</span>
      {toggle}
    </label>
  );
}
