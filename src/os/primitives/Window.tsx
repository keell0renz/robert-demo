"use client";

import {
  useCallback,
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

// The window chrome (rounded frame + title bar + a flex body). Shared by the
// plain Window primitive and the navigation-aware NavShell so both look
// identical and only the body wiring differs.
//
// It also makes the window feel real: drag it by the title bar, resize it from
// any edge or corner. On first paint it measures its natural size and centres
// itself inside the positioned stage, then takes over with absolute geometry so
// the opposite edge stays anchored while resizing (real-macOS behaviour).
export function WindowFrame({ title = "Untitled", children }: { title?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [active, setActive] = useState<null | "drag" | ResizeDir>(null);
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

  // Measure once: take the natural content height + the stage size, centre, and
  // switch to absolute layout. `offsetParent` is the nearest positioned
  // ancestor (the .os-root stage / Desktop), which is also the containing block
  // for our absolute coordinates — so its client box is the right reference.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || box) return;
    const parent = el.offsetParent as HTMLElement | null;
    const pw = parent?.clientWidth ?? window.innerWidth;
    const ph = parent?.clientHeight ?? window.innerHeight;
    const w = clamp(DEFAULT_W, MIN_W, Math.max(MIN_W, pw - 32));
    const h = clamp(el.offsetHeight, MIN_H, Math.max(MIN_H, ph - 32));
    setBox({ x: Math.max(0, (pw - w) / 2), y: Math.max(0, (ph - h) / 2), w, h });
  }, [box]);

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
      const parent = ref.current?.offsetParent as HTMLElement | null;
      action.current = {
        mode,
        dir,
        px: e.clientX,
        py: e.clientY,
        box,
        pw: parent?.clientWidth ?? window.innerWidth,
        ph: parent?.clientHeight ?? window.innerHeight,
      };
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

  // Outer wrapper holds the geometry and is NOT clipped, so the straddling
  // resize handles can extend a few px past the visual frame.
  const wrapStyle: CSSProperties = positioned
    ? { position: "absolute", left: box!.x, top: box!.y, width: box!.w, height: box!.h }
    : { position: "relative", width: DEFAULT_W, maxWidth: "100%" };

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
        <TitleBar title={title} dragging={dragging} onDragStart={begin("drag")} />
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
}: {
  title: string;
  dragging: boolean;
  onDragStart: (e: ReactPointerEvent) => void;
}) {
  const [hover, setHover] = useState(false);
  const lights = [
    { c: "var(--os-tl-red)", g: "×" },
    { c: "var(--os-tl-yellow)", g: "−" },
    { c: "var(--os-tl-green)", g: "+" },
  ];
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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
      <div style={{ display: "flex", gap: 8 }}>
        {lights.map((l, i) => (
          <span
            key={i}
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
      </div>
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
