import test from "node:test";
import assert from "node:assert/strict";
import { findFiscalIds, isOnlyFiscalId, isValidCodiceFiscale, isValidPartitaIva } from "../lib/fiscal-ids.js";

test("partita IVA: vale solo con la cifra di controllo giusta", () => {
  assert.equal(isValidPartitaIva("01234567897"), true);
  assert.equal(isValidPartitaIva("IT12345678903"), true);
  assert.equal(isValidPartitaIva("01234567890"), false);
  assert.equal(isValidPartitaIva("00000000000"), false);
  assert.equal(isValidPartitaIva("3331234567"), false);
});

test("codice fiscale: formato, omocodia e lettera di controllo", () => {
  assert.equal(isValidCodiceFiscale("RSSMRA80A01H501U"), true);
  assert.equal(isValidCodiceFiscale("rssmra80a01h501u"), true);
  assert.equal(isValidCodiceFiscale("RSSMRA80A01H501X"), false);
  assert.equal(isValidCodiceFiscale("RSSMRA80A01H5"), false);
});

test("li trova nei campi del checkout scritti a mano", () => {
  assert.deepEqual(findFiscalIds("Rossi Srl P.IVA IT01234567897"), { vatNumber: "01234567897", taxCode: "" });
  assert.deepEqual(findFiscalIds("cf rssmra80a01h501u"), { vatNumber: "", taxCode: "RSSMRA80A01H501U" });
  assert.deepEqual(findFiscalIds("Via Roma 12, scala B"), { vatNumber: "", taxCode: "" });
});

test("nelle note servono anche le parole giuste", () => {
  assert.deepEqual(findFiscalIds("consegna dopo le 15, 01234567897", { needKeyword: true }), { vatNumber: "", taxCode: "" });
  assert.deepEqual(findFiscalIds("Vorrei fattura: P.IVA 01234567897", { needKeyword: true }), { vatNumber: "01234567897", taxCode: "" });
});

test("un campo Azienda con solo il codice non è un nome di azienda", () => {
  assert.equal(isOnlyFiscalId("RSSMRA80A01H501U"), true);
  assert.equal(isOnlyFiscalId("P.IVA 01234567897"), true);
  assert.equal(isOnlyFiscalId("Rossi Srl 01234567897"), false);
  assert.equal(isOnlyFiscalId("Rossi Srl"), false);
});
