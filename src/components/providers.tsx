"use client";

import { ThemeProvider } from "next-themes";
import * as Tooltip from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

// App-wide providers the mirror-ui components expect: next-themes (drives the
// `.dark` class), the Radix tooltip provider, and the sonner toaster.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <Tooltip.Provider>{children}</Tooltip.Provider>
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
