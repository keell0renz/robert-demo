# robert-demo

Self-generating macOS-style generative UI demo. See [`IDEA.md`](./IDEA.md).

Stack: **Next.js (App Router)** + **Drizzle ORM** on a **local Postgres** + the **[eve](https://eve.dev) agent framework** as the backend (Claude Opus 4.8 via Anthropic). No auth UI, no component library yet.

## Prerequisites

- **Node 24+** (required by eve) — this repo pins it via [`.node-version`](./.node-version); with [fnm](https://github.com/Schniz/fnm) installed it auto-switches on `cd`.
- pnpm 10+
- Postgres 17 (local dev server runs from the Homebrew binaries):
  ```bash
  brew install postgresql@17
  ```
- `.env` with `DATABASE_URL`, `DIRECT_URL` (local) and `ANTHROPIC_API_KEY`. See [`.env.example`](./.env.example).

## Local database (no Docker)

A throwaway Postgres cluster is managed by `scripts/postgres-dev-server.mjs`
(data dir: `~/.local/share/robert-demo/pgdata`, port `54322`, trust auth).

```bash
pnpm postgres:start     # init (first run) + start
pnpm postgres:status
pnpm postgres:stop
pnpm postgres:restart
```

## Schema & migrations (Drizzle)

Schema lives in [`src/db/schema.ts`](./src/db/schema.ts); the client is [`src/db/index.ts`](./src/db/index.ts).

```bash
pnpm db:generate   # generate SQL migration from schema -> drizzle/
pnpm db:migrate    # apply migrations
pnpm db:push       # push schema directly (fast dev iteration)
pnpm db:studio     # drizzle studio
pnpm db:reset      # DROP public schema + push (local only)
pnpm db:seed       # insert the EXAMPLE_TREE demo page
```

The `pages` table stores one generation per row: the user `prompt`, a `title`,
and the `tree` (a `jsonb` macOS UI tree — see below). Rendered at `/page/{id}`.

## Develop

```bash
pnpm dev           # http://localhost:3000
```

`pnpm dev` (`scripts/dev.mjs`) handles the whole stack: it **starts Postgres**,
**applies migrations**, then runs **Next** in the foreground. On **Ctrl-C** it
shuts Next down and **stops Postgres** again. Use `KEEP_PG=1 pnpm dev` to leave
Postgres running after Next exits (faster restarts); `pnpm dev:next` runs Next
alone without touching the database.

## The agent backend (eve)

The agent is an [eve](https://eve.dev) app under [`agent/`](./agent):

- [`agent/agent.ts`](./agent/agent.ts) — runtime config; model is `anthropic("claude-opus-4-8")`.
- [`agent/instructions.md`](./agent/instructions.md) — the always-on system prompt.
- [`agent/tools/`](./agent/tools) — typed tools (`get_weather.ts` is a placeholder; replace with the real page-building tools).
- [`agent/channels/eve.ts`](./agent/channels/eve.ts) — the HTTP channel + auth policy.

[`next.config.ts`](./next.config.ts) wraps the Next config with `withEve()`, so
eve mounts its HTTP API on the same origin and `pnpm dev` boots the eve dev
server alongside `next dev` — no separate process, no CORS. The stable API:

```
POST /eve/v1/session              # start a durable session
GET  /eve/v1/session/:id/stream   # NDJSON event stream
POST /eve/v1/session/:id          # follow-up (with continuationToken)
```

Inspect the discovered agent surface any time with `npx eve info`.

The home page (`src/app/page.tsx`) takes a prompt, sends it to the agent with
`useEveAgent` (`eve/react`), and surfaces the `save_page` result as a link to
the generated page.

## The macOS generative UI system (`src/os/`)

This is **Path A — spec-over-code**: the agent never writes CSS or markup. It
*composes* a closed set of primitives into a JSON tree, we store the tree as
`jsonb`, and a ~15-line recursive renderer walks it. Off-vocabulary output is
unrenderable, not just ugly — the guardrail is structural.

- [`tokens.css`](./src/os/tokens.css) — all the design intelligence (macOS
  color/type/metrics/elevation, light + dark, a glass layer that falls back to
  solid under *Reduce transparency*). Scoped to `.os-root`. The agent never
  touches it.
- [`primitives/`](./src/os/primitives) — the 13-component vocabulary (Window,
  Sidebar, Toolbar, Content, Card, Text, Button, ListRow, TextField, Switch,
  SegmentedControl, Badge, Divider), each reading the tokens. Icons come from a
  closed [icon set](./src/os/primitives/icons.tsx) mapped onto Lucide.
- [`schema.ts`](./src/os/schema.ts) — the vocabulary as a recursive Zod schema.
  It is the **single source of truth**: wired into `save_page`'s `inputSchema`,
  so eve forces the model to emit a tree that matches (structured output). A
  type or prop that isn't here is unrepresentable.
- [`registry.ts`](./src/os/registry.ts) — `type` → component. The design system
  and the renderer are the same object. Adding a primitive = write it + add one
  line; keep it in lockstep with `schema.ts`.
- [`Render.tsx`](./src/os/Render.tsx) — the engine. No hooks, so it renders
  inside a server component and freely mounts the `"use client"` primitives
  underneath. `Desktop` wraps a tree in a wallpaper frame.

Flow: prompt → agent composes a tree → [`save_page`](./agent/tools/save_page.ts)
validates + inserts → returns `/page/{id}` → that route loads the row and renders
`<Desktop node={tree} />`. See [`/demo`](./src/app/demo/page.tsx) for the same
renderer driven by a static `EXAMPLE_TREE`, no DB or agent.

Not yet built (upgrade seams): a self-correcting retry loop that feeds Zod
errors back to the model, named-action indirection for behavior, and
Radix-backed overlay primitives (Popover/Menu/Select/Dialog).
