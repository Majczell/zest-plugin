#!/usr/bin/env node
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
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// ../../packages/utils/dist/language-utils.js
var require_language_utils = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getLanguageFromPath = getLanguageFromPath;
  exports.detectLanguageId = detectLanguageId;
  var languageMap = {
    ts: "typescript",
    tsx: "typescriptreact",
    js: "javascript",
    jsx: "javascriptreact",
    mjs: "javascript",
    cjs: "javascript",
    py: "python",
    pyi: "python",
    pyw: "python",
    rs: "rust",
    go: "go",
    java: "java",
    kt: "kotlin",
    kts: "kotlin",
    scala: "scala",
    groovy: "groovy",
    gradle: "groovy",
    c: "c",
    h: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    hpp: "cpp",
    hxx: "hpp",
    cs: "csharp",
    rb: "ruby",
    php: "php",
    swift: "swift",
    m: "objective-c",
    mm: "objective-cpp",
    vue: "vue",
    svelte: "svelte",
    astro: "astro",
    dart: "dart",
    ex: "elixir",
    exs: "elixir",
    clj: "clojure",
    cljs: "clojure",
    edn: "clojure",
    hs: "haskell",
    lhs: "haskell",
    lua: "lua",
    erl: "erlang",
    hrl: "erlang",
    pl: "perl",
    pm: "perl",
    coffee: "coffeescript",
    sh: "shellscript",
    bash: "shellscript",
    zsh: "shellscript",
    fish: "shellscript",
    ps1: "powershell",
    psm1: "powershell",
    bat: "bat",
    cmd: "bat",
    md: "markdown",
    mdx: "mdx",
    json: "json",
    jsonc: "jsonc",
    yaml: "yaml",
    yml: "yaml",
    toml: "toml",
    xml: "xml",
    html: "html",
    htm: "html",
    ini: "ini",
    properties: "properties",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    sql: "sql",
    graphql: "graphql",
    gql: "graphql",
    proto: "protobuf",
    dockerfile: "dockerfile",
    tf: "terraform",
    r: "r"
  };
  function getLanguageFromPath(filePath) {
    var _a;
    var ext = (_a = filePath.split(".").pop()) === null || _a === undefined ? undefined : _a.toLowerCase();
    return languageMap[ext || ""] || "plaintext";
  }
  function detectLanguageId(filePath) {
    return getLanguageFromPath(filePath);
  }
});

// ../../packages/utils/dist/index.js
var require_dist = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getLanguageFromPath = exports.detectLanguageId = undefined;
  var language_utils_js_1 = require_language_utils();
  Object.defineProperty(exports, "detectLanguageId", { enumerable: true, get: function() {
    return language_utils_js_1.detectLanguageId;
  } });
  Object.defineProperty(exports, "getLanguageFromPath", { enumerable: true, get: function() {
    return language_utils_js_1.getLanguageFromPath;
  } });
});

// src/utils/extraction-helpers.ts
var import_utils = __toESM(require_dist(), 1);
import { randomUUID } from "node:crypto";
import { stat as stat2 } from "node:fs/promises";
import { basename, join as join3 } from "node:path";

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
var PROACTIVE_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
var MAX_DIFF_SIZE_BYTES = 10 * 1024 * 1024;
var MAX_CONTENT_PREVIEW_LENGTH = 1000;
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

// src/extractors/message-parser.ts
import { readFile as readFile2 } from "node:fs/promises";

// src/extractors/extraction-utils.ts
import { createHash } from "node:crypto";

// ../../node_modules/diff/libesm/diff/base.js
var Diff = function() {
  function Diff2() {}
  Diff2.prototype.diff = function(oldString, newString, options) {
    if (options === undefined) {
      options = {};
    }
    var callback;
    if (typeof options === "function") {
      callback = options;
      options = {};
    } else if ("callback" in options) {
      callback = options.callback;
    }
    oldString = this.castInput(oldString, options);
    newString = this.castInput(newString, options);
    var oldTokens = this.removeEmpty(this.tokenize(oldString, options));
    var newTokens = this.removeEmpty(this.tokenize(newString, options));
    return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
  };
  Diff2.prototype.diffWithOptionsObj = function(oldTokens, newTokens, options, callback) {
    var _this = this;
    var _a;
    var done = function(value) {
      value = _this.postProcess(value, options);
      if (callback) {
        setTimeout(function() {
          callback(value);
        }, 0);
        return;
      } else {
        return value;
      }
    };
    var newLen = newTokens.length, oldLen = oldTokens.length;
    var editLength = 1;
    var maxEditLength = newLen + oldLen;
    if (options.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    var maxExecutionTime = (_a = options.timeout) !== null && _a !== undefined ? _a : Infinity;
    var abortAfterTimestamp = Date.now() + maxExecutionTime;
    var bestPath = [{ oldPos: -1, lastComponent: undefined }];
    var newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
    }
    var minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
    var execEditLength = function() {
      for (var diagonalPath = Math.max(minDiagonalToConsider, -editLength);diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
        var basePath = undefined;
        var removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          bestPath[diagonalPath - 1] = undefined;
        }
        var canAdd = false;
        if (addPath) {
          var addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }
        var canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = undefined;
          continue;
        }
        if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
          basePath = _this.addToPath(addPath, true, false, 0, options);
        } else {
          basePath = _this.addToPath(removePath, false, true, 1, options);
        }
        newPos = _this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(_this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
          }
        }
      }
      editLength++;
    };
    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return callback(undefined);
          }
          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        var ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  };
  Diff2.prototype.addToPath = function(path, added, removed, oldPosInc, options) {
    var last = path.lastComponent;
    if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent }
      };
    } else {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: 1, added, removed, previousComponent: last }
      };
    }
  };
  Diff2.prototype.extractCommon = function(basePath, newTokens, oldTokens, diagonalPath, options) {
    var newLen = newTokens.length, oldLen = oldTokens.length;
    var oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
      newPos++;
      oldPos++;
      commonCount++;
      if (options.oneChangePerToken) {
        basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
      }
    }
    if (commonCount && !options.oneChangePerToken) {
      basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
    }
    basePath.oldPos = oldPos;
    return newPos;
  };
  Diff2.prototype.equals = function(left, right, options) {
    if (options.comparator) {
      return options.comparator(left, right);
    } else {
      return left === right || !!options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  };
  Diff2.prototype.removeEmpty = function(array) {
    var ret = [];
    for (var i = 0;i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  };
  Diff2.prototype.castInput = function(value, options) {
    return value;
  };
  Diff2.prototype.tokenize = function(value, options) {
    return Array.from(value);
  };
  Diff2.prototype.join = function(chars) {
    return chars.join("");
  };
  Diff2.prototype.postProcess = function(changeObjects, options) {
    return changeObjects;
  };
  Object.defineProperty(Diff2.prototype, "useLongestToken", {
    get: function() {
      return false;
    },
    enumerable: false,
    configurable: true
  });
  Diff2.prototype.buildValues = function(lastComponent, newTokens, oldTokens) {
    var components = [];
    var nextComponent;
    while (lastComponent) {
      components.push(lastComponent);
      nextComponent = lastComponent.previousComponent;
      delete lastComponent.previousComponent;
      lastComponent = nextComponent;
    }
    components.reverse();
    var componentLen = components.length;
    var componentPos = 0, newPos = 0, oldPos = 0;
    for (;componentPos < componentLen; componentPos++) {
      var component = components[componentPos];
      if (!component.removed) {
        if (!component.added && this.useLongestToken) {
          var value = newTokens.slice(newPos, newPos + component.count);
          value = value.map(function(value2, i) {
            var oldValue = oldTokens[oldPos + i];
            return oldValue.length > value2.length ? oldValue : value2;
          });
          component.value = this.join(value);
        } else {
          component.value = this.join(newTokens.slice(newPos, newPos + component.count));
        }
        newPos += component.count;
        if (!component.added) {
          oldPos += component.count;
        }
      } else {
        component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
        oldPos += component.count;
      }
    }
    return components;
  };
  return Diff2;
}();
var base_default = Diff;

// ../../node_modules/diff/libesm/diff/character.js
var __extends = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
  };
}();
var CharacterDiff = function(_super) {
  __extends(CharacterDiff2, _super);
  function CharacterDiff2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return CharacterDiff2;
}(base_default);
var characterDiff = new CharacterDiff;

// ../../node_modules/diff/libesm/util/string.js
function longestCommonPrefix(str1, str2) {
  var i;
  for (i = 0;i < str1.length && i < str2.length; i++) {
    if (str1[i] != str2[i]) {
      return str1.slice(0, i);
    }
  }
  return str1.slice(0, i);
}
function longestCommonSuffix(str1, str2) {
  var i;
  if (!str1 || !str2 || str1[str1.length - 1] != str2[str2.length - 1]) {
    return "";
  }
  for (i = 0;i < str1.length && i < str2.length; i++) {
    if (str1[str1.length - (i + 1)] != str2[str2.length - (i + 1)]) {
      return str1.slice(-i);
    }
  }
  return str1.slice(-i);
}
function replacePrefix(string, oldPrefix, newPrefix) {
  if (string.slice(0, oldPrefix.length) != oldPrefix) {
    throw Error("string ".concat(JSON.stringify(string), " doesn't start with prefix ").concat(JSON.stringify(oldPrefix), "; this is a bug"));
  }
  return newPrefix + string.slice(oldPrefix.length);
}
function replaceSuffix(string, oldSuffix, newSuffix) {
  if (!oldSuffix) {
    return string + newSuffix;
  }
  if (string.slice(-oldSuffix.length) != oldSuffix) {
    throw Error("string ".concat(JSON.stringify(string), " doesn't end with suffix ").concat(JSON.stringify(oldSuffix), "; this is a bug"));
  }
  return string.slice(0, -oldSuffix.length) + newSuffix;
}
function removePrefix(string, oldPrefix) {
  return replacePrefix(string, oldPrefix, "");
}
function removeSuffix(string, oldSuffix) {
  return replaceSuffix(string, oldSuffix, "");
}
function maximumOverlap(string1, string2) {
  return string2.slice(0, overlapCount(string1, string2));
}
function overlapCount(a, b) {
  var startA = 0;
  if (a.length > b.length) {
    startA = a.length - b.length;
  }
  var endB = b.length;
  if (a.length < b.length) {
    endB = a.length;
  }
  var map = Array(endB);
  var k = 0;
  map[0] = 0;
  for (var j = 1;j < endB; j++) {
    if (b[j] == b[k]) {
      map[j] = map[k];
    } else {
      map[j] = k;
    }
    while (k > 0 && b[j] != b[k]) {
      k = map[k];
    }
    if (b[j] == b[k]) {
      k++;
    }
  }
  k = 0;
  for (var i = startA;i < a.length; i++) {
    while (k > 0 && a[i] != b[k]) {
      k = map[k];
    }
    if (a[i] == b[k]) {
      k++;
    }
  }
  return k;
}
function trailingWs(string) {
  var i;
  for (i = string.length - 1;i >= 0; i--) {
    if (!string[i].match(/\s/)) {
      break;
    }
  }
  return string.substring(i + 1);
}
function leadingWs(string) {
  var match = string.match(/^\s*/);
  return match ? match[0] : "";
}

// ../../node_modules/diff/libesm/diff/word.js
var __extends2 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
  };
}();
var extendedWordChars = "a-zA-Z0-9_\\u{C0}-\\u{FF}\\u{D8}-\\u{F6}\\u{F8}-\\u{2C6}\\u{2C8}-\\u{2D7}\\u{2DE}-\\u{2FF}\\u{1E00}-\\u{1EFF}";
var tokenizeIncludingWhitespace = new RegExp("[".concat(extendedWordChars, "]+|\\s+|[^").concat(extendedWordChars, "]"), "ug");
var WordDiff = function(_super) {
  __extends2(WordDiff2, _super);
  function WordDiff2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  WordDiff2.prototype.equals = function(left, right, options) {
    if (options.ignoreCase) {
      left = left.toLowerCase();
      right = right.toLowerCase();
    }
    return left.trim() === right.trim();
  };
  WordDiff2.prototype.tokenize = function(value, options) {
    if (options === undefined) {
      options = {};
    }
    var parts;
    if (options.intlSegmenter) {
      var segmenter = options.intlSegmenter;
      if (segmenter.resolvedOptions().granularity != "word") {
        throw new Error('The segmenter passed must have a granularity of "word"');
      }
      parts = Array.from(segmenter.segment(value), function(segment) {
        return segment.segment;
      });
    } else {
      parts = value.match(tokenizeIncludingWhitespace) || [];
    }
    var tokens = [];
    var prevPart = null;
    parts.forEach(function(part) {
      if (/\s/.test(part)) {
        if (prevPart == null) {
          tokens.push(part);
        } else {
          tokens.push(tokens.pop() + part);
        }
      } else if (prevPart != null && /\s/.test(prevPart)) {
        if (tokens[tokens.length - 1] == prevPart) {
          tokens.push(tokens.pop() + part);
        } else {
          tokens.push(prevPart + part);
        }
      } else {
        tokens.push(part);
      }
      prevPart = part;
    });
    return tokens;
  };
  WordDiff2.prototype.join = function(tokens) {
    return tokens.map(function(token, i) {
      if (i == 0) {
        return token;
      } else {
        return token.replace(/^\s+/, "");
      }
    }).join("");
  };
  WordDiff2.prototype.postProcess = function(changes, options) {
    if (!changes || options.oneChangePerToken) {
      return changes;
    }
    var lastKeep = null;
    var insertion = null;
    var deletion = null;
    changes.forEach(function(change) {
      if (change.added) {
        insertion = change;
      } else if (change.removed) {
        deletion = change;
      } else {
        if (insertion || deletion) {
          dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, change);
        }
        lastKeep = change;
        insertion = null;
        deletion = null;
      }
    });
    if (insertion || deletion) {
      dedupeWhitespaceInChangeObjects(lastKeep, deletion, insertion, null);
    }
    return changes;
  };
  return WordDiff2;
}(base_default);
var wordDiff = new WordDiff;
function dedupeWhitespaceInChangeObjects(startKeep, deletion, insertion, endKeep) {
  if (deletion && insertion) {
    var oldWsPrefix = leadingWs(deletion.value);
    var oldWsSuffix = trailingWs(deletion.value);
    var newWsPrefix = leadingWs(insertion.value);
    var newWsSuffix = trailingWs(insertion.value);
    if (startKeep) {
      var commonWsPrefix = longestCommonPrefix(oldWsPrefix, newWsPrefix);
      startKeep.value = replaceSuffix(startKeep.value, newWsPrefix, commonWsPrefix);
      deletion.value = removePrefix(deletion.value, commonWsPrefix);
      insertion.value = removePrefix(insertion.value, commonWsPrefix);
    }
    if (endKeep) {
      var commonWsSuffix = longestCommonSuffix(oldWsSuffix, newWsSuffix);
      endKeep.value = replacePrefix(endKeep.value, newWsSuffix, commonWsSuffix);
      deletion.value = removeSuffix(deletion.value, commonWsSuffix);
      insertion.value = removeSuffix(insertion.value, commonWsSuffix);
    }
  } else if (insertion) {
    if (startKeep) {
      var ws = leadingWs(insertion.value);
      insertion.value = insertion.value.substring(ws.length);
    }
    if (endKeep) {
      var ws = leadingWs(endKeep.value);
      endKeep.value = endKeep.value.substring(ws.length);
    }
  } else if (startKeep && endKeep) {
    var newWsFull = leadingWs(endKeep.value), delWsStart = leadingWs(deletion.value), delWsEnd = trailingWs(deletion.value);
    var newWsStart = longestCommonPrefix(newWsFull, delWsStart);
    deletion.value = removePrefix(deletion.value, newWsStart);
    var newWsEnd = longestCommonSuffix(removePrefix(newWsFull, newWsStart), delWsEnd);
    deletion.value = removeSuffix(deletion.value, newWsEnd);
    endKeep.value = replacePrefix(endKeep.value, newWsFull, newWsEnd);
    startKeep.value = replaceSuffix(startKeep.value, newWsFull, newWsFull.slice(0, newWsFull.length - newWsEnd.length));
  } else if (endKeep) {
    var endKeepWsPrefix = leadingWs(endKeep.value);
    var deletionWsSuffix = trailingWs(deletion.value);
    var overlap = maximumOverlap(deletionWsSuffix, endKeepWsPrefix);
    deletion.value = removeSuffix(deletion.value, overlap);
  } else if (startKeep) {
    var startKeepWsSuffix = trailingWs(startKeep.value);
    var deletionWsPrefix = leadingWs(deletion.value);
    var overlap = maximumOverlap(startKeepWsSuffix, deletionWsPrefix);
    deletion.value = removePrefix(deletion.value, overlap);
  }
}
var WordsWithSpaceDiff = function(_super) {
  __extends2(WordsWithSpaceDiff2, _super);
  function WordsWithSpaceDiff2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  WordsWithSpaceDiff2.prototype.tokenize = function(value) {
    var regex = new RegExp("(\\r?\\n)|[".concat(extendedWordChars, "]+|[^\\S\\n\\r]+|[^").concat(extendedWordChars, "]"), "ug");
    return value.match(regex) || [];
  };
  return WordsWithSpaceDiff2;
}(base_default);
var wordsWithSpaceDiff = new WordsWithSpaceDiff;

// ../../node_modules/diff/libesm/diff/line.js
var __extends3 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
  };
}();
var LineDiff = function(_super) {
  __extends3(LineDiff2, _super);
  function LineDiff2() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.tokenize = tokenize;
    return _this;
  }
  LineDiff2.prototype.equals = function(left, right, options) {
    if (options.ignoreWhitespace) {
      if (!options.newlineIsToken || !left.includes(`
`)) {
        left = left.trim();
      }
      if (!options.newlineIsToken || !right.includes(`
`)) {
        right = right.trim();
      }
    } else if (options.ignoreNewlineAtEof && !options.newlineIsToken) {
      if (left.endsWith(`
`)) {
        left = left.slice(0, -1);
      }
      if (right.endsWith(`
`)) {
        right = right.slice(0, -1);
      }
    }
    return _super.prototype.equals.call(this, left, right, options);
  };
  return LineDiff2;
}(base_default);
var lineDiff = new LineDiff;
function diffLines(oldStr, newStr, options) {
  return lineDiff.diff(oldStr, newStr, options);
}
function tokenize(value, options) {
  if (options.stripTrailingCr) {
    value = value.replace(/\r\n/g, `
`);
  }
  var retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }
  for (var i = 0;i < linesAndNewlines.length; i++) {
    var line = linesAndNewlines[i];
    if (i % 2 && !options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      retLines.push(line);
    }
  }
  return retLines;
}

// ../../node_modules/diff/libesm/diff/sentence.js
var __extends4 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
  };
}();
var SentenceDiff = function(_super) {
  __extends4(SentenceDiff2, _super);
  function SentenceDiff2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  SentenceDiff2.prototype.tokenize = function(value) {
    return value.split(/(?<=[.!?])(\s+|$)/);
  };
  return SentenceDiff2;
}(base_default);
var sentenceDiff = new SentenceDiff;

// ../../node_modules/diff/libesm/diff/css.js
var __extends5 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
  };
}();
var CssDiff = function(_super) {
  __extends5(CssDiff2, _super);
  function CssDiff2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  CssDiff2.prototype.tokenize = function(value) {
    return value.split(/([{}:;,]|\s+)/);
  };
  return CssDiff2;
}(base_default);
var cssDiff = new CssDiff;

// ../../node_modules/diff/libesm/diff/json.js
var __extends6 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
  };
}();
var JsonDiff = function(_super) {
  __extends6(JsonDiff2, _super);
  function JsonDiff2() {
    var _this = _super !== null && _super.apply(this, arguments) || this;
    _this.tokenize = tokenize;
    return _this;
  }
  Object.defineProperty(JsonDiff2.prototype, "useLongestToken", {
    get: function() {
      return true;
    },
    enumerable: false,
    configurable: true
  });
  JsonDiff2.prototype.castInput = function(value, options) {
    var { undefinedReplacement, stringifyReplacer: _a } = options, stringifyReplacer = _a === undefined ? function(k, v) {
      return typeof v === "undefined" ? undefinedReplacement : v;
    } : _a;
    return typeof value === "string" ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), null, "  ");
  };
  JsonDiff2.prototype.equals = function(left, right, options) {
    return _super.prototype.equals.call(this, left.replace(/,([\r\n])/g, "$1"), right.replace(/,([\r\n])/g, "$1"), options);
  };
  return JsonDiff2;
}(base_default);
var jsonDiff = new JsonDiff;
function canonicalize(obj, stack, replacementStack, replacer, key) {
  stack = stack || [];
  replacementStack = replacementStack || [];
  if (replacer) {
    obj = replacer(key === undefined ? "" : key, obj);
  }
  var i;
  for (i = 0;i < stack.length; i += 1) {
    if (stack[i] === obj) {
      return replacementStack[i];
    }
  }
  var canonicalizedObj;
  if (Object.prototype.toString.call(obj) === "[object Array]") {
    stack.push(obj);
    canonicalizedObj = new Array(obj.length);
    replacementStack.push(canonicalizedObj);
    for (i = 0;i < obj.length; i += 1) {
      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, String(i));
    }
    stack.pop();
    replacementStack.pop();
    return canonicalizedObj;
  }
  if (obj && obj.toJSON) {
    obj = obj.toJSON();
  }
  if (typeof obj === "object" && obj !== null) {
    stack.push(obj);
    canonicalizedObj = {};
    replacementStack.push(canonicalizedObj);
    var sortedKeys = [];
    var key_1;
    for (key_1 in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key_1)) {
        sortedKeys.push(key_1);
      }
    }
    sortedKeys.sort();
    for (i = 0;i < sortedKeys.length; i += 1) {
      key_1 = sortedKeys[i];
      canonicalizedObj[key_1] = canonicalize(obj[key_1], stack, replacementStack, replacer, key_1);
    }
    stack.pop();
    replacementStack.pop();
  } else {
    canonicalizedObj = obj;
  }
  return canonicalizedObj;
}

// ../../node_modules/diff/libesm/diff/array.js
var __extends7 = function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2)
        if (Object.prototype.hasOwnProperty.call(b2, p))
          d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
  };
}();
var ArrayDiff = function(_super) {
  __extends7(ArrayDiff2, _super);
  function ArrayDiff2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  ArrayDiff2.prototype.tokenize = function(value) {
    return value.slice();
  };
  ArrayDiff2.prototype.join = function(value) {
    return value;
  };
  ArrayDiff2.prototype.removeEmpty = function(value) {
    return value;
  };
  return ArrayDiff2;
}(base_default);
var arrayDiff = new ArrayDiff;

// ../../node_modules/diff/libesm/patch/create.js
var __assign = function() {
  __assign = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length;i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  var optionsObj;
  if (!options) {
    optionsObj = {};
  } else if (typeof options === "function") {
    optionsObj = { callback: options };
  } else {
    optionsObj = options;
  }
  if (typeof optionsObj.context === "undefined") {
    optionsObj.context = 4;
  }
  var context = optionsObj.context;
  if (optionsObj.newlineIsToken) {
    throw new Error("newlineIsToken may not be used with patch-generation functions, only with diffing functions");
  }
  if (!optionsObj.callback) {
    return diffLinesResultToPatch(diffLines(oldStr, newStr, optionsObj));
  } else {
    var callback_1 = optionsObj.callback;
    diffLines(oldStr, newStr, __assign(__assign({}, optionsObj), { callback: function(diff) {
      var patch = diffLinesResultToPatch(diff);
      callback_1(patch);
    } }));
  }
  function diffLinesResultToPatch(diff) {
    if (!diff) {
      return;
    }
    diff.push({ value: "", lines: [] });
    function contextLines(lines2) {
      return lines2.map(function(entry) {
        return " " + entry;
      });
    }
    var hunks = [];
    var oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
    for (var i = 0;i < diff.length; i++) {
      var current = diff[i], lines = current.lines || splitLines(current.value);
      current.lines = lines;
      if (current.added || current.removed) {
        if (!oldRangeStart) {
          var prev = diff[i - 1];
          oldRangeStart = oldLine;
          newRangeStart = newLine;
          if (prev) {
            curRange = context > 0 ? contextLines(prev.lines.slice(-context)) : [];
            oldRangeStart -= curRange.length;
            newRangeStart -= curRange.length;
          }
        }
        for (var _i = 0, lines_1 = lines;_i < lines_1.length; _i++) {
          var line = lines_1[_i];
          curRange.push((current.added ? "+" : "-") + line);
        }
        if (current.added) {
          newLine += lines.length;
        } else {
          oldLine += lines.length;
        }
      } else {
        if (oldRangeStart) {
          if (lines.length <= context * 2 && i < diff.length - 2) {
            for (var _a = 0, _b = contextLines(lines);_a < _b.length; _a++) {
              var line = _b[_a];
              curRange.push(line);
            }
          } else {
            var contextSize = Math.min(lines.length, context);
            for (var _c = 0, _d = contextLines(lines.slice(0, contextSize));_c < _d.length; _c++) {
              var line = _d[_c];
              curRange.push(line);
            }
            var hunk = {
              oldStart: oldRangeStart,
              oldLines: oldLine - oldRangeStart + contextSize,
              newStart: newRangeStart,
              newLines: newLine - newRangeStart + contextSize,
              lines: curRange
            };
            hunks.push(hunk);
            oldRangeStart = 0;
            newRangeStart = 0;
            curRange = [];
          }
        }
        oldLine += lines.length;
        newLine += lines.length;
      }
    }
    for (var _e = 0, hunks_1 = hunks;_e < hunks_1.length; _e++) {
      var hunk = hunks_1[_e];
      for (var i = 0;i < hunk.lines.length; i++) {
        if (hunk.lines[i].endsWith(`
`)) {
          hunk.lines[i] = hunk.lines[i].slice(0, -1);
        } else {
          hunk.lines.splice(i + 1, 0, "\\ No newline at end of file");
          i++;
        }
      }
    }
    return {
      oldFileName,
      newFileName,
      oldHeader,
      newHeader,
      hunks
    };
  }
}
function formatPatch(patch) {
  if (Array.isArray(patch)) {
    return patch.map(formatPatch).join(`
`);
  }
  var ret = [];
  if (patch.oldFileName == patch.newFileName) {
    ret.push("Index: " + patch.oldFileName);
  }
  ret.push("===================================================================");
  ret.push("--- " + patch.oldFileName + (typeof patch.oldHeader === "undefined" ? "" : "\t" + patch.oldHeader));
  ret.push("+++ " + patch.newFileName + (typeof patch.newHeader === "undefined" ? "" : "\t" + patch.newHeader));
  for (var i = 0;i < patch.hunks.length; i++) {
    var hunk = patch.hunks[i];
    if (hunk.oldLines === 0) {
      hunk.oldStart -= 1;
    }
    if (hunk.newLines === 0) {
      hunk.newStart -= 1;
    }
    ret.push("@@ -" + hunk.oldStart + "," + hunk.oldLines + " +" + hunk.newStart + "," + hunk.newLines + " @@");
    for (var _i = 0, _a = hunk.lines;_i < _a.length; _i++) {
      var line = _a[_i];
      ret.push(line);
    }
  }
  return ret.join(`
`) + `
`;
}
function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (typeof options === "function") {
    options = { callback: options };
  }
  if (!(options === null || options === undefined ? undefined : options.callback)) {
    var patchObj = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);
    if (!patchObj) {
      return;
    }
    return formatPatch(patchObj);
  } else {
    var callback_2 = options.callback;
    structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, __assign(__assign({}, options), { callback: function(patchObj2) {
      if (!patchObj2) {
        callback_2(undefined);
      } else {
        callback_2(formatPatch(patchObj2));
      }
    } }));
  }
}
function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
}
function splitLines(text) {
  var hasTrailingNl = text.endsWith(`
`);
  var result = text.split(`
`).map(function(line) {
    return line + `
`;
  });
  if (hasTrailingNl) {
    result.pop();
  } else {
    result.push(result.pop().slice(0, -1));
  }
  return result;
}

// src/utils/diff-utils.ts
function createUnifiedDiff(filePath, oldString, newString) {
  try {
    return createPatch(filePath, oldString.trimEnd(), newString.trimEnd(), "", "", {
      context: 3
    });
  } catch (error) {
    logger.warn(`Failed to create unified diff for ${filePath}`, error);
    return "";
  }
}
function sanitizeDiff(diff, filePath) {
  if (!diff || !filePath) {
    return;
  }
  const oldString = diff.old_string ?? "";
  const newString = diff.new_string ?? "";
  if (oldString === "" && newString === "") {
    return;
  }
  const unifiedDiff = createUnifiedDiff(filePath, oldString, newString);
  if (!unifiedDiff) {
    return;
  }
  const sizeBytes = Buffer.byteLength(unifiedDiff, "utf-8");
  if (sizeBytes > MAX_DIFF_SIZE_BYTES) {
    logger.warn(`Diff size ${sizeBytes} bytes exceeds limit of ${MAX_DIFF_SIZE_BYTES} bytes, skipping`);
    return;
  }
  return unifiedDiff;
}

// src/extractors/extraction-utils.ts
function extractTextContent(content) {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    const textBlocks = content.filter((block) => block.type === "text" && block.text).map((block) => block.text);
    return textBlocks.join(`
`);
  }
  return "";
}
function extractToolUse(contentBlock, sessionId, timestamp) {
  try {
    const toolName = contentBlock.name;
    const input = contentBlock.input || {};
    if (!toolName)
      return null;
    let filePath;
    let content;
    if (toolName === "Write" || toolName === "write") {
      filePath = input.file_path || input.path;
      content = input.content || input.contents;
    } else if (toolName === "Edit" || toolName === "StrReplace" || toolName === "str_replace") {
      filePath = input.file_path || input.path;
    } else if (toolName === "Delete" || toolName === "delete" || toolName === "rm") {
      filePath = input.file_path || input.path;
    } else if (toolName === "EditNotebook" || toolName === "edit_notebook") {
      filePath = input.target_notebook || input.notebook_path;
    } else if (toolName === "Read" || toolName === "read") {
      filePath = input.file_path || input.path;
    }
    if (!filePath) {
      filePath = input.path || input.file_path || input.filepath;
    }
    if (!filePath) {
      return null;
    }
    const toolUse = {
      session_id: sessionId,
      tool_name: toolName,
      file_path: filePath,
      content: content?.substring(0, MAX_CONTENT_PREVIEW_LENGTH),
      timestamp: timestamp || new Date().toISOString()
    };
    if ((toolName === "Write" || toolName === "write") && content) {
      toolUse.diff = sanitizeDiff({ old_string: "", new_string: content }, filePath);
    }
    return toolUse;
  } catch (error) {
    logger.debug("Failed to extract tool use:", error);
    return null;
  }
}
function getToolNameFromResultType(type, oldString, newString) {
  if (type === "create")
    return "Write";
  if (type === "delete")
    return "Delete";
  if (!oldString && newString)
    return "Write";
  if (oldString && !newString)
    return "Delete";
  return "Edit";
}
function extractToolUseResult(entry, sessionId) {
  try {
    const result = entry.toolUseResult;
    if (!result || !result.filePath)
      return null;
    const toolName = getToolNameFromResultType(result.type, result.oldString, result.newString);
    const toolUse = {
      session_id: sessionId,
      tool_name: toolName,
      file_path: result.filePath,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    if (result.structuredPatch || result.oldString !== undefined || result.newString !== undefined) {
      const rawDiff = {
        old_string: result.oldString,
        new_string: result.newString,
        structured_patch: result.structuredPatch
      };
      toolUse.diff = sanitizeDiff(rawDiff, result.filePath);
    }
    return toolUse;
  } catch (error) {
    logger.debug("Failed to extract tool use result:", error);
    return null;
  }
}
function generateMessageId(sessionId, messageIndex) {
  const hash = createHash("sha256").update(`${sessionId}-${messageIndex}`).digest("hex");
  return `msg_${hash.substring(0, 16)}`;
}
function logDiff(filePath, diff) {
  if (!diff)
    return;
  logger.info(`Code change detected in ${filePath}:`);
  const lines = diff.split(`
`).slice(0, 10);
  for (const line of lines) {
    logger.info(`  ${line}`);
  }
  if (diff.split(`
`).length > 10) {
    logger.info("  ...");
  }
}

// src/extractors/message-parser.ts
async function extractNewMessagesFromFile(filePath, sessionId, lastReadLine = 0) {
  const messages = [];
  const toolUses = [];
  try {
    logger.debug(`Incremental extraction for ${sessionId}: reading from line ${lastReadLine}`);
    const content = await readFile2(filePath, "utf-8");
    const lines = content.split(`
`).filter((line) => line.trim());
    const totalLines = lines.length;
    if (totalLines <= lastReadLine) {
      logger.debug(`No new lines for ${sessionId}: total=${totalLines}, lastRead=${lastReadLine}`);
      return { messages, toolUses, newLastReadLine: lastReadLine, totalLines };
    }
    const newLines = lines.slice(lastReadLine);
    logger.info(`Processing ${newLines.length} new lines for session ${sessionId} (lines ${lastReadLine + 1}-${totalLines})`);
    let tempMessageCounter = 0;
    for (let i = 0;i < newLines.length; i++) {
      const line = newLines[i];
      const lineNumber = lastReadLine + i;
      try {
        const entry = JSON.parse(line);
        if (!entry.message)
          continue;
        const role = entry.message.role;
        const content2 = entry.message.content;
        if ((role === "user" || role === "assistant") && content2) {
          const textContent = extractTextContent(content2);
          if (textContent) {
            const messageId = entry.uuid || generateMessageId(sessionId, tempMessageCounter);
            messages.push({
              id: messageId,
              session_id: sessionId,
              role,
              content: textContent,
              created_at: entry.timestamp || new Date().toISOString(),
              message_index: tempMessageCounter
            });
            tempMessageCounter++;
            logger.debug(`Extracted ${role} message at line ${lineNumber + 1}: ${textContent.substring(0, 50)}...`);
          }
        }
        if (Array.isArray(content2)) {
          for (const contentBlock of content2) {
            if (contentBlock.type === "tool_use") {
              const toolUse = extractToolUse(contentBlock, sessionId, entry.timestamp);
              if (toolUse) {
                toolUses.push(toolUse);
                logger.debug(`Extracted tool use at line ${lineNumber + 1}: ${toolUse.tool_name} on ${toolUse.file_path}`);
              }
            }
          }
        }
        if (entry.toolUseResult) {
          const toolUseWithDiff = extractToolUseResult(entry, sessionId);
          if (toolUseWithDiff) {
            toolUses.push(toolUseWithDiff);
            logger.debug(`Extracted tool result at line ${lineNumber + 1}: ${toolUseWithDiff.file_path}`);
            logDiff(toolUseWithDiff.file_path || "", toolUseWithDiff.diff);
          }
        }
      } catch (parseError) {
        logger.debug(`Failed to parse JSONL line ${lineNumber + 1}: ${line.substring(0, 100)}...`, parseError);
      }
    }
    logger.info(`Incremental extraction complete: ${messages.length} messages, ${toolUses.length} tool uses`);
    return {
      messages,
      toolUses,
      newLastReadLine: totalLines,
      totalLines
    };
  } catch (error) {
    logger.error(`Failed to incrementally read conversation file ${filePath}:`, error);
    return {
      messages,
      toolUses,
      newLastReadLine: lastReadLine,
      totalLines: lastReadLine
    };
  }
}

// src/utils/queue-manager.ts
import { appendFile as appendFile2, mkdir as mkdir3, readFile as readFile3, stat, unlink as unlink2, writeFile as writeFile2 } from "node:fs/promises";
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
async function appendToJsonl(filePath, data) {
  await withLock(filePath, async () => {
    await ensureDirectory(dirname3(filePath));
    const line = JSON.stringify(data) + `
`;
    await appendFile2(filePath, line, "utf8");
  });
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

// src/utils/state-manager.ts
import { mkdir as mkdir4, readFile as readFile4, writeFile as writeFile3 } from "node:fs/promises";
import { join as join2 } from "node:path";
var STATE_DIR2 = join2(CLAUDE_ZEST_DIR, "state");
function getStateFilePath(sessionId) {
  return join2(STATE_DIR2, `${sessionId}.json`);
}
async function ensureStateDir() {
  try {
    await mkdir4(STATE_DIR2, { recursive: true });
  } catch (error) {
    logger.debug("State directory already exists or error creating:", error);
  }
}
async function readSessionState(sessionId) {
  try {
    const stateFile = getStateFilePath(sessionId);
    const content = await readFile4(stateFile, "utf-8");
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
    await writeFile3(stateFile, JSON.stringify(state, null, 2), "utf-8");
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

// src/utils/extraction-helpers.ts
async function findConversationFile(projectDir) {
  try {
    const claudeDirName = projectDir.replace(/\//g, "-");
    const projectPath = join3(CLAUDE_PROJECTS_DIR, claudeDirName);
    logger.debug(`Looking for project directory: ${projectPath}`);
    try {
      await stat2(projectPath);
    } catch {
      logger.warn(`Project directory not found: ${projectPath}`);
      return null;
    }
    const { readdir } = await import("node:fs/promises");
    const entries = await readdir(projectPath);
    const jsonlFiles = entries.filter((f) => f.endsWith(".jsonl"));
    if (jsonlFiles.length === 0) {
      logger.warn(`No session files found in ${projectPath}`);
      return null;
    }
    let mostRecentFile = jsonlFiles[0];
    let mostRecentTime = 0;
    for (const file of jsonlFiles) {
      const filePath = join3(projectPath, file);
      const stats = await stat2(filePath);
      if (stats.mtimeMs > mostRecentTime) {
        mostRecentTime = stats.mtimeMs;
        mostRecentFile = file;
      }
    }
    const conversationFile = join3(projectPath, mostRecentFile);
    const sessionId = basename(mostRecentFile, ".jsonl");
    const fileStats = await stat2(conversationFile);
    return { conversationFile, sessionId, fileStats };
  } catch (error) {
    logger.error("Failed to find conversation file:", error);
    return null;
  }
}
async function extractNewSessionData(conversationFile, sessionId) {
  const state = await readSessionState(sessionId);
  const lastReadLine = state?.lastReadLine || 0;
  const lastMessageIndex = state?.lastMessageIndex ?? -1;
  const isNewSession = !state;
  logger.info(`Extraction state: lastReadLine=${lastReadLine}, lastMessageIndex=${lastMessageIndex} (${isNewSession ? "new session" : "existing session"})`);
  const { messages, toolUses, newLastReadLine } = await extractNewMessagesFromFile(conversationFile, sessionId, lastReadLine);
  let nextMessageIndex = lastMessageIndex + 1;
  for (const message of messages) {
    message.message_index = nextMessageIndex++;
  }
  logger.info(`Extraction results: ${messages.length} messages (indices ${lastMessageIndex + 1}-${nextMessageIndex - 1}), ${toolUses.length} tool uses, ${newLastReadLine - lastReadLine} new lines`);
  const hasNewData = messages.length > 0 || toolUses.length > 0;
  if (!hasNewData) {
    logger.info("No new data to process");
  }
  return {
    messages,
    toolUses,
    newLastReadLine,
    lastMessageIndex: nextMessageIndex - 1,
    isNewSession,
    hasNewData
  };
}
async function queueSessionData(sessionId, messages, toolUses, fileStats, projectDir, conversationFile, newLastReadLine, lastMessageIndex, isNewSession) {
  if (isNewSession) {
    const session = {
      id: sessionId,
      title: messages.length > 0 ? messages[0].content.substring(0, 100) : `Session ${sessionId}`,
      created_at: fileStats.birthtime.toISOString()
    };
    await enqueueChatSession(session);
    logger.info(`Queued new session: ${session.id}`);
  }
  for (const message of messages) {
    const extractedMessage = {
      id: message.id,
      session_id: message.session_id,
      message_index: message.message_index,
      role: message.role,
      content: message.content,
      created_at: message.created_at
    };
    await enqueueChatMessage(extractedMessage);
  }
  if (messages.length > 0) {
    logger.info(`Queued ${messages.length} messages`);
  }
  const eventsQueued = await queueToolUseEvents(toolUses, sessionId, projectDir);
  await updateLastReadLine(sessionId, conversationFile, newLastReadLine, lastMessageIndex);
  logger.info(`Updated extraction state: lastReadLine=${newLastReadLine}, lastMessageIndex=${lastMessageIndex}`);
  return { messagesQueued: messages.length, eventsQueued };
}
async function queueToolUseEvents(toolUses, sessionId, projectDir) {
  const session = await getValidSession();
  const workspaceId = session?.workspaceId || null;
  let queuedEventCount = 0;
  for (const toolUse of toolUses) {
    if (!toolUse.file_path)
      continue;
    if (toolUse.tool_name === "Read" || toolUse.tool_name === "read") {
      continue;
    }
    if (!toolUse.diff) {
      continue;
    }
    const event = {
      id: randomUUID(),
      timestamp: toolUse.timestamp,
      document_uri: toolUse.file_path,
      language_id: import_utils.getLanguageFromPath(toolUse.file_path),
      workspace_folder_uri: projectDir || null,
      session_id: sessionId,
      workspace_id: workspaceId,
      payload: {
        tool_name: toolUse.tool_name,
        session_id: sessionId,
        diff: toolUse.diff
      }
    };
    await enqueueEvent(event);
    queuedEventCount++;
  }
  if (queuedEventCount > 0) {
    logger.info(`Queued ${queuedEventCount} code change events`);
  }
  return queuedEventCount;
}

// src/hooks/incremental-extractor-cli.ts
async function main() {
  const startTime = Date.now();
  logger.info("=== Incremental extraction triggered by PostToolUse ===");
  const toolName = process.env.CLAUDE_TOOL_NAME;
  const filePaths = process.env.CLAUDE_FILE_PATHS;
  const projectDir = process.env.CLAUDE_PROJECT_DIR;
  logger.info(`Tool: ${toolName || "unknown"}`);
  logger.info(`Files: ${filePaths || "unknown"}`);
  logger.info(`Project: ${projectDir || "unknown"}`);
  try {
    logger.debug("Waiting 1000ms for JSONL write to complete...");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.debug(`Delay complete, proceeding with extraction (${Date.now() - startTime}ms elapsed)`);
    if (!projectDir) {
      logger.warn("CLAUDE_PROJECT_DIR not set, cannot extract");
      process.exit(0);
    }
    const sessionInfo = await findConversationFile(projectDir);
    if (!sessionInfo) {
      logger.warn("Could not find conversation file");
      process.exit(0);
    }
    const { conversationFile, sessionId, fileStats } = sessionInfo;
    logger.info(`Session file: ${conversationFile}`);
    logger.info(`Session ID: ${sessionId}`);
    logger.info(`File modified: ${fileStats.mtime.toISOString()}`);
    logger.info(`File size: ${fileStats.size} bytes`);
    const extractionResult = await extractNewSessionData(conversationFile, sessionId);
    if (!extractionResult.hasNewData) {
      logger.info("No new data to process, exiting");
      process.exit(0);
    }
    await queueSessionData(sessionId, extractionResult.messages, extractionResult.toolUses, fileStats, projectDir, conversationFile, extractionResult.newLastReadLine, extractionResult.lastMessageIndex, extractionResult.isNewSession);
    const totalTime = Date.now() - startTime;
    logger.info(`=== Incremental extraction complete in ${totalTime}ms ===`);
  } catch (error) {
    logger.error("Failed to perform incremental extraction:", error);
    process.exit(0);
  }
}
main().catch((error) => {
  console.error("Incremental extractor error:", error);
  process.exit(1);
});

//# debugId=020A6DC5FB56CB8464756E2164756E21
