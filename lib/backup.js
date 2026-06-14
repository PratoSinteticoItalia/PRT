/**
 * lib/backup.js — Helper PURI per i backup applicativi (Fase 3 resilienza).
 *
 * Obiettivo: avere snapshot portatili e indipendenti dei dati critici, così un
 * "crollo" (corruzione logica, deploy sbagliato, cancellazione di massa) si
 * recupera in minuti invece di sperare nel backup gestito di Render.
 *
 * Qui SOLO logica pura (serializzazione snapshot, validazione, rotazione) →
 * testabile senza DB/filesystem. L'I/O (query, scrittura file) sta in server.js.
 */

export const BACKUP_SCHEMA = "psi-ops-backup";
export const BACKUP_VERSION = 1;

/**
 * Assembla uno snapshot a partire dai dati già letti dalle tabelle/store.
 * `parts` = { orders, inventory, jobs, salesRequests, settings, store }.
 */
export function buildSnapshot(parts = {}, { now } = {}) {
  const data = {
    orders: parts.orders || [],
    inventory: parts.inventory || [],
    jobs: parts.jobs || [],
    salesRequests: parts.salesRequests || [],
    settings: parts.settings || {},
    store: parts.store || null,
  };
  const counts = {
    orders: data.orders.length,
    inventory: data.inventory.length,
    jobs: data.jobs.length,
    salesRequests: data.salesRequests.length,
  };
  return {
    schema: BACKUP_SCHEMA,
    version: BACKUP_VERSION,
    createdAt: now || new Date().toISOString(),
    counts,
    data,
  };
}

/**
 * Valida uno snapshot prima di un restore: blocca file corrotti/incompleti.
 * Ritorna { ok, errors }.
 */
export function validateSnapshot(obj) {
  const errors = [];
  if (!obj || typeof obj !== "object") {
    return { ok: false, errors: ["snapshot non è un oggetto"] };
  }
  if (obj.schema !== BACKUP_SCHEMA) errors.push(`schema inatteso: ${obj.schema}`);
  if (!Number.isInteger(obj.version) || obj.version < 1) errors.push("version mancante o non valida");
  if (!obj.data || typeof obj.data !== "object") errors.push("data mancante");
  else {
    for (const key of ["orders", "inventory", "jobs", "salesRequests"]) {
      if (!Array.isArray(obj.data[key])) errors.push(`data.${key} deve essere un array`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Nome file snapshot ordinabile cronologicamente (timestamp safe per filesystem).
 * es. "snapshot-2026-06-14T10-00-00-000Z.json"
 */
export function snapshotFileName(isoTimestamp) {
  const ts = String(isoTimestamp || new Date().toISOString()).replace(/[:.]/g, "-");
  return `snapshot-${ts}.json`;
}

/** True se il nome file è uno snapshot di backup riconosciuto. */
export function isSnapshotFile(name = "") {
  return /^snapshot-.*\.json$/.test(name);
}

/**
 * Rotazione: dato l'elenco file snapshot, ritorna quelli DA ELIMINARE tenendo
 * i `keep` più recenti. I nomi includono il timestamp ISO → ordinabili come stringhe.
 */
export function selectBackupsToPrune(fileNames = [], keep = 14) {
  const snapshots = fileNames.filter(isSnapshotFile).sort(); // asc: vecchi→nuovi
  if (snapshots.length <= keep) return [];
  return snapshots.slice(0, snapshots.length - keep);
}
