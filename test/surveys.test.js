import test from "node:test";
import assert from "node:assert/strict";

import {
  canAdvanceSurveyStatus,
  describeSurveyForNotification,
  initialSurveyStatus,
  isKnownSurveyCriticality,
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

test("sopralluoghi: criticità mancante o sconosciuta ricade su 'nessuna'", () => {
  const record = normalizeSurveyRecord({ id: "s1", customerName: "Mario Rossi" });
  assert.equal(record.criticality, "nessuna");
  const record2 = normalizeSurveyRecord({ id: "s2", customerName: "Mario Rossi", criticality: "boh" });
  assert.equal(record2.criticality, "nessuna");
});

test("sopralluoghi: criticità valida viene preservata insieme alla nota", () => {
  const record = normalizeSurveyRecord({
    id: "s1", customerName: "Mario Rossi", criticality: "bloccante", criticalityNotes: "Accesso carrabile assente",
  });
  assert.equal(record.criticality, "bloccante");
  assert.equal(record.criticalityNotes, "Accesso carrabile assente");
});

test("isKnownSurveyCriticality: riconosce solo i livelli canonici", () => {
  assert.equal(isKnownSurveyCriticality("lieve"), true);
  assert.equal(isKnownSurveyCriticality("grave"), false);
  assert.equal(isKnownSurveyCriticality(""), false);
});
