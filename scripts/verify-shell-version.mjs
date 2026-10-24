import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readText(path) {
  return readFile(path, "utf8");
}

function extractShellVersion(appJsSource = "") {
  const match = String(appJsSource).match(/const APP_SHELL_VERSION = "([^"]+)"/);
  return String(match?.[1] || "").trim();
}

function assertMatches(source, regex, message, errors) {
  if (!regex.test(source)) errors.push(message);
}

// sw.js serve i moduli non-shell in cache-first: un import relativo senza
// ?v= può arrivare dalla versione precedente mentre chi lo importa è nuovo →
// export mancante → l'app non parte (successo il 21 ott 2026). Segue gli import
// da app.js: ognuno deve portare la versione corrente ed essere nel precache.
const IMPORT_RE = /(?:import|export)\s[^"';]*?from\s*["'](\.[^"']+)["']|import\(\s*["'](\.[^"']+)["']\s*\)/g;

async function checkClientModuleGraph(shellVersion, swJs, errors) {
  const seen = new Set();
  const walk = async (relPath) => {
    if (seen.has(relPath)) return;
    seen.add(relPath);
    const source = await readText(resolve(ROOT, relPath));
    for (const match of source.matchAll(IMPORT_RE)) {
      const spec = match[1] || match[2];
      const [pathPart, query = ""] = spec.split("?");
      const target = resolve(ROOT, dirname(relPath), pathPart).slice(ROOT.length + 1);
      if (new URLSearchParams(query).get("v") !== shellVersion) {
        errors.push(`${relPath}: import "${spec}" senza ?v=${shellVersion} (aggiungi la versione e metti ${relPath} in FILES_TO_BUMP)`);
      }
      if (!swJs.includes(`"/${target}?v=${shellVersion}"`)) {
        errors.push(`sw.js: manca "/${target}?v=${shellVersion}" nel precache APP_SHELL`);
      }
      await walk(target);
    }
  };
  await walk("app.js");
  return seen.size;
}

async function main() {
  const appJsPath = resolve(ROOT, "app.js");
  const indexPath = resolve(ROOT, "index.html");
  const swPath = resolve(ROOT, "sw.js");
  const gardenPlannerPath = resolve(ROOT, "garden-planner.html");
  const gardenPlannerPagePath = resolve(ROOT, "garden-planner-page.js");

  const [appJs, indexHtml, swJs, gardenPlannerHtml, gardenPlannerPageJs] = await Promise.all([
    readText(appJsPath),
    readText(indexPath),
    readText(swPath),
    readText(gardenPlannerPath),
    readText(gardenPlannerPagePath),
  ]);

  const shellVersion = extractShellVersion(appJs);
  if (!shellVersion) {
    throw new Error("APP_SHELL_VERSION not found in app.js");
  }

  const escapedVersion = escapeRegExp(shellVersion);
  const errors = [];

  // --- index.html ---
  assertMatches(
    indexHtml,
    new RegExp(`styles\\.css\\?v=${escapedVersion}`),
    "index.html missing styles.css shell version",
    errors,
  );
  assertMatches(
    indexHtml,
    new RegExp(`app\\.js\\?v=${escapedVersion}`),
    "index.html missing app.js shell version",
    errors,
  );

  // --- sw.js ---
  assertMatches(
    swJs,
    new RegExp(`CACHE_NAME\\s*=\\s*"psi-ops-shell-${escapedVersion}"`),
    "sw.js CACHE_NAME does not match APP_SHELL_VERSION",
    errors,
  );
  assertMatches(
    swJs,
    new RegExp(`/\\?shell=${escapedVersion}`),
    "sw.js missing /?shell=<APP_SHELL_VERSION> entry",
    errors,
  );
  assertMatches(
    swJs,
    new RegExp(`/styles\\.css\\?v=${escapedVersion}`),
    "sw.js missing versioned styles.css entry",
    errors,
  );
  assertMatches(
    swJs,
    new RegExp(`/app\\.js\\?v=${escapedVersion}`),
    "sw.js missing versioned app.js entry",
    errors,
  );
  assertMatches(
    swJs,
    new RegExp(`/vendor/signature_pad\\.umd\\.min\\.js\\?v=${escapedVersion}`),
    "sw.js missing versioned vendor/signature_pad.umd.min.js entry",
    errors,
  );
  assertMatches(
    swJs,
    new RegExp(`/garden-planner\\.html\\?v=${escapedVersion}&shell=${escapedVersion}`),
    "sw.js missing versioned garden-planner.html entry",
    errors,
  );
  assertMatches(
    swJs,
    new RegExp(`/garden-planner-page\\.js\\?v=${escapedVersion}`),
    "sw.js missing versioned garden-planner-page.js entry",
    errors,
  );

  // --- index.html: vendor signature_pad ---
  assertMatches(
    indexHtml,
    new RegExp(`vendor/signature_pad\\.umd\\.min\\.js\\?v=${escapedVersion}`),
    "index.html missing signature_pad shell version",
    errors,
  );

  // --- garden-planner.html / garden-planner-page.js ---
  assertMatches(
    gardenPlannerHtml,
    new RegExp(`garden-planner-page\\.js\\?v=${escapedVersion}`),
    "garden-planner.html missing garden-planner-page.js shell version",
    errors,
  );
  assertMatches(
    gardenPlannerHtml,
    new RegExp(`sw\\.js\\?v=${escapedVersion}`),
    "garden-planner.html missing sw.js shell version",
    errors,
  );
  assertMatches(
    gardenPlannerPageJs,
    new RegExp(`const APP_SHELL_VERSION = "${escapedVersion}"`),
    "garden-planner-page.js APP_SHELL_VERSION does not match app.js",
    errors,
  );
  assertMatches(
    appJs,
    /garden-planner\.html\?v=\$\{APP_SHELL_VERSION\}&shell=\$\{APP_SHELL_VERSION\}/,
    "app.js garden planner iframe URL is not shell-versioned",
    errors,
  );

  await checkClientModuleGraph(shellVersion, swJs, errors);

  if (errors.length) {
    console.error(`Shell version checks failed for: ${shellVersion}`);
    errors.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
  }

  console.log(`Shell version checks passed: ${shellVersion}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
