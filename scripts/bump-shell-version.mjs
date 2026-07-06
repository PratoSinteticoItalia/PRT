/**
 * Bump dello APP_SHELL_VERSION in tutti i file che lo referenziano.
 *
 * Uso:
 *   npm run bump -- <slug>
 *   es. npm run bump -- mobile-scroll-fix
 *
 * Genera la nuova versione come "YYYYMMDD-<slug>" (data odierna in TZ Europe/Rome).
 * Sostituisce TUTTE le occorrenze della versione corrente in:
 *   - app.js          (APP_SHELL_VERSION)
 *   - sw.js           (CACHE_NAME + APP_SHELL entries)
 *   - index.html      (preload, stylesheet, script app.js)
 *
 * Esegue poi `npm run check` per validare allineamento.
 *
 * Esce con codice 1 se:
 *   - manca lo slug
 *   - lo slug non è in kebab-case (a-z0-9 + trattini)
 *   - la nuova versione è uguale alla corrente
 *   - APP_SHELL_VERSION non viene trovata in app.js
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const FILES_TO_BUMP = [
  "app.js",
  "sw.js",
  "index.html",
];

function todayStampRome() {
  // Intl.DateTimeFormat con timeZone Europe/Rome, formato YYYYMMDD
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA → "2026-05-27"
  return fmt.format(new Date()).replace(/-/g, "");
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractCurrentVersion(appJsSource = "") {
  const match = String(appJsSource).match(/const APP_SHELL_VERSION = "([^"]+)"/);
  return String(match?.[1] || "").trim();
}

async function bumpFile(relPath, currentVersion, newVersion) {
  const fullPath = resolve(ROOT, relPath);
  const before = await readFile(fullPath, "utf8");
  const regex = new RegExp(escapeRegExp(currentVersion), "g");
  const matches = before.match(regex);
  const count = matches ? matches.length : 0;
  if (count === 0) {
    return { relPath, count: 0, changed: false };
  }
  const after = before.replace(regex, newVersion);
  await writeFile(fullPath, after, "utf8");
  return { relPath, count, changed: true };
}

async function main() {
  const rawSlug = process.argv[2];
  if (!rawSlug) {
    console.error("Uso: npm run bump -- <slug>");
    console.error("Esempio: npm run bump -- mobile-scroll-fix");
    process.exit(1);
  }
  const slug = String(rawSlug).trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error(`Slug non valido: "${slug}". Usa solo a-z, 0-9 e trattini (kebab-case).`);
    process.exit(1);
  }

  const appJsPath = resolve(ROOT, "app.js");
  const appJs = await readFile(appJsPath, "utf8");
  const currentVersion = extractCurrentVersion(appJs);
  if (!currentVersion) {
    console.error("APP_SHELL_VERSION non trovata in app.js");
    process.exit(1);
  }

  const newVersion = `${todayStampRome()}-${slug}`;
  if (newVersion === currentVersion) {
    console.error(`La nuova versione coincide con la corrente: ${newVersion}`);
    console.error("Cambia slug oppure aspetta un giorno.");
    process.exit(1);
  }

  console.log(`[bump] ${currentVersion}  →  ${newVersion}`);

  const results = await Promise.all(
    FILES_TO_BUMP.map((f) => bumpFile(f, currentVersion, newVersion))
  );

  let totalReplacements = 0;
  for (const r of results) {
    const flag = r.changed ? "✓" : "·";
    console.log(`  ${flag} ${r.relPath.padEnd(30)} (${r.count} occorrenze)`);
    totalReplacements += r.count;
  }

  if (totalReplacements === 0) {
    console.error("Nessuna sostituzione effettuata: versione corrente non trovata in nessun file.");
    process.exit(1);
  }

  console.log(`[bump] ${totalReplacements} sostituzioni totali. Eseguo check…`);

  const check = spawnSync("npm", ["run", "check"], { cwd: ROOT, stdio: "inherit" });
  if (check.status !== 0) {
    console.error("[bump] check fallito dopo il bump — controlla manualmente.");
    process.exit(check.status || 1);
  }

  console.log(`[bump] OK. Nuova versione attiva: ${newVersion}`);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
