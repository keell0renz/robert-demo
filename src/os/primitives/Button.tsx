import { Icon } from "./icons";
import type { IconName } from "../schema";

const VARIANTS = {
  prominent: { background: "var(--os-accent)", color: "var(--os-accent-text)", border: "1px solid transparent" },
  default: { background: "var(--os-control-bg)", color: "var(--os-text)", border: "1px solid var(--os-hairline)" },
  subtle: { background: "transparent", color: "var(--os-accent)", border: "1px solid transparent" },
} as const;

// PRIMITIVE: Button — semantic variants only; no className, no raw color.
export function Button({
  label = "Button",
  variant = "default",
  size = "regular",
  icon,
}: {
  label?: string;
  variant?: keyof typeof VARIANTS;
  size?: "regular" | "small";
  icon?: IconName;
}) {
  const h = size === "small" ? 22 : 28;
  return (
    <button
      className="os-btn"
      style={{
        height: h,
        padding: `0 ${size === "small" ? 10 : 14}px`,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: "var(--os-radius-control)",
        fontFamily: "var(--os-font)",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
        boxShadow: variant === "subtle" ? "none" : "var(--os-shadow-button)",
        ...VARIANTS[variant],
      }}
    >
      {icon ? <Icon name={icon} size={15} /> : null}
      {label}
    </button>
  );
}
