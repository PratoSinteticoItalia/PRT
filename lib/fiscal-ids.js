// Partita IVA e codice fiscale scritti a mano dal cliente (ottobre 2026).
// Il checkout Shopify non ha campi dedicati: chi vuole la fattura li scrive in
// "Azienda", in "Interno, scala" o nelle note. Qui si riconoscono dal formato,
// controllando anche la cifra/lettera di controllo, così un numero qualsiasi
// (un civico, un telefono) non diventa una partita IVA per caso.

const CF_ODD = {
  0: 1, 1: 0, 2: 5, 3: 7, 4: 9, 5: 13, 6: 15, 7: 17, 8: 19, 9: 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21, K: 2, L: 4, M: 18,
  N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14, U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};
// Omocodia: le cifre del codice fiscale possono diventare lettere.
const CF_DIGIT = "[0-9LMNPQRSTUV]";
const CF_RE = new RegExp(`\\b([A-Z]{6}${CF_DIGIT}{2}[ABCDEHLMPRST]${CF_DIGIT}{2}[A-Z]${CF_DIGIT}{3}[A-Z])\\b`, "gi");
const VAT_RE = /\b(?:IT\s?)?(\d{11})\b/gi;
const KEYWORD_RE = /p\.?\s?iva|partita\s+iva|\bvat\b|\bc\.?\s?f\b|codice\s+fiscale|fattur/i;

export function isValidPartitaIva(value = "") {
  const digits = String(value).replace(/^IT/i, "");
  if (!/^\d{11}$/.test(digits) || /^0+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    const n = Number(digits[i]);
    if (i % 2 === 0) sum += n;
    else sum += n * 2 > 9 ? n * 2 - 9 : n * 2;
  }
  return (10 - (sum % 10)) % 10 === Number(digits[10]);
}

export function isValidCodiceFiscale(value = "") {
  const code = String(value).toUpperCase();
  if (!new RegExp(`^[A-Z]{6}${CF_DIGIT}{2}[ABCDEHLMPRST]${CF_DIGIT}{2}[A-Z]${CF_DIGIT}{3}[A-Z]$`).test(code)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i += 1) {
    const ch = code[i];
    // Posizioni dispari (1ª, 3ª…) con la tabella, pari col valore semplice.
    if (i % 2 === 0) sum += CF_ODD[ch];
    else sum += /\d/.test(ch) ? Number(ch) : ch.charCodeAt(0) - 65;
  }
  return String.fromCharCode(65 + (sum % 26)) === code[15];
}

/**
 * Trova partita IVA e codice fiscale validi in un testo libero.
 * needKeyword: nelle note serve anche una parola come "P.IVA", "codice
 * fiscale" o "fattura", perché lì si scrive di tutto.
 */
export function findFiscalIds(text = "", { needKeyword = false } = {}) {
  const source = String(text || "");
  const found = { vatNumber: "", taxCode: "" };
  if (!source.trim() || (needKeyword && !KEYWORD_RE.test(source))) return found;
  for (const match of source.matchAll(CF_RE)) {
    if (isValidCodiceFiscale(match[1])) { found.taxCode = match[1].toUpperCase(); break; }
  }
  for (const match of source.matchAll(VAT_RE)) {
    if (isValidPartitaIva(match[1])) { found.vatNumber = match[1]; break; }
  }
  return found;
}

// Vero se il campo contiene solo l'identificativo (es. "Azienda: RSSMRA80A01H501U"):
// allora non è il nome di un'azienda e non va usato come intestazione.
export function isOnlyFiscalId(text = "") {
  const rest = String(text || "")
    .replace(CF_RE, "")
    .replace(VAT_RE, "")
    .replace(/p\.?\s?iva|partita\s+iva|\bvat\b|\bc\.?\s?f\b|codice\s+fiscale/gi, "")
    .replace(/[^A-Za-zÀ-ÿ0-9]/g, "");
  const ids = findFiscalIds(text);
  return Boolean((ids.vatNumber || ids.taxCode) && !rest);
}
