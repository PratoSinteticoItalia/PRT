/**
 * lib/surveys.js — Modello dati puro dei sopralluoghi.
 *
 * Un sopralluogo è la visita che una squadra fa dal cliente prima di un
 * ordine/preventivo (misure reali, stato del terreno, fattibilità). L'ufficio
 * lo crea e lo assegna a una squadra; la squadra lo esegue e lo documenta.
 *
 * Persistenza in Postgres (tabella `site_surveys`, vedi server.js), non nel
 * blob JSON dello store: a differenza di entità come `sales_requests`, qui
 * serve poter filtrare per squadra/stato/data con un indice, non rileggere
 * l'intero store ad ogni mutazione.
 *
 * Tutto puro (nessun I/O) → importabile sia da server.js sia da app.js
 * (entrambi ES module), così normalizzazione e state machine restano
 * UN'UNICA fonte di verità condivisa, invece di due copie da tenere
 * manualmente allineate come accade oggi per `sales_requests`.
 */

export const SURVEY_STATUSES = ["da-assegnare", "assegnato", "in-corso", "completato", "annullato"];

// "annullato" è volutamente fuori da questa rank: è uno stato manuale
// riservato all'ufficio (vedi canAdvanceSurveyStatus), mai raggiunto per
// avanzamento automatico né dalla squadra.
export const SURVEY_STATUS_RANK = {
  "da-assegnare": 0,
  assegnato: 1,
  "in-corso": 2,
  completato: 3,
};

export function isKnownSurveyStatus(status = "") {
  return SURVEY_STATUSES.includes(String(status || ""));
}

// Gravità rilevata dalla squadra sul posto — distinta da groundCondition
// (natura del terreno) e da crewNotes (note generiche): serve all'ufficio per
// dare priorità senza dover aprire ogni sopralluogo.
export const SURVEY_CRITICALITY_LEVELS = ["nessuna", "lieve", "bloccante"];

export function isKnownSurveyCriticality(value = "") {
  return SURVEY_CRITICALITY_LEVELS.includes(String(value || ""));
}

function cleanString(value, max) {
  const s = String(value == null ? "" : value).trim();
  return max ? s.slice(0, max) : s;
}

function cleanNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function cleanBooleanOrNull(value) {
  return value === true || value === false ? value : null;
}

function cleanTimestampOrNull(value) {
  const s = cleanString(value);
  return s || null;
}

/**
 * Riporta un record grezzo (riga DB già in camelCase, o payload client) alla
 * forma canonica. Ritorna null se non è recuperabile: senza id o nome
 * cliente non è un sopralluogo utilizzabile.
 */
export function normalizeSurveyRecord(raw = {}) {
  const id = cleanString(raw?.id);
  const customerName = cleanString(raw?.customerName, 160);
  if (!id || !customerName) return null;
  const statusRaw = cleanString(raw?.status);
  const status = isKnownSurveyStatus(statusRaw) ? statusRaw : "da-assegnare";
  const criticalityRaw = cleanString(raw?.criticality);
  const criticality = isKnownSurveyCriticality(criticalityRaw) ? criticalityRaw : "nessuna";
  return {
    id,
    status,
    customerName,
    phone: cleanString(raw?.phone, 40),
    email: cleanString(raw?.email, 160),
    address: cleanString(raw?.address, 240),
    city: cleanString(raw?.city, 120),
    province: cleanString(raw?.province, 8).toUpperCase(),
    salesRequestId: cleanString(raw?.salesRequestId),
    crewName: cleanString(raw?.crewName, 80),
    scheduledDate: cleanString(raw?.scheduledDate, 10),
    scheduledTime: cleanString(raw?.scheduledTime, 5),
    officeNotes: cleanString(raw?.officeNotes, 2000),
    crewNotes: cleanString(raw?.crewNotes, 2000),
    measuredSqm: cleanNumberOrNull(raw?.measuredSqm),
    groundCondition: cleanString(raw?.groundCondition, 120),
    feasible: cleanBooleanOrNull(raw?.feasible),
    criticality,
    criticalityNotes: cleanString(raw?.criticalityNotes, 500),
    photos: Array.isArray(raw?.photos) ? raw.photos.filter((p) => p && typeof p === "object") : [],
    createdBy: cleanString(raw?.createdBy),
    createdAt: cleanString(raw?.createdAt) || new Date(0).toISOString(),
    updatedAt: cleanString(raw?.updatedAt) || new Date(0).toISOString(),
    assignedAt: cleanTimestampOrNull(raw?.assignedAt),
    startedAt: cleanTimestampOrNull(raw?.startedAt),
    completedAt: cleanTimestampOrNull(raw?.completedAt),
    cancelledAt: cleanTimestampOrNull(raw?.cancelledAt),
    cancelReason: cleanString(raw?.cancelReason, 400),
  };
}

/**
 * Stato iniziale coerente alla creazione: se l'ufficio assegna subito una
 * squadra, il sopralluogo nasce già "assegnato" — evita un secondo giro
 * creazione+assegnazione separati per il caso comune.
 */
export function initialSurveyStatus(crewName = "") {
  return cleanString(crewName) ? "assegnato" : "da-assegnare";
}

/**
 * Avanzamento di stato per la SQUADRA: solo in avanti, mai regredisce, non
 * porta mai ad "annullato" (riservato all'ufficio) e non riparte mai da
 * "annullato". L'ufficio invece corregge liberamente SENZA passare da questa
 * funzione (deve poter riassegnare/correggere anche un sopralluogo già
 * completato per errore) — vedi il PATCH ufficio in server.js.
 */
export function canAdvanceSurveyStatus(current = "", target = "") {
  if (!isKnownSurveyStatus(target) || target === "annullato") return false;
  if (current === "annullato") return false;
  const currentRank = SURVEY_STATUS_RANK[current] ?? 0;
  const targetRank = SURVEY_STATUS_RANK[target];
  if (targetRank === undefined) return false;
  return targetRank > currentRank;
}

export function describeSurveyForNotification(survey = {}) {
  const name = cleanString(survey?.customerName) || "Cliente";
  const city = cleanString(survey?.city);
  return city ? `${name} · ${city}` : name;
}
