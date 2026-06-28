"use server";

import { db } from "@/db";
import { sessions } from "@/db/schema";

// Persist the durable chat so revisiting /{sessionId} reopens the conversation.
// Keyed on the eve session id (the workspace). The session row is also created
// by the app tools, but a workspace can accumulate chat before any app exists,
// so upsert here too.
export async function persistChat(
  sessionId: string,
  snapshot: { events: unknown[]; session: Record<string, unknown> | null },
) {
  await db
    .insert(sessions)
    .values({
      id: sessionId,
      chatEvents: snapshot.events,
      chatSession: snapshot.session,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: sessions.id,
      set: {
        chatEvents: snapshot.events,
        chatSession: snapshot.session,
        updatedAt: new Date(),
      },
    });
}
