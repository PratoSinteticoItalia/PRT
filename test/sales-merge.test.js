/**
 * Test del merge Sheets → richiesta vendita (lib/sales-merge.js).
 * Invariante chiave (Fase 2): un dato editato nel portale non deve essere
 * sovrascritto in silenzio dal sync del foglio.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeSheetSalesRequestRecord } from "../lib/sales-merge.js";

const NOW = "2026-06-14T10:00:00.000Z";

test("record NUOVO: prende tutto dal foglio", () => {
  const sheet = { id: "r1", phone: "3331112222", name: "Mario", status: "new", assignment: "" };
  const merged = mergeSheetSalesRequestRecord(sheet, null, { now: NOW });
  assert.equal(merged.phone, "3331112222");
  assert.equal(merged.name, "Mario");
  assert.equal(merged.status, "new");
  assert.equal(merged.createdAt, NOW);
  assert.equal(merged.updatedAt, NOW);
});

test("BUG FIX telefono: il numero corretto nel portale vince sul foglio", () => {
  const sheet = { id: "r1", phone: "0810000000" };          // numero "sporco" sul foglio
  const existing = { id: "r1", phone: "+39 333 111 2222" };  // corretto a mano nel portale
  const merged = mergeSheetSalesRequestRecord(sheet, existing, { now: NOW });
  assert.equal(merged.phone, "+39 333 111 2222"); // portale vince → non più sovrascritto
});

test("telefono: se il portale è vuoto, prende quello del foglio", () => {
  const sheet = { id: "r1", phone: "3331112222" };
  const existing = { id: "r1", phone: "" };
  const merged = mergeSheetSalesRequestRecord(sheet, existing, { now: NOW });
  assert.equal(merged.phone, "3331112222");
});

test("status/assignment del portale preservati (foglio ignorato)", () => {
  const sheet = { id: "r1", status: "new", assignment: "", phone: "x" };
  const existing = { id: "r1", status: "preventivo inviato", assignment: "Ivan", phone: "x" };
  const merged = mergeSheetSalesRequestRecord(sheet, existing, { now: NOW });
  assert.equal(merged.status, "preventivo inviato");
  assert.equal(merged.assignment, "Ivan");
});

test("primo contatto e createdAt del portale preservati", () => {
  const sheet = { id: "r1", phone: "x", createdAt: "2026-06-10T00:00:00.000Z" };
  const existing = {
    id: "r1", phone: "x",
    firstContactState: "sent", firstContactSentAt: "2026-06-12T09:00:00.000Z",
    firstContactBy: "Gabriele", createdAt: "2026-06-01T00:00:00.000Z",
  };
  const merged = mergeSheetSalesRequestRecord(sheet, existing, { now: NOW });
  assert.equal(merged.firstContactState, "sent");
  assert.equal(merged.firstContactSentAt, "2026-06-12T09:00:00.000Z");
  assert.equal(merged.firstContactBy, "Gabriele");
  assert.equal(merged.createdAt, "2026-06-01T00:00:00.000Z"); // mantiene l'originale
  assert.equal(merged.updatedAt, NOW);
});

test("altri anagrafici (nome/città) restano dal foglio (comportamento invariato)", () => {
  const sheet = { id: "r1", phone: "x", name: "Mario Rossi", city: "Napoli" };
  const existing = { id: "r1", phone: "x", name: "Mario", city: "Roma" };
  const merged = mergeSheetSalesRequestRecord(sheet, existing, { now: NOW });
  assert.equal(merged.name, "Mario Rossi");
  assert.equal(merged.city, "Napoli");
});
