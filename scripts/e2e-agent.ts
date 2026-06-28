// End-to-end: ask the running agent to design a page, then confirm it called
// save_page and a valid tree landed in the DB (validates the recursive Zod
// schema -> structured output loop).
//   fnm exec --using=24 node --env-file=.env --import tsx scripts/e2e-agent.ts
import { Client } from "eve/client";
import { desc } from "drizzle-orm";
import { db } from "../src/db";
import { pages } from "../src/db/schema";
import { UINodeSchema } from "../src/os/schema";

async function main() {
  const before = await db.select().from(pages);
  const client = new Client({ host: "http://127.0.0.1:3000" });
  const session = client.session();

  console.log("→ sending prompt to agent…");
  const res = await session.send(
    "Design a settings page for a mail app: an account section and a few toggles for notifications.",
  );
  await res.result();
  console.log("← agent turn settled");

  const after = await db.select().from(pages).orderBy(desc(pages.createdAt)).limit(1);
  if (after.length <= 0 || before.some((p) => p.id === after[0].id)) {
    console.log("❌ no new page row was created");
    process.exit(1);
  }
  const row = after[0];
  const parsed = UINodeSchema.safeParse(row.tree);
  console.log(`✓ new page: /page/${row.id}`);
  console.log(`  title: ${row.title}`);
  console.log(`  root type: ${(row.tree as { type?: string }).type}`);
  console.log(`  tree re-validates against UINodeSchema: ${parsed.success}`);
  process.exit(0);
}

void main();
