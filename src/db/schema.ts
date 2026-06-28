import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { UINode } from "../os/types";

// A `page` is one generation: the user's prompt plus the macOS-style UI tree
// the agent produced (Path A — a jsonb component tree, not code). Rendered at
// /page/{id} by walking the tree through the REGISTRY.
export const pages = pgTable("pages", {
  id: uuid("id").defaultRandom().primaryKey(),
  prompt: text("prompt").notNull(),
  title: text("title").notNull().default("Untitled"),
  // The generated UI tree (validated against UINodeSchema before it lands here).
  tree: jsonb("tree").$type<UINode>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
