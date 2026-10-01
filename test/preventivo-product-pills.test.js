import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// buildProductPillsFromTech deriva le pill della card prodotto (pagina 1)
// dai dati tecnici già esistenti — mai un claim inventato (niente "pet
// friendly"/"antibatterico" senza un dato reale dietro). Richiesto
// dall'utente il 1 ott dopo aver approvato la card con pill/descrizione
// nell'Artifact: "derivale dai dati tecnici esistenti" invece di un nuovo
// campo editabile in Impostazioni.
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const start = source.indexOf("function buildProductPillsFromTech(");
const end = source.indexOf("\n}", start) + 2;
const buildProductPillsFromTech = vm.runInNewContext(source.slice(start, end) + "\nbuildProductPillsFromTech;", {});

test("buildProductPillsFromTech: drenaggio presente → pill Drenante", () => {
  const pills = buildProductPillsFromTech({ drenaggio: "40 L/min/m²" }, "Faggio 25 mm");
  assert.ok(pills.includes("Drenante"));
});

test("buildProductPillsFromTech: drenaggio assente/placeholder → niente pill Drenante", () => {
  const pills = buildProductPillsFromTech({ drenaggio: "—" }, "Faggio 25 mm");
  assert.ok(!pills.includes("Drenante"));
});

test("buildProductPillsFromTech: struttura reale mostrata com'è, placeholder omesso", () => {
  assert.ok(buildProductPillsFromTech({ struttura: "Bidirezionale" }, "X 25 mm").includes("Bidirezionale"));
  assert.ok(!buildProductPillsFromTech({ struttura: "—" }, "X 25 mm").includes("—"));
});

test("buildProductPillsFromTech: altezza filo dal nome — corto/naturale alle due estremità, nessun giudizio nel mezzo", () => {
  assert.ok(buildProductPillsFromTech({}, "Tasso 12mm").includes("Filo corto"));
  assert.ok(buildProductPillsFromTech({}, "Mogano 50mm").includes("Effetto naturale"));
  const midRange = buildProductPillsFromTech({}, "Faggio 25mm");
  assert.ok(!midRange.includes("Filo corto"));
  assert.ok(!midRange.includes("Effetto naturale"));
});

test("buildProductPillsFromTech: densità alta (formato italiano con punto delle migliaia) → Alta densità solo sopra soglia", () => {
  assert.ok(buildProductPillsFromTech({ densita: "14.700 m²" }, "X 40mm").includes("Alta densità"));
  assert.ok(!buildProductPillsFromTech({ densita: "11.000 m²" }, "X 25mm").includes("Alta densità"));
});

test("buildProductPillsFromTech: massimo 3 pill anche quando i dati tecnici ne suggerirebbero di più", () => {
  const pills = buildProductPillsFromTech({ struttura: "Unidirezionale", drenaggio: "40 L/min/m²", densita: "14.700 m²" }, "Rovere 40mm");
  assert.equal(pills.length, 3, `attese 3 pill (Drenante/Unidirezionale/Effetto naturale, Alta densità scartata), trovate: ${JSON.stringify(pills)}`);
});

test("buildProductPillsFromTech: nessun dato tecnico → array vuoto, mai un crash", () => {
  // .length invece di assert.deepEqual contro []: l'array ritornato viene
  // costruito nel realm separato della vm (vm.runInNewContext), con un
  // Array.prototype distinto da quello di questo file — deepStrictEqual lo
  // confronta anche e fallisce pur con lo stesso contenuto (stesso problema
  // già visto per gli oggetti in preventivo-materials-text.test.js).
  assert.equal(buildProductPillsFromTech({}, "").length, 0);
  assert.equal(buildProductPillsFromTech(null, "X").length, 0);
});
