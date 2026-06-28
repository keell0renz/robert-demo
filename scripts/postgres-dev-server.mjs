import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { getServiceFiles, removeFile, runCommand, writePid } from "./backend-service-lib.mjs";

const host = process.env.POSTGRES_HOST ?? "127.0.0.1";
const port = process.env.POSTGRES_PORT ?? "54322";
const dataDir = process.env.POSTGRES_DATA_DIR ?? path.join(os.homedir(), ".local", "share", "robert-demo", "pgdata");
const serviceName = "postgres";
const { logPath, pidPath } = getServiceFiles(serviceName);

function resolveBinDir() {
  const candidates = [process.env.POSTGRES_BIN_DIR, "/opt/homebrew/opt/postgresql@17/bin", "/usr/local/opt/postgresql@17/bin"].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "pg_ctl"))) {
      return candidate;
    }
  }

  console.error("PostgreSQL 17 binaries not found. Install with: brew install postgresql@17");
  process.exit(1);
}

const binDir = resolveBinDir();

function pgCommand(name, args, options = {}) {
  return runCommand(path.join(binDir, name), args, options);
}

function isInitialized() {
  return fs.existsSync(path.join(dataDir, "PG_VERSION"));
}

function ensureInitialized() {
  if (isInitialized()) {
    return;
  }

  fs.mkdirSync(dataDir, { recursive: true });

  // Trust auth is dev-only by design: the server binds to localhost and the
  // existing postgres:postgres URLs in .env keep working unchanged.
  const result = pgCommand("initdb", ["-D", dataDir, "-U", "postgres", "--auth=trust", "--encoding=UTF8"]);

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || "initdb failed\n");
    process.exit(result.status ?? 1);
  }

  console.log(`Initialized Postgres data dir at ${dataDir}`);
}

function isAccepting() {
  return pgCommand("pg_isready", ["-h", host, "-p", port, "-q"]).status === 0;
}

function isServerProcessAlive() {
  return pgCommand("pg_ctl", ["status", "-D", dataDir]).status === 0;
}

function getStatus() {
  return {
    details: `postgresql://${host}:${port}/postgres`,
    name: serviceName,
    status: isAccepting() ? "running" : "stopped",
  };
}

function writePostmasterPid() {
  const postmasterFile = path.join(dataDir, "postmaster.pid");

  if (!fs.existsSync(postmasterFile)) {
    return;
  }

  const firstLine = fs.readFileSync(postmasterFile, "utf8").split("\n")[0]?.trim();
  if (firstLine) {
    writePid(pidPath, Number(firstLine));
  }
}

function start() {
  const status = getStatus();

  if (status.status === "running") {
    console.log(`Postgres dev server already running on ${status.details}`);
    return;
  }

  ensureInitialized();
  removeFile(pidPath);

  // -w (default) blocks until the server accepts connections.
  const result = pgCommand("pg_ctl", ["start", "-D", dataDir, "-l", logPath, "-o", `-p ${port}`]);

  if (result.status !== 0 || !isAccepting()) {
    process.stderr.write(result.stderr || result.stdout || "Failed to start Postgres dev server\n");
    process.exit(result.status || 1);
  }

  writePostmasterPid();
  console.log(`Postgres dev server started on ${getStatus().details}`);
}

function stop() {
  if (!isServerProcessAlive()) {
    removeFile(pidPath);
    console.log("Postgres dev server is not running");
    return;
  }

  const result = pgCommand("pg_ctl", ["stop", "-D", dataDir, "-m", "fast"]);

  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || "Failed to stop Postgres dev server\n");
    process.exit(result.status ?? 1);
  }

  removeFile(pidPath);
  console.log("Postgres dev server stopped");
}

function status() {
  const serviceStatus = getStatus();

  if (serviceStatus.status === "running") {
    console.log(`Postgres dev server is running on ${serviceStatus.details}`);
    return;
  }

  // A live postmaster that no longer accepts connections is a wedged server,
  // not a stopped one — report it honestly so nobody starts a second cluster.
  if (isServerProcessAlive()) {
    console.log(`Postgres dev server process is alive but not accepting connections on ${serviceStatus.details} (wedged — try restart)`);
  } else {
    console.log(`Postgres dev server is not running on ${serviceStatus.details}`);
  }

  process.exit(1);
}

const command = process.argv[2];

if (command === "start") {
  start();
} else if (command === "stop") {
  stop();
} else if (command === "restart") {
  if (isServerProcessAlive()) {
    stop();
  }
  start();
} else if (command === "status") {
  status();
} else {
  console.error("Usage: node scripts/postgres-dev-server.mjs <start|stop|status|restart>");
  process.exit(1);
}
