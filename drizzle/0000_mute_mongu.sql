CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt" text NOT NULL,
	"markup" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
