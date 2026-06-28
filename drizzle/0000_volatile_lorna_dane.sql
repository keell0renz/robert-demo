CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt" text NOT NULL,
	"title" text DEFAULT 'Untitled' NOT NULL,
	"tree" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
