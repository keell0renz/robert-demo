import { defineTool } from "eve/tools";
import { z } from "zod";
import { UINodeSchema } from "../../src/os/schema";
import { db } from "../../src/db";
import { pages } from "../../src/db/schema";

// The one real tool: persist (or amend) the macOS-style UI for this session and
// return its URL. `tree` is typed by UINodeSchema (the closed vocabulary), so
// eve forces the model to emit a renderable tree — structured output IS the
// guardrail. Upserts on the durable session id: the first call creates the
// page, every later call in the same conversation UPDATES the same row, so the
// user can amend by chatting. Relative imports (not `@/`) so eve resolves them.
export default defineTool({
  description:
    "Persist the macOS-style UI you designed and get back its URL. Call this every " +
    "time you finish composing or revising the page. `tree` must be the COMPLETE " +
    "current page as a single root Window node — when amending, emit the whole " +
    "updated tree, not a diff. The page is tied to this conversation, so repeated " +
    "calls update the same page in place.",
  inputSchema: z.object({
    title: z.string().describe("Short page title, e.g. 'Customs Dashboard'."),
    prompt: z.string().describe("The user's original request, restated in one line."),
    tree: UINodeSchema.describe("The complete root UI node. Must be a Window."),
  }),
  async execute({ title, prompt, tree }, ctx) {
    const sessionId = ctx.session.id;
    const [row] = await db
      .insert(pages)
      .values({ title, prompt, tree, sessionId, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: pages.sessionId,
        set: { title, tree, updatedAt: new Date() },
      })
      .returning({ id: pages.id });
    return { id: row.id, url: `/${row.id}` };
  },
});
