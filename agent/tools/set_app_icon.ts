import { defineTool } from "eve/tools";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../../src/db";
import { apps } from "../../src/db/schema";
import { generateAppIcon } from "../../src/lib/icon";

// Generate a real macOS-style icon for an app and attach it to its dock tile.
// The visual style is fixed in the icon lib — you only choose the SUBJECT. Slow
// (~10-20s) because it runs image generation, so call it once per app right
// after create_application. Until it lands, the dock shows the app's letter.
export default defineTool({
  description:
    "Generate and attach a real app icon for an app you created. Pass the app `id` " +
    "and a short `subject` describing ONLY the imagery (no text/letters), e.g. " +
    "'a steaming coffee cup', 'a blue weather cloud with sun', 'a green checklist'. " +
    "Call once per app after creating it; the dock shows the letter until it's ready.",
  inputSchema: z.object({
    id: z.string().describe("The app id returned by create_application."),
    subject: z
      .string()
      .describe("Short visual brief for the icon imagery only — no text or letters."),
  }),
  async execute({ id, subject }, ctx) {
    const sessionId = ctx.session.id;
    const icon = await generateAppIcon(subject);
    const [row] = await db
      .update(apps)
      .set({ icon, updatedAt: new Date() })
      .where(and(eq(apps.id, id), eq(apps.sessionId, sessionId)))
      .returning({ id: apps.id });
    if (!row) return { id, ok: false, error: "No app with that id in this workspace." };
    return { id: row.id, ok: true };
  },
});
