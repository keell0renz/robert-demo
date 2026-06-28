import type { UINode } from "./types";

// A canonical example tree — exactly the jsonb shape the agent emits and we
// store. Used to seed a demo page and to show the model a worked example. It
// must satisfy UINodeSchema.
export const EXAMPLE_TREE: UINode = {
  type: "Window",
  props: { title: "Customs Dashboard" },
  children: [
    {
      type: "Sidebar",
      props: {
        selected: 0,
        items: [
          { label: "Imports", icon: "download" },
          { label: "Exports", icon: "upload" },
          { label: "Declarations", icon: "document" },
          { label: "Reports", icon: "chart" },
          { label: "Settings", icon: "settings" },
        ],
      },
    },
    {
      type: "Content",
      children: [
        {
          type: "Toolbar",
          children: [
            { type: "Button", props: { label: "Validate", variant: "prominent", icon: "check" } },
            { type: "Button", props: { label: "Export", variant: "default", icon: "share" } },
            { type: "SegmentedControl", props: { options: ["All", "Pending", "Cleared"], selected: 1 } },
          ],
        },
        { type: "Text", props: { value: "Declarations", variant: "largeTitle" } },
        { type: "Text", props: { value: "3 declarations pending review.", variant: "secondary" } },
        {
          type: "Card",
          props: { title: "Pending" },
          children: [
            { type: "ListRow", props: { title: "DE-4471 · Rotterdam", subtitle: "Electronics · 1,240 kg", icon: "document", badge: "Pending", accessory: "chevron" } },
            { type: "ListRow", props: { title: "DE-4472 · Hamburg", subtitle: "Textiles · 820 kg", icon: "document", badge: "Pending", accessory: "chevron" } },
            { type: "ListRow", props: { title: "DE-4470 · Antwerp", subtitle: "Machinery · 3,100 kg", icon: "check", accessory: "check" } },
          ],
        },
        {
          type: "Card",
          props: { title: "Notifications" },
          children: [
            { type: "Switch", props: { label: "Email me when a declaration clears", on: true } },
            { type: "Switch", props: { label: "Daily summary digest", on: false } },
          ],
        },
      ],
    },
  ],
};
