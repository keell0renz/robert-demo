import { defineTool } from "eve/tools";
import { z } from "zod";
import { UINodeSchema } from "../../src/os/schema";
import { db } from "../../src/db";
import { apps, sessions } from "../../src/db/schema";

// Create a NEW application on this workspace's desktop. Each call adds a fresh
// app row (its own window + dock icon) — use it for a genuinely distinct app,
// NOT to revise one you already made (that's `update_application`). `tree` is
// typed by UINodeSchema (the closed vocabulary), so structured output IS the
// guardrail. Returns the new app's `id`, which you reference later to update or
// delete it. Relative imports (not `@/`) so eve resolves them.
export default defineTool({
  description:
    "Create a NEW macOS-style application on the desktop and get back its id. " +
    "Use this for each distinct app the user wants (a Settings app, a Mail app, " +
    "a Tracker — separate apps). Do NOT use it to revise an app you already " +
    "created; call `update_application` with that app's id instead. `tree` must " +
    "be the COMPLETE app as a single root Window node. `letter` is one uppercase " +
    "A–Z character used as the app's icon — pick one that fits the app and isn't " +
    "already taken by another app this session.",
  inputSchema: z.object({
    title: z.string().describe("Short app name shown in the title bar and dock, e.g. 'Settings'."),
    letter: z
      .string()
      .length(1)
      .regex(/[A-Za-z]/, "one A–Z letter")
      .describe("A single A–Z character for the app's lettered icon, e.g. 'S'."),
    prompt: z.string().describe("The user's request for this app, restated in one line."),
    tree: UINodeSchema.describe("The complete root UI node. Must be a Window."),
  }),
  async execute({ title, letter, prompt, tree }, ctx) {
    const sessionId = ctx.session.id;
    // Make sure the workspace row exists so chat persistence has somewhere to land.
    await db.insert(sessions).values({ id: sessionId }).onConflictDoNothing();
    const [row] = await db
      .insert(apps)
      .values({
        sessionId,
        title,
        letter: letter.toUpperCase(),
        prompt,
        tree,
        updatedAt: new Date(),
      })
      .returning({ id: apps.id });
    return { id: row.id, title };
  },
});
