"use client";

import { useTheme } from "next-themes";
import { RiAlertFill, RiCheckboxCircleFill, RiErrorWarningFill, RiInformationFill, RiLoader4Line } from "@remixicon/react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// App toaster — sonner, restyled to the mirror-ui scheme. The `mirror-ui` class
// on the portal container brings the toasts into the mirror-ui token scope
// (`mirror-ui.css` redefines `--popover` etc. there) so they pick up the neutral
// card surface and flip in dark mode for free, matching the native mirror-ui
// `toast` primitive: `bg-popover` fill, no border, `shadow-regular-md`,
// `rounded-2xl`, tone-colored Remix fill icons.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group mirror-ui"
      icons={{
        success: <RiCheckboxCircleFill className="text-success-base size-5" />,
        info: <RiInformationFill className="text-information-base size-5" />,
        warning: <RiAlertFill className="text-warning-base size-5" />,
        error: <RiErrorWarningFill className="text-error-base size-5" />,
        loading: <RiLoader4Line className="text-foreground-soft size-5 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "transparent",
          "--border-radius": "var(--radius-2xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "shadow-regular-md gap-3",
          title: "text-label-sm text-foreground",
          description: "text-paragraph-sm text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
