import type { UINode } from "./types";

// A canonical example tree — exactly the jsonb shape the agent emits and we
// store. Used to seed a demo page and to show the model a worked example. It
// must satisfy UINodeSchema. Keep it LEAN: each tab is a short page (a heading
// + a card or two). The model mirrors this size, so a bloated example makes
// every generation slow. `detail`/`panels` exist (see schema) but are used
// sparingly, only when a request actually calls for drill-in or tabs.
export const EXAMPLE_TREE: UINode = {
  type: "Window",
  props: { title: "Customs Dashboard" },
  children: [
    {
      // Navigation sidebar: every item has its own short page.
      type: "Sidebar",
      props: {
        selected: 2,
        items: [
          {
            label: "Imports",
            icon: "download",
            page: [
              { type: "Text", props: { value: "Imports", variant: "largeTitle" } },
              { type: "Text", props: { value: "Shipments arriving this week.", variant: "secondary" } },
              {
                type: "Card",
                props: { title: "Incoming" },
                children: [
                  { type: "ListRow", props: { title: "Container MSKU-7781", subtitle: "Rotterdam → Munich", icon: "download", badge: "In transit", accessory: "chevron" } },
                  { type: "ListRow", props: { title: "Container HLBU-2245", subtitle: "Antwerp → Berlin", icon: "download", badge: "Customs", accessory: "chevron" } },
                ],
              },
            ],
          },
          {
            label: "Exports",
            icon: "upload",
            page: [
              { type: "Text", props: { value: "Exports", variant: "largeTitle" } },
              { type: "Text", props: { value: "Outbound declarations awaiting dispatch.", variant: "secondary" } },
              {
                type: "Card",
                props: { title: "Ready to ship" },
                children: [
                  { type: "ListRow", props: { title: "EX-9920 · Machinery", subtitle: "Hamburg → New York", icon: "upload", accessory: "chevron" } },
                  { type: "ListRow", props: { title: "EX-9921 · Textiles", subtitle: "Hamburg → Lagos", icon: "upload", accessory: "chevron" } },
                ],
              },
            ],
          },
          {
            label: "Declarations",
            icon: "document",
            page: [
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
            ],
          },
          {
            label: "Reports",
            icon: "chart",
            page: [
              { type: "Text", props: { value: "Reports", variant: "largeTitle" } },
              { type: "Text", props: { value: "Clearance performance this quarter.", variant: "secondary" } },
              {
                type: "Card",
                props: { title: "Summary" },
                children: [
                  { type: "ListRow", props: { title: "Cleared on time", icon: "check", badge: "94%" } },
                  { type: "ListRow", props: { title: "Average clearance", icon: "clock", badge: "1.8 days" } },
                  { type: "ListRow", props: { title: "Held for inspection", icon: "warning", badge: "12" } },
                ],
              },
            ],
          },
          {
            label: "Settings",
            icon: "settings",
            page: [
              { type: "Text", props: { value: "Settings", variant: "largeTitle" } },
              { type: "Text", props: { value: "Manage how the dashboard behaves.", variant: "secondary" } },
              {
                type: "Card",
                props: { title: "Appearance" },
                children: [
                  { type: "Text", props: { value: "Theme", variant: "body" } },
                  { type: "SegmentedControl", props: { options: ["Light", "Dark", "Auto"], selected: 2 } },
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
      },
    },
  ],
};
