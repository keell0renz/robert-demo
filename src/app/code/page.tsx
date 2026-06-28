import { desc } from "drizzle-orm";
import { db } from "@/db";
import { codeApps } from "@/db/schema";
import { CodeWorkspace, type RecentCodePage } from "@/components/code-workspace/code-workspace";

// Path B — boot into a fresh React-code desktop. The agent's first turn creates
// a session and apps; the URL becomes /code/{sessionId} in place. Recent apps
// (deduped by workspace) feed the chat's empty state so you can hop back into
// earlier desktops.
export default async function CodeHome() {
  const rows = await db
    .select({
      id: codeApps.id,
      title: codeApps.title,
      prompt: codeApps.prompt,
      updatedAt: codeApps.updatedAt,
      sessionId: codeApps.sessionId,
    })
    .from(codeApps)
    .orderBy(desc(codeApps.updatedAt))
    .limit(50);

  const seen = new Set<string>();
  const recent: RecentCodePage[] = [];
  for (const r of rows) {
    if (seen.has(r.sessionId)) continue;
    seen.add(r.sessionId);
    recent.push({ id: r.sessionId, title: r.title, prompt: r.prompt, updatedAt: r.updatedAt });
    if (recent.length >= 12) break;
  }

  return <CodeWorkspace initialWorkspace={null} recentPages={recent} />;
}
