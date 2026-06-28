"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { RiMoonLine, RiSunLine } from "@remixicon/react";

// Light/dark toggle. Mounted guard avoids a hydration mismatch on the icon.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount guard to avoid SSR icon mismatch
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="text-foreground-soft hover:text-foreground hover:bg-muted inline-flex size-8 items-center justify-center rounded-lg transition-colors"
    >
      {mounted && isDark ? <RiSunLine className="size-[18px]" /> : <RiMoonLine className="size-[18px]" />}
    </button>
  );
}
