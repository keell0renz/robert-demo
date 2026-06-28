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
//
// We do NOT 404 on a missing row: a freshly-minted id (or a refresh before the
// first turn persisted) should just open an empty desktop bound to that id, not
// a dead end. Once a turn finishes, the row exists and the apps come back.
export default async function SavedCodeWorkspace({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [row] = await db.select().from(codeSessions).where(eq(codeSessions.id, id)).limit(1);

  const initialWorkspace: InitialCodeWorkspace = {
    sessionId: id,
    messages: row?.messages ?? null,
  };
  return <CodeWorkspace initialWorkspace={initialWorkspace} />;
}
