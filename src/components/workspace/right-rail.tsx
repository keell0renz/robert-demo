"use client";

import { useCallback } from "react";
import { RiSidebarFoldLine } from "@remixicon/react";
import { cn } from "@/lib/utils/cn";

export const RAIL_MIN = 360;
export const RAIL_MAX = 560;
export const RAIL_DEFAULT = 420;

// The collapsible right rail: a fixed full-height aside that slides on/off with
// translateX (customs-os's copilot pattern), with a drag handle on its left
// edge. The parent reserves space with padding-right so content is pushed, not
// overlaid.
export function RightRail({
  open,
  width,
  title,
  onClose,
  onWidthChange,
  onResizingChange,
  children,
}: {
  open: boolean;
  width: number;
  title: string;
  onClose: () => void;
  onWidthChange: (w: number) => void;
  onResizingChange: (resizing: boolean) => void;
  children: React.ReactNode;
}) {
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onResizingChange(true);
      const move = (ev: PointerEvent) => {
        const next = Math.min(RAIL_MAX, Math.max(RAIL_MIN, window.innerWidth - ev.clientX));
        onWidthChange(next);
      };
      const up = () => {
        onResizingChange(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [onWidthChange, onResizingChange],
  );

  return (
    <aside
      inert={!open || undefined}
      style={{ width }}
      className={cn(
        "bg-card border-border fixed inset-y-0 right-0 z-30 flex h-dvh flex-col border-l",
        "transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
    >
      <div
        onPointerDown={onPointerDown}
        className="hover:bg-border/80 absolute inset-y-0 -left-0.5 z-10 w-1 cursor-col-resize transition-colors"
        aria-hidden
      />
      <header className="border-border flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3">
        <div className="text-label-sm text-foreground flex items-center gap-2 truncate font-medium">
          <span className="bg-success-base inline-block size-1.5 shrink-0 rounded-full" />
          {title}
        </div>
        <button
          onClick={onClose}
          aria-label="Collapse panel"
          title="Collapse panel  ⌘I"
          className="text-foreground-soft hover:text-foreground hover:bg-muted inline-flex size-7 items-center justify-center rounded-lg transition-colors"
        >
          <RiSidebarFoldLine className="size-[18px]" />
        </button>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </aside>
  );
}
