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

// "concordato" (la squadra ha fissato data/ora col cliente) sta tra
// "assegnato" e "in-corso" nel flusso normale, ma è facoltativo: si può
// avanzare anche direttamente da assegnato a in-corso (vedi
// canAdvanceSurveyStatus, confronto per rank).
// "spostato" e "annullato" sono stati laterali, fuori dalla rank: "spostato"
// lo può impostare la squadra in qualsiasi momento prima di in-corso quando
// il cliente chiede di rimandare — poi è l'ufficio a rifissare la data
// (PATCH ufficio, senza vincolo di rank). "annullato" resta riservato
// all'ufficio, mai raggiunto per avanzamento automatico né dalla squadra.
export const SURVEY_STATUSES = ["da-assegnare", "assegnato", "concordato", "spostato", "in-corso", "completato", "annullato"];

export const SURVEY_STATUS_RANK = {
  "da-assegnare": 0,
  assegnato: 1,
  concordato: 2,
  "in-corso": 3,
  completato: 4,
};

export function isKnownSurveyStatus(status = "") {
  return SURVEY_STATUSES.includes(String(status || ""));
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

// Elenco libero: ogni voce è testo scritto dalla squadra (non una categoria
// fissa) — trim, scarta righe vuote, tetto largo di buon senso contro payload
// abnormi (non un vincolo UX: in pratica non si arriva mai vicino a 20).
function cleanStringList(value, { itemMax = 200, listMax = 20 } = {}) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item, itemMax))
    .filter(Boolean)
    .slice(0, listMax);
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
    // Elenco libero di problemi segnalati dalla squadra sul posto (accesso
    // stretto, terreno in pendenza, ecc.) — niente più severità/enum fisso:
    // ogni voce è testo libero, l'ufficio valuta priorità leggendole.
    criticalities: cleanStringList(raw?.criticalities, { itemMax: 200, listMax: 20 }),
    // Fino a 3 modelli di prato che il cliente ha mostrato di preferire,
    // raccolti dalla squadra sul posto — id del catalogo (lib/preventivo-pricing.js),
    // non nomi liberi: il client risolve id→nome/prezzo al momento del rendering.
    turfPreferences: cleanStringList(raw?.turfPreferences, { itemMax: 60, listMax: 3 }),
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
 *
 * "spostato" è un caso speciale: non ha una rank (è laterale, non un
 * avanzamento), e la squadra lo può impostare da qualunque stato non ancora
 * iniziato (il cliente può chiedere di rimandare in qualsiasi momento prima
 * del sopralluogo vero e proprio). Da "spostato" la squadra non può
 * ripartire da sola: serve l'ufficio per rifissare la data (PATCH ufficio,
 * fuori da questa funzione).
 */
export function canAdvanceSurveyStatus(current = "", target = "") {
  if (!isKnownSurveyStatus(target) || target === "annullato") return false;
  if (current === "annullato") return false;
  if (target === "spostato") {
    return !["in-corso", "completato", "spostato"].includes(current);
  }
  if (current === "spostato") return false;
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
