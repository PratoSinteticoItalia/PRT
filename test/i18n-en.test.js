import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { translateItToEn, EN_CATALOG, EN_PATTERNS } from "../lib/i18n-en.js";

test("i18n: frasi del catalogo, anche con simboli e punteggiatura intorno", () => {
  assert.equal(translateItToEn("Mancata timbratura"), "Missed clock-in");
  assert.equal(translateItToEn("  Salva:  "), "Save:");
  assert.equal(translateItToEn("+ Nuovo ordine"), "+ New order");
  assert.equal(translateItToEn("🎤 Nota vocale"), "🎤 Voice note");
});

test("i18n: frasi con numeri e nomi variabili", () => {
  assert.equal(translateItToEn("29 eventi negli ultimi 30 giorni."), "29 events in the last 30 days.");
  assert.equal(translateItToEn("1 assenze registrate · 3 giorni consecutivi"), "1 absence recorded · 3 consecutive days");
  assert.equal(translateItToEn("Notifiche, 4 non lette"), "Notifications, 4 unread");
  assert.equal(translateItToEn("Unità: pz | Flacone pronto uso"), "Unit: pcs | Ready-to-use bottle");
  assert.equal(
    translateItToEn("Usa almeno 12 caratteri, con maiuscole, minuscole e numeri. Password account allineata. Recupero bootstrap non attivo."),
    "Use at least 12 characters, with upper case, lower case and numbers. Account password aligned. Bootstrap recovery not active.",
  );
});

test("i18n: unità e date tradotte, note e nomi degli utenti lasciati come sono", () => {
  assert.equal(translateItToEn("Rovere 40 mm · 76 mq · Fornitura + posa"), "Rovere 40 mm · 76 sqm · Supply + install");
  assert.equal(translateItToEn("lunedì 19 ottobre 2026"), "Monday 19 October 2026");
  assert.equal(translateItToEn("6 apr – 12 apr 2026 · 1 posa"), "6 Apr – 12 Apr 2026 · 1 installation");
  assert.equal(translateItToEn("Consegna sabato mattina"), null);
  assert.equal(translateItToEn("Mario Rossi"), null);
  assert.equal(translateItToEn("19/10/2026"), null);
});

test("i18n: i messaggi WhatsApp per i clienti restano in italiano", () => {
  assert.equal(translateItToEn("Ciao Mario, grazie per aver scelto Prato Sintetico Italia."), null);
  assert.equal(translateItToEn("Ciao Mario, buongiorno. Sono Luca di Prato Sintetico Italia."), null);
});

test("i18n: catalogo e pattern ben formati", () => {
  for (const [it, en] of Object.entries(EN_CATALOG)) {
    assert.ok(it.trim() && typeof en === "string" && en.trim(), `voce vuota: ${it}`);
  }
  for (const [regex, replacement] of EN_PATTERNS) {
    assert.ok(regex instanceof RegExp && !regex.global, `pattern non valido: ${regex}`);
    assert.ok(["string", "function"].includes(typeof replacement));
  }
});

test("i18n: il catalogo è importato con la versione dell'app (niente catalogo vecchio dalla cache)", () => {
  const appVersion = readFileSync(new URL("../app.js", import.meta.url), "utf8").match(/const APP_SHELL_VERSION = "([^"]+)"/)[1];
  const i18nSource = readFileSync(new URL("../lib/i18n-en.js", import.meta.url), "utf8");
  assert.ok(i18nSource.includes(`./i18n-en-catalog.js?v=${appVersion}"`));
});

test("i18n: le tendine del Garden Planner hanno valori interni, non il testo tradotto", () => {
  const source = readFileSync(new URL("../garden-planner-page.js", import.meta.url), "utf8");
  const optionsWithoutValue = source.match(/<option(?![^>]*\bvalue=)[^>]*>/g) || [];
  assert.deepEqual(optionsWithoutValue, []);
  assert.match(source, /<div id=\{id\} data-no-i18n=""/);
});
