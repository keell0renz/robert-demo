import { defineTool } from "eve/tools";
import { z } from "zod";
import { UINodeSchema } from "../../src/os/schema";
import { db } from "../../src/db";
import { pages } from "../../src/db/schema";

// The one real tool: persist a generated macOS-style UI tree and return its
// URL. `tree` is typed by UINodeSchema (the closed vocabulary), so eve forces
// the model to emit a tree that the renderer can render — structured output IS
// the guardrail. Relative imports (not `@/`) so eve's runtime resolves them.
export default defineTool({
  description:
    "Persist the macOS-style UI you designed and get back its URL. Call this once " +
    "you have composed the full page. `tree` must be a single root Window node built " +
    "only from the allowed component vocabulary.",
  inputSchema: z.object({
    title: z.string().describe("Short page title, e.g. 'Customs Dashboard'."),
    prompt: z.string().describe("The user's request, restated in one line."),
    tree: UINodeSchema.describe("The root UI node. Must be a Window."),
  }),
  async execute({ title, prompt, tree }) {
    const [row] = await db
      .insert(pages)
      .values({ title, prompt, tree })
      .returning({ id: pages.id });
    return { id: row.id, url: `/page/${row.id}` };
  },
});
