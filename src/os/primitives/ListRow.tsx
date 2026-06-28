import { ChevronRight, Check } from "lucide-react";
import { Icon } from "./icons";
import type { IconName } from "../schema";

// PRIMITIVE: ListRow — one row of a source/detail list. Best inside a Card,
// where the renderer draws the hairline separators between rows. Keeps its own
// 14px inset so it aligns identically whether grouped or standalone.
export function ListRow({
  title,
  subtitle,
  icon,
  badge,
  accessory = "none",
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  badge?: string;
  accessory?: "chevron" | "check" | "none";
}) {
  return (
    <div
      className="os-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        minHeight: subtitle ? 48 : 36,
        padding: "0 14px",
        boxSizing: "border-box",
      }}
    >
      {icon ? (
        <span style={{ display: "flex", color: "var(--os-accent)", flexShrink: 0 }}>
          <Icon name={icon} size={17} />
        </span>
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: "var(--os-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 11, color: "var(--os-text-secondary)", marginTop: 1 }}>
            {subtitle}
          </div>
        ) : null}
      </div>
      {badge ? (
        <span
          style={{
            fontSize: 11,
            color: "var(--os-text-secondary)",
            background: "var(--os-fill-soft)",
            borderRadius: "var(--os-radius-pill)",
            padding: "1px 8px",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      ) : null}
      {accessory === "chevron" ? (
        <ChevronRight size={16} strokeWidth={1.75} style={{ color: "var(--os-text-tertiary)", flexShrink: 0 }} />
      ) : null}
      {accessory === "check" ? (
        <Check size={16} strokeWidth={2} style={{ color: "var(--os-accent)", flexShrink: 0 }} />
      ) : null}
    </div>
  );
}
