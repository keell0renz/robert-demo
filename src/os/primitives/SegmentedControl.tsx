"use client";

import { useState } from "react";
import { Render } from "../Render";
import type { UINode } from "../types";

// PRIMITIVE: SegmentedControl — pick one of several options; the selected
// segment floats on a white pill (macOS style). When `panels` is supplied it
// becomes a real tab switcher: each option owns a panel of content, and picking
// a segment swaps the content shown below — not just a dead highlight.
export function SegmentedControl({
  options = [],
  selected = 0,
  panels,
}: {
  options?: string[];
  selected?: number;
  panels?: UINode[][];
}) {
  const [sel, setSel] = useState(selected);

  const control = (
    <div
      style={{
        display: "inline-flex",
        height: 28,
        padding: 2,
        gap: 2,
        background: "var(--os-fill-soft)",
        borderRadius: "var(--os-radius-control)",
        alignSelf: "flex-start",
      }}
    >
      {options.map((opt, i) => {
        const active = sel === i;
        return (
          <button
            key={i}
            onClick={() => setSel(i)}
            style={{
              minWidth: 40,
              padding: "0 12px",
              border: "none",
              borderRadius: 4,
              fontFamily: "var(--os-font)",
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              color: "var(--os-text)",
              cursor: "default",
              background: active ? "var(--os-control-bg)" : "transparent",
              boxShadow: active ? "0 0.5px 1.5px rgba(0,0,0,0.16)" : "none",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );

  if (!panels || panels.length === 0) return control;

  // Tabbed mode: control on top, the selected option's panel below. `key={sel}`
  // resets panel controls when switching tabs (a fresh view each time).
  const panel = panels[sel] ?? [];
  return (
    <div style={{ display: "flex", width: "100%", flexDirection: "column", gap: 16 }}>
      {control}
      <div key={sel} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {panel.map((node, i) => (
          <Render key={i} node={node} />
        ))}
      </div>
    </div>
  );
}
