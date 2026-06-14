#!/usr/bin/env node
/**
 * restore-snapshot.mjs — Ripristino dello store da uno snapshot di backup.
 *
 * Lo snapshot è quello prodotto da GET /api/admin/backup (vedi lib/backup.js).
 *
 * USO:
 *   node scripts/restore-snapshot.mjs <snapshot.json>            # dry-run: valida + mostra conteggi
 *   node scripts/restore-snapshot.mjs <snapshot.json> --confirm  # esegue il ripristino dello store
 *
 * Comportamento con --confirm:
 *   1) valida lo snapshot (blocca file corrotti);
 *   2) salva una copia di sicurezza dello store attuale (store.json.pre-restore-<ts>);
 *   3) scrive snapshot.data.store su STORE_PATH (DATA_DIR o ./data).
 *
 * NOTA DB: questo ripristina il BLOB store (config + dati). Il database
 * relazionale si ripopola dal blob all'avvio se vuoto; per un ripristino DB
 * completo a tabelle non vuote usare Render PITR / backup gestito (vedi DEPLOY.md).
 */
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSnapshot } from "../lib/backup.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = resolve(process.env.DATA_DIR || join(ROOT, "data"));
const STORE_PATH = join(DATA_DIR, "store.json");

const [, , filePath, ...flags] = process.argv;
const confirm = flags.includes("--confirm");

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

if (!filePath) fail("Specifica il file snapshot. Uso: node scripts/restore-snapshot.mjs <file.json> [--confirm]");

const raw = await readFile(resolve(filePath), "utf8").catch((e) => fail(`Impossibile leggere ${filePath}: ${e.message}`));
let snapshot;
try {
  snapshot = JSON.parse(raw);
} catch (e) {
  fail(`JSON non valido: ${e.message}`);
}

const { ok, errors } = validateSnapshot(snapshot);
if (!ok) fail(`Snapshot non valido:\n  - ${errors.join("\n  - ")}`);

console.log("✔ Snapshot valido");
console.log(`  creato: ${snapshot.createdAt}`);
console.log(`  conteggi: ${JSON.stringify(snapshot.counts)}`);
console.log(`  store presente: ${snapshot.data.store ? "sì" : "no"}`);

if (!snapshot.data.store) fail("Lo snapshot non contiene il blob 'store' → niente da ripristinare.");

if (!confirm) {
  console.log("\nDRY-RUN: nessuna modifica. Ri-esegui con --confirm per ripristinare lo store su:");
  console.log(`  ${STORE_PATH}`);
  process.exit(0);
}

// Copia di sicurezza dello store attuale prima di sovrascrivere.
const backupName = `${STORE_PATH}.pre-restore-${new Date().toISOString().replace(/[:.]/g, "-")}`;
try {
  await copyFile(STORE_PATH, backupName);
  console.log(`\n✔ Backup dello store attuale salvato in:\n  ${backupName}`);
} catch (e) {
  console.log(`\n(nessuno store esistente da salvare: ${e.code || e.message})`);
}

await writeFile(STORE_PATH, JSON.stringify(snapshot.data.store), "utf8");
console.log(`✔ Store ripristinato in:\n  ${STORE_PATH}`);
console.log("\nRiavvia il server per applicare. Se il DB è vuoto verrà ripopolato dal blob.");
