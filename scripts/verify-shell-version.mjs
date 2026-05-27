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

async function main() {
  const appJsPath = resolve(ROOT, "app.js");
  const indexPath = resolve(ROOT, "index.html");
  const swPath = resolve(ROOT, "sw.js");
  const generatorHtmlPath = resolve(ROOT, "sales-suite/generator.html");

  const [appJs, indexHtml, swJs, generatorHtml] = await Promise.all([
    readText(appJsPath),
    readText(indexPath),
    readText(swPath),
    readText(generatorHtmlPath),
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
    new RegExp(`/sales-suite/generator-bridge\\.js\\?v=${escapedVersion}`),
    "sw.js missing versioned sales-suite/generator-bridge.js entry",
    errors,
  );
  assertMatches(
    swJs,
    new RegExp(`/sales-suite/generator\\.html\\?embedded=1&v=${escapedVersion}&shell=${escapedVersion}`),
    "sw.js missing versioned sales-suite/generator.html entry",
    errors,
  );

  // --- sales-suite/generator.html ---
  // Il bridge è codice "nostro" (non Vite) e deve seguire APP_SHELL_VERSION.
  // Gli asset Vite (./assets/index-*.js|css) hanno hash nel nome → versioning indipendente, non controllato qui.
  assertMatches(
    generatorHtml,
    new RegExp(`generator-bridge\\.js\\?v=${escapedVersion}`),
    "sales-suite/generator.html missing generator-bridge.js shell version",
    errors,
  );

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
