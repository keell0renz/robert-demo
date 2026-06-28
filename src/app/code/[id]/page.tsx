import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { codeSessions } from "@/db/schema";
import {
  CodeWorkspace,
  type InitialCodeWorkspace,
} from "@/components/code-workspace/code-workspace";

// A saved Path-B desktop: load the persisted UIMessage[] and hand them to
// useChat. The desktop reconstructs from the stream — every create/update tool
// part still carries the React source it wrote, so the apps come back exactly as
// they were (code_apps is the durable copy the tools also wrote).
export default async function SavedCodeWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db.select().from(codeSessions).where(eq(codeSessions.id, id)).limit(1);
  if (!row) notFound();

  const initialWorkspace: InitialCodeWorkspace = {
    sessionId: row.id,
    messages: row.messages ?? null,
  };
  return <CodeWorkspace initialWorkspace={initialWorkspace} />;
}
