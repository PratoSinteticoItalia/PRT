import { createServer } from "node:http";
import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { extname, dirname, join, resolve, sep } from "node:path";
import { createHash, createHmac, createSign, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { startImapWorker, getImapWorkerStatus, isImapWorkerEnabled, hasImapWorkerConfig, getImapWorkerConfig } from "./imap-worker.js";
import { reconcileShadowLeads, buildLeadFingerprint, fingerprintIsComplete, findMatchingSalesRequest } from "./lead-fingerprint.mjs";
import { generateWorkReportPdf } from "./lib/work-report-pdf.js";
import webPush from "web-push";

const PORT = Number(process.env.PORT || 4178);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = dirname(fileURLToPath(import.meta.url));
const FALLBACK_DATA_DIR = resolve(join(ROOT, "data"));
let DATA_DIR = resolve(process.env.DATA_DIR || FALLBACK_DATA_DIR);
let STORE_PATH = join(DATA_DIR, "store.json");
let SESSION_PATH = join(DATA_DIR, "session.json");
let BACKUP_DIR = join(DATA_DIR, "backups");
let LOCAL_ATTACHMENTS_DIR = join(DATA_DIR, "attachments");
const salesRequestSheetColumnsCache = new Map();
const pendingSalesRequestSheetSyncRecords = new Map();
let pendingSalesRequestSheetSyncConfig = null;
let salesRequestSheetSyncTimer = null;
let salesRequestSheetSyncInFlight = false;
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
const GOOGLE_FETCH_TIMEOUT_MS = 10_000;
const SALES_REQUEST_SHEET_SYNC_DEBOUNCE_MS = Math.max(50, Number(process.env.SALES_REQUEST_SHEET_SYNC_DEBOUNCE_MS || 200));
const SALES_REQUEST_SHEET_COLUMNS_CACHE_TTL_MS = Math.max(30_000, Number(process.env.SALES_REQUEST_SHEET_COLUMNS_CACHE_TTL_MS || 1000 * 60 * 10));
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
const WHATSAPP_GRAPH_TIMEOUT_MS = Math.max(10_000, Number(process.env.WHATSAPP_GRAPH_TIMEOUT_MS || 30_000));
const SALES_REQUEST_AUTOMATION_MODE = String(process.env.SALES_REQUEST_AUTOMATION_MODE || "none").trim().toLowerCase();
const SALES_REQUEST_EMAIL_PROVIDER = String(process.env.SALES_REQUEST_EMAIL_PROVIDER || "resend").trim().toLowerCase();
const SALES_REQUEST_EMAIL_FROM = String(process.env.SALES_REQUEST_EMAIL_FROM || "").trim();
const SALES_REQUEST_EMAIL_REPLY_TO = cleanEmail(process.env.SALES_REQUEST_EMAIL_REPLY_TO || "");
const SALES_REQUEST_EMAIL_SUBJECT_PREFIX = String(process.env.SALES_REQUEST_EMAIL_SUBJECT_PREFIX || "Prato Sintetico Italia").trim();
const SALES_REQUEST_EMAIL_TIMEOUT_MS = Math.max(5_000, Number(process.env.SALES_REQUEST_EMAIL_TIMEOUT_MS || 10_000));
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();
const META_MARKETING_ACCESS_TOKEN = String(process.env.META_MARKETING_ACCESS_TOKEN || WHATSAPP_DEFAULT_ACCESS_TOKEN).trim();
const META_PAGE_ID = String(process.env.META_PAGE_ID || "").trim();
const META_INSTAGRAM_BUSINESS_ACCOUNT_ID = String(process.env.META_INSTAGRAM_BUSINESS_ACCOUNT_ID || "").trim();
const VAPID_PUBLIC_KEY = String(process.env.VAPID_PUBLIC_KEY || "").trim();
const VAPID_PRIVATE_KEY = String(process.env.VAPID_PRIVATE_KEY || "").trim();
const VAPID_SUBJECT = String(process.env.VAPID_SUBJECT || "mailto:admin@pratosintetico.it").trim();

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
// I webhook Shopify gestiscono gli aggiornamenti in tempo reale; la sync periodica è solo di sicurezza.
// Valore precedente: 1000 * 60 * 5 (5 minuti)
const SHOPIFY_AUTO_SYNC_INTERVAL_MS = 1000 * 60 * 30;
const LOGIN_MAX_ATTEMPTS = 20;
const SHOPIFY_FETCH_TIMEOUT_MS = 10_000;
const SHOPIFY_MAX_RETRIES = 2;
const CONFIGURED_MAX_JSON_BODY_BYTES = Number(process.env.MAX_JSON_BODY_BYTES || 25 * 1024 * 1024);
const MAX_JSON_BODY_BYTES = Number.isFinite(CONFIGURED_MAX_JSON_BODY_BYTES)
  ? Math.max(1024 * 1024, CONFIGURED_MAX_JSON_BODY_BYTES)
  : 25 * 1024 * 1024;
const IS_PUBLIC_DEPLOY = Boolean(process.env.RENDER || process.env.NODE_ENV === "production");
const ALLOW_DEMO_FALLBACK = process.env.ALLOW_DEMO_FALLBACK === "true" || !IS_PUBLIC_DEPLOY;
const PASSWORD_MIN_LENGTH = 12;
const DEFAULT_CREW_DAILY_CAPACITY = 120;
const BOOTSTRAP_OFFICE_EMAIL = String(process.env.BOOTSTRAP_OFFICE_EMAIL || "office@vertex.local").trim().toLowerCase();
const BOOTSTRAP_OFFICE_PASSWORD = String(process.env.BOOTSTRAP_OFFICE_PASSWORD || "");
const API_STATE_LOCK_KEY = 41051721;
const API_STATE_LOCK_TIMEOUT_MS = 60_000;
const API_STATE_LOCK_POLL_MS = 50;
const STORE_BACKUP_MIN_INTERVAL_MS = 1000 * 60 * 2;
const loginAttempts = new Map();
let dbBootstrapPromise = null;
let pgPool = null;
let r2ClientPromise = null;
let runtimeStoreRevision = "";
let lastStoreBackupSnapshotAt = 0;
let storeBackupQueue = Promise.resolve();
let postgresMirrorWriteQueue = Promise.resolve();
// In-memory store cache: evita un round-trip Postgres su ogni lettura API
let storeMemCache = null;
let pgListenerClient = null; // connessione dedicata per LISTEN/NOTIFY

// Cache dei file statici pre-compressi all'avvio: evita readFile + gzipSync su ogni richiesta
const staticFileCache = new Map(); // path → { raw, gzipped, mimeType }

async function preloadStaticFiles() {
  const targets = [
    "index.html",
    "app.js",
    "styles.css",
    "sw.js",
    "manifest.webmanifest",
    "garden-planner-page.js",
    "sales-suite/shell.css",
  ];
  await Promise.allSettled(targets.map(async (rel) => {
    try {
      const filePath = join(ROOT, rel);
      const ext = extname(rel);
      let raw;
      // Se esiste una versione pre-minificata (prodotta dal build step), usala
      if (ext === ".js" || ext === ".css") {
        const minRel = rel.replace(/\.(js|css)$/, ".min.$1");
        const minPath = join(ROOT, minRel);
        try {
          raw = await readFile(minPath);
          console.log(`[static-cache] usando versione minificata: ${minRel}`);
        } catch {
          raw = await readFile(filePath);
        }
      } else {
        raw = await readFile(filePath);
      }
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";
      const isCompressible = /^(text\/|application\/(javascript|json|xml)|image\/svg)/.test(mimeType);
      const gzipped = isCompressible ? gzipSync(raw) : null;
      staticFileCache.set(`/${rel}`, { raw, gzipped, mimeType });
    } catch {
      // file opzionale — ignora se mancante
    }
  }));
  console.log(`[static-cache] pre-caricati ${staticFileCache.size} file statici`);
}
let processApiWriteQueue = Promise.resolve();
let processSessionWriteQueue = Promise.resolve();
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

// ── Login rate-limit cross-istanza (PG) ─────────────────────────────────────
// Mantiene doppio strato: PG per consistenza multi-istanza + Map locale come
// fallback immediato se il DB è irraggiungibile (evita 500 su DB flap).

async function isLoginBlockedAsync(req, email) {
  if (!USE_POSTGRES) return isLoginBlocked(req, email);
  try {
    const pool = await getPgPool();
    const key = getLoginAttemptKey(req, email);
    const result = await pool.query(
      "SELECT attempts FROM login_rate_limits WHERE key=$1 AND reset_at > NOW()",
      [key],
    );
    const dbAttempts = parseInt(result.rows[0]?.attempts || "0", 10);
    if (dbAttempts >= LOGIN_MAX_ATTEMPTS) return true;
    // Controlla anche la cache locale come salvaguardia (es. DB lento)
    return isLoginBlocked(req, email);
  } catch {
    return isLoginBlocked(req, email); // fallback in-process
  }
}

async function recordFailedLoginAsync(req, email) {
  recordFailedLogin(req, email); // aggiorna subito la cache locale
  if (!USE_POSTGRES) return;
  try {
    const pool = await getPgPool();
    const key = getLoginAttemptKey(req, email);
    // UPSERT con logica finestra temporale:
    //   - se reset_at è scaduto → ricomincia da 1 con nuova finestra
    //   - altrimenti → incrementa dentro la finestra esistente
    await pool.query(
      `INSERT INTO login_rate_limits (key, attempts, reset_at)
       VALUES ($1, 1, NOW() + ($2 || ' milliseconds')::interval)
       ON CONFLICT (key) DO UPDATE SET
         attempts = CASE
           WHEN login_rate_limits.reset_at <= NOW() THEN 1
           ELSE login_rate_limits.attempts + 1
         END,
         reset_at = CASE
           WHEN login_rate_limits.reset_at <= NOW() THEN NOW() + ($2 || ' milliseconds')::interval
           ELSE login_rate_limits.reset_at
         END`,
      [key, String(LOGIN_WINDOW_MS)],
    );
  } catch {
    // fallback già aggiornato nella Map locale sopra
  }
}

async function clearFailedLoginAsync(req, email) {
  clearFailedLogin(req, email); // aggiorna subito la cache locale
  if (!USE_POSTGRES) return;
  try {
    const pool = await getPgPool();
    const key = getLoginAttemptKey(req, email);
    await pool.query("DELETE FROM login_rate_limits WHERE key=$1", [key]);
  } catch {}
}

function setDataDir(nextDir) {
  DATA_DIR = resolve(nextDir);
  STORE_PATH = join(DATA_DIR, "store.json");
  SESSION_PATH = join(DATA_DIR, "session.json");
  BACKUP_DIR = join(DATA_DIR, "backups");
  LOCAL_ATTACHMENTS_DIR = join(DATA_DIR, "attachments");
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
    mkdirSync(LOCAL_ATTACHMENTS_DIR, { recursive: true });
    const probePath = join(DATA_DIR, ".write-test");
    writeFileSync(probePath, "ok", "utf8");
    unlinkSync(probePath);
  } catch {
    if (DATA_DIR !== FALLBACK_DATA_DIR) {
      setDataDir(FALLBACK_DATA_DIR);
      mkdirSync(DATA_DIR, { recursive: true });
      mkdirSync(LOCAL_ATTACHMENTS_DIR, { recursive: true });
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

function queueStoreBackup(serialized) {
  const snapshot = String(serialized || "");
  storeBackupQueue = storeBackupQueue.catch(() => {}).then(async () => {
    try {
      await mkdir(BACKUP_DIR, { recursive: true });
      await writeFile(join(BACKUP_DIR, "store-latest.json"), snapshot, "utf8");
      const now = Date.now();
      const shouldCreateTimestampSnapshot = !lastStoreBackupSnapshotAt
        || (now - lastStoreBackupSnapshotAt) >= STORE_BACKUP_MIN_INTERVAL_MS;
      if (!shouldCreateTimestampSnapshot) return;
      lastStoreBackupSnapshotAt = now;
      const timestamp = new Date(now).toISOString().replace(/[:.]/g, "-");
      await writeFile(join(BACKUP_DIR, `store-${timestamp}.json`), snapshot, "utf8");
      const snapshots = (await readdir(BACKUP_DIR))
        .filter((file) => /^store-\d{4}-\d{2}-\d{2}T/.test(file))
        .sort()
        .reverse();
      await Promise.all(snapshots.slice(30).map(async (file) => {
        try {
          await unlink(join(BACKUP_DIR, file));
        } catch {}
      }));
    } catch (error) {
      console.error("store_backup_failed", error);
    }
  });
}

async function writeLocalJsonSerialized(path, serialized) {
  const resolvedPath = resolve(path);
  const tempPath = `${resolvedPath}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tempPath, serialized, "utf8");
  await rename(tempPath, resolvedPath);
  if (resolve(path) === resolve(STORE_PATH)) {
    queueStoreBackup(serialized);
  }
}

async function writeLocalJson(path, value) {
  return writeLocalJsonSerialized(path, JSON.stringify(value, null, 2));
}

function queuePostgresMirrorWrite(path, value) {
  const serialized = JSON.stringify(value, null, 2);
  postgresMirrorWriteQueue = postgresMirrorWriteQueue
    .catch(() => {})
    .then(() => writeLocalJsonSerialized(path, serialized))
    .catch((error) => {
      console.error("store_mirror_write_failed", error);
    });
}

async function getPgPool() {
  if (!USE_POSTGRES) return null;
  if (pgPool) return pgPool;
  const { Pool } = await import("pg");
  pgPool = new Pool({
    connectionString: DATABASE_URL,
    max: 4,
    // Render.com (and most managed PG hosts) kill idle TCP connections after
    // ~20 s. If the pool holds a connection longer than that, the next use
    // emits an unhandled 'error' on the Client and crashes Node.  Keep the
    // idle timeout well below the host's kill window.
    idleTimeoutMillis: 8_000,
    connectionTimeoutMillis: 10_000,
  });
  // Pool-level error handler: covers idle-client TCP resets so they don't
  // bubble up as unhandled process exceptions.
  pgPool.on("error", (err) => {
    console.error("[pg-pool] client error (handled):", err?.message || err);
  });
  return pgPool;
}

/**
 * Avvia una connessione PG dedicata in ascolto su 'psi_ops_store_changed'.
 * Quando un'altra istanza scrive il documento store, questa connessione riceve
 * la notifica, invalida la cache locale e fa broadcast SSE ai propri client.
 * Riconnette automaticamente in caso di errore.
 */
async function setupPgListener() {
  if (!USE_POSTGRES) return;
  const { Client } = await import("pg");
  const tryConnect = async () => {
    try {
      const client = new Client({ connectionString: DATABASE_URL, application_name: "psi-ops-listener" });
      await client.connect();
      await client.query("LISTEN psi_ops_store_changed");
      await client.query("LISTEN psi_ops_cache_invalidate");
      client.on("notification", (msg) => {
        if (msg.channel === "psi_ops_store_changed") {
          // Invalida blob-store cache + propaga revisione a tutti i client SSE
          const revision = String(msg.payload || "").trim();
          storeMemCache = null;
          if (revision) broadcastStoreRevision(revision);
          console.log("[pg-listen] store invalidated revision:", revision.slice(0, 16));
        } else if (msg.channel === "psi_ops_cache_invalidate") {
          // Invalida la cache relazionale dell'entità specificata
          const entity = String(msg.payload || "").trim();
          switch (entity) {
            case "orders":         invalidateOrdersDbCache();         break;
            case "inventory":      invalidateInventoryDbCache();      break;
            case "jobs":           invalidateJobsDbCache();           break;
            case "sales_requests": invalidateSalesRequestsDbCache();  break;
            default:
              // Fallback: invalida tutto se il payload è sconosciuto
              invalidateOrdersDbCache();
              invalidateInventoryDbCache();
              invalidateJobsDbCache();
              invalidateSalesRequestsDbCache();
          }
          console.log("[pg-listen] entity cache invalidated:", entity);
        }
      });
      client.on("error", (err) => {
        console.error("[pg-listen] error:", err?.message);
        pgListenerClient = null;
        setTimeout(tryConnect, 5_000);
      });
      client.on("end", () => {
        pgListenerClient = null;
        setTimeout(tryConnect, 5_000);
      });
      pgListenerClient = client;
      console.log("[pg-listen] ready — listening on psi_ops_store_changed + psi_ops_cache_invalidate");
    } catch (err) {
      console.error("[pg-listen] connect failed:", err?.message);
      setTimeout(tryConnect, 10_000);
    }
  };
  tryConnect();
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

// Set che traccia quali blob-only salesRequests sono già stati backfillati in SQL
// (evita upsertSalesRequestToDb a ogni /api/session per gli stessi record)
const _backfilledSalesRequestIds = new Set();

// Backfill proattivo requestedHeight: eseguito una sola volta a caldo dopo il primo /api/session
// Trova tutti i record SQL con requested_height vuoto e li aggiorna dal blob su disco
let _heightBackfillDone = false;
async function backfillSalesRequestHeightToDb() {
  if (_heightBackfillDone || !USE_POSTGRES) return;
  _heightBackfillDone = true;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const { rows } = await pool.query(
      "SELECT id FROM sales_requests WHERE requested_height IS NULL OR requested_height = ''"
    );
    if (!rows.length) return;
    const rawStore = await readJson(STORE_PATH, {});
    const blobById = new Map((rawStore.salesRequests || []).map((r) => [String(r.id), r]));
    let count = 0;
    for (const { id } of rows) {
      const blob = blobById.get(id);
      if (!blob?.requestedHeight) continue;
      await pool.query(
        "UPDATE sales_requests SET requested_height=$1, updated_at=NOW() WHERE id=$2 AND (requested_height IS NULL OR requested_height='')",
        [String(blob.requestedHeight), id]
      );
      count++;
    }
    if (count) {
      invalidateSalesRequestsDbCache();
      console.log(`[db] backfill requestedHeight: ${count} record aggiornati`);
    }
  } catch (err) {
    _heightBackfillDone = false; // permetti retry al prossimo avvio
    console.warn("[db] backfillSalesRequestHeightToDb:", err?.message);
  }
}

// Backfill one-shot: corregge created_at di tutti i record che hanno la data
// di import bulk (≥ 2026-06-02) usando i valori originali dal blob store.
let _createdAtBackfillDone = false;
async function backfillSalesRequestCreatedAtToDb() {
  if (_createdAtBackfillDone || !USE_POSTGRES) return;
  _createdAtBackfillDone = true;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    // Trova tutti i record con created_at nella finestra di import (oggi - 3 gg)
    const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { rows } = await pool.query(
      "SELECT id FROM sales_requests WHERE created_at >= $1", [cutoff]
    );
    if (!rows.length) return;
    const rawStore = await readJson(STORE_PATH, {});
    const blobById = new Map((rawStore.salesRequests || []).map((r) => [String(r.id), r]));
    let count = 0;
    for (const { id } of rows) {
      const blob = blobById.get(id);
      if (!blob?.createdAt) continue;
      let blobTs;
      try { blobTs = new Date(blob.createdAt).toISOString(); } catch { continue; }
      // Aggiorna solo se il blob ha una data precedente (quella corretta)
      const result = await pool.query(
        "UPDATE sales_requests SET created_at=$1 WHERE id=$2 AND created_at > $1",
        [blobTs, id]
      );
      if (result.rowCount > 0) count++;
    }
    if (count) {
      invalidateSalesRequestsDbCache();
      console.log(`[db] backfill created_at: ${count} record corretti`);
    }
  } catch (err) {
    _createdAtBackfillDone = false; // consenti retry al prossimo avvio
    console.warn("[db] backfillSalesRequestCreatedAtToDb:", err?.message);
  }
}

let relationalSchemaBootstrapPromise = null;
async function ensureRelationalSchema() {
  if (!USE_POSTGRES) return;
  if (relationalSchemaBootstrapPromise) return relationalSchemaBootstrapPromise;
  relationalSchemaBootstrapPromise = (async () => {
    await ensureDatabaseStorage();
    const pool = await getPgPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        shopify_numeric_id TEXT, shopify_graphql_id TEXT, order_number TEXT,
        first_name TEXT, last_name TEXT, email TEXT, phone TEXT,
        city TEXT, address TEXT, postal_code TEXT, province_code TEXT, province TEXT, country_code TEXT,
        financial_status TEXT, fulfillment_status TEXT, payment_method TEXT,
        source TEXT, note TEXT, total TEXT,
        totals JSONB DEFAULT '{}', billing JSONB DEFAULT '{}',
        warehouse JSONB DEFAULT '{}', installation JSONB DEFAULT '{}', accounting JSONB DEFAULT '{}',
        line_items JSONB DEFAULT '[]', line_details JSONB DEFAULT '[]',
        attachments JSONB DEFAULT '[]', converted_job_id TEXT, shopify_raw JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS inventory_items (
        id TEXT PRIMARY KEY, product TEXT, family TEXT,
        piece_type TEXT, piece_state TEXT, width NUMERIC, length NUMERIC, units TEXT, label TEXT,
        allocated_to_order_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        first_name TEXT, last_name TEXT, city TEXT, phone TEXT, email TEXT, address TEXT,
        job_type TEXT, surface TEXT, product TEXT, sqm NUMERIC,
        install_date TEXT, install_time TEXT, crew TEXT,
        priority TEXT, warehouse_status TEXT, install_status TEXT,
        materials JSONB DEFAULT '[]', notes TEXT, attachments JSONB DEFAULT '[]',
        source_order_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS sales_requests (
        id TEXT PRIMARY KEY,
        first_name TEXT, last_name TEXT, email TEXT, phone TEXT,
        city TEXT, address TEXT, postal_code TEXT, province_code TEXT, province TEXT, country_code TEXT,
        company TEXT, job_type TEXT, surface TEXT, sqm NUMERIC, note TEXT,
        status TEXT, assignment TEXT, first_contact_by TEXT, first_contact_at TIMESTAMPTZ,
        quoted_at TIMESTAMPTZ,
        source TEXT, source_row_number INTEGER, attachments JSONB DEFAULT '[]', whatsapp_thread_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY, value JSONB NOT NULL DEFAULT '{}', updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS catalog_items (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        category TEXT NOT NULL, value TEXT NOT NULL, label TEXT,
        position INTEGER DEFAULT 0, metadata JSONB DEFAULT '{}', active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE (category, value)
      );
      CREATE TABLE IF NOT EXISTS audit_log (
        id BIGSERIAL PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
        user_id TEXT, action TEXT NOT NULL, diff JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
      );
      -- Tabella shadow per il worker IMAP (Fase 1 della migrazione lead).
      -- Riceve ogni email letta dalla casella contatti@ in modalita' read-only,
      -- senza ancora promuoverla a sales_request. Permette validazione 1-2
      -- settimane prima del switch produttivo.
      -- Chiave di dedupe: imap_message_id (header Message-ID del protocollo email).
      CREATE TABLE IF NOT EXISTS incoming_leads_shadow (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        imap_message_id TEXT UNIQUE NOT NULL,
        imap_uid BIGINT,
        imap_mailbox TEXT,
        from_email TEXT,
        from_name TEXT,
        subject TEXT,
        received_at TIMESTAMPTZ,
        raw_body_preview TEXT,
        parsed_payload JSONB DEFAULT '{}',
        parser_version TEXT DEFAULT 'v0',
        parse_status TEXT DEFAULT 'pending',
        parse_errors JSONB DEFAULT '[]',
        promoted_to_sales_request_id TEXT,
        promoted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS operations_json JSONB DEFAULT '{}';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_token_created_at TIMESTAMPTZ;
      CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_token_idx ON orders (tracking_token) WHERE tracking_token IS NOT NULL;
      ALTER TABLE sales_requests ADD COLUMN IF NOT EXISTS requested_height TEXT DEFAULT '';
      ALTER TABLE sales_requests ADD COLUMN IF NOT EXISTS quoted_at TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS orders_shopify_id_idx       ON orders (shopify_numeric_id);
      CREATE INDEX IF NOT EXISTS orders_updated_at_idx       ON orders (updated_at DESC);
      CREATE INDEX IF NOT EXISTS orders_financial_status_idx ON orders (financial_status);
      CREATE INDEX IF NOT EXISTS inventory_state_idx         ON inventory_items (piece_state);
      CREATE INDEX IF NOT EXISTS inventory_order_idx         ON inventory_items (allocated_to_order_id);
      CREATE INDEX IF NOT EXISTS sales_requests_status_idx      ON sales_requests (status);
      CREATE INDEX IF NOT EXISTS sales_requests_phone_idx       ON sales_requests (phone);
      CREATE INDEX IF NOT EXISTS sales_requests_assignment_idx  ON sales_requests (assignment);
      CREATE INDEX IF NOT EXISTS sales_requests_source_idx      ON sales_requests (source);
      CREATE INDEX IF NOT EXISTS sales_requests_updated_at_idx  ON sales_requests (updated_at DESC);
      ALTER TABLE sales_requests ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
      ALTER TABLE sales_requests ADD COLUMN IF NOT EXISTS surname TEXT DEFAULT '';
      CREATE INDEX IF NOT EXISTS sales_requests_fts_idx ON sales_requests
        USING gin(to_tsvector('italian',
          coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' ||
          coalesce(phone,'') || ' ' || coalesce(city,'') || ' ' ||
          coalesce(email,'') || ' ' || coalesce(note,'') || ' ' ||
          coalesce(company,'')
        ));
      CREATE INDEX IF NOT EXISTS sales_requests_created_at_idx ON sales_requests (created_at DESC);
      CREATE INDEX IF NOT EXISTS orders_fulfillment_idx         ON orders (fulfillment_status);
      CREATE INDEX IF NOT EXISTS audit_log_entity_idx           ON audit_log (entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS audit_log_created_idx          ON audit_log (created_at DESC);
      CREATE INDEX IF NOT EXISTS incoming_leads_shadow_uid_idx     ON incoming_leads_shadow (imap_uid);
      CREATE INDEX IF NOT EXISTS incoming_leads_shadow_recv_idx    ON incoming_leads_shadow (received_at DESC);
      CREATE INDEX IF NOT EXISTS incoming_leads_shadow_status_idx  ON incoming_leads_shadow (parse_status);
      CREATE INDEX IF NOT EXISTS incoming_leads_shadow_promoted_idx ON incoming_leads_shadow (promoted_to_sales_request_id);
      -- ─────────────────────────────────────────────────────────────────────
      -- Rate limiting login cross-istanza: sostituisce la Map in-process.
      -- Chiave: "<ip>::<email>"; reset_at definisce la finestra temporale.
      -- Cleanup automatico: le righe scadute vengono rimosse al prossimo
      -- recordFailedLoginAsync via INSERT ON CONFLICT + CASE sul reset_at.
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS login_rate_limits (
        key TEXT PRIMARY KEY,
        attempts INTEGER NOT NULL DEFAULT 0,
        reset_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS login_rate_limits_reset_idx ON login_rate_limits (reset_at);
      -- ─────────────────────────────────────────────────────────────────────
      -- Outbox persistente per job critici (Step 1 — Persistent Queue).
      -- Sostituisce i .catch(()=>{}) silenziosi su upsert sales_request,
      -- audit_log e simili con retry tracciato + dead letter dopo N tentativi.
      -- Stati: pending (in attesa) → processing (in volo) → done | dead.
      -- next_attempt_at gestisce backoff esponenziale.
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS outbox (
        id BIGSERIAL PRIMARY KEY,
        job_type TEXT NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        done_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS outbox_ready_idx     ON outbox (next_attempt_at) WHERE status = 'pending';
      CREATE INDEX IF NOT EXISTS outbox_dead_idx      ON outbox (created_at DESC) WHERE status = 'dead';
      CREATE INDEX IF NOT EXISTS outbox_type_status_idx ON outbox (job_type, status);
      -- ─────────────────────────────────────────────────────────────────────
      -- Verbali fine cantiere (MVP) — documenti firmati dal cliente che il
      -- posatore genera a fine lavoro. Allegati alla scheda ordine/cliente,
      -- archiviati in R2 come PDF + JSONB del payload originale per audit.
      -- Status flow: draft → signed (firmato) → archived (PDF generato).
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS work_completion_reports (
        id TEXT PRIMARY KEY,                       -- es. "VL-2026-0042"
        order_id TEXT,                             -- FK soft → orders.id (può essere null per lavori senza ordine Shopify)
        installation_id TEXT,                      -- FK soft → jobs.id
        crew_user_id TEXT NOT NULL,                -- chi ha compilato (users.id)
        crew_name TEXT NOT NULL,                   -- snapshot ("Alpha")
        operators JSONB NOT NULL DEFAULT '[]',     -- ["Mario Rossi", ...]
        customer_name TEXT NOT NULL,
        customer_email TEXT,                       -- snapshot per email automatica
        site_address TEXT,
        executed_sqm NUMERIC,                      -- mq effettivamente posati
        product_model TEXT,                        -- modello prato installato
        work_hours_start TIMESTAMPTZ,              -- inizio lavoro
        work_hours_end TIMESTAMPTZ,                -- fine lavoro
        notes TEXT,                                -- descrizione lavorazioni eseguite
        extras JSONB NOT NULL DEFAULT '[]',        -- [{ description, amount_eur }, ...]
        photos JSONB NOT NULL DEFAULT '[]',        -- [{ r2_key, w, h, taken_at }, ...]
        liability_text TEXT,                       -- testo "scarico responsabilità" snapshot
        customer_signature_r2_key TEXT,            -- PNG firma cliente
        crew_signature_r2_key TEXT,                -- PNG firma posatore
        signed_at TIMESTAMPTZ,                     -- timestamp firma (status → signed)
        document_pdf_r2_key TEXT,                  -- PDF finale (status → archived)
        document_pdf_sha256 TEXT,                  -- hash per immutabilità
        status TEXT NOT NULL DEFAULT 'draft',      -- draft | signed | archived
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        archived_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS work_completion_reports_order_idx  ON work_completion_reports (order_id);
      CREATE INDEX IF NOT EXISTS work_completion_reports_crew_idx   ON work_completion_reports (crew_user_id);
      CREATE INDEX IF NOT EXISTS work_completion_reports_status_idx ON work_completion_reports (status);
      CREATE INDEX IF NOT EXISTS work_completion_reports_created_idx ON work_completion_reports (created_at DESC);

      -- ─────────────────────────────────────────────────────────────────────
      -- Sistema Presenze (timesheet) — dipendenti aziendali (warehouse, seller,
      -- office). Crew esclusi (sono subappaltatori, non dipendenti).
      --
      -- time_entries: log atomico di ogni clock-in/out con fingerprint
      --   (IP, user-agent, device-id) per anti-frode passivo.
      -- time_shifts: vista aggregata per giornata, calcolata da time_entries.
      --   Una riga per (user_id, shift_date). worked_minutes calcolato.
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS time_entries (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        entry_type TEXT NOT NULL,                  -- 'clock_in' | 'clock_out'
        source TEXT NOT NULL DEFAULT 'manual',     -- 'manual' | 'auto_login' | 'auto_idle' | 'rectified'
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        notes TEXT,
        ip_address TEXT,
        user_agent TEXT,
        device_id TEXT,                            -- UUID generato client-side al primo accesso
        network_tag TEXT,                          -- 'in_office' | 'off_network' | NULL (legacy, sostituito da geo_*)
        lat NUMERIC,                               -- opt-in geolocation al clock-in/out
        lng NUMERIC,
        gps_accuracy_m INTEGER,                    -- precisione GPS in metri
        geo_tag TEXT,                              -- 'verified' | 'off_site' | NULL (se no geoloc)
        edited_by TEXT,                            -- chi ha rettificato (office user id/email)
        edited_at TIMESTAMPTZ,
        edit_reason TEXT,                          -- motivo della rettifica
        device_info JSONB DEFAULT '{}',            -- altri metadati (browser version, screen, ecc.)
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS lat NUMERIC;
      ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS lng NUMERIC;
      ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS gps_accuracy_m INTEGER;
      ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS geo_tag TEXT;
      CREATE INDEX IF NOT EXISTS time_entries_user_idx ON time_entries (user_id, occurred_at DESC);
      -- Indice opzionale per filtri rapidi per giorno: omesso perché PostgreSQL
      -- rifiuta (occurred_at::date) come non IMMUTABLE per TIMESTAMPTZ. Le query
      -- sono comunque coperte da time_entries_user_idx + filtro WHERE range.
      CREATE INDEX IF NOT EXISTS time_entries_type_idx ON time_entries (entry_type, occurred_at DESC);

      CREATE TABLE IF NOT EXISTS time_shifts (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        shift_date DATE NOT NULL,
        clock_in_at TIMESTAMPTZ,
        clock_out_at TIMESTAMPTZ,
        clock_in_entry_id BIGINT,                  -- FK soft → time_entries.id
        clock_out_entry_id BIGINT,
        worked_minutes INTEGER,                    -- (clock_out - clock_in) in minuti
        status TEXT NOT NULL DEFAULT 'open',       -- 'open' | 'closed' | 'reviewed' | 'locked'
        anomaly_flags JSONB NOT NULL DEFAULT '[]', -- ["off_network_in", "off_network_out", "manual_rectify"]
        notes TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (user_id, shift_date)
      );
      CREATE INDEX IF NOT EXISTS time_shifts_user_idx ON time_shifts (user_id, shift_date DESC);
      CREATE INDEX IF NOT EXISTS time_shifts_date_idx ON time_shifts (shift_date DESC);
      CREATE INDEX IF NOT EXISTS time_shifts_status_idx ON time_shifts (status);

      -- Richieste di rettifica timbratura: dipendente segnala anomalia, office approva
      CREATE TABLE IF NOT EXISTS time_rectification_requests (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,                     -- chi richiede
        shift_date DATE NOT NULL,
        request_type TEXT NOT NULL,                -- 'fix_clock_in' | 'fix_clock_out' | 'add_missing' | 'remove_entry' | 'other'
        target_entry_id BIGINT,                    -- entry da modificare (NULL se add_missing)
        proposed_time TIMESTAMPTZ,                 -- orario corretto proposto
        reason TEXT NOT NULL,                      -- motivo testuale
        status TEXT NOT NULL DEFAULT 'pending',    -- 'pending' | 'approved' | 'rejected'
        reviewed_by TEXT,
        reviewed_at TIMESTAMPTZ,
        review_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS time_rect_user_idx ON time_rectification_requests (user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS time_rect_status_idx ON time_rectification_requests (status, created_at DESC);

      -- ─────────────────────────────────────────────────────────────────────
      -- Sistemazioni (service_repairs) — rilavorazioni post-installazione.
      -- Sempre collegate a un ordine PSI (parent_order_id required).
      -- Garanzia auto: 12 mesi dalla data installazione del job originale.
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS service_repairs (
        id TEXT PRIMARY KEY,                       -- es. "SR-2026-0042"
        parent_order_id TEXT NOT NULL,             -- FK soft → orders.id
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT,
        site_address TEXT,
        category TEXT NOT NULL,                    -- warranty | goodwill | paid_repair | damage_client
        reason_code TEXT,                          -- cucitura | distacco_bordo | infiltrazione | ...
        description TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'manual',     -- manual | whatsapp | email | crew_report
        reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        reported_by TEXT,
        status TEXT NOT NULL DEFAULT 'reported',   -- reported | scheduled | in_progress | completed | cancelled
        scheduled_date DATE,
        scheduled_time TEXT,
        assigned_crew TEXT,
        completed_at TIMESTAMPTZ,
        work_report_id TEXT,                       -- FK soft → work_completion_reports.id
        photos JSONB NOT NULL DEFAULT '[]',        -- foto problema PRE-intervento
        cost_owner TEXT,                           -- company | client
        estimated_cost_eur NUMERIC,
        invoice_amount_eur NUMERIC,
        within_warranty BOOLEAN,                   -- snapshot del calcolo al momento creazione
        warranty_days_left INTEGER,                -- giorni di garanzia residui all'apertura
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS service_repairs_order_idx     ON service_repairs (parent_order_id);
      CREATE INDEX IF NOT EXISTS service_repairs_status_idx    ON service_repairs (status, scheduled_date);
      CREATE INDEX IF NOT EXISTS service_repairs_category_idx  ON service_repairs (category);
      CREATE INDEX IF NOT EXISTS service_repairs_crew_idx      ON service_repairs (assigned_crew, scheduled_date);
      CREATE INDEX IF NOT EXISTS service_repairs_created_idx   ON service_repairs (created_at DESC);

      -- ─────────────────────────────────────────────────────────────────────
      -- Job events — eventi puntuali durante la giornata di cantiere.
      -- Granularità: 1 tap crew = 1 evento. Permette timeline live + KPI
      -- (tempo trasferta, tempo posa effettivo, puntualità).
      --
      -- event_type:
      --   'departure'   → crew in viaggio dal capannone
      --   'arrival'     → arrivato in cantiere (può includere foto pre-lavoro)
      --   'work_start'  → inizio posa effettiva (distinto da arrivo)
      --   'work_end'    → fine posa (separato dal verbale che è step finale)
      --   'return'      → rientro al capannone, cantiere chiuso
      --   'issue'       → segnalazione rapida problema dal cantiere (testo)
      --   'note'        → nota generica (libero)
      -- ─────────────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS job_events (
        id BIGSERIAL PRIMARY KEY,
        order_id TEXT NOT NULL,
        installation_id TEXT,
        event_type TEXT NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        user_id TEXT,                              -- chi ha registrato (crew/office)
        user_name TEXT,                            -- snapshot per audit
        crew_name TEXT,                            -- squadra (snapshot)
        lat NUMERIC,                               -- opt-in geolocation
        lng NUMERIC,
        gps_accuracy_m INTEGER,                    -- precisione GPS in metri
        photos JSONB NOT NULL DEFAULT '[]',        -- [{ r2_key, w, h, taken_at }, ...]
        notes TEXT,
        source TEXT NOT NULL DEFAULT 'manual',     -- manual | auto
        ip_address TEXT,
        user_agent TEXT,
        device_id TEXT,                            -- da localStorage client
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS job_events_order_idx       ON job_events (order_id, occurred_at DESC);
      CREATE INDEX IF NOT EXISTS job_events_type_idx        ON job_events (event_type, occurred_at DESC);
      CREATE INDEX IF NOT EXISTS job_events_crew_idx        ON job_events (crew_name, occurred_at DESC);
      CREATE INDEX IF NOT EXISTS job_events_recent_idx      ON job_events (occurred_at DESC);
    `);
    console.log("[db] schema relazionale verificato");
  })().catch((err) => {
    relationalSchemaBootstrapPromise = null;
    console.error("[db] ensureRelationalSchema failed:", err?.message);
    throw err;
  });
  return relationalSchemaBootstrapPromise;
}

// ——— Helpers SQL: row mapper + read/write per tabelle relazionali ———

function dbRowToOrder(row) {
  return {
    id: row.id,
    shopifyNumericId: row.shopify_numeric_id || "",
    shopifyGraphqlId: row.shopify_graphql_id || "",
    orderNumber: row.order_number || "",
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    email: row.email || "",
    phone: row.phone || "",
    city: row.city || "",
    address: row.address || "",
    postalCode: row.postal_code || "",
    provinceCode: row.province_code || "",
    province: row.province || "",
    countryCode: row.country_code || "IT",
    financialStatus: row.financial_status || "pending",
    fulfillmentStatus: row.fulfillment_status || "unfulfilled",
    paymentMethod: row.payment_method || "",
    source: row.source || "",
    note: row.note || "",
    total: row.total || "0",
    totals: row.totals || {},
    billing: row.billing || {},
    lineItems: row.line_items || [],
    lineDetails: row.line_details || [],
    attachments: row.attachments || [],
    convertedJobId: row.converted_job_id || null,
    accounting: row.accounting || {},
    operations: (() => {
      const stored = row.operations_json || {};
      // Se operations_json ha già sqm > 0, usalo direttamente
      if (stored.sqm > 0) return stored;
      // Altrimenti deriva sqm/product dai lineItems via normalizeOperations,
      // ma preserva warehouse/installation/status già salvati in stored
      const base = {
        id: row.id,
        lineItems: row.line_items || [],
        lineDetails: row.line_details || [],
        operations: {
          ...stored,            // preserva warehouse, installation, status, note, etc.
          sqm: 0,              // forza derivazione da lineItems (non usare il cached 0)
          product: stored.product || "", // lascia che normalizeOperations usi defaults se vuoto
        },
      };
      return normalizeOperations(base);
    })(),
  };
}

function dbRowToInventoryItem(row) {
  return {
    id: row.id,
    product: row.product || "",
    family: row.family || "",
    pieceType: row.piece_type || "",
    pieceState: row.piece_state || "disponibile",
    width: row.width != null ? Number(row.width) : null,
    length: row.length != null ? Number(row.length) : null,
    units: row.units || "",
    label: row.label || "",
    allocatedToOrderId: row.allocated_to_order_id || null,
  };
}

function dbRowToJob(row) {
  return {
    id: row.id,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    city: row.city || "",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    jobType: row.job_type || "",
    surface: row.surface || "",
    product: row.product || "",
    sqm: row.sqm != null ? Number(row.sqm) : null,
    installDate: row.install_date || "",
    installTime: row.install_time || "",
    crew: row.crew || "",
    priority: row.priority || "",
    warehouseStatus: row.warehouse_status || "",
    installStatus: row.install_status || "",
    materials: row.materials || [],
    notes: row.notes || "",
    attachments: row.attachments || [],
    sourceOrderId: row.source_order_id || null,
  };
}

function dbRowToSalesRequest(row) {
  return {
    id: row.id,
    // Il frontend usa name/surname (non firstName/lastName)
    name: row.first_name || "",
    surname: row.last_name || "",
    email: row.email || "",
    phone: row.phone || "",
    city: row.city || "",
    address: row.address || "",
    postalCode: row.postal_code || "",
    provinceCode: row.province_code || "",
    province: row.province || "",
    countryCode: row.country_code || "IT",
    company: row.company || "",
    // Il frontend usa service (non jobType)
    service: row.job_type || "",
    jobType: row.job_type || "",
    surface: row.surface || "",
    sqm: row.sqm != null ? Number(row.sqm) : null,
    note: row.note || "",
    status: row.status || "",
    assignment: row.assignment || "",
    firstContactBy: row.first_contact_by || "",
    firstContactAt: row.first_contact_at || null,
    quotedAt: row.quoted_at || null,
    source: row.source || "",
    sourceRowNumber: row.source_row_number || null,
    attachments: row.attachments || [],
    whatsappThreadId: row.whatsapp_thread_id || null,
    requestedHeight: row.requested_height || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getOrdersFromDb() {
  if (!USE_POSTGRES) return null;
  const now = Date.now();
  if (_ordersDbCache && now - _ordersDbCacheAt < DB_CACHE_TTL_MS) return _ordersDbCache;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY updated_at DESC NULLS LAST");
    _ordersDbCache = rows.map(dbRowToOrder);
    _ordersDbCacheAt = now;
    return _ordersDbCache;
  } catch (err) {
    console.warn("[db] getOrdersFromDb:", err?.message);
    return null;
  }
}

async function getInventoryFromDb() {
  if (!USE_POSTGRES) return null;
  const now = Date.now();
  if (_inventoryDbCache && now - _inventoryDbCacheAt < DB_CACHE_TTL_MS) return _inventoryDbCache;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const { rows } = await pool.query("SELECT * FROM inventory_items ORDER BY created_at ASC NULLS LAST");
    _inventoryDbCache = rows.map(dbRowToInventoryItem);
    _inventoryDbCacheAt = now;
    return _inventoryDbCache;
  } catch (err) {
    console.warn("[db] getInventoryFromDb:", err?.message);
    return null;
  }
}

async function getJobsFromDb() {
  if (!USE_POSTGRES) return null;
  const now = Date.now();
  if (_jobsDbCache && now - _jobsDbCacheAt < DB_CACHE_TTL_MS) return _jobsDbCache;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const { rows } = await pool.query("SELECT * FROM jobs ORDER BY created_at DESC NULLS LAST");
    _jobsDbCache = rows.map(dbRowToJob);
    _jobsDbCacheAt = now;
    return _jobsDbCache;
  } catch (err) {
    console.warn("[db] getJobsFromDb:", err?.message);
    return null;
  }
}

// Cache TTL per le 4 query DB chiamate su ogni /api/session.
// Ogni cache viene invalidato da una funzione dedicata chiamata sui rispettivi write.
const DB_CACHE_TTL_MS = 10_000; // 10 secondi — bilanciamento freschezza vs. carico DB

let _ordersDbCache = null;
let _ordersDbCacheAt = 0;
function invalidateOrdersDbCache() { _ordersDbCache = null; _ordersDbCacheAt = 0; }

let _inventoryDbCache = null;
let _inventoryDbCacheAt = 0;
function invalidateInventoryDbCache() { _inventoryDbCache = null; _inventoryDbCacheAt = 0; }

let _jobsDbCache = null;
let _jobsDbCacheAt = 0;
function invalidateJobsDbCache() { _jobsDbCache = null; _jobsDbCacheAt = 0; }

let _salesRequestsDbCache = null;
let _salesRequestsDbCacheAt = 0;
const SALES_REQUESTS_DB_CACHE_TTL_MS = 15_000; // 15 secondi (eredita TTL legacy)

function invalidateSalesRequestsDbCache() {
  _salesRequestsDbCache = null;
  _salesRequestsDbCacheAt = 0;
}

async function getSalesRequestsFromDb() {
  if (!USE_POSTGRES) return null;
  const now = Date.now();
  if (_salesRequestsDbCache && now - _salesRequestsDbCacheAt < SALES_REQUESTS_DB_CACHE_TTL_MS) {
    return _salesRequestsDbCache;
  }
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const { rows } = await pool.query("SELECT * FROM sales_requests ORDER BY updated_at DESC NULLS LAST");
    _salesRequestsDbCache = rows.map(dbRowToSalesRequest);
    _salesRequestsDbCacheAt = now;
    return _salesRequestsDbCache;
  } catch (err) {
    console.warn("[db] getSalesRequestsFromDb:", err?.message);
    return null;
  }
}

/**
 * CRM server-side search con FTS, filtri e paginazione.
 * Usato da GET /api/sales/requests.
 */
async function searchSalesRequestsFromDb({ q = "", status = "", assignment = "", source = "", dateFrom = "", dateTo = "", page = 1, limit = 50 } = {}) {
  if (!USE_POSTGRES) return { total: 0, page, limit, items: [] };
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const where = [];
  const params = [];

  if (q && q.trim()) {
    params.push(q.trim());
    where.push(`to_tsvector('italian',
      coalesce(first_name,'') || ' ' || coalesce(last_name,'') || ' ' ||
      coalesce(phone,'') || ' ' || coalesce(city,'') || ' ' ||
      coalesce(email,'') || ' ' || coalesce(note,'') || ' ' ||
      coalesce(company,'')
    ) @@ plainto_tsquery('italian', $${params.length})`);
  }
  if (status && status !== "all") {
    params.push(String(status));
    where.push(`status = $${params.length}`);
  }
  if (assignment === "unassigned") {
    where.push(`(assignment IS NULL OR assignment = '')`);
  } else if (assignment && assignment !== "all") {
    params.push(String(assignment));
    where.push(`assignment = $${params.length}`);
  }
  if (source && source !== "all") {
    params.push(String(source));
    where.push(`source = $${params.length}`);
  }
  if (dateFrom) {
    params.push(String(dateFrom));
    where.push(`created_at >= $${params.length}::date`);
  }
  if (dateTo) {
    params.push(String(dateTo));
    where.push(`created_at < ($${params.length}::date + interval '1 day')`);
  }

  const whereClause = where.length ? ` WHERE ${where.join(" AND ")}` : "";
  const offset = (Math.max(1, Number(page) || 1) - 1) * (Number(limit) || 50);
  const limitN = Math.min(200, Math.max(1, Number(limit) || 50));

  try {
    const [countRes, dataRes, statsRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM sales_requests${whereClause}`, params),
      pool.query(
        `SELECT * FROM sales_requests${whereClause} ORDER BY created_at DESC NULLS LAST LIMIT ${limitN} OFFSET ${offset}`,
        params,
      ),
      // Stats globali (senza WHERE filtro) per i KPI in cima alla lista.
      pool.query(`SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status IS NULL OR status = '' OR status = 'new')::int AS new_count,
        COUNT(*) FILTER (WHERE assignment IS NULL OR assignment = '')::int AS unassigned_count,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int AS this_week_count
      FROM sales_requests`),
    ]);
    const sr = statsRes.rows[0] || {};
    return {
      total: parseInt(countRes.rows[0]?.total || "0", 10),
      page: Number(page) || 1,
      limit: limitN,
      items: dataRes.rows.map(dbRowToSalesRequest),
      stats: {
        total: sr.total ?? 0,
        new: sr.new_count ?? 0,
        unassigned: sr.unassigned_count ?? 0,
        thisWeek: sr.this_week_count ?? 0,
      },
    };
  } catch (err) {
    console.warn("[db] searchSalesRequestsFromDb:", err?.message);
    return { total: 0, page: Number(page) || 1, limit: limitN, items: [] };
  }
}

// Pipeline CRM: conteggi per colonna kanban + primi N lead per ogni colonna
// Le colonne rispecchiano getSalesRequestStatusTone() del client:
//   new       → new, (vuoto)
//   followup  → followup, called, to_call, scheduled
//   quoted    → quoted, counter_offered
//   closed    → closed, won, lost
async function getSalesRequestPipelineFromDb({ limit = 20 } = {}) {
  if (!USE_POSTGRES) return { columns: [], stats: null };
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const limitN = Math.min(100, Math.max(1, Number(limit) || 20));

  // Colonne kanban = stati reali del processo commerciale
  const COLUMN_DEFS = [
    { key: "unassigned", label: "Da assegnare"        },
    { key: "new",        label: "Nuovo contatto"       },
    { key: "contacted",  label: "1° Contatto"          },
    { key: "followup",   label: "Follow-up"            },
    { key: "quoting",    label: "In preventivo"        },
    { key: "quoted",     label: "Preventivo inviato"   },
    { key: "won",        label: "Confermato"           },
    { key: "lost",       label: "Perso / Chiuso"       },
  ];

  // Normalizza status esattamente come normalizeSalesRequestStatus() in JS:
  // strip diacritici italiani → strip non-alfanumerici → lowercase
  const normExpr = `lower(regexp_replace(translate(coalesce(trim(status),''), 'àèéìíòóùúÀÈÉÌÍÒÓÙÚ', 'aaeiioouuAAEIIOOUU'), '[^a-zA-Z0-9 ]', '', 'g'))`;

  // Classifica ogni riga in uno degli 8 bucket (stati reali del processo commerciale)
  const bucketExpr = `CASE
    -- Perso / Chiuso: ha la massima priorità, evita che chiusi finiscano in altre colonne
    WHEN ${normExpr} IN ('closed','chiusa','chiuso','vinta','vinto','persa','perso',
      'declinata','lead non qualificato','completata','completato','archiviata','archiviato')
      OR ${normExpr} LIKE '%non qualific%'
      OR ${normExpr} LIKE '%archivi%'
    THEN 'lost'

    -- Da assegnare: non ancora assegnato e non chiuso/vinto/perso
    WHEN coalesce(trim(assignment),'') = ''
    THEN 'unassigned'

    -- Confermato: preventivo/ordine confermato o eseguito
    WHEN ${normExpr} IN ('preventivo confermato','ordine confermato','ordine eseguito',
      'campione acquistato')
      OR (${normExpr} LIKE '%confermato%' AND ${normExpr} NOT LIKE '%non%')
      OR ${normExpr} LIKE '%ordine%'
    THEN 'won'

    -- Preventivo inviato
    WHEN ${normExpr} IN ('preventivo inviato','offerta inviata')
      OR (${normExpr} LIKE '%preventivo%' AND ${normExpr} LIKE '%inviato%')
    THEN 'quoted'

    -- In preventivo (da inviare o in lavorazione)
    WHEN ${normExpr} IN ('preventivo','in preventivo','preventivo da inviare','offerta','quotato')
      OR (${normExpr} LIKE '%preventivo%'
          AND ${normExpr} NOT LIKE '%inviato%'
          AND ${normExpr} NOT LIKE '%confermato%')
      OR (${normExpr} LIKE '%offerta%' AND ${normExpr} NOT LIKE '%inviata%')
    THEN 'quoting'

    -- 1° Contatto
    WHEN ${normExpr} IN ('1 contatto','1 contatto whatsapp','primo contatto')
      OR ${normExpr} LIKE '1 contatt%'
      OR ${normExpr} LIKE '1o contatt%'
    THEN 'contacted'

    -- Follow-up: da richiamare, in attesa, nessuna risposta, ecc.
    WHEN ${normExpr} IN ('followup','follow up','da richiamare','richiamare','richiamata','recall',
      'attesa','in attesa di risposta','nessuna risposta','ricontattato','chiamare',
      'email','email inviata','fare follow up','in lavorazione','da seguire')
      OR ${normExpr} LIKE '%follow%'
      OR ${normExpr} LIKE '%richiam%'
      OR ${normExpr} LIKE '%attesa%'
      OR ${normExpr} LIKE '%contatt%'
      OR ${normExpr} LIKE '%lavoraz%'
    THEN 'followup'

    -- Nuovo contatto: assegnato ma senza stato specifico
    ELSE 'new'
  END`;

  try {
    // Unica query CTE: un solo table scan per bucket + stats + top-N per colonna
    const cteRes = await pool.query(`
      WITH bucketed AS (
        SELECT *, (${bucketExpr}) AS _bucket
        FROM sales_requests
      ),
      counts AS (
        SELECT
          _bucket,
          COUNT(*)::int                                                                    AS cnt,
          COUNT(*) FILTER (WHERE coalesce(trim(assignment),'') = '')::int                 AS unassigned_cnt,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::int           AS this_week_cnt
        FROM bucketed
        GROUP BY _bucket
      ),
      ranked AS (
        SELECT b.*,
          c.cnt, c.unassigned_cnt, c.this_week_cnt,
          ROW_NUMBER() OVER (PARTITION BY b._bucket ORDER BY b.created_at DESC NULLS LAST) AS _rn
        FROM bucketed b
        JOIN counts c ON c._bucket = b._bucket
      )
      SELECT * FROM ranked
      WHERE _rn <= $1
      ORDER BY _bucket, _rn
    `, [limitN]);

    // Ricostruisci stats e colonne dalla risposta unica
    const bucketCounts     = {};
    let totalAll           = 0;
    let totalUnassigned    = 0;
    let totalThisWeek      = 0;
    const bucketRowsMap    = {};
    const seenBuckets      = new Set();

    for (const row of cteRes.rows) {
      const b = row._bucket;
      if (!seenBuckets.has(b)) {
        seenBuckets.add(b);
        bucketCounts[b]  = row.cnt;
        totalAll        += row.cnt;
        totalUnassigned += row.unassigned_cnt;
        totalThisWeek   += row.this_week_cnt;
      }
      if (!bucketRowsMap[b]) bucketRowsMap[b] = [];
      bucketRowsMap[b].push(row);
    }

    // Assicura che tutti i bucket abbiano un conteggio (anche se non tornano righe top-N)
    // Serve una seconda micro-query solo se ci sono bucket con 0 record nel top-N
    // (edge case: bucket esiste ma tutti i record finiscono oltre il limit — non possibile)

    const stats = {
      total:      totalAll,
      // "NUOVI" in toolbar = da assegnare (azione immediata richiesta)
      new:        (bucketCounts["unassigned"] || 0),
      unassigned: totalUnassigned,
      thisWeek:   totalThisWeek,
    };

    const columns = COLUMN_DEFS.map((col) => ({
      key:   col.key,
      label: col.label,
      count: bucketCounts[col.key] || 0,
      items: (bucketRowsMap[col.key] || []).map(dbRowToSalesRequest),
    }));

    return { columns, stats };
  } catch (err) {
    console.warn("[db] getSalesRequestPipelineFromDb:", err?.message);
    return {
      columns: COLUMN_DEFS.map((c) => ({ key: c.key, label: c.label, count: 0, items: [] })),
      stats: null,
    };
  }
}

async function upsertOrderToDb(order, userId = null) {
  if (!USE_POSTGRES || !order?.id) return;
  invalidateOrdersDbCache();
  // Assicura che operations_json abbia sqm/product derivati: se mancano, li calcola da lineItems
  const orderWithOps = (order.operations?.sqm == null || order.operations?.sqm === 0)
    ? normalizeOperations(order)
    : order;
  const ops = orderWithOps.operations || order.operations || {};
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    // Leggi stato prima dell'upsert per rilevare cambiamenti (audit log)
    let existingOrderRow = null;
    try {
      const existRes = await pool.query(
        "SELECT financial_status, fulfillment_status, warehouse, installation FROM orders WHERE id = $1",
        [String(order.id)],
      );
      existingOrderRow = existRes.rows[0] || null;
    } catch {}
    await pool.query(`
      INSERT INTO orders (
        id, shopify_numeric_id, shopify_graphql_id, order_number,
        first_name, last_name, email, phone,
        city, address, postal_code, province_code, province, country_code,
        financial_status, fulfillment_status, payment_method,
        source, note, total,
        totals, billing, warehouse, installation, accounting,
        line_items, line_details, attachments, converted_job_id, operations_json, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        shopify_numeric_id=EXCLUDED.shopify_numeric_id,
        shopify_graphql_id=EXCLUDED.shopify_graphql_id,
        order_number=EXCLUDED.order_number,
        first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
        email=EXCLUDED.email, phone=EXCLUDED.phone,
        city=EXCLUDED.city, address=EXCLUDED.address,
        postal_code=EXCLUDED.postal_code, province_code=EXCLUDED.province_code,
        province=EXCLUDED.province, country_code=EXCLUDED.country_code,
        financial_status=EXCLUDED.financial_status,
        fulfillment_status=EXCLUDED.fulfillment_status,
        payment_method=EXCLUDED.payment_method,
        source=EXCLUDED.source, note=EXCLUDED.note, total=EXCLUDED.total,
        totals=EXCLUDED.totals, billing=EXCLUDED.billing,
        warehouse=EXCLUDED.warehouse, installation=EXCLUDED.installation,
        accounting=EXCLUDED.accounting,
        line_items=EXCLUDED.line_items, line_details=EXCLUDED.line_details,
        attachments=EXCLUDED.attachments, converted_job_id=EXCLUDED.converted_job_id,
        operations_json=EXCLUDED.operations_json,
        updated_at=NOW()
    `, [
      String(order.id),
      String(order.shopifyNumericId || ""),
      String(order.shopifyGraphqlId || ""),
      String(order.orderNumber || ""),
      String(order.firstName || ""), String(order.lastName || ""),
      String(order.email || ""), String(order.phone || ""),
      String(order.city || ""), String(order.address || ""),
      String(order.postalCode || ""), String(order.provinceCode || ""),
      String(order.province || ""), String(order.countryCode || "IT"),
      String(order.financialStatus || "pending"),
      String(order.fulfillmentStatus || "unfulfilled"),
      String(order.paymentMethod || ""),
      String(order.source || ""), String(order.note || ""), String(order.total || "0"),
      JSON.stringify(order.totals || {}),
      JSON.stringify(order.billing || {}),
      JSON.stringify(ops.warehouse || {}),
      JSON.stringify(ops.installation || {}),
      JSON.stringify(order.accounting || ops.accounting || {}),
      JSON.stringify(Array.isArray(order.lineItems) ? order.lineItems : []),
      JSON.stringify(Array.isArray(order.lineDetails) ? order.lineDetails : []),
      JSON.stringify(Array.isArray(order.attachments) ? order.attachments : []),
      order.convertedJobId ? String(order.convertedJobId) : null,
      JSON.stringify(orderWithOps.operations || order.operations || {}),
    ]);
    // Audit log per cambiamenti di stato e operazioni
    const isNewOrder = !existingOrderRow;
    if (!isNewOrder && existingOrderRow) {
      const orderChanges = {};
      if (existingOrderRow.financial_status !== String(order.financialStatus || ""))
        orderChanges.financialStatus = { before: existingOrderRow.financial_status, after: String(order.financialStatus || "") };
      if (existingOrderRow.fulfillment_status !== String(order.fulfillmentStatus || ""))
        orderChanges.fulfillmentStatus = { before: existingOrderRow.fulfillment_status, after: String(order.fulfillmentStatus || "") };
      // Audit operazioni magazzino/installazione
      const prevWarehouse = existingOrderRow.warehouse || {};
      const prevInstall = existingOrderRow.installation || {};
      const curWarehouse = ops.warehouse || {};
      const curInstall = ops.installation || {};
      if ((prevWarehouse.status || "") !== (curWarehouse.status || ""))
        orderChanges.warehouseStatus = { before: prevWarehouse.status || "", after: curWarehouse.status || "" };
      if ((prevInstall.status || "") !== (curInstall.status || ""))
        orderChanges.installStatus = { before: prevInstall.status || "", after: curInstall.status || "" };
      if ((prevInstall.installDate || "") !== (curInstall.installDate || ""))
        orderChanges.installDate = { before: prevInstall.installDate || "", after: curInstall.installDate || "" };
      if ((prevInstall.crew || "") !== (curInstall.crew || ""))
        orderChanges.crew = { before: prevInstall.crew || "", after: curInstall.crew || "" };
      if (Object.keys(orderChanges).length) {
        writeAuditLog("order", order.id, "update", orderChanges, userId).catch(() => {});
      }
    }
    // Notifica le altre istanze di invalidare la loro cache ordini
    pool.query("SELECT pg_notify('psi_ops_cache_invalidate', 'orders')").catch(() => {});
  } catch (err) {
    console.warn("[db] upsertOrderToDb:", err?.message);
  }
}

async function upsertInventoryItemToDb(item) {
  if (!USE_POSTGRES || !item?.id) return;
  invalidateInventoryDbCache();
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    await pool.query(`
      INSERT INTO inventory_items (id, product, family, piece_type, piece_state, width, length, units, label, allocated_to_order_id, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
      ON CONFLICT (id) DO UPDATE SET
        product=EXCLUDED.product, family=EXCLUDED.family,
        piece_type=EXCLUDED.piece_type, piece_state=EXCLUDED.piece_state,
        width=EXCLUDED.width, length=EXCLUDED.length,
        units=EXCLUDED.units, label=EXCLUDED.label,
        allocated_to_order_id=EXCLUDED.allocated_to_order_id,
        updated_at=NOW()
    `, [
      String(item.id),
      String(item.product || ""), String(item.family || ""),
      String(item.pieceType || ""), String(item.pieceState || "disponibile"),
      item.width != null ? Number(item.width) : null,
      item.length != null ? Number(item.length) : null,
      String(item.units || ""), String(item.label || ""),
      item.committedOrderId ? String(item.committedOrderId) : (item.allocatedToOrderId ? String(item.allocatedToOrderId) : null),
    ]);
    pool.query("SELECT pg_notify('psi_ops_cache_invalidate', 'inventory')").catch(() => {});
  } catch (err) {
    console.warn("[db] upsertInventoryItemToDb:", err?.message);
  }
}

async function deleteInventoryItemFromDb(id) {
  if (!USE_POSTGRES || !id) return;
  invalidateInventoryDbCache();
  try {
    const pool = await getPgPool();
    await pool.query("DELETE FROM inventory_items WHERE id = $1", [String(id)]);
    pool.query("SELECT pg_notify('psi_ops_cache_invalidate', 'inventory')").catch(() => {});
  } catch (err) {
    console.warn("[db] deleteInventoryItemFromDb:", err?.message);
  }
}

async function upsertJobToDb(job) {
  if (!USE_POSTGRES || !job?.id) return;
  invalidateJobsDbCache();
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    await pool.query(`
      INSERT INTO jobs (id, first_name, last_name, city, phone, email, address, job_type, surface, product, sqm, install_date, install_time, crew, priority, warehouse_status, install_status, materials, notes, attachments, source_order_id, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW())
      ON CONFLICT (id) DO UPDATE SET
        first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
        city=EXCLUDED.city, phone=EXCLUDED.phone, email=EXCLUDED.email, address=EXCLUDED.address,
        job_type=EXCLUDED.job_type, surface=EXCLUDED.surface, product=EXCLUDED.product, sqm=EXCLUDED.sqm,
        install_date=EXCLUDED.install_date, install_time=EXCLUDED.install_time, crew=EXCLUDED.crew,
        priority=EXCLUDED.priority, warehouse_status=EXCLUDED.warehouse_status, install_status=EXCLUDED.install_status,
        materials=EXCLUDED.materials, notes=EXCLUDED.notes, attachments=EXCLUDED.attachments,
        source_order_id=EXCLUDED.source_order_id, updated_at=NOW()
    `, [
      String(job.id),
      String(job.firstName || ""), String(job.lastName || ""),
      String(job.city || ""), String(job.phone || ""), String(job.email || ""), String(job.address || ""),
      String(job.jobType || ""), String(job.surface || ""), String(job.product || ""),
      job.sqm != null ? Number(job.sqm) : null,
      String(job.installDate || ""), String(job.installTime || ""),
      String(job.crew || ""), String(job.priority || ""),
      String(job.warehouseStatus || ""), String(job.installStatus || ""),
      JSON.stringify(Array.isArray(job.materials) ? job.materials : []),
      String(job.notes || ""),
      JSON.stringify(Array.isArray(job.attachments) ? job.attachments : []),
      job.sourceOrderId ? String(job.sourceOrderId) : null,
    ]);
    pool.query("SELECT pg_notify('psi_ops_cache_invalidate', 'jobs')").catch(() => {});
  } catch (err) {
    console.warn("[db] upsertJobToDb:", err?.message);
  }
}

async function deleteJobFromDb(id) {
  if (!USE_POSTGRES || !id) return;
  invalidateJobsDbCache();
  try {
    const pool = await getPgPool();
    await pool.query("DELETE FROM jobs WHERE id = $1", [String(id)]);
    pool.query("SELECT pg_notify('psi_ops_cache_invalidate', 'jobs')").catch(() => {});
  } catch (err) {
    console.warn("[db] deleteJobFromDb:", err?.message);
  }
}

async function upsertSalesRequestToDb(request, userId = null, opts = {}) {
  if (!USE_POSTGRES || !request?.id) return;
  invalidateSalesRequestsDbCache(); // il cache diventa stale dopo ogni scrittura
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    // Leggi stato prima dell'upsert per rilevare cambiamenti
    let existingRow = null;
    try {
      const existingResult = await pool.query(
        "SELECT status, assignment, note FROM sales_requests WHERE id = $1",
        [String(request.id)],
      );
      existingRow = existingResult.rows[0] || null;
    } catch {}
    await pool.query(`
      INSERT INTO sales_requests (
        id, first_name, last_name, email, phone,
        city, address, postal_code, province_code, province, country_code,
        company, job_type, surface, sqm, note,
        status, assignment, first_contact_by, first_contact_at, quoted_at,
        source, source_row_number, attachments, whatsapp_thread_id,
        requested_height, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,COALESCE($27::timestamptz,NOW()),NOW())
      ON CONFLICT (id) DO UPDATE SET
        first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name,
        email=EXCLUDED.email, phone=EXCLUDED.phone,
        city=EXCLUDED.city, address=EXCLUDED.address,
        postal_code=EXCLUDED.postal_code, province_code=EXCLUDED.province_code,
        province=EXCLUDED.province, country_code=EXCLUDED.country_code,
        company=EXCLUDED.company, job_type=EXCLUDED.job_type,
        surface=EXCLUDED.surface, sqm=EXCLUDED.sqm, note=EXCLUDED.note,
        status=EXCLUDED.status, assignment=EXCLUDED.assignment,
        first_contact_by=EXCLUDED.first_contact_by, first_contact_at=EXCLUDED.first_contact_at,
        quoted_at=EXCLUDED.quoted_at,
        source=EXCLUDED.source, source_row_number=EXCLUDED.source_row_number,
        attachments=EXCLUDED.attachments, whatsapp_thread_id=EXCLUDED.whatsapp_thread_id,
        requested_height=EXCLUDED.requested_height,
        -- Correggi created_at se in PG è più recente dell'originale (fix import bulk)
        created_at=LEAST(sales_requests.created_at, EXCLUDED.created_at),
        updated_at=NOW()
    `, [
      String(request.id),
      String(request.name || request.firstName || ""), String(request.surname || request.lastName || ""),
      String(request.email || ""), String(request.phone || ""),
      String(request.city || ""), String(request.address || ""),
      String(request.postalCode || ""), String(request.provinceCode || ""),
      String(request.province || ""), String(request.countryCode || "IT"),
      String(request.company || ""),
      String(request.service || request.jobType || ""), String(request.surface || ""),
      request.sqm != null ? Number(request.sqm) : null,
      String(request.note || ""),
      String(request.status || ""), String(request.assignment || ""),
      String(request.firstContactBy || ""),
      (request.firstContactAt || request.firstContactSentAt || request.firstContactScheduledAt)
        ? new Date(String(request.firstContactAt || request.firstContactSentAt || request.firstContactScheduledAt)).toISOString()
        : null,
      request.quotedAt ? new Date(String(request.quotedAt)).toISOString() : null,
      String(request.source || ""),
      request.sourceRowNumber != null ? Number(request.sourceRowNumber) : null,
      JSON.stringify(Array.isArray(request.attachments) ? request.attachments : []),
      request.whatsappThreadId ? String(request.whatsappThreadId) : null,
      String(request.requestedHeight || ""),
      request.createdAt ? new Date(String(request.createdAt)).toISOString() : null,
    ]);
    // Scrivi audit_log se ci sono cambiamenti nei campi chiave
    const isNew = !existingRow;
    if (isNew) {
      writeAuditLog("sales_request", request.id, "create", { status: request.status, assignment: request.assignment }, userId).catch(() => {});
    } else {
      const changes = {};
      if (existingRow.status !== String(request.status || "")) changes.status = { before: existingRow.status, after: String(request.status || "") };
      if (existingRow.assignment !== String(request.assignment || "")) changes.assignment = { before: existingRow.assignment, after: String(request.assignment || "") };
      if (Object.keys(changes).length) {
        writeAuditLog("sales_request", request.id, "update", changes, userId).catch(() => {});
      }
    }
    // Notifica le altre istanze di invalidare la loro cache leads
    pool.query("SELECT pg_notify('psi_ops_cache_invalidate', 'sales_requests')").catch(() => {});
  } catch (err) {
    console.warn("[db] upsertSalesRequestToDb:", err?.message);
    // opts.rethrow=true → usato dai call sites critici (via outbox) per
    // distinguere "salvato" da "fallito" invece di silent fail.
    if (opts && opts.rethrow) throw err;
  }
}

async function updateSalesRequestMicroFieldsInDb(request, patch = {}, existingRequest = null, userId = null) {
  if (!USE_POSTGRES || !request?.id) return false;
  invalidateSalesRequestsDbCache();
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const entries = [];
  const add = (column, value) => entries.push([column, value]);
  const has = (key) => Object.prototype.hasOwnProperty.call(patch, key);
  if (has("name")) add("first_name", String(request.name || request.firstName || ""));
  if (has("surname")) add("last_name", String(request.surname || request.lastName || ""));
  if (has("email")) add("email", String(request.email || ""));
  if (has("phone")) add("phone", String(request.phone || ""));
  if (has("city")) add("city", String(request.city || ""));
  if (has("note")) add("note", String(request.note || ""));
  if (has("service")) add("job_type", String(request.service || request.jobType || ""));
  if (has("surface")) add("surface", String(request.surface || ""));
  if (has("sqm")) add("sqm", request.sqm != null ? Number(request.sqm) : null);
  if (has("requestedHeight")) add("requested_height", String(request.requestedHeight || ""));
  if (has("status") || has("assignment")) add("status", String(request.status || ""));
  if (has("assignment")) add("assignment", String(request.assignment || ""));
  if (has("assignment") || has("firstContactBy")) add("first_contact_by", String(request.firstContactBy || request.assignment || ""));
  if (has("firstContactAt") || has("firstContactSentAt") || request.firstContactAt || request.firstContactSentAt) {
    const contactAt = request.firstContactAt || request.firstContactSentAt || null;
    add("first_contact_at", contactAt ? new Date(String(contactAt)).toISOString() : null);
  }
  if (has("quotedAt") || String(request.status || "").trim().toLowerCase() === "preventivo inviato") {
    add("quoted_at", request.quotedAt ? new Date(String(request.quotedAt)).toISOString() : null);
  }
  if (!entries.length) return false;
  entries.push(["updated_at", new Date(String(request.updatedAt || new Date().toISOString())).toISOString()]);
  const assignments = entries.map(([column], index) => `${column}=$${index + 1}`).join(", ");
  const result = await pool.query(
    `UPDATE sales_requests SET ${assignments} WHERE id=$${entries.length + 1}`,
    [...entries.map(([, value]) => value), String(request.id)],
  );
  if (!result.rowCount) return false;
  const changes = {};
  if (has("status") && String(existingRequest?.status || "") !== String(request.status || "")) {
    changes.status = { before: String(existingRequest?.status || ""), after: String(request.status || "") };
  }
  if (has("assignment") && String(existingRequest?.assignment || "") !== String(request.assignment || "")) {
    changes.assignment = { before: String(existingRequest?.assignment || ""), after: String(request.assignment || "") };
  }
  if (Object.keys(changes).length) {
    writeAuditLog("sales_request", request.id, "update", changes, userId).catch(() => {});
  }
  return true;
}

async function deleteSalesRequestFromDb(id, opts = {}) {
  if (!USE_POSTGRES || !id) return;
  invalidateSalesRequestsDbCache(); // il cache diventa stale dopo ogni scrittura
  try {
    const pool = await getPgPool();
    await pool.query("DELETE FROM sales_requests WHERE id = $1", [String(id)]);
  } catch (err) {
    console.warn("[db] deleteSalesRequestFromDb:", err?.message);
    if (opts && opts.rethrow) throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Verbali fine cantiere (work_completion_reports)
// ─────────────────────────────────────────────────────────────────────────────

function dbRowToWorkReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id || "",
    installationId: row.installation_id || "",
    crewUserId: row.crew_user_id || "",
    crewName: row.crew_name || "",
    operators: Array.isArray(row.operators) ? row.operators : [],
    customerName: row.customer_name || "",
    customerEmail: row.customer_email || "",
    siteAddress: row.site_address || "",
    executedSqm: row.executed_sqm != null ? Number(row.executed_sqm) : null,
    productModel: row.product_model || "",
    workHoursStart: row.work_hours_start ? new Date(row.work_hours_start).toISOString() : null,
    workHoursEnd: row.work_hours_end ? new Date(row.work_hours_end).toISOString() : null,
    notes: row.notes || "",
    extras: Array.isArray(row.extras) ? row.extras : [],
    photos: Array.isArray(row.photos) ? row.photos : [],
    liabilityText: row.liability_text || "",
    customerSignatureR2Key: row.customer_signature_r2_key || "",
    crewSignatureR2Key: row.crew_signature_r2_key || "",
    signedAt: row.signed_at ? new Date(row.signed_at).toISOString() : null,
    documentPdfR2Key: row.document_pdf_r2_key || "",
    documentPdfSha256: row.document_pdf_sha256 || "",
    status: row.status || "draft",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : null,
  };
}

/**
 * Genera un ID progressivo per anno nel formato "VL-YYYY-NNNN".
 * MVP: best-effort, non transazionale. Race condition possibile ma il volume
 * è low (decine/mese), e un eventuale conflitto verrebbe rifiutato dal PRIMARY KEY.
 */
async function generateWorkReportId() {
  const year = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric" }).format(new Date());
  if (!USE_POSTGRES) return `VL-${year}-0001`;
  const pool = await getPgPool();
  const prefix = `VL-${year}-`;
  const { rows } = await pool.query(
    `SELECT id FROM work_completion_reports WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`],
  );
  let next = 1;
  if (rows[0]?.id) {
    const tail = String(rows[0].id).slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (Number.isFinite(parsed)) next = parsed + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function createWorkReportInDb(input = {}, opts = {}) {
  if (!USE_POSTGRES) throw new Error("createWorkReportInDb: Postgres required");
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const id = input.id || await generateWorkReportId();
  try {
    await pool.query(
      `INSERT INTO work_completion_reports (
        id, order_id, installation_id, crew_user_id, crew_name,
        operators, customer_name, customer_email, site_address,
        executed_sqm, product_model, work_hours_start, work_hours_end,
        notes, extras, photos, liability_text, status, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17,$18,NOW())`,
      [
        id,
        String(input.orderId || "") || null,
        String(input.installationId || "") || null,
        String(input.crewUserId || ""),
        String(input.crewName || ""),
        JSON.stringify(Array.isArray(input.operators) ? input.operators : []),
        String(input.customerName || ""),
        String(input.customerEmail || "") || null,
        String(input.siteAddress || "") || null,
        input.executedSqm != null ? Number(input.executedSqm) : null,
        String(input.productModel || "") || null,
        input.workHoursStart ? new Date(input.workHoursStart).toISOString() : null,
        input.workHoursEnd ? new Date(input.workHoursEnd).toISOString() : null,
        String(input.notes || ""),
        JSON.stringify(Array.isArray(input.extras) ? input.extras : []),
        JSON.stringify(Array.isArray(input.photos) ? input.photos : []),
        String(input.liabilityText || ""),
        "draft",
      ],
    );
    return await getWorkReportFromDb(id);
  } catch (err) {
    console.warn("[db] createWorkReportInDb:", err?.message);
    if (opts && opts.rethrow) throw err;
    return null;
  }
}

async function getWorkReportFromDb(id) {
  if (!USE_POSTGRES || !id) return null;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM work_completion_reports WHERE id = $1 LIMIT 1`,
      [String(id)],
    );
    return dbRowToWorkReport(rows[0] || null);
  } catch (err) {
    console.warn("[db] getWorkReportFromDb:", err?.message);
    return null;
  }
}

async function listWorkReportsFromDb({ orderId = null, crewUserId = null, status = null, limit = 200 } = {}) {
  if (!USE_POSTGRES) return [];
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const where = [];
    const params = [];
    if (orderId) { params.push(String(orderId)); where.push(`order_id = $${params.length}`); }
    if (crewUserId) { params.push(String(crewUserId)); where.push(`crew_user_id = $${params.length}`); }
    if (status) { params.push(String(status)); where.push(`status = $${params.length}`); }
    params.push(Number(limit) || 200);
    const sql = `SELECT * FROM work_completion_reports${where.length ? " WHERE " + where.join(" AND ") : ""}
                 ORDER BY created_at DESC LIMIT $${params.length}`;
    const { rows } = await pool.query(sql, params);
    return rows.map(dbRowToWorkReport);
  } catch (err) {
    console.warn("[db] listWorkReportsFromDb:", err?.message);
    return [];
  }
}

/**
 * Aggiorna campi modificabili. Whitelist esplicita per evitare update accidentali
 * di status/signed_at/document_pdf/sha256 (che vanno solo via flow dedicato).
 */
async function updateWorkReportInDb(id, patch = {}, opts = {}) {
  if (!USE_POSTGRES || !id) return null;
  const allowedFields = {
    operators:       { column: "operators", json: true },
    customerName:    { column: "customer_name" },
    customerEmail:   { column: "customer_email" },
    siteAddress:     { column: "site_address" },
    executedSqm:     { column: "executed_sqm" },
    productModel:    { column: "product_model" },
    workHoursStart:  { column: "work_hours_start", date: true },
    workHoursEnd:    { column: "work_hours_end", date: true },
    notes:           { column: "notes" },
    extras:          { column: "extras", json: true },
    photos:          { column: "photos", json: true },
    liabilityText:   { column: "liability_text" },
  };
  const sets = [];
  const params = [];
  for (const [key, def] of Object.entries(allowedFields)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    const value = patch[key];
    params.push(def.json ? JSON.stringify(value || []) : def.date && value ? new Date(value).toISOString() : value);
    sets.push(`${def.column} = $${params.length}${def.json ? "::jsonb" : ""}`);
  }
  if (!sets.length) return await getWorkReportFromDb(id);
  sets.push("updated_at = NOW()");
  params.push(String(id));
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    await pool.query(
      `UPDATE work_completion_reports SET ${sets.join(", ")} WHERE id = $${params.length}`,
      params,
    );
    return await getWorkReportFromDb(id);
  } catch (err) {
    console.warn("[db] updateWorkReportInDb:", err?.message);
    if (opts && opts.rethrow) throw err;
    return null;
  }
}

/**
 * Marca un verbale come firmato. Solo se status='draft'.
 * Update atomico: customer_signature_r2_key, crew_signature_r2_key,
 * signed_at = NOW(), status = 'signed'. Idempotente sulle chiavi firma.
 */
async function signWorkReportInDb(id, { customerSignatureR2Key, crewSignatureR2Key }, opts = {}) {
  if (!USE_POSTGRES || !id) return null;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const result = await pool.query(
      `UPDATE work_completion_reports
          SET customer_signature_r2_key = $2,
              crew_signature_r2_key     = $3,
              signed_at                 = NOW(),
              status                    = 'signed',
              updated_at                = NOW()
        WHERE id = $1 AND status = 'draft'
        RETURNING id`,
      [String(id), String(customerSignatureR2Key || ""), String(crewSignatureR2Key || "")],
    );
    if (!result.rowCount) {
      // Già firmato o non esiste — distinguilo per UX.
      const existing = await getWorkReportFromDb(id);
      if (!existing) return null;
      const err = new Error("not_draft");
      err.code = "not_draft";
      if (opts && opts.rethrow) throw err;
      return null;
    }
    return await getWorkReportFromDb(id);
  } catch (err) {
    console.warn("[db] signWorkReportInDb:", err?.message);
    if (opts && opts.rethrow) throw err;
    return null;
  }
}

/**
 * Aggiorna i campi PDF + status dopo la generazione del documento.
 * Chiamato dall'handler outbox 'generate_work_report_pdf'.
 */
async function archiveWorkReportInDb(id, { documentPdfR2Key, documentPdfSha256 }, opts = {}) {
  if (!USE_POSTGRES || !id) return null;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    await pool.query(
      `UPDATE work_completion_reports
          SET document_pdf_r2_key = $2,
              document_pdf_sha256 = $3,
              status              = 'archived',
              archived_at         = NOW(),
              updated_at          = NOW()
        WHERE id = $1`,
      [String(id), String(documentPdfR2Key || ""), String(documentPdfSha256 || "")],
    );
    return await getWorkReportFromDb(id);
  } catch (err) {
    console.warn("[db] archiveWorkReportInDb:", err?.message);
    if (opts && opts.rethrow) throw err;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sistema Presenze (timesheet) — helper SQL
// ─────────────────────────────────────────────────────────────────────────────

// Ruoli aziendali che hanno timbratura (esclude crew = subappaltatori).
const TIMESHEET_ROLES = new Set(["warehouse", "seller", "office"]);

function userIsEmployee(user) {
  return Boolean(user && TIMESHEET_ROLES.has(String(user.role || "")));
}

/**
 * Determina se un IP appartiene alla rete aziendale.
 * Configurabile via env COMPANY_NETWORK_CIDR (lista di CIDR separati da virgola).
 * Esempio: COMPANY_NETWORK_CIDR=192.168.1.0/24,10.0.0.0/8
 * Se non configurato, ritorna NULL (no tag, niente verified-network logic).
 */
const COMPANY_NETWORK_CIDR = String(process.env.COMPANY_NETWORK_CIDR || "").trim();
const _companyCidrs = COMPANY_NETWORK_CIDR
  ? COMPANY_NETWORK_CIDR.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

function ipToInt(ip) {
  const parts = String(ip || "").split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = parseInt(p, 10);
    if (!Number.isFinite(v) || v < 0 || v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function ipMatchesCidr(ip, cidr) {
  const [base, bitsStr] = String(cidr).split("/");
  const bits = parseInt(bitsStr, 10);
  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(base);
  if (ipInt == null || baseInt == null || !Number.isFinite(bits) || bits < 0 || bits > 32) return false;
  if (bits === 0) return true;
  const mask = ((0xffffffff << (32 - bits)) >>> 0);
  return (ipInt & mask) === (baseInt & mask);
}

function classifyNetwork(ip) {
  if (!_companyCidrs.length) return null;          // anti-frode off, niente tag
  const v = String(ip || "");
  if (!v) return "unknown";
  // IPv4-mapped IPv6 ("::ffff:1.2.3.4")
  const ipv4Only = v.startsWith("::ffff:") ? v.slice(7) : v;
  for (const cidr of _companyCidrs) {
    if (ipMatchesCidr(ipv4Only, cidr)) return "in_office";
  }
  return "off_network";
}

function extractClientIp(req) {
  // Render / proxy → X-Forwarded-For (primo). Altrimenti socket remote.
  const xff = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return xff || (req.socket?.remoteAddress || "") || "";
}

/**
 * Posizione capannone + raggio per geofence timesheet.
 * Configurabile via env vars (preferred) o settings table.
 *   COMPANY_OFFICE_LAT=41.901
 *   COMPANY_OFFICE_LNG=12.493
 *   COMPANY_OFFICE_RADIUS_M=200
 * Se non configurate, geofence disabilitato (geo_tag resta NULL).
 */
const COMPANY_OFFICE_LAT = process.env.COMPANY_OFFICE_LAT ? Number(process.env.COMPANY_OFFICE_LAT) : null;
const COMPANY_OFFICE_LNG = process.env.COMPANY_OFFICE_LNG ? Number(process.env.COMPANY_OFFICE_LNG) : null;
const COMPANY_OFFICE_RADIUS_M = Number(process.env.COMPANY_OFFICE_RADIUS_M) || 200;

/** Distanza in metri tra 2 punti lat/lng (formula haversine semplificata). */
function haversineMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null;
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(Math.max(0, Math.min(1, a)))));
}

/**
 * Classifica una timbratura per geofence: 'verified' se entro il raggio,
 * 'off_site' se fuori, NULL se geoloc non disponibile o geofence non configurato.
 */
function classifyGeoTag(lat, lng) {
  if (lat == null || lng == null) return null;
  if (COMPANY_OFFICE_LAT == null || COMPANY_OFFICE_LNG == null) return null;
  const distance = haversineMeters(lat, lng, COMPANY_OFFICE_LAT, COMPANY_OFFICE_LNG);
  if (distance == null) return null;
  return distance <= COMPANY_OFFICE_RADIUS_M ? "verified" : "off_site";
}

function dbRowToTimeEntry(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    userId: row.user_id || "",
    entryType: row.entry_type || "",
    source: row.source || "manual",
    occurredAt: row.occurred_at ? new Date(row.occurred_at).toISOString() : null,
    notes: row.notes || "",
    ipAddress: row.ip_address || "",
    networkTag: row.network_tag || null,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    gpsAccuracyM: row.gps_accuracy_m != null ? Number(row.gps_accuracy_m) : null,
    geoTag: row.geo_tag || null,
    deviceId: row.device_id || "",
    userAgent: row.user_agent || "",
    editedBy: row.edited_by || null,
    editedAt: row.edited_at ? new Date(row.edited_at).toISOString() : null,
    editReason: row.edit_reason || "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

function dbRowToTimeShift(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    userId: row.user_id || "",
    shiftDate: row.shift_date instanceof Date ? row.shift_date.toISOString().slice(0, 10) : String(row.shift_date || ""),
    clockInAt: row.clock_in_at ? new Date(row.clock_in_at).toISOString() : null,
    clockOutAt: row.clock_out_at ? new Date(row.clock_out_at).toISOString() : null,
    workedMinutes: row.worked_minutes != null ? Number(row.worked_minutes) : null,
    status: row.status || "open",
    anomalyFlags: Array.isArray(row.anomaly_flags) ? row.anomaly_flags : [],
    notes: row.notes || "",
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

/** Restituisce la data di shift (YYYY-MM-DD) in TZ Europe/Rome dato un timestamp. */
function shiftDateForTimestamp(ts = new Date()) {
  const date = ts instanceof Date ? ts : new Date(ts);
  // Intl en-CA produce YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

/**
 * Inserisce una time_entry e aggiorna/crea il time_shifts della giornata.
 * Idempotente: se l'utente è già in turno e tenta clock_in, ritorna lo shift esistente.
 * @param {string} userId
 * @param {'clock_in'|'clock_out'} entryType
 * @param {object} ctx { source, ipAddress, userAgent, deviceId, notes, occurredAt }
 */
async function insertTimeEntry(userId, entryType, ctx = {}) {
  if (!USE_POSTGRES || !userId) return null;
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const occurredAt = ctx.occurredAt ? new Date(ctx.occurredAt) : new Date();
  let shiftDate = shiftDateForTimestamp(occurredAt);
  const networkTag = classifyNetwork(ctx.ipAddress);
  const lat = ctx.lat != null ? Number(ctx.lat) : null;
  const lng = ctx.lng != null ? Number(ctx.lng) : null;
  const gpsAccuracyM = ctx.gpsAccuracyM != null ? Number(ctx.gpsAccuracyM) : null;
  const geoTag = classifyGeoTag(lat, lng);

  // Trova shift della giornata, se esiste
  let existingShift = await pool.query(
    `SELECT * FROM time_shifts WHERE user_id = $1 AND shift_date = $2 LIMIT 1`,
    [String(userId), shiftDate],
  );
  let shift = existingShift.rows[0] || null;

  // Fix #4 polish: turno cavallo mezzanotte. Per clock_out, se non trovo
  // turno aperto OGGI, cerco il turno aperto più recente entro 18h indietro.
  // Caso: clock_in 23:50 → shift_date=oggi; clock_out 00:30 giorno dopo →
  // shiftDate=domani, ma il turno aperto è di "oggi". Senza fix, sarebbe
  // "not_in_shift" e l'utente non potrebbe più chiudere.
  if (entryType === "clock_out" && (!shift || !shift.clock_in_at || shift.clock_out_at)) {
    const lookback = new Date(occurredAt.getTime() - 18 * 3600 * 1000);
    const recentOpen = await pool.query(
      `SELECT * FROM time_shifts
        WHERE user_id = $1
          AND clock_in_at >= $2
          AND clock_in_at <= $3
          AND clock_out_at IS NULL
        ORDER BY clock_in_at DESC LIMIT 1`,
      [String(userId), lookback.toISOString(), occurredAt.toISOString()],
    );
    if (recentOpen.rowCount) {
      shift = recentOpen.rows[0];
      shiftDate = shift.shift_date instanceof Date
        ? shift.shift_date.toISOString().slice(0, 10)
        : String(shift.shift_date);
    }
  }

  // Idempotenza: se clock_in e c'è già un turno aperto oggi, NO-OP (ritorna esistente).
  if (entryType === "clock_in" && shift && shift.clock_in_at && !shift.clock_out_at) {
    return { skipped: "already_open", shift: dbRowToTimeShift(shift) };
  }
  // Idempotenza: se clock_out e non c'è turno aperto (nemmeno entro 18h), NO-OP.
  if (entryType === "clock_out" && (!shift || !shift.clock_in_at || shift.clock_out_at)) {
    return { skipped: "not_in_shift", shift: shift ? dbRowToTimeShift(shift) : null };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const entryRes = await client.query(
      `INSERT INTO time_entries
        (user_id, entry_type, source, occurred_at, notes, ip_address, user_agent, device_id, network_tag, lat, lng, gps_accuracy_m, geo_tag)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        String(userId),
        entryType,
        String(ctx.source || "manual"),
        occurredAt.toISOString(),
        String(ctx.notes || "") || null,
        String(ctx.ipAddress || "") || null,
        String(ctx.userAgent || "").slice(0, 500) || null,
        String(ctx.deviceId || "") || null,
        networkTag,
        lat,
        lng,
        gpsAccuracyM,
        geoTag,
      ],
    );
    const newEntry = entryRes.rows[0];

    // Aggiorna/crea time_shifts
    // Flags geo (preferito) + network (legacy): consente fallback graduale
    if (entryType === "clock_in") {
      const flags = [];
      if (geoTag === "off_site") flags.push("geo_off_site_in");
      else if (geoTag === "verified") flags.push("geo_verified_in");
      if (networkTag === "off_network") flags.push("off_network_in");
      else if (networkTag === "in_office") flags.push("in_office_in");
      await client.query(
        `INSERT INTO time_shifts (user_id, shift_date, clock_in_at, clock_in_entry_id, status, anomaly_flags, updated_at)
         VALUES ($1, $2, $3, $4, 'open', $5::jsonb, NOW())
         ON CONFLICT (user_id, shift_date) DO UPDATE SET
           clock_in_at = EXCLUDED.clock_in_at,
           clock_in_entry_id = EXCLUDED.clock_in_entry_id,
           status = 'open',
           anomaly_flags = (time_shifts.anomaly_flags || EXCLUDED.anomaly_flags),
           updated_at = NOW()`,
        [String(userId), shiftDate, occurredAt.toISOString(), newEntry.id, JSON.stringify(flags)],
      );
    } else { // clock_out
      const inTime = shift?.clock_in_at ? new Date(shift.clock_in_at) : null;
      const worked = inTime ? Math.max(0, Math.round((occurredAt - inTime) / 60000)) : null;
      const flags = Array.isArray(shift.anomaly_flags) ? [...shift.anomaly_flags] : [];
      if (geoTag === "off_site") flags.push("geo_off_site_out");
      else if (geoTag === "verified") flags.push("geo_verified_out");
      if (networkTag === "off_network") flags.push("off_network_out");
      else if (networkTag === "in_office") flags.push("in_office_out");
      await client.query(
        `UPDATE time_shifts
            SET clock_out_at = $1,
                clock_out_entry_id = $2,
                worked_minutes = $3,
                status = 'closed',
                anomaly_flags = $4::jsonb,
                updated_at = NOW()
          WHERE user_id = $5 AND shift_date = $6`,
        [occurredAt.toISOString(), newEntry.id, worked, JSON.stringify(flags), String(userId), shiftDate],
      );
    }
    await client.query("COMMIT");
    const refreshedShift = await pool.query(
      `SELECT * FROM time_shifts WHERE user_id = $1 AND shift_date = $2`,
      [String(userId), shiftDate],
    );
    return {
      entry: dbRowToTimeEntry(newEntry),
      shift: dbRowToTimeShift(refreshedShift.rows[0]),
    };
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch {}
    console.warn("[timesheet] insertTimeEntry failed:", err?.message);
    throw err;
  } finally {
    client.release();
  }
}

async function getCurrentShiftForUser(userId) {
  if (!USE_POSTGRES || !userId) return null;
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const today = shiftDateForTimestamp(new Date());
  const { rows } = await pool.query(
    `SELECT * FROM time_shifts WHERE user_id = $1 AND shift_date = $2 LIMIT 1`,
    [String(userId), today],
  );
  return dbRowToTimeShift(rows[0] || null);
}

async function listShiftsForUser(userId, { from, to } = {}) {
  if (!USE_POSTGRES || !userId) return [];
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const params = [String(userId)];
  let sql = `SELECT * FROM time_shifts WHERE user_id = $1`;
  if (from) { params.push(String(from)); sql += ` AND shift_date >= $${params.length}`; }
  if (to)   { params.push(String(to));   sql += ` AND shift_date <= $${params.length}`; }
  sql += ` ORDER BY shift_date DESC LIMIT 400`;
  const { rows } = await pool.query(sql, params);
  return rows.map(dbRowToTimeShift);
}

async function listShiftsAll({ from, to, userId } = {}) {
  if (!USE_POSTGRES) return [];
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const params = [];
  const where = [];
  if (userId) { params.push(String(userId)); where.push(`user_id = $${params.length}`); }
  if (from)   { params.push(String(from));   where.push(`shift_date >= $${params.length}`); }
  if (to)     { params.push(String(to));     where.push(`shift_date <= $${params.length}`); }
  const sql = `SELECT * FROM time_shifts${where.length ? " WHERE " + where.join(" AND ") : ""}
               ORDER BY shift_date DESC, user_id ASC LIMIT 2000`;
  const { rows } = await pool.query(sql, params);
  return rows.map(dbRowToTimeShift);
}

async function listEntriesForUser(userId, { from, to, limit = 200 } = {}) {
  if (!USE_POSTGRES || !userId) return [];
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const params = [String(userId)];
  let sql = `SELECT * FROM time_entries WHERE user_id = $1`;
  if (from) { params.push(String(from)); sql += ` AND occurred_at >= $${params.length}`; }
  if (to)   { params.push(String(to));   sql += ` AND occurred_at <= $${params.length}`; }
  params.push(Number(limit) || 200);
  sql += ` ORDER BY occurred_at DESC LIMIT $${params.length}`;
  const { rows } = await pool.query(sql, params);
  return rows.map(dbRowToTimeEntry);
}

/**
 * Calcola statistiche del mese per il dipendente (per "Le mie presenze").
 */
async function getMonthlyStatsForUser(userId, year, month) {
  if (!USE_POSTGRES || !userId) return null;
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const monthStr = String(month).padStart(2, "0");
  const fromDate = `${year}-${monthStr}-01`;
  const toDate = new Date(year, month, 0).toISOString().slice(0, 10); // ultimo del mese
  const { rows } = await pool.query(
    `SELECT shift_date, worked_minutes, clock_in_at, clock_out_at, anomaly_flags
       FROM time_shifts
      WHERE user_id = $1 AND shift_date >= $2 AND shift_date <= $3
      ORDER BY shift_date ASC`,
    [String(userId), fromDate, toDate],
  );
  const totalMinutes = rows.reduce((acc, r) => acc + (Number(r.worked_minutes) || 0), 0);
  const daysWorked = rows.filter((r) => Number(r.worked_minutes) > 0).length;
  const avgMinutes = daysWorked > 0 ? Math.round(totalMinutes / daysWorked) : 0;
  return {
    year, month,
    totalMinutes,
    daysWorked,
    averageMinutesPerDay: avgMinutes,
    days: rows.map((r) => ({
      date: r.shift_date instanceof Date ? r.shift_date.toISOString().slice(0, 10) : String(r.shift_date),
      workedMinutes: Number(r.worked_minutes) || 0,
      clockIn: r.clock_in_at ? new Date(r.clock_in_at).toISOString() : null,
      clockOut: r.clock_out_at ? new Date(r.clock_out_at).toISOString() : null,
      anomalies: Array.isArray(r.anomaly_flags) ? r.anomaly_flags : [],
    })),
  };
}

/** Conta giorni consecutivi lavorati fino a oggi (streak). */
async function getCurrentStreakForUser(userId) {
  if (!USE_POSTGRES || !userId) return 0;
  await ensureRelationalSchema();
  const pool = await getPgPool();
  // Soglia 5 minuti: turni di test/dimenticati troppo brevi non contano
  // come "giorno lavorato" per il calcolo streak (evita streak fake da prove).
  const { rows } = await pool.query(
    `SELECT shift_date FROM time_shifts
      WHERE user_id = $1 AND worked_minutes >= 5
      ORDER BY shift_date DESC LIMIT 60`,
    [String(userId)],
  );
  if (!rows.length) return 0;
  const dates = rows.map((r) => r.shift_date instanceof Date ? r.shift_date : new Date(r.shift_date));
  let streak = 0;
  let cursor = new Date();
  // Tolleranza: streak parte da oggi O da ieri (se oggi non si è ancora timbrato)
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    const cursorStr = shiftDateForTimestamp(cursor);
    const dStr = d.toISOString().slice(0, 10);
    if (cursorStr === dStr) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      // permette un giorno di gap iniziale (oggi non ancora timbrato)
      cursor.setDate(cursor.getDate() - 1);
      if (shiftDateForTimestamp(cursor) === dStr) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    } else break;
  }
  return streak;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sistemazioni (service_repairs) — helper SQL + garanzia auto
// ─────────────────────────────────────────────────────────────────────────────

const REPAIR_WARRANTY_DAYS = Number(process.env.REPAIR_WARRANTY_DAYS) || 365;

const REPAIR_CATEGORIES = new Set(["warranty", "goodwill", "paid_repair", "damage_client"]);
const REPAIR_STATUSES = new Set(["reported", "scheduled", "in_progress", "completed", "cancelled"]);

function dbRowToServiceRepair(row) {
  if (!row) return null;
  return {
    id: row.id,
    parentOrderId: row.parent_order_id || "",
    customerName: row.customer_name || "",
    customerEmail: row.customer_email || "",
    customerPhone: row.customer_phone || "",
    siteAddress: row.site_address || "",
    category: row.category || "warranty",
    reasonCode: row.reason_code || "",
    description: row.description || "",
    source: row.source || "manual",
    reportedAt: row.reported_at ? new Date(row.reported_at).toISOString() : null,
    reportedBy: row.reported_by || null,
    status: row.status || "reported",
    scheduledDate: row.scheduled_date instanceof Date
      ? row.scheduled_date.toISOString().slice(0, 10)
      : (row.scheduled_date ? String(row.scheduled_date) : ""),
    scheduledTime: row.scheduled_time || "",
    assignedCrew: row.assigned_crew || "",
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    workReportId: row.work_report_id || "",
    photos: Array.isArray(row.photos) ? row.photos : [],
    costOwner: row.cost_owner || (row.category === "warranty" || row.category === "goodwill" ? "company" : "client"),
    estimatedCostEur: row.estimated_cost_eur != null ? Number(row.estimated_cost_eur) : null,
    invoiceAmountEur: row.invoice_amount_eur != null ? Number(row.invoice_amount_eur) : null,
    withinWarranty: row.within_warranty,
    warrantyDaysLeft: row.warranty_days_left != null ? Number(row.warranty_days_left) : null,
    notes: row.notes || "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  };
}

async function generateServiceRepairId() {
  const year = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric" }).format(new Date());
  if (!USE_POSTGRES) return `SR-${year}-0001`;
  const pool = await getPgPool();
  const prefix = `SR-${year}-`;
  const { rows } = await pool.query(
    `SELECT id FROM service_repairs WHERE id LIKE $1 ORDER BY id DESC LIMIT 1`,
    [`${prefix}%`],
  );
  let next = 1;
  if (rows[0]?.id) {
    const tail = String(rows[0].id).slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (Number.isFinite(parsed)) next = parsed + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracking cliente (URL pubblico con token random)
// ─────────────────────────────────────────────────────────────────────────────

/** Genera token random URL-safe per il tracking pubblico (32 chars base64url). */
function generateTrackingToken() {
  // randomBytes già importato in cima al file (ESM)
  const bytes = randomBytes(24);
  return bytes.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Verifica se un ordine ha "fornitura + posa" (cioè ha un flow installazione).
 * Criterio: operations.installation esiste E ha almeno crew o installDate o status.
 */
function orderHasInstallation(order) {
  const inst = order?.operations?.installation;
  if (!inst) return false;
  return Boolean(inst.crew || inst.installDate || inst.status || inst.id);
}

/**
 * Recupera un ordine dal blob store via tracking_token (best-effort).
 * Ritorna null se non trovato o token invalido.
 */
async function findOrderByTrackingToken(token) {
  if (!token || typeof token !== "string" || token.length < 16) return null;
  // Cerco prima in DB (se gli ordini sono migrati relazionalmente)
  if (USE_POSTGRES) {
    try {
      const pool = await getPgPool();
      const { rows } = await pool.query("SELECT id FROM orders WHERE tracking_token = $1 LIMIT 1", [String(token)]);
      if (rows[0]?.id) {
        const store = await readJson(STORE_PATH, {});
        return (store.orders || []).find((o) => o.id === rows[0].id) || null;
      }
    } catch {}
  }
  // Fallback: scan blob store (i token sono salvati anche lì in operations.trackingToken)
  try {
    const store = await readJson(STORE_PATH, {});
    return (store.orders || []).find((o) => o.operations?.trackingToken === token) || null;
  } catch { return null; }
}

/**
 * Calcola garanzia automatica per un ordine.
 * Cerca la data installazione dal blob store (operations.installation.installDate)
 * e ritorna { withinWarranty, daysLeft, suggestedCategory, installDate }.
 */
async function computeWarrantyForOrder(orderId) {
  try {
    const store = await readJson(STORE_PATH, {});
    const order = (store.orders || []).find((o) => o.id === orderId);
    const installDate = order?.operations?.installation?.installDate;
    if (!installDate) {
      return { withinWarranty: null, daysLeft: null, suggestedCategory: "goodwill", installDate: null };
    }
    const installTs = new Date(installDate);
    const now = new Date();
    const daysSince = Math.floor((now - installTs) / (24 * 3600 * 1000));
    const daysLeft = REPAIR_WARRANTY_DAYS - daysSince;
    const withinWarranty = daysLeft >= 0;
    return {
      withinWarranty,
      daysLeft,
      daysSince,
      suggestedCategory: withinWarranty ? "warranty" : "goodwill",
      installDate,
    };
  } catch {
    return { withinWarranty: null, daysLeft: null, suggestedCategory: "goodwill", installDate: null };
  }
}

async function createServiceRepairInDb(input = {}, opts = {}) {
  if (!USE_POSTGRES) throw new Error("createServiceRepairInDb: Postgres required");
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const id = input.id || await generateServiceRepairId();
  const category = REPAIR_CATEGORIES.has(input.category) ? input.category : "warranty";
  const costOwner = input.costOwner || (category === "warranty" || category === "goodwill" ? "company" : "client");
  // Warranty snapshot al momento creazione
  let withinWarranty = null;
  let warrantyDaysLeft = null;
  if (input.parentOrderId) {
    const w = await computeWarrantyForOrder(input.parentOrderId);
    withinWarranty = w.withinWarranty;
    warrantyDaysLeft = w.daysLeft;
  }
  try {
    await pool.query(
      `INSERT INTO service_repairs (
        id, parent_order_id, customer_name, customer_email, customer_phone, site_address,
        category, reason_code, description, source, reported_by, status,
        scheduled_date, scheduled_time, assigned_crew,
        photos, cost_owner, estimated_cost_eur, invoice_amount_eur,
        within_warranty, warranty_days_left, notes, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::jsonb,$17,$18,$19,$20,$21,$22,NOW())`,
      [
        id,
        String(input.parentOrderId || ""),
        String(input.customerName || ""),
        String(input.customerEmail || "") || null,
        String(input.customerPhone || "") || null,
        String(input.siteAddress || "") || null,
        category,
        String(input.reasonCode || "") || null,
        String(input.description || ""),
        String(input.source || "manual"),
        String(input.reportedBy || "") || null,
        String(input.status || "reported"),
        input.scheduledDate || null,
        String(input.scheduledTime || "") || null,
        String(input.assignedCrew || "") || null,
        JSON.stringify(Array.isArray(input.photos) ? input.photos : []),
        costOwner,
        input.estimatedCostEur != null ? Number(input.estimatedCostEur) : null,
        input.invoiceAmountEur != null ? Number(input.invoiceAmountEur) : null,
        withinWarranty,
        warrantyDaysLeft,
        String(input.notes || "") || null,
      ],
    );
    return await getServiceRepairFromDb(id);
  } catch (err) {
    console.warn("[db] createServiceRepairInDb:", err?.message);
    if (opts.rethrow) throw err;
    return null;
  }
}

async function getServiceRepairFromDb(id) {
  if (!USE_POSTGRES || !id) return null;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const { rows } = await pool.query(`SELECT * FROM service_repairs WHERE id = $1 LIMIT 1`, [String(id)]);
    return dbRowToServiceRepair(rows[0] || null);
  } catch (err) {
    console.warn("[db] getServiceRepairFromDb:", err?.message);
    return null;
  }
}

async function listServiceRepairsFromDb({ status = null, category = null, parentOrderId = null, assignedCrew = null, limit = 500 } = {}) {
  if (!USE_POSTGRES) return [];
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const where = [];
    const params = [];
    if (status) { params.push(String(status)); where.push(`status = $${params.length}`); }
    if (category) { params.push(String(category)); where.push(`category = $${params.length}`); }
    if (parentOrderId) { params.push(String(parentOrderId)); where.push(`parent_order_id = $${params.length}`); }
    if (assignedCrew) { params.push(String(assignedCrew)); where.push(`assigned_crew = $${params.length}`); }
    params.push(Number(limit) || 500);
    const sql = `SELECT * FROM service_repairs${where.length ? " WHERE " + where.join(" AND ") : ""}
                 ORDER BY COALESCE(scheduled_date, reported_at::date) DESC, created_at DESC
                 LIMIT $${params.length}`;
    const { rows } = await pool.query(sql, params);
    return rows.map(dbRowToServiceRepair);
  } catch (err) {
    console.warn("[db] listServiceRepairsFromDb:", err?.message);
    return [];
  }
}

async function updateServiceRepairInDb(id, patch = {}, opts = {}) {
  if (!USE_POSTGRES || !id) return null;
  const allowed = {
    category:           { col: "category" },
    reasonCode:         { col: "reason_code" },
    description:        { col: "description" },
    status:             { col: "status" },
    scheduledDate:      { col: "scheduled_date" },
    scheduledTime:      { col: "scheduled_time" },
    assignedCrew:       { col: "assigned_crew" },
    completedAt:        { col: "completed_at", date: true },
    workReportId:       { col: "work_report_id" },
    photos:             { col: "photos", json: true },
    costOwner:          { col: "cost_owner" },
    estimatedCostEur:   { col: "estimated_cost_eur" },
    invoiceAmountEur:   { col: "invoice_amount_eur" },
    notes:              { col: "notes" },
  };
  const sets = [];
  const params = [];
  for (const [key, def] of Object.entries(allowed)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    const v = patch[key];
    params.push(def.json ? JSON.stringify(v || []) : def.date && v ? new Date(v).toISOString() : v);
    sets.push(`${def.col} = $${params.length}${def.json ? "::jsonb" : ""}`);
  }
  if (!sets.length) return await getServiceRepairFromDb(id);
  sets.push("updated_at = NOW()");
  params.push(String(id));
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    await pool.query(`UPDATE service_repairs SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    return await getServiceRepairFromDb(id);
  } catch (err) {
    console.warn("[db] updateServiceRepairInDb:", err?.message);
    if (opts.rethrow) throw err;
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Events — eventi puntuali del cantiere (departure → arrival → work_start → return)
// ─────────────────────────────────────────────────────────────────────────────

const JOB_EVENT_TYPES = new Set([
  "departure", "arrival", "work_start", "work_end", "return", "issue", "note",
]);

function dbRowToJobEvent(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    orderId: row.order_id || "",
    installationId: row.installation_id || "",
    eventType: row.event_type || "",
    occurredAt: row.occurred_at ? new Date(row.occurred_at).toISOString() : null,
    userId: row.user_id || null,
    userName: row.user_name || "",
    crewName: row.crew_name || "",
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    gpsAccuracyM: row.gps_accuracy_m != null ? Number(row.gps_accuracy_m) : null,
    photos: Array.isArray(row.photos) ? row.photos : [],
    notes: row.notes || "",
    source: row.source || "manual",
    deviceId: row.device_id || "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

async function insertJobEvent(orderId, eventType, ctx = {}) {
  if (!USE_POSTGRES || !orderId) throw new Error("insertJobEvent: orderId required");
  if (!JOB_EVENT_TYPES.has(eventType)) throw new Error(`invalid event_type: ${eventType}`);
  await ensureRelationalSchema();
  const pool = await getPgPool();
  const occurredAt = ctx.occurredAt ? new Date(ctx.occurredAt) : new Date();
  const { rows } = await pool.query(
    `INSERT INTO job_events
      (order_id, installation_id, event_type, occurred_at, user_id, user_name, crew_name,
       lat, lng, gps_accuracy_m, photos, notes, source, ip_address, user_agent, device_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      String(orderId),
      String(ctx.installationId || "") || null,
      eventType,
      occurredAt.toISOString(),
      String(ctx.userId || "") || null,
      String(ctx.userName || "") || null,
      String(ctx.crewName || "") || null,
      ctx.lat != null ? Number(ctx.lat) : null,
      ctx.lng != null ? Number(ctx.lng) : null,
      ctx.gpsAccuracyM != null ? Number(ctx.gpsAccuracyM) : null,
      JSON.stringify(Array.isArray(ctx.photos) ? ctx.photos : []),
      String(ctx.notes || "") || null,
      String(ctx.source || "manual"),
      String(ctx.ipAddress || "") || null,
      String(ctx.userAgent || "").slice(0, 500) || null,
      String(ctx.deviceId || "") || null,
    ],
  );
  return dbRowToJobEvent(rows[0]);
}

async function listJobEventsForOrder(orderId) {
  if (!USE_POSTGRES || !orderId) return [];
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const { rows } = await pool.query(
      `SELECT * FROM job_events WHERE order_id = $1 ORDER BY occurred_at ASC`,
      [String(orderId)],
    );
    return rows.map(dbRowToJobEvent);
  } catch (err) {
    console.warn("[db] listJobEventsForOrder:", err?.message);
    return [];
  }
}

/**
 * Eventi del giorno corrente raggruppati per ordine.
 * Usato dalla view "Cantieri Live" office.
 */
async function listLiveJobEventsToday({ crewName = null } = {}) {
  if (!USE_POSTGRES) return [];
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    // Finestra: ultimi 24h (più tollerante per timezone server UTC vs Roma)
    const sinceTs = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const params = [sinceTs];
    let sql = `SELECT * FROM job_events WHERE occurred_at >= $1`;
    if (crewName) {
      params.push(String(crewName));
      sql += ` AND crew_name = $${params.length}`;
    }
    sql += ` ORDER BY occurred_at ASC LIMIT 2000`;
    const { rows } = await pool.query(sql, params);
    console.log(`[db] listLiveJobEventsToday: sinceTs=${sinceTs} crew=${crewName || "(any)"} found=${rows.length}`);
    return rows.map(dbRowToJobEvent);
  } catch (err) {
    console.warn("[db] listLiveJobEventsToday:", err?.message);
    return [];
  }
}

// ——— Coverage Planner in SQL (tabella settings, key='coverage_planner') ———

async function getCoveragePlannerFromDb() {
  if (!USE_POSTGRES) return null;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const { rows } = await pool.query("SELECT value FROM settings WHERE key='coverage_planner'");
    return rows[0]?.value || null;
  } catch (err) {
    console.warn("[db] getCoveragePlannerFromDb:", err?.message);
    return null;
  }
}

async function saveCoveragePlannerToDb(data) {
  if (!USE_POSTGRES || !data) return;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    await pool.query(
      `INSERT INTO settings (key, value, updated_at) VALUES ('coverage_planner', $1::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE SET value=$1::jsonb, updated_at=NOW()`,
      [JSON.stringify(data)]
    );
  } catch (err) {
    console.warn("[db] saveCoveragePlannerToDb:", err?.message);
  }
}

async function writeAuditLog(entityType, entityId, action, diff, userId) {
  if (!USE_POSTGRES || !entityId) return;
  try {
    const pool = await getPgPool();
    await pool.query(
      "INSERT INTO audit_log (entity_type, entity_id, user_id, action, diff) VALUES ($1,$2,$3,$4,$5)",
      [String(entityType), String(entityId), userId ? String(userId) : null, String(action), JSON.stringify(diff || {})],
    );
  } catch (err) {
    console.warn("[db] writeAuditLog:", err?.message);
  }
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
    `INSERT INTO app_documents (key, payload, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
    [key, JSON.stringify(value)],
  );
  // Notifica tutte le istanze del cambio store (LISTEN/NOTIFY cross-instance)
  if (key === STORE_DOC_KEY) {
    const revision = getStoreRevision(value) || buildStoreRevisionToken();
    try {
      await pool.query("SELECT pg_notify('psi_ops_store_changed', $1)", [String(revision)]);
    } catch {}
  }
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
  if (resolvedPath === resolve(STORE_PATH)) {
    // Usa la cache in memoria se disponibile — evita round-trip DB su ogni API call
    if (storeMemCache !== null) return storeMemCache;
    let payload;
    if (USE_POSTGRES) {
      payload = await readDatabaseDocument(STORE_DOC_KEY, fallback);
    } else {
      payload = await readLocalJson(path, fallback);
    }
    if (payload && typeof payload === "object") ensureStoreRevision(payload);
    storeMemCache = payload;
    return payload;
  }
  if (USE_POSTGRES && resolvedPath === resolve(SESSION_PATH)) {
    return readDatabaseDocument(SESSION_DOC_KEY, fallback);
  }
  return readLocalJson(path, fallback);
}

async function writeJson(path, value) {
  const resolvedPath = resolve(path);
  const isStorePayload = resolvedPath === resolve(STORE_PATH);
  if (isStorePayload && value && typeof value === "object") {
    rotateStoreRevision(value);
    // Il dato che scriviamo è già normalizzato — mantieni il flag per saltare
    // la prossima reconcileStoreData (evita O(N) su ogni request successiva)
    if (storeMemCache?.__memReconciled) value.__memReconciled = true;
    storeMemCache = value; // aggiorna cache in memoria
  }
  if (USE_POSTGRES && isStorePayload) {
    await writeDatabaseDocument(STORE_DOC_KEY, value);
    queuePostgresMirrorWrite(path, value);
    broadcastStoreRevision(getStoreRevision(value));
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
    .replace(/\s*-\s*\d+(?:[.,]\d+)?\s*m\s*[/x]\s*\d+(?:[.,]\d+)?\s*m?\s*$/i, "")
    .replace(/\s*-\s*\d+\s*(?:m|mq|cm)?\s*$/i, "")
    .trim()
    .toLowerCase();
}

const INVENTORY_PIECE_STATES = new Set(["disponibile", "impegnato", "evaso"]);

function normalizeInventoryFamilyKey(value = "") {
  return normalizeInventoryProductKey(value)
    .replace(/\b\d+(?:[.,]\d+)?\s*mm\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Returns a material family key for fuzzy matching between inventory and order
// product names (e.g. "CIOTTOLO BIANCO 2 KG" → "ciottolo-bianco" matches
// "Ciottolo bianco 25/40 - 25 lt"). Returns null for non-material names.
function normalizeMaterialFamily(value = "") {
  const s = String(value || "").toLowerCase();
  if (/ciottol/.test(s) && /nero/.test(s)) return "ciottolo-nero";
  if (/ciottol/.test(s) && /rosso/.test(s)) return "ciottolo-rosso";
  if (/ciottol/.test(s)) return "ciottolo-bianco";
  if (/lapillo/.test(s)) return "lapillo-rosso";
  if (/pietrisco/.test(s)) return "pietrisco";
  if (/sabbia/.test(s)) return "sabbia";
  if (/graniglia/.test(s)) return "graniglia";
  if (/bordura/.test(s)) return "bordura-pvc";
  if (/banda|giunzione/.test(s)) return "banda";
  if (/monocomponente/.test(s)) return "monocomponente";
  if (/colla|bi.?component/.test(s)) return "colla";
  if (/telo/.test(s)) return "telo";
  if (/picchetti/.test(s)) return "picchetti";
  if (/detergente/.test(s)) return "detergente";
  if (/spazzolatri/.test(s)) return "spazzolatrice";
  if (/spazzola/.test(s)) return "spazzola";
  if (/mattonella/.test(s)) return "mattonella";
  if (/profumo/.test(s)) return "profumo";
  return null;
}

function normalizeInventoryPieceType(value = "") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "residuo") return "residuo";
  if (normalized === "taglio") return "taglio";
  return "intero";
}

function normalizeInventoryPieceState(value = "", fallback = "disponibile") {
  const normalized = String(value || "").trim().toLowerCase();
  if (INVENTORY_PIECE_STATES.has(normalized)) return normalized;
  if (["available", "free", "libero"].includes(normalized)) return "disponibile";
  if (["committed", "reserved", "allocated", "prenotato"].includes(normalized)) return "impegnato";
  if (["fulfilled", "consumed", "used", "scaricato"].includes(normalized)) return "evaso";
  return INVENTORY_PIECE_STATES.has(fallback) ? fallback : "disponibile";
}

function inferInventoryPieceDimensions(item = {}) {
  const width = toNumber(item.width || 0);
  const length = toNumber(item.length || 0);
  const sqm = toNumber(item.sqm || (width * length));
  if (width && length) {
    return { width, length, sqm: sqm || Number((width * length).toFixed(2)) };
  }

  const text = [item.product, item.variant, item.note].filter(Boolean).join(" ");
  const explicitDimensions = extractInventoryDimensions(text);
  if (explicitDimensions) return explicitDimensions;

  const looksLikeMeasuredRoll = /telo|pacciamatura|isolante|tasso|bonsai|faggio|betulla|acero|cedro|rovere|palma|cipresso|abete|ginepro|mogano/i.test(text);
  const fallbackWidth = /banda|giunzione/i.test(text)
    ? 0.3
    : (sqm > 0 || looksLikeMeasuredRoll ? 2 : 0);
  if (sqm > 0 && fallbackWidth) {
    return {
      width: fallbackWidth,
      length: Number((sqm / fallbackWidth).toFixed(2)),
      sqm: Number(sqm.toFixed(2)),
    };
  }

  if (/telo|pacciamatura|isolante/i.test(text)) return { width: 2, length: 50, sqm: 100 };
  if (/banda|giunzione/i.test(text)) return { width: 0.3, length: 25, sqm: 7.5 };
  return { width: 0, length: 0, sqm };
}

function buildInventoryPieceLabel(piece = {}) {
  const { width, length } = inferInventoryPieceDimensions(piece);
  if (width && length) return `${width} x ${length}`;
  if (piece.variant) return String(piece.variant);
  return String(piece.product || "Pezzo");
}

function normalizeInventoryPieceRecord(item = {}) {
  const pieceType = normalizeInventoryPieceType(item.pieceType || item.status);
  const { width, length, sqm } = inferInventoryPieceDimensions(item);
  const units = Math.max(1, Math.round(toNumber(item.units || 1)));
  return {
    id: item.id || randomUUID(),
    product: String(item.product || "").trim(),
    width,
    length,
    sqm: Number(sqm.toFixed ? sqm.toFixed(2) : sqm),
    variant: String(item.variant || ""),
    status: pieceType === "taglio" ? "residuo" : pieceType,
    pieceType,
    pieceState: normalizeInventoryPieceState(item.pieceState || item.availability || item.stockState, "disponibile"),
    committedOrderId: String(item.committedOrderId || item.orderId || ""),
    committedOrderNumber: String(item.committedOrderNumber || ""),
    allocationId: String(item.allocationId || ""),
    parentPieceId: String(item.parentPieceId || ""),
    residueFromPieceId: String(item.residueFromPieceId || ""),
    fulfilledAt: String(item.fulfilledAt || ""),
    committedAt: String(item.committedAt || ""),
    note: String(item.note || ""),
    units,
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

function backfillInventoryIds(store = {}) {
  let changed = false;
  for (const piece of (store.inventory || [])) {
    if (!piece.id) { piece.id = randomUUID(); changed = true; }
  }
  return changed;
}

function normalizeInventoryAllocationRecord(item = {}) {
  const { width, length, sqm } = inferInventoryPieceDimensions(item);
  const units = Math.max(1, Math.round(toNumber(item.units || 1)));
  const requiredPieceCount = Math.max(1, Math.round(toNumber(item.requiredPieceCount || item.pieceCount || 1)));
  const requiredPieceLength = toNumber(item.requiredPieceLength || item.pieceLength || length);
  return {
    id: String(item.id || randomUUID()),
    pieceId: String(item.pieceId || ""),
    sourcePieceId: String(item.sourcePieceId || item.pieceId || ""),
    residuePieceId: String(item.residuePieceId || ""),
    product: String(item.product || "").trim(),
    width,
    length,
    sqm: Number(sqm.toFixed ? sqm.toFixed(2) : sqm),
    units,
    requiredPieceCount,
    requiredPieceLength,
    requiredPieceSqm: Number(toNumber(item.requiredPieceSqm || (width * requiredPieceLength)).toFixed(2)),
    requestLabel: String(item.requestLabel || ""),
    sourcePieceLabel: String(item.sourcePieceLabel || item.pieceLabel || ""),
    pieceType: normalizeInventoryPieceType(item.pieceType || item.status),
    action: ["use", "cut", "partial-units"].includes(String(item.action || "")) ? String(item.action) : "use",
    status: normalizeInventoryPieceState(item.status || item.pieceState, "impegnato"),
    note: String(item.note || ""),
    createdAt: String(item.createdAt || new Date().toISOString()),
    committedAt: String(item.committedAt || item.createdAt || new Date().toISOString()),
    fulfilledAt: String(item.fulfilledAt || ""),
  };
}

function runExclusiveApiWrite(task) {
  const nextRun = processApiWriteQueue.catch(() => {}).then(task);
  processApiWriteQueue = nextRun.catch((err) => { console.error("[api-write-queue]", err?.message || err); });
  return nextRun;
}

function runExclusiveSessionWrite(task) {
  const nextRun = processSessionWriteQueue.catch(() => {}).then(task);
  processSessionWriteQueue = nextRun.catch((err) => { console.error("[session-write-queue]", err?.message || err); });
  return nextRun;
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTBOX — Persistent retry queue (Step 1)
//
// Sostituisce il pattern `criticalOp().catch(() => {})` con un sistema dove
// ogni fallimento è persistito in tabella `outbox` e ritentato con backoff.
// Dopo `max_attempts` (default 5) il job va in `dead`.
//
// Uso (in Step 2):
//   await enqueueOrRunOutboxJob("upsert_sales_request", { request, userId });
//   // tenta sync; se fallisce, enqueue e ritorna senza throw
//
// Registry handlers: OUTBOX_HANDLERS (popolato in Step 2 vicino agli use case).
// ─────────────────────────────────────────────────────────────────────────────

const OUTBOX_HANDLERS = Object.create(null);

function registerOutboxHandler(jobType, handler) {
  if (typeof handler !== "function") throw new TypeError(`outbox handler for "${jobType}" non è una funzione`);
  OUTBOX_HANDLERS[jobType] = handler;
}

// Backoff: 1m, 5m, 30m, 2h, 8h. Indici fuori range usano l'ultimo (8h).
const OUTBOX_BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 3600_000, 8 * 3600_000];

function computeOutboxNextAttempt(attempts) {
  const idx = Math.min(Math.max(0, attempts - 1), OUTBOX_BACKOFF_MS.length - 1);
  const base = OUTBOX_BACKOFF_MS[idx];
  // Jitter ±20% per evitare thundering herd su retry simultanei.
  const jitter = base * (Math.random() * 0.4 - 0.2);
  return new Date(Date.now() + base + jitter);
}

async function enqueueOutboxJob(jobType, payload, { maxAttempts } = {}) {
  if (!USE_POSTGRES) {
    console.warn(`[outbox] enqueue ignorato (no Postgres): ${jobType}`);
    return null;
  }
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const result = await pool.query(
      `INSERT INTO outbox (job_type, payload, max_attempts)
       VALUES ($1, $2::jsonb, $3)
       RETURNING id`,
      [String(jobType), JSON.stringify(payload || {}), Number(maxAttempts || 5)],
    );
    const id = result.rows[0]?.id || null;
    console.log(`[outbox] enqueued #${id} type=${jobType}`);
    // Trigger immediato senza aspettare il prossimo tick del processor.
    setImmediate(() => { processOutboxOnce().catch((err) => console.error("[outbox] process error:", err?.message || err)); });
    return id;
  } catch (err) {
    // Se non riusciamo neppure a salvare in outbox, è il caso peggiore:
    // log a livello "critical" così è visibile nei log Render.
    console.error(`[outbox][CRITICAL] enqueue failed type=${jobType}:`, err?.message || err);
    return null;
  }
}

/**
 * Tenta `runner()` sincrono. Se solleva, enqueue il job in outbox per retry.
 * Non rilancia mai: i call sites che oggi fanno .catch(()=>{}) continuano a funzionare,
 * ma ora il fallimento è tracciato invece di sparire.
 */
async function enqueueOrRunOutboxJob(jobType, payload, runner) {
  try {
    return await runner(payload);
  } catch (err) {
    console.warn(`[outbox] sync run failed type=${jobType}, enqueuing for retry:`, err?.message || err);
    await enqueueOutboxJob(jobType, payload);
    return null;
  }
}

let _outboxProcessorTimer = null;
let _outboxProcessing = false;

async function processOutboxOnce() {
  if (!USE_POSTGRES) return { processed: 0, failed: 0 };
  if (_outboxProcessing) return { processed: 0, failed: 0, skipped: true };
  _outboxProcessing = true;
  let processed = 0;
  let failed = 0;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    // Loop fino a esaurimento (max 50 job per tick per non bloccare).
    for (let i = 0; i < 50; i++) {
      const client = await pool.connect();
      let job = null;
      try {
        await client.query("BEGIN");
        // FOR UPDATE SKIP LOCKED → pattern PG-queue safe-against-concurrent-workers.
        const pick = await client.query(
          `SELECT id, job_type, payload, attempts, max_attempts
             FROM outbox
            WHERE status = 'pending' AND next_attempt_at <= NOW()
            ORDER BY id ASC
            LIMIT 1 FOR UPDATE SKIP LOCKED`,
        );
        if (!pick.rowCount) {
          await client.query("COMMIT");
          break;
        }
        job = pick.rows[0];
        await client.query(
          `UPDATE outbox SET status = 'processing', updated_at = NOW() WHERE id = $1`,
          [job.id],
        );
        await client.query("COMMIT");
      } catch (err) {
        try { await client.query("ROLLBACK"); } catch {}
        console.error("[outbox] pick failed:", err?.message || err);
        break;
      } finally {
        client.release();
      }

      if (!job) break;
      const handler = OUTBOX_HANDLERS[job.job_type];
      if (!handler) {
        // Job type sconosciuto → manda in dead per evitare loop infiniti.
        await pool.query(
          `UPDATE outbox SET status = 'dead', last_error = $2, updated_at = NOW(), done_at = NOW() WHERE id = $1`,
          [job.id, `unknown handler: ${job.job_type}`],
        );
        console.error(`[outbox] dead #${job.id}: unknown handler "${job.job_type}"`);
        failed++;
        continue;
      }

      try {
        await handler(job.payload || {});
        await pool.query(
          `UPDATE outbox SET status = 'done', updated_at = NOW(), done_at = NOW(), attempts = attempts + 1 WHERE id = $1`,
          [job.id],
        );
        processed++;
        console.log(`[outbox] done #${job.id} type=${job.job_type}`);
      } catch (err) {
        const attempts = (job.attempts || 0) + 1;
        const maxAttempts = job.max_attempts || 5;
        if (attempts >= maxAttempts) {
          await pool.query(
            `UPDATE outbox SET status = 'dead', attempts = $2, last_error = $3, updated_at = NOW(), done_at = NOW() WHERE id = $1`,
            [job.id, attempts, String(err?.message || err).slice(0, 1000)],
          );
          console.error(`[outbox] DEAD #${job.id} type=${job.job_type} after ${attempts} attempts:`, err?.message || err);
          failed++;
        } else {
          const nextAt = computeOutboxNextAttempt(attempts);
          await pool.query(
            `UPDATE outbox SET status = 'pending', attempts = $2, next_attempt_at = $3,
                                last_error = $4, updated_at = NOW() WHERE id = $1`,
            [job.id, attempts, nextAt, String(err?.message || err).slice(0, 1000)],
          );
          console.warn(`[outbox] retry #${job.id} type=${job.job_type} attempt=${attempts}/${maxAttempts} next=${nextAt.toISOString()}`);
          failed++;
        }
      }
    }
  } finally {
    _outboxProcessing = false;
  }
  return { processed, failed };
}

function startOutboxProcessor(intervalMs = 30_000) {
  if (_outboxProcessorTimer) return;
  if (!USE_POSTGRES) {
    console.log("[outbox] processor disabilitato (no Postgres)");
    return;
  }
  // Tick iniziale dopo 5s (lascia respirare lo startup).
  setTimeout(() => {
    processOutboxOnce().catch((err) => console.error("[outbox] tick failed:", err?.message || err));
  }, 5_000);
  _outboxProcessorTimer = setInterval(() => {
    processOutboxOnce().catch((err) => console.error("[outbox] tick failed:", err?.message || err));
  }, intervalMs);
  console.log(`[outbox] processor avviato (tick=${intervalMs}ms)`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Registrazione handler outbox per sales_request (Step 2).
// Posizionati DOPO il blocco outbox per non incappare in TDZ su OUTBOX_HANDLERS.
// Payload: { request, userId } per upsert, { id } per delete.
// opts.rethrow=true forza il fallimento a propagarsi → la queue lo riprende
// invece di considerarlo "ok silenzioso".
// ─────────────────────────────────────────────────────────────────────────────
registerOutboxHandler("upsert_sales_request", async (payload = {}) => {
  const request = payload.request || null;
  const userId = payload.userId || null;
  if (!request?.id) throw new Error("upsert_sales_request: missing request.id in payload");
  await upsertSalesRequestToDb(request, userId, { rethrow: true });
});

registerOutboxHandler("delete_sales_request", async (payload = {}) => {
  const id = payload.id || null;
  if (!id) throw new Error("delete_sales_request: missing id in payload");
  await deleteSalesRequestFromDb(id, { rethrow: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Verbali fine cantiere — handler outbox per generazione PDF asincrona.
// Trigger: enqueue automatico dopo POST /api/work-reports/:id/sign.
// Flusso:
//   1. carica report DB
//   2. scarica firme + foto da R2 come Buffer
//   3. genera PDF con pdfkit (modulo lib/work-report-pdf.js)
//   4. calcola SHA-256 del PDF
//   5. upload PDF su R2 con key "work-reports/{id}/verbale-{id}.pdf"
//   6. archiveWorkReportInDb → status='archived'
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scarica un oggetto da R2 e lo ritorna come Buffer. NULL se R2 non configurato,
 * key vuota, o errore di rete. Helper riusabile per il PDF builder e altri usi.
 */
async function downloadR2ObjectAsBuffer(objectKey) {
  if (!USE_R2 || !objectKey) return null;
  try {
    const client = await getR2Client();
    const sdk = await getR2Sdk();
    const obj = await client.send(new sdk.GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: String(objectKey),
    }));
    const chunks = [];
    if (obj.Body?.[Symbol.asyncIterator]) {
      for await (const chunk of obj.Body) chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (err) {
    console.warn("[r2] download failed:", err?.message || err);
    return null;
  }
}

let _cachedLogoBuffer = null;
async function getCachedLogoBuffer() {
  if (_cachedLogoBuffer) return _cachedLogoBuffer;
  try {
    _cachedLogoBuffer = await readFile(resolve(ROOT, "logo-prato.png"));
    return _cachedLogoBuffer;
  } catch {
    return null;
  }
}

/**
 * Invia email al cliente con il PDF del verbale in allegato.
 * Best-effort: se Resend non configurato o email mancante, log warning e ritorna.
 * Non rilancia: il successo dell'archiviazione PDF non dipende dall'invio email.
 */
async function sendWorkReportEmailToCustomer({ report, pdfBuffer }) {
  if (!report?.customerEmail) {
    console.log(`[work-reports] email skip ${report?.id}: customer email mancante`);
    return { ok: false, reason: "missing_customer_email" };
  }
  if (!RESEND_API_KEY || !isValidEmailAddress(SALES_REQUEST_EMAIL_FROM)) {
    console.log(`[work-reports] email skip ${report.id}: Resend non configurato`);
    return { ok: false, reason: "missing_email_config" };
  }
  const recipient = cleanEmail(report.customerEmail);
  if (!isValidEmailAddress(recipient)) {
    return { ok: false, reason: "invalid_customer_email" };
  }
  const customerFirstName = String(report.customerName || "").split(/\s+/)[0] || "";
  const greeting = customerFirstName ? `Buongiorno ${customerFirstName},` : "Buongiorno,";
  const subject = `Verbale di fine lavori — ${report.id}`;
  const text =
    `${greeting}\n\n` +
    `in allegato trova il verbale di fine lavori (rif. ${report.id}) relativo all'installazione effettuata.\n` +
    `Il documento riassume le lavorazioni eseguite, eventuali extra concordati e le firme di consegna.\n\n` +
    `La ringraziamo per averci scelto.\n\n` +
    `Prato Sintetico Italia\n`;
  const html =
    `<p>${greeting}</p>` +
    `<p>in allegato trova il <strong>verbale di fine lavori</strong> (rif. ${report.id}) ` +
    `relativo all'installazione effettuata.</p>` +
    `<p>Il documento riassume le lavorazioni eseguite, eventuali extra concordati e le firme di consegna.</p>` +
    `<p>La ringraziamo per averci scelto.</p>` +
    `<p><em>Prato Sintetico Italia</em></p>`;
  const payload = {
    from: SALES_REQUEST_EMAIL_FROM,
    to: [recipient],
    subject,
    text,
    html,
    attachments: [
      {
        filename: `verbale-${report.id}.pdf`,
        content: Buffer.from(pdfBuffer).toString("base64"),
      },
    ],
  };
  if (isValidEmailAddress(SALES_REQUEST_EMAIL_REPLY_TO)) payload.reply_to = SALES_REQUEST_EMAIL_REPLY_TO;
  try {
    const response = await fetchWithTimeout(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      SALES_REQUEST_EMAIL_TIMEOUT_MS,
    );
    const raw = await response.text().catch(() => "");
    if (!response.ok) {
      console.warn(`[work-reports] email FAIL ${report.id}: HTTP ${response.status} ${raw.slice(0, 200)}`);
      return { ok: false, reason: "provider_error", statusCode: response.status };
    }
    console.log(`[work-reports] email sent ${report.id} → ${recipient}`);
    return { ok: true };
  } catch (err) {
    console.warn(`[work-reports] email exception ${report.id}:`, err?.message || err);
    return { ok: false, reason: "exception", error: String(err?.message || err) };
  }
}

registerOutboxHandler("generate_work_report_pdf", async (payload = {}) => {
  const id = payload.workReportId || null;
  if (!id) throw new Error("generate_work_report_pdf: missing workReportId");
  const report = await getWorkReportFromDb(id);
  if (!report) throw new Error(`generate_work_report_pdf: report not found: ${id}`);
  if (report.status !== "signed") {
    // Idempotenza: già archived o tornato a draft? non rifare.
    console.log(`[work-reports] PDF skip ${id} status=${report.status}`);
    return;
  }
  const logoBuffer = await getCachedLogoBuffer();
  const pdfBuffer = await generateWorkReportPdf(report, {
    fetchR2Buffer: downloadR2ObjectAsBuffer,
    logoBuffer,
  });
  const sha256 = createHash("sha256").update(pdfBuffer).digest("hex");
  const objectKey = `work-reports/${id}/verbale-${id}.pdf`;
  if (USE_R2) {
    const client = await getR2Client();
    const sdk = await getR2Sdk();
    await client.send(new sdk.PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ContentLength: pdfBuffer.length,
    }));
  } else {
    console.warn("[work-reports] R2 disabled, PDF non archiviato:", id);
  }
  const archived = await archiveWorkReportInDb(id, {
    documentPdfR2Key: objectKey,
    documentPdfSha256: sha256,
  }, { rethrow: true });
  console.log(`[work-reports] archived ${id} (${pdfBuffer.length} bytes, sha256=${sha256.slice(0,12)}...)`);
  // Invio email cliente: best-effort, non blocca il successo dell'handler.
  // Se fallisce, è log-only — il PDF è già archiviato e scaricabile dal portale.
  try {
    await sendWorkReportEmailToCustomer({ report: archived || report, pdfBuffer });
  } catch (err) {
    console.warn(`[work-reports] email send failed (non-fatal) ${id}:`, err?.message || err);
  }
});

async function getOutboxStats() {
  if (!USE_POSTGRES) return null;
  try {
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const result = await pool.query(`
      SELECT status, COUNT(*)::int AS count,
             MIN(created_at) AS oldest_created_at,
             MAX(updated_at) AS most_recent_updated_at
        FROM outbox
       GROUP BY status
    `);
    const stats = { pending: 0, processing: 0, done: 0, dead: 0, oldestPendingAge: null };
    for (const row of result.rows) {
      stats[row.status] = row.count;
      if (row.status === "pending" && row.oldest_created_at) {
        stats.oldestPendingAge = Math.floor((Date.now() - new Date(row.oldest_created_at).getTime()) / 1000);
      }
    }
    return stats;
  } catch (err) {
    console.error("[outbox] stats failed:", err?.message || err);
    return null;
  }
}

async function readSessionEntry(sessionId = "") {
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId) return null;
  await processSessionWriteQueue.catch(() => {});
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
  if (!normalizedSessionId) return;
  return runExclusiveSessionWrite(async () => {
    const normalizedEntry = normalizeSessionEntry(entry);
    if (!normalizedEntry) return;
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
  });
}

async function deleteSessionEntry(sessionId = "") {
  const normalizedSessionId = String(sessionId || "").trim();
  if (!normalizedSessionId) return;
  return runExclusiveSessionWrite(async () => {
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
  });
}

async function withApiStateLock(task, { timeoutMs = API_STATE_LOCK_TIMEOUT_MS, queue = true } = {}) {
  const runWithDatabaseLock = async () => {
    if (!USE_POSTGRES) {
      return task();
    }
    const pool = await getPgPool();
    const lockClient = await pool.connect();
    let locked = false;
    try {
      const normalizedTimeoutMs = Math.max(API_STATE_LOCK_POLL_MS, Number(timeoutMs || API_STATE_LOCK_TIMEOUT_MS));
      const deadline = Date.now() + normalizedTimeoutMs;
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
  };
  if (queue || !USE_POSTGRES) {
    return runExclusiveApiWrite(runWithDatabaseLock);
  }
  return runWithDatabaseLock();
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
    marketingPublicAssets: [],
    usageEvents: [],
    salesRequestSource: {
      spreadsheetInput: DEFAULT_SALES_REQUEST_SPREADSHEET,
      sheetName: "",
      serviceAccountEmail: "",
      privateKey: "",
    },
    coveragePlanner: {
      teams: {},
      availability: {},
      archivedTeams: [],
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

function getCommunicationUserLabel(user = {}) {
  return String(user.name || user.email || user.id || "").trim();
}

function sanitizeCommunicationUser(user) {
  const sanitized = sanitizeUser(user);
  if (!sanitized) return null;
  return {
    id: sanitized.id,
    name: sanitized.name,
    email: sanitized.email,
    role: sanitized.role,
    crewName: sanitized.crewName,
  };
}

function canStartPrivateCommunication(currentUser = null, targetUser = null) {
  if (!currentUser || !targetUser) return false;
  if (String(currentUser.id || "") === String(targetUser.id || "")) return false;
  if (targetUser.status === "suspended") return false;
  const currentRole = normalizeUserRole(currentUser.role) || "office";
  const targetRole = normalizeUserRole(targetUser.role) || "office";
  if (currentRole === "office") return true;
  if (currentRole === "warehouse") return ["office", "crew"].includes(targetRole);
  if (currentRole === "crew") return targetRole === "office";
  return false;
}

function normalizeCommunicationThread(thread = {}) {
  const participants = Array.isArray(thread.participantIds)
    ? thread.participantIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  const uniqueParticipants = Array.from(new Set(participants)).slice(0, 2);
  if (uniqueParticipants.length !== 2) return null;
  return {
    id: String(thread.id || randomUUID()),
    type: "private",
    participantIds: uniqueParticipants,
    createdAt: String(thread.createdAt || new Date().toISOString()),
    updatedAt: String(thread.updatedAt || thread.createdAt || new Date().toISOString()),
    lastMessagePreview: String(thread.lastMessagePreview || "").slice(0, 160),
  };
}

function normalizeCommunicationMessage(message = {}) {
  const body = String(message.body || "").trim();
  if (!body) return null;
  return {
    id: String(message.id || randomUUID()),
    threadId: String(message.threadId || "").trim(),
    authorId: String(message.authorId || "").trim(),
    body: body.slice(0, 2000),
    createdAt: String(message.createdAt || new Date().toISOString()),
    readBy: Array.isArray(message.readBy)
      ? Array.from(new Set(message.readBy.map((id) => String(id || "").trim()).filter(Boolean)))
      : [],
  };
}

function normalizeCommunicationsStore(value = {}) {
  return {
    threads: Array.isArray(value.threads) ? value.threads.map(normalizeCommunicationThread).filter(Boolean) : [],
    messages: Array.isArray(value.messages) ? value.messages.map(normalizeCommunicationMessage).filter(Boolean) : [],
  };
}

function getCommunicationThreadForUser(store, currentUser, threadId = "") {
  const communications = normalizeCommunicationsStore(store.communications || {});
  const userId = String(currentUser?.id || "");
  return communications.threads.find((thread) => thread.id === String(threadId || "") && thread.participantIds.includes(userId)) || null;
}

function serializeCommunicationThread(store, currentUser, thread = {}) {
  const communications = normalizeCommunicationsStore(store.communications || {});
  const users = Array.isArray(store.users) ? store.users : [];
  const userId = String(currentUser?.id || "");
  const otherUserId = (thread.participantIds || []).find((id) => id !== userId) || "";
  const otherUser = users.find((user) => String(user.id || "") === otherUserId) || null;
  const messages = communications.messages.filter((message) => message.threadId === thread.id);
  const unreadCount = messages.filter((message) => message.authorId !== userId && !message.readBy.includes(userId)).length;
  const lastMessage = messages.slice().sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))).at(-1) || null;
  return {
    ...thread,
    otherUser: sanitizeCommunicationUser(otherUser),
    unreadCount,
    lastMessagePreview: String(lastMessage?.body || thread.lastMessagePreview || "").slice(0, 160),
    updatedAt: String(lastMessage?.createdAt || thread.updatedAt || ""),
  };
}

function getAllowedCommunicationTargets(store, currentUser) {
  return (Array.isArray(store.users) ? store.users : [])
    .filter((user) => canStartPrivateCommunication(currentUser, user))
    .map(sanitizeCommunicationUser)
    .filter(Boolean)
    .sort((a, b) => getCommunicationUserLabel(a).localeCompare(getCommunicationUserLabel(b), "it"));
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

async function sendPushToUser(store, userId, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const subscriptions = (store.pushSubscriptions || []).filter((s) => s.userId === String(userId));
  const dead = [];
  await Promise.allSettled(subscriptions.map(async (sub) => {
    try {
      await webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) dead.push(sub.endpoint);
    }
  }));
  if (dead.length) {
    store.pushSubscriptions = (store.pushSubscriptions || []).filter((s) => !dead.includes(s.endpoint));
    writeJson(STORE_PATH, store).catch(() => {});
  }
}

async function sendPushToRole(store, role, payload, exceptUserId = null) {
  const users = store.users.filter((u) => u.role === role && u.id !== exceptUserId && u.status === "active");
  await Promise.allSettled(users.map((u) => sendPushToUser(store, u.id, payload)));
}

async function sendPushToCrewName(store, crewName, payload) {
  const norm = normalizeCrewName(crewName);
  if (!norm) return;
  const users = store.users.filter((u) => u.role === "crew" && u.status === "active" && normalizeCrewName(u.crewName || u.name) === norm);
  await Promise.allSettled(users.map((u) => sendPushToUser(store, u.id, payload)));
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

const USAGE_EVENT_TYPES = new Set([
  "portal_login",
  "quote_generator_opened",
  "quote_prefill_applied",
  "quote_pdf_exported",
  "quote_export_failed",
  "quote_whatsapp_opened",
  "quote_email_opened",
  "order_modified",
  "sales_request_modified",
  "inventory_added",
  "inventory_modified",
  "attachment_uploaded",
  "ddt_generated",
  "installation_assigned",
  "session_heartbeat",
  "system_error",
]);

function normalizeUsageEventType(type = "") {
  const normalized = String(type || "").trim().toLowerCase().replace(/[^a-z0-9_:-]+/g, "_");
  return USAGE_EVENT_TYPES.has(normalized) ? normalized : "";
}

function normalizeUsageDeviceType(userAgent = "", clientDevice = "") {
  const explicit = String(clientDevice || "").trim().toLowerCase();
  if (["mobile", "tablet", "desktop"].includes(explicit)) return explicit;
  const ua = String(userAgent || "").toLowerCase();
  if (/ipad|tablet|kindle/.test(ua)) return "tablet";
  if (/mobile|iphone|android.*mobile|windows phone/.test(ua)) return "mobile";
  if (ua) return "desktop";
  return "unknown";
}

function sanitizeUsageMeta(meta = {}) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  return Object.entries(meta).slice(0, 12).reduce((acc, [key, value]) => {
    const safeKey = String(key || "").trim().replace(/[^a-zA-Z0-9_-]+/g, "").slice(0, 40);
    if (!safeKey) return acc;
    if (typeof value === "boolean") {
      acc[safeKey] = value;
      return acc;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      acc[safeKey] = value;
      return acc;
    }
    const text = String(value ?? "").trim();
    if (text) acc[safeKey] = text.slice(0, 160);
    return acc;
  }, {});
}

function normalizeUsageEventRecord(event = {}) {
  const type = normalizeUsageEventType(event.type);
  if (!type) return null;
  const createdAt = new Date(event.createdAt || Date.now());
  return {
    id: String(event.id || randomUUID()),
    type,
    userId: String(event.userId || ""),
    userName: String(event.userName || ""),
    userEmail: String(event.userEmail || ""),
    userRole: normalizeUserRole(event.userRole || "") || "office",
    deviceType: normalizeUsageDeviceType("", event.deviceType),
    sourceView: String(event.sourceView || "").trim().slice(0, 80),
    meta: sanitizeUsageMeta(event.meta || {}),
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
  };
}

function recordUsageEvent(store, currentUser, req, body = {}) {
  const type = normalizeUsageEventType(body.type);
  if (!type || !currentUser) return null;
  store.usageEvents = Array.isArray(store.usageEvents) ? store.usageEvents : [];
  const event = normalizeUsageEventRecord({
    id: randomUUID(),
    type,
    userId: currentUser.id,
    userName: currentUser.name,
    userEmail: currentUser.email,
    userRole: currentUser.role,
    deviceType: normalizeUsageDeviceType(req.headers["user-agent"], body.deviceType),
    sourceView: body.sourceView,
    meta: sanitizeUsageMeta(body.meta || {}),
    createdAt: new Date().toISOString(),
  });
  if (!event) return null;
  store.usageEvents.unshift(event);
  store.usageEvents = store.usageEvents.slice(0, 5000);
  return event;
}

function buildUsageReport(store) {
  const users = Array.isArray(store.users) ? store.users.map(sanitizeUser).filter(Boolean) : [];
  const events = Array.isArray(store.usageEvents)
    ? store.usageEvents.map(normalizeUsageEventRecord).filter(Boolean)
    : [];
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const since7 = now - (7 * dayMs);
  const since30 = now - (30 * dayMs);
  const buildUserRow = (user) => ({
    user,
    lastActivityAt: "",
    events7d: 0,
    events30d: 0,
    generatorOpens30d: 0,
    quoteExports30d: 0,
    contactActions30d: 0,
    exportErrors30d: 0,
    orderModifications30d: 0,
    salesRequestModifications30d: 0,
    inventoryAdds30d: 0,
    inventoryEdits30d: 0,
    attachmentsUploaded30d: 0,
    ddtGenerated30d: 0,
    installationsAssigned30d: 0,
    systemErrors30d: 0,
    sessionLogins30d: 0,
    heartbeats30d: 0,
    devices30d: { desktop: 0, mobile: 0, tablet: 0, unknown: 0 },
  });

  const byUser = new Map(users.map((user) => [String(user.id), buildUserRow(user)]));

  const totals = {
    activeUsers7d: 0,
    activeUsers30d: 0,
    generatorOpens30d: 0,
    quoteExports30d: 0,
    contactActions30d: 0,
    exportErrors30d: 0,
    orderModifications30d: 0,
    salesRequestModifications30d: 0,
    inventoryAdds30d: 0,
    inventoryEdits30d: 0,
    attachmentsUploaded30d: 0,
    ddtGenerated30d: 0,
    installationsAssigned30d: 0,
    systemErrors30d: 0,
    device30d: { desktop: 0, mobile: 0, tablet: 0, unknown: 0 },
  };
  const active7 = new Set();
  const active30 = new Set();

  events.forEach((event) => {
    const timestamp = new Date(event.createdAt).getTime();
    if (!Number.isFinite(timestamp)) return;
    const userId = String(event.userId || "");
    if (!byUser.has(userId)) {
      byUser.set(userId, buildUserRow({
        id: userId || "unknown",
        name: event.userName || "Account non trovato",
        email: event.userEmail || "",
        role: event.userRole || "office",
      }));
    }
    const row = byUser.get(userId);
    if (!row.lastActivityAt || timestamp > new Date(row.lastActivityAt).getTime()) row.lastActivityAt = event.createdAt;
    if (timestamp >= since7) {
      row.events7d += 1;
      active7.add(userId);
    }
    if (timestamp < since30) return;
    row.events30d += 1;
    active30.add(userId);
    const device = ["desktop", "mobile", "tablet"].includes(event.deviceType) ? event.deviceType : "unknown";
    row.devices30d[device] += 1;
    totals.device30d[device] += 1;
    if (event.type === "quote_generator_opened") {
      row.generatorOpens30d += 1;
      totals.generatorOpens30d += 1;
    }
    if (event.type === "quote_pdf_exported") {
      row.quoteExports30d += 1;
      totals.quoteExports30d += 1;
    }
    if (event.type === "quote_whatsapp_opened" || event.type === "quote_email_opened") {
      row.contactActions30d += 1;
      totals.contactActions30d += 1;
    }
    if (event.type === "quote_export_failed") {
      row.exportErrors30d += 1;
      totals.exportErrors30d += 1;
    }
    if (event.type === "order_modified") {
      row.orderModifications30d += 1;
      totals.orderModifications30d += 1;
    }
    if (event.type === "sales_request_modified") {
      row.salesRequestModifications30d += 1;
      totals.salesRequestModifications30d += 1;
    }
    if (event.type === "inventory_added") {
      row.inventoryAdds30d += 1;
      totals.inventoryAdds30d += 1;
    }
    if (event.type === "inventory_modified") {
      row.inventoryEdits30d += 1;
      totals.inventoryEdits30d += 1;
    }
    if (event.type === "attachment_uploaded") {
      row.attachmentsUploaded30d += 1;
      totals.attachmentsUploaded30d += 1;
    }
    if (event.type === "ddt_generated") {
      row.ddtGenerated30d += 1;
      totals.ddtGenerated30d += 1;
    }
    if (event.type === "installation_assigned") {
      row.installationsAssigned30d += 1;
      totals.installationsAssigned30d += 1;
    }
    if (event.type === "system_error") {
      row.systemErrors30d += 1;
      totals.systemErrors30d += 1;
    }
    if (event.type === "portal_login") {
      row.sessionLogins30d += 1;
    }
    if (event.type === "session_heartbeat") {
      row.heartbeats30d += 1;
    }
  });

  totals.activeUsers7d = active7.size;
  totals.activeUsers30d = active30.size;

  return {
    generatedAt: new Date().toISOString(),
    totals,
    users: Array.from(byUser.values())
      .sort((left, right) => {
        const rightTime = new Date(right.lastActivityAt || 0).getTime();
        const leftTime = new Date(left.lastActivityAt || 0).getTime();
        return rightTime - leftTime;
      }),
  };
}

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

/**
 * sendJson con gzip condizionale.
 * Prima di chiamare handleApi, il server imposta res.__acceptsGzip
 * basandosi sull'header Accept-Encoding del client.
 * Comprime se: payload >= 4KB E res.__acceptsGzip === true.
 * Riduce le risposte grandi (es. /api/session ~8-10 MB → ~450-600 KB).
 */
function sendJson(res, status, payload, headers = {}) {
  const body = JSON.stringify(payload);
  const securityHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self' https://*.myshopify.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  };
  if (res.__acceptsGzip && body.length >= 4096) {
    try {
      const compressed = gzipSync(body, { level: 6 });
      res.writeHead(status, {
        ...securityHeaders,
        ...headers,
        "Content-Encoding": "gzip",
        "Content-Length": String(compressed.length),
      });
      res.end(compressed);
      return;
    } catch {
      // fallback a risposta non compressa se gzip fallisce
    }
  }
  res.writeHead(status, {
    ...securityHeaders,
    ...headers,
    "Content-Length": String(Buffer.byteLength(body)),
  });
  res.end(body);
}

function sendRedirect(res, location, headers = {}) {
  res.writeHead(302, {
    Location: location,
    ...headers,
  });
  res.end();
}

function getStaticHeaders(contentType, { versioned = false, isHtml = false } = {}) {
  // Asset con ?v=... query string → immutable (il browser li scarica UNA SOLA VOLTA)
  // HTML → no-cache (controlla sempre il server, ma usa cache se non cambiato)
  // Tutto il resto → no-store (fallback sicuro)
  const cacheControl = versioned
    ? "public, max-age=31536000, immutable"
    : isHtml
      ? "no-cache"
      : "no-store";
  return {
    "Content-Type": contentType,
    "Cache-Control": cacheControl,
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

function getNextShopifyPageUrl(response) {
  const linkHeader = String(response?.headers?.get?.("link") || "").trim();
  if (!linkHeader) return "";
  const nextPart = linkHeader
    .split(",")
    .map((part) => part.trim())
    .find((part) => /rel="?next"?/i.test(part));
  const match = nextPart?.match(/<([^>]+)>/);
  return match ? match[1] : "";
}

function normalizeGoogleFetchError(error, phase = "sheets") {
  const rawMessage = String(error?.message || error || "").trim();
  const normalizedPhase = phase === "token" ? "google_token" : "google_sheets";
  const isTimeout = error?.name === "AbortError"
    || rawMessage === "AbortError"
    || /timeout|timed out|aborted/i.test(rawMessage);
  if (isTimeout) {
    return new Error(`${normalizedPhase}_timeout`);
  }
  const isNetwork = rawMessage === "fetch failed"
    || /network|enotfound|econnreset|eai_again|socket|failed to fetch/i.test(rawMessage);
  if (isNetwork) {
    return new Error(`${normalizedPhase}_network_error`);
  }
  return error instanceof Error ? error : new Error(rawMessage || `${normalizedPhase}_failed`);
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

function createHttpError(status = 500, message = "server_error") {
  const error = new Error(message);
  error.status = Number(status || 500);
  return error;
}

async function readBody(req, { maxBytes = MAX_JSON_BODY_BYTES } = {}) {
  const chunks = [];
  let receivedBytes = 0;
  for await (const chunk of req) {
    receivedBytes += chunk.length;
    if (receivedBytes > maxBytes) {
      throw createHttpError(413, "payload_too_large");
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw createHttpError(400, "invalid_json");
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

function extractInventoryDimensions(label = "") {
  const normalized = String(label || "").replace(/,/g, ".");
  if (/mm/i.test(normalized) && !/\b2\s*m\s*[/x]\s*\d+/i.test(normalized)) return null;
  // Require an explicit "m" unit on at least one side so "25/40" (granulometry)
  // or other bare ratios are not mistaken for dimensions.
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*m\s*[x/]\s*(\d+(?:\.\d+)?)\s*m?|(\d+(?:\.\d+)?)\s*[x/]\s*(\d+(?:\.\d+)?)\s*m\b/i);
  if (!match) return null;
  const width = toNumber(match[1] || match[3]);
  const length = toNumber(match[2] || match[4]);
  if (!width || !length) return null;
  return { width, length, sqm: Number((width * length).toFixed(2)) };
}

function getOrderPhysicalLines(order = {}) {
  const details = Array.isArray(order.lineDetails) && order.lineDetails.length
    ? order.lineDetails
    : normalizeStringLineDetails(order.lineItems || []);
  const persistedPrep = Array.isArray(order.operations?.warehouse?.prepItems)
    ? order.operations.warehouse.prepItems
    : [];
  const source = persistedPrep.length
    ? persistedPrep.filter((item) => item?.included !== false).map((item) => ({
        title: String(item.title || "").trim(),
        quantity: Math.max(1, Number(item.quantity || 1)),
        note: String(item.note || "").trim(),
      }))
    : details.filter((item) => item?.title && classifyOrderLine(item.title) !== "service").map((item) => ({
        title: String(item.title || "").trim(),
        quantity: Math.max(1, Number(item.quantity || 1)),
        note: String(item.note || "").trim(),
      }));
  return source.filter((item) => item.title);
}

function getInventoryProductAliases(title = "") {
  const raw = String(title || "");
  const aliases = [raw, normalizeInventoryProductKey(raw), normalizeInventoryFamilyKey(raw)].filter(Boolean);
  if (/telo|pacciamatura|isolante/i.test(raw)) aliases.push("telo");
  if (/banda|giunzione/i.test(raw)) aliases.push("banda");
  if (/colla/i.test(raw)) aliases.push("colla");
  if (/picchetti/i.test(raw)) aliases.push("picchetti");
  return [...new Set(aliases.map((item) => normalizeInventoryFamilyKey(item)).filter(Boolean))];
}

function resolveInventoryProductForLine(line = {}, order = {}, inventory = []) {
  const title = String(line.title || "").trim();
  const aliases = getInventoryProductAliases(title);
  const inventoryProducts = [...new Set((inventory || []).map((item) => String(item.product || "").trim()).filter(Boolean))];
  const matched = inventoryProducts.find((product) => {
    const productKey = normalizeInventoryFamilyKey(product);
    if (!productKey) return false;
    return aliases.some((alias) => alias === productKey || alias.includes(productKey) || productKey.includes(alias));
  });
  if (matched) return matched;
  if (classifyOrderLine(title) === "product") {
    const explicit = String(order.operations?.product || "").trim();
    return explicit || title.replace(/\s*-\s*\d+(?:[.,]\d+)?\s*m\s*[/x]\s*\d+(?:[.,]\d+)?\s*m?\s*$/i, "").trim();
  }
  if (/telo|pacciamatura|isolante/i.test(title)) return "Telo isolante";
  if (/banda|giunzione/i.test(title)) return "Banda di giunzione";
  if (/colla/i.test(title)) return "Colla";
  if (/picchetti/i.test(title)) return "Picchetti";
  return title;
}

function isMeasuredInventoryRequirement(line = {}, product = "") {
  const title = `${line.title || ""} ${product || ""}`;
  if (extractInventoryDimensions(title)) return true;
  if (/telo|pacciamatura|isolante/i.test(title)) return true;
  return classifyOrderLine(title) === "product";
}

function buildOrderInventoryRequirements(order = {}, inventory = []) {
  const lines = getOrderPhysicalLines(order);
  const requirements = [];
  const fallbackSqm = toNumber(order.operations?.sqm || 0);
  lines.forEach((line, lineIndex) => {
    const product = resolveInventoryProductForLine(line, order, inventory);
    const quantity = Math.max(1, Number(line.quantity || 1));
    const dimensions = extractInventoryDimensions(line.title);
    const measured = isMeasuredInventoryRequirement(line, product);
    if (measured) {
      const width = dimensions?.width || 2;
      let length = dimensions?.length || 0;
      if (!length) {
        const lineSqm = /telo|pacciamatura|isolante/i.test(line.title)
          ? quantity
          : fallbackSqm;
        length = width ? Number((toNumber(lineSqm || quantity) / width).toFixed(2)) : 0;
      }
      const pieces = dimensions ? quantity : 1;
      for (let index = 0; index < pieces; index += 1) {
        const reqLength = Number(length.toFixed ? length.toFixed(2) : length);
        if (reqLength <= 0) continue;
        requirements.push({
          id: `req-${lineIndex}-${index}`,
          lineIndex,
          pieceIndex: index,
          lineQuantity: pieces,
          product,
          title: line.title,
          measured: true,
          width,
          length: reqLength,
          sqm: Number((width * reqLength).toFixed(2)),
          units: 1,
          note: line.note || "",
        });
      }
      return;
    }
    requirements.push({
      id: `req-${lineIndex}-0`,
      lineIndex,
      pieceIndex: 0,
      lineQuantity: quantity,
      product,
      title: line.title,
      measured: false,
      width: 0,
      length: 0,
      sqm: 0,
      units: quantity,
      note: line.note || "",
    });
  });
  return requirements;
}

function inventoryPiecesMatchRequirement(piece = {}, requirement = {}) {
  const pieceKey = normalizeInventoryFamilyKey(piece.product || "");
  const requirementKey = normalizeInventoryFamilyKey(requirement.product || "");
  if (!pieceKey || !requirementKey) return false;
  if (pieceKey === requirementKey || pieceKey.includes(requirementKey) || requirementKey.includes(pieceKey)) return true;
  // Fall back to coarse material-family matching so "CIOTTOLO BIANCO 2 KG"
  // matches "Ciottolo bianco 25/40 - 25 lt", etc.
  const pieceFamily = normalizeMaterialFamily(piece.product || "");
  const requirementFamily = normalizeMaterialFamily(requirement.product || "");
  return pieceFamily !== null && pieceFamily === requirementFamily;
}

function sortMeasuredInventoryCandidates(left = {}, right = {}, requiredLength = 0) {
  const leftType = normalizeInventoryPieceType(left.pieceType || left.status);
  const rightType = normalizeInventoryPieceType(right.pieceType || right.status);
  if (leftType !== rightType) {
    if (leftType === "residuo") return -1;
    if (rightType === "residuo") return 1;
  }
  const leftWaste = Math.max(0, toNumber(left.length || 0) - requiredLength);
  const rightWaste = Math.max(0, toNumber(right.length || 0) - requiredLength);
  if (leftWaste !== rightWaste) return leftWaste - rightWaste;
  return toNumber(left.length || 0) - toNumber(right.length || 0);
}

function formatInventoryDimensionLabel(width = 0, length = 0) {
  const fmt = (value) => {
    const number = toNumber(value);
    return Number.isInteger(number) ? String(number) : String(Number(number.toFixed(2))).replace(".", ",");
  };
  return `${fmt(width)} x ${fmt(length)} m`;
}

function buildMeasuredRequirementBundles(requirements = []) {
  const bundles = [];
  const byKey = new Map();
  requirements.forEach((requirement) => {
    if (!requirement.measured) return;
    const key = [
      requirement.lineIndex,
      normalizeInventoryFamilyKey(requirement.product || ""),
      toNumber(requirement.width || 0),
      toNumber(requirement.length || 0),
      String(requirement.title || "").trim(),
    ].join("|");
    let bundle = byKey.get(key);
    if (!bundle) {
      bundle = {
        id: key,
        requirementIds: [],
        product: requirement.product,
        title: requirement.title,
        measured: true,
        width: toNumber(requirement.width || 0),
        pieceLength: toNumber(requirement.length || 0),
        pieceSqm: toNumber(requirement.sqm || 0),
        pieceCount: 0,
        lineIndex: requirement.lineIndex,
      };
      byKey.set(key, bundle);
      bundles.push(bundle);
    }
    bundle.requirementIds.push(requirement.id);
    bundle.pieceCount += 1;
  });
  return bundles.map((bundle) => ({
    ...bundle,
    totalLength: Number((bundle.pieceLength * bundle.pieceCount).toFixed(2)),
    sqm: Number((bundle.width * bundle.pieceLength * bundle.pieceCount).toFixed(2)),
  }));
}

function findMeasuredFutureFitLength(plan = {}, piece = {}, sourceUsedLength = 0, pendingPlans = []) {
  const sourceLength = toNumber(piece.length || 0);
  const currentLength = toNumber(plan.totalLength || plan.length || 0);
  const target = Number((sourceLength - sourceUsedLength - currentLength).toFixed(2));
  if (target <= 0.05) return { length: 0, count: 0 };
  const productKey = normalizeInventoryFamilyKey(plan.product || "");
  const width = toNumber(plan.width || 0);
  const currentIndex = Number(plan.bundleIndex ?? plan.lineIndex ?? 0);
  const futurePlans = pendingPlans
    .filter((item) => (
      Number(item.bundleIndex ?? item.lineIndex ?? 0) > currentIndex
      && normalizeInventoryFamilyKey(item.product || "") === productKey
      && Math.abs(toNumber(item.width || 0) - width) <= 0.08
    ))
    .slice(0, 14);
  let best = { length: 0, count: 0 };
  const visit = (index, length, count) => {
    if (length > target + 0.01) return;
    const bestWaste = target - best.length;
    const waste = target - length;
    if (length > 0 && (waste < bestWaste - 0.01 || (Math.abs(waste - bestWaste) <= 0.01 && count > best.count))) {
      best = { length: Number(length.toFixed(2)), count };
    }
    if (index >= futurePlans.length || waste <= 0.01) return;
    for (let nextIndex = index; nextIndex < futurePlans.length; nextIndex += 1) {
      const nextLength = toNumber(futurePlans[nextIndex].totalLength || futurePlans[nextIndex].length || 0);
      if (!nextLength || length + nextLength > target + 0.01) continue;
      visit(nextIndex + 1, Number((length + nextLength).toFixed(2)), count + 1);
    }
  };
  visit(0, 0, 0);
  return best;
}

function scoreMeasuredCandidate(piece = {}, plan = {}, context = {}) {
  const pieceType = normalizeInventoryPieceType(piece.pieceType || piece.status);
  const sourceLength = toNumber(piece.length || 0);
  const sourceUsedLength = toNumber(context.sourceUsedLength || 0);
  const requiredLength = toNumber(plan.totalLength || plan.length || 0);
  const availableLength = Math.max(0, sourceLength - sourceUsedLength);
  const waste = Math.max(0, availableLength - requiredLength);
  const futureFitLength = toNumber(context.futureFitLength || 0);
  const futureFitCount = Math.max(0, Number(context.futureFitCount || 0));
  const finalWaste = Math.max(0, waste - futureFitLength);
  const exact = waste <= 0.05;
  if (sourceUsedLength > 0.01) {
    if (finalWaste <= 0.05) return -2600 - futureFitCount;
    return -2200 + finalWaste;
  }
  if (futureFitCount > 0) {
    if (finalWaste <= 0.05) return -2500 - futureFitCount;
    if (finalWaste <= 2) return -1800 + finalWaste - futureFitCount;
  }
  if (Number(plan.pieceCount || 1) > 1) {
    if (exact) return -2000;
    if (pieceType === "intero") return -1000 + waste;
    return waste + (waste < 3 ? 80 : 0);
  }
  if (exact) return -2000;
  if (pieceType === "residuo") return -1000 + waste;
  return waste;
}

function buildMeasuredCandidateOption(piece = {}, plan = {}, context = {}) {
  const sourceLength = toNumber(piece.length || 0);
  const sourceUsedLength = toNumber(context.sourceUsedLength || 0);
  const availableLength = Number(Math.max(0, sourceLength - sourceUsedLength).toFixed(2));
  const width = toNumber(plan.width || piece.width || 0);
  const requiredLength = toNumber(plan.totalLength || plan.length || 0);
  if (!width || !requiredLength || availableLength + 0.01 < requiredLength) return null;
  const futureFit = findMeasuredFutureFitLength(plan, piece, sourceUsedLength, context.pendingPlans || []);
  const residueLength = Number(Math.max(0, availableLength - requiredLength).toFixed(2));
  const action = residueLength > 0.05 ? "cut" : "use";
  const sourceSqm = width && sourceLength ? Number((width * sourceLength).toFixed(2)) : toNumber(piece.sqm || 0);
  return {
    pieceId: piece.id,
    sourcePieceId: piece.id,
    pieceLabel: buildInventoryPieceLabel(piece),
    sourcePieceLabel: buildInventoryPieceLabel(piece),
    pieceType: normalizeInventoryPieceType(piece.pieceType || piece.status),
    action,
    width,
    length: Number(requiredLength.toFixed(2)),
    sqm: Number((width * requiredLength).toFixed(2)),
    units: 1,
    sourceLength,
    sourceSqm,
    sourceUsedLength,
    sourceRemainingLength: availableLength,
    futureFitLength: futureFit.length,
    futureFitCount: futureFit.count,
    optionLabel: `${buildInventoryPieceLabel(piece)} · ${sourceSqm} mq`,
    residue: action === "cut"
      ? {
          width,
          length: residueLength,
          sqm: Number((width * residueLength).toFixed(2)),
        }
      : null,
    score: scoreMeasuredCandidate(piece, plan, {
      sourceUsedLength,
      futureFitLength: futureFit.length,
      futureFitCount: futureFit.count,
    }),
  };
}

function getMeasuredCandidateOptions(inventory = [], plan = {}, usedPieceIds = new Set(), sourceUsage = new Map(), pendingPlans = []) {
  const requiredWidth = toNumber(plan.width || 0);
  return inventory
    .filter((piece) => (
      !usedPieceIds.has(piece.id)
      && normalizeInventoryPieceState(piece.pieceState) === "disponibile"
      && inventoryPiecesMatchRequirement(piece, plan)
      && toNumber(piece.length || 0) > 0
      && (!requiredWidth || Math.abs(toNumber(piece.width || requiredWidth) - requiredWidth) <= 0.08)
    ))
    .map((piece) => buildMeasuredCandidateOption(piece, plan, {
      sourceUsedLength: toNumber(sourceUsage.get(piece.id) || 0),
      pendingPlans,
    }))
    .filter(Boolean)
    .sort((a, b) => a.score - b.score || a.sourceLength - b.sourceLength);
}

function createMeasuredSuggestionFromCandidate(plan = {}, candidate = {}) {
  const pieceCount = Math.max(1, Number(plan.pieceCount || 1));
  const requiredPieceLength = toNumber(plan.pieceLength || plan.length || candidate.length || 0);
  const width = toNumber(plan.width || candidate.width || 0);
  const product = candidate.product || plan.product;
  const requestLabel = pieceCount > 1
    ? `${pieceCount} pezzi da ${formatInventoryDimensionLabel(width, requiredPieceLength)}`
    : formatInventoryDimensionLabel(width, requiredPieceLength);
  return {
    id: randomUUID(),
    requirementId: Array.isArray(plan.requirementIds) ? plan.requirementIds[0] : plan.id,
    requirementIds: Array.isArray(plan.requirementIds) ? plan.requirementIds : [plan.id].filter(Boolean),
    product,
    title: plan.title || "",
    requestLabel,
    requiredPieceCount: pieceCount,
    requiredPieceLength,
    requiredPieceSqm: Number((width * requiredPieceLength).toFixed(2)),
    ...candidate,
    candidates: [],
  };
}

function buildInventorySuggestionsForOrder(store = {}, order = {}) {
  const inventory = Array.isArray(store.inventory) ? store.inventory.map((item) => normalizeInventoryPieceRecord(item)) : [];
  const requirements = buildOrderInventoryRequirements(order, inventory);
  const usedPieceIds = new Set();
  const measuredSourceUsage = new Map();
  const suggestions = [];
  const missing = [];
  const bundledRequirementIds = new Set();
  const measuredBundles = buildMeasuredRequirementBundles(requirements).map((bundle, bundleIndex) => ({
    ...bundle,
    bundleIndex,
  }));

  measuredBundles.forEach((bundle) => {
    const plan = {
      ...bundle,
      length: bundle.totalLength,
      totalLength: bundle.totalLength,
    };
    const options = getMeasuredCandidateOptions(inventory, plan, usedPieceIds, measuredSourceUsage, measuredBundles);
    if (!options.length && bundle.pieceCount > 1) return;
    if (!options.length) {
      // Non aggiungere a bundledRequirementIds: lascia che il percorso individuale
      // gestisca il requirement spezzandolo su più pezzi disponibili
      return;
    }
    const selected = options[0];
    const suggestion = createMeasuredSuggestionFromCandidate(bundle, selected);
    suggestion.candidates = options.slice(0, 12).map(({ score, ...option }) => option);
    suggestions.push(suggestion);
    measuredSourceUsage.set(
      selected.sourcePieceId,
      Number((toNumber(measuredSourceUsage.get(selected.sourcePieceId) || 0) + toNumber(selected.length || 0)).toFixed(2)),
    );
    bundle.requirementIds.forEach((id) => bundledRequirementIds.add(id));
  });

  requirements.forEach((requirement) => {
    if (bundledRequirementIds.has(requirement.id)) return;
    if (requirement.measured) {
      let remainingLength = Number(requirement.length || 0);
      const requiredWidth = toNumber(requirement.width || 0);
      while (remainingLength > 0.01) {
        const plan = {
          ...requirement,
          length: remainingLength,
          totalLength: remainingLength,
          pieceLength: remainingLength,
          pieceCount: 1,
          requirementIds: [requirement.id],
        };
        const options = getMeasuredCandidateOptions(inventory, plan, usedPieceIds, measuredSourceUsage, measuredBundles);
        if (!options.length) {
          missing.push({
            requirementId: requirement.id,
            product: requirement.product,
            width: requiredWidth,
            length: Number(remainingLength.toFixed(2)),
            sqm: Number((requiredWidth * remainingLength).toFixed(2)),
            reason: "stock_unavailable",
          });
          break;
        }
        const selected = options[0];
        const suggestion = createMeasuredSuggestionFromCandidate(plan, selected);
        suggestion.candidates = options.slice(0, 12).map(({ score, ...option }) => option);
        suggestions.push(suggestion);
        measuredSourceUsage.set(
          selected.sourcePieceId,
          Number((toNumber(measuredSourceUsage.get(selected.sourcePieceId) || 0) + toNumber(selected.length || 0)).toFixed(2)),
        );
        remainingLength = Number((remainingLength - selected.length).toFixed(2));
      }
      return;
    }

    let remainingUnits = Math.max(1, Number(requirement.units || 1));
    const compatible = inventory
      .filter((piece) => (
        !usedPieceIds.has(piece.id)
        && normalizeInventoryPieceState(piece.pieceState) === "disponibile"
        && inventoryPiecesMatchRequirement(piece, requirement)
      ))
      .sort((a, b) => toNumber(a.units || 1) - toNumber(b.units || 1));
    for (const piece of compatible) {
      if (remainingUnits <= 0) break;
      const pieceUnits = Math.max(1, Number(piece.units || 1));
      const units = Math.min(pieceUnits, remainingUnits);
      suggestions.push({
        id: randomUUID(),
        requirementId: requirement.id,
        product: piece.product || requirement.product,
        pieceId: piece.id,
        sourcePieceId: piece.id,
        pieceLabel: piece.variant || buildInventoryPieceLabel(piece),
        pieceType: normalizeInventoryPieceType(piece.pieceType || piece.status),
        action: units < pieceUnits ? "partial-units" : "use",
        width: toNumber(piece.width || 0),
        length: toNumber(piece.length || 0),
        sqm: 0,
        units,
        residue: null,
      });
      usedPieceIds.add(piece.id);
      remainingUnits -= units;
    }
    if (remainingUnits > 0) {
      missing.push({
        requirementId: requirement.id,
        product: requirement.product,
        units: remainingUnits,
        reason: "stock_unavailable",
      });
    }
  });

  return { orderId: order.id, requirements, suggestions, missing };
}

function orderNumberForInventory(order = {}) {
  return String(order.orderNumber || order.name || order.id || "").trim();
}

function applyInventoryCommitment(store = {}, order = {}, rawSuggestions = []) {
  const now = new Date().toISOString();
  const orderNumber = orderNumberForInventory(order);
  const suggestions = Array.isArray(rawSuggestions) && rawSuggestions.length
    ? rawSuggestions
    : buildInventorySuggestionsForOrder(store, order).suggestions;
  if (!suggestions.length) return { ok: false, error: "no_inventory_suggestions" };
  const inventory = Array.isArray(store.inventory) ? store.inventory.map((item) => normalizeInventoryPieceRecord(item)) : [];
  const allocations = [];
  const unavailable = [];
  const sourceGroups = new Map();

  for (const suggestion of suggestions) {
    const sourceId = String(suggestion.sourcePieceId || suggestion.pieceId || "");
    const sourceIndex = inventory.findIndex((piece) => piece.id === sourceId);
    if (sourceIndex < 0 || normalizeInventoryPieceState(inventory[sourceIndex].pieceState) !== "disponibile") {
      unavailable.push(sourceId);
      continue;
    }
    if (!sourceGroups.has(sourceId)) {
      sourceGroups.set(sourceId, {
        sourceId,
        sourcePiece: inventory[sourceIndex],
        suggestions: [],
      });
    }
    sourceGroups.get(sourceId).suggestions.push(suggestion);
  }

  for (const group of sourceGroups.values()) {
    const sourcePiece = group.sourcePiece;
    const sourceSnapshot = { ...sourcePiece };
    const isUnitItem = !toNumber(sourcePiece.length || 0);
    const measuredSuggestions = isUnitItem ? [] : group.suggestions.filter((suggestion) => String(suggestion.action || "") !== "partial-units");
    const unitSuggestions = isUnitItem ? group.suggestions : group.suggestions.filter((suggestion) => String(suggestion.action || "") === "partial-units");
    if (measuredSuggestions.length && unitSuggestions.length) {
      unavailable.push(group.sourceId);
      continue;
    }

    if (unitSuggestions.length) {
      let remainingSourceUnits = Math.max(1, Number(sourcePiece.units || 1));
      for (const suggestion of unitSuggestions) {
        const allocationId = String(suggestion.id || randomUUID());
        const allocationUnits = Math.max(1, Math.round(toNumber(suggestion.units || 1)));
        if (remainingSourceUnits < allocationUnits) {
          unavailable.push(group.sourceId);
          break;
        }
        let committedPieceId = sourcePiece.id;
        if (remainingSourceUnits > allocationUnits) {
          remainingSourceUnits -= allocationUnits;
          sourcePiece.units = remainingSourceUnits;
          const committedPiece = {
            ...sourceSnapshot,
            id: randomUUID(),
            units: allocationUnits,
            pieceState: "impegnato",
            committedOrderId: order.id,
            committedOrderNumber: orderNumber,
            committedAt: now,
            allocationId,
            note: sourceSnapshot.note || `Impegnato per ordine ${orderNumber}`,
            createdAt: now,
          };
          inventory.unshift(committedPiece);
          committedPieceId = committedPiece.id;
        } else {
          remainingSourceUnits = 0;
          sourcePiece.pieceState = "impegnato";
          sourcePiece.committedOrderId = order.id;
          sourcePiece.committedOrderNumber = orderNumber;
          sourcePiece.committedAt = now;
          sourcePiece.allocationId = allocationId;
          sourcePiece.units = allocationUnits;
        }
        allocations.push(normalizeInventoryAllocationRecord({
          id: allocationId,
          pieceId: committedPieceId,
          sourcePieceId: group.sourceId,
          product: suggestion.product || sourceSnapshot.product,
          width: toNumber(sourceSnapshot.width || 0),
          length: toNumber(sourceSnapshot.length || 0),
          sqm: 0,
          units: allocationUnits,
          requiredPieceCount: suggestion.requiredPieceCount,
          requiredPieceLength: suggestion.requiredPieceLength,
          requiredPieceSqm: suggestion.requiredPieceSqm,
          requestLabel: suggestion.requestLabel,
          sourcePieceLabel: suggestion.sourcePieceLabel || suggestion.pieceLabel || buildInventoryPieceLabel(sourceSnapshot),
          pieceType: sourceSnapshot.pieceType || sourceSnapshot.status,
          action: "partial-units",
          status: "impegnato",
          committedAt: now,
          createdAt: now,
          note: suggestion.note || "",
        }));
      }
      continue;
    }

    const sourceLength = toNumber(sourceSnapshot.length || 0);
    const sourceWidth = toNumber(sourceSnapshot.width || 0);
    const totalAllocationLength = Number(measuredSuggestions
      .reduce((sum, suggestion) => sum + toNumber(suggestion.length || sourceLength || 0), 0)
      .toFixed(2));
    if (!sourceLength || totalAllocationLength > sourceLength + 0.01) {
      unavailable.push(group.sourceId);
      continue;
    }
    const residueLength = Number(Math.max(0, sourceLength - totalAllocationLength).toFixed(2));
    let residuePieceId = "";
    if (residueLength > 0.05) {
      const residuePiece = {
        ...sourceSnapshot,
        id: randomUUID(),
        length: residueLength,
        sqm: sourceWidth && residueLength ? Number((sourceWidth * residueLength).toFixed(2)) : 0,
        status: "residuo",
        pieceType: "residuo",
        pieceState: "disponibile",
        committedOrderId: "",
        committedOrderNumber: "",
        allocationId: "",
        parentPieceId: sourceSnapshot.id,
        residueFromPieceId: sourceSnapshot.id,
        note: `Residuo generato da taglio ordine ${orderNumber}`,
        createdAt: now,
      };
      inventory.unshift(residuePiece);
      residuePieceId = residuePiece.id;
    }

    measuredSuggestions.forEach((suggestion, index) => {
      const allocationId = String(suggestion.id || randomUUID());
      const allocationLength = toNumber(suggestion.length || sourceLength || 0);
      const allocationWidth = toNumber(suggestion.width || sourceWidth || 0);
      const allocationUnits = Math.max(1, Math.round(toNumber(suggestion.units || 1)));
      const allocationSqm = allocationWidth && allocationLength ? Number((allocationWidth * allocationLength).toFixed(2)) : 0;
      const allocationAction = measuredSuggestions.length > 1 || residueLength > 0.05 ? "cut" : "use";
      let committedPieceId = sourcePiece.id;
      const committedFields = {
        length: allocationLength,
        sqm: allocationSqm,
        units: allocationUnits,
        pieceState: "impegnato",
        committedOrderId: order.id,
        committedOrderNumber: orderNumber,
        committedAt: now,
        allocationId,
      };
      if (index === 0) {
        Object.assign(sourcePiece, committedFields, {
          pieceType: allocationAction === "cut" ? "taglio" : sourceSnapshot.pieceType,
          status: allocationAction === "cut"
            ? (normalizeInventoryPieceType(sourceSnapshot.status) === "residuo" ? "residuo" : "intero")
            : sourceSnapshot.status,
        });
      } else {
        const committedPiece = {
          ...sourceSnapshot,
          ...committedFields,
          id: randomUUID(),
          pieceType: "taglio",
          status: normalizeInventoryPieceType(sourceSnapshot.status) === "residuo" ? "residuo" : "intero",
          parentPieceId: sourceSnapshot.id,
          residueFromPieceId: "",
          note: sourceSnapshot.note || `Taglio ordine ${orderNumber}`,
          createdAt: now,
        };
        inventory.unshift(committedPiece);
        committedPieceId = committedPiece.id;
      }

      allocations.push(normalizeInventoryAllocationRecord({
        id: allocationId,
        pieceId: committedPieceId,
        sourcePieceId: group.sourceId,
        residuePieceId: index === measuredSuggestions.length - 1 ? residuePieceId : "",
        product: suggestion.product || sourceSnapshot.product,
        width: allocationWidth,
        length: allocationLength,
        sqm: allocationSqm,
        units: allocationUnits,
        requiredPieceCount: suggestion.requiredPieceCount,
        requiredPieceLength: suggestion.requiredPieceLength,
        requiredPieceSqm: suggestion.requiredPieceSqm,
        requestLabel: suggestion.requestLabel,
        sourcePieceLabel: suggestion.sourcePieceLabel || suggestion.pieceLabel || buildInventoryPieceLabel(sourceSnapshot),
        pieceType: allocationAction === "cut" ? "taglio" : sourceSnapshot.pieceType || sourceSnapshot.status,
        action: allocationAction,
        status: "impegnato",
        committedAt: now,
        createdAt: now,
        note: suggestion.note || "",
      }));
    });
  }

  if (unavailable.length) {
    return { ok: false, error: "inventory_piece_unavailable", unavailable };
  }
  const existingAllocations = Array.isArray(order.operations?.warehouse?.inventoryAllocations)
    ? order.operations.warehouse.inventoryAllocations.map((item) => normalizeInventoryAllocationRecord(item))
    : [];
  const nextOrder = {
    ...order,
    operations: normalizeOperations({
      ...order,
      operations: {
        ...(order.operations || {}),
        warehouse: {
          ...(order.operations?.warehouse || {}),
          selected: true,
          inventoryAllocations: [...existingAllocations, ...allocations],
        },
      },
    }),
  };
  store.inventory = inventory;
  const orderIndex = store.orders.findIndex((item) => item.id === order.id);
  if (orderIndex >= 0) store.orders[orderIndex] = nextOrder;
  return { ok: true, order: nextOrder, inventory, allocations };
}

function releaseInventoryCommitmentsForOrder(store = {}, order = {}) {
  const now = new Date().toISOString();
  const allocations = Array.isArray(order.operations?.warehouse?.inventoryAllocations)
    ? order.operations.warehouse.inventoryAllocations.map((item) => normalizeInventoryAllocationRecord(item))
    : [];
  if (!allocations.some((item) => item.status === "impegnato")) return { order, inventory: store.inventory || [] };
  const inventory = Array.isArray(store.inventory) ? store.inventory.map((item) => normalizeInventoryPieceRecord(item)) : [];
  const releasedAllocations = allocations.map((allocation) => {
    if (allocation.status !== "impegnato") return allocation;
    const piece = inventory.find((item) => item.id === allocation.pieceId);
    if (piece && piece.committedOrderId === order.id) {
      piece.pieceState = "disponibile";
      piece.committedOrderId = "";
      piece.committedOrderNumber = "";
      piece.allocationId = "";
      piece.committedAt = "";
    }
    return {
      ...allocation,
      status: "disponibile",
      fulfilledAt: "",
      note: allocation.note || `Impegno liberato ${now}`,
    };
  });
  const nextOrder = {
    ...order,
    operations: normalizeOperations({
      ...order,
      operations: {
        ...(order.operations || {}),
        warehouse: {
          ...(order.operations?.warehouse || {}),
          inventoryAllocations: releasedAllocations,
          shipped: false,
          shippedAt: "",
        },
      },
    }),
  };
  store.inventory = inventory;
  const orderIndex = store.orders.findIndex((item) => item.id === order.id);
  if (orderIndex >= 0) store.orders[orderIndex] = nextOrder;
  return { order: nextOrder, inventory };
}

function shouldFulfillInventoryForOrder(order = {}) {
  const warehouse = order.operations?.warehouse || {};
  const status = String(warehouse.status || "").trim();
  const mode = String(warehouse.fulfillmentMode || "").trim();
  // Only trigger on explicit local signals — Shopify fulfillmentStatus alone
  // must not auto-discharge inventory (it can be set automatically by webhooks)
  return Boolean(
    warehouse.shipped
    || (mode === "corriere" && warehouse.carrierPassed)
  );
}

function fulfillInventoryCommitmentsForOrder(store = {}, order = {}) {
  const allocations = Array.isArray(order.operations?.warehouse?.inventoryAllocations)
    ? order.operations.warehouse.inventoryAllocations.map((item) => normalizeInventoryAllocationRecord(item))
    : [];
  if (!allocations.some((item) => item.status === "impegnato")) return { order, inventory: store.inventory || [], changed: false };
  const now = new Date().toISOString();
  const inventory = Array.isArray(store.inventory) ? store.inventory.map((item) => normalizeInventoryPieceRecord(item)) : [];
  const fulfilledAllocations = allocations.map((allocation) => {
    if (allocation.status !== "impegnato") return allocation;
    const piece = inventory.find((item) => item.id === allocation.pieceId);
    if (piece && piece.committedOrderId === order.id) {
      piece.pieceState = "evaso";
      piece.fulfilledAt = now;
    }
    return {
      ...allocation,
      status: "evaso",
      fulfilledAt: now,
    };
  });
  const nextOrder = {
    ...order,
    operations: normalizeOperations({
      ...order,
      operations: {
        ...(order.operations || {}),
        warehouse: {
          ...(order.operations?.warehouse || {}),
          inventoryAllocations: fulfilledAllocations,
          shipped: true,
          shippedAt: order.operations?.warehouse?.shippedAt || now,
        },
      },
    }),
  };
  store.inventory = inventory;
  const orderIndex = store.orders.findIndex((item) => item.id === order.id);
  if (orderIndex >= 0) store.orders[orderIndex] = nextOrder;
  return { order: nextOrder, inventory, changed: true };
}

function classifyOrderLine(title = "") {
  if (/(installazione|posa)/i.test(title)) return "service";
  if (/^\s*iva\b|\b(iva|vat|tax|imposta)\b/i.test(title)) return "service";
  if (/(banda|giunzione|telo|colla|monocomponente|picchetti|pietrisco|bordura|ciottol|lapillo|sabbia|graniglia|kit|profumo|detergente|spazzolatrice|spazzola|mattonella|campionatura|box campionatura|pavidrain|drenaggio|geotessile|tappetino|sottofondo)/i.test(title)) {
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

function normalizeProfitSplitExpenseLines(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      const payer = ["owner", "partner", "shared"].includes(String(item?.payer || "").trim())
        ? String(item?.payer || "").trim()
        : "owner";
      return {
        id: String(item?.id || randomUUID()),
        label: String(item?.label || "").trim(),
        amount: String(item?.amount ?? "").trim(),
        payer,
      };
    })
    .filter((item) => item.label || Math.abs(toNumber(item.amount || 0)) > 0);
}

function normalizeProfitSplitRecord(input = null) {
  if (!input || typeof input !== "object") return null;
  const normalized = {
    linkedOrderId: String(input.linkedOrderId || "").trim(),
    savedAt: String(input.savedAt || "").trim(),
    updatedBy: String(input.updatedBy || "").trim(),
    jobLabel: String(input.jobLabel || "").trim(),
    partnerName: String(input.partnerName || "").trim(),
    revenue: String(input.revenue ?? "").trim(),
    partnerDailyFixed: String(input.partnerDailyFixed ?? "").trim(),
    partnerDays: String(input.partnerDays ?? "").trim(),
    partnerSharePct: String(input.partnerSharePct ?? "").trim(),
    expenseLines: normalizeProfitSplitExpenseLines(input.expenseLines),
    ownerRecovery: String(input.ownerRecovery ?? "").trim(),
    partnerRecovery: String(input.partnerRecovery ?? "").trim(),
    note: String(input.note || "").trim(),
  };
  const hasData = [
    normalized.partnerName,
    normalized.revenue,
    normalized.ownerRecovery,
    normalized.partnerRecovery,
    normalized.note,
  ].some((value) => String(value || "").trim())
    || normalized.expenseLines.length > 0
    || Math.abs(toNumber(normalized.partnerDailyFixed || 0)) > 0
    || Math.abs(toNumber(normalized.partnerDays || 0)) > 0
    || Math.abs(toNumber(normalized.partnerSharePct || 0)) > 0;
  return hasData ? normalized : null;
}

function normalizeCoveragePlanner(payload = {}) {
  const teams = payload?.teams && typeof payload.teams === "object" ? payload.teams : {};
  const availability = payload?.availability && typeof payload.availability === "object" ? payload.availability : {};
  const archivedTeams = Array.isArray(payload?.archivedTeams)
    ? Array.from(new Set(payload.archivedTeams.map((item) => String(item || "").trim()).filter(Boolean)))
    : [];
  const isArchivedTeam = (teamName = "") => archivedTeams.some((item) => item.localeCompare(String(teamName || "").trim(), "it", { sensitivity: "accent" }) === 0);
  const activeTeams = Object.fromEntries(
    Object.entries(teams).filter(([teamName]) => teamName && !isArchivedTeam(teamName)),
  );
  const activeAvailability = Object.fromEntries(
    Object.entries(availability).filter(([teamName]) => teamName && !isArchivedTeam(teamName)),
  );
  return {
    teams: activeTeams,
    availability: activeAvailability,
    archivedTeams,
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

function isSalesRequestSqmHeader(normalizedHeader = "") {
  const header = String(normalizedHeader || "").trim().replace(/\s+/g, " ");
  if (!header) return false;
  if ([
    "m",
    "mq",
    "m q",
    "m2",
    "m 2",
    "m2 richiesti",
    "m2 richiesto",
    "m2 richiesta",
    "m2 da preventivare",
    "sqm",
    "met",
    "met 2",
    "met2",
    "mtq",
    "mt 2",
    "mt2",
    "metri",
    "metro",
    "metri quadri",
    "metri q",
    "metri q richiesti",
    "metriquadrati",
    "metri2",
    "metri quadrati",
    "m quadri",
    "m quadrati",
    "metratura",
    "metratura prato",
    "area",
    "area mq",
    "area m2",
    "superficie mq",
    "superficie m2",
    "mq richiesti",
    "mq richiesto",
    "mq richiesta",
    "mq da preventivare",
    "mq prato",
    "mq area",
    "metri richiesti",
    "metri richiesto",
    "metri da preventivare",
    "metri quadri richiesti",
    "metri quadri richiesto",
    "metri quadrati richiesti",
  ].includes(header)) return true;
  return (
    header.includes("mq")
    || header.includes("m2")
    || header.includes("mtq")
    || header.includes("mt2")
    || header.includes("sqm")
    || header.includes("metratura")
    || header.includes("met2")
    || header.includes("metri2")
    || header.includes("metri quadr")
    || header.includes("metri quad")
    || /\bmet\b/.test(header)
    || /\bmetri\b/.test(header)
  );
}

function toSalesRequestSqmNumber(value = "") {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const normalized = normalizeSalesRequestImportHeader(raw);
  if (/(^|[^a-z])(mm|millimetri|millimetro|cm|centimetri|centimetro)([^a-z]|$)/.test(normalized)) return 0;
  const amount = toNumber(raw);
  return amount > 0 ? Number(amount.toFixed(2)) : 0;
}

function getSalesRequestRawSqmValue(item = {}) {
  const directCandidates = [
    item.sqm,
    item.mq,
    item.met,
    item.metri,
    item.metriQuadri,
    item.metri_quadri,
    item.mqRichiesti,
    item.mq_richiesti,
  ];
  const directText = directCandidates
    .map((value) => String(value ?? "").trim())
    .find((value) => toSalesRequestSqmNumber(value) > 0);
  if (directText) return directText;
  const dynamicEntry = Object.entries(item || {}).find(([key, raw]) => {
    const keyText = normalizeSalesRequestImportHeader(key || "");
    if (!isSalesRequestSqmHeader(keyText)) return false;
    return toSalesRequestSqmNumber(raw) > 0;
  });
  return dynamicEntry ? String(dynamicEntry[1] ?? "").trim() : "";
}

function getSalesRequestSqm(item = {}) {
  return toSalesRequestSqmNumber(getSalesRequestRawSqmValue(item));
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
    || (normalized.includes("prato sintetico italia") && normalized.includes("proposta mirata") && normalized.includes("misure"))
    || (normalized.includes("grazie per la richiesta") && normalized.includes("ti confermiamo disponibilita"))
    || (normalized.includes("thank you for your request") && normalized.includes("we can support"))
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

function getSalesRequestFirstName(item = {}) {
  const direct = String(item.name || "").trim().replace(/\s+/g, " ");
  if (direct) return direct.split(" ")[0];
  const displayName = getSalesRequestDisplayName(item);
  if (!displayName || displayName === "cliente") return "cliente";
  return displayName.split(/\s+/)[0] || "cliente";
}

function getSalesRequestContactOperatorName(item = {}) {
  return normalizeSalesRequestAssignment(item.assignment || item.firstContactBy || "") || "Gabriele";
}

function buildSalesRequestDefaultWhatsAppMessage(item = {}) {
  const recipient = getSalesRequestFirstName(item);
  const operatorName = getSalesRequestContactOperatorName(item);
  const serviceIntent = getSalesRequestServiceIntent(item.service || item.servizio || "");
  if (serviceIntent === "supply-install") {
    return [
      `Ciao ${recipient}, buongiorno. Sono ${operatorName} di Prato Sintetico Italia.`,
      "Per capire bene il lavoro di fornitura e posa mi mandi queste info?",
      "- misure o mq dell'area",
      "- superficie attuale",
      "- zona del cantiere",
      "- utilizzo previsto",
      "Poi ti preparo una proposta mirata con il prato piu adatto e una prima indicazione sulla posa.",
    ].join("\n");
  }
  return [
    `Ciao ${recipient}, buongiorno. Sono ${operatorName} di Prato Sintetico Italia.`,
    "Per consigliarti il prato piu adatto mi mandi queste info?",
    "- misure o mq dell'area",
    "- dove andra posato",
    "- utilizzo previsto",
    "Con queste ti preparo una proposta mirata con modelli e tempi di consegna.",
  ].join("\n");
}

function getSalesRequestAutomatedWhatsAppMessage(item = {}) {
  const template = String(item.whatsappTemplate || "").trim();
  if (template && !isGenericSalesRequestWhatsAppTemplate(template)) return template;
  const fromUrl = extractSalesRequestMessageFromWhatsAppUrl(item.whatsappUrl || "");
  if (fromUrl && !isGenericSalesRequestWhatsAppTemplate(fromUrl)) return fromUrl;
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

function buildMarketingPublishText(item = {}) {
  return [
    item.caption || item.title || "",
    item.cta || "",
    item.hashtags || "",
    item.assetUrl || "",
  ].map((part) => String(part || "").trim()).filter(Boolean).join("\n\n");
}

function getMarketingScheduleIso(item = {}) {
  const date = String(item.date || "").trim();
  const time = String(item.time || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return "";
  const scheduled = new Date(`${date}T${time}:00`);
  if (!Number.isFinite(scheduled.getTime())) return "";
  if (scheduled.getTime() <= Date.now() + 60_000) return "";
  return scheduled.toISOString();
}

function getMarketingScheduleUnix(item = {}) {
  const iso = getMarketingScheduleIso(item);
  if (!iso) return 0;
  return Math.floor(new Date(iso).getTime() / 1000);
}

function normalizePublicMarketingAssetUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    if (parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function getMarketingPublishAssetUrl(item = {}) {
  return normalizePublicMarketingAssetUrl(item.publicAssetUrl || item.assetUrl || "");
}

function buildMarketingPublicAssetUrl(req, assetId = "") {
  const normalizedAssetId = String(assetId || "").trim();
  if (!normalizedAssetId) return "";
  const baseUrl = getRequestBaseUrl(req);
  return new URL(`/api/public/marketing-assets/${encodeURIComponent(normalizedAssetId)}`, baseUrl).toString();
}

async function prepareMarketingItemForPublish(store, item = {}, req) {
  const channel = String(item.channel || "").trim();
  if (!["Facebook", "Instagram"].includes(channel)) {
    return { item, changed: false, publicAssetUrl: getMarketingPublishAssetUrl(item) };
  }

  const existingPublicUrl = normalizePublicMarketingAssetUrl(item.publicAssetUrl || "")
    || (String(item.assetDataUrl || "").trim() ? "" : normalizePublicMarketingAssetUrl(item.assetUrl || ""));
  if (existingPublicUrl) {
    return {
      item: { ...item, publicAssetUrl: existingPublicUrl },
      changed: false,
      publicAssetUrl: existingPublicUrl,
    };
  }

  const parsed = parseDataUrl(item.assetDataUrl || "");
  if (!parsed?.buffer?.length) {
    return { item, changed: false, publicAssetUrl: "" };
  }

  const contentType = String(parsed.contentType || "").trim().toLowerCase();
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(contentType)) {
    return { item, changed: false, publicAssetUrl: "", error: "invalid_marketing_asset_type" };
  }

  const assetId = randomUUID();
  const savedAttachment = await storeAttachmentBuffer(
    assetId,
    {
      id: assetId,
      name: String(item.assetName || item.title || "marketing-image").trim() || "marketing-image",
      type: contentType,
      size: parsed.buffer.length,
      context: "marketing-public",
      createdAt: new Date().toISOString(),
    },
    parsed.buffer,
    "marketing-public",
  );
  const publicRecord = normalizeMarketingPublicAssetRecord({
    id: assetId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
    attachment: savedAttachment,
  });
  store.marketingPublicAssets = [
    publicRecord,
    ...normalizeMarketingPublicAssets(store.marketingPublicAssets),
  ].slice(0, 200);
  const publicAssetUrl = buildMarketingPublicAssetUrl(req, assetId);
  return {
    item: { ...item, publicAssetUrl },
    changed: true,
    publicAssetUrl,
  };
}

async function callMetaGraphApi(path = "", params = {}, accessToken = META_MARKETING_ACCESS_TOKEN) {
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  const endpoint = new URL(`https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${normalizedPath}`);
  const body = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") body.set(key, String(value));
  });
  body.set("access_token", accessToken);
  try {
    const response = await fetchWithTimeout(
      endpoint.toString(),
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
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
      return {
        ok: false,
        reason: "provider_error",
        statusCode: Number(response.status || 0),
        details: String(parsed?.error?.message || parsed?.raw || "").trim(),
      };
    }
    return { ok: true, payload: parsed };
  } catch (error) {
    console.error("meta_graph_api_network_error", normalizedPath, error);
    return {
      ok: false,
      reason: "network_error",
      details: [error?.name, error?.message].filter(Boolean).join(": ") || "network_error",
    };
  }
}

async function readMetaGraphApi(path = "", params = {}, accessToken = META_MARKETING_ACCESS_TOKEN) {
  const normalizedPath = String(path || "").replace(/^\/+/, "");
  const endpoint = new URL(`https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${normalizedPath}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") endpoint.searchParams.set(key, String(value));
  });
  endpoint.searchParams.set("access_token", accessToken);
  try {
    const response = await fetchWithTimeout(endpoint.toString(), { method: "GET" }, WHATSAPP_GRAPH_TIMEOUT_MS);
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
      return {
        ok: false,
        reason: "provider_error",
        statusCode: Number(response.status || 0),
        details: String(parsed?.error?.message || parsed?.raw || "").trim(),
      };
    }
    return { ok: true, payload: parsed };
  } catch (error) {
    console.error("meta_graph_api_read_network_error", normalizedPath, error);
    return {
      ok: false,
      reason: "network_error",
      details: [error?.name, error?.message].filter(Boolean).join(": ") || "network_error",
    };
  }
}

async function verifyMetaPublishedObject(objectId = "", fields = "id", label = "Meta") {
  const normalizedObjectId = String(objectId || "").trim();
  if (!normalizedObjectId) {
    return { ok: false, reason: "provider_missing_confirmation", details: `${label}: missing provider object id` };
  }
  let lastResult = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (attempt) await wait(900 * attempt);
    const result = await readMetaGraphApi(normalizedObjectId, { fields });
    if (result.ok && String(result.payload?.id || "").trim()) {
      return {
        ok: true,
        payload: result.payload,
        verifiedId: String(result.payload.id || "").trim(),
      };
    }
    lastResult = result.ok
      ? { ok: false, reason: "provider_missing_confirmation", details: `${label}: Graph API did not return a confirmed object id.` }
      : result;
  }
  return {
    ok: false,
    reason: lastResult?.reason || "provider_missing_confirmation",
    statusCode: lastResult?.statusCode,
    details: String(lastResult?.details || `${label}: provider object was not verifiable after publish.`).trim(),
  };
}

async function sendMarketingWhatsAppMessage(item = {}) {
  if (!WHATSAPP_AUTOMATION_ENABLED) {
    return { ok: false, reason: "automation_disabled" };
  }
  if (!WHATSAPP_DEFAULT_ACCESS_TOKEN || !WHATSAPP_DEFAULT_PHONE_NUMBER_ID) {
    return { ok: false, reason: "missing_whatsapp_config" };
  }
  const to = normalizePhoneForWhatsApp(item.recipientPhone || "");
  if (!to) {
    return { ok: false, reason: "missing_phone" };
  }
  const message = buildMarketingPublishText(item);
  if (!message) {
    return { ok: false, reason: "missing_message" };
  }
  const endpoint = `https://graph.facebook.com/${WHATSAPP_GRAPH_API_VERSION}/${WHATSAPP_DEFAULT_PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      preview_url: true,
      body: message,
    },
  };
  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_DEFAULT_ACCESS_TOKEN}`,
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
      return {
        ok: false,
        reason: "provider_error",
        statusCode: Number(response.status || 0),
        details: String(parsed?.error?.message || parsed?.raw || "").trim(),
      };
    }
    const messageId = String(parsed?.messages?.[0]?.id || "").trim();
    if (!messageId) {
      return { ok: false, reason: "provider_missing_confirmation", details: "WhatsApp API response missing message id." };
    }
    return {
      ok: true,
      provider: "whatsapp",
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

async function publishFacebookMarketingItem(item = {}, mode = "publish") {
  if (!META_MARKETING_ACCESS_TOKEN || !META_PAGE_ID) {
    return { ok: false, reason: "missing_meta_page_config" };
  }
  const message = buildMarketingPublishText(item);
  if (!message) return { ok: false, reason: "missing_message" };
  const assetUrl = getMarketingPublishAssetUrl(item);
  const scheduledAt = mode === "schedule" ? getMarketingScheduleIso(item) : "";
  const scheduledUnix = mode === "schedule" ? getMarketingScheduleUnix(item) : 0;
  if (mode === "schedule" && !scheduledUnix) return { ok: false, reason: "missing_schedule_datetime" };
  const path = assetUrl ? `${META_PAGE_ID}/photos` : `${META_PAGE_ID}/feed`;
  const params = assetUrl
    ? {
        url: assetUrl,
        caption: message,
        published: mode === "schedule" ? "false" : "true",
        scheduled_publish_time: scheduledUnix || undefined,
      }
    : {
        message,
        published: mode === "schedule" ? "false" : "true",
        scheduled_publish_time: scheduledUnix || undefined,
  };
  const result = await callMetaGraphApi(path, params);
  if (!result.ok) return result;
  const providerId = String(result.payload?.post_id || result.payload?.id || "").trim();
  if (!providerId) {
    return { ok: false, reason: "provider_missing_confirmation", details: "Meta response missing Facebook post id." };
  }
  let providerUrl = "";
  if (mode === "publish") {
    const verification = await verifyMetaPublishedObject(providerId, "id,permalink_url,created_time", "Facebook");
    if (!verification.ok) {
      return {
        ...verification,
        details: `Meta ha risposto al publish ma non riesco a verificare il post Facebook finale (${providerId}). ${verification.details || ""}`.trim(),
      };
    }
    providerUrl = String(verification.payload?.permalink_url || "").trim();
  }
  return {
    ok: true,
    provider: "facebook",
    messageId: mode === "publish" ? providerId : "",
    scheduleId: mode === "schedule" ? providerId : "",
    providerUrl,
    verified: mode === "publish",
    scheduledAt,
  };
}

async function publishInstagramMarketingItem(item = {}, mode = "publish") {
  if (!META_MARKETING_ACCESS_TOKEN || !META_INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    return { ok: false, reason: "missing_meta_instagram_config" };
  }
  const assetUrl = getMarketingPublishAssetUrl(item);
  if (!assetUrl) return { ok: false, reason: "missing_public_asset_url" };
  const caption = buildMarketingPublishText(item);
  if (!caption) return { ok: false, reason: "missing_message" };
  const scheduledAt = mode === "schedule" ? getMarketingScheduleIso(item) : "";
  const scheduledUnix = mode === "schedule" ? getMarketingScheduleUnix(item) : 0;
  if (mode === "schedule" && !scheduledUnix) return { ok: false, reason: "missing_schedule_datetime" };
  const createResult = await callMetaGraphApi(`${META_INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`, {
    image_url: assetUrl,
    caption,
    published: mode === "schedule" ? "false" : undefined,
    scheduled_publish_time: scheduledUnix || undefined,
  });
  if (!createResult.ok) return createResult;
  const creationId = String(createResult.payload?.id || "").trim();
  if (!creationId) return { ok: false, reason: "provider_error", details: "Missing Instagram creation id" };
  if (mode === "schedule") {
    return {
      ok: true,
      provider: "instagram",
      scheduleId: creationId,
      scheduledAt,
    };
  }
  const publishResult = await callMetaGraphApi(`${META_INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`, {
    creation_id: creationId,
  });
  if (!publishResult.ok) return publishResult;
  const mediaId = String(publishResult.payload?.id || "").trim();
  if (!mediaId) {
    return { ok: false, reason: "provider_missing_confirmation", details: "Meta response missing Instagram media id." };
  }
  const verification = await verifyMetaPublishedObject(mediaId, "id,permalink,timestamp,media_type", "Instagram");
  if (!verification.ok) {
    return {
      ...verification,
      details: `Meta ha risposto al publish ma non riesco a verificare il post Instagram finale (${mediaId}). ${verification.details || ""}`.trim(),
    };
  }
  const providerUrl = String(verification.payload?.permalink || "").trim();
  if (!providerUrl) {
    return {
      ok: false,
      reason: "provider_missing_confirmation",
      details: `Meta ha restituito l'ID Instagram ${mediaId}, ma non un permalink verificabile al post pubblicato.`,
    };
  }
  return {
    ok: true,
    provider: "instagram",
    messageId: mediaId,
    providerUrl,
    verified: true,
  };
}

async function publishMarketingItem(item = {}, mode = "publish") {
  const channel = String(item.channel || "").trim();
  const publishMode = mode === "schedule" ? "schedule" : "publish";
  if (publishMode === "schedule") {
    const scheduledAt = getMarketingScheduleIso(item);
    if (!scheduledAt) return { ok: false, reason: "missing_schedule_datetime" };
    if (channel === "WhatsApp") return { ok: false, reason: "whatsapp_schedule_not_supported" };
    if (channel === "Instagram") return publishInstagramMarketingItem(item, publishMode);
    if (channel === "Facebook") return publishFacebookMarketingItem(item, publishMode);
    if (channel === "TikTok") return { ok: false, reason: "tiktok_schedule_not_configured", scheduledAt };
    return { ok: false, reason: "unsupported_channel" };
  }
  if (channel === "WhatsApp") return sendMarketingWhatsAppMessage(item);
  if (channel === "Instagram") return publishInstagramMarketingItem(item, publishMode);
  if (channel === "Facebook") return publishFacebookMarketingItem(item, publishMode);
  if (channel === "TikTok") return { ok: false, reason: "tiktok_publish_not_configured" };
  if (channel === "Email") {
    if (!RESEND_API_KEY || !isValidEmailAddress(SALES_REQUEST_EMAIL_FROM)) {
      return { ok: false, reason: "missing_email_config" };
    }
    return { ok: false, reason: "email_recipient_not_configured" };
  }
  return { ok: false, reason: "unsupported_channel" };
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
  let sendResult = null;
  try {
    sendResult = mode === "email"
      ? await sendSalesRequestFirstContactEmail({
        requestRecord: normalized,
        assignment: nextAssignment,
      })
      : await sendSalesRequestFirstContactWhatsApp({
        requestRecord: normalized,
        assignment: nextAssignment,
      });
  } catch (error) {
    console.error("sales_request_first_contact_automation_failed", error);
    sendResult = {
      ok: false,
      reason: "automation_error",
      details: String(error?.message || "automation_error"),
    };
  }

  if (sendResult?.ok) {
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
      reason: String(sendResult?.reason || "send_failed"),
      details: String(sendResult?.details || ""),
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
    "nuovo contatto",
    "richiesta nuova",
    "nuova richiesta",
  ].includes(normalized)) return "new";
  if ([
    "quoted",
    "quote",
    "preventivo",
    "in preventivo",
    "preventivo inviato",
    "preventivo da inviare",
    "preventivo confermato",
    "offerta",
    "offerta inviata",
    "quotato",
    "campione acquistato",
  ].includes(normalized)) return "quoted";
  if ([
    "followup",
    "follow up",
    "follow-up",
    "1 contatto",
    "1 contatto whatsapp",
    "da richiamare",
    "richiamare",
    "richiamata",
    "recall",
    "attesa",
    "in attesa di risposta",
    "nessuna risposta",
    "ricontattato",
    "chiamare",
    "email",
    "email inviata",
    "fare follow up",
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
    "declinata",
    "lead non qualificato",
    "ordine eseguito",
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

// Snapshot stato IMAP worker + conteggio shadow records per il diagnostic.
// Le funzioni buildLeadFingerprint, fingerprintIsComplete, fingerprintsMatch,
// findMatchingSalesRequest, reconcileShadowLeads sono state spostate in
// lead-fingerprint.mjs per essere importabili anche dal worker IMAP
// (auto-promote Fase 4).

async function getImapDiagnosticSnapshot() {
  const status = getImapWorkerStatus();
  let shadowRecordsTotal = 0;
  let lastEmailSeenAt = null;
  let parseStatusCounts = {};
  let reconcileStats = { promoted: 0, pendingOk: 0, pendingNoMatch: 0 };
  try {
    const pool = await getPgPool();
    if (pool) {
      const tot = await pool.query("SELECT COUNT(*)::int AS n FROM incoming_leads_shadow");
      shadowRecordsTotal = Number(tot.rows?.[0]?.n || 0);
      const last = await pool.query(
        "SELECT MAX(received_at) AS last FROM incoming_leads_shadow",
      );
      lastEmailSeenAt = last.rows?.[0]?.last || null;
      const byStatus = await pool.query(
        "SELECT parse_status, COUNT(*)::int AS n FROM incoming_leads_shadow GROUP BY parse_status",
      );
      for (const r of byStatus.rows || []) {
        parseStatusCounts[String(r.parse_status || "unknown")] = Number(r.n || 0);
      }
      // Stats reconcile: quanti shadow gia' linkati a sales_requests vs pending
      const reconcile = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE promoted_to_sales_request_id IS NOT NULL)::int AS promoted,
          COUNT(*) FILTER (WHERE promoted_to_sales_request_id IS NULL AND parse_status = 'ok')::int AS pending_ok,
          COUNT(*) FILTER (WHERE promoted_to_sales_request_id IS NULL AND parse_status != 'ok')::int AS pending_other
        FROM incoming_leads_shadow
      `);
      const r = reconcile.rows?.[0] || {};
      reconcileStats = {
        promoted: Number(r.promoted || 0),
        pendingOk: Number(r.pending_ok || 0),
        pendingNoMatch: Number(r.pending_other || 0),
      };
    }
  } catch (err) {
    // Ignore: tabella potrebbe non esistere ancora se schema non e' stato applicato
  }
  return {
    enabled: status.enabled,
    configured: status.configured,
    running: status.running,
    host: status.host,
    user: status.user,
    mailbox: status.mailbox,
    pollIntervalMs: status.pollIntervalMs,
    lastPollAt: status.lastPollAt,
    lastSuccessAt: status.lastSuccessAt,
    lastError: status.lastError,
    totalSeen: status.totalSeen,
    totalParsed: status.totalParsed,
    totalFailed: status.totalFailed,
    parserVersion: status.parserVersion,
    shadowRecordsTotal,
    lastEmailSeenAt,
    parseStatusCounts,
    reconcile: reconcileStats,
  };
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
  if (isSalesRequestSqmHeader(normalizedHeader)) {
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
  if (isSalesRequestAssignmentHeader(normalizedHeader)) {
    target.assignment = value;
    return;
  }
  if (isSalesRequestStatusHeader(normalizedHeader)) {
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

function isSalesRequestAssignmentHeader(normalizedHeader = "") {
  return ["assegnazione", "assignment", "owner", "commerciale", "team", "assegnato a", "assegnato", "assegnazione preventivo"].includes(normalizedHeader);
}

function isSalesRequestStatusHeader(normalizedHeader = "") {
  return ["stato", "status", "stato preventivo"].includes(normalizedHeader);
}

function pickSalesRequestSqmFromSheetRow(headers = [], row = []) {
  const normalizedHeaders = headers.map((header) => normalizeSalesRequestImportHeader(header));
  const candidates = [];
  normalizedHeaders.forEach((header, index) => {
    const sqm = toSalesRequestSqmNumber(row[index] ?? "");
    if (!sqm) return;
    if (isSalesRequestHeightHeader(header) || isSalesRequestStatusHeader(header) || isSalesRequestAssignmentHeader(header)) return;
    if (["telefono", "phone", "tel", "mobile", "cellulare", "email", "mail"].includes(header)) return;

    const previousHeader = normalizedHeaders[index - 1] || "";
    const nextHeader = normalizedHeaders[index + 1] || "";
    const previousPreviousHeader = normalizedHeaders[index - 2] || "";
    const nextNextHeader = normalizedHeaders[index + 2] || "";
    let score = 0;
    if (isSalesRequestSqmHeader(header)) score += 120;
    if (isSalesRequestHeightHeader(nextHeader)) score += 90;
    if (isSalesRequestHeightHeader(nextNextHeader)) score += 60;
    if (isSalesRequestStatusHeader(previousHeader)) score += 45;
    if (isSalesRequestStatusHeader(previousPreviousHeader)) score += 25;
    if (header.includes("met") || header.includes("mq") || header.includes("m2") || header.includes("mtq")) score += 60;
    if (score > 0) candidates.push({ sqm, score, index });
  });
  candidates.sort((left, right) => right.score - left.score || left.index - right.index);
  return candidates[0]?.sqm || 0;
}

function columnIndexToA1(index = 0) {
  let column = Math.max(0, Number(index || 0)) + 1;
  let label = "";
  while (column > 0) {
    const remainder = (column - 1) % 26;
    label = `${String.fromCharCode(65 + remainder)}${label}`;
    column = Math.floor((column - 1) / 26);
  }
  return label;
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
  let response;
  try {
    response = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
    }, GOOGLE_FETCH_TIMEOUT_MS);
  } catch (error) {
    throw normalizeGoogleFetchError(error, "token");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || "google_token_failed");
  }
  return payload.access_token;
}

async function googleSheetsFetch(config, endpoint, options = {}) {
  const token = await getGoogleAccessTokenForSheets(config);
  let response;
  try {
    response = await fetchWithTimeout(`https://sheets.googleapis.com/v4${endpoint}`, {
      method: options.method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body,
    }, GOOGLE_FETCH_TIMEOUT_MS);
  } catch (error) {
    throw normalizeGoogleFetchError(error, "sheets");
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.error_description || payload?.error || "google_sheets_failed");
  }
  return payload;
}

function serializeSalesRequestAssignmentForSheet(value = "") {
  return normalizeSalesRequestAssignment(value) || "non assegnato";
}

function serializeSalesRequestStatusForSheet(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "nuovo contatto";
  const normalized = normalizeSalesRequestImportHeader(raw);
  if (["new", "nuova", "nuovo", "lead", "richiesta nuova", "nuova richiesta"].includes(normalized)) return "nuovo contatto";
  if (["quoted", "quote", "preventivo", "in preventivo", "offerta", "offerta inviata", "quotato"].includes(normalized)) return "Preventivo inviato";
  if (["followup", "follow up", "follow-up", "richiamare", "richiamata", "recall", "attesa", "in lavorazione", "da seguire"].includes(normalized)) return "fare follow up";
  if (["closed", "chiusa", "chiuso", "completata", "completato", "archiviata", "archiviato"].includes(normalized)) return "declinata";
  return raw;
}

function getGoogleSheetRequestRecordKey(record = {}) {
  const spreadsheetId = String(record.sourceSpreadsheetId || "").trim();
  const sheetName = String(record.sourceSheetName || "").trim();
  const rowNumber = Number(record.sourceRowNumber || 0);
  if (String(record.source || "") !== "google-sheets" || !spreadsheetId || !sheetName || rowNumber < 2) return "";
  return `${spreadsheetId}::${sheetName}`;
}

async function getSalesRequestSheetWriteColumns(config = {}, spreadsheetId = "", sheetName = "") {
  const cacheKey = `${spreadsheetId}::${normalizeSheetKey(sheetName)}`;
  const cached = salesRequestSheetColumnsCache.get(cacheKey);
  if (cached && Number(cached.expiresAt || 0) > Date.now()) {
    return { ...cached.columns, _rawHeaders: cached.rawHeaders };
  }
  const encodedHeaderRange = encodeURIComponent(`${quoteSheetName(sheetName)}!1:1`);
  const headersPayload = await googleSheetsFetch(
    config,
    `/spreadsheets/${spreadsheetId}/values/${encodedHeaderRange}`,
  );
  const headers = Array.isArray(headersPayload?.values?.[0]) ? headersPayload.values[0] : [];
  // Fase 5 mirror Portal→Sheets: mappiamo ogni header conosciuto al
  // proprio field del record sales_request. Usato sia per UPDATE
  // (status, assignment, note, ...) sia per APPEND (orfani imap).
  const columns = {
    assignment: "",
    status: "",
    name: "",
    surname: "",
    fullName: "",
    city: "",
    phone: "",
    email: "",
    sqm: "",
    requestedHeight: "",
    service: "",
    surface: "",
    note: "",
    whatsappTemplate: "",
    source: "",
  };
  headers.forEach((header, index) => {
    const normalizedHeader = normalizeSalesRequestImportHeader(header);
    const a1 = columnIndexToA1(index);
    if (!columns.assignment && isSalesRequestAssignmentHeader(normalizedHeader)) columns.assignment = a1;
    if (!columns.status && isSalesRequestStatusHeader(normalizedHeader)) columns.status = a1;
    if (!columns.name && ["nome", "name", "first name", "firstname"].includes(normalizedHeader)) columns.name = a1;
    if (!columns.surname && ["cognome", "surname", "last name", "lastname"].includes(normalizedHeader)) columns.surname = a1;
    if (!columns.fullName && ["cliente", "customer", "full name", "nome completo", "richiesta", "lead"].includes(normalizedHeader)) columns.fullName = a1;
    if (!columns.city && ["citta", "city", "comune"].includes(normalizedHeader)) columns.city = a1;
    if (!columns.phone && ["telefono", "phone", "tel", "mobile", "cellulare"].includes(normalizedHeader)) columns.phone = a1;
    if (!columns.email && ["email", "mail"].includes(normalizedHeader)) columns.email = a1;
    if (!columns.sqm && isSalesRequestSqmHeader(normalizedHeader)) columns.sqm = a1;
    if (!columns.requestedHeight && isSalesRequestHeightHeader(normalizedHeader)) columns.requestedHeight = a1;
    if (!columns.service && ["servizio", "service", "tipologia"].includes(normalizedHeader)) columns.service = a1;
    if (!columns.surface && ["fondo", "surface", "superficie"].includes(normalizedHeader)) columns.surface = a1;
    if (!columns.note && ["note", "notes", "annotazioni", "appunti"].includes(normalizedHeader)) columns.note = a1;
    if (!columns.whatsappTemplate && ["whatsapp", "wa", "messaggio whatsapp", "whatsapp template"].includes(normalizedHeader)) columns.whatsappTemplate = a1;
    if (!columns.source && ["origine", "fonte", "source"].includes(normalizedHeader)) columns.source = a1;
  });
  salesRequestSheetColumnsCache.set(cacheKey, {
    columns: { ...columns },
    rawHeaders: [...headers],
    expiresAt: Date.now() + SALES_REQUEST_SHEET_COLUMNS_CACHE_TTL_MS,
  });
  return { ...columns, _rawHeaders: [...headers] };
}

// Evita che Google Sheets interpreti valori che iniziano con +, -, =, @ come
// formule (es. "+39 349..." → #ERROR! perche' viene parsato come +39). Il
// prefisso ' (apostrofo) e' lo standard Google Sheets per "tratta come testo".
// Lo USER_ENTERED rispetta l'apostrofo e lo nasconde nella visualizzazione.
function safeSheetCellValue(value) {
  if (value == null) return "";
  const str = String(value);
  if (!str.length) return str;
  const first = str.charAt(0);
  if (first === "+" || first === "-" || first === "=" || first === "@") {
    return "'" + str;
  }
  return str;
}

// Mappa un record sales_request → array di valori coerente con gli headers del foglio.
// Usata per APPEND (orfani imap → nuova riga sheets).
function buildSalesRequestSheetRow(record, columns, rawHeaders = []) {
  const row = new Array(rawHeaders.length).fill("");
  const setAt = (a1Letter, value) => {
    if (!a1Letter) return;
    let idx = 0;
    for (const ch of String(a1Letter).toUpperCase()) {
      idx = idx * 26 + (ch.charCodeAt(0) - 64);
    }
    idx -= 1;
    if (idx >= 0 && idx < row.length) row[idx] = safeSheetCellValue(value);
  };
  const fullName = [record.name || record.first_name || record.firstName || "", record.surname || record.last_name || record.lastName || ""]
    .filter(Boolean).join(" ").trim();
  setAt(columns.fullName, fullName);
  setAt(columns.name, record.name || record.first_name || record.firstName || "");
  setAt(columns.surname, record.surname || record.last_name || record.lastName || "");
  setAt(columns.city, record.city || "");
  setAt(columns.phone, record.phone || record.telefono || "");
  setAt(columns.email, record.email || "");
  setAt(columns.sqm, record.sqm || record.metri_quadri || "");
  setAt(columns.requestedHeight, record.requestedHeight || record.altezza || "");
  setAt(columns.service, record.service || record.posa_in_opera || "");
  setAt(columns.surface, record.surface || record.fondo || "");
  setAt(columns.note, record.note || "");
  setAt(columns.whatsappTemplate, record.whatsappTemplate || "");
  setAt(columns.source, record.source || "imap");
  setAt(columns.assignment, serializeSalesRequestAssignmentForSheet(record.assignment));
  setAt(columns.status, serializeSalesRequestStatusForSheet(record.status));
  return row;
}

async function syncSalesRequestsToGoogleSheet(config = {}, records = []) {
  const normalizedConfig = normalizeSalesRequestSourceConfig(config);
  if (!normalizedConfig.serviceAccountEmail || !normalizedConfig.privateKey) {
    return { action: "skipped", reason: "missing_service_account", updatedCells: 0 };
  }
  const allRecords = (Array.isArray(records) ? records : [])
    .map(normalizeSalesRequestRecord)
    .map((r) => backfillSheetSourceFields(r, normalizedConfig));
  // I record già provenienti da Sheets vengono UPDATE-ati alla loro riga esistente.
  const googleRecords = allRecords.filter((record) => getGoogleSheetRequestRecordKey(record));
  // I record di altra origine (imap/manual) che NON sono ancora su Sheets
  // vengono APPESI come nuove righe (Fase 5 mirror Portal→Sheets).
  // Servono dati cliente per evitare di appendere righe vuote.
  const orphanRecords = allRecords.filter((record) => {
    if (getGoogleSheetRequestRecordKey(record)) return false;
    const src = String(record.source || "").toLowerCase();
    if (src === "google-sheets") return false; // safety
    const hasContact = Boolean(record.email || record.phone);
    const hasName = Boolean(record.name || record.surname);
    return hasContact && hasName;
  });
  if (!googleRecords.length && !orphanRecords.length) {
    return { action: "skipped", reason: "no_records_to_mirror", updatedCells: 0 };
  }

  let updatedCells = 0;
  let updatedRows = 0;
  let appendedRows = 0;

  // ─── UPDATE: record che vengono originariamente da Sheets ────────────────
  if (googleRecords.length) {
    const dataBySpreadsheet = new Map();
    const groups = new Map();
    googleRecords.forEach((record) => {
      const key = getGoogleSheetRequestRecordKey(record);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });
    for (const recordsGroup of groups.values()) {
      const firstRecord = recordsGroup[0];
      const spreadsheetId = String(firstRecord.sourceSpreadsheetId || "").trim();
      const sheetName = String(firstRecord.sourceSheetName || "").trim();
      const columns = await getSalesRequestSheetWriteColumns(normalizedConfig, spreadsheetId, sheetName);
      if (!dataBySpreadsheet.has(spreadsheetId)) dataBySpreadsheet.set(spreadsheetId, []);
      const data = dataBySpreadsheet.get(spreadsheetId);
      recordsGroup.forEach((record) => {
        const rowNumber = Number(record.sourceRowNumber || 0);
        // Fase 5: estendiamo l'update a TUTTI i campi conosciuti (era solo
        // assignment + status). I dati cliente vengono mantenuti aggiornati
        // anche se modificati nel CRM.
        const pushCell = (a1, value) => {
          if (!a1 || value == null) return;
          data.push({
            range: `${quoteSheetName(sheetName)}!${a1}${rowNumber}`,
            values: [[safeSheetCellValue(value)]],
          });
        };
        pushCell(columns.assignment, serializeSalesRequestAssignmentForSheet(record.assignment));
        pushCell(columns.status, serializeSalesRequestStatusForSheet(record.status));
        pushCell(columns.note, record.note || "");
        pushCell(columns.whatsappTemplate, record.whatsappTemplate || "");
        // Dati cliente: solo se non vuoti (non sovrascrivere con "" su Sheets)
        if (record.name) pushCell(columns.name, record.name);
        if (record.surname) pushCell(columns.surname, record.surname);
        if (record.city) pushCell(columns.city, record.city);
        if (record.phone) pushCell(columns.phone, record.phone);
        if (record.email) pushCell(columns.email, record.email);
        if (record.sqm) pushCell(columns.sqm, record.sqm);
        if (record.requestedHeight) pushCell(columns.requestedHeight, record.requestedHeight);
        if (record.service) pushCell(columns.service, record.service);
        if (record.surface) pushCell(columns.surface, record.surface);
      });
    }
    const updateBatches = Array.from(dataBySpreadsheet.entries()).filter(([, data]) => data.length);
    for (const [spreadsheetId, data] of updateBatches) {
      const payload = await googleSheetsFetch(
        normalizedConfig,
        `/spreadsheets/${spreadsheetId}/values:batchUpdate`,
        {
          method: "POST",
          body: JSON.stringify({
            valueInputOption: "USER_ENTERED",
            data,
          }),
        },
      );
      updatedCells += Number(payload?.totalUpdatedCells || data.length);
      updatedRows += Number(payload?.totalUpdatedRows || 0);
    }
  }

  // ─── APPEND: record orfani (imap/manual) non ancora su Sheets ────────────
  // Fase 5 mirror Portal→Sheets. Risolviamo lo spreadsheet attivo dal config.
  if (orphanRecords.length) {
    try {
      if (normalizedConfig.spreadsheetInput) {
        const spreadsheetId = resolveSpreadsheetId(normalizedConfig.spreadsheetInput);
        // Metadata per risolvere nome del foglio attivo
        const metadata = await googleSheetsFetch(
          normalizedConfig,
          `/spreadsheets/${spreadsheetId}?fields=sheets.properties.title,sheets.properties.index`,
        );
        const sheetName = getResolvedSheetTitle(normalizedConfig, metadata);
        if (sheetName) {
          const colsResp = await getSalesRequestSheetWriteColumns(normalizedConfig, spreadsheetId, sheetName);
          const rawHeaders = colsResp._rawHeaders || [];
          const rows = orphanRecords.map((record) => buildSalesRequestSheetRow(record, colsResp, rawHeaders));
          if (rows.length && rawHeaders.length) {
            const encodedRange = encodeURIComponent(quoteSheetName(sheetName));
            const appendPayload = await googleSheetsFetch(
              normalizedConfig,
              `/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
              {
                method: "POST",
                body: JSON.stringify({ values: rows }),
              },
            );
            appendedRows = Number(appendPayload?.updates?.updatedRows || rows.length);
            updatedCells += Number(appendPayload?.updates?.updatedCells || 0);
          }
        }
      }
    } catch (err) {
      console.warn("[mirror-sheets] append orfani fallito:", err?.message || err);
    }
  }

  return {
    action: updatedRows || appendedRows ? "updated" : "skipped",
    updatedCells,
    updatedRows: updatedRows + appendedRows,
    appendedRows,
  };
}

async function safeSyncSalesRequestsToGoogleSheet(config = {}, records = []) {
  try {
    return await syncSalesRequestsToGoogleSheet(config, records);
  } catch (error) {
    console.error("sales_request_google_sheet_sync_failed", error);
    return {
      action: "failed",
      reason: String(error?.message || "google_sheet_sync_failed"),
      updatedCells: 0,
    };
  }
}

function getSalesRequestSheetSyncQueueKey(record = {}) {
  return String(record.id || getGoogleSheetRequestRecordKey(record) || randomUUID()).trim();
}

function scheduleSalesRequestSheetSyncFlush() {
  if (salesRequestSheetSyncTimer) return;
  salesRequestSheetSyncTimer = setTimeout(() => {
    salesRequestSheetSyncTimer = null;
    flushSalesRequestSheetSyncQueue();
  }, SALES_REQUEST_SHEET_SYNC_DEBOUNCE_MS);
  salesRequestSheetSyncTimer.unref?.();
}

// Bugfix: i record google-sheets nello store possono avere
// sourceSpreadsheetId/sourceSheetName/sourceRowNumber vuoti perche' il DB SQL
// (mapSalesRequestRowToObject) non li persiste. Li ricostruisco da 2 fonti:
// 1) L'ID del record ha formato "gs:<spreadsheetId>:<sheetKey>:<rowNumber>"
// 2) La config Sheets corrente come fallback per spreadsheetId e sheetName
function backfillSheetSourceFields(record, normalizedConfig) {
  if (!record || record.source !== "google-sheets") return record;
  const idStr = String(record.id || "");
  if (idStr.startsWith("gs:")) {
    const parts = idStr.split(":");
    if (parts.length >= 4) {
      if (!record.sourceSpreadsheetId) record.sourceSpreadsheetId = parts[1];
      if (!record.sourceRowNumber) {
        const lastPart = Number(parts[parts.length - 1]) || 0;
        if (lastPart > 0) record.sourceRowNumber = lastPart;
      }
    }
  }
  // sheet name non e' nel ID in formato originale (e' normalizeSheetKey-ato).
  // Recuperiamo il nome esatto del foglio dalla config attuale.
  if (!record.sourceSheetName && normalizedConfig?.sheetName) {
    record.sourceSheetName = normalizedConfig.sheetName;
  }
  // Fallback ultimissimo: spreadsheet ID dalla config se ID record non aiuta
  if (!record.sourceSpreadsheetId && normalizedConfig?.spreadsheetInput) {
    try {
      record.sourceSpreadsheetId = resolveSpreadsheetId(normalizedConfig.spreadsheetInput);
    } catch {}
  }
  return record;
}

function enqueueSalesRequestsGoogleSheetSync(config = {}, records = []) {
  const normalizedConfig = normalizeSalesRequestSourceConfig(config);
  // Diagnostic log: ogni chiamata loggata con sample, prima di ogni filtro.
  // Cosi' sappiamo se la funzione viene chiamata e perche' eventualmente skippa.
  const inputSample = (Array.isArray(records) ? records : []).slice(0, 3).map((r) => ({
    id: String(r?.id || "").slice(0, 40),
    source: r?.source,
    name: [r?.name, r?.surname].filter(Boolean).join(" "),
    status: r?.status,
    assignment: r?.assignment,
    sourceSpreadsheetId: String(r?.sourceSpreadsheetId || "").slice(0, 20),
    sourceSheetName: r?.sourceSheetName,
    sourceRowNumber: r?.sourceRowNumber,
    hasContact: Boolean(r?.email || r?.phone),
    hasName: Boolean(r?.name || r?.surname),
  }));
  console.log("[sheet-mirror] enqueue called", {
    count: Array.isArray(records) ? records.length : 0,
    configReady: Boolean(normalizedConfig.serviceAccountEmail && normalizedConfig.privateKey),
    sample: inputSample,
  });
  if (!normalizedConfig.serviceAccountEmail || !normalizedConfig.privateKey) {
    console.warn("[sheet-mirror] enqueue skipped: missing_service_account");
    return { action: "skipped", reason: "missing_service_account", updatedCells: 0 };
  }
  // Fase 5 mirror Portal→Sheets: accodiamo anche record non-google-sheets
  // (orfani imap/manual) per fare APPEND di nuove righe su Sheets.
  // Filtra solo record che hanno dati cliente minimi (nome + contatto).
  const allRecords = (Array.isArray(records) ? records : [])
    .map(normalizeSalesRequestRecord)
    .map((r) => backfillSheetSourceFields(r, normalizedConfig));
  const googleRecords = allRecords.filter((record) => getGoogleSheetRequestRecordKey(record));
  const orphanRecords = allRecords.filter((record) => {
    if (getGoogleSheetRequestRecordKey(record)) return false;
    const src = String(record.source || "").toLowerCase();
    if (src === "google-sheets") return false;
    return Boolean((record.email || record.phone) && (record.name || record.surname));
  });
  const queueRecords = [...googleRecords, ...orphanRecords];
  console.log("[sheet-mirror] enqueue split", {
    total: allRecords.length,
    googleSheetsRecords: googleRecords.length,
    orphanRecords: orphanRecords.length,
    skippedReasons: allRecords
      .filter((r) => !queueRecords.includes(r))
      .slice(0, 3)
      .map((r) => ({
        id: String(r?.id || "").slice(0, 40),
        source: r?.source,
        sourceKey: getGoogleSheetRequestRecordKey(r),
        sourceRowNumber: r?.sourceRowNumber,
        hasContact: Boolean(r?.email || r?.phone),
        hasName: Boolean(r?.name || r?.surname),
      })),
  });
  if (!queueRecords.length) {
    console.warn("[sheet-mirror] enqueue skipped: no_records_to_mirror");
    return { action: "skipped", reason: "no_records_to_mirror", updatedCells: 0 };
  }
  pendingSalesRequestSheetSyncConfig = normalizedConfig;
  queueRecords.forEach((record) => {
    pendingSalesRequestSheetSyncRecords.set(getSalesRequestSheetSyncQueueKey(record), record);
  });
  scheduleSalesRequestSheetSyncFlush();
  return {
    action: "queued",
    queuedRows: googleRecords.length,
    pendingRows: pendingSalesRequestSheetSyncRecords.size,
    updatedCells: 0,
  };
}

async function flushSalesRequestSheetSyncQueue() {
  if (salesRequestSheetSyncInFlight) {
    scheduleSalesRequestSheetSyncFlush();
    return;
  }
  const records = Array.from(pendingSalesRequestSheetSyncRecords.values());
  const config = pendingSalesRequestSheetSyncConfig || {};
  pendingSalesRequestSheetSyncRecords.clear();
  if (!records.length) return;
  salesRequestSheetSyncInFlight = true;
  // Log: ID, source, e (per debug) source key. Cosi' dai log capiamo se il
  // mirror sta processando record google-sheets, imap, o altro.
  console.log("[sheet-mirror] flush", {
    count: records.length,
    sample: records.slice(0, 3).map((r) => ({
      id: String(r.id || "").slice(0, 40),
      source: r.source,
      name: [r.name, r.surname].filter(Boolean).join(" "),
      status: r.status,
      assignment: r.assignment,
      sourceKey: getGoogleSheetRequestRecordKey(r),
      sourceRowNumber: r.sourceRowNumber,
    })),
  });
  try {
    const result = await safeSyncSalesRequestsToGoogleSheet(config, records);
    console.log("[sheet-mirror] result", result);
    if (result.action === "failed") {
      console.error("sales_request_google_sheet_background_sync_failed", result);
    }
  } finally {
    salesRequestSheetSyncInFlight = false;
    if (pendingSalesRequestSheetSyncRecords.size) {
      scheduleSalesRequestSheetSyncFlush();
    }
  }
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
      if (!getSalesRequestSqm(draft)) {
        const fallbackSqm = pickSalesRequestSqmFromSheetRow(headers, row);
        if (fallbackSqm) draft.sqm = fallbackSqm;
      }
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
  const firstContactState = normalizeSalesRequestFirstContactState(item.firstContactState || item.firstContact?.state || "");
  const hasExplicitAssignment = Object.prototype.hasOwnProperty.call(item, "assignment");
  const assignment = normalizeSalesRequestAssignment(hasExplicitAssignment ? item.assignment : (item.assegnazione || item.firstContactBy || item.firstContact?.by || ""));
  const statusIsUnset = !rawStatus || rawStatus === "new";
  const status = firstContactState === "sent" && statusIsUnset
    ? SALES_REQUEST_FIRST_CONTACT_SENT_STATUS
    : firstContactState === "queued" && statusIsUnset
      ? SALES_REQUEST_FIRST_CONTACT_QUEUED_STATUS
      : rawStatus || "new";
  return {
    id: String(item.id || randomUUID()),
    name: String(item.name || item.nome || "").trim(),
    surname: String(item.surname || item.cognome || "").trim(),
    city: String(item.city || item.citta || "").trim(),
    phone: String(item.phone || item.telefono || "").trim(),
    email: String(item.email || "").trim(),
    sqm: getSalesRequestSqm(item),
    requestedHeight: normalizeSalesRequestHeight(getSalesRequestRawHeightValue(item)),
    service: normalizeSalesRequestService(item.service || item.servizio || ""),
    surface: normalizeSalesRequestSurface(item.surface || item.fondo || ""),
    assignment,
    status,
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
    firstContactState,
    firstContactScheduledAt: normalizeIsoDateTime(item.firstContactScheduledAt || item.firstContact?.scheduledAt || ""),
    firstContactSentAt: normalizeIsoDateTime(item.firstContactSentAt || item.firstContact?.sentAt || ""),
    firstContactBy: hasExplicitAssignment && !assignment ? "" : normalizeSalesRequestAssignment(item.firstContactBy || item.firstContact?.by || ""),
    firstContactAt: normalizeIsoDateTime(item.firstContactAt || item.firstContact?.at || ""),
    quotedAt: normalizeIsoDateTime(item.quotedAt || ""),
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

function normalizeAttachmentLocalPath(value = "") {
  const normalized = String(value || "")
    .replace(/\\/g, "/")
    .trim();
  if (!normalized) return "";
  return normalized
    .split("/")
    .filter((segment) => segment && segment !== "." && segment !== "..")
    .join("/");
}

function resolveAttachmentLocalPath(localPath = "") {
  const normalized = normalizeAttachmentLocalPath(localPath);
  if (!normalized) return "";
  const rootPath = resolve(LOCAL_ATTACHMENTS_DIR);
  const absolutePath = resolve(join(rootPath, normalized));
  if (absolutePath !== rootPath && !absolutePath.startsWith(`${rootPath}${sep}`)) return "";
  return absolutePath;
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

function buildLocalAttachmentRecord(ownerId = "", attachment = {}, parsed = null, resource = "orders") {
  if (!parsed?.buffer?.length) return null;
  const attachmentId = String(attachment.id || randomUUID());
  const contentType = String(attachment.type || parsed.contentType || "application/octet-stream").trim();
  const fallbackExtension = getMimeTypeExtension(contentType);
  const safeName = sanitizeAttachmentName(attachment.name, fallbackExtension);
  const bucketPrefix = resource === "sales-content"
    ? "sales-content"
    : resource === "marketing-public" ? "marketing-public"
    : resource === "work-reports" ? "work-reports"
    : "orders";
  const ownerSegment = String(ownerId || resource).replace(/[^\w.-]+/g, "_");
  const relativePath = normalizeAttachmentLocalPath(`${bucketPrefix}/${ownerSegment}/${attachmentId}-${safeName}`);
  const absolutePath = resolveAttachmentLocalPath(relativePath);
  if (!absolutePath) return null;
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, parsed.buffer);
  return {
    ...attachment,
    id: attachmentId,
    name: safeName,
    type: contentType,
    size: Number(attachment.size || parsed.buffer.length || 0),
    storage: "file",
    localPath: relativePath,
    dataUrl: "",
  };
}

function normalizeAttachmentRecord(item = {}, ownerId = "", resource = "orders") {
  const attachmentId = String(item.id || randomUUID());
  const hasR2Object = String(item.storage || "").trim() === "r2" && String(item.objectKey || "").trim();
  const normalizedLocalPath = normalizeAttachmentLocalPath(item.localPath || "");
  const hasLocalFile = String(item.storage || "").trim() === "file" && normalizedLocalPath;
  return {
    id: attachmentId,
    name: String(item.name || "Allegato").trim() || "Allegato",
    type: String(item.type || "application/octet-stream").trim() || "application/octet-stream",
    size: Math.max(0, Number(item.size || 0)),
    createdAt: String(item.createdAt || new Date().toISOString()),
    storage: hasR2Object ? "r2" : (hasLocalFile ? "file" : "inline"),
    objectKey: hasR2Object ? String(item.objectKey || "").trim() : "",
    localPath: hasLocalFile ? normalizedLocalPath : "",
    dataUrl: hasR2Object || hasLocalFile ? "" : String(item.dataUrl || ""),
    context: String(item.context || "").trim(),
    url: String(item.url || "").trim() || buildAttachmentProxyPath(ownerId, attachmentId, resource),
  };
}

function migrateInlineAttachmentToLocalFile(item = {}, ownerId = "", resource = "orders") {
  if (USE_R2) return { attachment: item, migrated: false };
  if (String(item.storage || "").trim() !== "inline") return { attachment: item, migrated: false };
  if (!String(item.dataUrl || "").trim()) return { attachment: item, migrated: false };
  const parsed = parseDataUrl(item.dataUrl || "");
  const saved = buildLocalAttachmentRecord(ownerId, item, parsed, resource);
  if (!saved) return { attachment: item, migrated: false };
  return { attachment: normalizeAttachmentRecord(saved, ownerId, resource), migrated: true };
}

function normalizeAndMigrateAttachments(items = [], ownerId = "", resource = "orders") {
  if (!Array.isArray(items)) return { attachments: [], migrated: false };
  let migrated = false;
  const attachments = items.map((item) => {
    const normalized = normalizeAttachmentRecord(item, ownerId, resource);
    const migration = migrateInlineAttachmentToLocalFile(normalized, ownerId, resource);
    if (migration.migrated) migrated = true;
    return migration.attachment;
  });
  return { attachments, migrated };
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
    objectKey: "",
    localPath: "",
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

function normalizeMarketingPublicAssetRecord(item = {}) {
  const assetId = String(item.id || randomUUID()).trim();
  const createdAt = String(item.createdAt || new Date().toISOString());
  const expiresAt = String(item.expiresAt || new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString());
  return {
    id: assetId,
    createdAt,
    expiresAt,
    attachment: normalizeAttachmentRecord(item.attachment || item, assetId, "marketing-public"),
  };
}

function normalizeMarketingPublicAssets(items = []) {
  if (!Array.isArray(items)) return [];
  const now = Date.now();
  return items
    .map(normalizeMarketingPublicAssetRecord)
    .filter((item) => {
      const expires = new Date(item.expiresAt || 0).getTime();
      return !Number.isFinite(expires) || expires > now;
    })
    .slice(0, 200);
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
      requestTimeout: 20000,
    });
  }
  return getR2Client.client;
}

async function storeAttachmentBuffer(ownerId, attachment = {}, buffer = Buffer.alloc(0), resource = "orders") {
  const attachmentId = String(attachment.id || randomUUID());
  const safeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  const contentType = String(attachment.type || "application/octet-stream").trim() || "application/octet-stream";

  if (!safeBuffer.length) {
    return normalizeAttachmentRecord(
      {
        ...attachment,
        id: attachmentId,
        type: contentType,
        size: Number(attachment.size || 0),
        storage: "inline",
      },
      ownerId,
      resource,
    );
  }

  if (!USE_R2) {
    try {
      const savedLocalAttachment = buildLocalAttachmentRecord(
        ownerId,
        { ...attachment, id: attachmentId, type: contentType, size: Number(attachment.size || safeBuffer.length || 0) },
        { contentType, buffer: safeBuffer },
        resource,
      );
      if (savedLocalAttachment) {
        return normalizeAttachmentRecord(savedLocalAttachment, ownerId, resource);
      }
    } catch (error) {
      console.error("attachment_local_store_failed", error);
    }
    return normalizeAttachmentRecord(
      {
        ...attachment,
        id: attachmentId,
        type: contentType,
        size: Number(attachment.size || safeBuffer.length || 0),
        storage: "inline",
        dataUrl: `data:${contentType};base64,${safeBuffer.toString("base64")}`,
      },
      ownerId,
      resource,
    );
  }

  const client = await getR2Client();
  const sdk = await getR2Sdk();
  const fallbackExtension = getMimeTypeExtension(contentType);
  const safeName = sanitizeAttachmentName(attachment.name, fallbackExtension);
  const bucketPrefix = resource === "sales-content"
    ? "sales-content"
    : resource === "marketing-public" ? "marketing-public"
    : resource === "work-reports" ? "work-reports"
    : "orders";
  const objectKey = `${bucketPrefix}/${String(ownerId || resource).replace(/[^\w.-]+/g, "_")}/${attachmentId}-${safeName}`;

  await client.send(new sdk.PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: objectKey,
    Body: safeBuffer,
    ContentType: contentType,
    ContentLength: safeBuffer.length,
  }));

  return normalizeAttachmentRecord(
    {
      ...attachment,
      id: attachmentId,
      name: safeName,
      type: contentType,
      size: Number(attachment.size || safeBuffer.length || 0),
      storage: "r2",
      objectKey,
      dataUrl: "",
    },
    ownerId,
    resource,
  );
}

async function storeAttachmentAsset(ownerId, attachment = {}, resource = "orders") {
  const parsed = parseDataUrl(attachment.dataUrl || "");
  if (!parsed?.buffer?.length) {
    return normalizeAttachmentRecord(
      {
        ...attachment,
        id: String(attachment.id || randomUUID()),
        storage: "inline",
      },
      ownerId,
      resource,
    );
  }
  return storeAttachmentBuffer(
    ownerId,
    {
      ...attachment,
      type: String(attachment.type || parsed.contentType || "application/octet-stream").trim(),
      size: Number(attachment.size || parsed.buffer.length || 0),
    },
    parsed.buffer,
    resource,
  );
}

async function removeAttachmentAsset(attachment = {}) {
  const storageType = String(attachment.storage || "").trim();
  if (storageType === "file") {
    const absolutePath = resolveAttachmentLocalPath(attachment.localPath || "");
    if (absolutePath && existsSync(absolutePath)) {
      try {
        unlinkSync(absolutePath);
      } catch {}
    }
    return;
  }
  if (storageType !== "r2") return;
  if (!USE_R2) return;
  if (!String(attachment.objectKey || "").trim()) return;
  const client = await getR2Client();
  const sdk = await getR2Sdk();
  await client.send(new sdk.DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: String(attachment.objectKey).trim(),
  }));
}

function scheduleAttachmentAssetRemoval(items = [], logLabel = "attachment_delete_failed") {
  const queue = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!queue.length) return;
  setTimeout(() => {
    queue.forEach((attachment) => {
      removeAttachmentAsset(attachment).catch((error) => {
        console.error(logLabel, error);
      });
    });
  }, 0);
}

async function streamAttachmentAsset(res, attachment = {}, { cacheControl = "private, max-age=300" } = {}) {
  const storageType = String(attachment.storage || "").trim();
  if (storageType === "file") {
    const absolutePath = resolveAttachmentLocalPath(attachment.localPath || "");
    if (!absolutePath || !existsSync(absolutePath)) {
      return sendJson(res, 404, { error: "attachment_not_found" });
    }
    try {
      const stream = createReadStream(absolutePath);
      res.writeHead(200, {
        "Content-Type": attachment.type || "application/octet-stream",
        "Cache-Control": cacheControl,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      });
      stream.on("error", () => {
        if (!res.headersSent) {
          sendJson(res, 500, { error: "attachment_stream_failed" });
        } else {
          res.end();
        }
      });
      stream.pipe(res);
      return;
    } catch {
      return sendJson(res, 500, { error: "attachment_stream_failed" });
    }
  }
  if (storageType !== "r2") {
    const inlineData = parseDataUrl(attachment.dataUrl || "");
    if (!inlineData?.buffer?.length) {
      return sendJson(res, 404, { error: "attachment_not_found" });
    }
    res.writeHead(200, {
      "Content-Type": attachment.type || inlineData.contentType || "application/octet-stream",
      "Content-Length": inlineData.buffer.length,
      "Cache-Control": cacheControl,
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
    "Cache-Control": cacheControl,
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
      inventoryAllocations: [],
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
      profitSplit: null,
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
      inventoryAllocations: Array.isArray(current.warehouse?.inventoryAllocations)
        ? current.warehouse.inventoryAllocations.map((item) => normalizeInventoryAllocationRecord(item)).filter((item) => item.pieceId || item.product)
        : [],
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
      profitSplit: normalizeProfitSplitRecord(current.installation?.profitSplit),
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
    ? store.inventory.map((item) => {
        if (!item || !item.id) changed = true;
        return normalizeInventoryPieceRecord(item);
      })
    : [];

  store.salesRequests = Array.isArray(store.salesRequests)
    ? store.salesRequests.map((item) => normalizeSalesRequestRecord(item))
    : [];

  store.salesContents = Array.isArray(store.salesContents)
    ? store.salesContents.map((item) => {
        const normalized = normalizeSalesContentRecord(item);
        const attachmentResult = normalizeAndMigrateAttachments(normalized.attachments, normalized.id, "sales-content");
        if (attachmentResult.migrated) changed = true;
        return {
          ...normalized,
          attachments: attachmentResult.attachments,
        };
    })
    : [];

  store.marketingPublicAssets = normalizeMarketingPublicAssets(store.marketingPublicAssets);

  store.usageEvents = Array.isArray(store.usageEvents)
    ? store.usageEvents.map(normalizeUsageEventRecord).filter(Boolean).slice(0, 5000)
    : [];

  const normalizedCommunications = normalizeCommunicationsStore(store.communications || {});
  if (!store.communications || typeof store.communications !== "object") changed = true;
  if (
    !Array.isArray(store.communications?.threads)
    || !Array.isArray(store.communications?.messages)
    || normalizedCommunications.threads.length !== (store.communications?.threads || []).length
    || normalizedCommunications.messages.length !== (store.communications?.messages || []).length
  ) {
    changed = true;
  }
  store.communications = normalizedCommunications;

  store.salesRequestSource = normalizeSalesRequestSourceConfig(store.salesRequestSource || defaults.salesRequestSource);

  store.jobs = Array.isArray(store.jobs) ? store.jobs : [];
  store.orders = Array.isArray(store.orders) ? store.orders : [];
  store.coveragePlanner = normalizeCoveragePlanner(store.coveragePlanner || defaults.coveragePlanner);
  store.securityEvents = Array.isArray(store.securityEvents) ? store.securityEvents : [];
  store.pushSubscriptions = Array.isArray(store.pushSubscriptions) ? store.pushSubscriptions : [];
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
    if (Array.isArray(nextOrder.attachments)) {
      const attachmentResult = normalizeAndMigrateAttachments(nextOrder.attachments, nextOrder.id, "orders");
      nextOrder.attachments = attachmentResult.attachments;
      if (attachmentResult.migrated) changed = true;
    } else {
      nextOrder.attachments = [];
    }
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
        ? (() => {
            const attachmentResult = normalizeAndMigrateAttachments(job.attachments, job.sourceOrderId || job.id, "orders");
            if (attachmentResult.migrated) changed = true;
            return attachmentResult.attachments;
          })()
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
    ? node.lineItems.edges
        .filter(({ node: item }) => Number(item.currentQuantity || 0) > 0)
        .map(({ node: item }) => normalizeLineDetailRecord({
          title: item.name || "Prodotto",
          quantity: Number(item.currentQuantity || 1),
          sku: item.sku,
          variantTitle: item.variantTitle,
          customAttributes: item.customAttributes,
          taxable: item.taxable,
          requiresShipping: item.requiresShipping,
          taxLines: item.taxLines,
          totalPrice: item.discountedTotalSet?.shopMoney?.amount,
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

  async function fetchRecentRestOrders() {
    let lastError = null;
    const fields = [
      "id",
      "admin_graphql_api_id",
      "name",
      "email",
      "note",
      "current_total_price",
      "current_total_tax",
      "current_subtotal_price",
      "total_price",
      "total_tax",
      "subtotal_price",
      "taxes_included",
      "financial_status",
      "fulfillment_status",
      "payment_gateway_names",
      "billing_address",
      "customer",
      "shipping_address",
      "line_items",
      "created_at",
      "updated_at",
      "processed_at",
      "note_attributes",
      "currency",
      "presentment_currency",
    ].join(",");
    const firstPage = new URL(`https://${storeDomain}/admin/api/2026-01/orders.json`);
    firstPage.searchParams.set("status", "any");
    firstPage.searchParams.set("limit", "250");
    firstPage.searchParams.set("order", "created_at desc");
    firstPage.searchParams.set("fields", fields);

    async function fetchRestPage(pageUrl, pageLabel) {
      for (let attempt = 0; attempt <= SHOPIFY_MAX_RETRIES; attempt += 1) {
        try {
          const response = await fetchWithTimeout(pageUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": accessToken,
            },
          });

          if (!response.ok) {
            const payload = await parseShopifyResponse(response);
            const responseText = payload?.rawText || payload?.errors?.map((item) => item.message || item).join(" | ") || "";
            if (attempt < SHOPIFY_MAX_RETRIES && isRetryableShopifyStatus(response.status)) {
              await wait(500 * (attempt + 1));
              continue;
            }
            throw new Error(responseText ? `shopify_sync_failed: ${pageLabel} ${response.status} ${responseText}` : `shopify_sync_failed: ${pageLabel} ${response.status}`);
          }

          const payload = await response.json().catch(() => ({}));
          return {
            orders: Array.isArray(payload?.orders) ? payload.orders : [],
            nextPageUrl: getNextShopifyPageUrl(response),
          };
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
      throw lastError || new Error(`shopify_sync_failed: ${pageLabel}`);
    }

    const orders = [];
    let nextPageUrl = firstPage.toString();
    for (let page = 0; page < 4 && nextPageUrl; page += 1) {
      const pageResult = await fetchRestPage(nextPageUrl, `rest_orders_page_${page + 1}`);
      orders.push(...pageResult.orders);
      nextPageUrl = pageResult.nextPageUrl;
    }
    return orders.map((order, index) => normalizeOrderPayload(order, index));
  }

  const recentQuery = `
    query VertexOpsRecentOrders {
      orders(first: 100, sortKey: PROCESSED_AT, reverse: true) {
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
        first: 150,
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

  const [recentResult, openResult, restResult] = await Promise.allSettled([
    fetchOrderBatch(recentQuery, "recent_orders"),
    fetchOrderBatch(openOrdersQuery, "open_orders"),
    fetchRecentRestOrders(),
  ]);
  const recentEdges = recentResult.status === "fulfilled" ? recentResult.value : [];
  const openEdges = openResult.status === "fulfilled" ? openResult.value : [];
  const recentRestOrders = restResult.status === "fulfilled" ? restResult.value : [];
  const syncErrors = [recentResult, openResult, restResult]
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason);
  if (!recentEdges.length && !openEdges.length && !recentRestOrders.length && syncErrors.length) {
    throw syncErrors[0];
  }
  syncErrors.forEach((error) => {
    console.warn("shopify_sync_partial_failure", error?.message || error);
  });
  const uniqueNodes = new Map();
  [...recentEdges, ...openEdges].forEach((edge) => {
    if (edge?.node?.id) uniqueNodes.set(edge.node.id, edge.node);
  });
  const normalizedGraphql = [...uniqueNodes.values()].map((node, index) => normalizeGraphqlOrder(node, index));
  const normalizedByShopifyId = new Map();
  [...recentRestOrders, ...normalizedGraphql].forEach((order) => {
    const key = String(getNormalizedShopifyGraphqlId(order) || getNormalizedShopifyNumericId(order) || order.id || "").trim();
    if (key) {
      const existing = normalizedByShopifyId.get(key) || null;
      normalizedByShopifyId.set(key, existing ? { ...existing, ...order } : order);
    }
  });
  const normalized = [...normalizedByShopifyId.values()];
  store.shopifySettings.lastSyncAt = new Date().toISOString();
  store.shopifySettings.lastSyncStatus = "ok";
  store.shopifySettings.lastSyncMessage = syncErrors.length
    ? `Sincronizzati ${normalized.length} ordini con fallback REST. ${syncErrors.length} chiamate Shopify non essenziali fallite.`
    : `Sincronizzati ${normalized.length} ordini Shopify.`;
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

async function getSessionContextFromUsers(req, users = []) {
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
  const user = Array.isArray(users) ? users.find((item) => item.id === userId) || null : null;
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

function buildInventoryItemsFromBody(body = {}) {
  const quantity = Math.max(1, Math.round(toNumber(body.quantity || 1)));
  const product = String(body.product || "").trim();
  const width = toNumber(body.width || 0);
  const length = toNumber(body.length || 0);
  const note = String(body.note || "");
  const status = normalizeInventoryPieceType(body.pieceType || body.status);
  const measured = body.measured !== false && body.measured !== "false";
  if (!product) {
    return { error: "invalid_inventory_payload", created: [] };
  }
  const created = measured
    ? Array.from({ length: quantity }, () => ({
      id: randomUUID(),
      product,
      width,
      length,
      sqm: width && length ? Number((width * length).toFixed(2)) : 0,
      variant: String(body.variant || ""),
      status: status === "taglio" ? "residuo" : status,
      pieceType: status,
      pieceState: "disponibile",
      committedOrderId: "",
      committedOrderNumber: "",
      allocationId: "",
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
      status: status === "taglio" ? "residuo" : status,
      pieceType: status,
      pieceState: "disponibile",
      committedOrderId: "",
      committedOrderNumber: "",
      allocationId: "",
      note,
      units: quantity,
      createdAt: new Date().toISOString(),
    }];
  return { error: "", created };
}

async function readStoreFieldFromDatabase(field, fallback) {
  if (!USE_POSTGRES) return fallback;
  await ensureDatabaseStorage();
  const pool = await getPgPool();
  const result = await pool.query(
    "SELECT jsonb_extract_path(payload, $2::text) AS value FROM app_documents WHERE key = $1 LIMIT 1",
    [STORE_DOC_KEY, field],
  );
  return result.rows?.[0]?.value ?? fallback;
}

async function handleFastInventoryItemsPost(req, res) {
  if (!USE_POSTGRES) return false;
  const users = await readStoreFieldFromDatabase("users", []);
  const sessionContext = await getSessionContextFromUsers(req, users);
  if (!sessionContext.user) {
    return sendJson(
      res,
      401,
      { error: "unauthorized" },
      { "Set-Cookie": buildExpiredSessionCookie() },
    );
  }
  const body = await readBody(req);
  const payload = buildInventoryItemsFromBody(body);
  if (payload.error) {
    return sendJson(res, 400, { error: payload.error });
  }
  const revision = buildStoreRevisionToken();
  try {
    await ensureDatabaseStorage();
    const pool = await getPgPool();
    const result = await pool.query(
      `
        UPDATE app_documents
        SET payload = jsonb_set(
          jsonb_set(
            payload,
            '{inventory}',
            $2::jsonb || COALESCE(payload->'inventory', '[]'::jsonb),
            true
          ),
          '{_storeRevision}',
          to_jsonb($3::text),
          true
        ),
        updated_at = NOW()
        WHERE key = $1
        RETURNING payload->'inventory' AS inventory
      `,
      [STORE_DOC_KEY, JSON.stringify(payload.created), revision],
    );
    runtimeStoreRevision = revision;
    // Aggiorna la cache in memoria per evitare che la prossima readJson
    // riscriva sul DB i dati stale sovrascrivendo i pezzi appena aggiunti.
    if (storeMemCache !== null) {
      storeMemCache = {
        ...storeMemCache,
        _storeRevision: revision,
        inventory: [...payload.created, ...(storeMemCache.inventory || [])],
      };
    }
    // Scrivi anche nella tabella relazionale letta da getInventoryFromDb()
    for (const piece of payload.created) upsertInventoryItemToDb(piece).catch(() => {});
    broadcastStoreRevision(revision);
    return sendJson(
      res,
      200,
      result.rows?.[0]?.inventory || payload.created,
      sessionContext.sessionId ? { "Set-Cookie": buildSessionCookie(sessionContext.sessionId) } : {},
    );
  } catch (err) {
    console.error("[inventory/fast-add] db error, falling back to slow path:", err?.message || err);
    return false;
  }
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/healthz" && req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      service: "vertex-ops-pose-system",
      timestamp: new Date().toISOString(),
      buildTag: "coverage-planner-sql-2026-05-16-j",
      fixes: [
        "reconcileStoreData-persists-missing-piece-ids",
        "backfillInventoryIds-writes-on-change",
        "dropdown-no-auto-resuggest",
        "sqm-no-quantity-fallback",
        "iva-pavidrain-classified-non-product",
        "external-sync-bypasses-fifo-write-queue",
        "commit-response-includes-full-debug-snapshot",
        "pg-pool-idle-error-no-longer-crashes",
        "gzip-session-responses",
        "ttl-cache-all-db-queries",
        "skip-reconcile-mem-reconciled-flag",
        "session-orders-blob-sql-merge",
        "dual-write-all-endpoints",
        "audit-log-order-sales-request",
        "shopify-webhook-all-4-topics",
        "sales-request-requested-height-sql-column",
        "sales-request-height-merge-from-blob",
        "backfill-requested-height-proactive-startup",
        "coverage-planner-sql-settings-table",
      ],
    });
  }

  if (url.pathname.match(/^\/api\/public\/marketing-assets\/[^/]+$/) && req.method === "GET") {
    await ensureStore();
    const publicStore = await readJson(STORE_PATH, { marketingPublicAssets: [] });
    const assetId = decodeURIComponent(url.pathname.split("/")[4] || "");
    const asset = normalizeMarketingPublicAssets(publicStore.marketingPublicAssets)
      .find((item) => String(item.id || "") === assetId);
    if (!asset?.attachment) {
      return sendJson(res, 404, { error: "asset_not_found" });
    }
    return streamAttachmentAsset(res, asset.attachment, { cacheControl: "public, max-age=86400" });
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

  if (url.pathname === "/api/inventory/items" && req.method === "POST" && USE_POSTGRES) {
    return handleFastInventoryItemsPost(req, res);
  }

  await ensureStore();
  const store = await readJson(STORE_PATH, { users: [], jobs: [], orders: [], shopifySettings: {} });
  // Salta la riconciliazione se la cache in memoria è già stata normalizzata
  // (reconcileStoreData chiama normalizeSalesRequestRecord x 8180 record — O(N) su ogni request)
  if (!store.__memReconciled) {
    const storeChanged = reconcileStoreData(store);
    if (storeChanged) {
      await writeJson(STORE_PATH, store);
    }
    store.__memReconciled = true; // marca come già normalizzata nella cache in-memoria
  }
  const sessionContext = await getSessionContext(req, store);
  const currentUser = sessionContext.user;

  if (url.pathname === "/api/session" && req.method === "GET") {
    const sessionUserId = String(currentUser?.id || "");
    const sessionCommUnread = currentUser ? (() => {
      const comm = normalizeCommunicationsStore(store.communications || {});
      return comm.threads.reduce((sum, thread) => {
        if (!thread.participantIds.includes(sessionUserId)) return sum;
        const msgs = comm.messages.filter((m) => m.threadId === thread.id && m.authorId !== sessionUserId && !m.readBy.includes(sessionUserId));
        return sum + msgs.length;
      }, 0);
    })() : 0;
    const [sqlOrdersResult, sqlInventoryResult, sqlJobsResult, sqlSalesRequestsResult, sqlCoveragePlannerResult] = await Promise.allSettled([
      getOrdersFromDb(),
      getInventoryFromDb(),
      getJobsFromDb(),
      getSalesRequestsFromDb(),
      getCoveragePlannerFromDb(),
    ]);
    // Backfill proattivo requestedHeight: eseguito una sola volta dopo lo startup
    backfillSalesRequestHeightToDb().catch(() => {});
    // Backfill created_at: corregge date di import errate (eseguito una sola volta)
    backfillSalesRequestCreatedAtToDb().catch(() => {});
    // Per gli ordini: usa la stessa logica merge di GET /api/orders
    // (blob è fonte primaria per Shopify data; SQL override solo per operations significativi)
    const sessionOrders = (() => {
      const sqlOrders = sqlOrdersResult.status === "fulfilled" && sqlOrdersResult.value ? sqlOrdersResult.value : null;
      if (!currentUser) return [];
      if (!sqlOrders) return store.orders;
      const dbOpsMap = new Map(sqlOrders.map((o) => [o.id, o.operations]));
      const storeIds = new Set(store.orders.map((o) => o.id));
      const merged = store.orders.map((order) => {
        const dbOps = dbOpsMap.get(order.id);
        const isMeaningful = dbOps && Object.keys(dbOps).length > 3 && (dbOps.sqm > 0 || dbOps.officeStatus !== "bozza");
        // Blob vince su PG: PG fornisce i dati di base, ma le operazioni del blob
        // (aggiornate dal client) sovrascrivono quelle PG per i campi in comune.
        // Questo evita che la cache PG stantia sovrascriva modifiche appena salvate
        // (es. status "completata" → "da-pianificare" al primo reload dopo NOTIFY).
        return isMeaningful ? { ...order, operations: { ...dbOps, ...(order.operations || {}) } } : order;
      });
      const dbOnlyOrders = sqlOrders.filter((o) => !storeIds.has(o.id));
      return sortOrdersByRecency([...merged, ...dbOnlyOrders]);
    })();
    const sessionInventory  = sqlInventoryResult.status    === "fulfilled" && sqlInventoryResult.value    ? sqlInventoryResult.value    : (currentUser ? store.inventory     : []);
    const sessionJobs       = sqlJobsResult.status         === "fulfilled" && sqlJobsResult.value         ? sqlJobsResult.value         : (currentUser ? store.jobs          : []);
    const rawSalesReqs = sqlSalesRequestsResult.status === "fulfilled" && sqlSalesRequestsResult.value ? sqlSalesRequestsResult.value : null;
    const sessionSalesReqs = (() => {
      if (!rawSalesReqs) {
        return currentUser?.role === "office" ? (store.salesRequests || []) : [];
      }
      // Fix campi mancanti nei record SQL recuperandoli dal blob — O(1) via Map invece di find O(N²)
      // Gestisce: name/surname e requestedHeight (campi aggiunti alla colonna SQL in un secondo momento)
      const blobById = new Map((store.salesRequests || []).map((r) => [String(r.id), r]));
      const fixedSql = rawSalesReqs.map((req) => {
        const stored = blobById.get(String(req.id));
        if (!stored) return req;
        const needsNameFix = (!req.name && !req.surname) && (stored.name || stored.surname);
        const needsHeightFix = !req.requestedHeight && stored.requestedHeight;
        if (!needsNameFix && !needsHeightFix) return req;
        const fixed = { ...req };
        if (needsNameFix) { fixed.name = stored.name || ""; fixed.surname = stored.surname || ""; }
        if (needsHeightFix) { fixed.requestedHeight = stored.requestedHeight; }
        upsertSalesRequestToDb(fixed).catch(() => {}); // backfill colonne SQL mancanti
        return fixed;
      });
      // Safety net: aggiungi record blob-only (es. importati da Google Sheets prima del fix)
      // Usa _backfilledSalesRequestIds per non fare upsert a ogni /api/session
      const sqlIds = new Set(rawSalesReqs.map((r) => String(r.id)));
      const blobOnlyRecords = (store.salesRequests || []).filter((r) => !sqlIds.has(String(r.id)));
      const newBlobOnly = blobOnlyRecords.filter((r) => !_backfilledSalesRequestIds.has(String(r.id)));
      for (const r of newBlobOnly) {
        _backfilledSalesRequestIds.add(String(r.id));
        upsertSalesRequestToDb(r).catch(() => {}); // backfill SQL una sola volta per server uptime
      }
      return [...fixedSql, ...blobOnlyRecords];
    })();
    const sessionRole = currentUser?.role || "";
    const sessionCrewNorm = normalizeCrewName(currentUser?.crewName || "");
    const roleFilteredOrders = (() => {
      if (!currentUser) return [];
      if (sessionRole === "crew") {
        if (!sessionCrewNorm) return [];
        return sessionOrders.filter((o) => normalizeCrewName(o.operations?.installation?.crew || "") === sessionCrewNorm);
      }
      if (sessionRole === "warehouse") {
        return sessionOrders.filter((o) => (o.operations?.officeStatus || "bozza") !== "bozza");
      }
      return sessionOrders;
    })();
    const roleFilteredJobs = (() => {
      if (!currentUser) return [];
      if (sessionRole === "crew") {
        if (!sessionCrewNorm) return [];
        return sessionJobs.filter((j) => normalizeCrewName(j.crew || "") === sessionCrewNorm);
      }
      return sessionJobs;
    })();
    const roleFilteredInventory = sessionRole === "crew" ? [] : (currentUser ? sessionInventory : []);
    return sendJson(res, 200, {
      revision: getStoreRevision(store),
      user: sanitizeUser(currentUser),
      communicationsUnreadCount: sessionCommUnread,
      jobs: roleFilteredJobs,
      orders: roleFilteredOrders,
      inventory: roleFilteredInventory,
      salesRequests: [], // deprecated: usa GET /api/sales/requests per dati CRM paginati
      salesRequestsStats: sessionRole === "office" ? (() => {
        const reqs = Array.isArray(store.salesRequests) ? store.salesRequests : [];
        const now = Date.now();
        const week = 7 * 24 * 3600 * 1000;
        return {
          total: reqs.length,
          new: reqs.filter((r) => !r.status || r.status === "new" || r.status === "nuovo").length,
          unassigned: reqs.filter((r) => !r.assignment).length,
          thisWeek: reqs.filter((r) => r.createdAt && (now - new Date(r.createdAt).getTime()) < week).length,
        };
      })() : null,
      salesContents: sessionRole === "office" ? serializeSalesContentsForClient(store.salesContents) : [],
      salesRequestSource: sessionRole === "office" ? sanitizeSalesRequestSourceConfig(store.salesRequestSource) : {},
      coveragePlanner: currentUser ? normalizeCoveragePlanner(
        (sqlCoveragePlannerResult.status === "fulfilled" && sqlCoveragePlannerResult.value) || store.coveragePlanner
      ) : normalizeCoveragePlanner(),
      shopifySettings: currentUser ? serializeShopifySettings(store.shopifySettings) : {},
      users: sessionRole === "office" ? store.users.map(sanitizeUser) : [],
      communicationTargets: currentUser ? getAllowedCommunicationTargets(store, currentUser) : [],
      securityEvents: sessionRole === "office" ? store.securityEvents : [],
      securityPolicy: sessionRole === "office"
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
    if (await isLoginBlockedAsync(req, email)) {
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
      await recordFailedLoginAsync(req, email);
      pushSecurityEvent(store, "login_failed", email || "unknown", "Tentativo login fallito.", { ip: getClientIp(req) });
      await writeJson(STORE_PATH, store);
      return sendJson(res, 401, { error: "invalid_credentials" });
    }
    if (user.status === "suspended") {
      pushSecurityEvent(store, "login_blocked", user.email, "Login rifiutato: account sospeso.", { ip: getClientIp(req) });
      await writeJson(STORE_PATH, store);
      return sendJson(res, 403, { error: "account_suspended" });
    }
    await clearFailedLoginAsync(req, email);

    const sessionId = randomUUID();
    await writeSessionEntry(sessionId, {
      userId: user.id,
      version: Number(user.sessionVersion || 1),
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
    pushSecurityEvent(store, "login_success", user.email, "Login effettuato.", { ip: getClientIp(req) });
    recordUsageEvent(store, user, req, { type: "portal_login", sourceView: "login" });
    await writeJson(STORE_PATH, store);

    const loginRole = user.role || "";
    const loginCrewNorm = normalizeCrewName(user.crewName || "");
    const loginOrders = (() => {
      if (loginRole === "crew") {
        if (!loginCrewNorm) return [];
        return store.orders.filter((o) => normalizeCrewName(o.operations?.installation?.crew || "") === loginCrewNorm);
      }
      if (loginRole === "warehouse") {
        return store.orders.filter((o) => (o.operations?.officeStatus || "bozza") !== "bozza");
      }
      return store.orders;
    })();
    const loginJobs = loginRole === "crew"
      ? store.jobs.filter((j) => normalizeCrewName(j.crew || "") === loginCrewNorm)
      : store.jobs;
    const loginInventory = loginRole === "crew" ? [] : store.inventory;
    return sendJson(
      res,
      200,
      {
        revision: getStoreRevision(store),
        user: sanitizeUser(user),
        jobs: loginJobs,
        orders: loginOrders,
        inventory: loginInventory,
        salesRequests: [], // deprecated: usa GET /api/sales/requests per dati CRM paginati
        salesRequestsStats: loginRole === "office" ? (() => {
          const reqs = Array.isArray(store.salesRequests) ? store.salesRequests : [];
          const now = Date.now();
          const week = 7 * 24 * 3600 * 1000;
          return {
            total: reqs.length,
            new: reqs.filter((r) => !r.status || r.status === "new" || r.status === "nuovo").length,
            unassigned: reqs.filter((r) => !r.assignment).length,
            thisWeek: reqs.filter((r) => r.createdAt && (now - new Date(r.createdAt).getTime()) < week).length,
          };
        })() : null,
        salesContents: loginRole === "office" ? serializeSalesContentsForClient(store.salesContents) : [],
        salesRequestSource: loginRole === "office" ? sanitizeSalesRequestSourceConfig(store.salesRequestSource) : {},
        coveragePlanner: store.coveragePlanner,
        shopifySettings: serializeShopifySettings(store.shopifySettings),
        users: loginRole === "office" ? store.users.map(sanitizeUser) : [],
        communicationTargets: getAllowedCommunicationTargets(store, user),
        securityEvents: loginRole === "office" ? store.securityEvents : [],
        securityPolicy: loginRole === "office"
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
    const dbPlanner = await getCoveragePlannerFromDb();
    return sendJson(res, 200, normalizeCoveragePlanner(dbPlanner || store.coveragePlanner));
  }

  if (url.pathname === "/api/coverage-planner" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const body = await readBody(req);
    store.coveragePlanner = normalizeCoveragePlanner(body || {});
    await writeJson(STORE_PATH, store);
    saveCoveragePlannerToDb(store.coveragePlanner).catch(() => {}); // dual-write SQL
    return sendJson(res, 200, store.coveragePlanner);
  }

  if (url.pathname === "/api/usage/events" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const event = recordUsageEvent(store, currentUser, req, body || {});
    if (!event) return sendJson(res, 400, { error: "invalid_usage_event" });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/api/usage/report" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    return sendJson(res, 200, buildUsageReport(store));
  }

  if (url.pathname === "/api/marketing/publish" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const body = await readBody(req);
    const item = body?.item || body || {};
    const mode = body?.mode === "schedule" ? "schedule" : "publish";
    const prepared = await prepareMarketingItemForPublish(store, item, req);
    if (prepared.error) {
      return sendJson(res, 400, {
        ok: false,
        reason: prepared.error,
        mode,
        channel: String(item.channel || "").trim(),
      });
    }
    if (prepared.changed) {
      await writeJson(STORE_PATH, store);
    }
    const result = await publishMarketingItem(prepared.item, mode);
    const status = result.ok ? 200 : 400;
    return sendJson(res, status, {
      ...result,
      mode,
      channel: String(item.channel || "").trim(),
      publicAssetUrl: prepared.publicAssetUrl || prepared.item.publicAssetUrl || "",
      publishedAt: result.ok ? new Date().toISOString() : "",
      scheduledAt: result.scheduledAt || "",
    });
  }

  if (url.pathname === "/api/communications/threads" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    store.communications = normalizeCommunicationsStore(store.communications || {});
    const userId = String(currentUser.id || "");
    const threads = store.communications.threads
      .filter((thread) => thread.participantIds.includes(userId))
      .map((thread) => serializeCommunicationThread(store, currentUser, thread))
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    return sendJson(res, 200, {
      threads,
      targets: getAllowedCommunicationTargets(store, currentUser),
      unreadCount: threads.reduce((sum, thread) => sum + Number(thread.unreadCount || 0), 0),
    });
  }

  if (url.pathname === "/api/communications/targets" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    return sendJson(res, 200, {
      targets: getAllowedCommunicationTargets(store, currentUser),
    });
  }

  if (url.pathname === "/api/communications/threads" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const targetId = String(body?.targetUserId || "").trim();
    const users = Array.isArray(store.users) ? store.users : [];
    const targetUser = users.find((user) => String(user.id || "") === targetId) || null;
    if (!canStartPrivateCommunication(currentUser, targetUser)) {
      return sendJson(res, 403, { error: "communication_target_forbidden" });
    }
    store.communications = normalizeCommunicationsStore(store.communications || {});
    const participantIds = [String(currentUser.id || ""), targetId].sort();
    let thread = store.communications.threads.find((item) => {
      const ids = [...(item.participantIds || [])].sort();
      return ids.length === 2 && ids[0] === participantIds[0] && ids[1] === participantIds[1];
    });
    if (!thread) {
      const nowIso = new Date().toISOString();
      thread = {
        id: randomUUID(),
        type: "private",
        participantIds,
        createdAt: nowIso,
        updatedAt: nowIso,
        lastMessagePreview: "",
      };
      store.communications.threads.push(thread);
      await writeJson(STORE_PATH, store);
    }
    return sendJson(res, 200, serializeCommunicationThread(store, currentUser, thread));
  }

  const messagesMatch = url.pathname.match(/^\/api\/communications\/threads\/([^/]+)\/messages$/);
  if (messagesMatch && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const thread = getCommunicationThreadForUser(store, currentUser, messagesMatch[1]);
    if (!thread) return sendJson(res, 404, { error: "thread_not_found" });
    const users = Array.isArray(store.users) ? store.users : [];
    const participantUsers = thread.participantIds
      .map((id) => users.find((user) => String(user.id || "") === id))
      .map(sanitizeCommunicationUser)
      .filter(Boolean);
    const messages = normalizeCommunicationsStore(store.communications || {}).messages
      .filter((message) => message.threadId === thread.id)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    return sendJson(res, 200, {
      thread: serializeCommunicationThread(store, currentUser, thread),
      participants: participantUsers,
      messages,
    });
  }

  if (messagesMatch && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const thread = getCommunicationThreadForUser(store, currentUser, messagesMatch[1]);
    if (!thread) return sendJson(res, 404, { error: "thread_not_found" });
    const body = await readBody(req);
    const text = String(body?.body || "").trim();
    if (!text) return sendJson(res, 400, { error: "missing_message" });
    store.communications = normalizeCommunicationsStore(store.communications || {});
    const nowIso = new Date().toISOString();
    const message = {
      id: randomUUID(),
      threadId: thread.id,
      authorId: String(currentUser.id || ""),
      body: text.slice(0, 2000),
      createdAt: nowIso,
      readBy: [String(currentUser.id || "")],
    };
    store.communications.messages.push(message);
    store.communications.messages = store.communications.messages.slice(-5000);
    store.communications.threads = store.communications.threads.map((item) => item.id === thread.id
      ? { ...item, updatedAt: nowIso, lastMessagePreview: message.body.slice(0, 160) }
      : item);
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, message);
  }

  const readMatch = url.pathname.match(/^\/api\/communications\/threads\/([^/]+)\/read$/);
  if (readMatch && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const thread = getCommunicationThreadForUser(store, currentUser, readMatch[1]);
    if (!thread) return sendJson(res, 404, { error: "thread_not_found" });
    const userId = String(currentUser.id || "");
    store.communications = normalizeCommunicationsStore(store.communications || {});
    let changed = false;
    store.communications.messages = store.communications.messages.map((message) => {
      if (message.threadId !== thread.id || message.readBy.includes(userId)) return message;
      changed = true;
      return { ...message, readBy: [...message.readBy, userId] };
    });
    if (changed) {
      await writeJson(STORE_PATH, store);
    }
    return sendJson(res, 200, { ok: true });
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
        // For records already in the store, the portal is the authoritative status owner.
        // Preserve app-edited fields so a pending async sheet-write cannot race-overwrite them.
        const assignment = existing ? existing.assignment : (item.assignment || "");
        const status = existing?.status || item.status || "new";
        return normalizeSalesRequestRecord({
          ...item,
          requestedHeight: item.requestedHeight,
          assignment,
          status,
          note: item.note || existing?.note || "",
          whatsappTemplate: item.whatsappTemplate || existing?.whatsappTemplate || "",
          whatsappUrl: item.whatsappUrl || existing?.whatsappUrl || "",
          firstContactState: existing?.firstContactState || "",
          firstContactScheduledAt: existing?.firstContactScheduledAt || "",
          firstContactSentAt: existing?.firstContactSentAt || "",
          firstContactBy: existing ? existing.firstContactBy : assignment,
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
      // Scrivi in SQL ogni richiesta importata (dual-write mancante in questo path).
      // Outbox queue: se il sync immediato fallisce (DB lento/lock), enqueue
      // per retry persistente invece di perdere silenziosamente il salvataggio.
      for (const r of importedRequests) {
        enqueueOrRunOutboxJob(
          "upsert_sales_request",
          { request: r, userId: currentUser?.email || null },
          (payload) => upsertSalesRequestToDb(payload.request, payload.userId, { rethrow: true }),
        ).catch(() => {});
      }
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

  // Diagnostic endpoint: fotografia dello stato richieste vendita per audit/monitoring.
  // Step preparatorio alla migrazione IMAP (Architettura B). Mostra:
  // - N totali richieste in DB, distribuzione per source/status/assignment
  // - Ultima richiesta ricevuta + tempistiche
  // - Configurazione Google Sheets (presente? sincronizzabile?)
  // - Range temporale richieste (prima/ultima)
  // NB: per ora NON contatta Google Sheets per non rischiare rate limit a freddo,
  // il confronto sheets-vs-db sarà aggiunto in Fase 1 della migrazione.
  // Riconciliazione shadow → sales_requests (Fase 3 migrazione lead).
  // Processa lead shadow OK non ancora promossi, cerca match strutturale
  // (fingerprint a 6+2 campi) in sales_requests esistenti, e:
  //   - se match → linka (marca shadow.promoted_to_sales_request_id)
  //   - se no match → crea nuova sales_request con stato/assignment vuoti
  //
  // Default modalità DRY-RUN: niente modifiche al DB, solo simulazione.
  // Per eseguire davvero: ?dryRun=false
  // Batch limit: ?limit=N (default 200, max 1000)
  if (url.pathname === "/api/sales/incoming-leads/shadow/reconcile" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    try {
      const pool = await getPgPool();
      if (!pool) return sendJson(res, 503, { error: "db_unavailable" });
      const dryRun = String(url.searchParams.get("dryRun") || "true").toLowerCase() !== "false";
      const limit = Math.min(1000, Math.max(1, Number(url.searchParams.get("limit") || 200)));
      const onlyOk = String(url.searchParams.get("onlyOk") || "true").toLowerCase() !== "false";
      const result = await reconcileShadowLeads(pool, { dryRun, limit, onlyOk });
      // Fase 5 mirror Portal→Sheets: dopo il reconcile, propaghiamo gli
      // imported (orfani) su Sheets come APPEND di nuove righe. Solo se non
      // dryRun. Lo store JSONB ha gia' i nuovi record dopo reconcile reale.
      if (!dryRun && Number(result.imported) > 0) {
        try {
          const store = await readJson(STORE_PATH, {});
          const importedRecords = (Array.isArray(store.salesRequests) ? store.salesRequests : [])
            .filter((r) => String(r.source || "") === "imap")
            .slice(-Number(result.imported)); // gli ultimi N importati
          enqueueSalesRequestsGoogleSheetSync(store.salesRequestSource || {}, importedRecords);
        } catch (mirrorErr) {
          console.warn("[reconcile] mirror Sheets fallito:", mirrorErr?.message);
        }
      }
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "reconcile_failed") });
    }
  }

  // Endpoint debug per ispezionare i valori interni del worker IMAP.
  // Risolve il caso "Stato sconosciuto" mostrato nel diagnostic frontend:
  // dump diretto di cfg, workerState e valori calcolati dalla health logic.
  if (url.pathname === "/api/sales/imap-debug" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const status = getImapWorkerStatus();
    // Versione del modulo per confermare quale codice e' in esecuzione
    const moduleMarker = "v6-1880991-health-debug";
    return sendJson(res, 200, {
      moduleMarker,
      generatedAt: new Date().toISOString(),
      now: Date.now(),
      // Direttamente dal process.env (mostriamo solo presenza/valore, no password)
      env: {
        IMAP_SHADOW_ENABLED: String(process.env.IMAP_SHADOW_ENABLED || "(unset)"),
        IMAP_AUTO_PROMOTE: String(process.env.IMAP_AUTO_PROMOTE || "(unset)"),
        IMAP_HOST: String(process.env.IMAP_HOST || "(unset)"),
        IMAP_USER: String(process.env.IMAP_USER || "(unset)").substring(0, 25),
        IMAP_PORT: String(process.env.IMAP_PORT || "(unset)"),
        IMAP_PASSWORD_PRESENT: Boolean(process.env.IMAP_PASSWORD),
      },
      // Tutto quello che getImapWorkerStatus restituisce
      status,
      // Verifica esplicita: cosa pensa il codice di autoPromote/enabled
      computed: {
        autoPromote_via_string: String(process.env.IMAP_AUTO_PROMOTE || "false").trim().toLowerCase() === "true",
        enabled_via_string: String(process.env.IMAP_SHADOW_ENABLED || "false").trim().toLowerCase() === "true",
      },
    });
  }

  // Endpoint debug per visualizzare gli ultimi lead shadow letti da IMAP.
  // Solo office, read-only. Per audit della Fase 2 (validazione confronto
  // IMAP vs Sheets).
  if (url.pathname === "/api/sales/incoming-leads/shadow" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    try {
      const pool = await getPgPool();
      if (!pool) return sendJson(res, 200, { items: [], total: 0, worker: getImapWorkerStatus() });
      const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
      const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));
      const items = await pool.query(
        `SELECT id, imap_message_id, imap_uid, imap_mailbox, from_email, from_name,
                subject, received_at, parsed_payload, parser_version, parse_status,
                parse_errors, promoted_to_sales_request_id, promoted_at, created_at
         FROM incoming_leads_shadow
         ORDER BY received_at DESC NULLS LAST, created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const totalRow = await pool.query("SELECT COUNT(*)::int AS total FROM incoming_leads_shadow");
      return sendJson(res, 200, {
        items: items.rows || [],
        total: Number(totalRow.rows?.[0]?.total || 0),
        worker: getImapWorkerStatus(),
      });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "shadow_query_failed") });
    }
  }

  // Diagnostic endpoint per la persistent outbox (Step 3).
  // Espone counts pending/processing/done/dead + età del job più vecchio in coda
  // e gli ultimi 20 dead per debug. Pensato per banner UI futuro.
  if (url.pathname === "/api/diagnostic/outbox" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    try {
      const stats = await getOutboxStats();
      let recentDead = [];
      if (USE_POSTGRES) {
        try {
          const pool = await getPgPool();
          const dead = await pool.query(
            `SELECT id, job_type, attempts, last_error, created_at, done_at
               FROM outbox WHERE status = 'dead'
              ORDER BY done_at DESC NULLS LAST LIMIT 20`,
          );
          recentDead = dead.rows.map((r) => ({
            id: String(r.id),
            jobType: r.job_type,
            attempts: r.attempts,
            lastError: r.last_error,
            createdAt: r.created_at,
            doneAt: r.done_at,
          }));
        } catch {}
      }
      return sendJson(res, 200, {
        ok: true,
        stats: stats || { pending: 0, processing: 0, done: 0, dead: 0, oldestPendingAge: null },
        recentDead,
        registeredHandlers: Object.keys(OUTBOX_HANDLERS),
      });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "outbox_diagnostic_failed") });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sistemazioni (service_repairs) — CRUD + garanzia auto
  // Permessi: office tutto, crew filtered su assigned_crew, altri 403
  // ─────────────────────────────────────────────────────────────────────────

  // GET /api/repairs/warranty-check?orderId=X → calcola garanzia per un ordine
  if (url.pathname === "/api/repairs/warranty-check" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const orderId = url.searchParams.get("orderId") || "";
    if (!orderId) return sendJson(res, 400, { error: "missing_orderId" });
    try {
      const result = await computeWarrantyForOrder(orderId);
      return sendJson(res, 200, { ok: true, ...result, warrantyDays: REPAIR_WARRANTY_DAYS });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "warranty_check_failed") });
    }
  }

  // POST /api/repairs → crea sistemazione
  if (url.pathname === "/api/repairs" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    try {
      const body = await readBody(req);
      if (!String(body.parentOrderId || "").trim()) return sendJson(res, 400, { error: "missing_parentOrderId" });
      if (!String(body.customerName || "").trim()) return sendJson(res, 400, { error: "missing_customerName" });
      if (!String(body.description || "").trim()) return sendJson(res, 400, { error: "missing_description" });
      if (body.category && !REPAIR_CATEGORIES.has(body.category)) return sendJson(res, 400, { error: "invalid_category" });
      const created = await createServiceRepairInDb({
        ...body,
        reportedBy: currentUser.email || currentUser.id || null,
      }, { rethrow: true });
      if (!created) return sendJson(res, 500, { error: "create_failed" });
      writeAuditLog("service_repair", created.id, "create", {
        parentOrderId: created.parentOrderId,
        category: created.category,
        withinWarranty: created.withinWarranty,
      }, currentUser.email || null).catch(() => {});
      return sendJson(res, 201, created);
    } catch (err) {
      console.error("[repairs] create failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "create_failed") });
    }
  }

  // GET /api/repairs → lista (con filtri + scope crew)
  if (url.pathname === "/api/repairs" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    try {
      const status = url.searchParams.get("status") || null;
      const category = url.searchParams.get("category") || null;
      const parentOrderId = url.searchParams.get("orderId") || null;
      // Crew vede solo le proprie squadre (scope server-side)
      const assignedCrew = currentUser.role === "crew"
        ? (currentUser.crewName || currentUser.name || "")
        : (url.searchParams.get("crew") || null);
      const repairs = await listServiceRepairsFromDb({ status, category, parentOrderId, assignedCrew });
      return sendJson(res, 200, { repairs, warrantyDays: REPAIR_WARRANTY_DAYS });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "list_failed") });
    }
  }

  // GET /api/repairs/:id → dettaglio
  if (url.pathname.startsWith("/api/repairs/") && req.method === "GET" && !url.pathname.endsWith("/pdf")) {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const id = decodeURIComponent(url.pathname.slice("/api/repairs/".length));
    if (!id || id.includes("/")) return sendJson(res, 400, { error: "missing_id" });
    try {
      const repair = await getServiceRepairFromDb(id);
      if (!repair) return sendJson(res, 404, { error: "not_found" });
      if (currentUser.role === "crew") {
        const crewName = (currentUser.crewName || currentUser.name || "").trim();
        if (repair.assignedCrew && repair.assignedCrew !== crewName) {
          return sendJson(res, 403, { error: "forbidden" });
        }
      }
      return sendJson(res, 200, repair);
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "get_failed") });
    }
  }

  // PATCH /api/repairs/:id → aggiorna
  if (url.pathname.startsWith("/api/repairs/") && req.method === "PATCH") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const id = decodeURIComponent(url.pathname.slice("/api/repairs/".length));
    if (!id || id.includes("/")) return sendJson(res, 400, { error: "missing_id" });
    try {
      const existing = await getServiceRepairFromDb(id);
      if (!existing) return sendJson(res, 404, { error: "not_found" });
      if (currentUser.role === "crew") {
        const crewName = (currentUser.crewName || currentUser.name || "").trim();
        if (existing.assignedCrew && existing.assignedCrew !== crewName) {
          return sendJson(res, 403, { error: "forbidden" });
        }
      }
      const body = await readBody(req);
      const updated = await updateServiceRepairInDb(id, body, { rethrow: true });
      writeAuditLog("service_repair", id, "update", { fields: Object.keys(body || {}) }, currentUser.email || null).catch(() => {});
      return sendJson(res, 200, updated);
    } catch (err) {
      console.error("[repairs] patch failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "patch_failed") });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Job Events — eventi cantiere (departure/arrival/work_start/work_end/return/issue/note)
  // crew: registra eventi per il proprio job, vede solo i propri
  // office: tutto
  // ─────────────────────────────────────────────────────────────────────────

  // POST /api/jobs/:orderId/events → registra evento
  if (url.pathname.match(/^\/api\/jobs\/[^/]+\/events$/) && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    if (!orderId) return sendJson(res, 400, { error: "missing_orderId" });
    try {
      const body = await readBody(req);
      if (!JOB_EVENT_TYPES.has(body.eventType)) return sendJson(res, 400, { error: "invalid_eventType" });
      const event = await insertJobEvent(orderId, body.eventType, {
        installationId: body.installationId,
        userId: currentUser.id,
        userName: currentUser.name || currentUser.email || "",
        crewName: currentUser.crewName || body.crewName || "",
        lat: body.lat,
        lng: body.lng,
        gpsAccuracyM: body.gpsAccuracyM,
        photos: body.photos,
        notes: body.notes,
        source: body.source || "manual",
        ipAddress: extractClientIp(req),
        userAgent: req.headers["user-agent"] || "",
        deviceId: body.deviceId,
      });
      writeAuditLog("job_event", String(event.id), "create", {
        orderId, eventType: event.eventType, hasGps: event.lat != null,
      }, currentUser.email || null).catch(() => {});
      return sendJson(res, 201, event);
    } catch (err) {
      console.error("[job-events] create failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "create_failed") });
    }
  }

  // GET /api/jobs/:orderId/events → timeline ordine
  if (url.pathname.match(/^\/api\/jobs\/[^/]+\/events$/) && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew", "warehouse"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    try {
      const events = await listJobEventsForOrder(orderId);
      return sendJson(res, 200, { events });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "list_failed") });
    }
  }

  // GET /api/jobs/live → eventi delle ultime 18h, raggruppati per ordine.
  // Office vede tutti, crew vede solo i propri.
  if (url.pathname === "/api/jobs/live" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    try {
      const crewName = currentUser.role === "crew"
        ? (currentUser.crewName || currentUser.name || "")
        : (url.searchParams.get("crew") || null);
      const events = await listLiveJobEventsToday({ crewName });
      console.log(`[cantieri-live] user=${currentUser.email || currentUser.id} role=${currentUser.role} crewFilter=${crewName || "(none)"} events=${events.length}`);
      // Raggruppa per orderId, mantieni l'ordine cronologico
      const byOrder = new Map();
      for (const ev of events) {
        if (!byOrder.has(ev.orderId)) byOrder.set(ev.orderId, []);
        byOrder.get(ev.orderId).push(ev);
      }
      const groups = Array.from(byOrder.entries()).map(([orderId, evs]) => ({
        orderId,
        crewName: evs[0]?.crewName || "",
        events: evs,
        firstAt: evs[0]?.occurredAt,
        lastAt: evs[evs.length - 1]?.occurredAt,
        lastEventType: evs[evs.length - 1]?.eventType,
      }));
      // Ordina: cantieri aperti (no return) prima, poi per lastAt desc
      groups.sort((a, b) => {
        const aOpen = a.lastEventType !== "return" ? 0 : 1;
        const bOpen = b.lastEventType !== "return" ? 0 : 1;
        if (aOpen !== bOpen) return aOpen - bOpen;
        return String(b.lastAt).localeCompare(String(a.lastAt));
      });
      return sendJson(res, 200, { groups, count: groups.length });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "live_failed") });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Tracking pubblico cliente (URL con token)
  // Office genera/revoca token, cliente apre /track/:token (no auth).
  // Solo ordini con flow installazione (fornitura+posa).
  // ─────────────────────────────────────────────────────────────────────────

  // POST /api/orders/:id/tracking-token → genera o ritorna esistente
  if (url.pathname.match(/^\/api\/orders\/[^/]+\/tracking-token$/) && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    try {
      const store = await readJson(STORE_PATH, {});
      const orders = Array.isArray(store.orders) ? store.orders : [];
      const order = orders.find((o) => o.id === orderId);
      if (!order) return sendJson(res, 404, { error: "order_not_found" });
      if (!orderHasInstallation(order)) {
        return sendJson(res, 400, { error: "no_installation", message: "Il tracking pubblico è disponibile solo per ordini con fornitura+posa." });
      }
      let token = order.operations?.trackingToken;
      let createdAt = order.operations?.trackingTokenCreatedAt;
      if (!token) {
        token = generateTrackingToken();
        createdAt = new Date().toISOString();
        order.operations = order.operations || {};
        order.operations.trackingToken = token;
        order.operations.trackingTokenCreatedAt = createdAt;
        await writeJson(STORE_PATH, store);
        // Sync DB (best-effort)
        if (USE_POSTGRES) {
          try {
            const pool = await getPgPool();
            await pool.query(
              "UPDATE orders SET tracking_token = $1, tracking_token_created_at = $2 WHERE id = $3",
              [token, createdAt, String(orderId)],
            );
          } catch (err) { console.warn("[tracking] db sync failed:", err?.message); }
        }
        writeAuditLog("order", orderId, "tracking_token_created", { token: token.slice(0, 8) + "..." }, currentUser.email || null).catch(() => {});
      }
      const baseUrl = (process.env.PUBLIC_BASE_URL || getRequestBaseUrl(req)).replace(/\/+$/, "");
      const publicUrl = `${baseUrl}/track/${token}`;
      return sendJson(res, 200, { token, createdAt, publicUrl });
    } catch (err) {
      console.error("[tracking] create failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "create_failed") });
    }
  }

  // DELETE /api/orders/:id/tracking-token → revoca
  if (url.pathname.match(/^\/api\/orders\/[^/]+\/tracking-token$/) && req.method === "DELETE") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    try {
      const store = await readJson(STORE_PATH, {});
      const order = (store.orders || []).find((o) => o.id === orderId);
      if (!order) return sendJson(res, 404, { error: "order_not_found" });
      if (order.operations?.trackingToken) {
        delete order.operations.trackingToken;
        delete order.operations.trackingTokenCreatedAt;
        await writeJson(STORE_PATH, store);
        if (USE_POSTGRES) {
          try {
            const pool = await getPgPool();
            await pool.query("UPDATE orders SET tracking_token = NULL, tracking_token_created_at = NULL WHERE id = $1", [String(orderId)]);
          } catch {}
        }
        writeAuditLog("order", orderId, "tracking_token_revoked", {}, currentUser.email || null).catch(() => {});
      }
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "revoke_failed") });
    }
  }

  // GET /api/public/track/:token → dati pubblici filtrati (no auth)
  if (url.pathname.startsWith("/api/public/track/") && req.method === "GET") {
    const token = decodeURIComponent(url.pathname.slice("/api/public/track/".length));
    try {
      const order = await findOrderByTrackingToken(token);
      if (!order) return sendJson(res, 404, { error: "not_found" });
      // Carica eventi del cantiere + verbali firmati
      const events = await listJobEventsForOrder(order.id);
      const reports = await listWorkReportsFromDb({ orderId: order.id, status: "archived" });
      const inst = order.operations?.installation || {};
      const customerName = (`${order.firstName || ""} ${order.lastName || ""}`).trim() || "Cliente";
      const productName = order.operations?.product || "Prato sintetico";
      const sqm = order.operations?.sqm || 0;
      const siteAddress = [order.address, order.city].filter(Boolean).join(", ");
      // Stage corrente: derivato dal latest event o stato job
      const lastEvent = events.length ? events[events.length - 1] : null;
      const stage = lastEvent?.eventType === "return" ? "completed"
        : lastEvent?.eventType === "work_start" || lastEvent?.eventType === "work_end" ? "in_progress"
        : lastEvent?.eventType === "arrival" ? "on_site"
        : lastEvent?.eventType === "departure" ? "in_transit"
        : inst.installDate ? "scheduled"
        : "preparing";
      // Garanzia: 365gg dall'ultimo event "return" o data installazione
      let warrantyUntil = null;
      const installCompletedAt = lastEvent?.eventType === "return" ? lastEvent.occurredAt : (inst.completedAt || null);
      if (installCompletedAt) {
        const d = new Date(installCompletedAt);
        d.setDate(d.getDate() + 365);
        warrantyUntil = d.toISOString();
      }
      // Filtra eventi: niente IP, niente userName privato. Solo orario, tipo, foto.
      const publicEvents = events.map((ev) => ({
        eventType: ev.eventType,
        occurredAt: ev.occurredAt,
        crewName: ev.crewName || "",
        hasGps: ev.lat != null,
        photosCount: Array.isArray(ev.photos) ? ev.photos.length : 0,
      }));
      const publicReports = reports.map((r) => ({
        id: r.id,
        signedAt: r.signedAt,
        executedSqm: r.executedSqm,
        pdfUrl: r.documentPdfR2Key ? `/api/public/track/${encodeURIComponent(token)}/verbale/${encodeURIComponent(r.id)}.pdf` : null,
      }));
      return sendJson(res, 200, {
        ok: true,
        orderId: order.id,
        orderNumber: String(order.orderNumber || order.id || ""),
        customerName,
        productName,
        sqm,
        siteAddress,
        installation: {
          installDate: inst.installDate || null,
          installTime: inst.installTime || null,
          crew: inst.crew || null,
        },
        stage,
        events: publicEvents,
        reports: publicReports,
        warrantyUntil,
        contactWhatsapp: process.env.PSI_OFFICE_WHATSAPP || "",
        contactPhone: process.env.PSI_OFFICE_PHONE || "",
      });
    } catch (err) {
      console.error("[tracking] public fetch failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "public_failed") });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Verbali fine cantiere (work_completion_reports) — MVP
  // crew: vede/crea/modifica i propri (crew_user_id = self.id)
  // office: tutto
  // warehouse: lettura (per allegati ordine)
  // ─────────────────────────────────────────────────────────────────────────

  // POST /api/work-reports → crea bozza
  if (url.pathname === "/api/work-reports" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    try {
      const body = await readBody(req);
      const crewName = String(body.crewName || currentUser.crewName || currentUser.name || "").trim();
      if (!crewName) return sendJson(res, 400, { error: "missing_crew_name" });
      if (!String(body.customerName || "").trim()) return sendJson(res, 400, { error: "missing_customer_name" });
      const created = await createWorkReportInDb({
        orderId: body.orderId,
        installationId: body.installationId,
        crewUserId: currentUser.id,
        crewName,
        operators: body.operators,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        siteAddress: body.siteAddress,
        executedSqm: body.executedSqm,
        productModel: body.productModel,
        workHoursStart: body.workHoursStart,
        workHoursEnd: body.workHoursEnd,
        notes: body.notes,
        extras: body.extras,
        photos: body.photos,
        liabilityText: body.liabilityText,
      }, { rethrow: true });
      if (!created) return sendJson(res, 500, { error: "create_failed" });
      writeAuditLog("work_report", created.id, "create", { orderId: created.orderId, crewName: created.crewName }, currentUser.email || null).catch(() => {});
      return sendJson(res, 201, created);
    } catch (err) {
      console.error("[work-reports] create failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "create_failed") });
    }
  }

  // GET /api/work-reports?orderId=X&status=Y → lista
  if (url.pathname === "/api/work-reports" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "warehouse", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    try {
      const orderId = url.searchParams.get("orderId") || null;
      const status = url.searchParams.get("status") || null;
      // Crew vede solo i propri verbali (scope server-side, niente UI-only filtering).
      const crewUserId = currentUser.role === "crew" ? currentUser.id : null;
      const reports = await listWorkReportsFromDb({ orderId, status, crewUserId });
      return sendJson(res, 200, { reports });
    } catch (err) {
      console.error("[work-reports] list failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "list_failed") });
    }
  }

  // GET /api/work-reports/:id → dettaglio
  if (url.pathname.startsWith("/api/work-reports/") && req.method === "GET" && !url.pathname.endsWith("/pdf") && !url.pathname.endsWith("/photos") && !url.pathname.endsWith("/sign")) {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "warehouse", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const id = decodeURIComponent(url.pathname.slice("/api/work-reports/".length));
    if (!id) return sendJson(res, 400, { error: "missing_id" });
    try {
      const report = await getWorkReportFromDb(id);
      if (!report) return sendJson(res, 404, { error: "not_found" });
      if (currentUser.role === "crew" && report.crewUserId !== currentUser.id) {
        return sendJson(res, 403, { error: "forbidden" });
      }
      return sendJson(res, 200, report);
    } catch (err) {
      console.error("[work-reports] get failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "get_failed") });
    }
  }

  // PATCH /api/work-reports/:id → aggiorna campi (whitelist server-side)
  if (url.pathname.startsWith("/api/work-reports/") && req.method === "PATCH") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const id = decodeURIComponent(url.pathname.slice("/api/work-reports/".length));
    if (!id) return sendJson(res, 400, { error: "missing_id" });
    try {
      const existing = await getWorkReportFromDb(id);
      if (!existing) return sendJson(res, 404, { error: "not_found" });
      if (currentUser.role === "crew" && existing.crewUserId !== currentUser.id) {
        return sendJson(res, 403, { error: "forbidden" });
      }
      if (existing.status !== "draft") {
        return sendJson(res, 409, { error: "not_draft", message: "Solo i verbali in bozza possono essere modificati." });
      }
      const body = await readBody(req);
      const updated = await updateWorkReportInDb(id, body, { rethrow: true });
      writeAuditLog("work_report", id, "update", { fields: Object.keys(body || {}) }, currentUser.email || null).catch(() => {});
      return sendJson(res, 200, updated);
    } catch (err) {
      console.error("[work-reports] patch failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "patch_failed") });
    }
  }

  // POST /api/work-reports/:id/photos → append foto (R2)
  // Body: { photos: [{ name, type, dataUrl }, ...] }
  // Compressione lato client (vedi UI #8). Il server limita comunque a MAX_JSON_BODY_BYTES.
  if (url.pathname.match(/^\/api\/work-reports\/[^/]+\/photos$/) && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const id = decodeURIComponent(url.pathname.split("/")[3]);
    try {
      const existing = await getWorkReportFromDb(id);
      if (!existing) return sendJson(res, 404, { error: "not_found" });
      if (currentUser.role === "crew" && existing.crewUserId !== currentUser.id) {
        return sendJson(res, 403, { error: "forbidden" });
      }
      if (existing.status !== "draft") {
        return sendJson(res, 409, { error: "not_draft", message: "Foto modificabili solo in bozza." });
      }
      const body = await readBody(req);
      const incoming = Array.isArray(body.photos) ? body.photos : [];
      if (!incoming.length) return sendJson(res, 400, { error: "no_photos" });
      const MAX_PHOTOS = 10;
      const currentCount = Array.isArray(existing.photos) ? existing.photos.length : 0;
      if (currentCount + incoming.length > MAX_PHOTOS) {
        return sendJson(res, 400, { error: "too_many_photos", limit: MAX_PHOTOS });
      }
      const saved = [];
      for (const photo of incoming) {
        if (!photo?.dataUrl) continue;
        const attachment = await storeAttachmentAsset(id, {
          id: photo.id || randomUUID(),
          name: photo.name || `foto-${Date.now()}.jpg`,
          type: photo.type || "image/jpeg",
          dataUrl: photo.dataUrl,
          size: photo.size,
        }, "work-reports");
        saved.push({
          id: attachment.id,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
          storage: attachment.storage,
          objectKey: attachment.objectKey || "",
          takenAt: photo.takenAt || new Date().toISOString(),
        });
      }
      const nextPhotos = [...(existing.photos || []), ...saved];
      const updated = await updateWorkReportInDb(id, { photos: nextPhotos }, { rethrow: true });
      writeAuditLog("work_report", id, "photos_added", { count: saved.length }, currentUser.email || null).catch(() => {});
      return sendJson(res, 200, updated);
    } catch (err) {
      console.error("[work-reports] photos upload failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "upload_failed") });
    }
  }

  // GET /api/work-reports/:id/photos/:photoId/file → stream foto da R2
  if (url.pathname.match(/^\/api\/work-reports\/[^/]+\/photos\/[^/]+\/file$/) && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "warehouse", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const parts = url.pathname.split("/");
    const id = decodeURIComponent(parts[3]);
    const photoId = decodeURIComponent(parts[5]);
    try {
      const report = await getWorkReportFromDb(id);
      if (!report) return sendJson(res, 404, { error: "not_found" });
      if (currentUser.role === "crew" && report.crewUserId !== currentUser.id) {
        return sendJson(res, 403, { error: "forbidden" });
      }
      const photo = (report.photos || []).find((p) => String(p.id || "") === photoId);
      if (!photo) return sendJson(res, 404, { error: "photo_not_found" });
      return streamAttachmentAsset(res, photo);
    } catch (err) {
      console.error("[work-reports] photo file failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "stream_failed") });
    }
  }

  // GET /api/work-reports/:id/pdf → scarica il PDF archiviato (stream da R2)
  if (url.pathname.match(/^\/api\/work-reports\/[^/]+\/pdf$/) && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "warehouse", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const id = decodeURIComponent(url.pathname.split("/")[3]);
    try {
      const report = await getWorkReportFromDb(id);
      if (!report) return sendJson(res, 404, { error: "not_found" });
      if (currentUser.role === "crew" && report.crewUserId !== currentUser.id) {
        return sendJson(res, 403, { error: "forbidden" });
      }
      if (report.status !== "archived" || !report.documentPdfR2Key) {
        return sendJson(res, 409, {
          error: "pdf_not_ready",
          status: report.status,
          message: report.status === "draft" ? "Verbale ancora in bozza." : "PDF in generazione, riprova tra qualche secondo.",
        });
      }
      return streamAttachmentAsset(res, {
        objectKey: report.documentPdfR2Key,
        type: "application/pdf",
        name: `verbale-${id}.pdf`,
        storage: "r2",
      });
    } catch (err) {
      console.error("[work-reports] pdf download failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "download_failed") });
    }
  }

  // POST /api/work-reports/:id/sign → firma cliente + posatore, chiude bozza
  // Body: { customerSignatureDataUrl, crewSignatureDataUrl }  (PNG base64 data URLs)
  // Effetti: salva firme su R2, segna status='signed' + signed_at=NOW(),
  // enqueue outbox job 'generate_work_report_pdf' per generazione async.
  if (url.pathname.match(/^\/api\/work-reports\/[^/]+\/sign$/) && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const id = decodeURIComponent(url.pathname.split("/")[3]);
    try {
      const existing = await getWorkReportFromDb(id);
      if (!existing) return sendJson(res, 404, { error: "not_found" });
      if (currentUser.role === "crew" && existing.crewUserId !== currentUser.id) {
        return sendJson(res, 403, { error: "forbidden" });
      }
      if (existing.status !== "draft") {
        return sendJson(res, 409, { error: "not_draft", message: "Verbale già firmato o archiviato." });
      }
      const body = await readBody(req);
      const customerSig = String(body.customerSignatureDataUrl || "").trim();
      const crewSig = String(body.crewSignatureDataUrl || "").trim();
      if (!customerSig || !customerSig.startsWith("data:image/")) {
        return sendJson(res, 400, { error: "missing_customer_signature" });
      }
      if (!crewSig || !crewSig.startsWith("data:image/")) {
        return sendJson(res, 400, { error: "missing_crew_signature" });
      }
      // Salva entrambe le firme su R2 come attachment dedicati.
      const customerAtt = await storeAttachmentAsset(id, {
        id: `${id}-customer-signature`,
        name: "customer-signature.png",
        type: "image/png",
        dataUrl: customerSig,
      }, "work-reports");
      const crewAtt = await storeAttachmentAsset(id, {
        id: `${id}-crew-signature`,
        name: "crew-signature.png",
        type: "image/png",
        dataUrl: crewSig,
      }, "work-reports");
      const signed = await signWorkReportInDb(id, {
        customerSignatureR2Key: customerAtt.objectKey || "",
        crewSignatureR2Key: crewAtt.objectKey || "",
      }, { rethrow: true });
      if (!signed) return sendJson(res, 500, { error: "sign_failed" });
      writeAuditLog("work_report", id, "sign", { customer: !!customerAtt.objectKey, crew: !!crewAtt.objectKey }, currentUser.email || null).catch(() => {});
      // Enqueue PDF generation in background. Handler registrato in Step 5.
      // Se non c'è ancora handler, finirà in dead → visibile da /api/diagnostic/outbox.
      await enqueueOutboxJob("generate_work_report_pdf", { workReportId: id });
      return sendJson(res, 200, signed);
    } catch (err) {
      console.error("[work-reports] sign failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "sign_failed") });
    }
  }

  // DELETE /api/work-reports/:id/photos/:photoId → rimuove foto da R2 + JSONB
  if (url.pathname.match(/^\/api\/work-reports\/[^/]+\/photos\/[^/]+$/) && req.method === "DELETE") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!["office", "crew"].includes(currentUser.role)) return sendJson(res, 403, { error: "forbidden" });
    const parts = url.pathname.split("/");
    const id = decodeURIComponent(parts[3]);
    const photoId = decodeURIComponent(parts[5]);
    try {
      const existing = await getWorkReportFromDb(id);
      if (!existing) return sendJson(res, 404, { error: "not_found" });
      if (currentUser.role === "crew" && existing.crewUserId !== currentUser.id) {
        return sendJson(res, 403, { error: "forbidden" });
      }
      if (existing.status !== "draft") {
        return sendJson(res, 409, { error: "not_draft", message: "Foto rimuovibili solo in bozza." });
      }
      const photos = Array.isArray(existing.photos) ? existing.photos : [];
      const idx = photos.findIndex((p) => String(p.id || "") === photoId);
      if (idx < 0) return sendJson(res, 404, { error: "photo_not_found" });
      const [removed] = photos.splice(idx, 1);
      await removeAttachmentAsset(removed).catch((err) => {
        console.warn("[work-reports] R2 delete failed (non-fatal):", err?.message || err);
      });
      const updated = await updateWorkReportInDb(id, { photos }, { rethrow: true });
      writeAuditLog("work_report", id, "photo_removed", { photoId }, currentUser.email || null).catch(() => {});
      return sendJson(res, 200, updated);
    } catch (err) {
      console.error("[work-reports] photo delete failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "delete_failed") });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sistema Presenze (timesheet) — endpoint REST
  // Ruoli: warehouse, seller, office (dipendenti). Crew esclusi.
  // ─────────────────────────────────────────────────────────────────────────

  // POST /api/timesheet/clock-in
  // Body: { deviceId, notes }   (deviceId è UUID generato lato client una sola volta)
  if (url.pathname === "/api/timesheet/clock-in" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!userIsEmployee(currentUser)) return sendJson(res, 403, { error: "forbidden_role" });
    try {
      const body = await readBody(req);
      const result = await insertTimeEntry(currentUser.id, "clock_in", {
        source: "manual",
        ipAddress: extractClientIp(req),
        userAgent: String(req.headers["user-agent"] || ""),
        deviceId: String(body.deviceId || ""),
        notes: body.notes,
        lat: body.lat,
        lng: body.lng,
        gpsAccuracyM: body.gpsAccuracyM,
      });
      writeAuditLog("timesheet", String(currentUser.id), "clock_in", {
        networkTag: result?.entry?.networkTag || null,
        geoTag: result?.entry?.geoTag || null,
        source: "manual",
      }, currentUser.email || null).catch(() => {});
      return sendJson(res, 200, result);
    } catch (err) {
      console.error("[timesheet] clock-in failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "clock_in_failed") });
    }
  }

  // POST /api/timesheet/clock-out
  if (url.pathname === "/api/timesheet/clock-out" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!userIsEmployee(currentUser)) return sendJson(res, 403, { error: "forbidden_role" });
    try {
      const body = await readBody(req);
      const result = await insertTimeEntry(currentUser.id, "clock_out", {
        source: "manual",
        ipAddress: extractClientIp(req),
        userAgent: String(req.headers["user-agent"] || ""),
        deviceId: String(body.deviceId || ""),
        notes: body.notes,
        lat: body.lat,
        lng: body.lng,
        gpsAccuracyM: body.gpsAccuracyM,
      });
      writeAuditLog("timesheet", String(currentUser.id), "clock_out", {
        networkTag: result?.entry?.networkTag || null,
        geoTag: result?.entry?.geoTag || null,
        workedMinutes: result?.shift?.workedMinutes || null,
      }, currentUser.email || null).catch(() => {});
      return sendJson(res, 200, result);
    } catch (err) {
      console.error("[timesheet] clock-out failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "clock_out_failed") });
    }
  }

  // GET /api/timesheet/current → turno di oggi del dipendente loggato
  if (url.pathname === "/api/timesheet/current" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!userIsEmployee(currentUser)) return sendJson(res, 403, { error: "forbidden_role" });
    try {
      const shift = await getCurrentShiftForUser(currentUser.id);
      return sendJson(res, 200, {
        shift,
        networkConfigured: _companyCidrs.length > 0,
        geofenceConfigured: COMPANY_OFFICE_LAT != null && COMPANY_OFFICE_LNG != null,
      });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "current_failed") });
    }
  }

  // GET /api/timesheet/me?from=YYYY-MM-DD&to=YYYY-MM-DD → storico proprio
  if (url.pathname === "/api/timesheet/me" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!userIsEmployee(currentUser)) return sendJson(res, 403, { error: "forbidden_role" });
    try {
      const from = url.searchParams.get("from") || null;
      const to = url.searchParams.get("to") || null;
      const shifts = await listShiftsForUser(currentUser.id, { from, to });
      return sendJson(res, 200, { shifts });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "me_failed") });
    }
  }

  // GET /api/timesheet/me/stats?year=2026&month=5 → KPI mese (ore, giorni, streak)
  if (url.pathname === "/api/timesheet/me/stats" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!userIsEmployee(currentUser)) return sendJson(res, 403, { error: "forbidden_role" });
    try {
      const now = new Date();
      const year = parseInt(url.searchParams.get("year") || String(now.getFullYear()), 10);
      const month = parseInt(url.searchParams.get("month") || String(now.getMonth() + 1), 10);
      const [stats, streak] = await Promise.all([
        getMonthlyStatsForUser(currentUser.id, year, month),
        getCurrentStreakForUser(currentUser.id),
      ]);
      // Mese scorso per delta
      let prevMonth = month - 1, prevYear = year;
      if (prevMonth < 1) { prevMonth = 12; prevYear--; }
      const prevStats = await getMonthlyStatsForUser(currentUser.id, prevYear, prevMonth);
      return sendJson(res, 200, {
        current: stats,
        previous: prevStats,
        streak,
        deltaMinutes: stats && prevStats ? (stats.totalMinutes - prevStats.totalMinutes) : null,
      });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "stats_failed") });
    }
  }

  // GET /api/timesheet?from=X&to=Y&userId=Z → office, lista turni di tutti
  if (url.pathname === "/api/timesheet" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    try {
      const from = url.searchParams.get("from") || null;
      const to = url.searchParams.get("to") || null;
      const userId = url.searchParams.get("userId") || null;
      const shifts = await listShiftsAll({ from, to, userId });
      return sendJson(res, 200, { shifts });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "list_failed") });
    }
  }

  // GET /api/timesheet/export?from=X&to=Y → CSV office
  if (url.pathname === "/api/timesheet/export" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    try {
      const from = url.searchParams.get("from") || null;
      const to = url.searchParams.get("to") || null;
      const shifts = await listShiftsAll({ from, to });
      // Mappa user_id → nome per output friendly
      const users = Array.isArray(store.users) ? store.users : [];
      const userMap = new Map(users.map((u) => [u.id, u]));
      const lines = ["Data,Dipendente,Email,Ruolo,Entrata,Uscita,Ore lavorate,Rete entrata,Anomalie,Note"];
      for (const s of shifts) {
        const user = userMap.get(s.userId) || {};
        const fmtTime = (iso) => iso ? new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" }) : "";
        const hh = Math.floor((s.workedMinutes || 0) / 60);
        const mm = (s.workedMinutes || 0) % 60;
        const hoursStr = s.workedMinutes != null ? `${hh}:${String(mm).padStart(2, "0")}` : "";
        const networkStr = (s.anomalyFlags || []).includes("off_network_in") ? "off-network"
                        : (s.anomalyFlags || []).includes("off_network_out") ? "mixed"
                        : "in_office";
        const anomalies = (s.anomalyFlags || []).join("|");
        const csvEscape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        lines.push([
          s.shiftDate,
          csvEscape(user.name || user.crewName || s.userId),
          csvEscape(user.email || ""),
          csvEscape(user.role || ""),
          fmtTime(s.clockInAt),
          fmtTime(s.clockOutAt),
          hoursStr,
          networkStr,
          csvEscape(anomalies),
          csvEscape(s.notes || ""),
        ].join(","));
      }
      const csv = lines.join("\n");
      const filename = `presenze_${from || "tutti"}_${to || "oggi"}.csv`;
      res.writeHead(200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      });
      res.end("﻿" + csv); // BOM per Excel italiano
      return;
    } catch (err) {
      console.error("[timesheet] export failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "export_failed") });
    }
  }

  // PATCH /api/timesheet/entries/:id → office rettifica
  if (url.pathname.startsWith("/api/timesheet/entries/") && req.method === "PATCH") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const id = decodeURIComponent(url.pathname.slice("/api/timesheet/entries/".length));
    if (!id) return sendJson(res, 400, { error: "missing_id" });
    try {
      const body = await readBody(req);
      const pool = await getPgPool();
      const updates = [];
      const params = [];
      if (body.occurredAt) {
        params.push(new Date(body.occurredAt).toISOString());
        updates.push(`occurred_at = $${params.length}`);
      }
      if (body.entryType) {
        params.push(String(body.entryType));
        updates.push(`entry_type = $${params.length}`);
      }
      if (!updates.length) return sendJson(res, 400, { error: "no_fields" });
      params.push(String(currentUser.email || currentUser.id));
      updates.push(`edited_by = $${params.length}`);
      updates.push(`edited_at = NOW()`);
      if (body.reason) {
        params.push(String(body.reason));
        updates.push(`edit_reason = $${params.length}`);
      }
      updates.push(`source = 'rectified'`);
      params.push(String(id));
      await pool.query(`UPDATE time_entries SET ${updates.join(", ")} WHERE id = $${params.length}`, params);
      // Ricalcola shift impattato
      const entryRes = await pool.query(`SELECT * FROM time_entries WHERE id = $1`, [String(id)]);
      const entry = entryRes.rows[0];
      if (entry) {
        const shiftDate = shiftDateForTimestamp(entry.occurred_at);
        await pool.query(
          `UPDATE time_shifts SET
              clock_in_at  = (SELECT MIN(occurred_at) FROM time_entries WHERE user_id = $1 AND occurred_at::date = $2 AND entry_type = 'clock_in'),
              clock_out_at = (SELECT MAX(occurred_at) FROM time_entries WHERE user_id = $1 AND occurred_at::date = $2 AND entry_type = 'clock_out'),
              updated_at = NOW(),
              status = 'reviewed',
              reviewed_by = $3, reviewed_at = NOW()
          WHERE user_id = $1 AND shift_date = $2`,
          [entry.user_id, shiftDate, String(currentUser.email || currentUser.id)],
        );
        await pool.query(
          `UPDATE time_shifts SET worked_minutes =
             EXTRACT(EPOCH FROM (clock_out_at - clock_in_at))::int / 60
           WHERE user_id = $1 AND shift_date = $2 AND clock_in_at IS NOT NULL AND clock_out_at IS NOT NULL`,
          [entry.user_id, shiftDate],
        );
      }
      writeAuditLog("timesheet_entry", id, "rectify", body, currentUser.email || null).catch(() => {});
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      console.error("[timesheet] patch entry failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "patch_failed") });
    }
  }

  // POST /api/timesheet/rectifications → dipendente segnala anomalia
  if (url.pathname === "/api/timesheet/rectifications" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (!userIsEmployee(currentUser)) return sendJson(res, 403, { error: "forbidden_role" });
    try {
      const body = await readBody(req);
      if (!body.reason || !body.shiftDate) return sendJson(res, 400, { error: "missing_fields" });
      const pool = await getPgPool();
      const { rows } = await pool.query(
        `INSERT INTO time_rectification_requests
           (user_id, shift_date, request_type, target_entry_id, proposed_time, reason)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [
          String(currentUser.id),
          String(body.shiftDate),
          String(body.requestType || "other"),
          body.targetEntryId ? Number(body.targetEntryId) : null,
          body.proposedTime ? new Date(body.proposedTime).toISOString() : null,
          String(body.reason),
        ],
      );
      writeAuditLog("timesheet_rectification", String(rows[0].id), "create", { shiftDate: body.shiftDate, requestType: body.requestType }, currentUser.email || null).catch(() => {});
      return sendJson(res, 201, { id: String(rows[0].id) });
    } catch (err) {
      console.error("[timesheet] rectification create failed:", err?.message || err);
      return sendJson(res, 500, { error: String(err?.message || "create_failed") });
    }
  }

  // GET /api/timesheet/rectifications → office, coda di richieste pending
  if (url.pathname === "/api/timesheet/rectifications" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    try {
      const status = url.searchParams.get("status") || "pending";
      const pool = await getPgPool();
      const { rows } = await pool.query(
        `SELECT * FROM time_rectification_requests WHERE status = $1 ORDER BY created_at DESC LIMIT 200`,
        [String(status)],
      );
      return sendJson(res, 200, { requests: rows });
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "list_failed") });
    }
  }

  if (url.pathname === "/api/sales/diagnostic" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    try {
      const all = Array.isArray(store.salesRequests) ? store.salesRequests : [];
      const total = all.length;
      const bySource = {};
      const byStatus = {};
      const byAssignment = {};
      let oldestCreatedAt = null;
      let newestCreatedAt = null;
      let newestRecord = null;
      for (const r of all) {
        const source = String(r.source || "manual");
        const status = String(r.status || "new");
        const assignment = String(r.assignment || "unassigned");
        bySource[source] = (bySource[source] || 0) + 1;
        byStatus[status] = (byStatus[status] || 0) + 1;
        byAssignment[assignment] = (byAssignment[assignment] || 0) + 1;
        const created = String(r.createdAt || "");
        if (created) {
          if (!oldestCreatedAt || created < oldestCreatedAt) oldestCreatedAt = created;
          if (!newestCreatedAt || created > newestCreatedAt) {
            newestCreatedAt = created;
            newestRecord = r;
          }
        }
      }
      // Tempo dall'ultima richiesta in minuti (per capire se il flusso è attivo)
      let minutesSinceLastRequest = null;
      if (newestCreatedAt) {
        const lastMs = new Date(newestCreatedAt).getTime();
        if (Number.isFinite(lastMs)) {
          minutesSinceLastRequest = Math.round((Date.now() - lastMs) / 60000);
        }
      }
      // Configurazione Sheets
      const sheetsConfig = normalizeSalesRequestSourceConfig(store.salesRequestSource || {});
      const sheetsReady = Boolean(
        sheetsConfig.spreadsheetInput && sheetsConfig.serviceAccountEmail && sheetsConfig.privateKey,
      );
      // Sanity check: ci sono record google-sheets senza ID stabile? (sintomo di
      // sync ripetute con dedupe debole — utile per Fase 0 audit)
      const sheetsRecords = all.filter((r) => String(r.source || "") === "google-sheets");
      const duplicateGuess = sheetsRecords.length
        - new Set(sheetsRecords.map((r) => String(r.id || "")).filter(Boolean)).size;
      return sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        store: {
          total,
          oldestCreatedAt,
          newestCreatedAt,
          minutesSinceLastRequest,
          newestPreview: newestRecord ? {
            id: String(newestRecord.id || ""),
            name: String(newestRecord.name || ""),
            surname: String(newestRecord.surname || ""),
            city: String(newestRecord.city || ""),
            source: String(newestRecord.source || ""),
            status: String(newestRecord.status || ""),
            createdAt: String(newestRecord.createdAt || ""),
          } : null,
          bySource,
          byStatus,
          byAssignment,
          potentialDuplicateIds: duplicateGuess,
        },
        sheets: {
          configured: sheetsReady,
          spreadsheetInput: sheetsConfig.spreadsheetInput || "",
          sheetName: sheetsConfig.sheetName || "",
          editUrl: buildSpreadsheetEditUrl(sheetsConfig.spreadsheetInput || ""),
          // Conteggio righe live Sheets verrà aggiunto in Fase 1 (per ora skip
          // per non chiamare Google API ad ogni diagnostic)
          liveRowCount: null,
        },
        imap: await getImapDiagnosticSnapshot(),
      });
    } catch (error) {
      return sendJson(res, 500, { error: String(error?.message || "sales_diagnostic_failed") });
    }
  }

  // GET /api/sales/requests/pipeline — vista kanban: 4 colonne con conteggi + top leads
  if (url.pathname === "/api/sales/requests/pipeline" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    try {
      const result = await getSalesRequestPipelineFromDb({ limit });
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "pipeline_failed") });
    }
  }

  // GET /api/sales/requests — ricerca CRM server-side con FTS + filtri + paginazione
  if (url.pathname === "/api/sales/requests" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const q          = String(url.searchParams.get("q") || "").trim();
    const status     = String(url.searchParams.get("status") || "").trim();
    const assignment = String(url.searchParams.get("assignment") || "").trim();
    const source     = String(url.searchParams.get("source") || "").trim();
    const dateFrom   = String(url.searchParams.get("dateFrom") || "").trim();
    const dateTo     = String(url.searchParams.get("dateTo") || "").trim();
    const page       = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit      = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    try {
      const result = await searchSalesRequestsFromDb({ q, status, assignment, source, dateFrom, dateTo, page, limit });
      return sendJson(res, 200, result);
    } catch (err) {
      return sendJson(res, 500, { error: String(err?.message || "search_failed") });
    }
  }

  if (url.pathname === "/api/sales/requests" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const body = await readBody(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return sendJson(res, 400, { error: "invalid_sales_request_payload" });
    }
    const now = new Date().toISOString();
    const existingRequest = store.salesRequests.find((item) => item.id === String(body.id || "")) || null;
    const draftRecord = normalizeSalesRequestRecord({
      ...(existingRequest || {}),
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
    // Outbox-backed: se l'upsert immediato fallisce, ritentato in background
    // invece di sparire silenziosamente.
    enqueueOrRunOutboxJob(
      "upsert_sales_request",
      { request: requestRecord, userId: currentUser?.email || null },
      (payload) => upsertSalesRequestToDb(payload.request, payload.userId, { rethrow: true }),
    ).catch(() => {});
    const sheetSync = enqueueSalesRequestsGoogleSheetSync(store.salesRequestSource || {}, [requestRecord]);
    return sendJson(res, 200, {
      ...requestRecord,
      _automation: automationResult.automation || { action: "none" },
      _sheetSync: sheetSync,
    });
  }

  if (url.pathname.match(/^\/api\/sales\/requests\/[^/]+$/) && req.method === "PATCH") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const requestId = decodeURIComponent(url.pathname.split("/")[4]);
    const body = await readBody(req);
    const rawPatch = body?.patch && typeof body.patch === "object" && !Array.isArray(body.patch)
      ? body.patch
      : body;
    if (!rawPatch || typeof rawPatch !== "object" || Array.isArray(rawPatch)) {
      return sendJson(res, 400, { error: "invalid_sales_request_patch" });
    }
    const allowedPatchFields = new Set([
      "assignment",
      "status",
      "note",
      "firstContactState",
      "firstContactScheduledAt",
      "firstContactSentAt",
      "firstContactBy",
      "firstContactAt",
      "requestedHeight",
      "sqm",
      "surface",
      "service",
      "city",
      "phone",
      "email",
      "name",
      "surname",
      "quotedAt",
    ]);
    const patch = {};
    Object.entries(rawPatch).forEach(([key, value]) => {
      if (allowedPatchFields.has(key)) patch[key] = value;
    });
    if (!Object.keys(patch).length) {
      return sendJson(res, 400, { error: "empty_sales_request_patch" });
    }
    const existingIndex = store.salesRequests.findIndex((item) => item.id === requestId);
    if (existingIndex < 0) return sendJson(res, 404, { error: "request_not_found" });
    const existingRequest = store.salesRequests[existingIndex];
    const now = new Date().toISOString();
    const draftRecord = normalizeSalesRequestRecord({
      ...existingRequest,
      ...patch,
      id: requestId,
      createdAt: existingRequest.createdAt || now,
      updatedAt: now,
    });
    const automationResult = await applySalesRequestAutomationOnSave({
      existingRequest,
      requestRecord: draftRecord,
      nowIso: now,
    });
    const requestRecord = normalizeSalesRequestRecord({
      ...automationResult.record,
      id: requestId,
      createdAt: existingRequest.createdAt || draftRecord.createdAt || now,
      updatedAt: now,
    });
    store.salesRequests[existingIndex] = requestRecord;
    if (USE_POSTGRES) {
      const dbUpdated = await updateSalesRequestMicroFieldsInDb(requestRecord, patch, existingRequest, currentUser?.email || null);
      if (!dbUpdated) await upsertSalesRequestToDb(requestRecord, currentUser?.email || null);
      rotateStoreRevision(store);
      if (storeMemCache?.__memReconciled) store.__memReconciled = true;
      storeMemCache = store;
      broadcastStoreRevision(getStoreRevision(store));
    } else {
      await writeJson(STORE_PATH, store);
    }
    const sheetSync = enqueueSalesRequestsGoogleSheetSync(store.salesRequestSource || {}, [requestRecord]);
    return sendJson(res, 200, {
      ...requestRecord,
      _automation: automationResult.automation || { action: "none" },
      _sheetSync: sheetSync,
    });
  }

  if (url.pathname === "/api/sales/requests/bulk-assignment" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const body = await readBody(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return sendJson(res, 400, { error: "invalid_sales_request_payload" });
    }
    const assignment = normalizeSalesRequestAssignment(body.assignment || "");
    if (!assignment) return sendJson(res, 400, { error: "invalid_assignment" });
    const rawIds = Array.isArray(body.ids) ? body.ids : [];
    const requestIds = Array.from(new Set(rawIds.map((item) => String(item || "").trim()).filter(Boolean))).slice(0, 200);
    if (!requestIds.length) return sendJson(res, 400, { error: "missing_request_ids" });
    const idSet = new Set(requestIds);
    const now = new Date().toISOString();
    const updatedRequests = [];
    for (let index = 0; index < store.salesRequests.length; index += 1) {
      const existingRequest = store.salesRequests[index];
      if (!idSet.has(existingRequest.id)) continue;
      const draftRecord = normalizeSalesRequestRecord({
        ...existingRequest,
        assignment,
        firstContactBy: assignment,
        updatedAt: now,
      });
      const automationResult = await applySalesRequestAutomationOnSave({
        existingRequest,
        requestRecord: draftRecord,
        nowIso: now,
      });
      const requestRecord = normalizeSalesRequestRecord({
        ...automationResult.record,
        createdAt: existingRequest.createdAt || draftRecord.createdAt || now,
        updatedAt: now,
      });
      store.salesRequests[index] = requestRecord;
      updatedRequests.push({
        ...requestRecord,
        _automation: automationResult.automation || { action: "none" },
      });
    }
    if (!updatedRequests.length) return sendJson(res, 404, { error: "requests_not_found" });
    if (USE_POSTGRES) {
      await Promise.all(updatedRequests.map(async (rec) => {
        const dbUpdated = await updateSalesRequestMicroFieldsInDb(rec, { assignment }, null, currentUser?.email || null);
        if (!dbUpdated) await upsertSalesRequestToDb(rec, currentUser?.email || null);
      }));
      rotateStoreRevision(store);
      if (storeMemCache?.__memReconciled) store.__memReconciled = true;
      storeMemCache = store;
      broadcastStoreRevision(getStoreRevision(store));
    } else {
      await writeJson(STORE_PATH, store);
    }
    const sheetSync = enqueueSalesRequestsGoogleSheetSync(store.salesRequestSource || {}, updatedRequests);
    return sendJson(res, 200, {
      requests: updatedRequests,
      updatedCount: updatedRequests.length,
      skippedCount: Math.max(0, requestIds.length - updatedRequests.length),
      assignment,
      sheetSync,
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
    // Outbox-backed: se la delete immediata fallisce, ritentata in background.
    enqueueOrRunOutboxJob(
      "delete_sales_request",
      { id: requestId },
      (payload) => deleteSalesRequestFromDb(payload.id, { rethrow: true }),
    ).catch(() => {});
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
    await writeJson(STORE_PATH, store);
    scheduleAttachmentAssetRemoval(removedContent.attachments || [], "sales_content_attachment_delete_failed");
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

  if (url.pathname.match(/^\/api\/sales\/content-items\/[^/]+\/attachments\/upload$/) && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
    const contentId = decodeURIComponent(url.pathname.split("/")[4]);
    const contentIndex = store.salesContents.findIndex((item) => item.id === contentId);
    if (contentIndex < 0) return sendJson(res, 404, { error: "content_not_found" });
    const fileBuffer = await readRawBody(req);
    if (!fileBuffer?.length) return sendJson(res, 400, { error: "empty_attachment" });
    const name = String(url.searchParams.get("name") || "attachment").trim() || "attachment";
    const type = String(url.searchParams.get("type") || req.headers["content-type"] || "application/octet-stream").trim() || "application/octet-stream";
    const size = Math.max(0, Number(url.searchParams.get("size") || fileBuffer.length || 0));
    const context = String(url.searchParams.get("context") || "sales-content").trim();
    const savedAttachment = await storeAttachmentBuffer(
      contentId,
      {
        name,
        type,
        size,
        context,
        createdAt: new Date().toISOString(),
      },
      fileBuffer,
      "sales-content",
    );
    const current = store.salesContents[contentIndex];
    store.salesContents[contentIndex] = normalizeSalesContentRecord({
      ...current,
      attachments: [...(current.attachments || []), savedAttachment],
      updatedAt: new Date().toISOString(),
    });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, serializeSalesContentForClient(store.salesContents[contentIndex]));
  }

  if (url.pathname.match(/^\/api\/sales\/content-items\/[^/]+\/attachments\/[^/]+\/file$/) && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "office") return sendJson(res, 403, { error: "forbidden" });
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
    store.salesContents[contentIndex] = normalizeSalesContentRecord({
      ...current,
      attachments,
      updatedAt: new Date().toISOString(),
    });
    await writeJson(STORE_PATH, store);
    scheduleAttachmentAssetRemoval([removedAttachment], "sales_content_attachment_delete_failed");
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
    const topic = req.headers["x-shopify-topic"] ?? "";
    const verified = verifyShopifyWebhook(rawBody, hmacHeader, store.shopifySettings?.clientSecret || "");
    if (!verified) return sendJson(res, 401, { error: "invalid_webhook_signature" });

    const payload = JSON.parse(rawBody.toString("utf8") || "{}");

    switch (topic) {
      case "orders/create":
      case "orders/updated": {
        const normalized = normalizeOrderPayload(payload, 0);
        const result = upsertOrderRecord(store, normalized);
        store.orders = sortOrdersByRecency(store.orders);
        await writeJson(STORE_PATH, store);
        upsertOrderToDb(result.order, "shopify-webhook").catch(() => {});
        return sendJson(res, 200, { ok: true, orderId: result.order.id, jobId: result.job?.id || null });
      }
      case "orders/paid": {
        const shopifyId = String(payload.id ?? "");
        if (shopifyId) {
          const idx = store.orders.findIndex((o) => getNormalizedShopifyNumericId(o) === shopifyId || o.id === shopifyId);
          if (idx >= 0) {
            store.orders[idx] = { ...store.orders[idx], financialStatus: "paid" };
            await writeJson(STORE_PATH, store);
            upsertOrderToDb(store.orders[idx], "shopify-webhook").catch(() => {});
          }
        }
        return sendJson(res, 200, { ok: true });
      }
      case "orders/cancelled": {
        const shopifyId = String(payload.id ?? "");
        if (shopifyId) {
          const idx = store.orders.findIndex((o) => getNormalizedShopifyNumericId(o) === shopifyId || o.id === shopifyId);
          if (idx >= 0) {
            store.orders[idx] = { ...store.orders[idx], fulfillmentStatus: "cancelled", financialStatus: "voided" };
            await writeJson(STORE_PATH, store);
            upsertOrderToDb(store.orders[idx], "shopify-webhook").catch(() => {});
          }
        }
        return sendJson(res, 200, { ok: true });
      }
      default:
        return sendJson(res, 200, { ok: true, ignored: true });
    }
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
      communicationTargets: getAllowedCommunicationTargets(store, currentUser),
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
    const sqlInventory = await getInventoryFromDb();
    return sendJson(res, 200, sqlInventory ?? store.inventory);
  }

  if (url.pathname === "/api/inventory/items" && req.method === "POST") {
    const body = await readBody(req);
    const payload = buildInventoryItemsFromBody(body);
    if (payload.error) {
      return sendJson(res, 400, { error: payload.error });
    }
    store.inventory.unshift(...payload.created);
    await writeJson(STORE_PATH, store);
    for (const piece of payload.created) upsertInventoryItemToDb(piece).catch(() => {});
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname.match(/^\/api\/inventory\/items\/by-product\/[^/]+$/) && req.method === "DELETE") {
    const productLabel = decodeURIComponent(url.pathname.split("/")[5] || "");
    const productKey = normalizeInventoryProductKey(productLabel);
    if (!productKey) {
      return sendJson(res, 400, { error: "invalid_inventory_product" });
    }
    // Raccogli gli ID da eliminare PRIMA del filter per il dual-write
    const toDeleteIds = (store.inventory || [])
      .filter((item) => normalizeInventoryProductKey(item.product || "") === productKey && normalizeInventoryPieceState(item.pieceState) === "disponibile")
      .map((item) => item.id);
    store.inventory = (store.inventory || []).filter((item) => (
      normalizeInventoryProductKey(item.product || "") !== productKey
      || normalizeInventoryPieceState(item.pieceState) !== "disponibile"
    ));
    await writeJson(STORE_PATH, store);
    for (const id of toDeleteIds) deleteInventoryItemFromDb(id).catch(() => {}); // dual-write SQL
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname.match(/^\/api\/inventory\/items\/[^/]+$/) && req.method === "DELETE") {
    const itemId = decodeURIComponent(url.pathname.split("/")[4]);
    const targetItem = store.inventory.find((item) => item.id === itemId);
    if (targetItem && normalizeInventoryPieceState(targetItem.pieceState) !== "disponibile") {
      return sendJson(res, 409, { error: "inventory_piece_not_available" });
    }
    store.inventory = store.inventory.filter((item) => item.id !== itemId);
    await writeJson(STORE_PATH, store);
    deleteInventoryItemFromDb(itemId).catch(() => {});
    return sendJson(res, 200, store.inventory);
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/inventory\/suggest$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return sendJson(res, 404, { error: "order_not_found" });
    try {
      if (backfillInventoryIds(store)) await writeJson(STORE_PATH, store);
      return sendJson(res, 200, buildInventorySuggestionsForOrder(store, order));
    } catch (err) {
      console.error("[inventory/suggest] unexpected error:", err);
      return sendJson(res, 500, { error: "inventory_suggest_failed" });
    }
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/inventory\/commit$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const body = await readBody(req);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return sendJson(res, 404, { error: "order_not_found" });
    const buildTag = "inv-commit-2026-05-14-g";
    try {
      if (backfillInventoryIds(store)) {
        writeJson(STORE_PATH, store).catch((e) => console.error("[inventory/commit] backfill persist failed:", e?.message || e));
      }
      const clientSupplied = Array.isArray(body.suggestions);
      const debugSnapshot = {
        clientSupplied,
        clientSuggestionCount: clientSupplied ? body.suggestions.length : 0,
        storeInventoryCount: (store.inventory || []).length,
        storeInventorySample: (store.inventory || []).slice(0, 30).map((p) => ({
          id: (p.id || "").slice(0, 8),
          product: p.product,
          state: p.pieceState,
          type: p.pieceType,
          w: p.width,
          l: p.length,
          units: p.units,
        })),
        clientSuggestionsSample: clientSupplied
          ? body.suggestions.map((s) => ({
              srcId: (s.sourcePieceId || s.pieceId || "").slice(0, 8),
              product: s.product,
              action: s.action,
              w: s.width,
              l: s.length,
              units: s.units,
            }))
          : [],
      };
      console.warn(`[inventory/commit] build=${buildTag} order=${orderId} debug=${JSON.stringify(debugSnapshot)}`);
      let suggestions = clientSupplied ? body.suggestions : buildInventorySuggestionsForOrder(store, order).suggestions;
      let result = applyInventoryCommitment(store, order, suggestions);
      let firstAttemptFailure = null;
      if (!result.ok) {
        firstAttemptFailure = { error: result.error, unavailable: result.unavailable || [] };
        console.warn(`[inventory/commit] first attempt failed: ${JSON.stringify(firstAttemptFailure)}`);
      }
      let retrySuggestionsSample = null;
      let retryFailure = null;
      // If client-supplied suggestions are stale, rebuild fresh and retry once
      if (!result.ok && result.error === "inventory_piece_unavailable" && clientSupplied) {
        console.warn("[inventory/commit] client suggestions unavailable, retrying with fresh suggestions for order", orderId);
        suggestions = buildInventorySuggestionsForOrder(store, order).suggestions;
        retrySuggestionsSample = suggestions.map((s) => ({
          srcId: (s.sourcePieceId || s.pieceId || "").slice(0, 8),
          product: s.product,
          action: s.action,
          w: s.width,
          l: s.length,
          units: s.units,
        }));
        console.warn(`[inventory/commit] freshSuggestionsSample: ${JSON.stringify(retrySuggestionsSample)}`);
        result = applyInventoryCommitment(store, order, suggestions);
        if (!result.ok) {
          retryFailure = { error: result.error, unavailable: result.unavailable || [] };
          console.warn(`[inventory/commit] retry failed: ${JSON.stringify(retryFailure)}`);
        }
      }
      if (!result.ok) {
        console.warn("[inventory/commit] commit failed for order", orderId, "error:", result.error, "unavailable:", result.unavailable?.length || 0);
        return sendJson(res, result.error === "inventory_piece_unavailable" ? 409 : 400, {
          error: result.error || "inventory_commit_failed",
          unavailable: result.unavailable || [],
          buildTag,
          debug: {
            ...debugSnapshot,
            firstAttemptFailure,
            retrySuggestionsSample,
            retryFailure,
          },
        });
      }
      // Persist — non-fatal: in-memory state is already correct
      writeJson(STORE_PATH, store).catch((writeErr) => {
        console.error("[inventory/commit] persist failed:", writeErr?.message || writeErr);
      });
      const committedOrder = store.orders.find((o) => o.id === orderId);
      if (committedOrder) upsertOrderToDb(committedOrder, currentUser?.email || null).catch(() => {}); // dual-write SQL
      // Dual-write delle inventory piece coinvolte nel commit
      const commitPieceIds = new Set((result.allocations || []).map((a) => a.pieceId).filter(Boolean));
      store.inventory.filter((p) => commitPieceIds.has(p.id)).forEach((p) => upsertInventoryItemToDb(p).catch(() => {}));
      return sendJson(res, 200, {
        order: result.order,
        inventory: store.inventory,
        allocations: result.allocations || [],
      });
    } catch (err) {
      console.error("[inventory/commit] unexpected error:", err);
      return sendJson(res, 500, { error: "inventory_commit_failed" });
    }
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/inventory\/release$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return sendJson(res, 404, { error: "order_not_found" });
    try {
      const result = releaseInventoryCommitmentsForOrder(store, order);
      writeJson(STORE_PATH, store).catch((writeErr) => {
        console.error("[inventory/release] persist failed:", writeErr?.message || writeErr);
      });
      const releasedOrder = store.orders.find((o) => o.id === orderId);
      if (releasedOrder) upsertOrderToDb(releasedOrder, currentUser?.email || null).catch(() => {}); // dual-write SQL
      // Dual-write delle inventory piece rilasciate (ora disponibili)
      const releasePieceIds = new Set(
        (order.operations?.warehouse?.inventoryAllocations || []).map((a) => a.pieceId).filter(Boolean),
      );
      store.inventory.filter((p) => releasePieceIds.has(p.id)).forEach((p) => upsertInventoryItemToDb(p).catch(() => {}));
      return sendJson(res, 200, {
        order: result.order,
        inventory: store.inventory,
      });
    } catch (err) {
      console.error("[inventory/release] unexpected error:", err);
      return sendJson(res, 500, { error: "inventory_release_failed" });
    }
  }

  if (url.pathname.match(/^\/api\/orders\/[^/]+\/inventory\/fulfill$/) && req.method === "POST") {
    const orderId = decodeURIComponent(url.pathname.split("/")[3]);
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) return sendJson(res, 404, { error: "order_not_found" });
    try {
      const result = fulfillInventoryCommitmentsForOrder(store, order);
      writeJson(STORE_PATH, store).catch((writeErr) => {
        console.error("[inventory/fulfill] persist failed:", writeErr?.message || writeErr);
      });
      const fulfilledOrder = store.orders.find((o) => o.id === orderId);
      if (fulfilledOrder) upsertOrderToDb(fulfilledOrder, currentUser?.email || null).catch(() => {}); // dual-write SQL
      // Dual-write delle inventory piece evase (stato: evaso)
      if (result.changed) {
        const fulfillPieceIds = new Set(
          (order.operations?.warehouse?.inventoryAllocations || []).map((a) => a.pieceId).filter(Boolean),
        );
        store.inventory.filter((p) => fulfillPieceIds.has(p.id)).forEach((p) => upsertInventoryItemToDb(p).catch(() => {}));
      }
      return sendJson(res, 200, {
        order: result.order,
        inventory: store.inventory,
        changed: Boolean(result.changed),
      });
    } catch (err) {
      console.error("[inventory/fulfill] unexpected error:", err);
      return sendJson(res, 500, { error: "inventory_fulfill_failed" });
    }
  }

  if (url.pathname === "/api/jobs" && req.method === "GET") {
    const sqlJobs = await getJobsFromDb();
    return sendJson(res, 200, sqlJobs ?? store.jobs);
  }

  if (url.pathname === "/api/jobs" && req.method === "POST") {
    const body = await readBody(req);
    const nextJobs = [body, ...store.jobs.filter((job) => job.id !== body.id)];
    store.jobs = nextJobs;
    await writeJson(STORE_PATH, store);
    upsertJobToDb(body).catch(() => {});
    return sendJson(res, 200, body);
  }

  if (url.pathname.startsWith("/api/jobs/") && req.method === "DELETE") {
    const jobId = url.pathname.split("/").pop();
    store.jobs = store.jobs.filter((job) => job.id !== jobId);
    store.orders = store.orders.map((order) => order.convertedJobId === jobId ? { ...order, convertedJobId: null } : order);
    await writeJson(STORE_PATH, store);
    deleteJobFromDb(jobId).catch(() => {});
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
    upsertJobToDb(store.jobs[jobIndex]).catch(() => {}); // dual-write SQL
    return sendJson(res, 200, store.jobs[jobIndex]);
  }

  if (url.pathname === "/api/orders" && req.method === "GET") {
    const sqlOrders = await getOrdersFromDb();
    if (!sqlOrders) return sendJson(res, 200, store.orders);
    // store.orders è la fonte primaria (sqm calcolato, tutti gli ordini Shopify);
    // DB override le operations solo dove sono state modificate manualmente.
    const dbOpsMap = new Map(sqlOrders.map((o) => [o.id, o.operations]));
    const storeIds = new Set(store.orders.map((o) => o.id));
    const merged = store.orders.map((order) => {
      const dbOps = dbOpsMap.get(order.id);
      const isMeaningful = dbOps && Object.keys(dbOps).length > 3
        && (dbOps.sqm > 0 || dbOps.officeStatus !== "bozza");
      // Blob vince su PG per i campi in comune (evita revert status "completata").
      return isMeaningful ? { ...order, operations: { ...dbOps, ...(order.operations || {}) } } : order;
    });
    const dbOnlyOrders = sqlOrders.filter((o) => !storeIds.has(o.id));
    return sendJson(res, 200, sortOrdersByRecency([...merged, ...dbOnlyOrders]));
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
    upsertOrderToDb(manualOrder, currentUser?.email || null).catch(() => {});
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
      upsertOrderToDb(result.order, currentUser?.email || null).catch(() => {});
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
    upsertOrderToDb(nextOrder, currentUser?.email || null).catch(() => {});
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
    upsertOrderToDb(store.orders[orderIndex], currentUser?.email || null).catch(() => {}); // dual-write SQL
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
    upsertOrderToDb(store.orders[orderIndex], currentUser?.email || null).catch(() => {}); // dual-write SQL
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
    if (shouldFulfillInventoryForOrder(store.orders[orderIndex])) {
      const fulfillmentResult = fulfillInventoryCommitmentsForOrder(store, store.orders[orderIndex]);
      store.orders[orderIndex] = fulfillmentResult.order;
      if (fulfillmentResult.changed) {
        // Dual-write piece state auto-evase
        const autoFulfillPieceIds = new Set(
          (current.operations?.warehouse?.inventoryAllocations || []).map((a) => a.pieceId).filter(Boolean),
        );
        store.inventory.filter((p) => autoFulfillPieceIds.has(p.id)).forEach((p) => upsertInventoryItemToDb(p).catch(() => {}));
      }
    }
    // Scrivi prima in PG, poi in blob store (che emette il broadcast NOTIFY ai client).
    // Questo elimina la race condition dove GET /api/orders legge dati PG stantii
    // subito dopo il broadcast, riportando lo stato a "da-pianificare".
    // Dopo l'upsert PG invalida la cache in-memory di getOrdersFromDb(): senza questa
    // chiamata la cache (TTL 10s) restituisce i dati vecchi all'immediata /api/session
    // triggered dal NOTIFY, riportando isMeaningful a sovrascrivere il blob con "da-pianificare".
    upsertOrderToDb(store.orders[orderIndex], currentUser?.email || null)
      .catch(() => {})
      .finally(() => {
        // Invalida sempre la cache PG (anche se l'upsert fallisce) per evitare
        // che dati stantii sovrascrivano le operazioni appena salvate nel blob.
        invalidateOrdersDbCache();
        writeJson(STORE_PATH, store).catch((writeErr) => {
          console.error("[operations] persist failed:", writeErr?.message || writeErr);
        });
      });
    // Push notifications: crew assegnata o ordine pronto per spedizione
    const updatedOrder = store.orders[orderIndex];
    const newCrew = updatedOrder.operations?.installation?.crew || "";
    const prevCrew = current.operations?.installation?.crew || "";
    const newWHStatus = updatedOrder.operations?.warehouse?.status || "";
    const prevWHStatus = current.operations?.warehouse?.status || "";
    if (normalizeCrewName(prevCrew) !== normalizeCrewName(newCrew) && newCrew) {
      sendPushToCrewName(store, newCrew, {
        type: "crew_assigned",
        title: "Nuovo lavoro assegnato",
        body: `${updatedOrder.name || updatedOrder.id} — ${updatedOrder.operations?.installation?.installDate || "data da definire"}`,
        data: { orderId: updatedOrder.id, view: "installations" },
      }).catch(() => {});
    }
    if (prevWHStatus !== newWHStatus && newWHStatus === "pronto") {
      sendPushToRole(store, "warehouse", {
        type: "warehouse_ready",
        title: "Ordine pronto per spedizione",
        body: updatedOrder.name || updatedOrder.id,
        data: { orderId: updatedOrder.id, view: "warehouse" },
      }).catch(() => {});
    }
    return sendJson(res, 200, updatedOrder);
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
    upsertOrderToDb(store.orders[orderIndex], currentUser?.email || null).catch(() => {}); // dual-write SQL
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
    upsertOrderToDb(store.orders[orderIndex], currentUser?.email || null).catch(() => {}); // dual-write SQL
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
      const fulfillmentResult = fulfillInventoryCommitmentsForOrder(store, store.orders[orderIndex]);
      store.orders[orderIndex] = fulfillmentResult.order;
      await writeJson(STORE_PATH, store);
      upsertOrderToDb(store.orders[orderIndex], currentUser?.email || null).catch(() => {}); // dual-write SQL
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
    // Dual-write SQL per ogni ordine importato
    for (const order of normalized) {
      upsertOrderToDb(order, currentUser?.email || null).catch(() => {});
    }
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
      // Dual-write SQL per ogni ordine sincronizzato da Shopify
      for (const order of orders) {
        upsertOrderToDb(order, "shopify-sync").catch(() => {});
      }
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
      const topicsToRegister = [
        "ORDERS_CREATE",
        "ORDERS_UPDATED",
        "ORDERS_CANCELLED",
        "ORDERS_PAID",
      ];
      // Considera "già registrato" solo se l'endpoint e TUTTI i topic sono configurati
      const registeredTopics = Array.isArray(store.shopifySettings?.webhookTopicsRegistered)
        ? store.shopifySettings.webhookTopicsRegistered
        : [];
      const allTopicsRegistered = topicsToRegister.every((t) => registeredTopics.includes(t));
      if (
        String(store.shopifySettings?.webhookEndpoint || "").trim() === endpoint
        && String(store.shopifySettings?.webhookSubscriptionId || "").trim()
        && allTopicsRegistered
      ) {
        return sendJson(res, 200, {
          endpoint,
          subscriptionId: String(store.shopifySettings.webhookSubscriptionId || "").trim(),
          topics: registeredTopics,
          reused: true,
        });
      }

      const accessToken = await getShopifyAccessToken(store);
      const mutation = `
        mutation RegisterOrdersWebhook($topic: WebhookSubscriptionTopic!, $subscription: WebhookSubscriptionInput!) {
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

      const registrationResults = [];
      for (const topicName of topicsToRegister) {
        const data = await queryShopifyAdmin(
          store,
          accessToken,
          mutation,
          {
            topic: topicName,
            subscription: {
              uri: endpoint,
              format: "JSON",
            },
          },
          "webhook_register_failed",
        );
        const created = data?.webhookSubscriptionCreate;
        if (created?.userErrors?.length) {
          // Ignora errori di topic non supportato (es. ORDERS_PAID su API più vecchie)
          // ma propaga errori critici per il topic principale
          if (topicName === "ORDERS_CREATE") {
            return sendJson(res, 400, { error: created.userErrors[0].message || "webhook_register_failed" });
          }
          registrationResults.push({ topic: topicName, error: created.userErrors[0].message });
        } else {
          registrationResults.push({ topic: topicName, id: created?.webhookSubscription?.id || "" });
        }
      }

      const primaryResult = registrationResults.find((r) => r.topic === "ORDERS_CREATE");
      store.shopifySettings.webhookEndpoint = endpoint;
      store.shopifySettings.webhookSubscriptionId = primaryResult?.id || "";
      store.shopifySettings.webhookTopicsRegistered = registrationResults
        .filter((r) => r.id)
        .map((r) => r.topic);
      await writeJson(STORE_PATH, store);
      return sendJson(res, 200, {
        endpoint,
        subscriptionId: store.shopifySettings.webhookSubscriptionId,
        registrationResults,
      });
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

  // --- Catalog API ---
  const catalogListMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)$/);
  if (catalogListMatch && req.method === "GET") {
    if (requireOffice(res, currentUser)) return;
    const category = decodeURIComponent(catalogListMatch[1]);
    if (!USE_POSTGRES) return sendJson(res, 200, []);
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const result = await pool.query(
      "SELECT * FROM catalog_items WHERE category=$1 AND active=TRUE ORDER BY position, created_at",
      [category]
    );
    return sendJson(res, 200, result.rows);
  }

  if (catalogListMatch && req.method === "POST") {
    if (requireOffice(res, currentUser)) return;
    const category = decodeURIComponent(catalogListMatch[1]);
    const body = await readBody(req);
    const { value, label, position, metadata } = body || {};
    if (!value) return sendJson(res, 400, { error: "value_required" });
    if (!USE_POSTGRES) return sendJson(res, 200, { category, value, label: label || value, position: position || 0, metadata: metadata || {}, active: true });
    await ensureRelationalSchema();
    const pool = await getPgPool();
    const result = await pool.query(
      `INSERT INTO catalog_items (category, value, label, position, metadata, active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (category, value) DO UPDATE SET
         label=EXCLUDED.label, position=EXCLUDED.position,
         metadata=EXCLUDED.metadata, active=true
       RETURNING *`,
      [category, value, label || value, position || 0, JSON.stringify(metadata || {})]
    );
    return sendJson(res, 200, result.rows[0]);
  }

  const auditMatch = url.pathname.match(/^\/api\/audit\/(order|sales_request)\/([^/]+)$/);
  if (auditMatch && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const entityType = auditMatch[1];
    const entityId = decodeURIComponent(auditMatch[2]);
    if (!USE_POSTGRES) return sendJson(res, 200, []);
    try {
      const pool = await getPgPool();
      const { rows } = await pool.query(
        "SELECT id, entity_type, entity_id, user_id, action, diff, created_at FROM audit_log WHERE entity_type=$1 AND entity_id=$2 ORDER BY created_at DESC LIMIT 100",
        [entityType, entityId],
      );
      return sendJson(res, 200, rows.map((r) => ({
        id: String(r.id),
        entityType: r.entity_type,
        entityId: r.entity_id,
        userId: r.user_id || null,
        action: r.action,
        diff: r.diff || {},
        createdAt: r.created_at,
      })));
    } catch (err) {
      return sendJson(res, 500, { error: err?.message || "audit_log_error" });
    }
  }

  const catalogItemMatch = url.pathname.match(/^\/api\/catalog\/([^/]+)\/([^/]+)$/);
  if (catalogItemMatch && req.method === "DELETE") {
    if (requireOffice(res, currentUser)) return;
    const category = decodeURIComponent(catalogItemMatch[1]);
    const value = decodeURIComponent(catalogItemMatch[2]);
    if (!USE_POSTGRES) return sendJson(res, 200, { ok: true });
    await ensureRelationalSchema();
    const pool = await getPgPool();
    await pool.query(
      "UPDATE catalog_items SET active=false WHERE category=$1 AND value=$2",
      [category, value]
    );
    return sendJson(res, 200, { ok: true });
  }

  // ─── Push subscriptions ──────────────────────────────────────────────────────

  if (url.pathname === "/api/push/vapid-public-key" && req.method === "GET") {
    return sendJson(res, 200, { publicKey: VAPID_PUBLIC_KEY || null });
  }

  if (url.pathname === "/api/push/subscribe" && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const { endpoint, keys } = body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) return sendJson(res, 400, { error: "invalid_subscription" });
    store.pushSubscriptions = (store.pushSubscriptions || []).filter((s) => s.endpoint !== endpoint);
    store.pushSubscriptions.push({
      userId: String(currentUser.id),
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      createdAt: new Date().toISOString(),
    });
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true });
  }

  if (url.pathname === "/api/push/subscribe" && req.method === "DELETE") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    const body = await readBody(req);
    const { endpoint } = body || {};
    if (!endpoint) return sendJson(res, 400, { error: "missing_endpoint" });
    store.pushSubscriptions = (store.pushSubscriptions || []).filter(
      (s) => !(s.endpoint === endpoint && s.userId === String(currentUser.id))
    );
    await writeJson(STORE_PATH, store);
    return sendJson(res, 200, { ok: true });
  }

  // ─── Crew job endpoints ──────────────────────────────────────────────────────

  if (url.pathname === "/api/crew/jobs" && req.method === "GET") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "crew") return sendJson(res, 403, { error: "forbidden" });
    const crewNorm = normalizeCrewName(currentUser.crewName || "");
    if (!crewNorm) return sendJson(res, 200, []);
    const sqlJobs = await getJobsFromDb();
    const allJobs = sqlJobs ?? store.jobs;
    const crewJobs = allJobs.filter((j) => normalizeCrewName(j.crew || "") === crewNorm);
    const ordersMap = new Map(store.orders.map((o) => [o.id, o]));
    const result = crewJobs.map((j) => {
      const order = j.sourceOrderId ? ordersMap.get(j.sourceOrderId) : null;
      return {
        ...j,
        orderName: order?.name || "",
        orderAddress: `${order?.shipping?.address1 || ""} ${order?.shipping?.city || ""}`.trim(),
        orderPhone: order?.shipping?.phone || order?.phone || "",
      };
    });
    return sendJson(res, 200, result);
  }

  if (url.pathname.match(/^\/api\/crew\/jobs\/[^/]+$/) && req.method === "PATCH") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "crew") return sendJson(res, 403, { error: "forbidden" });
    const jobId = decodeURIComponent(url.pathname.split("/")[4]);
    const body = await readBody(req);
    const crewNorm = normalizeCrewName(currentUser.crewName || "");
    const jobIndex = store.jobs.findIndex((j) => j.id === jobId && normalizeCrewName(j.crew || "") === crewNorm);
    if (jobIndex < 0) return sendJson(res, 404, { error: "job_not_found" });
    const prev = store.jobs[jobIndex];
    const CREW_UPDATABLE = ["installStatus", "warehouseStatus", "notes"];
    const update = {};
    for (const field of CREW_UPDATABLE) {
      if (body[field] !== undefined) update[field] = String(body[field] || "");
    }
    store.jobs[jobIndex] = { ...prev, ...update };
    writeAuditLog("job", jobId, "crew_update", update, currentUser.id).catch(() => {});
    if (update.installStatus && update.installStatus !== prev.installStatus) {
      const jobLabel = `${prev.firstName || ""} ${prev.lastName || ""}`.trim() || jobId;
      sendPushToRole(store, "office", {
        type: "job_status_updated",
        title: "Stato lavoro aggiornato",
        body: `${currentUser.name || "Crew"}: ${jobLabel} → ${update.installStatus}`,
        data: { jobId, view: "installations" },
      }).catch(() => {});
    }
    await writeJson(STORE_PATH, store);
    upsertJobToDb(store.jobs[jobIndex]).catch(() => {});
    return sendJson(res, 200, store.jobs[jobIndex]);
  }

  if (url.pathname.match(/^\/api\/crew\/jobs\/[^/]+\/expenses$/) && req.method === "POST") {
    if (!currentUser) return sendJson(res, 401, { error: "unauthorized" });
    if (currentUser.role !== "crew") return sendJson(res, 403, { error: "forbidden" });
    const jobId = decodeURIComponent(url.pathname.split("/")[4]);
    const body = await readBody(req);
    const crewNorm = normalizeCrewName(currentUser.crewName || "");
    const job = store.jobs.find((j) => j.id === jobId && normalizeCrewName(j.crew || "") === crewNorm);
    if (!job) return sendJson(res, 404, { error: "job_not_found" });
    const orderIndex = store.orders.findIndex((o) => o.convertedJobId === jobId || o.id === job.sourceOrderId);
    if (orderIndex < 0) return sendJson(res, 404, { error: "order_not_found" });
    if (normalizeCrewName(store.orders[orderIndex].operations?.installation?.crew || "") !== crewNorm) {
      return sendJson(res, 403, { error: "forbidden" });
    }
    const expense = {
      id: randomUUID(),
      description: String(body.description || "").trim().slice(0, 200),
      amount: Math.max(0, Number(String(body.amount || "0").replace(",", ".")) || 0),
      date: String(body.date || "").trim() || new Date().toISOString().split("T")[0],
      addedBy: String(currentUser.name || currentUser.email || ""),
      addedAt: new Date().toISOString(),
    };
    const travelExpenses = [...(store.orders[orderIndex].operations?.installation?.travelExpenses || []), expense];
    store.orders[orderIndex] = {
      ...store.orders[orderIndex],
      operations: normalizeOperations(
        {
          ...store.orders[orderIndex],
          operations: {
            ...store.orders[orderIndex].operations,
            installation: { ...store.orders[orderIndex].operations?.installation, travelExpenses },
          },
        },
        store.jobs.find((j) => j.sourceOrderId === store.orders[orderIndex].id) || null,
      ),
    };
    await writeJson(STORE_PATH, store);
    upsertOrderToDb(store.orders[orderIndex], currentUser.email).catch(() => {});
    return sendJson(res, 200, { expense, travelExpenses });
  }

  return sendJson(res, 404, { error: "not_found" });
}

const server = createServer(async (req, res) => {
  const rawRequestPath = String(req.url || "/").split("?")[0] || "/";
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  // Segnala a sendJson se comprimere la risposta (evita di passare req ovunque)
  res.__acceptsGzip = /gzip/i.test(req.headers["accept-encoding"] || "");

  // Redirect 301 dal dominio Render di default al dominio custom (se configurato)
  // Esclude solo /api/healthz per non rompere health-check di Render
  const canonicalHost = (process.env.PUBLIC_BASE_URL || "").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const incomingHost = String(req.headers.host || "").toLowerCase();
  if (
    canonicalHost
    && incomingHost
    && incomingHost !== canonicalHost.toLowerCase()
    && incomingHost.endsWith(".onrender.com")
    && url.pathname !== "/api/healthz"
  ) {
    const target = `https://${canonicalHost}${req.url || "/"}`;
    res.writeHead(301, { Location: target, "Cache-Control": "no-cache" });
    return res.end();
  }

  try {
    if (url.pathname.startsWith("/api/")) {
      const method = String(req.method || "GET").toUpperCase();
      const shouldLockState = !["/api/healthz", "/api/events", "/api/session/revision"].includes(url.pathname)
        && method !== "GET"
        && method !== "HEAD"
        && method !== "OPTIONS";
      if (!shouldLockState) {
        return await handleApi(req, res, url);
      }
      try {
        const isInventoryCreate = url.pathname === "/api/inventory/items" && method === "POST";
        const isCommunicationsWrite = /^\/api\/communications\//.test(url.pathname);
        // Slow external-API syncs (Google Sheets, Shopify) must not sit in the same FIFO
        // queue as local state mutations. Otherwise an external API hanging or timing out
        // blocks unrelated user writes (e.g. inventory commit) for tens of seconds. The
        // advisory lock alone keeps state writes atomic.
        const isSlowExternalSync = url.pathname === "/api/sales/request-source/sync"
          || url.pathname === "/api/orders/sync-shopify"
          || /^\/api\/orders\/[^/]+\/sync-shopify-fulfillment$/.test(url.pathname);
        return await withApiStateLock(() => handleApi(req, res, url), {
          timeoutMs: isInventoryCreate ? 12_000 : isCommunicationsWrite ? 8_000 : isSlowExternalSync ? 30_000 : API_STATE_LOCK_TIMEOUT_MS,
          queue: !isInventoryCreate && !isCommunicationsWrite && !isSlowExternalSync,
        });
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
    // Tracking pubblico cliente: /track/:token → serve la pagina tracking.html
    // (la pagina poi fetch /api/public/track/:token per popolare i dati)
    if (requestedPath.startsWith("/track/")) {
      requestedPath = "/tracking.html";
    }
    const filePath = resolve(ROOT, `.${requestedPath}`);
    const rootPrefix = ROOT.endsWith(sep) ? ROOT : `${ROOT}${sep}`;
    if (filePath !== ROOT && !filePath.startsWith(rootPrefix)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = extname(filePath);
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";
    const isHtml = ext === ".html";
    const versioned = Boolean(url.search) && !isHtml;
    const headers = getStaticHeaders(mimeType, { versioned, isHtml });
    const acceptsGzip = /gzip/i.test(req.headers["accept-encoding"] || "");
    // Prova a servire dalla cache pre-compressa (evita readFile + gzipSync runtime)
    const cacheKey = `/${requestedPath.replace(/^\//, "")}`;
    const cached = staticFileCache.get(cacheKey);
    if (cached) {
      if (acceptsGzip && cached.gzipped) {
        headers["Content-Encoding"] = "gzip";
        headers["Content-Length"] = String(cached.gzipped.length);
        res.writeHead(200, headers);
        res.end(cached.gzipped);
      } else {
        headers["Content-Length"] = String(cached.raw.length);
        res.writeHead(200, headers);
        res.end(cached.raw);
      }
      return;
    }
    // Fallback: leggi da disco (file non pre-caricato, es. immagini)
    const content = await readFile(filePath);
    const isCompressible = /^(text\/|application\/(javascript|json|xml)|image\/svg)/.test(mimeType);
    if (acceptsGzip && isCompressible) {
      const compressed = gzipSync(content);
      headers["Content-Encoding"] = "gzip";
      headers["Content-Length"] = String(compressed.length);
      res.writeHead(200, headers);
      res.end(compressed);
    } else {
      res.writeHead(200, headers);
      res.end(content);
    }
  } catch (error) {
    if (url.pathname.startsWith("/api/")) {
      const status = Number(error?.status || 0);
      if (status >= 400 && status < 600) {
        return sendJson(res, status, {
          error: String(error?.message || "request_failed"),
          maxBytes: status === 413 ? MAX_JSON_BODY_BYTES : undefined,
        });
      }
      return sendJson(res, 500, { error: "server_error", message: error.message });
    }

    try {
      const headers = getStaticHeaders("text/html; charset=utf-8", { isHtml: true });
      const acceptsGzip = /gzip/i.test(req.headers["accept-encoding"] || "");
      const cachedHtml = staticFileCache.get("/index.html");
      if (cachedHtml) {
        if (acceptsGzip && cachedHtml.gzipped) {
          headers["Content-Encoding"] = "gzip";
          headers["Content-Length"] = String(cachedHtml.gzipped.length);
          res.writeHead(200, headers);
          res.end(cachedHtml.gzipped);
        } else {
          headers["Content-Length"] = String(cachedHtml.raw.length);
          res.writeHead(200, headers);
          res.end(cachedHtml.raw);
        }
      } else {
        const content = await readFile(join(ROOT, "index.html"));
        if (acceptsGzip) {
          const compressed = gzipSync(content);
          headers["Content-Encoding"] = "gzip";
          headers["Content-Length"] = String(compressed.length);
          res.writeHead(200, headers);
          res.end(compressed);
        } else {
          res.writeHead(200, headers);
          res.end(content);
        }
      }
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
    }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Vertex Ops backend running on http://${HOST}:${PORT}`);
  // Avvia listener PG per invalidazione cache cross-istanza
  setupPgListener().catch((err) => console.error("[pg-listen] setup error:", err?.message));
  if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log("[push] VAPID initialized");
  } else {
    const keys = webPush.generateVAPIDKeys();
    console.log("[push] VAPID keys non configurate. Aggiungi alle variabili d'ambiente:");
    console.log(`  VAPID_PUBLIC_KEY=${keys.publicKey}`);
    console.log(`  VAPID_PRIVATE_KEY=${keys.privateKey}`);
  }
  // Pre-carica file statici e store in RAM all'avvio — la prima richiesta è già veloce
  preloadStaticFiles().catch((err) => console.error("[static-cache] preload failed", err));
  if (USE_POSTGRES) {
    // Crea le tabelle relazionali se non esistono (idempotente)
    ensureRelationalSchema()
      .then(async () => {
        // Backfill coverage planner: se SQL è vuoto, salva il valore dal blob
        const existing = await getCoveragePlannerFromDb().catch(() => null);
        if (!existing) {
          const rawStore = await readJson(STORE_PATH, {}).catch(() => ({}));
          if (rawStore.coveragePlanner) {
            await saveCoveragePlannerToDb(normalizeCoveragePlanner(rawStore.coveragePlanner)).catch(() => {});
            console.log("[db] backfill coverage_planner: salvato da blob a SQL");
          }
        }
        // IMAP shadow worker (Fase 1 migrazione lead). Resta dormant se
        // IMAP_SHADOW_ENABLED!=true o se credenziali mancanti.
        try {
          const pool = await getPgPool();
          if (pool) startImapWorker(pool);
        } catch (err) {
          console.warn("[imap-worker] start failed:", err?.message || err);
        }
        // Persistent outbox processor (Step 1). Lavora i job pendenti
        // ogni 30s. Handler registrati in Step 2 vicino agli use case.
        try { startOutboxProcessor(30_000); }
        catch (err) { console.warn("[outbox] start failed:", err?.message || err); }
      })
      .catch((err) => console.error("[db] relational schema init failed", err));
    readJson(STORE_PATH, {}).catch((err) => console.error("[store-cache] warm-up failed", err));
  }
});
