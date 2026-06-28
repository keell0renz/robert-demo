import { REGISTRY } from "./registry";
import type { UINode } from "./types";

// THE ENGINE — the whole Path-A renderer. Walk the tree, map `type` -> a
// primitive, recurse into children. An unknown type renders null: failures are
// local (one node disappears) and the rest of the tree survives. No compiler,
// no eval, no sandbox. This component has no hooks, so it works in a server
// component and freely renders the "use client" primitives underneath it.
export function Render({ node }: { node: UINode | null | undefined }) {
  if (!node || typeof node !== "object") return null;
  const Component = REGISTRY[node.type];
  if (!Component) return null; // off-vocabulary -> nothing
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
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 40,
        background: "var(--os-wallpaper)",
      }}
    >
      <Render node={node} />
    </div>
  );
}
