// End-to-end amend: two turns in ONE session. Turn 1 creates an app; turn 2
// revises it. The session must still have ONE app row, updated in place (proving
// the agent uses update_application, not a second create_application).
//   fnm exec --using=24 node --env-file=.env --import tsx scripts/e2e-amend.ts
import { Client } from "eve/client";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { apps } from "../src/db/schema";

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

  const after1 = await db.select().from(apps).where(eq(apps.sessionId, sid));
  console.log(`  apps for session after turn 1: ${after1.length} (title: ${after1[0]?.title})`);
  const title1 = after1[0]?.title;
  const updated1 = after1[0]?.updatedAt;

  console.log("→ turn 2: amend (add a search field to the toolbar)");
  const r2 = await session.send("Add a search field to the toolbar and a 'New Note' prominent button.");
  await r2.result();

  const after2 = await db.select().from(apps).where(eq(apps.sessionId, sid));
  console.log(`  apps for session after turn 2: ${after2.length}`);
  const changed = (after2[0]?.updatedAt?.getTime() ?? 0) > (updated1?.getTime() ?? 0);

  const pass = after1.length === 1 && after2.length === 1 && changed;
  console.log(pass ? "✓ PASS — one app, updated in place" : "❌ FAIL");
  console.log(`  title turn1=${title1}  title turn2=${after2[0]?.title}  updatedAt changed=${changed}`);
  process.exit(pass ? 0 : 1);
}

void main();
