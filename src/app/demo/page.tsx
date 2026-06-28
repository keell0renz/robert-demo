import { Desktop, EXAMPLE_TREE } from "@/os";

// Static smoke test for the renderer + primitives, no DB. The same tree the
// agent emits, rendered straight through <Desktop>. Visit /demo.
export default function DemoPage() {
  return <Desktop node={EXAMPLE_TREE} />;
}
