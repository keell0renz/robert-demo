import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { Workspace, type InitialWorkspace } from "@/components/workspace/workspace";

// A saved workspace: load the session row and hydrate the durable chat so the
// conversation resumes. The chat stream reconstructs every app on the desktop
// (the apps table is the durable copy the tools wrote).
export default async function SessionWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  if (!row) notFound();

  const initialWorkspace: InitialWorkspace = {
    sessionId: row.id,
    chatEvents: row.chatEvents ?? null,
    chatSession: row.chatSession ?? null,
  };
  return <Workspace initialWorkspace={initialWorkspace} />;
}
