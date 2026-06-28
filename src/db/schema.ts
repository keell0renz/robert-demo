import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// A `page` is one generation: the user's query plus the UI markup the agent
// produced for it. Rendered at /page/{id}.
export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  prompt: text("prompt").notNull(),
  // The generated UI markup (the mac-os-style component tree as text/markup).
  markup: text("markup").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
