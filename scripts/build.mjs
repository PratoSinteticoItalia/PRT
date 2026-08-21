/**
 * Script di build: minifica app.js e styles.css con esbuild.
 * Produce app.min.js e styles.min.css nella root del progetto.
 * Il server li legge automaticamente al posto degli originali se presenti.
 *
 * Uso:
 *   node scripts/build.mjs
 *   node scripts/build.mjs --check    # verifica che i minificati esistenti siano aggiornati, senza scrivere
 *   node scripts/build.mjs --dry-run  # alias di --check
 *   npm run build
 *
 * Su Render: impostare il Build Command a "npm install && npm run build"
 * e lo Start Command a "node server.js".
 */

import { transform } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const allowedArgs = new Set(["--check", "--dry-run"]);
const args = process.argv.slice(2);
const unknownArgs = args.filter((arg) => !allowedArgs.has(arg));
if (unknownArgs.length) {
  console.error(`[build] argomenti non riconosciuti: ${unknownArgs.join(", ")}`);
  process.exit(1);
}
const checkOnly = args.includes("--check") || args.includes("--dry-run");

const targets = [
  { input: "app.js", output: "app.min.js", loader: "js" },
  { input: "styles.css", output: "styles.min.css", loader: "css" },
  { input: "garden-planner-page.js", output: "garden-planner-page.min.js", loader: "jsx" },
];

let ok = 0;
let failed = 0;

await Promise.allSettled(targets.map(async ({ input, output, loader }) => {
  const inputPath = join(ROOT, input);
  const outputPath = join(ROOT, output);
  try {
    const source = await readFile(inputPath, "utf8");
    const sizeBefore = Buffer.byteLength(source);
    const result = await transform(source, {
      minify: true,
      loader,
      // Nessun bundling — trasforma solo il file com'è
      sourcemap: false,
    });
    const sizeAfter = Buffer.byteLength(result.code);
    if (checkOnly) {
      const existing = await readFile(outputPath, "utf8").catch((err) => {
        if (err?.code === "ENOENT") return null;
        throw err;
      });
      if (existing == null) {
        console.log(`[build:check] ${output} assente — ok, il server userà ${input}`);
        ok++;
        return;
      }
      if (existing !== result.code) {
        console.error(`[build:check] ${output} non aggiornato rispetto a ${input}. Esegui npm run build.`);
        failed++;
        return;
      }
      console.log(`[build:check] ${output} aggiornato`);
      ok++;
      return;
    }
    await writeFile(outputPath, result.code, "utf8");
    const pct = (((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1);
    console.log(`[build] ${input} → ${output}  ${(sizeBefore / 1024).toFixed(0)}KB → ${(sizeAfter / 1024).toFixed(0)}KB  (-${pct}%)`);
    ok++;
  } catch (err) {
    console.error(`[build] ERRORE su ${input}: ${err.message}`);
    failed++;
  }
}));

console.log(`[build] completato: ${ok} ok, ${failed} errori`);
if (failed > 0) process.exit(1);
