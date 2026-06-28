"use client";

import { useState } from "react";
import type { UINode } from "../types";
import type { IconName } from "../schema";
import { WindowFrame } from "./Window";
import { Sidebar } from "./Sidebar";
import { PageHost } from "./PageHost";

type NavItem = { label?: string; icon?: IconName; page?: UINode[] };

// The navigation-aware window. Used when a Window's Sidebar has items that each
// carry a `page`. It owns the selected index (the single source of truth),
// drives the Sidebar highlight, and renders the selected item's page — so the
// sidebar finally *navigates* instead of just highlighting. State is reset per
// page (`key={sel}`) so each page's controls start fresh.
export function NavShell({ title, sidebar }: { title?: string; sidebar: UINode }) {
  return (
    <WindowFrame title={title}>
      <NavBody sidebar={sidebar} />
    </WindowFrame>
  );
}

// The navigation body WITHOUT the window frame — the Sidebar + the selected
// page. Split out so the desktop's window manager can wrap it in a frame it owns
// (close/minimize/z/position) while keeping the exact same nav behaviour.
export function NavBody({ sidebar }: { sidebar: UINode }) {
  const items = (sidebar.props?.items as NavItem[] | undefined) ?? [];
  const initial = Number(sidebar.props?.selected ?? 0);
  const clamp = (n: number) => Math.min(Math.max(0, n), Math.max(0, items.length - 1));
  const [sel, setSel] = useState(clamp(initial));

  const current = items[sel];
  const page = current?.page;

  return (
    <>
      <Sidebar
        items={items.map((it) => ({ label: it.label ?? "", icon: it.icon }))}
        selected={sel}
        onSelect={(i) => setSel(clamp(i))}
      />
      {page && page.length > 0 ? (
        <PageHost key={sel} nodes={page} />
      ) : (
        <EmptyPage label={current?.label} />
      )}
    </>
  );
}

// Graceful fallback so an item without a page never renders a blank pane.
function EmptyPage({ label }: { label?: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: "var(--os-content-bg)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div style={{ fontSize: 13, color: "var(--os-text-secondary)" }}>
        {label ? `“${label}” has no content yet.` : "Nothing here yet."}
      </div>
    </div>
  );
}
