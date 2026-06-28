import { Workspace } from "@/components/workspace/workspace";

// Landing → workspace. Starts with no artifact; the first agent turn creates the
// page and the URL becomes /{id} in place (no navigation).
export default function Home() {
  return <Workspace initialPage={null} />;
}
