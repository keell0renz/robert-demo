// One-command dev: brings up local Postgres, applies migrations, runs Next,
// and stops Postgres again when you quit (Ctrl-C). Like customs-os' dev stack,
// trimmed to the two services this project actually has.
//
//   pnpm dev          start pg -> migrate -> next dev; stop pg on exit
//   KEEP_PG=1 pnpm dev leave Postgres running after Next exits (faster restarts)

import { spawn, spawnSync } from "node:child_process";

const keepPg = process.env.KEEP_PG === "1";

function run(label, command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`\n[dev] ${label} failed (exit ${result.status ?? "signal"}).`);
    process.exit(result.status ?? 1);
  }
}

// Like run(), but swallows output on success — drizzle-kit's migrator emits a
// NOTICE on every run (CREATE SCHEMA/TABLE IF NOT EXISTS for its bookkeeping),
// which is just noise. On failure we dump everything so it stays debuggable.
function runQuiet(label, command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    console.error(`\n[dev] ${label} failed (exit ${result.status ?? "signal"}).`);
    process.exit(result.status ?? 1);
  }
}

function stopPostgres() {
  if (keepPg) {
    console.log("[dev] KEEP_PG=1 — leaving Postgres running (pnpm postgres:stop to stop).");
    return;
  }
  console.log("\n[dev] stopping Postgres ...");
  spawnSync("node", ["scripts/postgres-dev-server.mjs", "stop"], { stdio: "inherit" });
}

// 1. infrastructure first
run("postgres:start", "node", ["scripts/postgres-dev-server.mjs", "start"]);

// 2. schema up to date (quiet — only speaks up if migration fails)
console.log("[dev] applying migrations ...");
runQuiet("db:migrate", "pnpm", ["db:migrate"]);

// 3. app in the foreground
console.log("[dev] starting Next ...");
const next = spawn("pnpm", ["exec", "next", "dev"], { stdio: "inherit" });

let cleanedUp = false;
function cleanup() {
  if (cleanedUp) return;
  cleanedUp = true;
  stopPostgres();
}

// Forward termination to Next, then tear down Postgres once it has exited.
// (A real terminal Ctrl-C already hits the whole group; forwarding also covers
// `kill <pid>` of just this orchestrator.)
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => next.kill(signal));
}

next.on("exit", (code) => {
  cleanup();
  process.exit(code ?? 0);
});
