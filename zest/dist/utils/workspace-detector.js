import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// src/utils/workspace-detector.ts
import { createHash } from "node:crypto";
import { basename, dirname as dirname2, resolve } from "node:path";

// src/utils/logger.ts
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

// src/config/constants.ts
import { homedir } from "node:os";
import { join } from "node:path";
var CLAUDE_ZEST_DIR = join(homedir(), ".claude-zest");
var QUEUE_DIR = join(CLAUDE_ZEST_DIR, "queue");
var LOGS_DIR = join(CLAUDE_ZEST_DIR, "logs");
var STATE_DIR = join(CLAUDE_ZEST_DIR, "state");
var SESSION_FILE = join(CLAUDE_ZEST_DIR, "session.json");
var CONFIG_FILE = join(CLAUDE_ZEST_DIR, "config.json");
var LOG_FILE = join(LOGS_DIR, "plugin.log");
var EVENTS_QUEUE_FILE = join(QUEUE_DIR, "events.jsonl");
var SESSIONS_QUEUE_FILE = join(QUEUE_DIR, "chat-sessions.jsonl");
var MESSAGES_QUEUE_FILE = join(QUEUE_DIR, "chat-messages.jsonl");
var MAX_DIFF_SIZE_BYTES = 10 * 1024 * 1024;
var CLAUDE_PROJECTS_DIR = join(homedir(), ".claude", "projects");

// src/utils/logger.ts
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

// src/utils/workspace-detector.ts
async function detectWorkspace(filePath) {
  try {
    const fileDir = dirname2(filePath);
    const absolutePath = resolve(fileDir);
    const workspaceRoot = await findWorkspaceRoot(absolutePath);
    const workspaceId = generateWorkspaceId(workspaceRoot);
    const workspaceName = getWorkspaceName(workspaceRoot);
    return {
      id: workspaceId,
      name: workspaceName,
      path: workspaceRoot
    };
  } catch (error) {
    logger.error("Failed to detect workspace:", error);
    return null;
  }
}
async function findWorkspaceRoot(startPath) {
  const { existsSync } = await import("node:fs");
  const { join: join2 } = await import("node:path");
  let currentPath = startPath;
  const root = resolve("/");
  const markers = [".git", "package.json", "pnpm-workspace.yaml", "Cargo.toml", "go.mod"];
  while (currentPath !== root) {
    for (const marker of markers) {
      if (existsSync(join2(currentPath, marker))) {
        return currentPath;
      }
    }
    const parentPath = dirname2(currentPath);
    if (parentPath === currentPath)
      break;
    currentPath = parentPath;
  }
  return startPath;
}
function generateWorkspaceId(workspacePath) {
  const hash = createHash("sha256").update(workspacePath).digest("hex");
  return `workspace_${hash.substring(0, 16)}`;
}
function getWorkspaceName(workspacePath) {
  return basename(workspacePath);
}
async function validateWorkspaceAccess(workspaceId, userId) {
  logger.debug(`Validating workspace access: ${workspaceId} for user ${userId}`);
  return true;
}
export {
  validateWorkspaceAccess,
  detectWorkspace
};

//# debugId=A376EB6CCBB5159D64756E2164756E21
