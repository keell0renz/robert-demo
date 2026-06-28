"use client";

import { WindowFrame } from "./primitives/Window";
import { NavBody } from "./primitives/NavShell";
import { Render } from "./Render";
import type { UINode } from "./types";

// Frame controls the desktop's window manager owns (the agent's tree only
// supplies the body + title).
type FrameControls = {
  z?: number;
  hidden?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  placement?: "center" | "right";
  defaultWidth?: number;
  defaultHeight?: number;
  offset?: number;
  storageKey?: string;
};

// A generated app rendered into a manager-owned window. Same Window-shape logic
// as the renderer (NavShell for a sidebar-with-pages app, otherwise the row of
// Content/Sidebar), but the chrome is a WindowFrame the manager controls, so the
// traffic lights, stacking, and placement are real.
export function AppWindow({ tree, ...frame }: { tree: UINode } & FrameControls) {
  const title = (tree.props?.title as string | undefined) ?? "Untitled";
  const children = tree.children ?? [];
  const sidebar = children.find((c) => c?.type === "Sidebar");
  const hasPages = (
    sidebar?.props?.items as Array<{ page?: unknown[] }> | undefined
  )?.some((it) => Array.isArray(it?.page) && it.page.length > 0);

  return (
    <WindowFrame title={title} {...frame}>
      {sidebar && hasPages ? (
        <NavBody sidebar={sidebar} />
      ) : (
        children.map((child, i) => <Render key={i} node={child} />)
      )}
    </WindowFrame>
  );
}
