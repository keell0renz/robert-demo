import { defineTool } from "eve/tools";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { UINodeSchema } from "../../src/os/schema";
import { db } from "../../src/db";
import { apps } from "../../src/db/schema";

// Revise an EXISTING application in place. Pass the `id` you got back from
// `create_application` (or an earlier update) and the COMPLETE updated tree —
// not a diff. Scoped to this session so one workspace can't edit another's apps.
export default defineTool({
  description:
    "Update an existing application you already created. Pass its `id` (returned " +
    "by `create_application`) and the COMPLETE updated `tree` (the whole Window, " +
    "not a diff). Optionally change `title`/`letter`. Use this whenever the user " +
    "asks to change an app that exists, instead of creating a new one.",
  inputSchema: z.object({
    id: z.string().describe("The id of the app to update (from create_application)."),
    title: z.string().optional().describe("New app name, if it changed."),
    letter: z
      .string()
      .length(1)
      .regex(/[A-Za-z]/, "one A–Z letter")
      .optional()
      .describe("New icon letter, if it changed."),
    tree: UINodeSchema.describe("The complete updated root UI node. Must be a Window."),
  }),
  async execute({ id, title, letter, tree }, ctx) {
    const sessionId = ctx.session.id;
    const [row] = await db
      .update(apps)
      .set({
        tree,
        updatedAt: new Date(),
        ...(title ? { title } : {}),
        ...(letter ? { letter: letter.toUpperCase() } : {}),
      })
      .where(and(eq(apps.id, id), eq(apps.sessionId, sessionId)))
      .returning({ id: apps.id, title: apps.title });
    if (!row) return { id, updated: false, error: "No app with that id in this workspace." };
    return { id: row.id, title: row.title, updated: true };
  },
});
