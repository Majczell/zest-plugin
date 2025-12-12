// src/auth/session-manager.ts
import { mkdir as mkdir2, readFile, unlink, writeFile } from "node:fs/promises";
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
var PLATFORM = "terminal";
var SOURCE = "claude-code";
var PROACTIVE_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
var MAX_DIFF_SIZE_BYTES = 10 * 1024 * 1024;
var MIN_MESSAGES_PER_SESSION = 3;
var STALE_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;
var WEB_APP_URL = "http://localhost:3000";
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

// src/auth/session-manager.ts
async function loadSession() {
  try {
    const content = await readFile(SESSION_FILE, "utf-8");
    const session = JSON.parse(content);
    if (!session.accessToken || !session.refreshToken || !session.expiresAt || !session.userId || !session.email) {
      logger.warn("Invalid session structure, clearing session");
      await clearSession();
      return null;
    }
    const now = Date.now();
    if (session.refreshTokenExpiresAt && session.refreshTokenExpiresAt < now) {
      logger.warn("Refresh token expired, user must re-authenticate");
      await clearSession();
      return null;
    }
    if (session.expiresAt < now) {
      logger.debug("Access token expired, attempting refresh");
      try {
        return await refreshSession(session);
      } catch (error) {
        logger.warn("Failed to refresh session", error);
        await clearSession();
        return null;
      }
    }
    return session;
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    logger.error("Failed to load session", error);
    return null;
  }
}
async function saveSession(session) {
  try {
    await mkdir2(dirname2(SESSION_FILE), { recursive: true, mode: 448 });
    await writeFile(SESSION_FILE, JSON.stringify(session, null, 2), {
      encoding: "utf-8",
      mode: 384
    });
    logger.info("Session saved successfully");
  } catch (error) {
    logger.error("Failed to save session", error);
    throw error;
  }
}
async function clearSession() {
  try {
    await unlink(SESSION_FILE);
    logger.info("Session cleared successfully");
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }
    logger.error("Failed to clear session", error);
    throw error;
  }
}
async function refreshSession(session) {
  try {
    logger.debug("Refreshing session");
    const response = await fetch(`${WEB_APP_URL}/api/auth/extension/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        refreshToken: session.refreshToken
      })
    });
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    const now = Date.now();
    const expiresAt = now + data.expiresIn * 1000;
    const refreshTokenExpiresAt = data.refreshTokenExpiresIn ? now + data.refreshTokenExpiresIn * 1000 : session.refreshTokenExpiresAt;
    const newSession = {
      ...session,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt,
      refreshTokenExpiresAt
    };
    logger.debug(`Access token will expire in ${data.expiresIn} seconds (${new Date(expiresAt).toISOString()})`);
    if (refreshTokenExpiresAt) {
      logger.debug(`Refresh token will expire at ${new Date(refreshTokenExpiresAt).toISOString()}`);
    } else {
      logger.debug("Refresh token does not expire");
    }
    await saveSession(newSession);
    logger.info("Session refreshed successfully");
    return newSession;
  } catch (error) {
    logger.error("Failed to refresh session", error);
    throw error;
  }
}
async function getValidSession() {
  const session = await loadSession();
  if (!session) {
    return null;
  }
  const now = Date.now();
  const timeUntilExpiration = session.expiresAt - now;
  if (timeUntilExpiration < PROACTIVE_REFRESH_THRESHOLD_MS) {
    try {
      logger.debug(`Token ${timeUntilExpiration < 0 ? "expired" : `expiring in ${Math.round(timeUntilExpiration / 1000)}s`}, refreshing...`);
      return await refreshSession(session);
    } catch (error) {
      logger.warn("Failed to refresh session", error);
      return null;
    }
  }
  return session;
}

// src/utils/queue-manager.ts
import { appendFile as appendFile2, mkdir as mkdir3, readFile as readFile2, stat, unlink as unlink2, writeFile as writeFile2 } from "node:fs/promises";
import { dirname as dirname3 } from "node:path";
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
    await mkdir3(dirPath, { recursive: true, mode: 448 });
    logger.debug(`Created directory: ${dirPath}`);
  }
}
async function readJsonl(filePath) {
  try {
    const content = await readFile2(filePath, "utf8");
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
async function readQueue(queueFile) {
  try {
    return await readJsonl(queueFile);
  } catch (error) {
    logger.error(`Failed to read queue file ${queueFile}:`, error);
    throw error;
  }
}
async function atomicUpdateQueue(queueFile, transform) {
  try {
    await withLock(queueFile, async () => {
      const currentItems = await readJsonl(queueFile);
      const newItems = transform(currentItems);
      await ensureDirectory(dirname3(queueFile));
      const content = newItems.map((item) => JSON.stringify(item)).join(`
`) + (newItems.length > 0 ? `
` : "");
      await writeFile2(queueFile, content, "utf8");
      logger.debug(`Atomically updated queue file: ${queueFile} (${currentItems.length} → ${newItems.length} items)`);
    });
  } catch (error) {
    logger.error(`Failed to atomically update queue file ${queueFile}:`, error);
    throw error;
  }
}

// src/supabase/chat-uploader.ts
function countMessagesPerSession(messages) {
  const counts = new Map;
  for (const message of messages) {
    if (!message.session_id)
      continue;
    const count = counts.get(message.session_id) || 0;
    counts.set(message.session_id, count + 1);
  }
  return counts;
}
function categorizeSessions(sessions, messageCountBySession) {
  const now = Date.now();
  const staleThreshold = now - STALE_SESSION_AGE_MS;
  const valid = [];
  const stale = [];
  const pending = [];
  for (const session of sessions) {
    if (!session.id)
      continue;
    const messageCount = messageCountBySession.get(session.id) || 0;
    const sessionAge = session.created_at ? new Date(session.created_at).getTime() : now;
    if (messageCount >= MIN_MESSAGES_PER_SESSION) {
      valid.push(session);
    } else if (sessionAge < staleThreshold) {
      stale.push(session);
    } else {
      pending.push(session);
    }
  }
  return {
    valid,
    stale,
    pending,
    validIds: new Set(valid.map((s) => s.id).filter((id) => !!id)),
    staleIds: new Set(stale.map((s) => s.id).filter((id) => !!id)),
    pendingIds: new Set(pending.map((s) => s.id).filter((id) => !!id))
  };
}
function partitionMessagesBySessionCategory(messages, categories) {
  const allSessionIds = new Set([
    ...categories.validIds,
    ...categories.staleIds,
    ...categories.pendingIds
  ]);
  const orphaned = [];
  const valid = [];
  const stale = [];
  const pending = [];
  for (const message of messages) {
    if (!message.session_id)
      continue;
    if (categories.validIds.has(message.session_id)) {
      valid.push(message);
    } else if (categories.staleIds.has(message.session_id)) {
      stale.push(message);
    } else if (categories.pendingIds.has(message.session_id)) {
      pending.push(message);
    } else {
      orphaned.push(message);
    }
  }
  return { valid, stale, pending, orphaned };
}
function logSessionCategorization(categories, messagePartition) {
  if (categories.stale.length > 0) {
    logger.info(`Removing ${categories.stale.length} stale sessions (< ${MIN_MESSAGES_PER_SESSION} messages, > 7 days old) with ${messagePartition.stale.length} messages`);
  }
  if (categories.pending.length > 0) {
    logger.info(`Keeping ${categories.pending.length} pending sessions (< ${MIN_MESSAGES_PER_SESSION} messages, within 7 days) with ${messagePartition.pending.length} messages`);
  }
}
async function removeStaleSessionsFromQueue(staleSessionIds) {
  await atomicUpdateQueue(SESSIONS_QUEUE_FILE, (currentSessions) => {
    return currentSessions.filter((s) => s.id && !staleSessionIds.has(s.id));
  });
  await atomicUpdateQueue(MESSAGES_QUEUE_FILE, (currentMessages) => {
    return currentMessages.filter((m) => m.session_id && !staleSessionIds.has(m.session_id));
  });
}
function deduplicateSessions(sessions) {
  const sessionMap = new Map;
  for (const session of sessions) {
    if (!session.id)
      continue;
    const existing = sessionMap.get(session.id);
    if (!existing) {
      sessionMap.set(session.id, session);
      continue;
    }
    const existingTime = existing.created_at ? new Date(existing.created_at).getTime() : 0;
    const currentTime = session.created_at ? new Date(session.created_at).getTime() : 0;
    if (currentTime >= existingTime) {
      sessionMap.set(session.id, session);
    }
  }
  return Array.from(sessionMap.values());
}
function deduplicateMessages(messages) {
  const messageMap = new Map;
  for (const message of messages) {
    if (!message.session_id)
      continue;
    const key = `${message.session_id}:${message.message_index}`;
    const existing = messageMap.get(key);
    if (!existing) {
      messageMap.set(key, message);
      continue;
    }
    const existingTime = existing.created_at ? new Date(existing.created_at).getTime() : 0;
    const currentTime = message.created_at ? new Date(message.created_at).getTime() : 0;
    if (currentTime >= existingTime) {
      messageMap.set(key, message);
    }
  }
  return Array.from(messageMap.values());
}
function enrichSessionsForUpload(sessions, userId, workspaceId) {
  return sessions.map((s) => ({
    ...s,
    user_id: userId,
    platform: PLATFORM,
    source: SOURCE,
    analysis_status: "pending",
    workspace_id: workspaceId,
    metadata: null
  }));
}
function enrichMessagesForUpload(messages, userId) {
  return messages.map((m) => ({
    ...m,
    user_id: userId,
    code_diffs: null,
    metadata: null
  }));
}
async function uploadSessionsToSupabase(supabase, sessions) {
  if (sessions.length === 0) {
    return true;
  }
  const { error } = await supabase.from("chat_sessions").upsert(sessions, { onConflict: "id" });
  if (error) {
    logger.error("Failed to upload chat sessions", error);
    return false;
  }
  logger.info(`✓ Uploaded ${sessions.length} chat sessions`);
  return true;
}
async function uploadMessagesToSupabase(supabase, messages) {
  if (messages.length === 0) {
    return true;
  }
  const { error } = await supabase.from("chat_messages").upsert(messages, { onConflict: "session_id,message_index" });
  if (error) {
    logger.error("Failed to upload chat messages", error);
    return false;
  }
  logger.info(`✓ Uploaded ${messages.length} chat messages`);
  return true;
}
async function removeProcessedSessionsFromQueue(sessionsToRemove) {
  await atomicUpdateQueue(SESSIONS_QUEUE_FILE, (currentSessions) => {
    return currentSessions.filter((s) => s.id && !sessionsToRemove.has(s.id));
  });
  await atomicUpdateQueue(MESSAGES_QUEUE_FILE, (currentMessages) => {
    return currentMessages.filter((m) => m.session_id && !sessionsToRemove.has(m.session_id));
  });
}
async function removeMessagesFromQueue(messageIdsToRemove) {
  await atomicUpdateQueue(MESSAGES_QUEUE_FILE, (currentMessages) => {
    return currentMessages.filter((m) => m.id && !messageIdsToRemove.has(m.id));
  });
}
async function uploadChatData(supabase) {
  try {
    const session = await getValidSession();
    if (!session) {
      logger.debug("Not authenticated, skipping chat upload");
      return { success: false, uploaded: { sessions: 0, messages: 0 } };
    }
    const queuedSessions = await readQueue(SESSIONS_QUEUE_FILE);
    const queuedMessages = await readQueue(MESSAGES_QUEUE_FILE);
    if (queuedSessions.length === 0 && queuedMessages.length === 0) {
      logger.debug("No chat data to upload");
      return { success: true, uploaded: { sessions: 0, messages: 0 } };
    }
    const messageCountBySession = countMessagesPerSession(queuedMessages);
    const categories = categorizeSessions(queuedSessions, messageCountBySession);
    const messagePartition = partitionMessagesBySessionCategory(queuedMessages, categories);
    logSessionCategorization(categories, messagePartition);
    if (messagePartition.orphaned.length > 0) {
      logger.info(`Found ${messagePartition.orphaned.length} new messages for already-synced sessions`);
    }
    if (categories.stale.length > 0) {
      await removeStaleSessionsFromQueue(categories.staleIds);
      logger.info(`Cleaned up ${categories.stale.length} stale sessions`);
    }
    if (categories.valid.length === 0 && messagePartition.orphaned.length === 0) {
      logger.info("No sessions with sufficient messages to upload");
      return { success: true, uploaded: { sessions: 0, messages: 0 } };
    }
    const uniqueSessions = deduplicateSessions(categories.valid);
    const allMessagesToUpload = [...messagePartition.valid, ...messagePartition.orphaned];
    const uniqueMessages = deduplicateMessages(allMessagesToUpload);
    if (uniqueSessions.length < categories.valid.length) {
      logger.info(`Deduplicated sessions: ${categories.valid.length} → ${uniqueSessions.length} (removed ${categories.valid.length - uniqueSessions.length} duplicates)`);
    }
    if (uniqueMessages.length < allMessagesToUpload.length) {
      logger.info(`Deduplicated messages: ${allMessagesToUpload.length} → ${uniqueMessages.length} (removed ${allMessagesToUpload.length - uniqueMessages.length} duplicates)`);
    }
    logger.info(`Uploading chat data: ${uniqueSessions.length} sessions, ${uniqueMessages.length} messages`);
    const sessionsToUpload = enrichSessionsForUpload(uniqueSessions, session.userId, session.workspaceId || null);
    const messagesToUpload = enrichMessagesForUpload(uniqueMessages, session.userId);
    const sessionsUploaded = await uploadSessionsToSupabase(supabase, sessionsToUpload);
    if (!sessionsUploaded) {
      return { success: false, uploaded: { sessions: 0, messages: 0 } };
    }
    const messagesUploaded = await uploadMessagesToSupabase(supabase, messagesToUpload);
    if (!messagesUploaded) {
      return {
        success: false,
        uploaded: { sessions: sessionsToUpload.length, messages: 0 }
      };
    }
    const sessionsToRemove = new Set([...categories.validIds, ...categories.staleIds]);
    await removeProcessedSessionsFromQueue(sessionsToRemove);
    if (messagePartition.orphaned.length > 0) {
      const orphanedMessageIds = new Set(messagePartition.orphaned.map((m) => m.id).filter((id) => !!id));
      await removeMessagesFromQueue(orphanedMessageIds);
      logger.info(`✓ Removed ${orphanedMessageIds.size} orphaned messages from queue`);
    }
    logger.info("✓ Chat data upload completed successfully");
    return {
      success: true,
      uploaded: {
        sessions: sessionsToUpload.length,
        messages: messagesToUpload.length
      }
    };
  } catch (error) {
    logger.error("Failed to upload chat data", error);
    return { success: false, uploaded: { sessions: 0, messages: 0 } };
  }
}
async function uploadChatDataWithRetry(supabase, maxRetries = 3, backoffMs = 5000) {
  let lastError = null;
  for (let attempt = 1;attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadChatData(supabase);
      if (result.success) {
        return result;
      }
      return result;
    } catch (error) {
      lastError = error;
      logger.warn(`Chat upload attempt ${attempt}/${maxRetries} failed: ${lastError.message}`);
      if (attempt < maxRetries) {
        const delay = backoffMs * attempt;
        logger.debug(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  logger.error(`Chat upload failed after ${maxRetries} attempts`, lastError);
  return { success: false, uploaded: { sessions: 0, messages: 0 } };
}
export {
  uploadChatDataWithRetry,
  uploadChatData
};

//# debugId=A5F84DA42180D9DD64756E2164756E21
