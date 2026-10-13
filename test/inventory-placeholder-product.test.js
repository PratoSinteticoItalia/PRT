import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// "Da definire" è il segnaposto del server per gli ordini senza modello di
// prato: non deve diventare una scheda d'inventario con fabbisogno non coperto
// (segnalato il 13 ott 2026, ordine #3029 da 108 mq), ma l'ordine va segnalato.
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
function extractFn(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} non trovata`);
  return appSource.slice(start, appSource.indexOf("\n}", start) + 2);
}
const patternLine = appSource.match(/const INVENTORY_ALIAS_DESCRIPTOR_PATTERN = .*;/)[0];

function makeContext(orders) {
  const ctx = {
    state: { orders },
    orderNeedsWarehouseWork: () => true,
    getPreparedProductLines: () => [],
    getWarehousePreparedLines: () => [],
    getPrimaryTurfLabel: (order) => order.operations?.product || "",
    getSafeOrderSqm: (order) => Number(order.operations?.sqm || 0),
    getCatalogLabel: (value) => String(value || ""),
    inferCatalogEntry: () => null,
    shouldIgnoreDisabledNativeInventoryProduct: () => false,
    toNumber: (v) => Number(v) || 0,
    Map, Set, Number, String, Math,
  };
  vm.createContext(ctx);
  vm.runInContext([
    patternLine,
    extractFn("stripInventoryAliasDescriptors"),
    extractFn("normalizeProductName"),
    extractFn("isPlaceholderProductLabel"),
    extractFn("getOrdersMissingTurfModel"),
    extractFn("buildWarehouseDemandMap"),
  ].join("\n"), ctx);
  return ctx;
}

const order3029 = { id: "o3029", operations: { product: "Da definire", sqm: 108, warehouse: {} } };
const orderPalma = { id: "o1", operations: { product: "Palma 40 mm", sqm: 50, warehouse: {} } };

test("'Da definire' non crea un prodotto d'inventario, i prodotti veri sì", () => {
  const ctx = makeContext([order3029, orderPalma]);
  const keys = vm.runInContext("[...buildWarehouseDemandMap().keys()]", ctx);
  assert.equal(keys.includes("da definire"), false);
  assert.equal(keys.includes("palma 40 mm"), true);
});

test("l'ordine senza modello resta segnalato", () => {
  const ctx = makeContext([order3029, orderPalma]);
  const ids = vm.runInContext("getOrdersMissingTurfModel().map((o) => o.id)", ctx);
  assert.equal(JSON.stringify(ids), JSON.stringify(["o3029"]));
});

test("segnaposto riconosciuti: vuoto, Da definire, To define", () => {
  const ctx = makeContext([]);
  for (const v of ["", "Da definire", " da  definire ", "To define"]) {
    assert.equal(vm.runInContext(`isPlaceholderProductLabel(${JSON.stringify(v)})`, ctx), true, v);
  }
  assert.equal(vm.runInContext('isPlaceholderProductLabel("Betulla 30 mm")', ctx), false);
});
