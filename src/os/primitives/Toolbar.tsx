import type { ReactNode } from "react";

// PRIMITIVE: Toolbar — the control strip at the top of Content. Negative margins
// bleed it to the pane edges (it cancels Content's 20px inset), and it sits
// flush under the title bar.
export function Toolbar({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        margin: "-20px -20px 0",
        height: 48,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 16px",
        borderBottom: "1px solid var(--os-hairline)",
        background: "var(--os-content-bg)",
      }}
    >
      {children}
    </div>
  );
}
