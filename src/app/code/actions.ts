"use server";

import { db } from "@/db";
import { codeSessions } from "@/db/schema";

// Persist the Path-B chat so revisiting /code/{id} reopens the conversation.
// Keyed on the client-minted workspace id. The row is also created by the tools
// (so apps can land before this fires), hence the upsert.
export async function persistCodeChat(sessionId: string, messages: unknown[]) {
  await db
    .insert(codeSessions)
    .values({ id: sessionId, messages, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: codeSessions.id,
      set: { messages, updatedAt: new Date() },
    });
}
