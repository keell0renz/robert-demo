// One-off: seed a workspace with a couple of apps so /{sessionId} renders
// without invoking the agent.
//   node --env-file-if-exists=.env --import tsx scripts/seed-demo.ts
import { db } from "../src/db";
import { apps, sessions } from "../src/db/schema";
import { EXAMPLE_TREE } from "../src/os/vocabulary";

async function main() {
  const sessionId = "seed-demo-workspace";
  await db.insert(sessions).values({ id: sessionId }).onConflictDoNothing();

  await db
    .insert(apps)
    .values({
      sessionId,
      title: "Customs Dashboard",
      letter: "C",
      prompt: "A customs declarations dashboard with a sidebar and a pending list",
      tree: EXAMPLE_TREE,
    });

  console.log(`Seeded workspace: /${sessionId}`);
  process.exit(0);
}

void main();
