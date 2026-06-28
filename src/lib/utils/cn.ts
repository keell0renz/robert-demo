import clsx, { type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

export { type ClassValue } from "clsx";

// AlignUI typography utilities (text-label-sm, text-title-h4, …) registered as a
// font-size class group so tailwind-merge dedupes them correctly (e.g.
// `text-label-md` overriding `text-label-sm`). The whole UI layer + domain code
// share this single cn.
const typographyConfig = {
  title: ["h1", "h2", "h3", "h4", "h5", "h6"],
  label: ["xl", "lg", "md", "sm", "xs", "2xs"],
  paragraph: ["xl", "lg", "md", "sm", "xs"],
  subheading: ["md", "sm", "xs", "2xs"],
  doc: ["label", "paragraph"],
};

const typographyPatterns = Object.entries(typographyConfig).flatMap(([category, sizes]) => sizes.map((size) => `${category}-${size}`));

export const twMergeConfig = {
  extend: {
    classGroups: {
      "font-size": [
        {
          text: typographyPatterns,
        },
      ],
    },
  },
};

const customTwMerge = extendTailwindMerge(twMergeConfig);

/**
 * `clsx` + `tailwind-merge`, AlignUI typography-aware. Use wherever class
 * conflicts are possible.
 */
export function cn(...classes: ClassValue[]) {
  return customTwMerge(clsx(...classes));
}
