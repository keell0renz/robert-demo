// End-to-end amend: two turns in ONE session must upsert a single page row
// (the second message revises the first), proving session-scoped save_page.
//   fnm exec --using=24 node --env-file=.env --import tsx scripts/e2e-amend.ts
import { Client } from "eve/client";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { pages } from "../src/db/schema";

async function main() {
  const client = new Client({ host: "http://127.0.0.1:3000" });
  const session = client.session();

  console.log("→ turn 1: build");
  const r1 = await session.send(
    "Design a notes app: a sidebar of notebooks and a list of notes in the content area.",
  );
  await r1.result();
  const sid = r1.sessionId;
  console.log(`  sessionId: ${sid}`);

  const after1 = await db.select().from(pages).where(eq(pages.sessionId, sid));
  console.log(`  rows for session after turn 1: ${after1.length} (title: ${after1[0]?.title})`);
  const title1 = after1[0]?.title;
  const updated1 = after1[0]?.updatedAt;

  console.log("→ turn 2: amend (add a search field to the toolbar)");
  const r2 = await session.send("Add a search field to the toolbar and a 'New Note' prominent button.");
  await r2.result();

  const after2 = await db.select().from(pages).where(eq(pages.sessionId, sid));
  console.log(`  rows for session after turn 2: ${after2.length}`);
  const changed = (after2[0]?.updatedAt?.getTime() ?? 0) > (updated1?.getTime() ?? 0);

  const pass = after1.length === 1 && after2.length === 1 && changed;
  console.log(pass ? "✓ PASS — one row, updated in place" : "❌ FAIL");
  console.log(`  title turn1=${title1}  title turn2=${after2[0]?.title}  updatedAt changed=${changed}`);
  process.exit(pass ? 0 : 1);
}

void main();
