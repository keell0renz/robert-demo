// Wipe + re-push schema to the LOCAL dev database. Refuses to touch a
// non-local DATABASE_URL. (No seed step yet — add one when the app needs it.)
//
//   pnpm db:reset            wipe + push
//
// Env is loaded via node --env-file-if-exists (see package.json), so
// DATABASE_URL / DIRECT_URL come from .env (+ .env.local overlay).

import { spawnSync } from "node:child_process";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL not set — run via `pnpm db:reset` (loads .env / .env.local).");
  process.exit(1);
}

let host = "";
try {
  host = new URL(url).hostname;
} catch {
  host = "";
}

if (host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Refusing to reset a non-local database (host="${host}"). DATABASE_URL must point at 127.0.0.1 / localhost.`);
  process.exit(1);
}

const dbName = (() => {
  try {
    return new URL(url).pathname.slice(1) || "(unknown)";
  } catch {
    return "(unknown)";
  }
})();

console.log(`Resetting "${dbName}" — DROP SCHEMA public CASCADE; CREATE SCHEMA public ...`);
const drop = spawnSync("psql", [url, "-v", "ON_ERROR_STOP=1", "-c", "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"], { stdio: "inherit" });

if (drop.status !== 0) {
  console.error("Schema drop failed — is Postgres running (pnpm postgres:status)?");
  process.exit(drop.status ?? 1);
}

console.log("Pushing schema (drizzle-kit push --force) ...");
const push = spawnSync("pnpm", ["db:push", "--force"], { env: process.env, stdio: "inherit" });

if (push.status !== 0) {
  console.error("db:push failed.");
  process.exit(push.status ?? 1);
}

console.log("Reset complete.");
