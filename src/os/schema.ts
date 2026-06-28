import { z } from "zod";
import type { UINode } from "./types";

// ============================================================================
// THE VOCABULARY — the single source of truth for what the agent may emit.
//
// This Zod schema is wired straight into the `save_page` tool's `inputSchema`,
// so eve forces the model to produce output that matches it (structured
// output). A node type that isn't here is unrepresentable; a prop that isn't
// here can't be passed. The schema *is* the guardrail — keep it tight. Every
// prop added here is something the AI can vary and that we support forever.
// ============================================================================

// Closed icon set. The agent picks a name; `icons.tsx` maps it to a Lucide
// glyph (the open SF-Symbols substitute). It can never reference an arbitrary
// icon, image, or emoji.
export const ICONS = [
  "search", "plus", "trash", "folder", "document", "star", "share", "filter",
  "download", "upload", "refresh", "settings", "check", "inbox", "calendar",
  "chart", "user", "bell", "home", "mail", "lock", "cloud", "image", "play",
  "edit", "copy", "link", "info", "warning", "heart", "grid", "list",
  "arrow-right", "more", "clock", "globe", "tag", "bookmark", "flag",
] as const;
export type IconName = (typeof ICONS)[number];
const icon = z.enum(ICONS);

const sidebarItem = z.object({
  label: z.string(),
  icon: icon.optional(),
  // When present, this item is a navigation destination — selecting it in the
  // sidebar swaps the content area to this page (a list of nodes, same shape as
  // a Content's children). Give EVERY item a `page` to build a multi-page app
  // (System Settings, a mail client's folders). Omit `page` on all items for a
  // source-list sidebar with one shared Content pane (the static idiom).
  // `z.lazy` defers the recursive reference to UINodeSchema (declared below).
  page: z.array(z.lazy((): z.ZodType<UINode> => UINodeSchema)).optional(),
});

// Each node type declares exactly the props it accepts. Flat, semantic,
// closed-enum — no className, no style, no color/spacing. `children` is the
// recursive seam (only container nodes have it).
export const UINodeSchema: z.ZodType<UINode> = z.lazy(() =>
  z.discriminatedUnion("type", [
    // ---- Structural containers ----------------------------------------------
    z.object({
      type: z.literal("Window"),
      props: z.object({ title: z.string() }),
      children: z.array(UINodeSchema).optional(),
    }),
    z.object({
      type: z.literal("Sidebar"),
      props: z.object({
        items: z.array(sidebarItem).min(1),
        selected: z.number().int().min(0).optional(),
      }),
    }),
    z.object({
      type: z.literal("Content"),
      children: z.array(UINodeSchema).optional(),
    }),
    z.object({
      type: z.literal("Toolbar"),
      children: z.array(UINodeSchema).optional(),
    }),
    z.object({
      type: z.literal("Card"),
      props: z.object({ title: z.string().optional() }).optional(),
      children: z.array(UINodeSchema).optional(),
    }),
    // ---- Leaf controls / display -------------------------------------------
    z.object({
      type: z.literal("Text"),
      props: z.object({
        value: z.string(),
        variant: z
          .enum(["largeTitle", "title", "heading", "body", "secondary", "caption"])
          .optional(),
      }),
    }),
    z.object({
      type: z.literal("Button"),
      props: z.object({
        label: z.string(),
        variant: z.enum(["prominent", "default", "subtle"]).optional(),
        size: z.enum(["regular", "small"]).optional(),
        icon: icon.optional(),
      }),
    }),
    z.object({
      type: z.literal("ListRow"),
      props: z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        icon: icon.optional(),
        badge: z.string().optional(),
        accessory: z.enum(["chevron", "check", "none"]).optional(),
      }),
    }),
    z.object({
      type: z.literal("TextField"),
      props: z.object({
        placeholder: z.string().optional(),
        value: z.string().optional(),
        label: z.string().optional(),
        type: z.enum(["text", "search", "password"]).optional(),
      }),
    }),
    z.object({
      type: z.literal("Switch"),
      props: z.object({
        label: z.string().optional(),
        on: z.boolean().optional(),
      }),
    }),
    z.object({
      type: z.literal("SegmentedControl"),
      props: z.object({
        options: z.array(z.string()).min(2),
        selected: z.number().int().min(0).optional(),
      }),
    }),
    z.object({
      type: z.literal("Badge"),
      props: z.object({
        label: z.string(),
        tone: z.enum(["neutral", "accent", "red", "green", "orange"]).optional(),
      }),
    }),
    z.object({ type: z.literal("Divider") }),
  ]),
);

// The persisted document: a title for listings plus the root tree (which must
// be a Window). `prompt` is stored alongside by the tool, not by the model.
export const SavePageSchema = z.object({
  title: z.string().describe("A short title for this page, e.g. 'Customs Dashboard'."),
  tree: UINodeSchema.describe("The root UI node. Must be a Window."),
});

export type SavePageInput = z.infer<typeof SavePageSchema>;
