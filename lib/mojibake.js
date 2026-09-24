/**
 * lib/mojibake.js — ripara il testo corrotto dal classico bug "UTF-8
 * ridecodificato come Windows-1252" (es. l'apostrofo tipografico U+2019
 * diventa "â€™", la à di "città" diventa "Ã "). Capita quando una sorgente
 * a monte (form PHP del sito, vecchi import) dichiara/assume il charset
 * sbagliato leggendo byte UTF-8.
 *
 * Riparazione mirata e non distruttiva: parte solo se il testo contiene
 * almeno un carattere "sospetto" (Ã, o uno dei simboli che Windows-1252
 * definisce nel range 0x80-0x9F, dove diverge da ISO-8859-1/Latin-1), poi
 * rimappa ogni carattere al suo byte Windows-1252 e riprova a decodificarlo
 * come UTF-8. Se anche un solo carattere non è rimappabile a un byte, o il
 * risultato non è UTF-8 valido, o è identico all'originale, ritorna il testo
 * INVARIATO — testo pulito (compresi accenti italiani normali, o un euro
 * isolato in una nota) non viene mai toccato, perché una sequenza di byte
 * "sbagliata per caso" quasi non produce mai UTF-8 valido.
 *
 * Niente iconv-lite: la tabella copre a mano i soli 27 codepoint dove
 * Windows-1252 diverge da Latin-1 in 0x80-0x9F.
 */

// cp1252 0x80-0x9F → codepoint Unicode (solo i byte che Windows-1252 definisce
// come stampabili in questo range; 0x81,0x8D,0x8F,0x90,0x9D sono non definiti
// e restano assenti apposta: se compaiono nel testo, non è questo il bug).
const CP1252_BYTE_TO_CODEPOINT = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026,
  0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019,
  0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153,
  0x9e: 0x017e, 0x9f: 0x0178,
};

const CP1252_CODEPOINT_TO_BYTE = Object.fromEntries(
  Object.entries(CP1252_BYTE_TO_CODEPOINT).map(([byte, cp]) => [cp, Number(byte)]),
);

const SUSPECT_CODEPOINTS = new Set([
  0x00c3, // "Ã" — byte guida (0xC3) di quasi tutte le lettere accentate italiane a 2 byte (à,è,é,ì,ò,ù,...)
  ...Object.keys(CP1252_CODEPOINT_TO_BYTE).map(Number),
]);

function hasSuspectChar(text) {
  for (const ch of text) {
    if (SUSPECT_CODEPOINTS.has(ch.codePointAt(0))) return true;
  }
  return false;
}

/**
 * Prova a riparare una stringa corrotta da UTF-8→Windows-1252. Ritorna il
 * testo originale se non sembra corrotta, se contiene un carattere non
 * rimappabile a un singolo byte, o se il round-trip non produce UTF-8
 * valido (o produce lo stesso identico testo).
 */
export function repairMojibakeText(text) {
  const raw = String(text == null ? "" : text);
  if (!raw || !hasSuspectChar(raw)) return raw;
  const bytes = [];
  for (const ch of raw) {
    const cp = ch.codePointAt(0);
    if (cp <= 0xff) {
      bytes.push(cp);
    } else if (CP1252_CODEPOINT_TO_BYTE[cp] !== undefined) {
      bytes.push(CP1252_CODEPOINT_TO_BYTE[cp]);
    } else {
      return raw; // carattere fuori mappa: non è (solo) questo bug, non rischiare
    }
  }
  let repaired;
  try {
    repaired = Buffer.from(bytes).toString("utf8");
  } catch {
    return raw;
  }
  if (!repaired || repaired === raw || repaired.includes("�")) return raw;
  return repaired;
}

/** true se il valore verrebbe effettivamente modificato da repairMojibakeText. */
export function looksMojibake(text) {
  const raw = String(text == null ? "" : text);
  return repairMojibakeText(raw) !== raw;
}

/**
 * Applica repairMojibakeText a un oggetto piano, solo sulle chiavi indicate
 * (o su tutte le proprietà stringa se `fields` è omesso). Ritorna un nuovo
 * oggetto; non muta l'input.
 */
export function repairMojibakeFields(obj, fields) {
  if (!obj || typeof obj !== "object") return obj;
  const keys = fields || Object.keys(obj);
  const out = { ...obj };
  for (const key of keys) {
    if (typeof out[key] === "string") out[key] = repairMojibakeText(out[key]);
  }
  return out;
}
