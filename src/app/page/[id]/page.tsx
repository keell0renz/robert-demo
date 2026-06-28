import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { Desktop } from "@/os";

// Renders a stored generation: load the row, walk its `tree` through the
// REGISTRY. The jsonb IS the renderer's input — nothing transforms in between.
export default async function GeneratedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  if (!page) notFound();
  return <Desktop node={page.tree} />;
}
