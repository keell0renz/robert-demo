import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { UINode } from "../os/types";

// A `session` is one desktop workspace: the durable eve chat that drives it.
// Keyed by the eve session id (`wrun_...`). It owns many `apps`. Persisting the
// chat here lets revisiting /{sessionId} reopen the conversation.
export const sessions = pgTable("sessions", {
  // The eve durable session id — the workspace identity and the URL.
  id: text("id").primaryKey(),
  // Rendered event log + the session cursor ({ sessionId, continuationToken,
  // streamIndex }) so the chat replays on reload.
  chatEvents: jsonb("chat_events").$type<unknown[]>(),
  chatSession: jsonb("chat_session").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// An `app` is one generated macOS-style application living on a workspace's
// desktop: its UI tree (Path A — a jsonb component tree, not code) plus the
// metadata the dock needs (title + a single letter that stands in for an icon).
// The agent creates/updates/deletes these via tools; many apps per session.
export const apps = pgTable(
  "apps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    // The eve session (workspace) this app belongs to.
    sessionId: text("session_id").notNull(),
    title: text("title").notNull().default("Untitled"),
    // A single A–Z character; renders as the app's lettered dock icon (we can't
    // generate real icons yet).
    letter: text("letter").notNull().default("A"),
    // The request that created the app (kept for listings/history).
    prompt: text("prompt").notNull(),
    // The current UI tree (validated against UINodeSchema before it lands here).
    tree: jsonb("tree").$type<UINode>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("apps_session_idx").on(t.sessionId)],
);

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type App = typeof apps.$inferSelect;
export type NewApp = typeof apps.$inferInsert;
