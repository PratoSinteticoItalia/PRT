import test from "node:test";
import assert from "node:assert/strict";
import { inventoryStockValue, kgFromLabel } from "../lib/inventory-value.js";

test("prato: metri quadri in magazzino per il costo al m² della fattura", () => {
  const result = inventoryStockValue({ measured: true, totalSqm: 120.5 }, { unitPrice: 4.2, unit: "mq" });
  assert.equal(result.value, 506.1);
  assert.equal(result.perUnit, 4.2);
  assert.equal(result.unitLabel, "mq");
});

test("prato con fattura in metri lineari senza fattore: niente valore a caso", () => {
  const result = inventoryStockValue({ measured: true, totalSqm: 100 }, { unitPrice: 9, unit: "m" });
  assert.equal(result.value, null);
  assert.equal(result.reason, "unit");
});

test("telo in metri lineari con il fattore di Impostazioni (1 mq = 0,5 m)", () => {
  const result = inventoryStockValue({ measured: true, totalSqm: 200 }, { unitPrice: 1.6, unit: "m", factor: 0.5 });
  assert.equal(result.value, 160);
  assert.equal(result.perUnit, 0.8);
});

test("materiale a pezzi: unità per il prezzo del pezzo", () => {
  const result = inventoryStockValue({ measured: false, pieces: [{ units: 3 }, { units: 2 }] }, { unitPrice: 12.5, unit: "pz" });
  assert.equal(result.value, 62.5);
  assert.equal(result.quantity, 5);
});

test("colla in kg: i chili si leggono dalla variante del secchio", () => {
  const result = inventoryStockValue(
    { measured: false, pieces: [{ units: 2, variantLabel: "Secchio 6 kg" }, { units: 1, variantLabel: "Secchio 12 kg" }] },
    { unitPrice: 5, unit: "kg" },
  );
  assert.equal(result.value, 120);
  assert.equal(result.perUnit, 40);
});

test("sacchi con fattura al metro cubo: non si contano a pezzi", () => {
  const result = inventoryStockValue({ measured: false, pieces: [{ units: 10 }] }, { unitPrice: 60, unit: "mc" });
  assert.equal(result.value, null);
});

test("senza voce fornitore resta da collegare", () => {
  assert.equal(inventoryStockValue({ measured: true, totalSqm: 10 }, null).reason, "missing");
});

test("kgFromLabel", () => {
  assert.equal(kgFromLabel("Sacco 25 kg"), 25);
  assert.equal(kgFromLabel("Secchio 6,5 kg"), 6.5);
  assert.equal(kgFromLabel("Rotolo 0,30 x 25 m"), null);
});
