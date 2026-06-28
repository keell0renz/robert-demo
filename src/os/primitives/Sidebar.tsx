"use client";

import { useState } from "react";
import { Icon } from "./icons";
import type { IconName } from "../schema";

type Item = { label: string; icon?: IconName };

// PRIMITIVE: Sidebar — source list with vibrancy + a selection pill. Selection
// is internal by default; pass `onSelect` to make it controlled (NavShell does
// this so clicking an item navigates to that item's page).
export function Sidebar({
  items = [],
  selected = 0,
  onSelect,
}: {
  items?: Item[];
  selected?: number;
  onSelect?: (index: number) => void;
}) {
  const [internal, setInternal] = useState(selected);
  const sel = onSelect ? selected : internal;
  const pick = (i: number) => (onSelect ? onSelect(i) : setInternal(i));
  return (
    <div
      style={{
        width: 200,
        flexShrink: 0,
        background: "var(--os-surface-glass)",
        backdropFilter: "var(--os-glass-blur)",
        WebkitBackdropFilter: "var(--os-glass-blur)",
        borderRight: "1px solid var(--os-hairline)",
        padding: 8,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {items.map((it, i) => {
        const active = sel === i;
        return (
          <div
            key={i}
            onClick={() => pick(i)}
            style={{
              height: 28,
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 10px",
              borderRadius: "var(--os-radius-control)",
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              cursor: "default",
              color: active ? "var(--os-accent-text)" : "var(--os-text)",
              background: active ? "var(--os-accent)" : "transparent",
            }}
          >
            {it.icon ? (
              <span style={{ display: "flex", opacity: active ? 1 : 0.7 }}>
                <Icon name={it.icon} size={15} />
              </span>
            ) : null}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {it.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
