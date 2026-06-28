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
- [`agent/tools/save_page.ts`](./agent/tools/save_page.ts) — the one real tool: **upserts the UI tree by `ctx.session.id`** so follow-up turns amend the same page.
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

## The workspace (host UI)

The product is one client surface, [`Workspace`](./src/components/workspace/workspace.tsx),
rendered by both routes:

- **`/`** — a landing hero with a prompt composer. The first message starts a
  durable eve session; the moment the agent's first `save_page` lands, the URL
  becomes **`/{id}` in place** (`history.replaceState` — no navigation, the
  session keeps streaming into the same mounted component).
- **`/{id}`** — the same workspace, hydrated from the DB: the macOS artifact on
  the left, a **collapsible/resizable right rail** holding the agent chat. New
  messages **amend the page live** — the artifact zone re-renders from the
  latest `save_page` tool input as it streams. No links, no new pages.

The rail reproduces the customs-os copilot pattern (a fixed `<aside>` sliding via
`translateX` + `padding-right` push on the main wrapper; width persisted to
`localStorage`; ⌘I toggles it). The conversation is persisted (`chat_events` +
`chat_session` columns, via the [`persistChat`](./src/app/actions.ts) server
action in `onFinish`), so revisiting `/{id}` **resumes the same durable session**
and amends keep hitting the same row.

### Host chrome (mirror-ui)

The host UI uses the **mirror-ui (AlignUI) design system copied from customs-os**:
the token foundation ([`src/styles/mirror-ui.css`](./src/styles/mirror-ui.css) +
[`globals.css`](./src/app/globals.css)), `cn`/`tv` utils, a subset of
[`components/ui`](./src/components/ui), and the
[chat composer block](./src/components/blocks/chat). `mirror-ui` on `<body>`
(see [`layout.tsx`](./src/app/layout.tsx)) activates it; `next-themes` drives
light/dark. This is **separate from** the macOS generative system below — the
agent only composes the macOS primitives, never the host chrome.

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
validates + upserts (by session) → the workspace renders `<Render node={tree} />`
in the artifact stage and the URL becomes `/{id}`. See
[`/demo`](./src/app/demo/page.tsx) for the renderer driven by a static
`EXAMPLE_TREE`, no DB or agent.

Not yet built (upgrade seams): a self-correcting retry loop that feeds Zod
errors back to the model, named-action indirection for behavior, and
Radix-backed overlay primitives (Popover/Menu/Select/Dialog).
