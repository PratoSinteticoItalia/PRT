import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// nfMaterialsText(breakdown) costruisce il testo/lista materiali del
// preventivo nativo (preventivo-v2.html pagina 2) a partire dalla distinta
// calcolata — sia quella "a formula" (lib/preventivo-pricing.js) sia quella
// importata dal Garden Planner (buildPlannerMaterialItems in
// garden-planner-page.js), che ha una forma leggermente diversa (niente
// glueKg, qty in virgola mobile non arrotondata).
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const start = source.indexOf("function nfMaterialsText(");
const end = source.indexOf("\n}", start) + 2;
const nfMaterialsText = vm.runInNewContext(source.slice(start, end) + "\nnfMaterialsText;", {});

test("nfMaterialsText: la colla senza glueKg (import dal Garden Planner) non stampa \"undefined kg\"", () => {
  const text = nfMaterialsText({ items: [
    { key: "colla", label: "Colla bicomponente", qty: 3, unit: "secchi", unitPrice: 0, excluded: false },
  ] });
  assert.equal(text, "Colla bicomponente: 3 secchi × 0,00 €/ secchi");
  assert.doesNotMatch(text, /undefined/);
});

test("nfMaterialsText: la colla con glueKg (formula standard) mostra ancora il peso", () => {
  const text = nfMaterialsText({ items: [
    { key: "colla", label: "Colla bicomponente", qty: 1, unit: "secchi", unitPrice: 45, glueKg: 6, excluded: false },
  ] });
  assert.equal(text, "Colla bicomponente: 1 secchi (6 kg) × 45,00 €/ secchi");
});

test("nfMaterialsText: il pietrisco (quantità in virgola mobile dal planner) viene arrotondato a 2 decimali", () => {
  const text = nfMaterialsText({ items: [
    { key: "pietrisco", label: "Pietrisco", qty: 3.3075000000000006, unit: "ton", unitPrice: 0, excluded: false },
  ] });
  assert.equal(text, "Pietrisco: 3,31 × 0,00 €/ ton");
});

test("nfMaterialsText: bande/picchetti (conteggi interi) restano senza decimali superflui", () => {
  const text = nfMaterialsText({ items: [
    { key: "bande", label: "Bande di giunzione", qty: 1, unit: "pz", unitPrice: 30, excluded: false },
    { key: "picchetti", label: "Picchetti a U", qty: 91, unit: "pz", unitPrice: 0.3, excluded: false },
  ] });
  assert.equal(text, "Bande di giunzione: 1 × 30,00 €/ pz; Picchetti a U: 91 × 0,30 €/ pz");
});
