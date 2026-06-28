import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { Workspace, type InitialPage } from "@/components/workspace/workspace";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The workspace for a saved page: load the row, hydrate the artifact + the
// durable chat so the conversation resumes and the agent amends the same page.
export default async function PageWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const [row] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!row) notFound();

  const initialPage: InitialPage = {
    id: row.id,
    title: row.title,
    tree: row.tree,
    chatEvents: row.chatEvents ?? null,
    chatSession: row.chatSession ?? null,
  };
  return <Workspace initialPage={initialPage} />;
}
