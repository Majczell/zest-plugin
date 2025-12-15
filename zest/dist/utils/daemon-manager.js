// src/utils/daemon-manager.ts
import { spawn } from "node:child_process";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { dirname as dirname2, join as join2 } from "node:path";
import { fileURLToPath } from "node:url";

// src/config/constants.ts
import { homedir } from "node:os";
import { join } from "node:path";
var CLAUDE_ZEST_DIR = join(homedir(), ".claude-zest");
var QUEUE_DIR = join(CLAUDE_ZEST_DIR, "queue");
var LOGS_DIR = join(CLAUDE_ZEST_DIR, "logs");
var STATE_DIR = join(CLAUDE_ZEST_DIR, "state");
var SESSION_FILE = join(CLAUDE_ZEST_DIR, "session.json");
var SETTINGS_FILE = join(CLAUDE_ZEST_DIR, "settings.json");
var LOG_FILE = join(LOGS_DIR, "plugin.log");
var SYNC_LOG_FILE = join(LOGS_DIR, "sync.log");
var DAEMON_PID_FILE = join(CLAUDE_ZEST_DIR, "daemon.pid");
var EVENTS_QUEUE_FILE = join(QUEUE_DIR, "events.jsonl");
var SESSIONS_QUEUE_FILE = join(QUEUE_DIR, "chat-sessions.jsonl");
var MESSAGES_QUEUE_FILE = join(QUEUE_DIR, "chat-messages.jsonl");
var PROACTIVE_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
var MAX_DIFF_SIZE_BYTES = 10 * 1024 * 1024;
var STALE_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
var CLAUDE_PROJECTS_DIR = join(homedir(), ".claude", "projects");

// src/utils/logger.ts
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
class Logger {
  minLevel = "info";
  levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  setLevel(level) {
    this.minLevel = level;
  }
  async writeToFile(message) {
    try {
      await mkdir(dirname(LOG_FILE), { recursive: true });
      const timestamp = new Date().toISOString();
      await appendFile(LOG_FILE, `[${timestamp}] ${message}
`, "utf-8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.minLevel];
  }
  debug(message, ...args) {
    if (this.shouldLog("debug")) {
      this.writeToFile(`DEBUG: ${message} ${args.length > 0 ? JSON.stringify(args) : ""}`);
    }
  }
  info(message, ...args) {
    if (this.shouldLog("info")) {
      this.writeToFile(`INFO: ${message} ${args.length > 0 ? JSON.stringify(args) : ""}`);
    }
  }
  warn(message, ...args) {
    if (this.shouldLog("warn")) {
      console.warn(`[Zest:Warn] ${message}`, ...args);
      this.writeToFile(`WARN: ${message} ${args.length > 0 ? JSON.stringify(args) : ""}`);
    }
  }
  error(message, error) {
    if (this.shouldLog("error")) {
      console.error(`[Zest:Error] ${message}`, error);
      this.writeToFile(`ERROR: ${message} ${error instanceof Error ? error.stack : JSON.stringify(error)}`);
    }
  }
}
var logger = new Logger;

// src/utils/daemon-manager.ts
var __filename2 = fileURLToPath(import.meta.url);
var __dirname2 = dirname2(__filename2);
async function startDaemon() {
  try {
    logger.info("Starting sync daemon...");
    const daemonScript = join2(__dirname2, "..", "sync-daemon.js");
    const daemon = spawn(process.execPath, [daemonScript], {
      detached: true,
      stdio: "ignore",
      windowsHide: true
    });
    daemon.unref();
    logger.info(`✓ Daemon started (PID: ${daemon.pid})`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  } catch (error) {
    logger.error("Failed to start daemon:", error);
    return false;
  }
}
async function restartDaemon() {
  try {
    logger.info("Restarting daemon...");
    const pid = await getDaemonPid();
    if (pid) {
      logger.info(`Stopping existing daemon (PID: ${pid})`);
      try {
        process.kill(pid, "SIGTERM");
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        logger.warn(`Failed to stop daemon PID ${pid}:`, error);
      }
      await cleanupPidFile();
    }
    const started = await startDaemon();
    if (started) {
      logger.info("✓ Daemon restarted successfully");
    }
    return started;
  } catch (error) {
    logger.error("Failed to restart daemon:", error);
    return false;
  }
}
async function cleanupPidFile() {
  try {
    await unlink(DAEMON_PID_FILE);
  } catch {}
}
async function writePidFile(pid) {
  try {
    await writeFile(DAEMON_PID_FILE, pid.toString(), "utf-8");
    logger.debug(`Wrote PID ${pid} to daemon.pid`);
  } catch (error) {
    logger.error("Failed to write PID file:", error);
  }
}
async function getDaemonPid() {
  try {
    const pidData = await readFile(DAEMON_PID_FILE, "utf-8");
    const pid = Number.parseInt(pidData.trim(), 10);
    if (Number.isNaN(pid)) {
      return null;
    }
    try {
      process.kill(pid, 0);
      return pid;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}
export {
  writePidFile,
  startDaemon,
  restartDaemon,
  getDaemonPid
};

//# debugId=B554EEEFE1EC7BEA64756E2164756E21
