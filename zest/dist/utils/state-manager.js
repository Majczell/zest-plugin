// src/utils/state-manager.ts
import { mkdir as mkdir2, readFile, writeFile } from "node:fs/promises";
import { join as join2 } from "node:path";

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

// src/utils/state-manager.ts
var STATE_DIR2 = join2(CLAUDE_ZEST_DIR, "state");
function getStateFilePath(sessionId) {
  return join2(STATE_DIR2, `${sessionId}.json`);
}
async function ensureStateDir() {
  try {
    await mkdir2(STATE_DIR2, { recursive: true });
  } catch (error) {
    logger.debug("State directory already exists or error creating:", error);
  }
}
async function readSessionState(sessionId) {
  try {
    const stateFile = getStateFilePath(sessionId);
    const content = await readFile(stateFile, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    logger.debug(`No state found for session ${sessionId} (new session)`);
    return null;
  }
}
async function writeSessionState(state) {
  try {
    await ensureStateDir();
    const stateFile = getStateFilePath(state.sessionId);
    await writeFile(stateFile, JSON.stringify(state, null, 2), "utf-8");
    logger.debug(`Updated state for session ${state.sessionId}: lastReadLine=${state.lastReadLine}`);
  } catch (error) {
    logger.error(`Failed to write state for session ${state.sessionId}:`, error);
  }
}
async function updateLastReadLine(sessionId, filePath, lineNumber, lastMessageIndex) {
  const newState = {
    sessionId,
    lastReadLine: lineNumber,
    lastMessageIndex,
    filePath
  };
  await writeSessionState(newState);
}
export {
  writeSessionState,
  updateLastReadLine,
  readSessionState
};

//# debugId=CD070D2290E1F29A64756E2164756E21
