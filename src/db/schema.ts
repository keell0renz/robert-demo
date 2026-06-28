import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { UINode } from "../os/types";

// A `page` is one workspace: the generated macOS-style UI tree (Path A — a
// jsonb component tree, not code) plus the durable agent chat that produced and
// amends it. One row per artifact; the agent upserts it by `sessionId` so
// follow-up messages amend the same page instead of creating new ones.
// Rendered + chatted at /{id}.
export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  // The first prompt that created the page (kept for listings/history).
  prompt: text("prompt").notNull(),
  title: text("title").notNull().default("Untitled"),
  // The current UI tree (validated against UINodeSchema before it lands here).
  tree: jsonb("tree").$type<UINode>().notNull(),
  // The eve durable session that owns this page. `save_page` upserts on it, so
  // amends update this row. Unique → one page per session.
  sessionId: text("session_id").unique(),
  // Persisted chat so revisiting /{id} reopens the conversation: the rendered
  // event log + the session cursor ({ sessionId, continuationToken, streamIndex }).
  chatEvents: jsonb("chat_events").$type<unknown[]>(),
  chatSession: jsonb("chat_session").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
