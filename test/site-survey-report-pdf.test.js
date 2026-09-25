import test from "node:test";
import assert from "node:assert/strict";

import { generateSiteSurveyReportPdf } from "../lib/site-survey-report-pdf.js";

const baseSurvey = {
  id: "SL-2026-0001",
  status: "completato",
  customerName: "Mario Rossi",
  phone: "+39 333 1234567",
  email: "mario.rossi@example.com",
  address: "Via Roma 1",
  city: "Napoli",
  province: "NA",
  crewName: "Alpha",
  measuredSqm: 62,
  groundCondition: "Terra, leggera pendenza",
  feasible: true,
  criticalities: ["Presenza di una radice da rimuovere lato recinzione."],
  turfPreferences: ["cedro", "faggio"],
  crewNotes: "Accesso da retro, cancello sul lato sinistro.",
  photos: [{ id: "p1" }, { id: "p2" }],
};

test("generateSiteSurveyReportPdf: produce un PDF valido con dati completi", async () => {
  const buffer = await generateSiteSurveyReportPdf(baseSurvey);
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 100);
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateSiteSurveyReportPdf: non esplode con un sopralluogo minimale senza esito", async () => {
  const survey = { id: "SL-2026-0002", customerName: "Luigi Bianchi" };
  const buffer = await generateSiteSurveyReportPdf(survey);
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateSiteSurveyReportPdf: più criticità ed elenco vuoto non fanno esplodere il rendering", async () => {
  const withMany = { ...baseSurvey, criticalities: ["Nessun accesso carrabile.", "Presenza di un pozzetto scoperto.", "Cancello troppo stretto per il mezzo."] };
  const buffer = await generateSiteSurveyReportPdf(withMany);
  assert.ok(Buffer.isBuffer(buffer));
  assert.equal(buffer.subarray(0, 5).toString("latin1"), "%PDF-");

  const withNone = { ...baseSurvey, criticalities: [] };
  const buffer2 = await generateSiteSurveyReportPdf(withNone);
  assert.ok(Buffer.isBuffer(buffer2));
  assert.equal(buffer2.subarray(0, 5).toString("latin1"), "%PDF-");
});

test("generateSiteSurveyReportPdf: throws se manca il sopralluogo", async () => {
  await assert.rejects(() => generateSiteSurveyReportPdf(null), /missing survey/);
});
