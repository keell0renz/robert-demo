const TONES = {
  neutral: { bg: "var(--os-fill-soft)", fg: "var(--os-text-secondary)" },
  accent: { bg: "color-mix(in srgb, var(--os-accent) 15%, transparent)", fg: "var(--os-accent)" },
  red: { bg: "color-mix(in srgb, var(--os-red) 15%, transparent)", fg: "var(--os-red)" },
  green: { bg: "color-mix(in srgb, var(--os-green) 18%, transparent)", fg: "var(--os-green)" },
  orange: { bg: "color-mix(in srgb, var(--os-orange) 18%, transparent)", fg: "var(--os-orange)" },
} as const;

// PRIMITIVE: Badge — a small status pill.
export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 18,
        padding: "0 8px",
        fontSize: 11,
        fontWeight: 500,
        borderRadius: "var(--os-radius-pill)",
        background: t.bg,
        color: t.fg,
        alignSelf: "flex-start",
      }}
    >
      {label}
    </span>
  );
}
