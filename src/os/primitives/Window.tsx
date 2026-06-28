"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

// Sizing/feel constants for the live macOS window.
const DEFAULT_W = 820;
const MIN_W = 480;
const MIN_H = 320;
// Resize zones STRADDLE the border (a few px outside + a few px inside) so they
// catch the pointer right at the edge, the way macOS does — not a thin band
// buried inside the window.
const OUT = 5; // px the hit-zone extends beyond the frame
const IN = 5; // px it extends inward
const EDGE = OUT + IN; // edge band thickness
const CORNER = 16; // corner hit-square side

// Window tiling (green-button menu): macOS auto-expands flush to the stage edges
// (no outer margin, no inter-tile gap), and a filled window stops ABOVE the dock
// rather than running under it. DOCK_RESERVE is the band the dock occupies at the
// bottom of the stage (dock bottom offset 12 + glass height ~68 + a small gap).
const DOCK_RESERVE = 90;

type Box = { x: number; y: number; w: number; h: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), Math.max(lo, hi));

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const CURSOR: Record<ResizeDir, string> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

// Edge bands stop short of the corners; corner squares sit above them (higher z)
// so the diagonal cursor wins where they meet. All handles sit ABOVE the title
// bar too, so the top edge/corners stay resizable — their straddle zone is only
// ~5px into the title bar, leaving the rest of the bar to drag (macOS behaviour).
const HANDLES: { dir: ResizeDir; z: number; style: CSSProperties }[] = [
  { dir: "n", z: 30, style: { top: -OUT, left: CORNER, right: CORNER, height: EDGE } },
  { dir: "s", z: 30, style: { bottom: -OUT, left: CORNER, right: CORNER, height: EDGE } },
  { dir: "e", z: 30, style: { top: CORNER, bottom: CORNER, right: -OUT, width: EDGE } },
  { dir: "w", z: 30, style: { top: CORNER, bottom: CORNER, left: -OUT, width: EDGE } },
  { dir: "ne", z: 31, style: { top: -OUT, right: -OUT, width: CORNER, height: CORNER } },
  { dir: "nw", z: 31, style: { top: -OUT, left: -OUT, width: CORNER, height: CORNER } },
  { dir: "se", z: 31, style: { bottom: -OUT, right: -OUT, width: CORNER, height: CORNER } },
  { dir: "sw", z: 31, style: { bottom: -OUT, left: -OUT, width: CORNER, height: CORNER } },
];

// A tiling preset, expressed as a fractional region of the stage [0..1]. The
// same fractions drive both the snap geometry and the little tile icon, so the
// preview always matches what the window does.
type Region = { label: string; fx: number; fy: number; fw: number; fh: number };

const MOVE_RESIZE: Region[] = [
  { label: "Left", fx: 0, fy: 0, fw: 0.5, fh: 1 },
  { label: "Right", fx: 0.5, fy: 0, fw: 0.5, fh: 1 },
  { label: "Top", fx: 0, fy: 0, fw: 1, fh: 0.5 },
  { label: "Bottom", fx: 0, fy: 0.5, fw: 1, fh: 0.5 },
];

const FILL_ARRANGE: Region[] = [
  { label: "Fill", fx: 0, fy: 0, fw: 1, fh: 1 },
  { label: "Center", fx: 0.18, fy: 0.14, fw: 0.64, fh: 0.72 },
  { label: "Top Left", fx: 0, fy: 0, fw: 0.5, fh: 0.5 },
  { label: "Bottom Right", fx: 0.5, fy: 0.5, fw: 0.5, fh: 0.5 },
];

// Flat list so a tile can be resolved by a single global index when the
// press-drag-release gesture reads the element under the release point.
const ALL_REGIONS: Region[] = [...MOVE_RESIZE, ...FILL_ARRANGE];

// The window chrome (rounded frame + title bar + a flex body). Shared by the
// plain Window primitive and the navigation-aware NavShell so both look
// identical and only the body wiring differs.
//
// It also makes the window feel real: drag it by the title bar, resize it from
// any edge or corner, and hover / long-press the green button for the macOS
// tiling popover (Move & Resize / Fill & Arrange). On first paint it measures
// its natural size and centres itself inside the positioned stage, then takes
// over with absolute geometry so the opposite edge stays anchored while
// resizing (real-macOS behaviour).
export function WindowFrame({
  title = "Untitled",
  children,
  z,
  onClose,
  onMinimize,
  hidden,
  placement = "center",
  defaultWidth,
  defaultHeight,
  offset = 0,
}: {
  title?: string;
  children?: ReactNode;
  // Stacking order within the desktop stage (the Agent app floats above the
  // generated artifact). Omitted → auto (DOM order).
  z?: number;
  // Wires the red traffic light. Used by the Agent window so closing it just
  // hides the app (its chat state lives in the workspace and persists).
  onClose?: () => void;
  // Wires the yellow traffic light — minimize ("roll down" to the dock).
  onMinimize?: () => void;
  // Keep the frame mounted but visually gone — preserves measured geometry so
  // reopening the Agent app restores its exact position/size.
  hidden?: boolean;
  // Initial placement of the measured box. "right" docks the Agent window to the
  // right of the stage; "center" is the default for generated artifacts.
  placement?: "center" | "right";
  defaultWidth?: number;
  defaultHeight?: number;
  // Cascade step (e.g. window index) so stacked windows don't perfectly overlap.
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [active, setActive] = useState<null | "drag" | ResizeDir>(null);
  // Whether to ease geometry changes. Off at mount + during drag/resize; on for
  // tiling snaps so they animate into place.
  const [snap, setSnap] = useState(false);
  // The in-flight gesture. Held in a ref so the move handler stays identity-
  // stable (no re-subscribe per frame) and reads start-of-gesture geometry.
  const action = useRef<
    | null
    | {
        mode: "drag" | "resize";
        dir?: ResizeDir;
        px: number;
        py: number;
        box: Box;
        pw: number;
        ph: number;
      }
  >(null);

  const stageSize = () => {
    const parent = ref.current?.offsetParent as HTMLElement | null;
    return {
      pw: parent?.clientWidth ?? window.innerWidth,
      ph: parent?.clientHeight ?? window.innerHeight,
    };
  };

  // Measure once: take the natural content height + the stage size, centre, and
  // switch to absolute layout. `offsetParent` is the nearest positioned
  // ancestor (the .os-root stage / Desktop), which is also the containing block
  // for our absolute coordinates — so its client box is the right reference.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || box) return;
    const { pw, ph } = stageSize();
    const w = clamp(defaultWidth ?? DEFAULT_W, MIN_W, Math.max(MIN_W, pw - 32));
    const h = clamp(defaultHeight ?? el.offsetHeight, MIN_H, Math.max(MIN_H, ph - 32));
    const cascade = (offset % 6) * 30; // wrap so deep stacks stay on-screen
    const baseX = placement === "right" ? Math.max(0, pw - w - 28) : Math.max(0, (pw - w) / 2);
    const baseY = placement === "right" ? Math.max(24, (ph - h) / 2) : Math.max(0, (ph - h) / 2);
    const x = clamp(baseX + cascade, 0, Math.max(0, pw - w));
    const y = clamp(baseY + cascade, 0, Math.max(0, ph - h));
    setBox({ x, y, w, h });
  }, [box, defaultWidth, defaultHeight, placement, offset]);

  // Snap the window into a fractional region of the stage (green-button menu).
  // The usable area is the full stage width and the height minus the dock band,
  // so presets fill flush to the edges and never overlap the dock.
  const arrange = useCallback((r: Region) => {
    const { pw, ph } = stageSize();
    const availH = Math.max(MIN_H, ph - DOCK_RESERVE);
    const w = clamp(r.fw * pw, MIN_W, pw);
    const h = clamp(r.fh * availH, MIN_H, availH);
    const x = clamp(r.fx * pw, 0, Math.max(0, pw - w));
    const y = clamp(r.fy * availH, 0, Math.max(0, availH - h));
    setSnap(true);
    setBox({ x, y, w, h });
  }, []);

  const onMove = useCallback((e: PointerEvent) => {
    const a = action.current;
    if (!a) return;
    const dx = e.clientX - a.px;
    const dy = e.clientY - a.py;
    if (a.mode === "drag") {
      setBox({
        ...a.box,
        x: clamp(a.box.x + dx, 0, a.pw - a.box.w),
        y: clamp(a.box.y + dy, 0, a.ph - a.box.h),
      });
      return;
    }
    let { x, y, w, h } = a.box;
    const d = a.dir!;
    if (d.includes("e")) w = clamp(a.box.w + dx, MIN_W, a.pw - a.box.x);
    if (d.includes("s")) h = clamp(a.box.h + dy, MIN_H, a.ph - a.box.y);
    if (d.includes("w")) {
      w = clamp(a.box.w - dx, MIN_W, a.box.x + a.box.w);
      x = a.box.x + (a.box.w - w);
    }
    if (d.includes("n")) {
      h = clamp(a.box.h - dy, MIN_H, a.box.y + a.box.h);
      y = a.box.y + (a.box.h - h);
    }
    setBox({ x, y, w, h });
  }, []);

  const onUp = useCallback(() => {
    action.current = null;
    setActive(null);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    document.removeEventListener("pointermove", onMove);
  }, [onMove]);

  const begin = useCallback(
    (mode: "drag" | "resize", dir?: ResizeDir) => (e: ReactPointerEvent) => {
      if (!box || e.button !== 0) return;
      e.preventDefault();
      setSnap(false); // direct manipulation should track the pointer 1:1
      const { pw, ph } = stageSize();
      action.current = { mode, dir, px: e.clientX, py: e.clientY, box, pw, ph };
      setActive(mode === "drag" ? "drag" : dir!);
      // Pin the cursor on the whole document so it holds steady even when the
      // pointer briefly leaves the thin handle while resizing fast.
      document.body.style.userSelect = "none";
      document.body.style.cursor = mode === "drag" ? "grabbing" : CURSOR[dir!];
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp, { once: true });
    },
    [box, onMove, onUp],
  );

  const positioned = !!box;
  const dragging = active === "drag";
  const ease = "180ms ease";
  const transition = snap && !active ? `left ${ease}, top ${ease}, width ${ease}, height ${ease}` : undefined;

  // Outer wrapper holds the geometry and is NOT clipped, so the straddling
  // resize handles can extend a few px past the visual frame.
  const wrapStyle: CSSProperties = positioned
    ? { position: "absolute", left: box!.x, top: box!.y, width: box!.w, height: box!.h, transition, zIndex: z }
    : { position: "relative", width: DEFAULT_W, maxWidth: "100%", zIndex: z };
  // Hidden: keep mounted (geometry persists) but neither paint nor catch events.
  if (hidden) {
    wrapStyle.visibility = "hidden";
    wrapStyle.pointerEvents = "none";
  }

  // Inner frame: the visible, rounded, clipped window.
  const frameStyle: CSSProperties = {
    background: "var(--os-window-bg)",
    borderRadius: "var(--os-radius-window)",
    boxShadow: "var(--os-shadow-window)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    userSelect: active ? "none" : undefined,
    ...(positioned ? { position: "absolute", inset: 0 } : { position: "relative" }),
  };

  return (
    <div ref={ref} style={wrapStyle}>
      <div style={frameStyle}>
        <TitleBar title={title} dragging={dragging} onDragStart={begin("drag")} onArrange={arrange} onClose={onClose} onMinimize={onMinimize} />
        <div style={{ display: "flex", flex: 1, minHeight: positioned ? 0 : 420, overflow: "hidden" }}>
          {children}
        </div>
      </div>
      {positioned
        ? HANDLES.map((hd) => (
            <div
              key={hd.dir}
              onPointerDown={begin("resize", hd.dir)}
              style={{ position: "absolute", zIndex: hd.z, cursor: CURSOR[hd.dir], ...hd.style }}
            />
          ))
        : null}
    </div>
  );
}

// PRIMITIVE: Window — the frame + title bar with traffic lights baked in.
// Children lay out in a row (Sidebar + Content, or just Content). For a
// sidebar whose items each carry a `page`, the renderer swaps in NavShell so
// selection actually navigates.
export function Window({ title = "Untitled", children }: { title?: string; children?: ReactNode }) {
  return <WindowFrame title={title}>{children}</WindowFrame>;
}

function TitleBar({
  title,
  dragging,
  onDragStart,
  onArrange,
  onClose,
  onMinimize,
}: {
  title: string;
  dragging: boolean;
  onDragStart: (e: ReactPointerEvent) => void;
  onArrange: (r: Region) => void;
  onClose?: () => void;
  onMinimize?: () => void;
}) {
  return (
    <div
      onPointerDown={onDragStart}
      style={{
        height: 38,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid var(--os-hairline)",
        position: "relative",
        background: "var(--os-window-bg)",
        flexShrink: 0,
        // grab to hint draggability; grabbing while a drag is in flight
        cursor: dragging ? "grabbing" : "grab",
        // below the resize handles (z 30+) so the top edge/corners still resize
        zIndex: 10,
      }}
    >
      <TrafficLights onArrange={onArrange} onClose={onClose} onMinimize={onMinimize} />
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

// The three window buttons. The green one carries the macOS tiling menu: hover
// it (or press and hold) to reveal Move & Resize / Fill & Arrange presets.
function TrafficLights({
  onArrange,
  onClose,
  onMinimize,
}: {
  onArrange: (r: Region) => void;
  onClose?: () => void;
  onMinimize?: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timers = useRef<{ hold?: number; close?: number }>({});

  const clearT = (k: keyof typeof timers.current) => {
    const t = timers.current[k];
    if (t) {
      window.clearTimeout(t);
      timers.current[k] = undefined;
    }
  };

  // While the menu is open, the gesture ends on the NEXT pointer release
  // (you held the green button, dragged onto a tile, and let go): release over a
  // tile applies it; release anywhere else just closes. Also dismiss on Escape
  // or a pointer-down outside the menu.
  useEffect(() => {
    if (!open) return;
    const onUp = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const tile = el?.closest("[data-snap-index]") as HTMLElement | null;
      const r = tile ? ALL_REGIONS[Number(tile.dataset.snapIndex)] : undefined;
      if (r) onArrange(r);
      setOpen(false);
    };
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onArrange]);

  useEffect(
    () => () => {
      clearT("hold");
      clearT("close");
    },
    [],
  );

  const lights = [
    { c: "var(--os-tl-red)", g: "×", red: true },
    { c: "var(--os-tl-yellow)", g: "−", yellow: true },
    { c: "var(--os-tl-green)", g: "+", green: true },
  ];

  return (
    <div
      ref={rootRef}
      // Pressing a window button must never start a window drag.
      onPointerDown={(e) => e.stopPropagation()}
      onPointerEnter={() => {
        clearT("close");
        setHover(true);
      }}
      onPointerLeave={() => {
        setHover(false);
        clearT("hold");
        timers.current.close = window.setTimeout(() => setOpen(false), 280);
      }}
      style={{ display: "flex", alignItems: "center", gap: 8, position: "relative", zIndex: 50 }}
    >
      {lights.map((l, i) => (
        <span
          key={i}
          onClick={
            l.red && onClose
              ? () => onClose()
              : l.yellow && onMinimize
                ? () => onMinimize()
                : undefined
          }
          onPointerDown={
            l.green
              ? () => {
                  // open ONLY on a deliberate press-and-hold (not hover, not a
                  // short click); a quick release before this fires cancels it
                  timers.current.hold = window.setTimeout(() => setOpen(true), 280);
                }
              : undefined
          }
          onPointerUp={
            l.green
              ? () => {
                  // released before the hold fired → it was a short click → do
                  // nothing (the menu opens on HOLD, not on click)
                  clearT("hold");
                }
              : undefined
          }
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
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          {l.g}
        </span>
      ))}
      {open ? <TilingMenu /> : null}
    </div>
  );
}

function TilingMenu() {
  return (
    <div
      style={{
        position: "absolute",
        top: 26,
        left: -8,
        width: 250,
        padding: 10,
        borderRadius: 14,
        background: "var(--os-window-bg)",
        border: "1px solid var(--os-hairline)",
        boxShadow: "var(--os-shadow-window)",
        fontFamily: "var(--os-font)",
        cursor: "default",
        // never let the drag-to-select gesture start a text selection
        userSelect: "none",
      }}
    >
      <Section title="Move & Resize" regions={MOVE_RESIZE} offset={0} />
      <div style={{ height: 6 }} />
      <Section title="Fill & Arrange" regions={FILL_ARRANGE} offset={MOVE_RESIZE.length} />
    </div>
  );
}

function Section({ title, regions, offset }: { title: string; regions: Region[]; offset: number }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--os-text-secondary)", padding: "2px 4px 6px" }}>
        {title}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
        {regions.map((r, i) => (
          <SnapTile key={i} region={r} index={offset + i} />
        ))}
      </div>
    </div>
  );
}

// A preset tile: the stage outline with the target region filled — the same
// fractions the window will snap to. Selection is handled by the gesture's
// release (see TrafficLights), resolved via `data-snap-index`; the tile itself
// only previews and highlights.
function SnapTile({ region, index }: { region: Region; index: number }) {
  const [h, setH] = useState(false);
  return (
    <button
      title={region.label}
      data-snap-index={index}
      onPointerEnter={() => setH(true)}
      onPointerLeave={() => setH(false)}
      style={{
        height: 32,
        display: "grid",
        placeItems: "center",
        border: "none",
        borderRadius: 6,
        background: h ? "var(--os-fill-soft)" : "transparent",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: 26,
          height: 18,
          borderRadius: 3,
          border: `1.5px solid ${h ? "var(--os-accent)" : "var(--os-text-tertiary)"}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${region.fx * 100}%`,
            top: `${region.fy * 100}%`,
            width: `${region.fw * 100}%`,
            height: `${region.fh * 100}%`,
            background: h ? "var(--os-accent)" : "var(--os-text-secondary)",
            borderRadius: 1.5,
            transform: "scale(0.84)",
            transformOrigin: "center",
          }}
        />
      </div>
    </button>
  );
}
