import type { ReactNode } from "react";

// PRIMITIVE: Content — the main pane right of the Sidebar. A padded column with
// a 16px rhythm. A Toolbar child bleeds to the edges (see Toolbar).
export function Content({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: "var(--os-content-bg)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        // 10px top makes the first element (a heading, or a Toolbar that bleeds
        // up over it) line up with the sidebar's first item — see Sidebar/Toolbar.
        padding: "10px 20px 20px",
        overflow: "auto",
      }}
    >
      {children}
    </div>
  );
}

const TEXT_VARIANTS = {
  largeTitle: { fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", color: "var(--os-text)" },
  title: { fontSize: 22, fontWeight: 600, letterSpacing: "-0.3px", color: "var(--os-text)" },
  heading: { fontSize: 15, fontWeight: 600, color: "var(--os-text)" },
  body: { fontSize: 13, fontWeight: 400, color: "var(--os-text)" },
  secondary: { fontSize: 13, fontWeight: 400, color: "var(--os-text-secondary)" },
  caption: { fontSize: 11, fontWeight: 400, color: "var(--os-text-secondary)" },
} as const;

// PRIMITIVE: Text — typographic block. The variant carries the hierarchy.
export function Text({
  value = "",
  variant = "body",
}: {
  value?: string;
  variant?: keyof typeof TEXT_VARIANTS;
}) {
  return <div style={{ ...TEXT_VARIANTS[variant], whiteSpace: "pre-wrap" }}>{value}</div>;
}

// PRIMITIVE: Divider — a hairline separator.
export function Divider() {
  return <div style={{ height: 1, background: "var(--os-hairline)", margin: "2px 0" }} />;
}
