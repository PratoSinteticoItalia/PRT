/**
 * Test della derivazione regione dalla città (lib/geo.js).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { regionForCity, normalizeCityKey } from "../lib/geo.js";

test("normalizeCityKey: minuscole, no accenti/apostrofi/parentesi", () => {
  assert.equal(normalizeCityKey("Forlì"), "forli");
  assert.equal(normalizeCityKey("Sant'Angelo"), "sant angelo");
  assert.equal(normalizeCityKey("Roma (RM)"), "roma");
  assert.equal(normalizeCityKey("  Reggio   Emilia "), "reggio emilia");
});

test("regionForCity: città comuni risolte correttamente", () => {
  assert.equal(regionForCity("Forio"), "Campania");
  assert.equal(regionForCity("Cerveteri"), "Lazio");
  assert.equal(regionForCity("Cisano Bergamasco"), "Lombardia");
  assert.equal(regionForCity("San Giorgio a Cremano"), "Campania");
  assert.equal(regionForCity("Milano"), "Lombardia");
  assert.equal(regionForCity("Palermo"), "Sicilia");
});

test("regionForCity: gestisce parentesi, virgola e sigla provincia", () => {
  assert.equal(regionForCity("Roma (RM)"), "Lazio");
  assert.equal(regionForCity("Napoli, NA"), "Campania");
  assert.equal(regionForCity("Torino TO"), "Piemonte");
});

test("regionForCity: vuoto o sconosciuto → stringa vuota", () => {
  assert.equal(regionForCity(""), "");
  assert.equal(regionForCity(null), "");
  assert.equal(regionForCity("zzzqwerty non esiste"), "");
});
