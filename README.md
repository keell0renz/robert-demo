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
```

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

The home page (`src/app/page.tsx`) is a minimal chat using eve's `useEveAgent`
hook (`eve/react`) against those same-origin routes — a smoke test for the
wiring. The real macOS-style generative UI system is built on top of this.
