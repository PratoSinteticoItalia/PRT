/**
 * Script di build: minifica app.js e styles.css con esbuild.
 * Produce app.min.js e styles.min.css nella root del progetto.
 * Il server li legge automaticamente al posto degli originali se presenti.
 *
 * Uso:
 *   node scripts/build.mjs
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
