// src/utils/queue-manager.ts
import { appendFile as appendFile2, mkdir as mkdir2, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { dirname as dirname2 } from "node:path";

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

// src/utils/queue-manager.ts
var locks = new Map;
async function withLock(filePath, fn) {
  while (locks.has(filePath)) {
    await locks.get(filePath);
  }
  let releaseLock;
  const lockPromise = new Promise((resolve) => {
    releaseLock = resolve;
  });
  locks.set(filePath, lockPromise);
  try {
    return await fn();
  } finally {
    locks.delete(filePath);
    releaseLock();
  }
}
async function ensureDirectory(dirPath) {
  try {
    await stat(dirPath);
  } catch {
    await mkdir2(dirPath, { recursive: true, mode: 448 });
    logger.debug(`Created directory: ${dirPath}`);
  }
}
async function appendToJsonl(filePath, data) {
  await withLock(filePath, async () => {
    await ensureDirectory(dirname2(filePath));
    const line = JSON.stringify(data) + `
`;
    await appendFile2(filePath, line, "utf8");
  });
}
async function readJsonl(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    const lines = content.trim().split(`
`).filter(Boolean);
    const results = [];
    for (let i = 0;i < lines.length; i++) {
      try {
        results.push(JSON.parse(lines[i]));
      } catch (error) {
        logger.warn(`Failed to parse line ${i + 1} in ${filePath}:`, error);
      }
    }
    return results;
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}
async function countLines(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    const lines = content.trim().split(`
`).filter(Boolean);
    return lines.length;
  } catch (error) {
    if (error.code === "ENOENT") {
      return 0;
    }
    throw error;
  }
}
async function deleteFile(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}
async function enqueueEvent(event) {
  try {
    await appendToJsonl(EVENTS_QUEUE_FILE, event);
    logger.debug("Enqueued event", { eventId: event.id, documentUri: event.document_uri });
  } catch (error) {
    logger.error("Failed to enqueue event:", error);
    throw error;
  }
}
async function enqueueChatSession(session) {
  try {
    await appendToJsonl(SESSIONS_QUEUE_FILE, session);
    logger.debug("Enqueued session", { sessionId: session.id });
  } catch (error) {
    logger.error("Failed to enqueue session:", error);
    throw error;
  }
}
async function enqueueChatMessage(message) {
  try {
    await appendToJsonl(MESSAGES_QUEUE_FILE, message);
    logger.debug("Enqueued message", {
      sessionId: message.session_id,
      messageIndex: message.message_index
    });
  } catch (error) {
    logger.error("Failed to enqueue message:", error);
    throw error;
  }
}
async function readQueue(queueFile) {
  try {
    return await readJsonl(queueFile);
  } catch (error) {
    logger.error(`Failed to read queue file ${queueFile}:`, error);
    throw error;
  }
}
async function writeQueue(queueFile, items) {
  try {
    await withLock(queueFile, async () => {
      await ensureDirectory(dirname2(queueFile));
      const content = items.map((item) => JSON.stringify(item)).join(`
`) + (items.length > 0 ? `
` : "");
      await writeFile(queueFile, content, "utf8");
      logger.debug(`Wrote ${items.length} items to queue file: ${queueFile}`);
    });
  } catch (error) {
    logger.error(`Failed to write queue file ${queueFile}:`, error);
    throw error;
  }
}
async function atomicUpdateQueue(queueFile, transform) {
  try {
    await withLock(queueFile, async () => {
      const currentItems = await readJsonl(queueFile);
      const newItems = transform(currentItems);
      await ensureDirectory(dirname2(queueFile));
      const content = newItems.map((item) => JSON.stringify(item)).join(`
`) + (newItems.length > 0 ? `
` : "");
      await writeFile(queueFile, content, "utf8");
      logger.debug(`Atomically updated queue file: ${queueFile} (${currentItems.length} → ${newItems.length} items)`);
    });
  } catch (error) {
    logger.error(`Failed to atomically update queue file ${queueFile}:`, error);
    throw error;
  }
}
async function clearQueue(queueFile) {
  try {
    await withLock(queueFile, async () => {
      await deleteFile(queueFile);
      logger.debug(`Cleared queue file: ${queueFile}`);
    });
  } catch (error) {
    logger.error(`Failed to clear queue file ${queueFile}:`, error);
    throw error;
  }
}
async function getQueueStats() {
  try {
    const [events, sessions, messages] = await Promise.all([
      countLines(EVENTS_QUEUE_FILE),
      countLines(SESSIONS_QUEUE_FILE),
      countLines(MESSAGES_QUEUE_FILE)
    ]);
    return { events, sessions, messages };
  } catch (error) {
    logger.error("Failed to get queue stats:", error);
    return { events: 0, sessions: 0, messages: 0 };
  }
}
async function initializeQueue() {
  try {
    await ensureDirectory(QUEUE_DIR);
    logger.debug("Queue directory initialized");
  } catch (error) {
    logger.error("Failed to initialize queue directory:", error);
    throw error;
  }
}
export {
  writeQueue,
  readQueue,
  initializeQueue,
  getQueueStats,
  enqueueEvent,
  enqueueChatSession,
  enqueueChatMessage,
  clearQueue,
  atomicUpdateQueue
};

//# debugId=8D010C346B50D34C64756E2164756E21
