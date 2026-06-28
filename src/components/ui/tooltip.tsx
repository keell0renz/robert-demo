// AlignUI Tooltip v0.0.0

"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils/cn";
import { tv, type VariantProps } from "@/components/ui/utils/tv";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

export const tooltipVariants = tv({
  slots: {
    content: [
      "z-50 shadow-tooltip",
      "transition-[opacity,transform] duration-150 ease-out opacity-0 scale-95 data-[state=open]:opacity-100 data-[state=open]:scale-100",
    ],
    arrow: "-translate-y-1/2 -rotate-45 border [clip-path:polygon(0_100%,0_0,100%_100%)]",
  },
  variants: {
    size: {
      xsmall: {
        content: "rounded px-1.5 py-0.5 text-paragraph-xs",
        arrow: "rounded-bl-sm",
      },
      small: {
        content: "rounded-md px-2.5 py-1 text-paragraph-sm",
        arrow: "rounded-bl-[3px]",
      },
      medium: {
        content: "rounded-xl p-3 text-label-sm",
        arrow: "rounded-bl-sm",
      },
    },
    variant: {
      dark: {
        content: "bg-primary text-primary-foreground",
        arrow: "border-stroke-strong-950 bg-primary",
      },
      light: {
        content: "bg-card text-foreground shadow-tooltip",
        arrow: "border-border bg-card",
      },
    },
  },
  compoundVariants: [
    {
      size: "xsmall",
      variant: "dark",
      class: {
        arrow: "size-1.5",
      },
    },
    {
      size: "xsmall",
      variant: "light",
      class: {
        arrow: "size-2",
      },
    },
    {
      size: ["small", "medium"],
      variant: "dark",
      class: {
        arrow: "size-2",
      },
    },
    {
      size: ["small", "medium"],
      variant: "light",
      class: {
        arrow: "size-2.5",
      },
    },
  ],
  defaultVariants: {
    size: "small",
    variant: "dark",
  },
});

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & VariantProps<typeof tooltipVariants> & { arrowClassName?: string }
>(({ size, variant, className, arrowClassName, children, sideOffset = 4, ...rest }, forwardedRef) => {
  const { content, arrow } = tooltipVariants({
    size,
    variant,
  });

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content ref={forwardedRef} sideOffset={sideOffset} className={cn("mirror-ui", content({ class: className }))} {...rest}>
        {children}
        <TooltipPrimitive.Arrow asChild>
          <div className={arrow({ class: arrowClassName })} />
        </TooltipPrimitive.Arrow>
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
});
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { TooltipProvider as Provider, TooltipRoot as Root, TooltipTrigger as Trigger, TooltipContent as Content };
