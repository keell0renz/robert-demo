import type { ReactNode } from "react";

// PRIMITIVE: Card — a grouped box. The macOS container for rows/controls/text.
// Pass ListRows for an inset grouped list, or any content for a panel.
export function Card({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--os-grouped-bg)",
        border: "1px solid var(--os-hairline)",
        borderRadius: "var(--os-radius-card)",
        overflow: "hidden",
        boxShadow: "0 0.5px 1px rgba(0,0,0,0.04)",
      }}
    >
      {title ? (
        <div
          style={{
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--os-text)",
            borderBottom: "1px solid var(--os-hairline)",
          }}
        >
          {title}
        </div>
      ) : null}
      {/* Children are pre-composed into grouped rows by the renderer (inset +
          separators live there), so the body is a bare edge-to-edge stack. */}
      <div>{children}</div>
    </div>
  );
}
