import test from "node:test";
import assert from "node:assert/strict";

import {
  canAdvanceSurveyStatus,
  describeSurveyForNotification,
  initialSurveyStatus,
  isKnownSurveyStatus,
  normalizeSurveyRecord,
} from "../lib/surveys.js";

test("sopralluoghi: un record senza id o nome cliente non è recuperabile", () => {
  assert.equal(normalizeSurveyRecord({ id: "s1" }), null);
  assert.equal(normalizeSurveyRecord({ customerName: "Mario Rossi" }), null);
  assert.equal(normalizeSurveyRecord({}), null);
});

test("sopralluoghi: stato mancante o sconosciuto ricade su da-assegnare", () => {
  const record = normalizeSurveyRecord({ id: "s1", customerName: "Mario Rossi", status: "boh" });
  assert.equal(record.status, "da-assegnare");
  const record2 = normalizeSurveyRecord({ id: "s2", customerName: "Mario Rossi" });
  assert.equal(record2.status, "da-assegnare");
});

test("sopralluoghi: stato valido viene preservato", () => {
  const record = normalizeSurveyRecord({ id: "s1", customerName: "Mario Rossi", status: "completato" });
  assert.equal(record.status, "completato");
});

test("sopralluoghi: campi opzionali assenti diventano stringhe vuote o null, non undefined/crash", () => {
  const record = normalizeSurveyRecord({ id: "s1", customerName: "Mario Rossi" });
  assert.equal(record.phone, "");
  assert.equal(record.measuredSqm, null);
  assert.equal(record.feasible, null);
  assert.deepEqual(record.photos, []);
  assert.equal(record.assignedAt, null);
});

test("initialSurveyStatus: assegnato se c'è già una squadra, da-assegnare altrimenti", () => {
  assert.equal(initialSurveyStatus("Alpha"), "assegnato");
  assert.equal(initialSurveyStatus(""), "da-assegnare");
  assert.equal(initialSurveyStatus("   "), "da-assegnare");
});

test("canAdvanceSurveyStatus: avanza solo in avanti nella rank", () => {
  assert.equal(canAdvanceSurveyStatus("assegnato", "completato"), true);
  assert.equal(canAdvanceSurveyStatus("assegnato", "in-corso"), true);
  assert.equal(canAdvanceSurveyStatus("completato", "assegnato"), false, "non deve regredire");
  assert.equal(canAdvanceSurveyStatus("assegnato", "assegnato"), false, "stesso stato non è un avanzamento");
  assert.equal(canAdvanceSurveyStatus("", "assegnato"), true, "da vuoto (rank 0 implicita) può avanzare");
});

test("canAdvanceSurveyStatus: 'annullato' è riservato all'ufficio, mai raggiungibile dalla squadra", () => {
  assert.equal(canAdvanceSurveyStatus("assegnato", "annullato"), false);
  assert.equal(canAdvanceSurveyStatus("da-assegnare", "annullato"), false);
});

test("canAdvanceSurveyStatus: un sopralluogo annullato non può ripartire", () => {
  assert.equal(canAdvanceSurveyStatus("annullato", "assegnato"), false);
  assert.equal(canAdvanceSurveyStatus("annullato", "completato"), false);
});

test("canAdvanceSurveyStatus: 'concordato' è un avanzamento normale, ma facoltativo (si può saltare)", () => {
  assert.equal(canAdvanceSurveyStatus("assegnato", "concordato"), true);
  assert.equal(canAdvanceSurveyStatus("assegnato", "in-corso"), true, "saltare concordato resta valido");
  assert.equal(canAdvanceSurveyStatus("concordato", "in-corso"), true);
  assert.equal(canAdvanceSurveyStatus("in-corso", "concordato"), false, "non deve regredire");
});

test("canAdvanceSurveyStatus: 'spostato' è impostabile dalla squadra solo prima di iniziare", () => {
  assert.equal(canAdvanceSurveyStatus("da-assegnare", "spostato"), true);
  assert.equal(canAdvanceSurveyStatus("assegnato", "spostato"), true);
  assert.equal(canAdvanceSurveyStatus("concordato", "spostato"), true);
  assert.equal(canAdvanceSurveyStatus("in-corso", "spostato"), false);
  assert.equal(canAdvanceSurveyStatus("completato", "spostato"), false);
  assert.equal(canAdvanceSurveyStatus("spostato", "spostato"), false);
});

test("canAdvanceSurveyStatus: da 'spostato' la squadra non può ripartire da sola (serve l'ufficio)", () => {
  assert.equal(canAdvanceSurveyStatus("spostato", "assegnato"), false);
  assert.equal(canAdvanceSurveyStatus("spostato", "concordato"), false);
  assert.equal(canAdvanceSurveyStatus("spostato", "in-corso"), false);
});

test("canAdvanceSurveyStatus: target sconosciuto viene rifiutato", () => {
  assert.equal(canAdvanceSurveyStatus("assegnato", "boh"), false);
});

test("isKnownSurveyStatus: riconosce solo gli stati canonici", () => {
  assert.equal(isKnownSurveyStatus("completato"), true);
  assert.equal(isKnownSurveyStatus("boh"), false);
  assert.equal(isKnownSurveyStatus(""), false);
});

test("describeSurveyForNotification: nome + città, fallback su 'Cliente' se manca il nome", () => {
  assert.equal(describeSurveyForNotification({ customerName: "Mario Rossi", city: "Marcianise" }), "Mario Rossi · Marcianise");
  assert.equal(describeSurveyForNotification({ customerName: "Mario Rossi" }), "Mario Rossi");
  assert.equal(describeSurveyForNotification({}), "Cliente");
});

test("sopralluoghi: criticità assente diventa un elenco vuoto, non crash", () => {
  const record = normalizeSurveyRecord({ id: "s1", customerName: "Mario Rossi" });
  assert.deepEqual(record.criticalities, []);
});

test("sopralluoghi: elenco criticità viene preservato, ripulito e troncato", () => {
  const record = normalizeSurveyRecord({
    id: "s1", customerName: "Mario Rossi",
    criticalities: ["Accesso carrabile assente", "  Terreno in forte pendenza  ", "", "   "],
  });
  assert.deepEqual(record.criticalities, ["Accesso carrabile assente", "Terreno in forte pendenza"]);
});

test("sopralluoghi: criticalities non-array o con valori non stringa non crasha", () => {
  assert.deepEqual(normalizeSurveyRecord({ id: "s1", customerName: "Mario Rossi", criticalities: "boh" }).criticalities, []);
  assert.deepEqual(normalizeSurveyRecord({ id: "s1", customerName: "Mario Rossi", criticalities: [1, null, "ok"] }).criticalities, ["1", "ok"]);
});

test("sopralluoghi: preferenza prato assente diventa un elenco vuoto, valido fino a 3", () => {
  const empty = normalizeSurveyRecord({ id: "s1", customerName: "Mario Rossi" });
  assert.deepEqual(empty.turfPreferences, []);
  const record = normalizeSurveyRecord({ id: "s1", customerName: "Mario Rossi", turfPreferences: ["cedro", "faggio", "mogano", "abete"] });
  assert.deepEqual(record.turfPreferences, ["cedro", "faggio", "mogano"], "troncato a 3");
});
