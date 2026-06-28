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
    // A single A–Z character; the dock icon's fallback before a real icon is
    // generated (and while one is generating).
    letter: text("letter").notNull().default("A"),
    // A generated app logo as a PNG data URL (`data:image/png;base64,...`).
    // Null until the agent calls set_app_icon. Stored inline — it's a demo, so
    // efficiency is not a concern.
    icon: text("icon"),
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

// ── Path B (the React-code demo) ────────────────────────────────────────────
// A completely separate world from Path A above. Where Path A persists a closed
// JSON vocabulary (`apps.tree`) that a safe interpreter walks, Path B persists
// the ACTUAL React/TSX SOURCE the model writes and the browser compiles + evals
// it at runtime. Different tables so the two demos never touch each other.

// One Path-B desktop workspace. Unlike eve's durable session, the React demo
// drives chat through the Vercel AI SDK, so we just stash the UIMessage[] JSON
// here to rehydrate the conversation when /code/{id} is reopened.
export const codeSessions = pgTable("code_sessions", {
  // A client-generated workspace id (uuid) — also the /code/{id} URL.
  id: text("id").primaryKey(),
  // The AI SDK UIMessage[] log, persisted so the chat replays on reload.
  messages: jsonb("messages").$type<unknown[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// One generated React app on a Path-B desktop: its TSX SOURCE (not a spec) plus
// the same dock metadata as Path A. The client compiles `code` with Sucrase and
// evaluates it — unsafe by construction, which is the entire point of the demo.
export const codeApps = pgTable(
  "code_apps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: text("session_id").notNull(),
    title: text("title").notNull().default("Untitled"),
    // Single A–Z dock-icon fallback, exactly like `apps.letter`.
    letter: text("letter").notNull().default("A"),
    // The request that created the app (kept for listings/history).
    prompt: text("prompt").notNull(),
    // The complete React/TSX component source the model wrote. Compiled and
    // eval'd in the browser to render the app — stored verbatim.
    code: text("code").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("code_apps_session_idx").on(t.sessionId)],
);

export type CodeSession = typeof codeSessions.$inferSelect;
export type NewCodeSession = typeof codeSessions.$inferInsert;
export type CodeApp = typeof codeApps.$inferSelect;
export type NewCodeApp = typeof codeApps.$inferInsert;
