import test from "node:test";
import assert from "node:assert/strict";

import { looksMojibake, repairMojibakeFields, repairMojibakeText } from "../lib/mojibake.js";

// cp1252 byte → codepoint per 0x80-0x9F (dove diverge da Latin-1); fuori da
// questo range Windows-1252 coincide con Latin-1. Tabella indipendente da
// quella del modulo, per non testare l'implementazione contro se stessa.
const CP1252_0x80_0x9F = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
};

/** Simula la corruzione reale: codifica in UTF-8, poi ridecodifica quei byte come Windows-1252. */
function corrupt(clean) {
  const bytes = Buffer.from(clean, "utf8");
  let out = "";
  for (const byte of bytes) {
    out += String.fromCodePoint(CP1252_0x80_0x9F[byte] ?? byte);
  }
  return out;
}

test("mojibake: ripara l'apostrofo tipografico corrotto (bug segnalato in produzione)", () => {
  const clean = "Ospedaletto d’Alpinolo";
  const corrupted = corrupt(clean);
  assert.equal(corrupted, "Ospedaletto dâ€™Alpinolo");
  assert.equal(repairMojibakeText(corrupted), clean);
});

test("mojibake: ripara le lettere accentate italiane corrotte a 2 byte", () => {
  assert.equal(repairMojibakeText(corrupt("città")), "città");
  assert.equal(repairMojibakeText(corrupt("perché")), "perché");
  assert.equal(repairMojibakeText(corrupt("è già pronto")), "è già pronto");
});

test("mojibake: testo pulito con accenti italiani normali resta invariato", () => {
  const clean = "Città di Ospedaletto d'Alpinolo, è già pronto, perché no";
  assert.equal(repairMojibakeText(clean), clean);
  assert.equal(looksMojibake(clean), false);
});

test("mojibake: un euro o un trattino isolati in testo pulito non vengono toccati", () => {
  assert.equal(repairMojibakeText("Budget: 500€"), "Budget: 500€");
  assert.equal(repairMojibakeText("orario 9—17"), "orario 9—17");
  assert.equal(looksMojibake("Budget: 500€"), false);
});

test("mojibake: stringa vuota o non stringa non genera errori", () => {
  assert.equal(repairMojibakeText(""), "");
  assert.equal(repairMojibakeText(null), "");
  assert.equal(repairMojibakeText(undefined), "");
});

test("mojibake: looksMojibake distingue corrotto da pulito", () => {
  assert.equal(looksMojibake(corrupt("d’Alpinolo")), true);
  assert.equal(looksMojibake("d'Alpinolo"), false);
});

test("repairMojibakeFields: ripara solo le chiavi indicate, senza mutare l'originale", () => {
  const bad = corrupt("città");
  const input = { city: bad, note: bad, untouched: bad };
  const out = repairMojibakeFields(input, ["city", "note"]);
  assert.equal(out.city, "città");
  assert.equal(out.note, "città");
  assert.equal(out.untouched, bad, "chiave non elencata non va toccata");
  assert.equal(input.city, bad, "l'oggetto originale non va mutato");
});

test("repairMojibakeFields: senza whitelist ripara tutte le proprietà stringa", () => {
  const out = repairMojibakeFields({ a: corrupt("città"), b: 42, c: null });
  assert.equal(out.a, "città");
  assert.equal(out.b, 42);
  assert.equal(out.c, null);
});
