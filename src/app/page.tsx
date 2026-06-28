import { desc } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { Workspace } from "@/components/workspace/workspace";

// Landing → workspace. Starts with no artifact; the first agent turn creates the
// page and the URL becomes /{id} in place (no navigation). We also load the most
// recent pages so the landing can offer a way back into earlier work.
export default async function Home() {
  const recent = await db
    .select({
      id: pages.id,
      title: pages.title,
      prompt: pages.prompt,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .orderBy(desc(pages.updatedAt))
    .limit(12);

  return <Workspace initialPage={null} recentPages={recent} />;
}
