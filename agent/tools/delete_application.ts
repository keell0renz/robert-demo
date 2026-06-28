import { defineTool } from "eve/tools";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../../src/db";
import { apps } from "../../src/db/schema";

// Remove an application from the desktop entirely (its window and dock icon go
// away). Scoped to this session. Use only when the user asks to delete/remove an
// app — not to revise one (that's `update_application`).
export default defineTool({
  description:
    "Delete an application from the desktop. Pass its `id` (from " +
    "create_application). Removes the window and its dock icon. Use only when the " +
    "user explicitly wants an app gone.",
  inputSchema: z.object({
    id: z.string().describe("The id of the app to delete."),
  }),
  async execute({ id }, ctx) {
    const sessionId = ctx.session.id;
    const [row] = await db
      .delete(apps)
      .where(and(eq(apps.id, id), eq(apps.sessionId, sessionId)))
      .returning({ id: apps.id });
    return { id, deleted: Boolean(row) };
  },
});
