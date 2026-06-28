import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const backendDir = path.join(process.cwd(), ".log-backend");

function pad(value, width) {
  return String(value).padEnd(width, " ");
}

function ensureBackendDir() {
  fs.mkdirSync(backendDir, { recursive: true });
}

// True when the current checkout is a LINKED git worktree (not the main one).
// Worktrees can't run `ol` (its OTLP collector port 4318 is a singleton), so
// next-dev-server uses this to run Next directly there.
export function isLinkedWorktree() {
  const commonDir = spawnSync("git", ["rev-parse", "--git-common-dir"], { encoding: "utf8" });
  const gitDir = spawnSync("git", ["rev-parse", "--git-dir"], { encoding: "utf8" });

  if (commonDir.status !== 0 || gitDir.status !== 0) {
    return false;
  }

  return path.resolve(commonDir.stdout.trim()) !== path.resolve(gitDir.stdout.trim());
}

export function getServiceFiles(serviceName) {
  ensureBackendDir();

  return {
    logPath: path.join(backendDir, `${serviceName}.log`),
    pidPath: path.join(backendDir, `${serviceName}.pid`),
  };
}

export function readPid(pidPath) {
  if (!fs.existsSync(pidPath)) {
    return null;
  }

  const rawValue = fs.readFileSync(pidPath, "utf8").trim();
  return rawValue ? Number(rawValue) : null;
}

export function writePid(pidPath, pid) {
  fs.writeFileSync(pidPath, `${pid}\n`);
}

export function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function isProcessRunning(pid) {
  if (!pid) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function runCommand(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    ...options,
  });
}

export function spawnDetached(command, args, logPath, extraEnv = {}) {
  ensureBackendDir();

  const outputFd = fs.openSync(logPath, "a");
  const child = spawn(command, args, {
    cwd: process.cwd(),
    detached: true,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: ["ignore", outputFd, outputFd],
  });

  child.unref();
  fs.closeSync(outputFd);

  return child.pid;
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function formatBackendStatusReport(serviceStatuses, title = "Backend Services") {
  const headers = ["Service", "Status", "Details"];
  const rows = serviceStatuses.map((serviceStatus) => [serviceStatus.name, serviceStatus.status, serviceStatus.details]);
  const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => String(row[index] ?? "").length)));

  const lines = [
    title,
    `${pad(headers[0], widths[0])}  ${pad(headers[1], widths[1])}  ${headers[2]}`,
    `${"-".repeat(widths[0])}  ${"-".repeat(widths[1])}  ${"-".repeat(widths[2])}`,
  ];

  for (const row of rows) {
    lines.push(`${pad(row[0], widths[0])}  ${pad(row[1], widths[1])}  ${row[2]}`);
  }

  return lines.join("\n");
}
