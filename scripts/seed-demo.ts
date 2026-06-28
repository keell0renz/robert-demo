// One-off: insert the canonical EXAMPLE_TREE as a page so /page/{id} has
// something to render without invoking the agent.
//   node --env-file-if-exists=.env --import tsx scripts/seed-demo.ts
import { db } from "../src/db";
import { pages } from "../src/db/schema";
import { EXAMPLE_TREE } from "../src/os/vocabulary";

async function main() {
  const [row] = await db
    .insert(pages)
    .values({
      title: "Customs Dashboard",
      prompt: "A customs declarations dashboard with a sidebar and a pending list",
      tree: EXAMPLE_TREE,
    })
    .returning({ id: pages.id });

  console.log(`Seeded page: /${row.id}`);
  process.exit(0);
}

void main();
