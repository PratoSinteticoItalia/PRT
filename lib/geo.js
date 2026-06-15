/**
 * lib/geo.js — Derivazione della REGIONE italiana dalla città (testo libero).
 *
 * I clienti lasciano solo la località; questo helper risale alla regione usando
 * la mappa comune→regione (lib/comuni-regioni.js, dataset ISTAT). Funzione PURA
 * → testabile (test/geo.test.js) e condivisa col browser via import in app.js.
 */
import { COMUNE_REGION } from "./comuni-regioni.js";

/** Normalizza un nome città per il confronto (minuscole, no accenti/punteggiatura). */
export function normalizeCityKey(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // accenti
    .replace(/['’`]/g, " ")        // apostrofi → spazio
    .replace(/\([^)]*\)/g, " ")    // rimuovi parentesi es. "Roma (RM)"
    .replace(/[^a-z0-9 ]/g, " ")   // punteggiatura → spazio
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ritorna il nome della regione per una città (o "" se non riconosciuta).
 * Prova: stringa intera → parte prima della virgola → senza sigla provincia finale.
 */
export function regionForCity(city) {
  const raw = String(city || "");
  if (!raw.trim()) return "";
  const candidates = [];
  const full = normalizeCityKey(raw);
  if (full) candidates.push(full);
  const beforeComma = normalizeCityKey(raw.split(",")[0]);
  if (beforeComma && !candidates.includes(beforeComma)) candidates.push(beforeComma);
  const noProv = full.replace(/\s+[a-z]{2}$/, "").trim(); // es. "napoli na" → "napoli"
  if (noProv && !candidates.includes(noProv)) candidates.push(noProv);
  for (const key of candidates) {
    if (COMUNE_REGION[key]) return COMUNE_REGION[key];
  }
  return "";
}
