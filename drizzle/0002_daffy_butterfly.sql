CREATE TABLE "code_apps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"letter" text DEFAULT 'A' NOT NULL,
	"prompt" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"messages" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "code_apps_session_idx" ON "code_apps" USING btree ("session_id");