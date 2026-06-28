CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt" text NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"tree" jsonb NOT NULL,
	"session_id" text,
	"chat_events" jsonb,
	"chat_session" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pages_session_id_unique" UNIQUE("session_id")
);
