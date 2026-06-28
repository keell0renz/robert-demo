"use client";

import { createContext, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Render } from "../Render";
import type { UINode } from "../types";

// A page's content area + a navigation stack. Rows that carry a `detail` push a
// new frame onto the stack (System Settings drill-in); the back button pops it.
// This is what makes "openable" rows actually open something instead of being
// dead chevrons. Shared by NavShell's sidebar pages and standalone Content.
export type PushFn = (title: string | undefined, nodes: UINode[]) => void;
export const PageNavContext = createContext<PushFn | null>(null);

export function PageHost({ nodes }: { nodes: UINode[] }) {
  const [stack, setStack] = useState<{ title?: string; nodes: UINode[] }[]>([{ nodes }]);
  const push: PushFn = (title, next) => setStack((s) => [...s, { title, nodes: next }]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));

  const top = stack[stack.length - 1];
  const parentTitle = stack.length > 1 ? (stack[stack.length - 2].title ?? "Back") : undefined;

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: "var(--os-content-bg)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        padding: "10px 20px 20px",
        overflow: "auto",
      }}
    >
      {parentTitle !== undefined ? (
        <button
          onClick={back}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            alignSelf: "flex-start",
            border: "none",
            background: "transparent",
            color: "var(--os-accent)",
            cursor: "default",
            fontFamily: "var(--os-font)",
            fontSize: 13,
            fontWeight: 500,
            padding: 0,
          }}
        >
          <ChevronLeft size={18} strokeWidth={2.25} style={{ marginLeft: -5 }} />
          {parentTitle}
        </button>
      ) : null}
      {/* key on depth so each frame's controls mount fresh */}
      <PageNavContext.Provider value={push}>
        <div key={stack.length} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {top.nodes.map((node, i) => (
            <Render key={i} node={node} />
          ))}
        </div>
      </PageNavContext.Provider>
    </div>
  );
}
