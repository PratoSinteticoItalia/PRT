// Offline del portale (novembre 2026).
//
// Due cose, tutte e due sul dispositivo (IndexedDB "psi-offline"):
//   1. copia degli ultimi dati letti dal server (sessione, diario cantiere,
//      verbali, furgoni, presenze): senza rete il portale si apre lo stesso e
//      mostra l'ultima situazione, in sola lettura;
//   2. coda delle azioni fatte senza rete dalle squadre e dal magazzino
//      (passaggi di cantiere, spese, verbale, timbrature): partono da sole
//      appena torna la rete, ognuna con la sua ora vera e un codice
//      (clientRef) che evita i doppioni se l'invio si ripete.
// Ogni dato porta l'id dell'account: un altro account sullo stesso telefono
// non vede e non invia le cose del primo.
//
// Qui niente riferimenti al resto dell'app: le parti senza IndexedDB sono
// funzioni pure, provate in test/offline-store.test.js.

const DB_NAME = "psi-offline";
const DB_VERSION = 1;
const KV_STORE = "kv";
const OUTBOX_STORE = "outbox";

// Letture che vale la pena tenere per l'offline (GET).
const CACHEABLE_PREFIXES = [
  "/api/session",
  "/api/jobs/",
  "/api/work-reports",
  "/api/fleet",
  "/api/timesheet/current",
  "/api/timesheet/me",
  "/api/repairs",
];

export function isOfflineCacheablePath(path = "") {
  const value = String(path || "");
  if (!value.startsWith("/api/")) return false;
  // Il diario "live" dell'ufficio cambia ogni minuto e non serve offline.
  if (value.startsWith("/api/jobs/live")) return false;
  const pathOnly = value.split("?")[0];
  // Solo la sessione intera: "/api/session/revision" serve a capire se è
  // cambiato qualcosa, offline non ha senso rispondere con una copia.
  if (pathOnly.startsWith("/api/session/")) return false;
  const matches = CACHEABLE_PREFIXES.some((prefix) => (prefix.endsWith("/")
    ? pathOnly.startsWith(prefix)
    : pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)));
  return matches && !/[?&](export|download)=/.test(value);
}

export function offlineCacheKey(userId = "", path = "") {
  return `get:${String(userId || "")}:${String(path || "")}`;
}

// Codice dell'azione: lo sceglie il telefono, il server lo usa per non
// registrare due volte la stessa cosa.
export function newClientRef(random = Math.random, now = Date.now()) {
  const part = () => Math.floor(random() * 0x100000000).toString(36).padStart(7, "0");
  return `off-${now.toString(36)}-${part()}${part()}`;
}

// Attesa prima di riprovare un invio fallito per mancanza di rete o server
// occupato: 5 s, 15 s, 30 s, 1 min, poi ogni 5 minuti al massimo.
export function outboxBackoffMs(attempts = 0) {
  const steps = [5_000, 15_000, 30_000, 60_000, 120_000];
  const n = Math.max(0, Math.floor(Number(attempts) || 0));
  return n < steps.length ? steps[n] : 300_000;
}

// Cosa fare quando l'invio di un'azione in coda non riesce.
//   "retry": rete assente o server temporaneamente giù → si riprova dopo;
//   "auth":  sessione scaduta → si aspetta un nuovo accesso;
//   "fail":  il server ha rifiutato (dato non valido) → resta in coda come
//            «non inviata», visibile, finché qualcuno non la toglie.
export function classifyReplayError(error) {
  const status = Number(error?.status ?? 0);
  if (!status || status === 408 || status === 425 || status === 429 || status >= 500) return "retry";
  if (status === 401 || status === 403) return "auth";
  return "fail";
}

// Azioni pronte da inviare per quell'account, nell'ordine in cui sono state
// fatte. Se una è in attesa di riprovare, quelle dopo aspettano con lei: un
// «Inizio lavori» non deve arrivare prima dell'«Arrivo» rimasto indietro.
export function outboxReadyItems(items = [], userId = "", now = Date.now()) {
  const queue = (Array.isArray(items) ? items : [])
    .filter((item) => item && String(item.userId || "") === String(userId || "") && !item.failed)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || (a.id || 0) - (b.id || 0));
  const ready = [];
  for (const item of queue) {
    if (item.nextAttemptAt && item.nextAttemptAt > now) break;
    ready.push(item);
  }
  return ready;
}

export function outboxSummary(items = [], userId = "") {
  const mine = (Array.isArray(items) ? items : []).filter((item) => item && String(item.userId || "") === String(userId || ""));
  return { pending: mine.filter((item) => !item.failed).length, failed: mine.filter((item) => item.failed).length, items: mine };
}

// ── IndexedDB ────────────────────────────────────────────────────────────────

let dbPromise = null;

function hasIndexedDb() {
  try { return typeof indexedDB !== "undefined" && indexedDB !== null; } catch { return false; }
}

function openDb() {
  if (!hasIndexedDb()) return Promise.reject(new Error("indexeddb_unavailable"));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KV_STORE)) db.createObjectStore(KV_STORE);
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) db.createObjectStore(OUTBOX_STORE, { keyPath: "id", autoIncrement: true });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { try { db.close(); } catch {} dbPromise = null; };
      resolve(db);
    };
    request.onerror = () => { dbPromise = null; reject(request.error || new Error("indexeddb_open_failed")); };
    request.onblocked = () => { dbPromise = null; reject(new Error("indexeddb_blocked")); };
  });
  return dbPromise;
}

function run(storeName, mode, work) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    try {
      const request = work(store);
      if (request) request.onsuccess = () => { result = request.result; };
    } catch (error) {
      reject(error);
      return;
    }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || new Error("indexeddb_tx_failed"));
    tx.onabort = () => reject(tx.error || new Error("indexeddb_tx_aborted"));
  }));
}

export function kvGet(key) {
  return run(KV_STORE, "readonly", (store) => store.get(String(key))).catch(() => undefined);
}

export function kvSet(key, value) {
  return run(KV_STORE, "readwrite", (store) => store.put(value, String(key))).catch(() => undefined);
}

// Cancella le letture salvate di un account (uscita dall'account) o di tutti.
export function kvClear(userId = "") {
  const prefix = userId ? offlineCacheKey(userId, "") : "get:";
  return run(KV_STORE, "readwrite", (store) => {
    const range = IDBKeyRange.bound(prefix, `${prefix}￿`);
    return store.delete(range);
  }).catch(() => undefined);
}

export function outboxAdd(item = {}) {
  const record = { ...item, createdAt: item.createdAt || Date.now(), attempts: 0, nextAttemptAt: 0, failed: false, error: "" };
  return run(OUTBOX_STORE, "readwrite", (store) => store.add(record)).then((id) => ({ ...record, id }));
}

export function outboxAll() {
  return run(OUTBOX_STORE, "readonly", (store) => store.getAll()).then((rows) => rows || []).catch(() => []);
}

export function outboxPut(item) {
  return run(OUTBOX_STORE, "readwrite", (store) => store.put(item)).catch(() => undefined);
}

export function outboxDelete(id) {
  return run(OUTBOX_STORE, "readwrite", (store) => store.delete(id)).catch(() => undefined);
}
