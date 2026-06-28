"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pages } from "@/db/schema";

// Persist the durable chat so revisiting /{id} reopens the conversation. The
// page row is created by the `save_page` tool (keyed on the eve session); here
// we attach the rendered event log + session cursor the browser accumulated.
export async function persistChat(
  pageId: string,
  snapshot: { events: unknown[]; session: Record<string, unknown> | null },
) {
  await db
    .update(pages)
    .set({
      chatEvents: snapshot.events,
      chatSession: snapshot.session,
      updatedAt: new Date(),
    })
    .where(eq(pages.id, pageId));
}
