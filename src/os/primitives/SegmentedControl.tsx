"use client";

import { useState } from "react";

// PRIMITIVE: SegmentedControl — pick one of several options; the selected
// segment floats on a white pill (macOS style).
export function SegmentedControl({
  options = [],
  selected = 0,
}: {
  options?: string[];
  selected?: number;
}) {
  const [sel, setSel] = useState(selected);
  return (
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
}
