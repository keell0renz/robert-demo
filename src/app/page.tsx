import { desc } from "drizzle-orm";
import { db } from "@/db";
import { apps } from "@/db/schema";
import { Workspace, type RecentPage } from "@/components/workspace/workspace";

// Boot into a fresh desktop. The agent's first turn creates a session and apps,
// and the URL becomes /{sessionId} in place (no navigation). We load recent apps
// so the Agent's empty state can offer a way back into earlier workspaces.
export default async function Home() {
  const rows = await db
    .select({
      id: apps.id,
      title: apps.title,
      prompt: apps.prompt,
      updatedAt: apps.updatedAt,
      sessionId: apps.sessionId,
    })
    .from(apps)
    .orderBy(desc(apps.updatedAt))
    .limit(50);

  // One entry per workspace (dedupe by session), linking to /{sessionId}.
  const seen = new Set<string>();
  const recent: RecentPage[] = [];
  for (const r of rows) {
    if (seen.has(r.sessionId)) continue;
    seen.add(r.sessionId);
    recent.push({ id: r.sessionId, title: r.title, prompt: r.prompt, updatedAt: r.updatedAt });
    if (recent.length >= 12) break;
  }

  return <Workspace initialWorkspace={null} recentPages={recent} />;
}
