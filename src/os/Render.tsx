import { REGISTRY } from "./registry";
import { NavShell } from "./primitives/NavShell";
import { PageHost } from "./primitives/PageHost";
import type { UINode } from "./types";

// Layout intelligence lives HERE, not in the primitives — the strict schema
// guarantees every child's `type` is known at render time, so the engine can
// impose correct macOS row geometry instead of trusting each primitive to style
// itself consistently (which is how toggles ended up overflowing card edges).
//
// Inside a Card, children become a grouped list: one source of truth for the
// horizontal inset and the hairline separators. A row can never escape the inset
// regardless of which control the agent dropped in.
const ROW_INSET = 14; // px — matches ListRow's own padding so all rows align.

// Full-bleed children manage their own horizontal padding (ListRow) or are a
// separator themselves (Divider); the row chassis must not double-pad them.
const BLEED_IN_CARD = new Set(["ListRow", "Divider"]);

// A separator is drawn only between two adjacent "row" controls. This keeps a
// label (Text) sitting flush above its control (e.g. "Theme" over a segmented
// control) without a stray hairline, while a run of ListRows/Switches gets the
// expected grouped-list separators.
const SEPARABLE_ROW = new Set(["ListRow", "Switch", "SegmentedControl", "TextField", "Button"]);

function GroupedRow({
  bleed,
  separated,
  children,
}: {
  bleed: boolean;
  separated: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderTop: separated ? "1px solid var(--os-hairline)" : undefined,
        ...(bleed
          ? null
          : {
              display: "flex",
              alignItems: "center",
              minHeight: 38,
              padding: `8px ${ROW_INSET}px`,
              boxSizing: "border-box",
            }),
      }}
    >
      {children}
    </div>
  );
}

// THE ENGINE — the whole Path-A renderer. Walk the tree, map `type` -> a
// primitive, recurse into children. An unknown type renders null: failures are
// local (one node disappears) and the rest of the tree survives. No compiler,
// no eval, no sandbox. This component has no hooks, so it works in a server
// component and freely renders the "use client" primitives underneath it.
export function Render({ node }: { node: UINode | null | undefined }) {
  if (!node || typeof node !== "object") return null;
  const Component = REGISTRY[node.type];
  if (!Component) return null; // off-vocabulary -> nothing

  // A Window whose Sidebar items carry `page`s is a multi-page nav app: hand it
  // to NavShell, which makes the sidebar actually navigate. Otherwise the Window
  // renders normally (single pane, or a static source-list sidebar + Content).
  if (node.type === "Window") {
    const sidebar = node.children?.find((c) => c?.type === "Sidebar");
    const hasPages = (
      sidebar?.props?.items as Array<{ page?: unknown[] }> | undefined
    )?.some((it) => Array.isArray(it?.page) && it.page.length > 0);
    if (sidebar && hasPages) {
      return <NavShell title={node.props?.title as string | undefined} sidebar={sidebar} />;
    }
  }

  // Content is the page body — render it through PageHost so its rows can drill
  // into detail views (the nav stack lives there, not in the dumb primitive).
  if (node.type === "Content") {
    return <PageHost nodes={node.children ?? []} />;
  }

  // Card composes its children into a grouped list (see note above).
  if (node.type === "Card" && node.children?.length) {
    const kids = node.children;
    const rows = kids.map((child, i) => {
      const prev = i > 0 ? kids[i - 1] : undefined;
      const separated =
        !!prev && SEPARABLE_ROW.has(child?.type) && SEPARABLE_ROW.has(prev.type);
      return (
        <GroupedRow key={i} bleed={BLEED_IN_CARD.has(child?.type)} separated={separated}>
          <Render node={child} />
        </GroupedRow>
      );
    });
    return <Component {...(node.props ?? {})}>{rows}</Component>;
  }

  const children = node.children?.map((child, i) => <Render key={i} node={child} />);
  return <Component {...(node.props ?? {})}>{children}</Component>;
}

// The desktop frame a generated Window sits on (wallpaper + centering). Wraps
// any rendered tree for the /page/[id] route.
export function Desktop({ node }: { node: UINode | null | undefined }) {
  return (
    <div
      className="os-root"
      style={{
        // Positioned containing block: the window measures this box, centres
        // itself, then drags/resizes within it (see WindowFrame).
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background: "var(--os-wallpaper)",
      }}
    >
      <Render node={node} />
    </div>
  );
}
