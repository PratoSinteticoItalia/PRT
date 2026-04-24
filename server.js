import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { extname, dirname, join, resolve, sep } from "node:path";
import { createHmac, createSign, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 4178);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = dirname(fileURLToPath(import.meta.url));
const FALLBACK_DATA_DIR = resolve(join(ROOT, "data"));
let DATA_DIR = resolve(process.env.DATA_DIR || FALLBACK_DATA_DIR);
let STORE_PATH = join(DATA_DIR, "store.json");
let SESSION_PATH = join(DATA_DIR, "session.json");
let BACKUP_DIR = join(DATA_DIR, "backups");
const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();
const R2_ACCOUNT_ID = String(process.env.R2_ACCOUNT_ID || "").trim();
const R2_ACCESS_KEY_ID = String(process.env.R2_ACCESS_KEY_ID || "").trim();
const R2_SECRET_ACCESS_KEY = String(process.env.R2_SECRET_ACCESS_KEY || "").trim();
const R2_BUCKET_NAME = String(process.env.R2_BUCKET_NAME || "").trim();
const R2_REGION = String(process.env.R2_REGION || "auto").trim() || "auto";
const STORE_DOC_KEY = "store";
const SESSION_DOC_KEY = "sessions";
const SESSION_TABLE = "app_sessions";
const USE_POSTGRES = Boolean(DATABASE_URL);
const USE_R2 = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
const DEFAULT_SALES_REQUEST_SPREADSHEET = "https://docs.google.com/spreadsheets/d/15n7HIxhiX0U2EX28R9euiZfCqBNZPZ0AE8Hmb-p0vHw/edit";
const GOOGLE_SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const MAX_CREW_LOGO_DATA_URL_LENGTH = 6_500_000;
const SALES_REQUEST_FIRST_CONTACT_SENT_STATUS = "1° contatto";
const SALES_REQUEST_FIRST_CONTACT_QUEUED_STATUS = "da richiamare";
const WHATSAPP_AUTOMATION_ENABLED = String(process.env.WHATSAPP_AUTOMATION_ENABLED || "true").trim().toLowerCase() !== "false";
const WHATSAPP_GRAPH_API_VERSION = String(process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0").trim() || "v20.0";
const WHATSAPP_DEFAULT_ACCESS_TOKEN = String(process.env.WHATSAPP_ACCESS_TOKEN || "").trim();
const WHATSAPP_DEFAULT_PHONE_NUMBER_ID = String(process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
const WHATSAPP_IVAN_ACCESS_TOKEN = String(process.env.WHATSAPP_IVAN_ACCESS_TOKEN || WHATSAPP_DEFAULT_ACCESS_TOKEN).trim();
const WHATSAPP_GABRIELE_ACCESS_TOKEN = String(process.env.WHATSAPP_GABRIELE_ACCESS_TOKEN || WHATSAPP_DEFAULT_ACCESS_TOKEN).trim();
const WHATSAPP_IVAN_PHONE_NUMBER_ID = String(process.env.WHATSAPP_IVAN_PHONE_NUMBER_ID || WHATSAPP_DEFAULT_PHONE_NUMBER_ID).trim();
const WHATSAPP_GABRIELE_PHONE_NUMBER_ID = String(process.env.WHATSAPP_GABRIELE_PHONE_NUMBER_ID || WHATSAPP_DEFAULT_PHONE_NUMBER_ID).trim();
const WHATSAPP_DEFAULT_COUNTRY_CODE = String(process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "39").replace(/\D+/g, "") || "39";
const WHATSAPP_GRAPH_TIMEOUT_MS = Math.max(5_000, Number(process.env.WHATSAPP_GRAPH_TIMEOUT_MS || 15_000));
const SALES_REQUEST_AUTOMATION_MODE = String(process.env.SALES_REQUEST_AUTOMATION_MODE || "none").trim().toLowerCase();
const SALES_REQUEST_EMAIL_PROVIDER = String(process.env.SALES_REQUEST_EMAIL_PROVIDER || "resend").trim().toLowerCase();
const SALES_REQUEST_EMAIL_FROM = String(process.env.SALES_REQUEST_EMAIL_FROM || "").trim();
const SALES_REQUEST_EMAIL_REPLY_TO = cleanEmail(process.env.SALES_REQUEST_EMAIL_REPLY_TO || "");
const SALES_REQUEST_EMAIL_SUBJECT_PREFIX = String(process.env.SALES_REQUEST_EMAIL_SUBJECT_PREFIX || "Prato Sintetico Italia").trim();
const SALES_REQUEST_EMAIL_TIMEOUT_MS = Math.max(5_000, Number(process.env.SALES_REQUEST_EMAIL_TIMEOUT_MS || 15_000));
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const SHOPIFY_OAUTH_SCOPES = [
  "read_orders",
  "read_all_orders",
  "read_customers",
  "read_products",
  "read_inventory",
  "read_fulfillments",
  "read_merchant_managed_fulfillment_orders",
  "write_merchant_managed_fulfillment_orders",
].join(",");

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_REFRESH_BUFFER_MS = 1000 * 60 * 60 * 24 * 7;
const LOGIN_WINDOW_MS = 1000 * 60 * 2;
const LOGIN_MAX_ATTEMPTS = 20;
const SHOPIFY_FETCH_TIMEOUT_MS = 15_000;
const SHOPIFY_MAX_RETRIES = 2;
const IS_PUBLIC_DEPLOY = Boolean(process.env.RENDER || process.env.NODE_ENV === "production");
const ALLOW_DEMO_FALLBACK = process.env.ALLOW_DEMO_FALLBACK === "true" || !IS_PUBLIC_DEPLOY;
const PASSWORD_MIN_LENGTH = 12;
const DEFAULT_CREW_DAILY_CAPACITY = 120;
const BOOTSTRAP_OFFICE_EMAIL = String(process.env.BOOTSTRAP_OFFICE_EMAIL || "office@vertex.local").trim().toLowerCase();
const BOOTSTRAP_OFFICE_PASSWORD = String(process.env.BOOTSTRAP_OFFICE_PASSWORD || "");
const API_STATE_LOCK_KEY = 41051721;
const API_STATE_LOCK_TIMEOUT_MS = 60_000;
const API_STATE_LOCK_POLL_MS = 40;
const STORE_BACKUP_MIN_INTERVAL_MS = 1000 * 60 * 2;
const loginAttempts = new Map();
let dbBootstrapPromise = null;
let pgPool = null;
let r2ClientPromise = null;
let runtimeStoreRevision = "";
let lastStoreBackupSnapshotAt = 0;
const STORE_EVENTS_HEARTBEAT_MS = 25_000;
const storeEventsClients = new Map();

function writeStoreEvent(res, eventName = "", payload = {}) {
  const event = String(eventName || "").trim();
  if (event) {
    res.write(`event: ${event}\n`);
  }
  res.write(`data: ${JSON.stringify(payload || {})}\n\n`);
}

function unregisterStoreEventsClient(clientId = "") {
  const record = storeEventsClients.get(clientId);
  if (!record) return;
  if (record.heartbeatTimer) {
    clearInterval(record.heartbeatTimer);
  }
  storeEventsClients.delete(clientId);
}

function registerStoreEventsClient(req, res, { userId = "", extraHeaders = {} } = {}) {
  const clientId = randomUUID();
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(`: keepalive ${Date.now()}\n\n`);
    } catch {
      unregisterStoreEventsClient(clientId);
    }
  }, STORE_EVENTS_HEARTBEAT_MS);
  if (typeof heartbeatTimer.unref === "function") heartbeatTimer.unref();

  storeEventsClients.set(clientId, {
    userId: String(userId || ""),
    res,
    heartbeatTimer,
    lastRevision: "",
  });

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
    ...extraHeaders,
  });
  if (typeof res.flushHeaders === "function") res.flushHeaders();
  res.write("retry: 2000\n\n");

  const currentRevision = getStoreRevision();
  const currentClient = storeEventsClients.get(clientId);
  if (currentClient) currentClient.lastRevision = currentRevision;
  writeStoreEvent(res, "ready", {
    revision: currentRevision,
    timestamp: new Date().toISOString(),
  });

  const cleanup = () => unregisterStoreEventsClient(clientId);
  req.on("close", cleanup);
  req.on("aborted", cleanup);
  res.on("close", cleanup);
  res.on("error", cleanup);
}

function broadcastStoreRevision(revision = "") {
  const normalizedRevision = String(revision || "").trim();
  if (!normalizedRevision) return;
  const payload = {
    revision: normalizedRevision,
    timestamp: new Date().toISOString(),
  };
  for (const [clientId, client] of storeEventsClients.entries()) {
    if (!client || !client.res) {
      unregisterStoreEventsClient(clientId);
      continue;
    }
    if (client.lastRevision === normalizedRevision) continue;
    try {
      writeStoreEvent(client.res, "store-revision", payload);
      client.lastRevision = normalizedRevision;
    } catch {
      unregisterStoreEventsClient(clientId);
    }
  }
}

function buildStoreRevisionToken() {
  return `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
}

function getStoreRevision(store = null) {
  const fromStore = String(store?._storeRevision || "").trim();
  if (fromStore) {
    runtimeStoreRevision = fromStore;
    return fromStore;
  }
  return String(runtimeStoreRevision || "");
}

function rotateStoreRevision(store = null) {
  const nextRevision = buildStoreRevisionToken();
  if (store && typeof store === "object") {
    store._storeRevision = nextRevision;
  }
  runtimeStoreRevision = nextRevision;
  return nextRevision;
}

function ensureStoreRevision(store = null) {
  const existingRevision = getStoreRevision(store);
  if (existingRevision) return existingRevision;
  return rotateStoreRevision(store);
}

function normalizeUserRole(role = "") {
  const normalized = String(role || "").trim().toLowerCase();
  const compact = normalized
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!compact) return "";
  if (/(^|\s)(crew|squadra|team|posa|posatore|posatori|installer|installatori)(\s|$)/.test(compact)) return "crew";
  if (/(^|\s)(warehouse|magazzino|inventory|logistica)(\s|$)/.test(compact)) return "warehouse";
  if (/(^|\s)(office|ufficio|admin|amministrazione|commerciale)(\s|$)/.test(compact)) return "office";
  return "";
}

function validatePasswordStrength(password = "") {
  const value = String(password || "");
  if (value.length < PASSWORD_MIN_LENGTH) return "weak_password_length";
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) return "weak_password_case";
  if (!/\d/.test(value)) return "weak_password_number";
  return "";
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: scryptSync(String(password || ""), salt, 64).toString("hex"),
  };
}

function verifyPasswordRecord(user, password) {
  const candidate = String(password || "");
  if (user?.passwordHash && user?.passwordSalt) {
    const derived = scryptSync(candidate, user.passwordSalt, 64).toString("hex");
    const left = Buffer.from(derived, "utf8");
    const right = Buffer.from(String(user.passwordHash), "utf8");
    return left.length === right.length && timingSafeEqual(left, right);
  }
  return String(user?.password || "") === candidate;
}

function sanitizePasswordUser(user = {}) {
  const nextUser = { ...user };
  nextUser.role = normalizeUserRole(nextUser.role) || "office";
  const plainPassword = String(nextUser.password || "");
  if ((!nextUser.passwordHash || !nextUser.passwordSalt) && plainPassword) {
    const { hash, salt } = hashPassword(plainPassword);
    nextUser.passwordHash = hash;
    nextUser.passwordSalt = salt;
  }
  nextUser.status = nextUser.status === "suspended" ? "suspended" : "active";
  nextUser.mustChangePassword = Boolean(nextUser.mustChangePassword);
  nextUser.sessionVersion = Math.max(1, Number(nextUser.sessionVersion || 1));
  nextUser.lastPasswordChangeAt = String(nextUser.lastPasswordChangeAt || "");
  nextUser.crewName = String(nextUser.crewName || (nextUser.role === "crew" ? nextUser.name : "") || "").trim();
  const parsedCapacity = Number(String(nextUser.dailyCapacity ?? (nextUser.role === "crew" ? DEFAULT_CREW_DAILY_CAPACITY : 0)).replace(",", ".").replace(/[^\d.-]/g, ""));
  nextUser.dailyCapacity = Number.isFinite(parsedCapacity)
    ? Math.max(0, parsedCapacity)
    : (nextUser.role === "crew" ? DEFAULT_CREW_DAILY_CAPACITY : 0);
  nextUser.crewLogoDataUrl = nextUser.role === "crew"
    ? sanitizeCrewLogoDataUrl(nextUser.crewLogoDataUrl || "")
    : "";
  delete nextUser.password;
  return nextUser;
}

function getClientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim();
}

function getLoginAttemptKey(req, email) {
  return `${getClientIp(req)}::${String(email || "").trim().toLowerCase()}`;
}

function pruneLoginAttempts(now = Date.now()) {
  for (const [key, entry] of loginAttempts.entries()) {
    if (!entry || entry.resetAt <= now) loginAttempts.delete(key);
  }
}

function recordFailedLogin(req, email) {
  pruneLoginAttempts();
  const key = getLoginAttemptKey(req, email);
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= Date.now()) {
    loginAttempts.set(key, { count: 1, resetAt: Date.now() + LOGIN_WINDOW_MS });
    return;
  }
  current.count += 1;
}

function clearFailedLogin(req, email) {
  loginAttempts.delete(getLoginAttemptKey(req, email));
}

function isLoginBlocked(req, email) {
  pruneLoginAttempts();
  const entry = loginAttempts.get(getLoginAttemptKey(req, email));
  return Boolean(entry && entry.count >= LOGIN_MAX_ATTEMPTS && entry.resetAt > Date.now());
}

function setDataDir(nextDir) {
  DATA_DIR = resolve(nextDir);
  STORE_PATH = join(DATA_DIR, "store.json");
  SESSION_PATH = join(DATA_DIR, "session.json");
  BACKUP_DIR = join(DATA_DIR, "backups");
}

function buildSessionCookie(sessionId, maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000)) {
  const secureFlag = IS_PUBLIC_DEPLOY ? "; Secure" : "";
  return `vertex_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Number(maxAgeSeconds) || 0)}${secureFlag}`;
}

function buildExpiredSessionCookie() {
  const secureFlag = IS_PUBLIC_DEPLOY ? "; Secure" : "";
  return `vertex_session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${secureFlag}`;
}

function buildShopifyOauthStateCookie(state) {
  const secureFlag = IS_PUBLIC_DEPLOY ? "; Secure" : "";
  return `shopify_oauth_state=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900${secureFlag}`;
}

function buildExpiredShopifyOauthStateCookie() {
  const secureFlag = IS_PUBLIC_DEPLOY ? "; Secure" : "";
  return `shopify_oauth_state=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${secureFlag}`;
}

function ensureWritableDataDir() {
  try {
    mkdirSync(DATA_DIR, { recursive: true });
    const probePath = join(DATA_DIR, ".write-test");
    writeFileSync(probePath, "ok", "utf8");
    unlinkSync(probePath);
  } catch {
    if (DATA_DIR !== FALLBACK_DATA_DIR) {
      setDataDir(FALLBACK_DATA_DIR);
      mkdirSync(DATA_DIR, { recursive: true });
    }
  }
}

ensureWritableDataDir();

async function readLocalJson(path, fallback) {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeLocalJson(path, value) {
  const serialized = JSON.stringify(value, null, 2);
  await writeFile(path, serialized, "utf8");
  if (resolve(path) === resolve(STORE_PATH)) {
    try {
      mkdirSync(BACKUP_DIR, { recursive: true });
      writeFileSync(join(BACKUP_DIR, "store-latest.json"), serialized, "utf8");
      const now = Date.now();
      const shouldCreateTimestampSnapshot = !lastStoreBackupSnapshotAt
        || (now - lastStoreBackupSnapshotAt) >= STORE_BACKUP_MIN_INTERVAL_MS;
      if (shouldCreateTimestampSnapshot) {
        lastStoreBackupSnapshotAt = now;
        const timestamp = new Date(now).toISOString().replace(/[:.]/g, "-");
        writeFileSync(join(BACKUP_DIR, `store-${timestamp}.json`), serialized, "utf8");
        const snapshots = readdirSync(BACKUP_DIR)
          .filter((file) => /^store-\d{4}-\d{2}-\d{2}T/.test(file))
          .sort()
          .reverse();
        snapshots.slice(30).forEach((file) => {
          try {
            unlinkSync(join(BACKUP_DIR, file));
          } catch {}
        });
      }
    } catch (error) {
      console.error("store_backup_failed", error);
    }
  }
}

async function getPgPool() {
  if (!USE_POSTGRES) return null;
  if (pgPool) return pgPool;
  const { Pool } = await import("pg");
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    max: 4,
    idleTimeoutMillis: 30_000,
  });
  return pgPool;
}

async function ensureDatabaseStorage() {
  if (!USE_POSTGRES) return;
  if (dbBootstrapPromise) return dbBootstrapPromise;
  dbBootstrapPromise = (async () => {
    const pool = await getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_documents (
        key TEXT PRIMARY KEY,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${SESSION_TABLE} (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS ${SESSION_TABLE}_user_idx ON ${SESSION_TABLE} (user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS ${SESSION_TABLE}_expires_idx ON ${SESSION_TABLE} (expires_at)`);

    const storeResult = await pool.query("SELECT key FROM app_documents WHERE key = $1 LIMIT 1", [STORE_DOC_KEY]);
    if (!storeResult.rowCount) {
      const initialStore = existsSync(STORE_PATH)
        ? await readLocalJson(STORE_PATH, buildDefaultStore())
        : buildDefaultStore();
      await pool.query(
        `
          INSERT INTO app_documents (key, payload, updated_at)
          VALUES ($1, $2::jsonb, NOW())
        `,
        [STORE_DOC_KEY, JSON.stringify(initialStore)],
      );
    }

    const sessionResult = await pool.query("SELECT key FROM app_documents WHERE key = $1 LIMIT 1", [SESSION_DOC_KEY]);
    if (!sessionResult.rowCount) {
      const initialSessions = existsSync(SESSION_PATH)
        ? await readLocalJson(SESSION_PATH, {})
        : {};
      await pool.query(
        `
          INSERT INTO app_documents (key, payload, updated_at)
          VALUES ($1, $2::jsonb, NOW())
        `,
        [SESSION_DOC_KEY, JSON.stringify(initialSessions)],
      );
      const migrationEntries = Object.entries(initialSessions || {});
      for (const [legacySessionId, rawEntry] of migrationEntries) {
        const normalized = normalizeSessionEntry(rawEntry);
        if (!normalized || !legacySessionId) continue;
        await pool.query(
          `
            INSERT INTO ${SESSION_TABLE} (session_id, user_id, version, expires_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (session_id)
            DO UPDATE SET user_id = EXCLUDED.user_id, version = EXCLUDED.version, expires_at = EXCLUDED.expires_at, updated_at = NOW()
          `,
          [
            String(legacySessionId),
            normalized.userId,
            normalized.version,
            normalized.expiresAt || (Date.now() + SESSION_TTL_MS),
          ],
        );
      }
    }
  })().catch((error) => {
    dbBootstrapPromise = null;
    throw error;
  });
  return dbBootstrapPromise;
}

async function readDatabaseDocument(key, fallback) {
  await ensureDatabaseStorage();
  const pool = await getPgPool();
  const result = await pool.query("SELECT payload FROM app_documents WHERE key = $1 LIMIT 1", [key]);
  if (!result.rowCount) return fallback;
  return result.rows[0]?.payload ?? fallback;
}

async function writeDatabaseDocument(key, value) {
  await ensureDatabaseStorage();
  const pool = await getPgPool();
  await pool.query(
    `
      INSERT INTO app_documents (key, payload, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (key)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `,
    [key, JSON.stringify(value)],
  );
}

async function readStoreRevisionSnapshot() {
  if (USE_POSTGRES) {
    await ensureDatabaseStorage();
    const pool = await getPgPool();
    const result = await pool.query(
      "SELECT payload->>'_storeRevision' AS revision FROM app_documents WHERE key = $1 LIMIT 1",
      [STORE_DOC_KEY],
    );
    const revision = String(result.rows?.[0]?.revision || "").trim();
    if (revision) {
      runtimeStoreRevision = revision;
      return revision;
    }
  }
  return getStoreRevision();
}

async function readJson(path, fallback) {
  const resolvedPath = resolve(path);
  if (USE_POSTGRES && resolvedPath === resolve(STORE_PATH)) {
    const payload = await readDatabaseDocument(STORE_DOC_KEY, fallback);
    if (payload && typeof payload === "object") ensureStoreRevision(payload);
    return payload;
  }
  if (USE_POSTGRES && resolvedPath === resolve(SESSION_PATH)) {
    return readDatabaseDocument(SESSION_DOC_KEY, fallback);
  }
  const payload = await readLocalJson(path, fallback);
  if (resolvedPath === resolve(STORE_PATH) && payload && typeof payload === "object") ensureStoreRevision(payload);
  return payload;
}

async function writeJson(path, value) {
  const resolvedPath = resolve(path);
  const isStorePayload = resolvedPath === resolve(STORE_PATH);
  if (resolvedPath === resolve(STORE_PATH) && value && typeof value === "object") {
    rotateStoreRevision(value);
  }
  if (USE_POSTGRES && resolvedPath === resolve(STORE_PATH)) {
    await writeDatabaseDocument(STORE_DOC_KEY, value);
    try {
      await writeLocalJson(path, value);
    } catch (error) {
      console.error("store_mirror_write_failed", error);
    }
    if (isStorePayload) {
      broadcastStoreRevision(getStoreRevision(value));
    }
    return;
  }
  if (USE_POSTGRES && resolvedPath === resolve(SESSION_PATH)) {
    await writeDatabaseDocument(SESSION_DOC_KEY, value);
    return;
  }
  await writeLocalJson(path, value);
  if (isStorePayload) {
    broadcastStoreRevision(getStoreRevision(value));
  }
}

function normalizeSessionEntry(entry = null) {
  const userId = typeof entry === "string" ? entry : entry?.userId;
  const versionRaw = typeof entry === "object" ? entry?.version : 1;
  const expiresAtRaw = typeof entry === "object" ? entry?.expiresAt : 0;
  const version = Math.max(1, Number(versionRaw || 1));
  const expiresAt = Math.max(0, Number(expiresAtRaw || 0));
  if (!userId) return null;
  return {
    userId: String(userId),
    version: Number.isFinite(version) ? version : 1,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : 0,
  };
}

function normalizeInventoryProductKey(value = "") {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s*-\s*\d+\s*(?:m|mq|cm)?\s*$/i, "")
    .trim()
    .toLowerCase();
}

async function readSessionEntry(sessionId = "") {
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId) return null;
  if (USE_POSTGRES) {
    await ensureDatabaseStorage();
    const pool = await getPgPool();
    const result = await pool.query(
      `SELECT user_id, version, expires_at FROM ${SESSION_TABLE} WHERE session_id = $1 LIMIT 1`,
      [normalizedSessionId],
    );
    if (!result.rowCount) return null;
    const row = result.rows[0] || {};
    return normalizeSessionEntry({
      userId: row.user_id,
      version: row.version,
      expiresAt: row.expires_at,
    });
  }
  const sessions = await readJson(SESSION_PATH, {});
  return normalizeSessionEntry(sessions[normalizedSessionId]);
}

async function writeSessionEntry(sessionId = "", entry = {}) {
  const normalizedSessionId = String(sessionId || "").trim();
  const normalizedEntry = normalizeSessionEntry(entry);
  if (!normalizedSessionId || !normalizedEntry) return;
  if (USE_POSTGRES) {
    await ensureDatabaseStorage();
    const pool = await getPgPool();
    await pool.query(
      `
        INSERT INTO ${SESSION_TABLE} (session_id, user_id, version, expires_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (session_id)
        DO UPDATE SET user_id = EXCLUDED.user_id, version = EXCLUDED.version, expires_at = EXCLUDED.expires_at, updated_at = NOW()
      `,
      [normalizedSessionId, normalizedEntry.userId, normalizedEntry.version, normalizedEntry.expiresAt],
    );
    return;
  }
  const sessions = await readJson(SESSION_PATH, {});
  sessions[normalizedSessionId] = normalizedEntry;
  await writeJson(SESSION_PATH, sessions);
}

async function deleteSessionEntry(sessionId = "") {
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId) return;
  if (USE_POSTGRES) {
    await ensureDatabaseStorage();
    const pool = await getPgPool();
    await pool.query(`DELETE FROM ${SESSION_TABLE} WHERE session_id = $1`, [normalizedSessionId]);
    return;
  }
  const sessions = await readJson(SESSION_PATH, {});
  if (!(normalizedSessionId in sessions)) return;
  delete sessions[normalizedSessionId];
  await writeJson(SESSION_PATH, sessions);
}

async function withApiStateLock(task) {
  if (!USE_POSTGRES) {
    return task();
  }
  const pool = await getPgPool();
  const lockClient = await pool.connect();
  let locked = false;
  try {
    const deadline = Date.now() + API_STATE_LOCK_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const attempt = await lockClient.query("SELECT pg_try_advisory_lock($1) AS locked", [API_STATE_LOCK_KEY]);
      if (attempt.rows?.[0]?.locked) {
        locked = true;
        break;
      }
      await wait(API_STATE_LOCK_POLL_MS);
    }
    if (!locked) {
      const error = new Error("state_lock_timeout");
      error.code = "state_lock_timeout";
      throw error;
    }
    return await task();
  } finally {
    if (locked) {
      try {
        await lockClient.query("SELECT pg_advisory_unlock($1)", [API_STATE_LOCK_KEY]);
      } catch {}
    }
    lockClient.release();
  }
}

function buildDefaultStore() {
  const bootstrapUsers = !IS_PUBLIC_DEPLOY || ALLOW_DEMO_FALLBACK
    ? [
        {
          id: "u1",
          name: "Gabriele Todaro",
          email: "office@vertex.local",
          password: "office123",
          role: "office",
        },
        {
          id: "u2",
          name: "Ivan Magazzino",
          email: "warehouse@vertex.local",
          password: "warehouse123",
          role: "warehouse",
        },
        {
          id: "u3",
          name: "Squadra Alpha",
          email: "crew@vertex.local",
          password: "crew123",
          role: "crew",
          crewName: "Alpha",
          dailyCapacity: DEFAULT_CREW_DAILY_CAPACITY,
        },
      ]
    : (
        BOOTSTRAP_OFFICE_PASSWORD && !validatePasswordStrength(BOOTSTRAP_OFFICE_PASSWORD)
          ? [
              {
                id: "u1",
                name: "Office Admin",
                email: BOOTSTRAP_OFFICE_EMAIL,
                password: BOOTSTRAP_OFFICE_PASSWORD,
                role: "office",
              },
            ]
          : []
      );

  return {
    users: bootstrapUsers,
    jobs: [],
    orders: [],
    inventory: [],
    salesRequests: [],
    salesContents: [],
    salesRequestSource: {
      spreadsheetInput: DEFAULT_SALES_REQUEST_SPREADSHEET,
      sheetName: "",
      serviceAccountEmail: "",
      privateKey: "",
    },
    coveragePlanner: {
      teams: {},
      availability: {},
    },
    securityEvents: [],
    shopifySettings: {
      storeDomain: "",
      clientId: "",
      clientSecret: "",
      adminAccessToken: "",
      installedShop: "",
      tokenScope: "",
      tokenUpdatedAt: "",
      lastSyncAt: "",
      lastSyncStatus: "",
      lastSyncMessage: "",
      locationName: "",
      carrierName: "",
      shippingRateMode: "oneexpress-auto",
      shippingTariffProfile: "silver",
      volumetricDivisor: "5000",
      rate80: "",
      rate150: "",
      rate300: "",
      rate500: "",
      rate1000: "",
      extraKgRate: "",
      webhookBaseUrl: "",
      webhookEndpoint: "",
      webhookSubscriptionId: "",
    },
  };
}

function getDemoUsers() {
  return buildDefaultStore().users.map((user) => ({ ...user }));
}

function normalizeBase64Payload(value = "") {
  return String(value || "").replace(/\s+/g, "");
}

function decodeSvgDataUrlPayload(payload = "") {
  const rawPayload = String(payload || "").trim();
  if (!rawPayload) return "";
  try {
    return decodeURIComponent(rawPayload);
  } catch {
    return rawPayload;
  }
}

function sanitizeCrewLogoDataUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw || raw.length > MAX_CREW_LOGO_DATA_URL_LENGTH) return "";
  const commaIndex = raw.indexOf(",");
  if (commaIndex <= 0) return "";
  const header = raw.slice(0, commaIndex);
  const payload = raw.slice(commaIndex + 1);
  const headerMatch = header.match(/^data:([^;,]+)(.*)$/i);
  if (!headerMatch) return "";

  const mime = String(headerMatch[1] || "").trim().toLowerCase();
  const params = String(headerMatch[2] || "").toLowerCase();
  const hasBase64 = params.includes(";base64");

  if (["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(mime)) {
    if (!hasBase64) return "";
    const normalizedBase64 = normalizeBase64Payload(payload);
    if (!normalizedBase64 || !/^[a-z0-9+/=]+$/i.test(normalizedBase64)) return "";
    const normalizedMime = mime === "image/jpg" ? "image/jpeg" : mime;
    const normalized = `data:${normalizedMime};base64,${normalizedBase64}`;
    return normalized.length <= MAX_CREW_LOGO_DATA_URL_LENGTH ? normalized : "";
  }

  if (mime !== "image/svg+xml") return "";

  const normalizedSvgPayload = normalizeBase64Payload(payload);
  if (hasBase64 && (!normalizedSvgPayload || !/^[a-z0-9+/=]+$/i.test(normalizedSvgPayload))) return "";
  const svgMarkup = hasBase64
    ? Buffer.from(normalizedSvgPayload, "base64").toString("utf8")
    : decodeSvgDataUrlPayload(payload);
  const normalizedSvgMarkup = String(svgMarkup || "").trim();
  if (!normalizedSvgMarkup || !/<svg[\s>]/i.test(normalizedSvgMarkup)) return "";

  const normalized = `data:image/svg+xml;base64,${Buffer.from(normalizedSvgMarkup, "utf8").toString("base64")}`;
  return normalized.length <= MAX_CREW_LOGO_DATA_URL_LENGTH ? normalized : "";
}

function sanitizeUser(user) {
  if (!user) return null;
  const normalizedRole = normalizeUserRole(user.role) || "office";
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: normalizedRole,
    crewName: String(user.crewName || ""),
    dailyCapacity: Math.max(0, Number(user.dailyCapacity || 0)),
    crewLogoDataUrl: normalizedRole === "crew" ? sanitizeCrewLogoDataUrl(user.crewLogoDataUrl || "") : "",
    status: user.status === "suspended" ? "suspended" : "active",
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

function isValidRole(role = "") {
  return Boolean(normalizeUserRole(role));
}

function normalizeCrewName(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/\b(squadra|team|crew)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pushSecurityEvent(store, type, actor, message, meta = {}) {
  store.securityEvents = Array.isArray(store.securityEvents) ? store.securityEvents : [];
  store.securityEvents.unshift({
    id: randomUUID(),
    type,
    actor: actor || "system",
    message,
    meta,
    createdAt: new Date().toISOString(),
  });
  store.securityEvents = store.securityEvents.slice(0, 150);
}

function serializeShopifySettings(settings = {}) {
  return {
    ...settings,
    clientSecret: "",
    adminAccessToken: "",
    hasClientSecret: Boolean(String(settings.clientSecret || "").trim()),
    hasAdminAccessToken: Boolean(String(settings.adminAccessToken || "").trim()),
  };
}

function requireOffice(res, currentUser) {
  if (!currentUser) return false;
  if (currentUser?.role === "office") return false;
  sendJson(res, 403, { error: "forbidden" });
  return true;
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self' https://*.myshopify.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    ...headers,
  });
  res.end(JSON.stringify(payload));
}

function sendRedirect(res, location, headers = {}) {
  res.writeHead(302, {
    Location: location,
    ...headers,
  });
  res.end();
}

function getStaticHeaders(contentType) {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

function isValidShopDomain(shop = "") {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(String(shop || "").trim());
}

function buildShopifyAuthQuery(searchParams) {
  return [...searchParams.entries()]
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function verifyShopifyOauthHmac(searchParams, secret) {
  const hmac = String(searchParams.get("hmac") || "");
  if (!hmac || !secret) return false;
  const payload = buildShopifyAuthQuery(searchParams);
  const digest = createHmac("sha256", secret).update(payload).digest("hex");
  const left = Buffer.from(digest, "utf8");
  const right = Buffer.from(hmac, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function getRequestBaseUrl(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim() || "https";
  return `${proto}://${req.headers.host}`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = SHOPIFY_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableShopifyStatus(status) {
  return Number(status) === 429 || Number(status) >= 500;
}

async function parseShopifyResponse(response) {
  const text = await response.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { rawText: text };
  }
}

function getShopifyRedirectUri(req) {
  return `${getRequestBaseUrl(req)}/api/shopify/oauth/callback`;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function toNumber(value) {
  const parsed = Number(String(value || "").replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeDdtLabel(value = "") {
  return String(value || "")
    .replace(/^D\.?D\.?T\.?\s*[-:]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildUniqueDdtNumber(store = {}) {
  const used = new Set();
  let highestNumeric = 0;
  const orders = Array.isArray(store.orders) ? store.orders : [];
  orders.forEach((order) => {
    const raw = String(order?.operations?.warehouse?.ddt?.number || "").trim();
    if (!raw) return;
    used.add(raw.toUpperCase());
    const normalized = normalizeDdtLabel(raw);
    const numericMatch = normalized.match(/(\d{2,})/);
    if (!numericMatch) return;
    const numeric = Number(numericMatch[1]);
    if (Number.isFinite(numeric)) highestNumeric = Math.max(highestNumeric, numeric);
  });
  let nextNumeric = Math.max(1, highestNumeric + 1);
  let candidate = `DDT ${nextNumeric}`;
  while (used.has(candidate.toUpperCase())) {
    nextNumeric += 1;
    candidate = `DDT ${nextNumeric}`;
  }
  return candidate;
}

function parseSquareMeters(title, quantity = 1) {
  const normalized = String(title || "").replace(",", ".");
  const slashMatch = normalized.match(/(\d+(?:\.\d+)?)\s*m\s*\/\s*(\d+(?:\.\d+)?)\s*m/i);
  if (slashMatch) return toNumber(slashMatch[1]) * toNumber(slashMatch[2]) * quantity;

  const xMatch = normalized.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*m/i);
  if (xMatch) return toNumber(xMatch[1]) * toNumber(xMatch[2]) * quantity;

  const mqMatch = normalized.match(/(\d+(?:\.\d+)?)\s*mq/i);
  if (mqMatch) return toNumber(mqMatch[1]) * quantity;

  return 0;
}

function classifyOrderLine(title = "") {
  if (/(installazione|posa)/i.test(title)) return "service";
  if (/(banda|giunzione|telo|colla|picchetti|pietrisco|bordura|ciottol|lapillo|sabbia|kit|profumo|detergente|spazzolatrice|spazzola|mattonella|campionatura|box campionatura)/i.test(title)) {
    return "material";
  }
  return "product";
}

function normalizeStringLineDetails(lineItems = []) {
  return lineItems.map((item) => {
    const raw = String(item || "");
    const qtyMatch = raw.match(/·\s*(\d+(?:[.,]\d+)?)\s*pz/i);
    return normalizeLineDetailRecord({
      title: raw.replace(/\s*·\s*\d+(?:[.,]\d+)?\s*pz/i, "").trim(),
      quantity: qtyMatch ? toNumber(qtyMatch[1]) : 1,
    });
  });
}

function extractLineCutNote(entries = [], fallback = "") {
  const pairs = normalizeAttributePairs(entries);
  const preferred = pairs.filter((item) => /(tagli?|taglio|cut|cuts|misure|dimensioni|formato|size|lunghezza|larghezza)/i.test(item.key));
  const selected = preferred.length ? preferred : pairs.slice(0, 2);
  const chunks = selected
    .map((item) => `${String(item.key || "").trim()}: ${String(item.value || "").trim()}`.trim())
    .filter(Boolean);
  const fallbackText = String(fallback || "").trim();
  if (!chunks.length && fallbackText) chunks.push(fallbackText);
  return chunks.join(" · ");
}

function normalizeTaxLines(lines = []) {
  if (!Array.isArray(lines)) return [];
  return lines
    .map((item) => ({
      title: String(item?.title || item?.name || "").trim(),
      rate: toNumber(item?.rate ?? 0),
      amount: toNumber(item?.price ?? item?.amount ?? item?.priceSet?.shopMoney?.amount ?? 0),
    }))
    .filter((item) => item.title || item.rate > 0 || item.amount > 0);
}

function normalizeLookupKey(value = "") {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeBooleanFlag(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = normalizeLookupKey(value);
  if (!normalized) return null;
  if (["1", "si", "s", "yes", "true", "on", "richiesta", "requested"].includes(normalized)) return true;
  if (["0", "no", "false", "off", "non richiesta", "not requested"].includes(normalized)) return false;
  return null;
}

function cleanVatNumber(value = "") {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
}

function cleanTaxCode(value = "") {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
}

function cleanRecipientCode(value = "") {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
}

function cleanEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function normalizeAttributePairs(entries = []) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const key = String(entry.key ?? entry.name ?? entry.label ?? "").trim();
      const value = String(entry.value ?? entry.text ?? "").trim();
      if (!key || !value) return null;
      return { key, value };
    })
    .filter(Boolean);
}

const BILLING_METADATA_ALIASES = {
  company: ["company", "company name", "business name", "ragione sociale", "azienda", "denominazione", "intestazione"],
  vatNumber: ["partita iva", "partitaiva", "p iva", "piva", "vat", "vat number", "vatnumber", "vat id", "vatid", "tax registration id"],
  taxCode: ["codice fiscale", "codicefiscale", "tax code", "taxcode", "fiscal code", "cf"],
  sdiCode: ["sdi", "codice sdi", "codice destinatario", "codice univoco", "recipient code", "recipientcode", "destinatario"],
  pecEmail: ["pec", "pec email", "posta elettronica certificata", "email pec"],
  invoiceRequested: ["fattura richiesta", "richiesta fattura", "richiede fattura", "invoice requested", "invoice required", "need invoice", "fattura", "invoice"],
};

function getMetadataValueFromSource(source = {}, aliases = []) {
  const aliasSet = new Set(aliases.map((item) => normalizeLookupKey(item)));
  for (const [key, value] of Object.entries(source || {})) {
    if (!aliasSet.has(normalizeLookupKey(key))) continue;
    if (value == null) continue;
    const text = typeof value === "string" ? value.trim() : String(value).trim();
    if (text) return text;
  }
  return "";
}

function getMetadataValueFromAttributes(entries = [], aliases = []) {
  const aliasSet = new Set(aliases.map((item) => normalizeLookupKey(item)));
  for (const entry of entries) {
    if (!aliasSet.has(normalizeLookupKey(entry.key))) continue;
    if (entry.value) return entry.value;
  }
  return "";
}

function extractBillingMetadata(...inputs) {
  const sources = [];
  const attributes = [];
  for (const input of inputs) {
    if (Array.isArray(input)) {
      attributes.push(...normalizeAttributePairs(input));
    } else if (input && typeof input === "object") {
      sources.push(input);
    }
  }

  const pickValue = (field) => {
    const aliases = BILLING_METADATA_ALIASES[field] || [];
    for (const source of sources) {
      const found = getMetadataValueFromSource(source, aliases);
      if (found) return found;
    }
    return getMetadataValueFromAttributes(attributes, aliases);
  };

  const company = String(pickValue("company") || "").trim();
  const vatNumber = cleanVatNumber(pickValue("vatNumber"));
  const taxCode = cleanTaxCode(pickValue("taxCode"));
  const sdiCode = cleanRecipientCode(pickValue("sdiCode"));
  const pecEmail = cleanEmail(pickValue("pecEmail"));
  const invoiceRequestedRaw = pickValue("invoiceRequested");
  let invoiceRequested = normalizeBooleanFlag(invoiceRequestedRaw);
  if (invoiceRequested == null && (vatNumber || taxCode || sdiCode || pecEmail)) invoiceRequested = true;

  return {
    company,
    vatNumber,
    taxCode,
    sdiCode,
    pecEmail,
    invoiceRequested: Boolean(invoiceRequested),
  };
}

function inferInvoiceRequired(accounting = {}, billing = {}) {
  return Boolean(
    accounting?.invoiceRequired
    || billing?.invoiceRequested
    || billing?.vatNumber
    || billing?.taxCode
    || billing?.sdiCode
    || billing?.pecEmail,
  );
}

function normalizeAccountingPaymentRecord(item = {}, index = 0, fallbackMethod = "") {
  const amount = Number(toNumber(item.amount ?? item.value ?? 0).toFixed(2));
  if (amount <= 0) return null;
  const type = ["deposit", "balance", "manual"].includes(String(item.type || "").trim())
    ? String(item.type || "").trim()
    : "manual";
  return {
    id: String(item.id || randomUUID()),
    type,
    amount,
    method: String(item.method || fallbackMethod || "").trim(),
    date: String(item.date || "").trim(),
    note: String(item.note || "").trim(),
    createdAt: String(item.createdAt || new Date().toISOString()),
  };
}

function buildLegacyAccountingPayments(accounting = {}, fallbackMethod = "") {
  const payments = [];
  const depositPaid = Number(toNumber(accounting.depositPaid || 0).toFixed(2));
  const balancePaid = Number(toNumber(accounting.balancePaid || 0).toFixed(2));
  if (depositPaid > 0) {
    payments.push(normalizeAccountingPaymentRecord({
      id: `legacy-deposit-${randomUUID()}`,
      type: "deposit",
      amount: depositPaid,
      method: fallbackMethod,
    }, 0, fallbackMethod));
  }
  if (balancePaid > 0) {
    payments.push(normalizeAccountingPaymentRecord({
      id: `legacy-balance-${randomUUID()}`,
      type: "balance",
      amount: balancePaid,
      method: fallbackMethod,
    }, 1, fallbackMethod));
  }
  return payments.filter(Boolean);
}

function normalizeAccountingRecord(accounting = {}, fallbackMethod = "", billing = {}) {
  const paymentMethod = String(accounting.paymentMethod || fallbackMethod || "").trim();
  let payments = Array.isArray(accounting.payments)
    ? accounting.payments.map((item, index) => normalizeAccountingPaymentRecord(item, index, paymentMethod)).filter(Boolean)
    : [];
  if (!payments.length) {
    payments = buildLegacyAccountingPayments(accounting, paymentMethod);
  }
  const depositPaid = Number(payments.filter((item) => item.type === "deposit").reduce((sum, item) => sum + toNumber(item.amount || 0), 0).toFixed(2));
  const balancePaid = Number(payments.filter((item) => item.type !== "deposit").reduce((sum, item) => sum + toNumber(item.amount || 0), 0).toFixed(2));
  return {
    paymentMethod,
    depositPaid,
    balancePaid,
    payments,
    invoiceRequired: inferInvoiceRequired(accounting, billing),
    invoiceIssued: Boolean(accounting?.invoiceIssued),
    accountingNote: String(accounting?.accountingNote || ""),
  };
}

function normalizeLineDetailRecord(item = {}) {
  const taxLines = normalizeTaxLines(item.taxLines || item.tax_lines || []);
  const explicitTaxAmount = item.taxAmount != null ? toNumber(item.taxAmount) : null;
  const explicitTotalPrice = item.totalPrice != null
    ? toNumber(item.totalPrice)
    : item.line_price != null
      ? toNumber(item.line_price)
      : item.discountedTotalSet?.shopMoney?.amount != null
        ? toNumber(item.discountedTotalSet.shopMoney.amount)
        : 0;
  const rawTitle = String(item.title || item.name || "").trim();
  const rawVariant = String(item.variant || item.variantTitle || item.variant_title || "").trim();
  const hasUsefulVariant = Boolean(rawVariant) && !/^(default|titolo predefinito)\s*title$/i.test(rawVariant);
  const title = hasUsefulVariant && rawTitle && !rawTitle.toLowerCase().includes(rawVariant.toLowerCase())
    ? `${rawTitle} - ${rawVariant}`
    : (rawTitle || (hasUsefulVariant ? rawVariant : ""));
  const note = extractLineCutNote(
    [
      ...(Array.isArray(item.properties) ? item.properties : []),
      ...(Array.isArray(item.customAttributes) ? item.customAttributes : []),
      ...(Array.isArray(item.noteAttributes) ? item.noteAttributes : []),
    ],
    item.note || item.lineNote || item.line_note || "",
  );
  return {
    title,
    quantity: Math.max(1, Number(item.quantity || item.currentQuantity || 1)),
    sku: String(item.sku || "").trim(),
    variant: hasUsefulVariant ? rawVariant : "",
    note,
    taxable: item.taxable == null ? taxLines.length > 0 : Boolean(item.taxable),
    requiresShipping: item.requiresShipping == null ? true : Boolean(item.requiresShipping),
    taxLines,
    totalPrice: Number(explicitTotalPrice.toFixed(2)),
    taxAmount: explicitTaxAmount != null
      ? explicitTaxAmount
      : Number(taxLines.reduce((sum, taxLine) => sum + toNumber(taxLine.amount || 0), 0).toFixed(2)),
  };
}

function normalizeBillingAddress(source = {}, fallbackOrder = {}, metadata = {}) {
  const invoiceRequested = metadata.invoiceRequested ?? normalizeBooleanFlag(
    source.invoiceRequested
    ?? source.invoice_requested
    ?? fallbackOrder.invoiceRequested,
  );
  return {
    firstName: String(source.first_name || source.firstName || fallbackOrder.firstName || "").trim(),
    lastName: String(source.last_name || source.lastName || fallbackOrder.lastName || "").trim(),
    company: String(metadata.company || source.company || source.companyName || "").trim(),
    email: String(source.email || fallbackOrder.email || "").trim(),
    phone: String(source.phone || fallbackOrder.phone || "").trim(),
    address: [source.address1, source.address2].filter(Boolean).join(" ").trim() || String(source.address || fallbackOrder.address || "").trim(),
    city: String(source.city || fallbackOrder.city || "").trim(),
    provinceCode: String(source.province_code || source.provinceCode || fallbackOrder.provinceCode || "").trim().toUpperCase(),
    province: String(source.province || fallbackOrder.province || "").trim(),
    postalCode: String(source.zip || source.postalCode || fallbackOrder.postalCode || "").trim(),
    countryCode: String(source.country_code || source.countryCode || fallbackOrder.countryCode || "IT").trim().toUpperCase(),
    vatNumber: cleanVatNumber(metadata.vatNumber || source.vatNumber || source.vat_number || source.vatId || fallbackOrder.vatNumber || ""),
    taxCode: cleanTaxCode(metadata.taxCode || source.taxCode || source.tax_code || source.codiceFiscale || fallbackOrder.taxCode || ""),
    sdiCode: cleanRecipientCode(metadata.sdiCode || source.sdiCode || source.sdi_code || source.destinationCode || fallbackOrder.sdiCode || ""),
    pecEmail: cleanEmail(metadata.pecEmail || source.pecEmail || source.pec || fallbackOrder.pecEmail || ""),
    invoiceRequested: invoiceRequested == null ? false : Boolean(invoiceRequested),
    taxExempt: Boolean(source.tax_exempt ?? source.taxExempt ?? false),
    taxesIncluded: Boolean(source.taxes_included ?? source.taxesIncluded ?? false),
  };
}

function normalizeOrderTotals(source = {}, fallbackGross = 0) {
  const lineDetails = Array.isArray(source.lineDetails) ? source.lineDetails.map((item) => normalizeLineDetailRecord(item)) : [];
  const lineNetSubtotal = Number(lineDetails.reduce((sum, item) => sum + toNumber(item.totalPrice || 0), 0).toFixed(2));
  const lineTaxTotal = Number(lineDetails.reduce((sum, item) => sum + toNumber(item.taxAmount || 0), 0).toFixed(2));
  const hasValue = (value) => value != null && String(value).trim() !== "";
  const grossTotal = Number(toNumber(source.grossTotal ?? source.total ?? source.currentTotalPrice ?? fallbackGross).toFixed(2));
  const explicitNet = source.netSubtotal ?? source.subtotal ?? source.currentSubtotal;
  const explicitTax = source.taxTotal ?? source.totalTax ?? source.currentTotalTax;
  const explicitTaxKnown = typeof source.taxKnown === "boolean" ? source.taxKnown : null;
  const explicitNetKnown = typeof source.netKnown === "boolean" ? source.netKnown : null;
  const hasExplicitNet = hasValue(explicitNet);
  const hasExplicitTax = hasValue(explicitTax);
  const derivedTaxFromNet = hasExplicitNet ? Math.max(0, Number((grossTotal - toNumber(explicitNet)).toFixed(2))) : 0;
  const explicitTaxAmount = hasExplicitTax ? Number(toNumber(explicitTax).toFixed(2)) : 0;
  const ignoreZeroExplicitTax = hasExplicitTax && explicitTaxAmount === 0 && derivedTaxFromNet > 0;
  const inferredTaxSource = hasExplicitTax && !ignoreZeroExplicitTax
    ? "explicit"
    : lineTaxTotal > 0
      ? "lines"
      : derivedTaxFromNet > 0
        ? "derived"
        : "none";
  const taxTotal = hasExplicitTax && !ignoreZeroExplicitTax
    ? explicitTaxAmount
    : lineTaxTotal > 0
      ? lineTaxTotal
      : derivedTaxFromNet;
  const taxKnown = explicitTaxKnown == null
    ? ((hasExplicitTax && !ignoreZeroExplicitTax) || lineTaxTotal > 0 || derivedTaxFromNet > 0)
    : explicitTaxKnown;
  const netSubtotal = hasExplicitNet
    ? Number(toNumber(explicitNet).toFixed(2))
    : lineNetSubtotal > 0
      ? lineNetSubtotal
      : Math.max(0, Number((grossTotal - taxTotal).toFixed(2)));
  const inferredNetSource = hasExplicitNet
    ? "explicit"
    : lineNetSubtotal > 0
      ? "lines"
      : grossTotal > 0 && taxTotal >= 0
        ? "derived"
        : "none";
  const netKnown = explicitNetKnown == null
    ? (hasExplicitNet || lineNetSubtotal > 0 || taxKnown)
    : explicitNetKnown;
  return {
    grossTotal,
    taxTotal,
    netSubtotal,
    taxKnown,
    netKnown,
    taxSource: String(source.taxSource || inferredTaxSource).trim() || inferredTaxSource,
    netSource: String(source.netSource || inferredNetSource).trim() || inferredNetSource,
    currency: String(source.currency || source.currencyCode || "EUR").trim().toUpperCase() || "EUR",
  };
}

function extractShopifyLegacyId(value = "") {
  const raw = String(value || "").trim();
  const match = raw.match(/gid:\/\/shopify\/Order\/(\d+)/i);
  return match ? match[1] : raw;
}

function getNormalizedShopifyNumericId(order = {}) {
  const explicit = String(order.shopifyNumericId || order.legacyResourceId || "").trim();
  if (explicit) return explicit;
  if (String(order.source || "").toLowerCase().startsWith("shopify")) {
    return extractShopifyLegacyId(order.id);
  }
  return "";
}

function getNormalizedShopifyGraphqlId(order = {}) {
  const explicit = String(order.shopifyGraphqlId || order.adminGraphqlApiId || "").trim();
  if (explicit.startsWith("gid://shopify/Order/")) return explicit;
  const numericId = getNormalizedShopifyNumericId(order);
  return numericId ? `gid://shopify/Order/${numericId}` : "";
}

function areSameShopifyOrder(left = {}, right = {}) {
  const leftGraphqlId = getNormalizedShopifyGraphqlId(left);
  const rightGraphqlId = getNormalizedShopifyGraphqlId(right);
  if (leftGraphqlId && rightGraphqlId && leftGraphqlId === rightGraphqlId) return true;
  const leftNumericId = getNormalizedShopifyNumericId(left);
  const rightNumericId = getNormalizedShopifyNumericId(right);
  return Boolean(leftNumericId && rightNumericId && leftNumericId === rightNumericId);
}

function deriveOrderData(order) {
  const details = Array.isArray(order.lineDetails) && order.lineDetails.length
    ? order.lineDetails
    : normalizeStringLineDetails(order.lineItems || []);

  const products = [];
  const materials = [];
  const services = [];
  let sqm = 0;

  details.forEach((detail) => {
    const title = String(detail.title || "").trim();
    const variant = String(detail.variant || "").trim();
    const quantity = Number(detail.quantity || 1);
    if (!title) return;
    const type = classifyOrderLine(title);
    if (type === "service") {
      services.push(title);
      if (!sqm) sqm = quantity;
      return;
    }
    if (type === "material") {
      materials.push(title);
      return;
    }
    let itemSqm = parseSquareMeters(title, quantity);
    if (!itemSqm && variant) {
      itemSqm = parseSquareMeters(variant, quantity);
    }
    if (!itemSqm && quantity > 0) {
      itemSqm = quantity;
    }
    sqm += itemSqm;
    products.push({ title, sqm: itemSqm });
  });

  const mainProduct = [...products].sort((a, b) => b.sqm - a.sqm)[0]?.title || products[0]?.title || "Da definire";
  const inferredSurface = materials.some((item) => /(pietrisco|picchetti|telo)/i.test(item)) ? "terra" : "pavimentazione";

  return {
    mainProduct: mainProduct.trim(),
    sqm: Math.round(sqm || 0),
    materials,
    services,
    jobType: services.length ? "fornitura-posa" : "fornitura",
    surface: inferredSurface,
  };
}

function normalizeTravelExpenses(items = [], fallbackCrew = "") {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const rawCategory = String(item?.category || "").trim().toLowerCase();
      const category = ["hotel", "fuel", "meal", "toll"].includes(rawCategory) ? rawCategory : "other";
      const amount = Number(toNumber(item?.amount || 0).toFixed(2));
      return {
        id: String(item?.id || randomUUID()),
        category,
        amount,
        date: String(item?.date || "").slice(0, 10),
        note: String(item?.note || "").trim(),
        crew: String(item?.crew || fallbackCrew || "").trim(),
        createdAt: String(item?.createdAt || new Date().toISOString()),
        createdBy: String(item?.createdBy || "").trim(),
      };
    })
    .filter((item) => item.amount > 0 && item.date);
}

function normalizeCoveragePlanner(payload = {}) {
  const teams = payload?.teams && typeof payload.teams === "object" ? payload.teams : {};
  const availability = payload?.availability && typeof payload.availability === "object" ? payload.availability : {};
  return {
    teams,
    availability,
  };
}

function normalizeSalesRequestService(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("posa")) return "posa";
  if (normalized.includes("fornitura")) return "fornitura";
  return "";
}

function normalizeSalesRequestHeight(value = "") {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!raw) return "";
  const compact = raw.replace(/\s+/g, "");
  const numericOnly = compact.match(/^(\d+(?:[.,]\d+)?)$/);
  if (numericOnly) {
    const amount = numericOnly[1].replace(/\.0+$/, "").replace(",", ".");
    return `${Number(amount)} mm`;
  }
  const millimeterMatch = compact.match(/^(\d+(?:[.,]\d+)?)(mm|millimetri?|millimeters?)$/i);
  if (millimeterMatch) {
    const amount = millimeterMatch[1].replace(/\.0+$/, "").replace(",", ".");
    return `${Number(amount)} mm`;
  }
  const centimeterMatch = compact.match(/^(\d+(?:[.,]\d+)?)(cm|centimetri?|centimeters?)$/i);
  if (centimeterMatch) {
    const amount = centimeterMatch[1].replace(/\.0+$/, "").replace(",", ".");
    return `${Number(amount)} cm`;
  }
  return raw;
}

function getSalesRequestRawHeightValue(item = {}) {
  const directValue = (
    item.requestedHeight
    ?? item.altezza
    ?? item.height
    ?? item.mm
    ?? item.spessore
    ?? item.altezzaDaPreventivare
    ?? item.altezza_richiesta
    ?? ""
  );
  const directText = String(directValue ?? "").trim();
  if (directText) return directText;
  const dynamicEntry = Object.entries(item || {}).find(([key, raw]) => {
    const keyText = normalizeSalesRequestImportHeader(key || "");
    if (!isSalesRequestHeightHeader(keyText)) return false;
    return String(raw ?? "").trim() !== "";
  });
  return dynamicEntry ? String(dynamicEntry[1] ?? "").trim() : "";
}

function normalizeSalesRequestAssignment(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = normalizeSalesRequestImportHeader(raw);
  if (!normalized || ["non assegnato", "non assegnata", "unassigned", "none", "na"].includes(normalized)) return "";
  if (normalized.includes("ivan")) return "Ivan";
  if (normalized.includes("gabriele")) return "Gabriele";
  return "";
}

function normalizeIsoDateTime(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) return "";
  return parsed.toISOString();
}

function normalizeSalesRequestFirstContactState(value = "") {
  const normalized = normalizeSalesRequestImportHeader(value);
  if (!normalized) return "";
  if (["sent", "inviato", "inviata", "sent now"].includes(normalized)) return "sent";
  if (["queued", "coda", "in coda", "scheduled", "pending"].includes(normalized)) return "queued";
  return "";
}

function shouldPromoteSalesRequestToFirstContact(status = "") {
  const code = normalizeSalesRequestStatus(status);
  if (code === "new" || !String(status || "").trim()) return true;
  const normalized = normalizeSalesRequestImportHeader(status);
  return [
    "followup",
    "follow up",
    "follow-up",
    "da richiamare",
    "richiamare",
    "in attesa di risposta",
    "nessuna risposta",
  ].includes(normalized);
}

function normalizePhoneForWhatsApp(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  let digits = "";
  if (raw.startsWith("+")) {
    digits = raw.replace(/\D+/g, "");
  } else {
    const cleaned = raw.replace(/\D+/g, "");
    if (!cleaned) return "";
    if (cleaned.startsWith("00")) {
      digits = cleaned.slice(2);
    } else if (cleaned.startsWith(WHATSAPP_DEFAULT_COUNTRY_CODE)) {
      digits = cleaned;
    } else {
      digits = `${WHATSAPP_DEFAULT_COUNTRY_CODE}${cleaned}`;
    }
  }
  return digits.length >= 8 ? digits : "";
}

function extractSalesRequestPhoneFromWhatsAppUrl(value = "") {
  const normalizedUrl = normalizeSalesRequestWhatsAppUrl(value);
  if (!normalizedUrl) return "";
  try {
    const parsed = new URL(normalizedUrl);
    const host = parsed.hostname.toLowerCase();
    if (host === "wa.me") {
      const direct = parsed.pathname.replace(/^\//, "").split("/")[0] || "";
      return normalizePhoneForWhatsApp(direct);
    }
    const queryPhone = parsed.searchParams.get("phone") || "";
    return normalizePhoneForWhatsApp(queryPhone);
  } catch {
    return "";
  }
}

function extractSalesRequestMessageFromWhatsAppUrl(value = "") {
  const normalizedUrl = normalizeSalesRequestWhatsAppUrl(value);
  if (!normalizedUrl) return "";
  try {
    const parsed = new URL(normalizedUrl);
    return String(parsed.searchParams.get("text") || "").trim();
  } catch {
    return "";
  }
}

function isGenericSalesRequestWhatsAppTemplate(value = "") {
  const normalized = normalizeSalesRequestImportHeader(value);
  if (!normalized) return false;
  return (
    normalized === "messaggio whatsapp"
    || normalized === "whatsapp message"
    || normalized === "primo contatto whatsapp"
    || normalized === "first whatsapp contact"
    || normalized.includes("messaggio preimpostato")
    || normalized.includes("template whatsapp")
  );
}

function getSalesRequestServiceIntent(value = "") {
  const normalized = normalizeSalesRequestService(value);
  if (normalized === "fornitura") return "supply-only";
  if (normalized === "posa") return "supply-install";
  return "";
}

function getSalesRequestDisplayName(item = {}) {
  return `${item.name || ""} ${item.surname || ""}`.trim() || "cliente";
}

function buildSalesRequestDefaultWhatsAppMessage(item = {}) {
  const recipient = getSalesRequestDisplayName(item);
  const serviceIntent = getSalesRequestServiceIntent(item.service);
  if (serviceIntent === "supply-only") {
    return `Ciao ${recipient}, grazie per la richiesta. Ti confermiamo disponibilita per la sola fornitura del prato sintetico. Se vuoi ti inviamo subito proposta e tempi di consegna.`;
  }
  if (serviceIntent === "supply-install") {
    return `Ciao ${recipient}, grazie per la richiesta. Ti confermiamo disponibilita per fornitura e posa completa. Se vuoi ti inviamo proposta con materiali, posa e tempistiche.`;
  }
  return `Ciao ${recipient}, ti contattiamo in merito al tuo preventivo.`;
}

function getSalesRequestAutomatedWhatsAppMessage(item = {}) {
  const template = String(item.whatsappTemplate || "").trim();
  if (template && !isGenericSalesRequestWhatsAppTemplate(template)) return template;
  const fromUrl = extractSalesRequestMessageFromWhatsAppUrl(item.whatsappUrl || "");
  if (fromUrl) return fromUrl;
  return buildSalesRequestDefaultWhatsAppMessage(item);
}

function isValidEmailAddress(value = "") {
  const email = cleanEmail(value);
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function buildSalesRequestDefaultEmailSubject(item = {}) {
  const recipient = getSalesRequestDisplayName(item);
  return `${SALES_REQUEST_EMAIL_SUBJECT_PREFIX} · Richiesta preventivo ${recipient}`.trim();
}

function buildSalesRequestDefaultEmailBody(item = {}) {
  const recipient = getSalesRequestDisplayName(item);
  const serviceIntent = getSalesRequestServiceIntent(item.service);
  if (serviceIntent === "supply-only") {
    return [
      `Ciao ${recipient},`,
      "",
      "grazie per la tua richiesta. Possiamo supportarti con la fornitura del prato sintetico.",
      "Se vuoi, rispondi a questa email e ti inviamo proposta completa con tempi di consegna.",
      "",
      "Team Prato Sintetico Italia",
    ].join("\n");
  }
  if (serviceIntent === "supply-install") {
    return [
      `Ciao ${recipient},`,
      "",
      "grazie per la tua richiesta. Possiamo supportarti con fornitura e posa completa.",
      "Se vuoi, rispondi a questa email e ti inviamo proposta con materiali, posa e tempistiche.",
      "",
      "Team Prato Sintetico Italia",
    ].join("\n");
  }
  return [
    `Ciao ${recipient},`,
    "",
    "ti contattiamo in merito alla tua richiesta di preventivo.",
    "Rispondi a questa email e ti inviamo tutti i dettagli.",
    "",
    "Team Prato Sintetico Italia",
  ].join("\n");
}

function getSalesRequestAutomatedEmailPayload(item = {}) {
  const template = String(item.whatsappTemplate || "").trim();
  const bodyText = template && !isGenericSalesRequestWhatsAppTemplate(template)
    ? template
    : buildSalesRequestDefaultEmailBody(item);
  return {
    subject: buildSalesRequestDefaultEmailSubject(item),
    bodyText,
  };
}

async function sendSalesRequestFirstContactEmail({ requestRecord = {} } = {}) {
  if (SALES_REQUEST_EMAIL_PROVIDER !== "resend") {
    return { ok: false, reason: "unsupported_email_provider" };
  }
  if (!RESEND_API_KEY || !isValidEmailAddress(SALES_REQUEST_EMAIL_FROM)) {
    return { ok: false, reason: "missing_email_config" };
  }
  const recipientEmail = cleanEmail(requestRecord.email || "");
  if (!isValidEmailAddress(recipientEmail)) {
    return { ok: false, reason: "missing_email" };
  }
  const { subject, bodyText } = getSalesRequestAutomatedEmailPayload(requestRecord);
  if (!String(bodyText || "").trim()) {
    return { ok: false, reason: "missing_message" };
  }

  const payload = {
    from: SALES_REQUEST_EMAIL_FROM,
    to: [recipientEmail],
    subject: subject || `${SALES_REQUEST_EMAIL_SUBJECT_PREFIX} · Preventivo`,
    text: bodyText,
  };
  if (isValidEmailAddress(SALES_REQUEST_EMAIL_REPLY_TO)) {
    payload.reply_to = SALES_REQUEST_EMAIL_REPLY_TO;
  }

  try {
    const response = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      SALES_REQUEST_EMAIL_TIMEOUT_MS,
    );
    const rawResponse = await response.text().catch(() => "");
    let parsed = {};
    if (rawResponse) {
      try {
        parsed = JSON.parse(rawResponse);
      } catch {
        parsed = { raw: rawResponse };
      }
    }
    if (!response.ok) {
      const providerError = String(parsed?.message || parsed?.error?.message || parsed?.raw || "").trim();
      return {
        ok: false,
        reason: "provider_error",
        statusCode: Number(response.status || 0),
        details: providerError,
      };
    }
    return {
      ok: true,
      messageId: String(parsed?.id || "").trim(),
    };
  } catch (error) {
    return {
      ok: false,
      reason: "network_error",
      details: String(error?.message || "network_error"),
    };
  }
}

function getSalesRequestWhatsAppOperatorConfig(assignment = "") {
  const operator = normalizeSalesRequestAssignment(assignment);
  if (!operator) return { operator: "", accessToken: "", phoneNumberId: "" };
  if (operator === "Ivan") {
    return {
      operator,
      accessToken: WHATSAPP_IVAN_ACCESS_TOKEN,
      phoneNumberId: WHATSAPP_IVAN_PHONE_NUMBER_ID,
    };
  }
  if (operator === "Gabriele") {
    return {
      operator,
      accessToken: WHATSAPP_GABRIELE_ACCESS_TOKEN,
      phoneNumberId: WHATSAPP_GABRIELE_PHONE_NUMBER_ID,
    };
  }
  return { operator, accessToken: "", phoneNumberId: "" };
}

async function sendSalesRequestFirstContactWhatsApp({ requestRecord = {}, assignment = "" } = {}) {
  if (!WHATSAPP_AUTOMATION_ENABLED) {
    return { ok: false, reason: "automation_disabled" };
  }
  const operatorConfig = getSalesRequestWhatsAppOperatorConfig(assignment);
  if (!operatorConfig.operator) {
    return { ok: false, reason: "missing_assignment" };
  }
  if (!operatorConfig.accessToken || !operatorConfig.phoneNumberId) {
    return { ok: false, reason: "missing_operator_config" };
  }
  const to = extractSalesRequestPhoneFromWhatsAppUrl(requestRecord.whatsappUrl || "")
    || normalizePhoneForWhatsApp(requestRecord.phone || "");
  if (!to) {
    return { ok: false, reason: "missing_phone" };
  }
  const message = getSalesRequestAutomatedWhatsAppMessage(requestRecord);
  if (!message) {
    return { ok: false, reason: "missing_message" };
  }

  const endpoint = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${operatorConfig.phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      preview_url: false,
      body: message,
    },
  };

  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${operatorConfig.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
      WHATSAPP_GRAPH_TIMEOUT_MS,
    );
    const rawResponse = await response.text().catch(() => "");
    let parsed = {};
    if (rawResponse) {
      try {
        parsed = JSON.parse(rawResponse);
      } catch {
        parsed = { raw: rawResponse };
      }
    }
    if (!response.ok) {
      const providerError = String(parsed?.error?.message || parsed?.raw || "").trim();
      return {
        ok: false,
        reason: "provider_error",
        statusCode: Number(response.status || 0),
        details: providerError,
      };
    }
    const messageId = String(parsed?.messages?.[0]?.id || "").trim();
    return {
      ok: true,
      operator: operatorConfig.operator,
      messageId,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "network_error",
      details: String(error?.message || "network_error"),
    };
  }
}

async function applySalesRequestAutomationOnSave({ existingRequest = null, requestRecord = {}, nowIso = new Date().toISOString() } = {}) {
  const normalized = normalizeSalesRequestRecord(requestRecord);
  const previousAssignment = normalizeSalesRequestAssignment(existingRequest?.assignment || "");
  const nextAssignment = normalizeSalesRequestAssignment(normalized.assignment || "");
  const assignmentChanged = Boolean(nextAssignment && nextAssignment !== previousAssignment);
  const alreadySent = normalizeSalesRequestFirstContactState(existingRequest?.firstContactState || "") === "sent";
  const mode = ["email", "whatsapp"].includes(SALES_REQUEST_AUTOMATION_MODE)
    ? SALES_REQUEST_AUTOMATION_MODE
    : "none";
  if (!assignmentChanged || alreadySent) {
    return {
      record: normalized,
      automation: { action: "none" },
    };
  }
  if (mode === "none") {
    return {
      record: normalized,
      automation: { action: "none" },
    };
  }

  const baseStatus = String(normalized.status || "").trim() || "new";
  const shouldPromoteStatus = shouldPromoteSalesRequestToFirstContact(baseStatus);
  const sendResult = mode === "email"
    ? await sendSalesRequestFirstContactEmail({
      requestRecord: normalized,
      assignment: nextAssignment,
    })
    : await sendSalesRequestFirstContactWhatsApp({
      requestRecord: normalized,
      assignment: nextAssignment,
    });

  if (sendResult.ok) {
    return {
      record: normalizeSalesRequestRecord({
        ...normalized,
        firstContactState: "sent",
        firstContactScheduledAt: nowIso,
        firstContactSentAt: nowIso,
        firstContactBy: nextAssignment,
        status: shouldPromoteStatus ? SALES_REQUEST_FIRST_CONTACT_SENT_STATUS : baseStatus,
      }),
      automation: {
        action: "sent",
        channel: mode,
        operator: nextAssignment,
        scheduledAt: nowIso,
        messageId: sendResult.messageId || "",
      },
    };
  }

  return {
    record: normalizeSalesRequestRecord({
      ...normalized,
      firstContactState: "queued",
      firstContactScheduledAt: nowIso,
      firstContactSentAt: "",
      firstContactBy: nextAssignment,
      status: shouldPromoteStatus ? SALES_REQUEST_FIRST_CONTACT_QUEUED_STATUS : baseStatus,
    }),
    automation: {
      action: "queued",
      channel: mode,
      operator: nextAssignment,
      scheduledAt: nowIso,
      reason: String(sendResult.reason || "send_failed"),
      details: String(sendResult.details || ""),
    },
  };
}

function normalizeSalesRequestStatus(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "new";
  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return "new";
  if ([
    "new",
    "nuova",
    "nuovo",
    "lead",
    "richiesta nuova",
    "nuova richiesta",
  ].includes(normalized)) return "new";
  if ([
    "quoted",
    "quote",
    "preventivo",
    "in preventivo",
    "preventivo inviato",
    "offerta",
    "offerta inviata",
    "quotato",
  ].includes(normalized)) return "quoted";
  if ([
    "followup",
    "follow up",
    "follow-up",
    "da richiamare",
    "richiamare",
    "richiamata",
    "recall",
    "attesa",
    "in lavorazione",
    "da seguire",
  ].includes(normalized)) return "followup";
  if ([
    "closed",
    "chiusa",
    "chiuso",
    "vinta",
    "vinto",
    "persa",
    "perso",
    "completata",
    "completato",
    "archiviata",
    "archiviato",
  ].includes(normalized)) return "closed";
  return raw;
}

function normalizeSalesRequestSurface(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("terra")) return "terra";
  if (normalized.includes("paviment")) return "pavimentazione";
  return "";
}

function normalizeSalesRequestSourceConfig(config = {}) {
  return {
    spreadsheetInput: String(config.spreadsheetInput || DEFAULT_SALES_REQUEST_SPREADSHEET).trim(),
    sheetName: String(config.sheetName || "").trim(),
    serviceAccountEmail: String(config.serviceAccountEmail || "").trim(),
    privateKey: String(config.privateKey || ""),
  };
}

function resolveSpreadsheetId(input = "") {
  const value = String(input || "").trim();
  if (!value) throw new Error("missing_spreadsheet");
  const urlMatch = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch?.[1]) return urlMatch[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(value)) return value;
  throw new Error("invalid_spreadsheet");
}

function buildSpreadsheetEditUrl(input = "") {
  try {
    return `https://docs.google.com/spreadsheets/d/${resolveSpreadsheetId(input)}/edit`;
  } catch {
    return "";
  }
}

function sanitizeSalesRequestSourceConfig(config = {}) {
  const normalized = normalizeSalesRequestSourceConfig(config);
  return {
    spreadsheetInput: normalized.spreadsheetInput,
    sheetName: normalized.sheetName,
    hasServiceAccount: Boolean(normalized.serviceAccountEmail && normalized.privateKey),
    serviceAccountEmail: normalized.serviceAccountEmail,
    editUrl: buildSpreadsheetEditUrl(normalized.spreadsheetInput),
  };
}

function normalizeSalesRequestImportHeader(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function splitImportedSalesRequestName(value = "") {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return { name: "", surname: "" };
  const parts = cleaned.split(" ");
  if (parts.length === 1) return { name: cleaned, surname: "" };
  return {
    name: parts.slice(0, -1).join(" "),
    surname: parts.slice(-1).join(" "),
  };
}

function isSalesRequestHeightHeader(normalizedHeader = "") {
  const header = String(normalizedHeader || "").trim().replace(/\s+/g, " ");
  if (!header) return false;
  if ([
    "altezza",
    "altezza prato",
    "altezza da preventivare",
    "altezza preventivo",
    "altezza da preventivare mm",
    "altezza mm",
    "mm",
    "spessore",
    "spessore prato",
    "spessore mm",
    "h",
    "h mm",
    "h prato",
  ].includes(header)) return true;
  return header.includes("altezza") || header.includes("spessore");
}

function parseWhatsAppHyperlinkFormulaUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const match = raw.match(/HYPERLINK\(\s*"([^"]+)"/i);
  return match ? String(match[1] || "").trim() : "";
}

function normalizeSalesRequestWhatsAppUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const formulaUrl = parseWhatsAppHyperlinkFormulaUrl(raw);
  const candidate = String(formulaUrl || raw).trim();
  if (!candidate) return "";
  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : candidate.startsWith("www.")
      ? `https://${candidate}`
      : "";
  if (!withProtocol) return "";
  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.toLowerCase();
    if (
      host === "wa.me"
      || host === "api.whatsapp.com"
      || host === "web.whatsapp.com"
      || host === "whatsapp.com"
      || host.endsWith(".whatsapp.com")
    ) {
      return parsed.toString();
    }
  } catch {}
  return "";
}

function extractSalesRequestWhatsAppFormulaUrls(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return [];
  const matches = [...raw.matchAll(/"(https?:\/\/[^"]+)"/gi)];
  if (!matches.length) return [];
  const results = [];
  const seen = new Set();
  matches.forEach((entry) => {
    const candidate = normalizeSalesRequestWhatsAppUrl(entry?.[1] || "");
    if (!candidate || seen.has(candidate)) return;
    seen.add(candidate);
    results.push(candidate);
  });
  return results;
}

function pickSalesRequestWhatsAppUrlForService(rawValue = "", service = "") {
  const direct = normalizeSalesRequestWhatsAppUrl(rawValue);
  if (direct) return direct;
  const candidates = extractSalesRequestWhatsAppFormulaUrls(rawValue);
  if (!candidates.length) return "";
  if (candidates.length === 1) return candidates[0];
  const serviceCode = normalizeSalesRequestService(service);
  if (serviceCode === "fornitura") return candidates[0];
  if (serviceCode === "posa") return candidates[candidates.length - 1];
  return candidates[0];
}

function mapSheetSalesRequestField(target, header, rawValue, rawFormulaValue = "") {
  const value = String(rawValue || "").trim();
  const formulaValue = String(rawFormulaValue || "").trim();
  if (!value && !formulaValue) return;
  const normalizedHeader = normalizeSalesRequestImportHeader(header);
  if (!normalizedHeader) return;

  if (["nome", "name", "first name", "firstname"].includes(normalizedHeader)) {
    target.name = value;
    return;
  }
  if (["cognome", "surname", "last name", "lastname"].includes(normalizedHeader)) {
    target.surname = value;
    return;
  }
  if (["cliente", "customer", "full name", "nome completo", "richiesta", "lead"].includes(normalizedHeader)) {
    const split = splitImportedSalesRequestName(value);
    target.name = split.name;
    target.surname = split.surname;
    return;
  }
  if (["citta", "city", "comune"].includes(normalizedHeader)) {
    target.city = value;
    return;
  }
  if (["telefono", "phone", "tel", "mobile", "cellulare"].includes(normalizedHeader)) {
    target.phone = value;
    return;
  }
  if (["email", "mail"].includes(normalizedHeader)) {
    target.email = value;
    return;
  }
  if (["mq", "sqm", "metri quadri", "metriquadrati"].includes(normalizedHeader)) {
    target.sqm = value;
    return;
  }
  if (isSalesRequestHeightHeader(normalizedHeader)) {
    target.requestedHeight = value;
    return;
  }
  if (["servizio", "service", "tipologia"].includes(normalizedHeader)) {
    target.service = value;
    return;
  }
  if (["fondo", "surface", "superficie"].includes(normalizedHeader)) {
    target.surface = value;
    return;
  }
  if (["assegnazione", "assignment", "owner", "commerciale", "team", "assegnato a", "assegnato", "assegnazione preventivo"].includes(normalizedHeader)) {
    target.assignment = value;
    return;
  }
  if (["stato", "status", "stato preventivo"].includes(normalizedHeader)) {
    target.status = value;
    return;
  }
  if ([
    "messaggio whatsapp",
    "template whatsapp",
    "testo whatsapp",
    "messaggio preimpostato whatsapp",
    "messaggio automatico whatsapp",
    "whatsapp message",
    "whatsapp automation message",
  ].includes(normalizedHeader)) {
    const whatsappUrl = pickSalesRequestWhatsAppUrlForService(formulaValue || value, target.service || "");
    if (whatsappUrl) {
      target.whatsappUrl = whatsappUrl;
      if (!target.whatsappTemplate) {
        const textFromUrl = String(new URL(whatsappUrl).searchParams.get("text") || "").trim();
        if (textFromUrl) target.whatsappTemplate = textFromUrl;
      }
      return;
    }
    target.whatsappTemplate = value;
    return;
  }
  if (["note", "nota", "notes"].includes(normalizedHeader)) {
    target.note = value;
  }
}

function normalizeSheetKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeSheetHeader(value = "", index = 0) {
  const label = String(value || "").trim();
  return label || `column_${index + 1}`;
}

function getResolvedSheetTitle(config = {}, metadata = {}) {
  const preferred = normalizeSheetKey(config.sheetName);
  const sheets = Array.isArray(metadata?.sheets) ? metadata.sheets : [];
  if (preferred) {
    const found = sheets.find((sheet) => normalizeSheetKey(sheet?.properties?.title || "") === preferred);
    if (found?.properties?.title) return String(found.properties.title);
  }
  return String(sheets[0]?.properties?.title || "").trim();
}

function quoteSheetName(sheetName = "") {
  return `'${String(sheetName || "").replace(/'/g, "''")}'`;
}

function base64UrlEncode(value) {
  const source = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return source.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function signJwt(payload, privateKey) {
  const signer = createSign("RSA-SHA256");
  signer.update(payload);
  signer.end();
  return signer.sign(privateKey, "base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function getGoogleAccessTokenForSheets(config) {
  if (!config.serviceAccountEmail || !config.privateKey) {
    throw new Error("missing_service_account");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64UrlEncode(JSON.stringify({
    iss: config.serviceAccountEmail,
    scope: GOOGLE_SHEETS_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${claims}`;
  const assertion = `${unsignedToken}.${signJwt(unsignedToken, config.privateKey)}`;
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "google_token_failed");
  }
  return payload.access_token;
}

async function googleSheetsFetch(config, endpoint, options = {}) {
  const token = await getGoogleAccessTokenForSheets(config);
  const response = await fetch(`https://sheets.googleapis.com/v4${endpoint}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error_description || payload?.error || "google_sheets_failed");
  }
  return payload;
}

async function loadGoogleSheetSalesRequests(config = {}) {
  const normalizedConfig = normalizeSalesRequestSourceConfig(config);
  if (!normalizedConfig.spreadsheetInput) throw new Error("missing_spreadsheet");
  if (!normalizedConfig.serviceAccountEmail || !normalizedConfig.privateKey) throw new Error("missing_service_account");

  const spreadsheetId = resolveSpreadsheetId(normalizedConfig.spreadsheetInput);
  const metadata = await googleSheetsFetch(
    normalizedConfig,
    `/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties.title,sheets.properties.index,sheets.properties.sheetId`,
  );
  const sheetName = getResolvedSheetTitle(normalizedConfig, metadata);
  if (!sheetName) {
    return {
      requests: [],
      spreadsheetId,
      spreadsheetTitle: String(metadata?.properties?.title || "").trim(),
      sheetName: "",
      editUrl: buildSpreadsheetEditUrl(normalizedConfig.spreadsheetInput),
    };
  }

  const encodedRange = encodeURIComponent(quoteSheetName(sheetName));
  const valuesPayload = await googleSheetsFetch(
    normalizedConfig,
    `/spreadsheets/${spreadsheetId}/values/${encodedRange}`,
  );
  const formulasPayload = await googleSheetsFetch(
    normalizedConfig,
    `/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=FORMULA`,
  );
  const values = Array.isArray(valuesPayload?.values) ? valuesPayload.values : [];
  const formulaValues = Array.isArray(formulasPayload?.values) ? formulasPayload.values : [];
  const maxColumns = values.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
  if (!maxColumns) {
    return {
      requests: [],
      spreadsheetId,
      spreadsheetTitle: String(metadata?.properties?.title || "").trim(),
      sheetName,
      editUrl: buildSpreadsheetEditUrl(normalizedConfig.spreadsheetInput),
    };
  }

  const headers = Array.from({ length: maxColumns }, (_, index) => normalizeSheetHeader(values[0]?.[index], index));
  const requests = values
    .slice(1)
    .map((row = [], index) => {
      const rowNumber = index + 2;
      const formulaRow = Array.isArray(formulaValues[index + 1]) ? formulaValues[index + 1] : [];
      const draft = {
        id: `gs:${spreadsheetId}:${normalizeSheetKey(sheetName) || "sheet"}:${rowNumber}`,
        source: "google-sheets",
        sourceSpreadsheetId: spreadsheetId,
        sourceSheetName: sheetName,
        sourceRowNumber: rowNumber,
      };
      headers.forEach((header, columnIndex) => mapSheetSalesRequestField(
        draft,
        header,
        row[columnIndex] || "",
        formulaRow[columnIndex] || "",
      ));
      return normalizeSalesRequestRecord(draft);
    })
    .filter((item) => item.name || item.surname || item.city || item.phone || item.email);

  return {
    requests,
    spreadsheetId,
    spreadsheetTitle: String(metadata?.properties?.title || "").trim(),
    sheetName,
    editUrl: buildSpreadsheetEditUrl(normalizedConfig.spreadsheetInput),
  };
}

function normalizeSalesRequestRecord(item = {}) {
  const rawStatus = String(item.status ?? item.stato ?? "").trim();
  return {
    id: String(item.id || randomUUID()),
    name: String(item.name || item.nome || "").trim(),
    surname: String(item.surname || item.cognome || "").trim(),
    city: String(item.city || item.citta || "").trim(),
    phone: String(item.phone || item.telefono || "").trim(),
    email: String(item.email || "").trim(),
    sqm: Number(toNumber(item.sqm ?? item.mq ?? 0).toFixed(2)),
    requestedHeight: normalizeSalesRequestHeight(getSalesRequestRawHeightValue(item)),
    service: normalizeSalesRequestService(item.service || item.servizio || ""),
    surface: normalizeSalesRequestSurface(item.surface || item.fondo || ""),
    assignment: normalizeSalesRequestAssignment(item.assignment || item.assegnazione || ""),
    status: rawStatus || "new",
    note: String(item.note || "").trim(),
    whatsappTemplate: String(
      item.whatsappTemplate
      || item.whatsappMessage
      || item.whatsappAutomationMessage
      || item.whatsapp
      || "",
    ).trim(),
    whatsappUrl: normalizeSalesRequestWhatsAppUrl(
      item.whatsappUrl
      || item.whatsappLink
      || item.whatsappHref
      || item.whatsappTemplate
      || item.whatsappMessage
      || "",
    ),
    source: String(item.source || "manual").trim() || "manual",
    sourceSpreadsheetId: String(item.sourceSpreadsheetId || "").trim(),
    sourceSheetName: String(item.sourceSheetName || "").trim(),
    sourceRowNumber: Number(item.sourceRowNumber || 0),
    firstContactState: normalizeSalesRequestFirstContactState(item.firstContactState || item.firstContact?.state || ""),
    firstContactScheduledAt: normalizeIsoDateTime(item.firstContactScheduledAt || item.firstContact?.scheduledAt || ""),
    firstContactSentAt: normalizeIsoDateTime(item.firstContactSentAt || item.firstContact?.sentAt || ""),
    firstContactBy: normalizeSalesRequestAssignment(item.firstContactBy || item.firstContact?.by || ""),
    createdAt: String(item.createdAt || new Date().toISOString()),
    updatedAt: String(item.updatedAt || new Date().toISOString()),
  };
}

function buildAttachmentProxyPath(ownerId, attachmentId, resource = "orders") {
  if (resource === "sales-content") {
    return `/api/sales/content-items/${encodeURIComponent(ownerId)}/attachments/${encodeURIComponent(attachmentId)}/file`;
  }
  return `/api/orders/${encodeURIComponent(ownerId)}/attachments/${encodeURIComponent(attachmentId)}/file`;
}

function getMimeTypeExtension(contentType = "") {
  const normalized = String(contentType || "").split(";")[0].trim().toLowerCase();
  if (normalized === "image/jpeg") return ".jpg";
  if (normalized === "image/png") return ".png";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "application/pdf") return ".pdf";
  if (normalized === "text/plain") return ".txt";
  return "";
}

function sanitizeAttachmentName(name = "", fallbackExtension = "") {
  const trimmed = String(name || "").trim() || `allegato${fallbackExtension}`;
  return trimmed.replace(/[^\w.\- ]+/g, "_");
}

function parseDataUrl(value = "") {
  const match = String(value || "").match(/^data:([^;,]+)?(?:;charset=[^;,]+)?;base64,(.+)$/i);
  if (!match) return null;
  return {
    contentType: String(match[1] || "application/octet-stream").trim().toLowerCase(),
    buffer: Buffer.from(match[2], "base64"),
  };
}

function normalizeAttachmentRecord(item = {}, ownerId = "", resource = "orders") {
  const attachmentId = String(item.id || randomUUID());
  const hasR2Object = String(item.storage || "").trim() === "r2" && String(item.objectKey || "").trim();
  return {
    id: attachmentId,
    name: String(item.name || "Allegato").trim() || "Allegato",
    type: String(item.type || "application/octet-stream").trim() || "application/octet-stream",
    size: Math.max(0, Number(item.size || 0)),
    createdAt: String(item.createdAt || new Date().toISOString()),
    storage: hasR2Object ? "r2" : "inline",
    objectKey: hasR2Object ? String(item.objectKey || "").trim() : "",
    dataUrl: hasR2Object ? "" : String(item.dataUrl || ""),
    context: String(item.context || "").trim(),
    url: String(item.url || "").trim() || buildAttachmentProxyPath(ownerId, attachmentId, resource),
  };
}

function normalizeSalesContentRecord(item = {}) {
  const contentId = String(item.id || randomUUID());
  return {
    id: contentId,
    title: String(item.title || "").trim() || "Contenuto",
    category: String(item.category || "documentazione").trim() || "documentazione",
    description: String(item.description || "").trim(),
    link: String(item.link || "").trim(),
    createdAt: String(item.createdAt || new Date().toISOString()),
    updatedAt: String(item.updatedAt || new Date().toISOString()),
    attachments: Array.isArray(item.attachments)
      ? item.attachments.map((attachment) => normalizeAttachmentRecord(attachment, contentId, "sales-content"))
      : [],
  };
}

function serializeAttachmentForClient(item = {}) {
  return {
    ...item,
    dataUrl: "",
  };
}

function serializeSalesContentForClient(item = {}) {
  const normalized = normalizeSalesContentRecord(item);
  return {
    ...normalized,
    attachments: (normalized.attachments || []).map((attachment) => serializeAttachmentForClient(attachment)),
  };
}

function serializeSalesContentsForClient(items = []) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => serializeSalesContentForClient(item));
}

async function getR2Sdk() {
  if (!USE_R2) return null;
  if (!r2ClientPromise) {
    r2ClientPromise = import("@aws-sdk/client-s3");
  }
  return r2ClientPromise;
}

async function getR2Client() {
  if (!USE_R2) return null;
  const sdk = await getR2Sdk();
  if (!getR2Client.client) {
    getR2Client.client = new sdk.S3Client({
      region: R2_REGION,
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return getR2Client.client;
}

async function storeAttachmentAsset(ownerId, attachment = {}, resource = "orders") {
  const parsed = parseDataUrl(attachment.dataUrl || "");
  const attachmentId = String(attachment.id || randomUUID());
  if (!parsed || !USE_R2) {
    return normalizeAttachmentRecord(
      {
        ...attachment,
        id: attachmentId,
        storage: "inline",
      },
      ownerId,
      resource,
    );
  }

  const client = await getR2Client();
  const sdk = await getR2Sdk();
  const fallbackExtension = getMimeTypeExtension(attachment.type || parsed.contentType);
  const safeName = sanitizeAttachmentName(attachment.name, fallbackExtension);
  const bucketPrefix = resource === "sales-content" ? "sales-content" : "orders";
  const objectKey = `${bucketPrefix}/${String(ownerId || resource).replace(/[^\w.-]+/g, "_")}/${attachmentId}-${safeName}`;

  await client.send(new sdk.PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    Body: parsed.buffer,
    ContentType: String(attachment.type || parsed.contentType || "application/octet-stream").trim(),
    ContentLength: parsed.buffer.length,
  }));

  return normalizeAttachmentRecord(
    {
      ...attachment,
      id: attachmentId,
      name: safeName,
      type: String(attachment.type || parsed.contentType || "application/octet-stream").trim(),
      size: Number(attachment.size || parsed.buffer.length || 0),
      storage: "r2",
      objectKey,
      dataUrl: "",
    },
    ownerId,
    resource,
  );
}

async function removeAttachmentAsset(attachment = {}) {
  if (!USE_R2) return;
  if (String(attachment.storage || "").trim() !== "r2") return;
  if (!String(attachment.objectKey || "").trim()) return;
  const client = await getR2Client();
  const sdk = await getR2Sdk();
  await client.send(new sdk.DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: String(attachment.objectKey).trim(),
  }));
}

async function streamAttachmentAsset(res, attachment = {}) {
  const storageType = String(attachment.storage || "").trim();
  if (storageType !== "r2") {
    const inlineData = parseDataUrl(attachment.dataUrl || "");
    if (!inlineData?.buffer?.length) {
      return sendJson(res, 404, { error: "attachment_not_found" });
    }
    res.writeHead(200, {
      "Content-Type": attachment.type || inlineData.contentType || "application/octet-stream",
      "Content-Length": inlineData.buffer.length,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    res.end(inlineData.buffer);
    return;
  }
  if (!String(attachment.objectKey || "").trim()) {
    return sendJson(res, 404, { error: "attachment_not_found" });
  }
  const client = await getR2Client();
  const sdk = await getR2Sdk();
  const object = await client.send(new sdk.GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: String(attachment.objectKey).trim(),
  }));

  res.writeHead(200, {
    "Content-Type": object.ContentType || attachment.type || "application/octet-stream",
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });

  const body = object.Body;
  if (body?.pipe) {
    body.pipe(res);
    return;
  }
  if (body && typeof body[Symbol.asyncIterator] === "function") {
    for await (const chunk of body) {
      res.write(chunk);
    }
    res.end();
    return;
  }
  res.end();
}

function buildDefaultOperations(order, linkedJob = null) {
  const derived = deriveOrderData(order);
  return {
    officeStatus: linkedJob ? "operativo" : "bozza",
    product: linkedJob?.product || derived.mainProduct || "Da definire",
    sqm: Number(linkedJob?.sqm || derived.sqm || 0),
    surface: linkedJob?.surface || derived.surface || "terra",
    officeNote: linkedJob?.notes || "",
    materials: Array.isArray(linkedJob?.materials) && linkedJob.materials.length
      ? linkedJob.materials
      : Array.isArray(derived.materials)
        ? derived.materials
        : [],
    warehouse: {
      selected: false,
      status: linkedJob?.warehouseStatus || "da-preparare",
      fulfillmentMode: "da-definire",
      preparationDate: "",
      carrier: "",
      trackingNumber: "",
      carrierPassed: false,
      readyToShip: false,
      shipped: false,
      pickupLabel: "",
      vanLoadLabel: "",
      warehouseNote: "",
      destination: {
        provinceCode: order.provinceCode || "",
        province: order.province || "",
        postalCode: order.postalCode || "",
        countryCode: order.countryCode || "IT",
      },
      ddt: {
        number: "",
        palletLength: "",
        palletWidth: "",
        palletHeight: "",
        palletWeight: "",
        createdAt: "",
      },
    },
    installation: {
      required: (linkedJob?.jobType || derived.jobType) === "fornitura-posa",
      selected: false,
      crew: linkedJob?.crew || "",
      installDate: linkedJob?.installDate || "",
      installTime: linkedJob?.installTime || "",
      clientConfirmed: false,
      status: linkedJob?.installStatus || "da-pianificare",
      reportNote: "",
      travelExpenses: [],
    },
  };
}

function normalizeOperations(order, linkedJob = null) {
  const defaults = buildDefaultOperations(order, linkedJob);
  const current = order.operations || {};
  const currentProduct = String(current.product || "").trim();
  const shouldUseDefaultProduct = !currentProduct || /^da definire$/i.test(currentProduct);
  return {
    officeStatus: current.officeStatus || defaults.officeStatus,
    product: shouldUseDefaultProduct ? defaults.product : currentProduct,
    sqm: Number(current.sqm || defaults.sqm || 0),
    surface: current.surface || defaults.surface,
    officeNote: current.officeNote || defaults.officeNote || "",
    materials: Array.isArray(current.materials) && current.materials.length ? current.materials : defaults.materials,
    warehouse: {
      selected: Boolean(current.warehouse?.selected ?? defaults.warehouse.selected),
      status: current.warehouse?.status || defaults.warehouse.status,
      fulfillmentMode: current.warehouse?.fulfillmentMode || defaults.warehouse.fulfillmentMode,
      preparationDate: current.warehouse?.preparationDate || defaults.warehouse.preparationDate,
      carrier: current.warehouse?.carrier || defaults.warehouse.carrier,
      trackingNumber: current.warehouse?.trackingNumber || defaults.warehouse.trackingNumber,
      carrierPassed: Boolean(current.warehouse?.carrierPassed ?? defaults.warehouse.carrierPassed),
      readyToShip: Boolean(current.warehouse?.readyToShip ?? defaults.warehouse.readyToShip),
      shipped: Boolean(current.warehouse?.shipped ?? defaults.warehouse.shipped),
      pickupLabel: current.warehouse?.pickupLabel || defaults.warehouse.pickupLabel,
      vanLoadLabel: current.warehouse?.vanLoadLabel || defaults.warehouse.vanLoadLabel,
      warehouseNote: current.warehouse?.warehouseNote || defaults.warehouse.warehouseNote,
      destination: {
        provinceCode: String(current.warehouse?.destination?.provinceCode || defaults.warehouse.destination.provinceCode || "").trim().toUpperCase(),
        province: String(current.warehouse?.destination?.province || defaults.warehouse.destination.province || "").trim(),
        postalCode: String(current.warehouse?.destination?.postalCode || defaults.warehouse.destination.postalCode || "").trim(),
        countryCode: String(current.warehouse?.destination?.countryCode || defaults.warehouse.destination.countryCode || "IT").trim().toUpperCase(),
      },
      prepItems: Array.isArray(current.warehouse?.prepItems)
        ? current.warehouse.prepItems.map((item) => ({
            title: String(item?.title || "").trim(),
            quantity: Number(item?.quantity || 1),
            included: item?.included !== false,
            note: String(item?.note || "").trim(),
          })).filter((item) => item.title)
        : [],
      ddt: {
        number: current.warehouse?.ddt?.number || defaults.warehouse.ddt.number,
        palletLength: current.warehouse?.ddt?.palletLength || defaults.warehouse.ddt.palletLength,
        palletWidth: current.warehouse?.ddt?.palletWidth || defaults.warehouse.ddt.palletWidth,
        palletHeight: current.warehouse?.ddt?.palletHeight || defaults.warehouse.ddt.palletHeight,
        palletWeight: current.warehouse?.ddt?.palletWeight || defaults.warehouse.ddt.palletWeight,
        createdAt: current.warehouse?.ddt?.createdAt || defaults.warehouse.ddt.createdAt,
      },
    },
    installation: {
      required: Boolean(current.installation?.required ?? defaults.installation.required),
      selected: Boolean(current.installation?.selected ?? defaults.installation.selected),
      crew: current.installation?.crew || defaults.installation.crew,
      installDate: current.installation?.installDate || defaults.installation.installDate,
      installTime: current.installation?.installTime || defaults.installation.installTime,
      clientConfirmed: Boolean(current.installation?.clientConfirmed ?? defaults.installation.clientConfirmed),
      status: current.installation?.status || defaults.installation.status,
      reportNote: current.installation?.reportNote || defaults.installation.reportNote,
      travelExpenses: normalizeTravelExpenses(
        current.installation?.travelExpenses,
        current.installation?.crew || defaults.installation.crew,
      ),
    },
  };
}

function reconcileStoreData(store) {
  const defaults = buildDefaultStore();
  let changed = false;
  const hasStoreRevision = Boolean(String(store?._storeRevision || "").trim());
  ensureStoreRevision(store);
  if (!hasStoreRevision) changed = true;

  store.users = Array.isArray(store.users) && store.users.length
    ? store.users.map((user, index) => {
        const normalized = sanitizePasswordUser({
          id: user.id || defaults.users[index]?.id || randomUUID(),
          name: String(user.name || defaults.users[index]?.name || "").trim(),
          email: String(user.email || defaults.users[index]?.email || "").trim().toLowerCase(),
          password: String(user.password || defaults.users[index]?.password || ""),
          passwordHash: String(user.passwordHash || ""),
          passwordSalt: String(user.passwordSalt || ""),
          role: String(user.role || defaults.users[index]?.role || "office").trim(),
          crewName: String(user.crewName || defaults.users[index]?.crewName || ""),
          dailyCapacity: user.dailyCapacity ?? defaults.users[index]?.dailyCapacity ?? 0,
          crewLogoDataUrl: String(user.crewLogoDataUrl || defaults.users[index]?.crewLogoDataUrl || ""),
          status: String(user.status || defaults.users[index]?.status || "active").trim(),
          mustChangePassword: Boolean(user.mustChangePassword ?? defaults.users[index]?.mustChangePassword),
          sessionVersion: Number(user.sessionVersion || defaults.users[index]?.sessionVersion || 1),
          lastPasswordChangeAt: String(user.lastPasswordChangeAt || defaults.users[index]?.lastPasswordChangeAt || ""),
        });
        if (
          normalized.passwordHash !== user.passwordHash
          || normalized.passwordSalt !== user.passwordSalt
          || normalized.crewLogoDataUrl !== String(user.crewLogoDataUrl || "")
          || normalized.status !== String(user.status || "active")
          || normalized.mustChangePassword !== Boolean(user.mustChangePassword)
          || normalized.sessionVersion !== Math.max(1, Number(user.sessionVersion || 1))
          || normalized.lastPasswordChangeAt !== String(user.lastPasswordChangeAt || "")
          || "password" in user
        ) {
          changed = true;
        }
        return normalized;
      })
    : defaults.users.map((user) => {
        changed = true;
        return sanitizePasswordUser({ ...user });
      });

  store.inventory = Array.isArray(store.inventory)
    ? store.inventory.map((item) => ({
        id: item.id || randomUUID(),
        product: String(item.product || "").trim(),
        width: toNumber(item.width || 0),
        length: toNumber(item.length || 0),
        sqm: toNumber(item.sqm || (toNumber(item.width || 0) * toNumber(item.length || 0))),
        variant: String(item.variant || ""),
        status: item.status === "residuo" ? "residuo" : "intero",
        note: String(item.note || ""),
        createdAt: item.createdAt || new Date().toISOString(),
      }))
    : [];

  store.salesRequests = Array.isArray(store.salesRequests)
    ? store.salesRequests.map((item) => normalizeSalesRequestRecord(item))
    : [];

  store.salesContents = Array.isArray(store.salesContents)
    ? store.salesContents.map((item) => normalizeSalesContentRecord(item))
    : [];

  store.salesRequestSource = normalizeSalesRequestSourceConfig(store.salesRequestSource || defaults.salesRequestSource);

  store.jobs = Array.isArray(store.jobs) ? store.jobs : [];
  store.orders = Array.isArray(store.orders) ? store.orders : [];
  store.coveragePlanner = normalizeCoveragePlanner(store.coveragePlanner || defaults.coveragePlanner);
  store.securityEvents = Array.isArray(store.securityEvents) ? store.securityEvents : [];
  store.shopifySettings = {
    ...defaults.shopifySettings,
    ...(store.shopifySettings || {}),
  };

  store.orders = store.orders.map((order) => {
    const nextOrder = { ...order };
    if (!Array.isArray(nextOrder.lineDetails) || !nextOrder.lineDetails.length) {
      nextOrder.lineDetails = normalizeStringLineDetails(nextOrder.lineItems || []);
    } else {
      nextOrder.lineDetails = nextOrder.lineDetails.map((item) => normalizeLineDetailRecord(item));
    }
    if (!Array.isArray(nextOrder.lineItems) || !nextOrder.lineItems.length) {
      nextOrder.lineItems = nextOrder.lineDetails.map((item) => item.title);
    }
    nextOrder.paymentMethod = nextOrder.paymentMethod || nextOrder.accounting?.paymentMethod || "";
    nextOrder.provinceCode = String(nextOrder.provinceCode || "").trim().toUpperCase();
    nextOrder.province = String(nextOrder.province || "").trim();
    nextOrder.postalCode = String(nextOrder.postalCode || "").trim();
    nextOrder.countryCode = String(nextOrder.countryCode || "IT").trim().toUpperCase();
    nextOrder.shopifyNumericId = getNormalizedShopifyNumericId(nextOrder);
    nextOrder.shopifyGraphqlId = getNormalizedShopifyGraphqlId(nextOrder);
    const persistedTotals = nextOrder.totals || {};
    const billingMetadata = extractBillingMetadata(
      nextOrder.billing || {},
      nextOrder,
      nextOrder.note_attributes || nextOrder.noteAttributes || [],
      nextOrder.customAttributes || [],
    );
    nextOrder.billing = normalizeBillingAddress(nextOrder.billing || {}, nextOrder, billingMetadata);
    nextOrder.totals = normalizeOrderTotals({
      grossTotal: persistedTotals.grossTotal ?? nextOrder.total,
      totalTax: persistedTotals.taxTotal ?? null,
      currentSubtotal: persistedTotals.netSubtotal ?? null,
      currency: persistedTotals.currency || "EUR",
      taxKnown: typeof persistedTotals.taxKnown === "boolean" ? persistedTotals.taxKnown : null,
      netKnown: typeof persistedTotals.netKnown === "boolean" ? persistedTotals.netKnown : null,
      taxSource: persistedTotals.taxSource || "",
      netSource: persistedTotals.netSource || "",
      lineDetails: nextOrder.lineDetails,
    }, nextOrder.total);
    if (String(nextOrder.source || "").toLowerCase().startsWith("shopify")) {
      const taxSourceMissing = !String(persistedTotals.taxSource || "").trim();
      const netSourceMissing = !String(persistedTotals.netSource || "").trim();
      const grossTotal = toNumber(nextOrder.totals.grossTotal || 0);
      const taxTotal = toNumber(nextOrder.totals.taxTotal || 0);
      const netSubtotal = toNumber(nextOrder.totals.netSubtotal || 0);
      const flatTax = Number((grossTotal - (grossTotal / 1.22)).toFixed(2));
      const flatNet = Number((grossTotal / 1.22).toFixed(2));
      const looksLikeLegacyFlatVat = grossTotal > 0
        && taxTotal > 0
        && netSubtotal > 0
        && Math.abs(taxTotal - flatTax) <= 0.02
        && Math.abs(netSubtotal - flatNet) <= 0.02;
      if (looksLikeLegacyFlatVat && (taxSourceMissing || netSourceMissing)) {
        nextOrder.totals.taxKnown = false;
        nextOrder.totals.netKnown = false;
        if (taxSourceMissing) nextOrder.totals.taxSource = "legacy-fallback";
        if (netSourceMissing) nextOrder.totals.netSource = "legacy-fallback";
      }
    }
    nextOrder.accounting = normalizeAccountingRecord(nextOrder.accounting || {}, nextOrder.paymentMethod || "", nextOrder.billing);
    nextOrder.attachments = Array.isArray(nextOrder.attachments)
      ? nextOrder.attachments.map((item) => normalizeAttachmentRecord(item, nextOrder.id))
      : [];
    const linkedJob = store.jobs.find((job) => job.sourceOrderId === nextOrder.id) || null;
    nextOrder.operations = normalizeOperations(nextOrder, linkedJob);
    return nextOrder;
  });

  store.jobs = store.jobs.map((job) => {
    if (!job.sourceOrderId) return job;
    const sourceOrder = store.orders.find((order) => order.id === job.sourceOrderId);
    if (!sourceOrder) return job;
    const derived = deriveOrderData(sourceOrder);
    return {
      ...job,
      firstName: sourceOrder.firstName || job.firstName,
      lastName: sourceOrder.lastName || job.lastName,
      city: sourceOrder.city || job.city,
      phone: sourceOrder.phone || job.phone,
      email: sourceOrder.email || job.email,
      address: sourceOrder.address || job.address,
      jobType: derived.jobType || job.jobType,
      surface: derived.surface || job.surface,
      product: derived.mainProduct || job.product,
      sqm: derived.sqm || job.sqm,
      materials: derived.materials.length ? derived.materials : job.materials,
      attachments: Array.isArray(job.attachments)
        ? job.attachments.map((item) => normalizeAttachmentRecord(item, job.sourceOrderId || job.id))
        : [],
    };
  });

  store.orders.forEach((order) => {
    const existingJob = store.jobs.find((job) => job.sourceOrderId === order.id);
    order.convertedJobId = existingJob?.id || null;
  });

  if (BOOTSTRAP_OFFICE_PASSWORD) {
    const bootstrapError = validatePasswordStrength(BOOTSTRAP_OFFICE_PASSWORD);
    if (!bootstrapError) {
      const officeIndex = store.users.findIndex((user) => String(user.email || "").trim().toLowerCase() === BOOTSTRAP_OFFICE_EMAIL)
        >= 0
        ? store.users.findIndex((user) => String(user.email || "").trim().toLowerCase() === BOOTSTRAP_OFFICE_EMAIL)
        : store.users.findIndex((user) => user.role === "office");
      if (officeIndex >= 0) {
        const officeUser = store.users[officeIndex];
        if (!verifyPasswordRecord(officeUser, BOOTSTRAP_OFFICE_PASSWORD)) {
          const { hash, salt } = hashPassword(BOOTSTRAP_OFFICE_PASSWORD);
          store.users[officeIndex] = {
            ...officeUser,
            email: BOOTSTRAP_OFFICE_EMAIL || officeUser.email,
            passwordHash: hash,
            passwordSalt: salt,
            status: "active",
            mustChangePassword: true,
            sessionVersion: Math.max(1, Number(officeUser.sessionVersion || 1)) + 1,
            lastPasswordChangeAt: new Date().toISOString(),
          };
          pushSecurityEvent(
            store,
            "bootstrap_password_reset",
            "system",
            `Bootstrap password applicata per ${store.users[officeIndex].email}.`,
            { email: store.users[officeIndex].email },
          );
          changed = true;
        }
      }
    }
  }

  return changed;
}

function normalizeOrderPayload(order, index) {
  const customer = order.customer || {};
  const shipping = order.shipping_address || order.default_address || {};
  const billingMetadata = extractBillingMetadata(
    order.billing_address || order.billing || {},
    customer,
    order,
    order.note_attributes || order.noteAttributes || [],
    order.customAttributes || [],
  );
  const billing = normalizeBillingAddress(order.billing_address || order.billing || {}, {
    firstName: shipping.first_name || customer.first_name || order.firstName || "",
    lastName: shipping.last_name || customer.last_name || order.lastName || "",
    email: order.email || customer.email || "",
    phone: shipping.phone || customer.phone || order.phone || "",
    city: shipping.city || order.city || "",
    provinceCode: shipping.province_code || shipping.provinceCode || order.provinceCode || "",
    province: shipping.province || order.province || "",
    postalCode: shipping.zip || shipping.postalCode || order.postalCode || "",
    countryCode: shipping.country_code || shipping.countryCode || order.countryCode || "IT",
    address: [shipping.address1, shipping.address2].filter(Boolean).join(" ") || order.address || "",
  }, billingMetadata);
  const lineDetails = Array.isArray(order.line_items)
    ? order.line_items.map((item) => normalizeLineDetailRecord({
        title: item.title || item.name || "Prodotto",
        quantity: Number(item.quantity || 1),
        sku: item.sku,
        variant_title: item.variant_title,
        properties: item.properties,
        note: item.note || "",
        taxable: item.taxable,
        tax_lines: item.tax_lines,
        totalPrice: item.line_price != null
          ? item.line_price
          : toNumber(item.price || 0) * Number(item.quantity || 1),
      }))
    : Array.isArray(order.lineDetails)
      ? order.lineDetails.map((item) => normalizeLineDetailRecord(item))
      : Array.isArray(order.lineItems)
        ? normalizeStringLineDetails(order.lineItems)
        : [];
  const lineItems = lineDetails.map((item) => item.title);
  const totals = normalizeOrderTotals({
    grossTotal: order.current_total_price || order.total_price || order.total,
    totalTax: order.current_total_tax || order.total_tax,
    currentSubtotal: order.current_subtotal_price || order.subtotal_price,
    taxesIncluded: order.taxes_included,
    currency: order.currency || order.presentment_currency || "EUR",
    lineDetails,
  }, order.current_total_price || order.total_price || order.total || 0);
  const shopifyNumericId = String(order.id || order.order_id || "").trim();
  const shopifyGraphqlId = String(order.admin_graphql_api_id || order.shopifyGraphqlId || "").trim();
  const invoiceRequired = inferInvoiceRequired(order.accounting, billing);

  return {
    id: shopifyNumericId || String(order.order_number || `import-${Date.now()}-${index}`),
    shopifyNumericId,
    shopifyGraphqlId,
    orderNumber: order.name || order.orderNumber || `#${order.order_number || index + 1}`,
    firstName: shipping.first_name || customer.first_name || order.firstName || "",
    lastName: shipping.last_name || customer.last_name || order.lastName || "",
    email: order.email || customer.email || "",
    phone: shipping.phone || customer.phone || order.phone || "",
    city: shipping.city || order.city || "",
    address: [shipping.address1, shipping.address2].filter(Boolean).join(" ") || order.address || "",
    provinceCode: String(shipping.province_code || shipping.provinceCode || order.provinceCode || "").trim().toUpperCase(),
    province: String(shipping.province || order.province || "").trim(),
    postalCode: String(shipping.zip || shipping.postalCode || order.postalCode || "").trim(),
    countryCode: String(shipping.country_code || shipping.countryCode || order.countryCode || "IT").trim().toUpperCase(),
    total: String(order.current_total_price || order.total_price || order.total || "—"),
    totals,
    billing,
    financialStatus: String(order.financial_status || order.financialStatus || "pending"),
    fulfillmentStatus: String(order.fulfillment_status || order.fulfillmentStatus || "unfulfilled"),
    paymentMethod: Array.isArray(order.payment_gateway_names) ? order.payment_gateway_names.join(", ") : String(order.paymentMethod || ""),
    source: "shopify-json",
    note: order.note || "",
    lineItems,
    lineDetails,
    accounting: normalizeAccountingRecord(order.accounting || {
      paymentMethod: Array.isArray(order.payment_gateway_names) ? order.payment_gateway_names.join(", ") : String(order.paymentMethod || ""),
      depositPaid: 0,
      balancePaid: 0,
      payments: [],
      invoiceRequired,
      invoiceIssued: false,
      accountingNote: "",
    }, Array.isArray(order.payment_gateway_names) ? order.payment_gateway_names.join(", ") : String(order.paymentMethod || ""), billing),
    attachments: Array.isArray(order.attachments) ? order.attachments : [],
    convertedJobId: null,
    createdAt: order.created_at || order.createdAt || order.processed_at || order.processedAt || new Date().toISOString(),
    updatedAt: order.updated_at || order.updatedAt || order.created_at || order.createdAt || order.processed_at || order.processedAt || new Date().toISOString(),
  };
}

function normalizeGraphqlOrder(node, index) {
  const shipping = node.shippingAddress || {};
  const customer = node.customer || {};
  const billingMetadata = extractBillingMetadata(
    node.billingAddress || {},
    customer,
    node,
    node.customAttributes || [],
  );
  const billing = normalizeBillingAddress(node.billingAddress || {}, {
    firstName: shipping.firstName || customer.firstName || "",
    lastName: shipping.lastName || customer.lastName || "",
    email: node.email || customer.email || "",
    phone: shipping.phone || customer.phone || "",
    city: shipping.city || "",
    provinceCode: shipping.provinceCode || "",
    province: shipping.province || "",
    postalCode: shipping.zip || "",
    countryCode: shipping.countryCodeV2 || "IT",
    address: [shipping.address1, shipping.address2].filter(Boolean).join(" "),
  }, billingMetadata);
  const lineDetails = Array.isArray(node.lineItems?.edges)
    ? node.lineItems.edges.map(({ node: item }) => normalizeLineDetailRecord({
        title: item.name || "Prodotto",
        quantity: Number(item.currentQuantity || 1),
        sku: item.sku,
        variantTitle: item.variantTitle,
        customAttributes: item.customAttributes,
        taxable: item.taxable,
        requiresShipping: item.requiresShipping,
        taxLines: item.taxLines,
        totalPrice: item.discountedTotalSet?.shopMoney?.amount,
        taxAmount: item.totalTaxSet?.shopMoney?.amount,
      }))
    : [];
  const lineItems = lineDetails.map((item) => item.title);
  const totals = normalizeOrderTotals({
    grossTotal: node.currentTotalPriceSet?.shopMoney?.amount,
    totalTax: node.currentTotalTaxSet?.shopMoney?.amount,
    currentSubtotal: node.currentSubtotalPriceSet?.shopMoney?.amount,
    taxesIncluded: node.taxesIncluded,
    currency: node.currentTotalPriceSet?.shopMoney?.currencyCode || "EUR",
    lineDetails,
  }, node.currentTotalPriceSet?.shopMoney?.amount || 0);
  const shopifyNumericId = String(node.legacyResourceId || "").trim();
  const shopifyGraphqlId = String(node.id || "").trim();
  const invoiceRequired = inferInvoiceRequired(node.accounting, billing);

  return {
    id: shopifyNumericId || String(node.id || `graphql-${Date.now()}-${index}`),
    shopifyNumericId,
    shopifyGraphqlId,
    orderNumber: node.name || `#${index + 1}`,
    firstName: shipping.firstName || customer.firstName || "",
    lastName: shipping.lastName || customer.lastName || "",
    email: node.email || customer.email || "",
    phone: shipping.phone || customer.phone || "",
    city: shipping.city || "",
    address: [shipping.address1, shipping.address2].filter(Boolean).join(" "),
    provinceCode: String(shipping.provinceCode || "").trim().toUpperCase(),
    province: String(shipping.province || "").trim(),
    postalCode: String(shipping.zip || "").trim(),
    countryCode: String(shipping.countryCodeV2 || "IT").trim().toUpperCase(),
    total: String(node.currentTotalPriceSet?.shopMoney?.amount || "—"),
    totals,
    billing,
    financialStatus: String(node.displayFinancialStatus || "pending"),
    fulfillmentStatus: String(node.displayFulfillmentStatus || "unfulfilled"),
    paymentMethod: Array.isArray(node.paymentGatewayNames) ? node.paymentGatewayNames.join(", ") : "",
    source: "shopify-live",
    note: node.note || "",
    lineItems,
    lineDetails,
    accounting: normalizeAccountingRecord({
      paymentMethod: Array.isArray(node.paymentGatewayNames) ? node.paymentGatewayNames.join(", ") : "",
      depositPaid: 0,
      balancePaid: 0,
      payments: [],
      invoiceRequired,
      invoiceIssued: false,
      accountingNote: "",
    }, Array.isArray(node.paymentGatewayNames) ? node.paymentGatewayNames.join(", ") : "", billing),
    attachments: Array.isArray(node.attachments) ? node.attachments : [],
    convertedJobId: null,
    createdAt: node.createdAt || node.processedAt || new Date().toISOString(),
    updatedAt: node.updatedAt || node.processedAt || node.createdAt || new Date().toISOString(),
  };
}

function sortOrdersByRecency(items = []) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
    const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function jobFromOrder(order) {
  const derived = deriveOrderData(order);
  const combinedNotes = [
    order.note ? `Nota ordine: ${order.note}` : "",
    order.financialStatus ? `Pagamento Shopify: ${order.financialStatus}` : "",
    order.fulfillmentStatus ? `Fulfillment Shopify: ${order.fulfillmentStatus}` : "",
  ].filter(Boolean).join(" · ");

  return {
    id: randomUUID(),
    firstName: order.firstName,
    lastName: order.lastName,
    city: order.city,
    phone: order.phone || "",
    email: order.email || "",
    address: order.address || "",
    jobType: derived.jobType,
    surface: derived.surface,
    product: derived.mainProduct,
    sqm: derived.sqm,
    installDate: "",
    installTime: "",
    crew: "Alpha",
    priority: "media",
    warehouseStatus: "da-preparare",
    installStatus: "da-pianificare",
    materials: derived.materials.length ? derived.materials : Array.isArray(order.lineItems) ? order.lineItems.slice() : [],
    notes: combinedNotes,
    attachments: [],
    sourceOrderId: order.id,
  };
}

async function ensureStore() {
  if (USE_POSTGRES) {
    await ensureDatabaseStorage();
    return;
  }
  ensureWritableDataDir();
  if (!existsSync(STORE_PATH)) {
    await writeJson(STORE_PATH, buildDefaultStore());
  }
  if (!existsSync(SESSION_PATH)) {
    await writeJson(SESSION_PATH, {});
  }
}

async function syncOrdersFromShopify(store) {
  const { storeDomain } = store.shopifySettings || {};
  if (!storeDomain) {
    throw new Error("missing_shopify_credentials");
  }
  const accessToken = await getShopifyAccessToken(store);

  const endpoint = `https://${storeDomain}/admin/api/2026-01/graphql.json`;
  const orderFields = getShopifyOrderFields(20);

  async function fetchOrderBatch(batchQuery, batchLabel) {
    let lastError = null;
    for (let attempt = 0; attempt <= SHOPIFY_MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetchWithTimeout(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken,
          },
          body: JSON.stringify({ query: batchQuery }),
        });

        if (!response.ok) {
          const payload = await parseShopifyResponse(response);
          const responseText = payload?.rawText || payload?.errors?.map((item) => item.message || item).join(" | ") || "";
          if (attempt < SHOPIFY_MAX_RETRIES && isRetryableShopifyStatus(response.status)) {
            await wait(500 * (attempt + 1));
            continue;
          }
          throw new Error(responseText ? `shopify_sync_failed: ${batchLabel} ${response.status} ${responseText}` : `shopify_sync_failed: ${batchLabel} ${response.status}`);
        }

        const payload = await response.json();
        if (Array.isArray(payload?.errors) && payload.errors.length) {
          const errorMessage = payload.errors.map((item) => item.message || item).join(" | ");
          const retryable = /throttled|timeout|temporar/i.test(errorMessage);
          if (attempt < SHOPIFY_MAX_RETRIES && retryable) {
            await wait(500 * (attempt + 1));
            continue;
          }
          throw new Error(`shopify_sync_failed: ${batchLabel} ${errorMessage}`);
        }
        return payload?.data?.orders?.edges || [];
      } catch (error) {
        lastError = error;
        const retryable = String(error?.name || "") === "AbortError" || /ECONNRESET|ETIMEDOUT|timeout/i.test(String(error?.message || ""));
        if (attempt < SHOPIFY_MAX_RETRIES && retryable) {
          await wait(500 * (attempt + 1));
          continue;
        }
        throw error;
      }
    }
    throw lastError || new Error(`shopify_sync_failed: ${batchLabel}`);
  }

  const recentQuery = `
    query VertexOpsRecentOrders {
      orders(first: 50, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            createdAt
            updatedAt
            processedAt
            ${orderFields}
          }
        }
      }
    }
  `;

  const openOrdersQuery = `
    query VertexOpsOpenOrders {
      orders(
        first: 100,
        sortKey: UPDATED_AT,
        reverse: true,
        query: "status:open OR fulfillment_status:unfulfilled OR fulfillment_status:partial OR financial_status:pending OR financial_status:authorized"
      ) {
        edges {
          node {
            createdAt
            updatedAt
            processedAt
            ${orderFields}
          }
        }
      }
    }
  `;

  const recentEdges = await fetchOrderBatch(recentQuery, "recent_orders");
  const openEdges = await fetchOrderBatch(openOrdersQuery, "open_orders");
  const uniqueNodes = new Map();
  [...recentEdges, ...openEdges].forEach((edge) => {
    if (edge?.node?.id) uniqueNodes.set(edge.node.id, edge.node);
  });
  const normalized = [...uniqueNodes.values()].map((node, index) => normalizeGraphqlOrder(node, index));
  store.shopifySettings.lastSyncAt = new Date().toISOString();
  store.shopifySettings.lastSyncStatus = "ok";
  store.shopifySettings.lastSyncMessage = "";
  return normalized;
}

async function getShopifyAccessToken(store) {
  const { storeDomain, clientId, clientSecret, adminAccessToken } = store.shopifySettings || {};
  if (!storeDomain) {
    throw new Error("missing_shopify_credentials");
  }

  const directToken = String(adminAccessToken || "").trim();
  if (directToken) {
    return directToken;
  }

  if (!clientId || !clientSecret) {
    throw new Error("missing_shopify_credentials");
  }
  throw new Error("missing_shopify_token");
}

async function queryShopifyAdmin(store, accessToken, query, variables = {}, label = "shopify_query") {
  const endpoint = `https://${store.shopifySettings.storeDomain}/admin/api/2026-01/graphql.json`;
  let lastError = null;
  for (let attempt = 0; attempt <= SHOPIFY_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query, variables }),
      });
      const payload = await parseShopifyResponse(response);
      if (!response.ok) {
        const message = payload?.rawText || payload?.errors?.map((item) => item.message || item).join(" | ") || "";
        if (attempt < SHOPIFY_MAX_RETRIES && isRetryableShopifyStatus(response.status)) {
          await wait(500 * (attempt + 1));
          continue;
        }
        throw new Error(message ? `${label}: ${response.status} ${message}` : `${label}: ${response.status}`);
      }
      if (Array.isArray(payload?.errors) && payload.errors.length) {
        const message = payload.errors.map((item) => item.message || item).join(" | ");
        const retryable = /throttled|timeout|temporar/i.test(message);
        if (attempt < SHOPIFY_MAX_RETRIES && retryable) {
          await wait(500 * (attempt + 1));
          continue;
        }
        throw new Error(`${label}: ${message}`);
      }
      return payload?.data || {};
    } catch (error) {
      lastError = error;
      const retryable = String(error?.name || "") === "AbortError" || /ECONNRESET|ETIMEDOUT|timeout/i.test(String(error?.message || ""));
      if (attempt < SHOPIFY_MAX_RETRIES && retryable) {
        await wait(500 * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  throw lastError || new Error(label);
}

async function validateShopifyConnection(store) {
  const accessToken = await getShopifyAccessToken(store);
  const data = await queryShopifyAdmin(
    store,
    accessToken,
    `
      query VertexOpsShopValidation {
        shop {
          name
          myshopifyDomain
        }
        currentAppInstallation {
          accessScopes {
            handle
          }
        }
      }
    `,
    {},
    "shopify_validation_failed",
  );

  return {
    shopName: String(data?.shop?.name || "").trim(),
    shopDomain: String(data?.shop?.myshopifyDomain || store.shopifySettings?.storeDomain || "").trim(),
    scopes: Array.isArray(data?.currentAppInstallation?.accessScopes)
      ? data.currentAppInstallation.accessScopes.map((item) => item?.handle).filter(Boolean)
      : [],
  };
}

function getShopifyOrderFields(lineLimit = 20) {
  return `
    id
    legacyResourceId
    name
    email
    note
    customAttributes {
      key
      value
    }
    taxesIncluded
    displayFinancialStatus
    displayFulfillmentStatus
    paymentGatewayNames
    currentSubtotalPriceSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    currentTotalPriceSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    currentTotalTaxSet {
      shopMoney {
        amount
        currencyCode
      }
    }
    billingAddress {
      firstName
      lastName
      company
      phone
      city
      province
      provinceCode
      zip
      countryCodeV2
      address1
      address2
    }
    customer {
      firstName
      lastName
      email
      phone
    }
    shippingAddress {
      firstName
      lastName
      phone
      city
      province
      provinceCode
      zip
      countryCodeV2
      address1
      address2
    }
    lineItems(first: ${Math.max(1, Number(lineLimit || 20))}) {
      edges {
        node {
          name
          currentQuantity
          sku
          variantTitle
          customAttributes {
            key
            value
          }
          taxable
          requiresShipping
          discountedTotalSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          totalTaxSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          taxLines {
            title
            rate
            priceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;
}

async function refreshSingleShopifyOrder(store, order = {}) {
  const accessToken = await getShopifyAccessToken(store);
  const orderFields = getShopifyOrderFields(250);
  const storeDomain = String(store.shopifySettings?.storeDomain || "").trim();
  const orderGraphqlId = getNormalizedShopifyGraphqlId(order);
  const orderNumericId = extractShopifyLegacyId(getNormalizedShopifyNumericId(order) || order.id);
  let node = null;

  if (storeDomain && orderNumericId) {
    const response = await fetchWithTimeout(
      `https://${storeDomain}/admin/api/2026-01/orders/${encodeURIComponent(orderNumericId)}.json?fields=id,admin_graphql_api_id,name,email,note,current_total_price,current_total_tax,current_subtotal_price,total_price,total_tax,subtotal_price,taxes_included,financial_status,fulfillment_status,payment_gateway_names,billing_address,customer,shipping_address,line_items,created_at,updated_at,processed_at,note_attributes,currency,presentment_currency`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
      },
    );
    if (response.ok) {
      const payload = await response.json().catch(() => ({}));
      if (payload?.order) {
        return normalizeOrderPayload(payload.order, 0);
      }
    }
  }

  if (orderGraphqlId) {
    const data = await queryShopifyAdmin(
      store,
      accessToken,
      `
        query VertexOpsOrderById($id: ID!) {
          node(id: $id) {
            ... on Order {
              ${orderFields}
            }
          }
        }
      `,
      { id: orderGraphqlId },
      "shopify_order_refresh_failed",
    );
    node = data?.node || null;
  }

  if (!node) {
    const orderNumber = String(order.orderNumber || "").trim();
    const rawNumber = orderNumber.replace(/^#/, "").trim();
    const searchQueries = [orderNumber, rawNumber]
      .filter(Boolean)
      .map((value) => `name:${value}`);
    for (const queryText of searchQueries) {
      const data = await queryShopifyAdmin(
        store,
        accessToken,
        `
          query VertexOpsOrderByName($query: String!) {
            orders(first: 1, query: $query, sortKey: PROCESSED_AT, reverse: true) {
              edges {
                node {
                  ${orderFields}
                }
              }
            }
          }
        `,
        { query: queryText },
        "shopify_order_refresh_failed",
      );
      node = data?.orders?.edges?.[0]?.node || null;
      if (node) break;
    }
  }

  if (!node) {
    throw new Error("shopify_order_not_found");
  }

  return normalizeGraphqlOrder(node, 0);
}

function buildTrackingUrl(carrier = "", trackingNumber = "") {
  const normalizedCarrier = String(carrier || "").trim().toLowerCase();
  const normalizedTracking = String(trackingNumber || "").trim();
  if (!normalizedTracking) return "";
  if (normalizedCarrier.includes("gls")) return `https://www.gls-italy.com/track-and-trace?trackingnumber=${encodeURIComponent(normalizedTracking)}`;
  if (normalizedCarrier.includes("brt")) return `https://www.brt.it/it/ricerca_spedizioni?ReferenceCode=${encodeURIComponent(normalizedTracking)}`;
  if (normalizedCarrier.includes("sda")) return `https://www.sda.it/wps/portal/SDA_it/home/ricerca-spedizioni?reference=${encodeURIComponent(normalizedTracking)}`;
  return "";
}

async function syncShopifyTrackingForOrder(store, order, { trackingNumber = "", carrier = "" } = {}) {
  const trimmedTracking = String(trackingNumber || "").trim();
  if (!trimmedTracking) {
    throw new Error("missing_tracking_number");
  }

  const accessToken = await getShopifyAccessToken(store);
  const orderGraphqlId = getNormalizedShopifyGraphqlId(order);
  if (!orderGraphqlId) {
    throw new Error("missing_shopify_order_reference");
  }

  const lookup = await queryShopifyAdmin(
    store,
    accessToken,
    `
      query VertexOpsFulfillmentLookup($id: ID!) {
        order(id: $id) {
          id
          legacyResourceId
          displayFulfillmentStatus
          fulfillments(first: 10) {
            id
            status
            trackingInfo {
              company
              number
              url
            }
          }
          fulfillmentOrders(first: 20) {
            edges {
              node {
                id
                status
                requestStatus
                lineItems(first: 50) {
                  edges {
                    node {
                      id
                      remainingQuantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
    { id: orderGraphqlId },
    "shopify_fulfillment_lookup_failed",
  );

  const fulfillmentOrders = lookup?.order?.fulfillmentOrders?.edges
    ?.map((edge) => edge?.node)
    .filter(Boolean) || [];
  const existingFulfillments = Array.isArray(lookup?.order?.fulfillments)
    ? lookup.order.fulfillments.filter(Boolean)
    : [];
  const fulfillableOrders = fulfillmentOrders
    .map((item) => ({
      ...item,
      lineItems: item.lineItems?.edges
        ?.map((edge) => edge?.node)
        .filter((lineItem) => Number(lineItem?.remainingQuantity || 0) > 0) || [],
    }))
    .filter((item) => item.lineItems.length > 0);

  if (!fulfillableOrders.length) {
    const existingFulfillmentId = String(existingFulfillments[0]?.id || "").trim();
    if (existingFulfillmentId) {
      const updatedTracking = await queryShopifyAdmin(
        store,
        accessToken,
        `
          mutation VertexOpsTrackingUpdate($fulfillmentId: ID!, $trackingInfoInput: FulfillmentTrackingInput!, $notifyCustomer: Boolean) {
            fulfillmentTrackingInfoUpdate(
              fulfillmentId: $fulfillmentId,
              trackingInfoInput: $trackingInfoInput,
              notifyCustomer: $notifyCustomer
            ) {
              fulfillment {
                id
                status
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        {
          fulfillmentId: existingFulfillmentId,
          trackingInfoInput: {
            number: trimmedTracking,
            company: String(carrier || "").trim() || undefined,
            url: buildTrackingUrl(carrier, trimmedTracking) || undefined,
          },
          notifyCustomer: false,
        },
        "shopify_tracking_update_failed",
      );
      const updated = updatedTracking?.fulfillmentTrackingInfoUpdate;
      if (updated?.userErrors?.length) {
        throw new Error(updated.userErrors[0].message || "shopify_tracking_update_failed");
      }
      return {
        alreadySynced: false,
        fulfillmentId: String(updated?.fulfillment?.id || existingFulfillmentId).trim(),
        fulfillmentStatus: String(updated?.fulfillment?.status || lookup?.order?.displayFulfillmentStatus || order.fulfillmentStatus || "fulfilled").trim() || "fulfilled",
        legacyResourceId: String(lookup?.order?.legacyResourceId || getNormalizedShopifyNumericId(order) || "").trim(),
        graphqlId: String(lookup?.order?.id || orderGraphqlId).trim(),
      };
    }
    return {
      alreadySynced: true,
      fulfillmentStatus: String(lookup?.order?.displayFulfillmentStatus || order.fulfillmentStatus || "fulfilled").trim() || "fulfilled",
      legacyResourceId: String(lookup?.order?.legacyResourceId || getNormalizedShopifyNumericId(order) || "").trim(),
      graphqlId: String(lookup?.order?.id || orderGraphqlId).trim(),
    };
  }

  const trackingUrl = buildTrackingUrl(carrier, trimmedTracking);
  const fulfillmentInput = {
    notifyCustomer: false,
    lineItemsByFulfillmentOrder: fulfillableOrders.map((item) => ({
      fulfillmentOrderId: item.id,
      fulfillmentOrderLineItems: item.lineItems.map((lineItem) => ({
        id: lineItem.id,
        quantity: Number(lineItem.remainingQuantity || 0),
      })),
    })),
    trackingInfo: {
      number: trimmedTracking,
      company: String(carrier || "").trim() || undefined,
      url: trackingUrl || undefined,
    },
  };

  const mutation = await queryShopifyAdmin(
    store,
    accessToken,
    `
      mutation VertexOpsFulfillmentCreate($fulfillment: FulfillmentInput!, $message: String) {
        fulfillmentCreate(fulfillment: $fulfillment, message: $message) {
          fulfillment {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      fulfillment: fulfillmentInput,
      message: "Tracking synced from Vertex Ops",
    },
    "shopify_fulfillment_create_failed",
  );

  const created = mutation?.fulfillmentCreate;
  if (created?.userErrors?.length) {
    throw new Error(created.userErrors[0].message || "shopify_fulfillment_create_failed");
  }

  return {
    alreadySynced: false,
    fulfillmentId: String(created?.fulfillment?.id || "").trim(),
    fulfillmentStatus: String(created?.fulfillment?.status || "fulfilled").trim() || "fulfilled",
    legacyResourceId: String(lookup?.order?.legacyResourceId || getNormalizedShopifyNumericId(order) || "").trim(),
    graphqlId: String(lookup?.order?.id || orderGraphqlId).trim(),
  };
}

function upsertOrderRecord(store, order) {
  const existingOrderIndex = store.orders.findIndex((item) => item.id === order.id || areSameShopifyOrder(item, order));
  const existingOrder = existingOrderIndex >= 0 ? store.orders[existingOrderIndex] : null;

  if (existingOrder) {
    const nextOrderId = getNormalizedShopifyNumericId(order) || existingOrder.id || order.id;
    const linkedJob = store.jobs.find((job) => [existingOrder.id, order.id, nextOrderId].includes(job.sourceOrderId)) || null;
    if (linkedJob && linkedJob.sourceOrderId !== nextOrderId) {
      linkedJob.sourceOrderId = nextOrderId;
    }
    const merged = {
      ...existingOrder,
      ...order,
      id: nextOrderId,
      convertedJobId: existingOrder.convertedJobId || order.convertedJobId || null,
    };
    merged.operations = normalizeOperations(merged, linkedJob);
    store.orders[existingOrderIndex] = merged;
    return { order: merged, job: merged.convertedJobId ? store.jobs.find((job) => job.id === merged.convertedJobId) || null : null };
  }

  const created = { ...order, convertedJobId: null };
  created.operations = normalizeOperations(created, null);
  store.orders.unshift(created);
  return { order: created, job: null };
}

function verifyShopifyWebhook(rawBody, hmacHeader, secret) {
  if (!hmacHeader || !secret) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");
  const left = Buffer.from(digest);
  const right = Buffer.from(String(hmacHeader));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function getSessionContext(req, store) {
  const cookies = parseCookies(req.headers.cookie);
  if (!cookies.vertex_session) return { user: null, sessionId: "", refreshed: false };
  const sessionId = String(cookies.vertex_session || "");
  const entry = await readSessionEntry(sessionId);
  const userId = entry?.userId || "";
  const version = Number(entry?.version || 1);
  const expiresAt = Number(entry?.expiresAt || 0);
  if (expiresAt && expiresAt < Date.now()) {
    await deleteSessionEntry(sessionId);
    return { user: null, sessionId: "", refreshed: false };
  }
  if (!userId) return { user: null, sessionId: "", refreshed: false };
  const user = store.users.find((item) => item.id === userId) || null;
  if (!user) return { user: null, sessionId: "", refreshed: false };
  if (Number(user.sessionVersion || 1) !== version || user.status === "suspended") {
    await deleteSessionEntry(sessionId);
    return { user: null, sessionId: "", refreshed: false };
  }
  let refreshed = false;
  if (!expiresAt || expiresAt - Date.now() <= SESSION_REFRESH_BUFFER_MS) {
    await writeSessionEntry(sessionId, {
      userId,
      version,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    refreshed = true;
  }
  return { user, sessionId, refreshed };
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/healthz" && req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      service: "vertex-ops-pose-system",
      timestamp: new Date().toISOString(),
    });
  }

  if (url.pathname === "/api/events" && req.method === "GET") {
    await ensureStore();
    const store = await readJson(STORE_PATH, { users: [], jobs: [], orders: [], shopifySettings: {} });
    const storeChanged = reconcileStoreData(store);
    if (storeChanged) {
      await writeJson(STORE_PATH, store);
    }
    const sessionContext = await getSessionContext(req, store);
    if (!sessionContext.user) {
      return sendJson(
        res,
        401,
        { error: "unauthorized" },
        { "Set-Cookie": buildExpiredSessionCookie() },
      );
    }
    registerStoreEventsClient(req, res, {
      userId: sessionContext.user.id,
      extraHeaders: sessionContext.sessionId ? { "Set-Cookie": buildSessionCookie(sessionContext.sessionId) } : {},
    });
    return;
  }

  if (url.pathname === "/api/session/revision" && req.method === "GET") {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = String(cookies.vertex_session || "");
    const entry = await readSessionEntry(sessionId);
    const userId = String(entry?.userId || "");
    const version = Number(entry?.version || 1);
    const expiresAt = Number(entry?.expiresAt || 0);
    if (expiresAt && expiresAt < Date.now()) {
      await deleteSessionEntry(sessionId);
      return sendJson(res, 200, { user: null, revision: getStoreRevision() });
    }
    if (userId && (!expiresAt || expiresAt - Date.now() <= SESSION_REFRESH_BUFFER_MS)) {
      await writeSessionEntry(sessionId, {
        userId,
        version,
        expiresAt: Date.now() + SESSION_TTL_MS,
      });
    }
    let revision = await readStoreRevisionSnapshot();
    if (!revision) {
      await ensureStore();
      const storeSnapshot = await readJson(STORE_PATH, { users: [], jobs: [], orders: [], shopifySettings: {} });
      const storeSnapshotChanged = reconcileStoreData(storeSnapshot);
      if (storeSnapshotChanged) {
        await writeJson(STORE_PATH, storeSnapshot);
      } else {
        ensureStoreRevision(storeSnapshot);
      }
      revision = getStoreRevision(storeSnapshot);
    }
    return sendJson(
      res,
      200,
      {
        user: userId ? { id: userId } : null,
        revision,
      },
      userId && sessionId ? { "Set-Cookie": buildSessionCookie(sessionId) } : {},
    );
  }

  await ensureStore();
  const store = await readJson(STORE_PATH, { users: [], jobs: [], orders: [], shopifySettings: {} });
  const storeChanged = reconcileStoreData(store);
  if (storeChanged) {
    await writeJson(STORE_PATH, store);
  }
  const sessionContext = await getSessionContext(req, store);
  const currentUser = sessionContext.user;

  if (url.pathname === "/api/session" && req.method === "GET") {
    return sendJson(res, 200, {
      revision: getStoreRevision(store),
      user: sanitizeUser(currentUser),
      jobs: currentUser ? store.jobs : [],
      orders: currentUser ? store.orders : [],
      inventory: currentUser ? store.inventory : [],
      salesRequests: currentUser?.role === "office" ? store.salesRequests : [],
      salesContents: currentUser?.role === "office" ? serializeSalesContentsForClient(store.salesContents) : [],
      salesRequestSource: currentUser?.role === "office" ? sanitizeSalesRequestSourceConfig(store.salesRequestSource) : {},
      coveragePlanner: currentUser ? store.coveragePlanner : normalizeCoveragePlanner(),
      shopifySettings: currentUser ? serializeShopifySettings(store.shopifySettings) : {},
      users: currentUser?.role === "office" ? store.users.map(sanitizeUser) : [],
      securityEvents: currentUser?.role === "office" ? store.securityEvents : [],
      securityPolicy: currentUser?.role === "office"
        ? {
            passwordMinLength: PASSWORD_MIN_LENGTH,
            bootstrapRecoveryActive: Boolean(BOOTSTRAP_OFFICE_PASSWORD),
          }
        : {},
    }, currentUser && sessionContext.sessionId ? {
      "Set-Cookie": buildSessionCookie(sessionContext.sessionId),
    } : {});
  }

  if (url.pathname === "/api/login" && req.method === "POST") {
    const body = await readBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    if (isLoginBlocked(req, email)) {
      return sendJson(res, 429, { error: "too_many_attempts" });
    }
    const demoUsers = getDemoUsers();
    let user = store.users.find((item) => item.email.toLowerCase() === email && verifyPasswordRecord(item, password));
    const demoUser = ALLOW_DEMO_FALLBACK
      ? demoUsers.find((item) => item.email.toLowerCase() === email && item.password === password) || null
      : null;

    if (!user && demoUser) {
      const existingIndex = store.users.findIndex((item) => item.email.toLowerCase() === email);
      const securedDemoUser = sanitizePasswordUser(demoUser);
      if (existingIndex >= 0) {
        store.users[existingIndex] = { ...store.users[existingIndex], ...securedDemoUser };
      } else {
        store.users.push(securedDemoUser);
      }
      user = securedDemoUser;
      await writeJson(STORE_PATH, store);
    }

    if (!user) {
      recordFailedLogin(req, email);
      pushSecurityEvent(store, "login_failed", email || "unknown", "Tentativo login fallito.", { ip: getClientIp(req) });
      await writeJson(STORE_PATH, store);
      return sendJson(res, 401, { error: "invalid_credentials" });
    }
    if (user.status === "suspended") {
      pushSecurityEvent(store, "login_blocked", user.email, "Login rifiutato: account sospeso.", { ip: getClientIp(req) });
      await writeJson(STORE_PATH, store);
      return sendJson(res, 403, { error: "account_suspended" });
    }
    clearFailedLogin(req, email);

    const sessionId = randomUUID();
    await writeSessionEntry(sessionId, {
      userId: user.id,
      version: Number(user.sessionVersion || 1),
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    pushSecurityEvent(store, "login_success", user.email, "Login effettuato.", { ip: getClientIp(req) });
    await writeJson(STORE_PATH, store);

    return sendJson(
      res,
      200,
      {
        revision: getStoreRevision(store),
        user: sanitizeUser(user),
        jobs: store.jobs,
        orders: store.orders,
        inventory: store.inventory,
        salesRequests: user.role === "office" ? store.salesRequests : [],
        salesContents: user.role === "office" ? serializeSalesContentsForClient(store.salesContents) : [],
        salesRequestSource: user.role === "office" ? sanitizeSalesRequestSourceConfig(store.salesRequestSource) : {},
        coveragePlanner: store.coveragePlanner,
        shopifySettings: serializeShopifySettings(store.shopifySettings),
        users: user.role === "office" ? store.users.map(sanitizeUser) : [],
        securityEvents: user.role === "office" ? store.securityEvents : [],
        securityPolicy: user.role === "office"
          ? {
              passwordMinLength: PASSWORD_MIN_LENGTH,
              bootstrapRecoveryActive: Boolean(BOOTSTRAP_OFFICE_PASSWORD),
            }
          : {},
      },
      {
        "Set-Cookie": buildSessionCookie(sessionId),
      },
    );
  }

  if (url.pathname === "/api/logout" && req.method === "POST") {
    const cookies = parseCookies(req.headers.cookie);
    await deleteSessionEntry(cookies.vertex_session || "");
    return sendJson(
      res,
      200,
      { ok: true },
      { "Set-Cookie": buildExpiredSessionCookie() },
    );
  }

  if (url.pathname === "/api/coverage-planner" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    return sendJson(res, 200, normalizeCoveragePlanner(store.coveragePlanner));
  }

  if (url.pathname === "/api/coverage-planner" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    store.coveragePlanner = normalizeCoveragePlanner(body || {});
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.coveragePlanner);
  }

  if (url.pathname === "/api/sales/request-source" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const body = await readBody(req);
    try {
      const currentConfig = normalizeSalesRequestSourceConfig(store.salesRequestSource || {});
      const nextConfig = normalizeSalesRequestSourceConfig({
        ...currentConfig,
        spreadsheetInput: body.spreadsheetInput ?? currentConfig.spreadsheetInput,
        sheetName: body.sheetName ?? currentConfig.sheetName,
      });
      if (body.clearServiceAccount) {
        nextConfig.serviceAccountEmail = "";
        nextConfig.privateKey = "";
      }
      const rawServiceAccountJson = String(body.serviceAccountJson || "").trim();
      if (rawServiceAccountJson) {
        const parsed = JSON.parse(rawServiceAccountJson);
        const email = String(parsed.client_email || "").trim();
        const privateKey = String(parsed.private_key || "");
        if (!email || !privateKey) return sendJson(res, 400, { error: "invalid_service_account_json" });
        nextConfig.serviceAccountEmail = email;
        nextConfig.privateKey = privateKey;
      }
      if (!body.clearServiceAccount && !nextConfig.serviceAccountEmail && !nextConfig.privateKey) {
        return sendJson(res, 400, { error: "missing_service_account" });
      }
      resolveSpreadsheetId(nextConfig.spreadsheetInput);
      store.salesRequestSource = nextConfig;
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, sanitizeSalesRequestSourceConfig(nextConfig));
    } catch (error) {
      if (error instanceof SyntaxError) return sendJson(res, 400, { error: "invalid_service_account_json" });
      if (["invalid_spreadsheet", "missing_spreadsheet", "missing_service_account"].includes(String(error?.message || ""))) {
        return sendJson(res, 400, { error: error.message });
      }
      return sendJson(res, 500, { error: String(error?.message || "sales_request_source_save_failed") });
    }
  }

  if (url.pathname === "/api/sales/request-source/sync" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    try {
      const sourcePayload = await loadGoogleSheetSalesRequests(store.salesRequestSource || {});
      const now = new Date().toISOString();
      const existingById = new Map(
        (Array.isArray(store.salesRequests) ? store.salesRequests : [])
          .filter((item) => String(item.source || "") === "google-sheets")
          .map((item) => [item.id, item]),
      );
      const importedRequests = sourcePayload.requests.map((item) => {
        const existing = existingById.get(item.id) || null;
        return normalizeSalesRequestRecord({
          ...item,
          requestedHeight: item.requestedHeight,
          assignment: item.assignment || existing?.assignment || "",
          status: item.status || existing?.status || "new",
          note: item.note || existing?.note || "",
          whatsappTemplate: item.whatsappTemplate || existing?.whatsappTemplate || "",
          whatsappUrl: item.whatsappUrl || existing?.whatsappUrl || "",
          firstContactState: existing?.firstContactState || "",
          firstContactScheduledAt: existing?.firstContactScheduledAt || "",
          firstContactSentAt: existing?.firstContactSentAt || "",
          firstContactBy: existing?.firstContactBy || "",
          createdAt: existing?.createdAt || item.createdAt || now,
          updatedAt: now,
        });
      });
      const manualRequests = (Array.isArray(store.salesRequests) ? store.salesRequests : [])
        .filter((item) => String(item.source || "") !== "google-sheets");
      store.salesRequestSource = normalizeSalesRequestSourceConfig({
        ...(store.salesRequestSource || {}),
        spreadsheetInput: store.salesRequestSource?.spreadsheetInput || DEFAULT_SALES_REQUEST_SPREADSHEET,
        sheetName: sourcePayload.sheetName || store.salesRequestSource?.sheetName || "",
      });
      store.salesRequests = [...importedRequests, ...manualRequests];
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, {
        requests: store.salesRequests,
        importedCount: importedRequests.length,
        config: sanitizeSalesRequestSourceConfig(store.salesRequestSource),
        sheetName: sourcePayload.sheetName,
        spreadsheetTitle: sourcePayload.spreadsheetTitle,
        editUrl: sourcePayload.editUrl,
      });
    } catch (error) {
      if (["missing_service_account", "missing_spreadsheet", "invalid_spreadsheet"].includes(String(error?.message || ""))) {
        return sendJson(res, 400, { error: error.message });
      }
      return sendJson(res, 500, { error: String(error?.message || "sales_request_source_sync_failed") });
    }
  }

  if (url.pathname === "/api/sales/requests" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const body = await readBody(req);
    const now = new Date().toISOString();
    const existingRequest = store.salesRequests.find((item) => item.id === String(body.id || "")) || null;
    const draftRecord = normalizeSalesRequestRecord({
      ...body,
      createdAt: existingRequest?.createdAt || body.createdAt || now,
      updatedAt: now,
    });
    const automationResult = await applySalesRequestAutomationOnSave({
      existingRequest,
      requestRecord: draftRecord,
      nowIso: now,
    });
    const requestRecord = normalizeSalesRequestRecord({
      ...automationResult.record,
      createdAt: existingRequest?.createdAt || draftRecord.createdAt || now,
      updatedAt: now,
    });
    const existingIndex = store.salesRequests.findIndex((item) => item.id === requestRecord.id);
    if (existingIndex >= 0) {
      store.salesRequests[existingIndex] = requestRecord;
    } else {
      store.salesRequests.unshift(requestRecord);
    }
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, {
      ...requestRecord,
      _automation: automationResult.automation || { action: "none" },
    });
  }

  if (url.pathname.match(/^\/api\/sales\/requests\/[^/]+$/) && req.method === "DELETE") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const requestId = decodeURIComponent(url.pathname.split("/")[4]);
    const nextRequests = store.salesRequests.filter((item) => item.id !== requestId);
    if (nextRequests.length === store.salesRequests.length) return sendJson(res, 404, { error: "request_not_found" });
    store.salesRequests = nextRequests;
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/api/sales/content-items" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const body = await readBody(req);
    const now = new Date().toISOString();
    const existingContent = store.salesContents.find((item) => item.id === String(body.id || "")) || null;
    const contentRecord = normalizeSalesContentRecord({
      ...body,
      attachments: existingContent?.attachments || body.attachments || [],
      createdAt: existingContent?.createdAt || body.createdAt || now,
      updatedAt: now,
    });
    const existingIndex = store.salesContents.findIndex((item) => item.id === contentRecord.id);
    if (existingIndex >= 0) {
      store.salesContents[existingIndex] = contentRecord;
    } else {
      store.salesContents.unshift(contentRecord);
    }
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, serializeSalesContentForClient(contentRecord));
  }

  if (url.pathname.match(/^\/api\/sales\/content-items\/[^/]+$/) && req.method === "DELETE") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const contentId = decodeURIComponent(url.pathname.split("/")[4]);
    const contentIndex = store.salesContents.findIndex((item) => item.id === contentId);
    if (contentIndex < 0) return sendJson(res, 404, { error: "content_not_found" });
    const [removedContent] = store.salesContents.splice(contentIndex, 1);
    for (const attachment of removedContent.attachments || []) {
      await removeAttachmentAsset(attachment).catch((error) => {
        console.error("sales_content_attachment_delete_failed", error);
      });
    }
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname.match(/^\/api\/sales\/content-items\/[^/]+\/attachments$/) && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const contentId = decodeURIComponent(url.pathname.split("/")[4]);
    const body = await readBody(req);
    const contentIndex = store.salesContents.findIndex((item) => item.id === contentId);
    if (contentIndex < 0) return sendJson(res, 404, { error: "content_not_found" });
    const current = store.salesContents[contentIndex];
    const incomingAttachments = Array.isArray(body.attachments) ? body.attachments : [];
    const savedAttachments = [];
    for (const item of incomingAttachments) {
      savedAttachments.push(await storeAttachmentAsset(contentId, item, "sales-content"));
    }
    store.salesContents[contentIndex] = normalizeSalesContentRecord({
      ...current,
      attachments: [...(current.attachments || []), ...savedAttachments],
      updatedAt: new Date().toISOString(),
    });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, serializeSalesContentForClient(store.salesContents[contentIndex]));
  }

  if (url.pathname.match(/^\/api\/sales\/content-items\/[^/]+\/attachments\/[^/]+\/file$/) && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const parts = url.pathname.split("/");
    const contentId = decodeURIComponent(parts[4]);
    const attachmentId = decodeURIComponent(parts[6]);
    const contentItem = store.salesContents.find((item) => item.id === contentId);
    if (!contentItem) return sendJson(res, 404, { error: "content_not_found" });
    const attachment = (contentItem.attachments || []).find((item) => String(item.id || "") === attachmentId);
    if (!attachment) return sendJson(res, 404, { error: "attachment_not_found" });
    return streamAttachmentAsset(res, attachment);
  }

  if (url.pathname.match(/^\/api\/sales\/content-items\/[^/]+\/attachments\/\d+$/) && req.method === "DELETE") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const parts = url.pathname.split("/");
    const contentId = decodeURIComponent(parts[4]);
    const attachmentIndex = Number(parts[6]);
    const contentIndex = store.salesContents.findIndex((item) => item.id === contentId);
    if (contentIndex < 0) return sendJson(res, 404, { error: "content_not_found" });
    const current = store.salesContents[contentIndex];
    const attachments = Array.isArray(current.attachments) ? [...current.attachments] : [];
    if (attachmentIndex < 0 || attachmentIndex >= attachments.length) return sendJson(res, 404, { error: "attachment_not_found" });
    const [removedAttachment] = attachments.splice(attachmentIndex, 1);
    await removeAttachmentAsset(removedAttachment).catch((error) => {
      console.error("sales_content_attachment_delete_failed", error);
    });
    store.salesContents[contentIndex] = normalizeSalesContentRecord({
      ...current,
      attachments,
      updatedAt: new Date().toISOString(),
    });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, serializeSalesContentForClient(store.salesContents[contentIndex]));
  }

  if (url.pathname === "/api/account/password" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const currentPassword = String(body.currentPassword || "");
    const nextPassword = String(body.newPassword || "");
    const passwordError = validatePasswordStrength(nextPassword);
    if (passwordError) {
      return sendJson(res, 400, { error: passwordError });
    }
    const userIndex = store.users.findIndex((item) => item.id === currentUser.id);
    if (userIndex < 0) return sendJson(res, 404, { error: "user_not_found" });
    const storedUser = store.users[userIndex];
    if (!verifyPasswordRecord(storedUser, currentPassword)) {
      return sendJson(res, 400, { error: "invalid_current_password" });
    }
    const { hash, salt } = hashPassword(nextPassword);
    const currentCookie = parseCookies(req.headers.cookie).vertex_session;
    store.users[userIndex] = {
      ...storedUser,
      passwordHash: hash,
      passwordSalt: salt,
      mustChangePassword: false,
      sessionVersion: Math.max(1, Number(storedUser.sessionVersion || 1)) + 1,
      lastPasswordChangeAt: new Date().toISOString(),
    };
    delete store.users[userIndex].password;
    const sessionId = randomUUID();
    await writeSessionEntry(sessionId, {
      userId: storedUser.id,
      version: store.users[userIndex].sessionVersion,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    await deleteSessionEntry(currentCookie || "");
    pushSecurityEvent(store, "password_changed", currentUser.email, "Password aggiornata dall'utente.", {});
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true }, {
      "Set-Cookie": buildSessionCookie(sessionId),
    });
  }

  if (url.pathname === "/api/webhooks/shopify/orders" && req.method === "POST") {
    const rawBody = await readRawBody(req);
    const hmacHeader = req.headers["x-shopify-hmac-sha256"];
    const topic = String(req.headers["x-shopify-topic"] || "");
    const verified = verifyShopifyWebhook(rawBody, hmacHeader, store.shopifySettings?.clientSecret || "");
    if (!verified) return sendJson(res, 401, { error: "invalid_webhook_signature" });
    if (topic && topic !== "orders/create") return sendJson(res, 200, { ok: true, ignored: true });

    const payload = JSON.parse(rawBody.toString("utf8") || "{}");
    const normalized = normalizeOrderPayload(payload, 0);
    const result = upsertOrderRecord(store, normalized);
    store.orders = sortOrdersByRecency(store.orders);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true, orderId: result.order.id, jobId: result.job?.id || null });
  }

  if (url.pathname === "/api/shopify/oauth/start" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    if (!currentUser) {
      return sendRedirect(res, "/index.html?shopify=error&message=Effettua%20prima%20il%20login");
    }

    const shop = String(url.searchParams.get("shop") || store.shopifySettings?.storeDomain || "").trim().toLowerCase();
    const clientId = String(store.shopifySettings?.clientId || "").trim();
    const clientSecret = String(store.shopifySettings?.clientSecret || "").trim();
    if (!isValidShopDomain(shop) || !clientId || !clientSecret) {
      return sendRedirect(res, "/index.html?shopify=error&message=Completa%20dominio,%20client%20id%20e%20client%20secret");
    }

    const state = randomUUID();
    const redirectUri = getShopifyRedirectUri(req);
    const authorizeUrl = new URL(`https://${shop}/admin/oauth/authorize`);
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("scope", SHOPIFY_OAUTH_SCOPES);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);

    return sendRedirect(
      res,
      authorizeUrl.toString(),
      {
        "Set-Cookie": buildShopifyOauthStateCookie(state),
      },
    );
  }

  if (url.pathname === "/api/shopify/oauth/callback" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    const cookies = parseCookies(req.headers.cookie);
    const state = String(url.searchParams.get("state") || "");
    const shop = String(url.searchParams.get("shop") || "").trim().toLowerCase();
    const code = String(url.searchParams.get("code") || "");
    const clientId = String(store.shopifySettings?.clientId || "").trim();
    const clientSecret = String(store.shopifySettings?.clientSecret || "").trim();

    if (!isValidShopDomain(shop) || !code || !state || state !== String(cookies.shopify_oauth_state || "")) {
      return sendRedirect(res, "/index.html?shopify=error&message=Callback%20Shopify%20non%20valida");
    }
    if (!verifyShopifyOauthHmac(url.searchParams, clientSecret)) {
      return sendRedirect(res, "/index.html?shopify=error&message=Verifica%20Shopify%20fallita");
    }
    if (!clientId || !clientSecret) {
      return sendRedirect(res, "/index.html?shopify=error&message=Mancano%20le%20credenziali%20app");
    }

    try {
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      });

      if (!tokenResponse.ok) {
        return sendRedirect(res, "/index.html?shopify=error&message=Scambio%20token%20Shopify%20fallito");
      }

      const tokenPayload = await tokenResponse.json();
      if (!tokenPayload?.access_token) {
        return sendRedirect(res, "/index.html?shopify=error&message=Token%20Shopify%20non%20ricevuto");
      }

      store.shopifySettings = {
        ...store.shopifySettings,
        storeDomain: shop,
        installedShop: shop,
        adminAccessToken: tokenPayload.access_token,
        tokenScope: String(tokenPayload.scope || ""),
        tokenUpdatedAt: new Date().toISOString(),
      };
      await writeJson(STORE_PATH, store);

      return sendRedirect(
        res,
        "/index.html?shopify=connected",
        {
          "Set-Cookie": buildExpiredShopifyOauthStateCookie(),
        },
      );
    } catch {
      return sendRedirect(res, "/index.html?shopify=error&message=OAuth%20Shopify%20non%20completato");
    }
  }

  if (!currentUser) {
    return sendJson(res, 401, { error: "unauthorized" });
  }

  if (url.pathname === "/api/bootstrap" && req.method === "GET") {
    return sendJson(res, 200, {
      user: sanitizeUser(currentUser),
      jobs: store.jobs,
      orders: store.orders,
      inventory: store.inventory,
      salesRequests: currentUser?.role === "office" ? store.salesRequests : [],
      salesContents: currentUser?.role === "office" ? serializeSalesContentsForClient(store.salesContents) : [],
      salesRequestSource: currentUser?.role === "office" ? sanitizeSalesRequestSourceConfig(store.salesRequestSource) : {},
      shopifySettings: serializeShopifySettings(store.shopifySettings),
      users: currentUser?.role === "office" ? store.users.map(sanitizeUser) : [],
      securityEvents: currentUser?.role === "office" ? store.securityEvents : [],
      securityPolicy: currentUser?.role === "office"
        ? {
            passwordMinLength: PASSWORD_MIN_LENGTH,
            bootstrapRecoveryActive: Boolean(BOOTSTRAP_OFFICE_PASSWORD),
          }
        : {},
    });
  }

  if (url.pathname === "/api/security/events" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    return sendJson(res, 200, store.securityEvents);
  }

  if (url.pathname === "/api/accounts" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    return sendJson(res, 200, store.users.map(sanitizeUser));
  }

  if (url.pathname === "/api/accounts" && req.method === "POST") {
    if (requireOffice(res, currentUser)) return;
    const body = await readBody(req);
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = normalizeUserRole(body.role);
    const password = String(body.password || "");
    const status = String(body.status || "active").trim() === "suspended" ? "suspended" : "active";
    const mustChangePassword = Boolean(body.mustChangePassword);
    const crewName = role === "crew"
      ? String(body.crewName || name || "").trim()
      : "";
    const dailyCapacity = role === "crew"
      ? Math.max(0, toNumber(body.dailyCapacity || DEFAULT_CREW_DAILY_CAPACITY))
      : 0;
    const submittedCrewLogoDataUrl = String(body.crewLogoDataUrl || "").trim();
    const crewLogoDataUrl = role === "crew"
      ? sanitizeCrewLogoDataUrl(submittedCrewLogoDataUrl)
      : "";
    if (role === "crew" && submittedCrewLogoDataUrl && !crewLogoDataUrl) {
      return sendJson(res, 400, { error: "invalid_crew_logo_file" });
    }
    if (!name || !email || !isValidRole(role)) {
      return sendJson(res, 400, { error: "invalid_account_payload" });
    }
    if (role === "crew" && !crewName) {
      return sendJson(res, 400, { error: "invalid_account_payload" });
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return sendJson(res, 400, { error: passwordError });
    }
    if (store.users.some((item) => item.email.toLowerCase() === email)) {
      return sendJson(res, 400, { error: "email_already_exists" });
    }
    if (
      role === "crew"
      && store.users.some((item) => item.role === "crew" && normalizeCrewName(item.crewName || item.name) === normalizeCrewName(crewName))
    ) {
      return sendJson(res, 400, { error: "crew_name_exists" });
    }
    const { hash, salt } = hashPassword(password);
    const created = {
      id: randomUUID(),
      name,
      email,
      role,
      crewName,
      dailyCapacity,
      crewLogoDataUrl,
      status,
      mustChangePassword,
      sessionVersion: 1,
      lastPasswordChangeAt: new Date().toISOString(),
      passwordHash: hash,
      passwordSalt: salt,
    };
    store.users.push(created);
    pushSecurityEvent(store, "account_created", currentUser.email, `Creato account ${email}.`, {
      email,
      role,
      status,
      crewName,
      dailyCapacity,
      hasCrewLogo: Boolean(crewLogoDataUrl),
    });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, sanitizeUser(created));
  }

  if (url.pathname.match(/^\/api\/accounts\/[^/]+$/) && req.method === "POST") {
    if (requireOffice(res, currentUser)) return;
    const userId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const userIndex = store.users.findIndex((item) => item.id === userId);
    if (userIndex < 0) return sendJson(res, 404, { error: "user_not_found" });
    const current = store.users[userIndex];
    const nextEmail = String(body.email || current.email || "").trim().toLowerCase();
    const nextName = String(body.name || current.name || "").trim();
    const nextRole = normalizeUserRole(body.role || current.role || "");
    const nextStatus = String(body.status || current.status || "active").trim() === "suspended" ? "suspended" : "active";
    const mustChangePassword = body.mustChangePassword === true || body.mustChangePassword === "true";
    const newPassword = String(body.password || "");
    const nextCrewName = nextRole === "crew"
      ? String(body.crewName || current.crewName || nextName || "").trim()
      : "";
    const nextDailyCapacity = nextRole === "crew"
      ? Math.max(0, toNumber(body.dailyCapacity || current.dailyCapacity || DEFAULT_CREW_DAILY_CAPACITY))
      : 0;
    const shouldRemoveCrewLogo = body.removeCrewLogo === true || body.removeCrewLogo === "true";
    const rawCrewLogoDataUrl = String(body.crewLogoDataUrl || "").trim();
    const submittedCrewLogoDataUrl = sanitizeCrewLogoDataUrl(rawCrewLogoDataUrl);
    if (nextRole === "crew" && rawCrewLogoDataUrl && !submittedCrewLogoDataUrl) {
      return sendJson(res, 400, { error: "invalid_crew_logo_file" });
    }
    const nextCrewLogoDataUrl = nextRole === "crew"
      ? (shouldRemoveCrewLogo ? "" : (submittedCrewLogoDataUrl || sanitizeCrewLogoDataUrl(current.crewLogoDataUrl || "")))
      : "";
    if (!nextName || !nextEmail || !isValidRole(nextRole)) {
      return sendJson(res, 400, { error: "invalid_account_payload" });
    }
    if (nextRole === "crew" && !nextCrewName) {
      return sendJson(res, 400, { error: "invalid_account_payload" });
    }
    if (store.users.some((item) => item.id !== userId && item.email.toLowerCase() === nextEmail)) {
      return sendJson(res, 400, { error: "email_already_exists" });
    }
    if (
      nextRole === "crew"
      && store.users.some((item) => item.id !== userId && item.role === "crew" && normalizeCrewName(item.crewName || item.name) === normalizeCrewName(nextCrewName))
    ) {
      return sendJson(res, 400, { error: "crew_name_exists" });
    }
    const previousCrewName = current.role === "crew" ? String(current.crewName || current.name || "").trim() : "";
    const updated = {
      ...current,
      name: nextName,
      email: nextEmail,
      role: nextRole,
      crewName: nextCrewName,
      dailyCapacity: nextDailyCapacity,
      crewLogoDataUrl: nextCrewLogoDataUrl,
      status: nextStatus,
      mustChangePassword: mustChangePassword || current.mustChangePassword,
    };
    if (newPassword) {
      const passwordError = validatePasswordStrength(newPassword);
      if (passwordError) {
        return sendJson(res, 400, { error: passwordError });
      }
      const { hash, salt } = hashPassword(newPassword);
      updated.passwordHash = hash;
      updated.passwordSalt = salt;
      updated.mustChangePassword = mustChangePassword || false;
      updated.sessionVersion = Math.max(1, Number(current.sessionVersion || 1)) + 1;
      updated.lastPasswordChangeAt = new Date().toISOString();
      delete updated.password;
    } else if (mustChangePassword !== current.mustChangePassword || nextStatus !== current.status) {
      updated.sessionVersion = Math.max(1, Number(current.sessionVersion || 1)) + 1;
    }
    store.users[userIndex] = updated;
    if (
      current.role === "crew"
      && nextRole === "crew"
      && previousCrewName
      && nextCrewName
      && normalizeCrewName(previousCrewName) !== normalizeCrewName(nextCrewName)
    ) {
      store.orders = store.orders.map((order) => {
        const assignedCrew = String(order.operations?.installation?.crew || "").trim();
        if (!assignedCrew || normalizeCrewName(assignedCrew) !== normalizeCrewName(previousCrewName)) return order;
        return {
          ...order,
          operations: normalizeOperations(
            {
              ...order,
              operations: {
                ...(order.operations || {}),
                installation: {
                  ...(order.operations?.installation || {}),
                  crew: nextCrewName,
                },
              },
            },
            store.jobs.find((job) => job.sourceOrderId === order.id) || null,
          ),
        };
      });
    }
    pushSecurityEvent(store, "account_updated", currentUser.email, `Aggiornato account ${nextEmail}.`, {
      email: nextEmail,
      role: nextRole,
      crewName: nextCrewName,
      dailyCapacity: nextDailyCapacity,
      hasCrewLogo: Boolean(nextCrewLogoDataUrl),
      status: nextStatus,
      mustChangePassword: updated.mustChangePassword,
    });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, sanitizeUser(updated));
  }

  if (url.pathname === "/api/inventory" && req.method === "GET") {
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname === "/api/inventory/items" && req.method === "POST") {
    const body = await readBody(req);
    const quantity = Math.max(1, Math.round(toNumber(body.quantity || 1)));
    const product = String(body.product || "").trim();
    const width = toNumber(body.width || 0);
    const length = toNumber(body.length || 0);
    const note = String(body.note || "");
    const status = body.status === "residuo" ? "residuo" : "intero";
    const measured = body.measured !== false && body.measured !== "false";
    if (!product) {
      return sendJson(res, 400, { error: "invalid_inventory_payload" });
    }
    const created = measured
      ? Array.from({ length: quantity }, () => ({
        id: randomUUID(),
        product,
        width,
        length,
        sqm: width && length ? Number((width * length).toFixed(2)) : 0,
        variant: String(body.variant || ""),
        status,
        note,
        units: 1,
        createdAt: new Date().toISOString(),
      }))
      : [{
        id: randomUUID(),
        product,
        width,
        length,
        sqm: 0,
        variant: String(body.variant || ""),
        status,
        note,
        units: quantity,
        createdAt: new Date().toISOString(),
      }];
    store.inventory.unshift(...created);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname.match(/^\/api\/inventory\/items\/by-product\/[^/]+$/) && req.method === "DELETE") {
    const productLabel = decodeURIComponent(url.pathname.split("/")[5] || "");
    const productKey = normalizeInventoryProductKey(productLabel);
    if (!productKey) {
      return sendJson(res, 400, { error: "invalid_inventory_product" });
    }
    store.inventory = (store.inventory || []).filter((item) => normalizeInventoryProductKey(item.product || "") !== productKey);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname.match(/^\/api\/inventory\/items\/[^/]+$/) && req.method === "DELETE") {
    const itemId = decodeURIComponent(url.pathname.split("/")[4]);
    store.inventory = store.inventory.filter((item) => item.id !== itemId);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname === "/api/jobs" && req.method === "GET") {
    return sendJson(res, 200, store.jobs);
  }

  if (url.pathname === "/api/jobs" && req.method === "POST") {
    const body = await readBody(req);
    const nextJobs = [body, ...store.jobs.filter((job) => job.id !== body.id)];
    store.jobs = nextJobs;
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, body);
  }

  if (url.pathname.startsWith("/api/jobs/") && req.method === "DELETE") {
    const jobId = url.pathname.split("/").pop();
    store.jobs = store.jobs.filter((job) => job.id !== jobId);
    store.orders = store.orders.map((order) => order.convertedJobId === jobId ? { ...order, convertedJobId: null } : order);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname.match(/^\/api\/jobs\/[^/]+\/attachments$/) && req.method === "POST") {
    const jobId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const jobIndex = store.jobs.findIndex((item) => item.id === jobId);
    if (jobIndex < 0) return sendJson(res, 404, { error: "job_not_found" });
    const current = store.jobs[jobIndex];
    store.jobs[jobIndex] = {
      ...current,
      attachments: [...(current.attachments || []), ...(Array.isArray(body.attachments) ? body.attachments : [])],
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.jobs[jobIndex]);
  }

  if (url.pathname === "/api/orders" && req.method === "GET") {
    return sendJson(res, 200, store.orders);
  }

  if (url.pathname === "/api/orders" && req.method === "POST") {
    const body = await readBody(req);
    const lineDetails = Array.isArray(body.lineDetails)
      ? body.lineDetails.map((item) => normalizeLineDetailRecord(item))
      : [];
    const billing = normalizeBillingAddress(body.billing || {}, body, extractBillingMetadata(body.billing || {}, body));
    const totals = normalizeOrderTotals({
      grossTotal: body.total || 0,
      totalTax: body.taxTotal || 0,
      currentSubtotal: body.netSubtotal || body.total || 0,
      currency: body.currency || "EUR",
      taxKnown: body.taxTotal != null,
      netKnown: body.netSubtotal != null || body.total != null,
      lineDetails,
    }, body.total || 0);
    const manualOrder = {
      id: randomUUID(),
      orderNumber: String(body.orderNumber || `MAN-${Date.now()}`),
      firstName: String(body.firstName || "").trim(),
      lastName: String(body.lastName || "").trim(),
      email: String(body.email || "").trim(),
      phone: String(body.phone || "").trim(),
      city: String(body.city || "").trim(),
      provinceCode: String(body.provinceCode || "").trim().toUpperCase(),
      province: "",
      postalCode: String(body.postalCode || "").trim(),
      countryCode: "IT",
      address: String(body.address || "").trim(),
      total: String(body.total || "0"),
      totals,
      billing,
      shopifyNumericId: "",
      shopifyGraphqlId: "",
      financialStatus: String(body.financialStatus || "pending"),
      fulfillmentStatus: String(body.fulfillmentStatus || "unfulfilled"),
      paymentMethod: String(body.paymentMethod || ""),
      source: "manual",
      note: String(body.note || ""),
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : [],
      lineDetails,
      accounting: normalizeAccountingRecord({
        paymentMethod: String(body.paymentMethod || ""),
        depositPaid: 0,
        balancePaid: 0,
        payments: [],
        invoiceRequired: inferInvoiceRequired({}, billing),
        invoiceIssued: false,
        accountingNote: "",
      }, String(body.paymentMethod || ""), billing),
      attachments: [],
      convertedJobId: null,
    };
    manualOrder.operations = normalizeOperations(manualOrder, null);
    store.orders.unshift(manualOrder);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, manualOrder);
  }

  if (url.pathname === "/api/orders/non-shopify" && req.method === "DELETE") {
    return sendJson(res, 403, { error: "manual_order_cleanup_disabled" });
  }

  if (url.pathname.startsWith("/api/orders/") && req.method === "DELETE" && !url.pathname.endsWith("/create-job") && !url.pathname.endsWith("/accounting") && !url.pathname.endsWith("/attachments")) {
    return sendJson(res, 403, { error: "order_deletion_disabled" });
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/refresh-shopify$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    if (!String(current.source || "").toLowerCase().startsWith("shopify")) {
      return sendJson(res, 400, { error: "shopify_order_required" });
    }
    try {
      const refreshedOrder = await refreshSingleShopifyOrder(store, current);
      const result = upsertOrderRecord(store, refreshedOrder);
      store.orders = sortOrdersByRecency(store.orders);
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, result.order);
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "shopify_order_refresh_failed" });
    }
  }

  if (
    url.pathname.match(/^\/api\/orders\/[^/]+$/)
    && req.method === "POST"
    && url.pathname !== "/api/orders/sync-shopify"
    && url.pathname !== "/api/orders/import"
  ) {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    const nextLineDetails = Array.isArray(body.lineDetails)
      ? body.lineDetails.map((item) => normalizeLineDetailRecord(item))
      : current.lineDetails || [];
    const nextBilling = normalizeBillingAddress(body.billing || current.billing || {}, {
      ...current,
      ...body,
    }, extractBillingMetadata(body.billing || current.billing || {}, body, current));
    const nextOrder = {
      ...current,
      orderNumber: String(body.orderNumber || current.orderNumber || ""),
      firstName: String(body.firstName || current.firstName || ""),
      lastName: String(body.lastName || current.lastName || ""),
      email: String(body.email || current.email || ""),
      phone: String(body.phone || current.phone || ""),
      city: String(body.city || current.city || ""),
      provinceCode: String(body.provinceCode || current.provinceCode || "").trim().toUpperCase(),
      province: String(current.province || ""),
      postalCode: String(body.postalCode || current.postalCode || "").trim(),
      countryCode: String(current.countryCode || "IT").trim().toUpperCase(),
      address: String(body.address || current.address || ""),
      total: String(body.total || current.total || "0"),
      totals: normalizeOrderTotals({
        grossTotal: body.total || current.totals?.grossTotal || current.total || 0,
        totalTax: body.taxTotal ?? current.totals?.taxTotal ?? 0,
        currentSubtotal: body.netSubtotal ?? current.totals?.netSubtotal ?? (current.total || 0),
        currency: body.currency || current.totals?.currency || "EUR",
        taxKnown: body.taxTotal != null ? true : current.totals?.taxKnown,
        netKnown: body.netSubtotal != null ? true : current.totals?.netKnown,
        lineDetails: nextLineDetails,
      }, body.total || current.total || 0),
      billing: nextBilling,
      note: String(body.note || current.note || ""),
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : current.lineItems || [],
      lineDetails: nextLineDetails,
    };
    nextOrder.operations = normalizeOperations(
      {
        ...nextOrder,
        operations: {
          ...(current.operations || {}),
          product: body.product || current.operations?.product || "",
          sqm: body.sqm || current.operations?.sqm || 0,
          surface: body.surface || current.operations?.surface || "terra",
          officeNote: body.officeNote || current.operations?.officeNote || "",
          materials: Array.isArray(body.materials) ? body.materials : current.operations?.materials || [],
          installation: {
            ...(current.operations?.installation || {}),
            required: body.installRequired != null ? Boolean(body.installRequired) : current.operations?.installation?.required,
          },
        },
      },
      store.jobs.find((job) => job.sourceOrderId === current.id) || null,
    );
    store.orders[orderIndex] = nextOrder;
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, nextOrder);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/attachments$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    const incomingAttachments = Array.isArray(body.attachments) ? body.attachments : [];
    const savedAttachments = [];
    for (const item of incomingAttachments) {
      savedAttachments.push(await storeAttachmentAsset(orderId, item));
    }
    store.orders[orderIndex] = {
      ...current,
      attachments: [...(current.attachments || []), ...savedAttachments],
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders[orderIndex]);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/attachments\/[^/]+\/file$/) && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const [, , resource, rawOrderId, , rawAttachmentId] = url.pathname.split("/");
    if (resource !== "orders") return sendJson(res, 404, { error: "not_found" });
    const orderId = decodeURIComponent(rawOrderId);
    const attachmentId = decodeURIComponent(rawAttachmentId);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return sendJson(res, 404, { error: "order_not_found" });
    const attachment = (order.attachments || []).find((item) => String(item.id || "") === attachmentId);
    if (!attachment) return sendJson(res, 404, { error: "attachment_not_found" });
    return streamAttachmentAsset(res, attachment);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/attachments\/\d+$/) && req.method === "DELETE") {
    const [, , resource, rawOrderId, , rawIndex] = url.pathname.split("/");
    if (resource !== "orders") return sendJson(res, 404, { error: "not_found" });
    const orderId = decodeURIComponent(rawOrderId);
    const attachmentIndex = Number(rawIndex);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    const attachments = Array.isArray(current.attachments) ? [...current.attachments] : [];
    if (attachmentIndex < 0 || attachmentIndex >= attachments.length) return sendJson(res, 404, { error: "attachment_not_found" });
    const [removedAttachment] = attachments.splice(attachmentIndex, 1);
    await removeAttachmentAsset(removedAttachment).catch((error) => {
      console.error("attachment_delete_failed", error);
    });
    store.orders[orderIndex] = {
      ...current,
      attachments,
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders[orderIndex]);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/operations$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    store.orders[orderIndex] = {
      ...current,
      operations: normalizeOperations(
        {
          ...current,
          operations: {
            ...current.operations,
            ...body,
            warehouse: {
              ...(current.operations?.warehouse || {}),
              ...(body.warehouse || {}),
              ddt: {
                ...(current.operations?.warehouse?.ddt || {}),
                ...(body.warehouse?.ddt || {}),
              },
            },
            installation: {
              ...(current.operations?.installation || {}),
              ...(body.installation || {}),
            },
          },
        },
        store.jobs.find((job) => job.sourceOrderId === current.id) || null,
      ),
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders[orderIndex]);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/create-ddt$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    const currentDdt = current.operations?.warehouse?.ddt || {};
    const createdAt = new Date().toISOString();
    const requestedNumber = String(body.number || "").trim();
    const number = requestedNumber || currentDdt.number || buildUniqueDdtNumber(store);
    store.orders[orderIndex] = {
      ...current,
      operations: normalizeOperations(
        {
          ...current,
          operations: {
            ...(current.operations || {}),
            warehouse: {
              ...(current.operations?.warehouse || {}),
              ddt: {
                ...currentDdt,
                number,
                palletLength: body.palletLength || currentDdt.palletLength || "",
                palletWidth: body.palletWidth || currentDdt.palletWidth || "",
                palletHeight: body.palletHeight || currentDdt.palletHeight || "",
                palletWeight: body.palletWeight || currentDdt.palletWeight || "",
                createdAt,
              },
            },
          },
        },
        store.jobs.find((job) => job.sourceOrderId === current.id) || null,
      ),
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders[orderIndex]);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/accounting$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    store.orders[orderIndex] = {
      ...current,
      paymentMethod: body.paymentMethod || current.paymentMethod || "",
      accounting: normalizeAccountingRecord({
        ...(current.accounting || {}),
        paymentMethod: body.paymentMethod || current.accounting?.paymentMethod || current.paymentMethod || "",
        depositPaid: body.depositPaid ?? current.accounting?.depositPaid ?? 0,
        balancePaid: body.balancePaid ?? current.accounting?.balancePaid ?? 0,
        payments: Array.isArray(body.payments) ? body.payments : (current.accounting?.payments || []),
        invoiceRequired: Boolean(body.invoiceRequired),
        invoiceIssued: Boolean(body.invoiceIssued),
        accountingNote: body.accountingNote ?? current.accounting?.accountingNote ?? "",
      }, body.paymentMethod || current.accounting?.paymentMethod || current.paymentMethod || "", current.billing || {}),
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders[orderIndex]);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/sync-shopify-fulfillment$/) && req.method === "POST") {
    if (requireOffice(res, currentUser)) return;
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const orderIndex = store.orders.findIndex((item) => item.id === orderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    const current = store.orders[orderIndex];
    if (!String(current.source || "").toLowerCase().startsWith("shopify")) {
      return sendJson(res, 400, { error: "order_not_synced_from_shopify" });
    }
    try {
      const trackingNumber = String(body.trackingNumber || current.operations?.warehouse?.trackingNumber || "").trim();
      const carrier = String(body.carrier || current.operations?.warehouse?.carrier || store.shopifySettings?.carrierName || "").trim();
      const result = await syncShopifyTrackingForOrder(store, current, { trackingNumber, carrier });
      const linkedJob = store.jobs.find((job) => job.sourceOrderId === current.id) || null;
      store.orders[orderIndex] = {
        ...current,
        shopifyNumericId: result.legacyResourceId || getNormalizedShopifyNumericId(current),
        shopifyGraphqlId: result.graphqlId || getNormalizedShopifyGraphqlId(current),
        fulfillmentStatus: result.alreadySynced
          ? current.fulfillmentStatus || "fulfilled"
          : "fulfilled",
        updatedAt: new Date().toISOString(),
        operations: normalizeOperations(
          {
            ...current,
            operations: {
              ...(current.operations || {}),
              warehouse: {
                ...(current.operations?.warehouse || {}),
                trackingNumber,
                carrier,
                readyToShip: true,
                carrierPassed: true,
                shipped: true,
              },
            },
          },
          linkedJob,
        ),
      };
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, {
        ok: true,
        alreadySynced: result.alreadySynced,
        fulfillmentId: result.fulfillmentId || "",
        order: store.orders[orderIndex],
      });
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "shopify_fulfillment_sync_failed" });
    }
  }

  if (url.pathname === "/api/orders/import" && req.method === "POST") {
    const body = await readBody(req);
    const orders = Array.isArray(body) ? body : Array.isArray(body.orders) ? body.orders : [];
    if (!orders.length) return sendJson(res, 400, { error: "invalid_payload" });

    const normalized = orders.map(normalizeOrderPayload);
    normalized.forEach((order) => {
      upsertOrderRecord(store, order);
    });
    store.orders = sortOrdersByRecency(store.orders);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, store.orders);
  }

  if (url.pathname === "/api/orders/sync-shopify" && req.method === "POST") {
    try {
      const orders = await syncOrdersFromShopify(store);
      orders.forEach((order) => {
        upsertOrderRecord(store, order);
      });
      store.orders = sortOrdersByRecency(store.orders);
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, store.orders);
    } catch (error) {
      store.shopifySettings.lastSyncAt = new Date().toISOString();
      store.shopifySettings.lastSyncStatus = "error";
      store.shopifySettings.lastSyncMessage = String(error.message || "shopify_sync_failed").slice(0, 500);
      await writeJson(STORE_PATH, store);
      return sendJson(res, 400, { error: error.message || "shopify_sync_failed" });
    }
  }

  if (url.pathname === "/api/webhooks/register-shopify" && req.method === "POST") {
    const { storeDomain, webhookBaseUrl } = store.shopifySettings || {};
    if (!webhookBaseUrl) return sendJson(res, 400, { error: "missing_webhook_base_url" });
    if (!storeDomain) return sendJson(res, 400, { error: "missing_shopify_credentials" });

    try {
      const endpoint = `${String(webhookBaseUrl).replace(/\/$/, "")}/api/webhooks/shopify/orders`;
      if (
        String(store.shopifySettings?.webhookEndpoint || "").trim() === endpoint
        && String(store.shopifySettings?.webhookSubscriptionId || "").trim()
      ) {
        return sendJson(res, 200, {
          endpoint,
          subscriptionId: String(store.shopifySettings.webhookSubscriptionId || "").trim(),
          reused: true,
        });
      }

      const accessToken = await getShopifyAccessToken(store);
      const mutation = `
        mutation RegisterOrdersCreateWebhook($topic: WebhookSubscriptionTopic!, $subscription: WebhookSubscriptionInput!) {
          webhookSubscriptionCreate(topic: $topic, webhookSubscription: $subscription) {
            userErrors {
              field
              message
            }
            webhookSubscription {
              id
              topic
              uri
            }
          }
        }
      `;
      const data = await queryShopifyAdmin(
        store,
        accessToken,
        mutation,
        {
          topic: "ORDERS_CREATE",
          subscription: {
            uri: endpoint,
            format: "JSON",
          },
        },
        "webhook_register_failed",
      );
      const created = data?.webhookSubscriptionCreate;
      if (created?.userErrors?.length) {
        return sendJson(res, 400, { error: created.userErrors[0].message || "webhook_register_failed" });
      }

      store.shopifySettings.webhookEndpoint = endpoint;
      store.shopifySettings.webhookSubscriptionId = created?.webhookSubscription?.id || "";
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, { endpoint, subscriptionId: store.shopifySettings.webhookSubscriptionId });
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "webhook_register_failed" });
    }
  }

  if (url.pathname === "/api/orders/demo" && req.method === "POST") {
    return sendJson(res, 200, store.orders);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/create-job$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return sendJson(res, 404, { error: "order_not_found" });
    const existing = order.convertedJobId ? store.jobs.find((job) => job.id === order.convertedJobId) : null;
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { job: existing, order });
  }

  if (url.pathname === "/api/settings/shopify" && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    return sendJson(res, 200, serializeShopifySettings(store.shopifySettings));
  }

  if (url.pathname === "/api/settings/shopify" && req.method === "POST") {
    if (requireOffice(res, currentUser)) return;
    const body = await readBody(req);
    const baseUrl = getRequestBaseUrl(req);
    store.shopifySettings = {
      storeDomain: body.storeDomain || "",
      clientId: body.clientId || "",
      clientSecret: body.clientSecret || store.shopifySettings?.clientSecret || "",
      adminAccessToken: body.adminAccessToken || store.shopifySettings?.adminAccessToken || "",
      installedShop: store.shopifySettings?.installedShop || "",
      tokenScope: store.shopifySettings?.tokenScope || "",
      tokenUpdatedAt: store.shopifySettings?.tokenUpdatedAt || "",
      lastSyncAt: store.shopifySettings?.lastSyncAt || "",
      lastSyncStatus: store.shopifySettings?.lastSyncStatus || "",
      lastSyncMessage: store.shopifySettings?.lastSyncMessage || "",
      locationName: body.locationName || "",
      carrierName: body.carrierName || "",
      shippingRateMode: body.shippingRateMode === "manual-weight" ? "manual-weight" : "oneexpress-auto",
      shippingTariffProfile: body.shippingTariffProfile === "gold" ? "gold" : "silver",
      volumetricDivisor: body.volumetricDivisor || "5000",
      rate80: body.rate80 || "",
      rate150: body.rate150 || "",
      rate300: body.rate300 || "",
      rate500: body.rate500 || "",
      rate1000: body.rate1000 || "",
      extraKgRate: body.extraKgRate || "",
      webhookBaseUrl: body.webhookBaseUrl || store.shopifySettings?.webhookBaseUrl || baseUrl,
      webhookEndpoint: store.shopifySettings?.webhookEndpoint || "",
      webhookSubscriptionId: store.shopifySettings?.webhookSubscriptionId || "",
    };
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, serializeShopifySettings(store.shopifySettings));
  }

  if (url.pathname === "/api/settings/shopify/validate" && req.method === "POST") {
    if (requireOffice(res, currentUser)) return;
    try {
      const validation = await validateShopifyConnection(store);
      store.shopifySettings.installedShop = validation.shopDomain || store.shopifySettings.installedShop || "";
      store.shopifySettings.tokenScope = validation.scopes.join(",");
      store.shopifySettings.tokenUpdatedAt = new Date().toISOString();
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, {
        ok: true,
        shopName: validation.shopName,
        shopDomain: validation.shopDomain,
        scopes: validation.scopes,
        settings: serializeShopifySettings(store.shopifySettings),
      });
    } catch (error) {
      return sendJson(res, 400, { error: error.message || "shopify_validation_failed" });
    }
  }

  if (url.pathname === "/api/reset-demo" && req.method === "POST") {
    const fresh = await readJson(STORE_PATH, store);
    return sendJson(res, 200, fresh);
  }

  return sendJson(res, 404, { error: "not_found" });
}

const server = createServer(async (req, res) => {
  const rawRequestPath = String(req.url || "/").split("?")[0] || "/";
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      const method = String(req.method || "GET").toUpperCase();
      const readOnlyRequest = method === "GET" || method === "HEAD" || method === "OPTIONS";
      const shouldLockState = USE_POSTGRES && !readOnlyRequest && url.pathname !== "/api/healthz";
      if (!shouldLockState) {
        return await handleApi(req, res, url);
      }
      try {
        return await withApiStateLock(() => handleApi(req, res, url));
      } catch (error) {
        if (error?.code === "state_lock_timeout") {
          return sendJson(res, 503, {
            error: "busy",
            message: "Aggiornamento in corso, riprova tra qualche secondo.",
          });
        }
        throw error;
      }
    }

    let requestedPath = rawRequestPath === "/" ? "/index.html" : rawRequestPath;
    try {
      requestedPath = decodeURIComponent(requestedPath);
    } catch {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Bad request");
      return;
    }
    const filePath = resolve(ROOT, `.${requestedPath}`);
    const rootPrefix = ROOT.endsWith(sep) ? ROOT : `${ROOT}${sep}`;
    if (filePath !== ROOT && !filePath.startsWith(rootPrefix)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const content = await readFile(filePath);
    const ext = extname(filePath);
    res.writeHead(200, getStaticHeaders(MIME_TYPES[ext] || "application/octet-stream"));
    res.end(content);
  } catch (error) {
    if (url.pathname.startsWith("/api/")) {
      return sendJson(res, 500, { error: "server_error", message: error.message });
    }

    try {
      const content = await readFile(join(ROOT, "index.html"));
      res.writeHead(200, getStaticHeaders("text/html; charset=utf-8"));
      res.end(content);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Vertex Ops backend running on http://${HOST}:${PORT}`);
});
