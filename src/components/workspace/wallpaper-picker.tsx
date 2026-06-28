"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RiImageLine, RiCloseLine, RiCheckLine } from "@remixicon/react";
import { WALLPAPERS, type Wallpaper } from "./wallpapers";

// The "Background" top-bar button + the large picker modal. Clicking a tile
// applies the wallpaper live (so the change is visible behind the modal) and
// the parent persists it.
export function BackgroundButton({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Choose a background"
        className="text-label-xs text-muted-foreground hover:text-foreground hover:bg-muted inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 transition-colors"
      >
        <RiImageLine className="size-3.5" /> Background
      </button>
      {open ? (
        <WallpaperModal
          selectedId={selectedId}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

function WallpaperModal({
  selectedId,
  onSelect,
  onClose,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- portal needs the DOM
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose a background"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-border flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
      >
        <header className="border-border flex shrink-0 items-center justify-between border-b px-5 py-3.5">
          <div>
            <div className="text-label-md text-foreground font-semibold">Background</div>
            <div className="text-label-xs text-muted-foreground mt-0.5">
              Choose a wallpaper for the design space.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-foreground-soft hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg transition-colors"
          >
            <RiCloseLine className="size-[18px]" />
          </button>
        </header>

        <div className="grid grid-cols-2 gap-4 overflow-y-auto p-5 sm:grid-cols-3">
          {WALLPAPERS.map((w) => (
            <WallpaperTile
              key={w.id}
              wallpaper={w}
              selected={w.id === selectedId}
              onClick={() => onSelect(w.id)}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function WallpaperTile({
  wallpaper,
  selected,
  onClick,
}: {
  wallpaper: Wallpaper;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="group flex flex-col gap-2 text-left">
      <div
        className={
          "relative aspect-video w-full overflow-hidden rounded-xl ring-1 transition-all " +
          (selected
            ? "ring-primary ring-2"
            : "ring-border group-hover:ring-foreground/25")
        }
        style={{
          // Photo tiles use their thumb; the gradient default paints its literal
          // preview. Both are background-image values (longhand avoids the
          // shorthand/longhand mix warning).
          backgroundImage: wallpaper.thumb
            ? `url('${wallpaper.thumb}')`
            : (wallpaper.preview ?? wallpaper.background),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {selected ? (
          <span className="bg-primary text-primary-foreground absolute right-2 top-2 inline-flex size-5 items-center justify-center rounded-full shadow">
            <RiCheckLine className="size-3.5" />
          </span>
        ) : null}
      </div>
      <span className="text-label-xs text-foreground font-medium">{wallpaper.label}</span>
    </button>
  );
}
