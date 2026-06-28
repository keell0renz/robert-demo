import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { codeApps, codeSessions } from "@/db/schema";
import { SYSTEM_PROMPT } from "@/code/prompt";

// Path B's backend. Unlike Path A (the eve agent at /eve/v1/*), this is a plain
// Next.js route driving Claude Opus 4.8 through the Vercel AI SDK directly. The
// tools write the React SOURCE the model authors into `code_apps`; the client
// compiles + evaluates it. Streaming is the AI SDK's UI message stream, so the
// code "types out" into the window the same way Path A's tree does.

export const maxDuration = 120;

// The desktop this turn belongs to. The client mints it (crypto.randomUUID) and
// sends it alongside the messages so the tools know where to persist apps.
async function ensureSession(sessionId: string) {
  await db.insert(codeSessions).values({ id: sessionId }).onConflictDoNothing();
}

export async function POST(req: Request) {
  const { messages, sessionId } = (await req.json()) as {
    messages: UIMessage[];
    sessionId: string;
  };

  if (!sessionId) {
    return new Response("Missing sessionId", { status: 400 });
  }

  const result = streamText({
    model: anthropic("claude-opus-4-8"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    // Let the model create several apps (and reply) in one turn.
    stopWhen: stepCountIs(12),
    tools: {
      create_react_app: tool({
        description:
          "Create a NEW macOS-style React app on the desktop and get back its id. " +
          "Use one call per distinct app. `code` must be the COMPLETE React component " +
          "source (default-exported `App`), following the code contract in the system prompt.",
        inputSchema: z.object({
          title: z.string().describe("Short app name shown in the title bar and dock."),
          letter: z
            .string()
            .length(1)
            .regex(/[A-Za-z]/, "one A–Z letter")
            .describe("A single A–Z character for the dock icon."),
          prompt: z.string().describe("The user's request for this app, restated in one line."),
          code: z.string().describe("The complete React/TSX component source for the app."),
        }),
        async execute({ title, letter, prompt, code }) {
          await ensureSession(sessionId);
          const [row] = await db
            .insert(codeApps)
            .values({
              sessionId,
              title,
              letter: letter.toUpperCase(),
              prompt,
              code,
              updatedAt: new Date(),
            })
            .returning({ id: codeApps.id });
          return { id: row.id, title };
        },
      }),

      update_react_app: tool({
        description:
          "Revise an app you already created. Pass its `id` and the COMPLETE updated `code` " +
          "(optionally a new title/letter). Use this for any change to an existing app.",
        inputSchema: z.object({
          id: z.string().describe("The app id returned by create_react_app."),
          code: z.string().describe("The complete updated React/TSX component source."),
          title: z.string().optional().describe("A new title, if it changed."),
          letter: z
            .string()
            .length(1)
            .regex(/[A-Za-z]/, "one A–Z letter")
            .optional()
            .describe("A new dock letter, if it changed."),
        }),
        async execute({ id, code, title, letter }) {
          const [row] = await db
            .update(codeApps)
            .set({
              code,
              ...(title ? { title } : {}),
              ...(letter ? { letter: letter.toUpperCase() } : {}),
              updatedAt: new Date(),
            })
            .where(and(eq(codeApps.id, id), eq(codeApps.sessionId, sessionId)))
            .returning({ id: codeApps.id });
          if (!row) return { id, ok: false, error: "No app with that id in this workspace." };
          return { id: row.id, ok: true };
        },
      }),

      delete_react_app: tool({
        description: "Remove an app from the desktop entirely. Use only when the user wants it gone.",
        inputSchema: z.object({
          id: z.string().describe("The app id to delete."),
        }),
        async execute({ id }) {
          await db
            .delete(codeApps)
            .where(and(eq(codeApps.id, id), eq(codeApps.sessionId, sessionId)));
          return { id, ok: true };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
