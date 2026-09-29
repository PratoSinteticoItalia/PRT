import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// buildProductTechFromCatalog decide quali dati del catalogo (Impostazioni
// → Dati tecnici prodotti) finiscono nel preventivo per ogni modello. Prima
// di questo fix, restituiva null (nessun dato, foto compresa) ogni volta
// che il campo "Codice prodotto" era vuoto — un modello con SOLO la foto
// caricata spariva in silenzio dal preventivo, mentre l'anteprima in
// Impostazioni (che legge imageDataUrl direttamente) continuava a
// mostrarla, dando l'impressione che fosse salvata correttamente.
// Segnalato dall'utente il 29 set: "molti prodotti compaiono senza" foto.
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
function extractFn(name) {
  const start = source.indexOf(`function ${name}(`);
  const end = source.indexOf("\n}", start) + 2;
  return source.slice(start, end);
}
const code = extractFn("slugifyModelName") + "\n" + extractFn("buildProductTechFromCatalog");

function buildProductTechFromCatalog(preventivoCatalog) {
  return vm.runInNewContext(code + "\nbuildProductTechFromCatalog;", { state: { preventivoCatalog } });
}

test("buildProductTechFromCatalog: la foto resta anche senza codice prodotto compilato", () => {
  const fn = buildProductTechFromCatalog({
    "faggio-25mm": { imageDataUrl: "data:image/jpeg;base64,AAA" },
  });
  const result = fn("Faggio 25 mm");
  assert.notEqual(result, null, "non deve restituire null solo perché manca il codice");
  assert.equal(result.imageDataUrl, "data:image/jpeg;base64,AAA");
  assert.equal(result.code, "");
  assert.equal(result.tech, null, "niente dati tecnici inseriti → tech resta null, non un oggetto vuoto che sovrascriverebbe il fallback");
});

test("buildProductTechFromCatalog: codice, dati tecnici e foto insieme restano tutti presenti", () => {
  const fn = buildProductTechFromCatalog({
    "cedro-30mm": { code: "CED-030", struttura: "Unidirezionale", imageDataUrl: "data:image/jpeg;base64,BBB" },
  });
  const result = fn("Cedro 30 mm");
  assert.equal(result.code, "CED-030");
  assert.equal(result.imageDataUrl, "data:image/jpeg;base64,BBB");
  assert.equal(result.tech.struttura, "Unidirezionale");
});

test("buildProductTechFromCatalog: un modello mai toccato in Impostazioni resta null (usa i fallback di default)", () => {
  const fn = buildProductTechFromCatalog({});
  assert.equal(fn("Tasso 12 mm"), null);
});
