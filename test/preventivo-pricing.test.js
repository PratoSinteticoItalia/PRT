/**
 * Test del motore di prezzo del preventivo (lib/preventivo-pricing.js).
 * I numeri attesi sono quelli VERIFICATI contro il generatore online in sessione.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeQuote,
  getMaterialBreakdown,
  applyIva,
  getProductPrice,
  applyProductPriceOverrides,
  PRODUCTS,
} from "../lib/preventivo-pricing.js";

const round2 = (n) => Math.round(n * 100) / 100;
const productPrice = (id) => getProductPrice(PRODUCTS.find((p) => p.id === id), "cliente");

test("applyIva: on = +22%, off = netto", () => {
  assert.equal(round2(applyIva(100, true)), 122);
  assert.equal(applyIva(100, false), 100);
});

test("materiali terra SOLO FORNITURA: niente pietrisco (60 mq → 270 €)", () => {
  const b = getMaterialBreakdown("terra", 60, "fornitura");
  assert.equal(b.items.some((i) => i.key === "pietrisco"), false);
  assert.equal(round2(b.total), 270); // telo 60 + bande 60 + colla 90 + picchetti 60
});

test("materiali terra FORNITURA+POSA: col pietrisco (60 mq → 360 €)", () => {
  const b = getMaterialBreakdown("terra", 60, "posa");
  assert.equal(b.items.some((i) => i.key === "pietrisco"), true);
  assert.equal(round2(b.total), 360); // + pietrisco 90
});

test("materiali pavimentazione: solo bande + colla", () => {
  const b = getMaterialBreakdown("pavimentazione", 60, "posa");
  assert.deepEqual(b.items.map((i) => i.key).sort(), ["bande", "colla"]);
  assert.equal(round2(b.total), 150); // bande 2*30 + colla 2*45
});

test("esclusione materiale: escludere il telo toglie 60 € dal totale (terra fornitura 60mq)", () => {
  const full = getMaterialBreakdown("terra", 60, "fornitura");
  const senzaTelo = getMaterialBreakdown("terra", 60, "fornitura", ["telo"]);
  assert.equal(round2(full.total), 270);
  assert.equal(round2(senzaTelo.total), 210); // 270 - telo 60
  // la voce resta nella distinta ma marcata excluded
  const telo = senzaTelo.items.find((i) => i.key === "telo");
  assert.equal(telo.excluded, true);
});

test("esclusione multipla: telo + picchetti (terra fornitura 60mq)", () => {
  const b = getMaterialBreakdown("terra", 60, "fornitura", ["telo", "picchetti"]);
  assert.equal(round2(b.total), 150); // 270 - 60 (telo) - 60 (picchetti)
});

test("computeQuote con esclusione materiale: il grandGross scende della voce esclusa", () => {
  const base = computeQuote({
    mq: 60, quoteType: "fornitura", surface: "terra",
    options: [{ pricePerSqm: productPrice("cedro"), discount: 0, applyIva: true }],
    materials: { include: true, discountPct: 0, applyIva: true },
  });
  const senzaTelo = computeQuote({
    mq: 60, quoteType: "fornitura", surface: "terra",
    options: [{ pricePerSqm: productPrice("cedro"), discount: 0, applyIva: true }],
    materials: { include: true, discountPct: 0, applyIva: true, exclude: ["telo"] },
  });
  // telo 60 € netto con IVA → 73,20 € in meno
  assert.equal(round2(base.options[0].grandGross - senzaTelo.options[0].grandGross), 73.2);
});

test("Cedro 60 mq, sconto 5%, materiali -15%, IVA on, solo fornitura → 1246,60 €", () => {
  const q = computeQuote({
    mq: 60,
    quoteType: "fornitura",
    surface: "terra",
    options: [{ pricePerSqm: productPrice("cedro"), discount: 5, applyIva: true }],
    materials: { include: true, discountPct: 15, applyIva: true },
    shipping: { cost: 0, applyIva: true },
  });
  assert.equal(round2(q.materials.autoTotal), 270);
  assert.equal(round2(q.options[0].grandGross), 1246.6);
});

test("Cedro 60 mq, sconto 10%, materiali -10% → 1212,19 € (come generatore online)", () => {
  const q = computeQuote({
    mq: 60,
    quoteType: "fornitura",
    surface: "terra",
    options: [{ pricePerSqm: productPrice("cedro"), discount: 10, applyIva: true }],
    materials: { include: true, discountPct: 10, applyIva: true },
  });
  assert.equal(round2(q.options[0].grandGross), 1212.19);
});

test("Faggio 60 mq, sconto 0, materiali -10% → 1094,34 € (come generatore online)", () => {
  const q = computeQuote({
    mq: 60,
    quoteType: "fornitura",
    surface: "terra",
    options: [{ pricePerSqm: productPrice("faggio"), discount: 0, applyIva: true }],
    materials: { include: true, discountPct: 10, applyIva: true },
  });
  assert.equal(round2(q.options[0].grandGross), 1094.34);
});

test("Accessorio con sconto: prezzo 10 × (1-20%) × 3 = 24 netto, 29,28 lordo", () => {
  const q = computeQuote({
    mq: 0,
    options: [{ pricePerSqm: 0, discount: 0, applyIva: true }],
    materials: { include: false },
    accessories: [{ price: 10, discount: 20, qty: 3, applyIva: true }],
  });
  assert.equal(round2(q.accessoriesNet), 24);
  assert.equal(round2(q.accessoriesGross), 29.28);
  // l'accessorio entra nel grandGross dell'opzione
  assert.equal(round2(q.options[0].grandGross), 29.28);
});

test("IVA per-componente: materiali IVA off non prende +22%", () => {
  const q = computeQuote({
    mq: 60,
    quoteType: "fornitura",
    surface: "terra",
    options: [{ pricePerSqm: productPrice("cedro"), discount: 0, applyIva: true }],
    materials: { include: true, discountPct: 0, applyIva: false },
  });
  // prato lordo + materiali NETTI (270)
  const pratoGross = round2(13.9 * 60 * 1.22);
  assert.equal(round2(q.options[0].grandGross), round2(pratoGross + 270));
});

test("Rivenditore: usa priceRivenditore", () => {
  assert.equal(getProductPrice(PRODUCTS.find((p) => p.id === "cedro"), "rivenditore"), 10.9);
  assert.equal(getProductPrice(PRODUCTS.find((p) => p.id === "cedro"), "cliente"), 13.9);
});

test("applyProductPriceOverrides: override valido sostituisce entrambi i prezzi", () => {
  const out = applyProductPriceOverrides(PRODUCTS, { "cedro-30mm": { priceCliente: 15, priceRivenditore: 12 } });
  const cedro = out.find((p) => p.id === "cedro");
  assert.equal(cedro.priceCliente, 15);
  assert.equal(cedro.priceRivenditore, 12);
  // altri prodotti invariati
  const rovere = out.find((p) => p.id === "rovere");
  assert.equal(rovere.priceCliente, PRODUCTS.find((p) => p.id === "rovere").priceCliente);
});

test("applyProductPriceOverrides: override parziale tocca solo il campo presente", () => {
  const out = applyProductPriceOverrides(PRODUCTS, { "cedro-30mm": { priceRivenditore: 12 } });
  const cedro = out.find((p) => p.id === "cedro");
  assert.equal(cedro.priceRivenditore, 12);
  assert.equal(cedro.priceCliente, PRODUCTS.find((p) => p.id === "cedro").priceCliente);
});

test("applyProductPriceOverrides: override non numerico o ≤0 viene ignorato", () => {
  const out = applyProductPriceOverrides(PRODUCTS, { "cedro-30mm": { priceCliente: "abc", priceRivenditore: -5 } });
  const cedro = out.find((p) => p.id === "cedro");
  const original = PRODUCTS.find((p) => p.id === "cedro");
  assert.equal(cedro.priceCliente, original.priceCliente);
  assert.equal(cedro.priceRivenditore, original.priceRivenditore);
});

test("applyProductPriceOverrides: nessun override → array equivalente al default", () => {
  const out = applyProductPriceOverrides(PRODUCTS, {});
  assert.deepEqual(out, PRODUCTS);
});
