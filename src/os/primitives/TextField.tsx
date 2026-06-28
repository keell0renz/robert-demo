"use client";

import { useState } from "react";
import { Search } from "lucide-react";

// PRIMITIVE: TextField — text / search / password input with optional label.
export function TextField({
  placeholder,
  value = "",
  label,
  type = "text",
}: {
  placeholder?: string;
  value?: string;
  label?: string;
  type?: "text" | "search" | "password";
}) {
  const [v, setV] = useState(value);
  const [focus, setFocus] = useState(false);
  const isSearch = type === "search";
  const field = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        height: 28,
        padding: "0 8px",
        background: "var(--os-control-bg)",
        border: `1px solid ${focus ? "var(--os-accent)" : "var(--os-hairline)"}`,
        borderRadius: isSearch ? "var(--os-radius-pill)" : "var(--os-radius-control)",
        boxShadow: focus ? "0 0 0 3px color-mix(in srgb, var(--os-accent) 25%, transparent)" : "none",
      }}
    >
      {isSearch ? <Search size={14} strokeWidth={1.75} style={{ color: "var(--os-text-tertiary)" }} /> : null}
      <input
        type={type === "password" ? "password" : "text"}
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          font: "inherit",
          fontSize: 13,
          color: "var(--os-text)",
        }}
      />
    </div>
  );
  if (!label) return field;
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <span style={{ fontSize: 11, color: "var(--os-text-secondary)" }}>{label}</span>
      {field}
    </label>
  );
}
