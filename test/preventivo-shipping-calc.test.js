import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Il generatore preventivi (pagina 1 nativa) calcola la spedizione dallo
// stesso tariffario One Express reale già usato per il DDT
// (shipping-tariffs.js + calculateOneExpressEstimate/classifyPallet in
// app.js, mai duplicati) — richiesto dall'utente il 1 ott per non dover
// "fare i conti a parte". Qui si verifica solo la proprietà che ha causato
// un bug reale prima di pubblicare: `estimate.configured` resta `true`
// anche quando il pallet non è risolto (dimensioni vuote → classifyPallet
// ricade comunque sulla classe più piccola, perché 0 "rientra" in
// qualsiasi soglia) — il chiamante deve controllare `estimate.unsupported`,
// mai `estimate.configured` da solo, altrimenti un pallet non compilato
// restituirebbe silenziosamente un costo a vanvera su un preventivo reale.
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const tariffsSource = readFileSync(new URL("../shipping-tariffs.js", import.meta.url), "utf8");

function extractFn(name) {
  const start = appSource.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`function ${name} not found`);
  const end = appSource.indexOf("\n}", start) + 2;
  return appSource.slice(start, end);
}
function extractConstObject(declStart) {
  const start = appSource.indexOf(declStart);
  if (start === -1) throw new Error(`${declStart} not found`);
  let i = appSource.indexOf("{", start);
  let depth = 0, end = -1;
  for (; i < appSource.length; i++) {
    if (appSource[i] === "{") depth++;
    else if (appSource[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  const semi = appSource.indexOf(";", end);
  return appSource.slice(start, semi + 1);
}

const pieces = [
  "function toNumber(v){const n=Number(String(v==null?'':v).replace(',','.'));return Number.isFinite(n)?n:0;}",
  extractFn("normalizeLooseString"),
  extractFn("floorTo"),
  extractFn("getProvinceAliasMap"),
  "const PROVINCE_ALIAS_MAP = getProvinceAliasMap();",
  extractConstObject("const CITY_PROVINCE_MAP = {"),
  "const SEARCHABLE_PROVINCE_ENTRIES = Object.entries(PROVINCE_ALIAS_MAP).filter(([alias]) => alias.length > 2).sort((l, r) => r[0].length - l[0].length);",
  extractFn("normalizeProvinceCode"),
  extractFn("findProvinceCodeInNormalizedText"),
  extractFn("extractProvinceCodeFromText"),
  extractFn("getProvinceRecord"),
  extractFn("getShippingDestination"),
  extractFn("parseDimensionCm"),
  extractFn("parseWeightKg"),
  'const PALLET_CLASS_ORDER = ["P150", "P300", "P550", "PS550", "P1000"];',
  extractFn("getPalletClassThresholds"),
  extractFn("classifyPallet"),
  extractFn("getDefaultShippingPricing"),
  "const state = { settings: {} };",
  extractFn("getShippingPricing"),
  extractFn("calculateOneExpressEstimate"),
].join("\n\n");

function makeCalculator() {
  const ctx = { window: {}, console };
  vm.createContext(ctx);
  vm.runInContext(tariffsSource, ctx);
  ctx.ONE_EXPRESS_TARIFFS = ctx.window.ONE_EXPRESS_TARIFFS;
  vm.runInContext(pieces, ctx);
  return (city, ddt) => vm.runInContext(
    `calculateOneExpressEstimate(${JSON.stringify({ city })}, ${JSON.stringify(ddt)})`,
    ctx
  );
}

test("calculateOneExpressEstimate: pallet valido su un capoluogo → unsupported=false, costo reale > 0", () => {
  const calc = makeCalculator();
  const estimate = calc("Ravenna", { palletLength: 120, palletWidth: 80, palletHeight: 100, palletWeight: 200 });
  assert.equal(estimate.unsupported, false);
  assert.ok(estimate.estimatedCost > 0);
  assert.equal(estimate.provinceCode, "RA");
});

test("calculateOneExpressEstimate: pallet VUOTO su un capoluogo valido → unsupported=true (non un costo a vanvera)", () => {
  // Il bug reale: configured resta true qui (classifyPallet ricade su P150
  // comunque), quindi il chiamante NON deve fidarsi di .configured da solo.
  const calc = makeCalculator();
  const estimate = calc("Milano", {});
  assert.equal(estimate.configured, true, "documenta il comportamento sorprendente di .configured");
  assert.equal(estimate.unsupported, true, ".unsupported deve essere true: nessun pallet reale è stato inserito");
  assert.equal(estimate.missingReason, "unsupported_pallet");
});

test("calculateOneExpressEstimate: pallet oltre i limiti assoluti → unsupported=true", () => {
  const calc = makeCalculator();
  const estimate = calc("Milano", { palletLength: 120, palletWidth: 80, palletHeight: 100, palletWeight: 2000 });
  assert.equal(estimate.unsupported, true);
  assert.equal(estimate.missingReason, "unsupported_pallet");
});

test("calculateOneExpressEstimate: città non capoluogo senza sigla → unsupported=true, missing_destination", () => {
  const calc = makeCalculator();
  const estimate = calc("Faenza", { palletLength: 120, palletWidth: 80, palletHeight: 100, palletWeight: 200 });
  assert.equal(estimate.unsupported, true);
  assert.equal(estimate.missingReason, "missing_destination");
});

test("calculateOneExpressEstimate: città non capoluogo CON sigla tra parentesi → risolve e calcola", () => {
  const calc = makeCalculator();
  const estimate = calc("Faenza (RA)", { palletLength: 120, palletWidth: 80, palletHeight: 100, palletWeight: 200 });
  assert.equal(estimate.unsupported, false);
  assert.equal(estimate.provinceCode, "RA");
  assert.ok(estimate.estimatedCost > 0);
});

test("calculateOneExpressEstimate: città inventata → unsupported=true, missing_destination", () => {
  const calc = makeCalculator();
  const estimate = calc("Cittadinventatissima", { palletLength: 120, palletWidth: 80, palletHeight: 100, palletWeight: 200 });
  assert.equal(estimate.unsupported, true);
  assert.equal(estimate.missingReason, "missing_destination");
});
