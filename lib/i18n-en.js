// Traduzione inglese dell'interfaccia (ottobre 2026).
//
// L'interfaccia nasce in italiano: molte frasi sono scritte direttamente nei
// template di app.js e in index.html. Invece di toccare centinaia di punti del
// codice, questo catalogo associa ogni frase italiana alla sua traduzione e
// app.js la sostituisce sullo schermo quando la lingua è EN (testi, segnaposto,
// title, aria-label, finestre di conferma). I dati (nomi, prodotti, note) non
// sono nel catalogo e restano come sono.
//
// Per aggiungere una frase: chiave = testo italiano esatto (spazi normalizzati,
// senza simboli iniziali come "+ " o emoji e senza ":" finale, che vengono
// gestiti in automatico), valore = traduzione. Le frasi con numeri o nomi
// variabili vanno in EN_PATTERNS; le unità ("76 mq") in EN_UNIT_RULES, valide
// ovunque; i nomi di giorni e mesi (le date escono in italiano da Intl) in
// EN_TOKEN_RULES, applicate ai risultati dei pattern e ai testi fatti solo di
// date e numeri ("lunedì 19 ottobre"). Le frasi composte con " · " o " | "
// vengono tradotte pezzo per pezzo.
//
// L'import del catalogo porta la versione dell'app (aggiornata da npm run
// bump): senza, il service worker può servire un catalogo vecchio insieme a
// questo file nuovo durante un aggiornamento e l'app non parte.

import { EN_CATALOG, EN_PATTERNS, EN_TOKEN_RULES, EN_UNIT_RULES } from "./i18n-en-catalog.js?v=20261025-sopralluoghi-telefono";

export { EN_CATALOG, EN_PATTERNS, EN_TOKEN_RULES, EN_UNIT_RULES };

const catalogMap = new Map(Object.entries(EN_CATALOG).map(([it, en]) => [normalizeKey(it), en]));
const SEGMENT_SEPARATORS = [" · ", " | "];

function normalizeKey(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

function applyRules(rules, text) {
  return rules.reduce((out, [regex, replacement]) => out.replace(regex, replacement), text);
}

// Vero se, tolte date, unità e numeri, non resta nessuna parola: così le
// regole sui giorni e sui mesi non toccano note e messaggi scritti dagli utenti.
function hasOnlyTokens(text) {
  const rest = [...EN_TOKEN_RULES, ...EN_UNIT_RULES].reduce((out, [regex]) => out.replace(regex, " "), text);
  return !/[A-Za-zÀ-ÿ]/.test(rest);
}

// {{testo}} nella sostituzione di un pattern = pezzo da tradurre a sua volta.
function translateNested(text) {
  return text.replace(/\{\{(.*?)\}\}/g, (match, inner) => translateKey(normalizeKey(inner)) ?? inner);
}

function lookup(core) {
  if (catalogMap.has(core)) return catalogMap.get(core);
  for (const [regex, replacement] of EN_PATTERNS) {
    if (regex.test(core)) {
      const replaced = translateNested(core.replace(regex, replacement));
      return applyRules(EN_UNIT_RULES, applyRules(EN_TOKEN_RULES, replaced));
    }
  }
  if (hasOnlyTokens(core)) {
    const translated = applyRules(EN_UNIT_RULES, applyRules(EN_TOKEN_RULES, core));
    return translated === core ? null : translated;
  }
  return null;
}

// Frase intera, tollerando simboli iniziali ("+ ", "← ", emoji) e
// punteggiatura finale (":", "…", "*", "↗", " →") non ripetuti nel catalogo.
function translateWhole(key) {
  if (!key) return null;
  const direct = lookup(key);
  if (direct != null) return direct;
  const match = key.match(/^([^A-Za-zÀ-ÿ0-9"«(]*)(.*?)([\s:*…↗→.!?)»"]*)$/u);
  if (!match) return null;
  const [, prefix, core, suffix] = match;
  if (!core || core === key) return null;
  const translated = lookup(core);
  return translated == null ? null : `${prefix}${translated}${suffix}`;
}

function translateKey(key) {
  const whole = translateWhole(key);
  if (whole != null) return whole;
  for (const separator of SEGMENT_SEPARATORS) {
    if (!key.includes(separator)) continue;
    const joined = key
      .split(separator)
      .map((part) => translateWhole(part.trim()) ?? applyRules(EN_UNIT_RULES, part))
      .join(separator);
    if (joined !== key) return joined;
  }
  const withUnits = applyRules(EN_UNIT_RULES, key);
  return withUnits === key ? null : withUnits;
}

// Le stesse frasi tornano a ogni render: la cache evita di rifare i confronti.
const translationCache = new Map();
const TRANSLATION_CACHE_LIMIT = 5000;

// Restituisce la traduzione o null se la frase non è nel catalogo.
export function translateItToEn(text = "") {
  const key = normalizeKey(text);
  if (!key || !/[A-Za-zÀ-ÿ]/.test(key)) return null;
  if (translationCache.has(key)) return translationCache.get(key);
  const result = translateKey(key);
  if (translationCache.size >= TRANSLATION_CACHE_LIMIT) translationCache.clear();
  translationCache.set(key, result);
  return result;
}
