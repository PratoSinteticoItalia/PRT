// Registro squadre (novembre 2026).
//
// Una sola fonte per i nomi delle squadre: le righe "crew" di catalog_items
// (Impostazioni → Utenti e squadre). Riga attiva = squadra operativa; riga non
// attiva = «non più attiva»: sparisce da calendario e menu di assegnazione ma
// tutto quello che ha fatto (pose, sopralluoghi, verbali, spese, conti posa)
// resta col suo nome.
//
// Rinominare cambia il nome dappertutto, anche sullo storico: serve a
// correggere un nome sbagliato o a unire due squadre che sono la stessa
// («Kingarten» → «Kingarden»). Una squadra che cambia davvero (persone nuove)
// si crea nuova e la vecchia si mette «non più attiva».
//
// Qui solo regole senza database, usate da server.js e da app.js e provate in
// test/crew-registry.test.js.

// Chiave per riconoscere la stessa squadra scritta in modi diversi:
// maiuscole, accenti, spazi, «Squadra»/«Team» davanti non contano.
export function crewKey(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(squadra|team|crew)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function cleanCrewName(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 60);
}

// Righe del catalogo → registro: una voce per squadra (se due righe sono la
// stessa squadra vince quella attiva), nell'ordine del catalogo.
export function normalizeCrewRegistry(rows = []) {
  const byKey = new Map();
  const order = [];
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row || typeof row !== "object") return;
    const name = cleanCrewName(row.label || row.name || row.value || "");
    const key = crewKey(name);
    if (!key) return;
    let meta = row.metadata;
    if (typeof meta === "string") {
      try { meta = JSON.parse(meta); } catch { meta = {}; }
    }
    meta = meta && typeof meta === "object" ? meta : {};
    const capacity = Number(meta.capacity ?? row.capacity);
    const entry = {
      name,
      value: String(row.value || name),
      capacity: Number.isFinite(capacity) && capacity > 0 ? Math.round(capacity) : null,
      archived: row.active === false || row.archived === true,
      archivedAt: String(meta.archivedAt || row.archivedAt || ""),
    };
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, entry);
      order.push(key);
    } else if (existing.archived && !entry.archived) {
      byKey.set(key, entry);
    }
  });
  return order.map((key) => byKey.get(key));
}

export function findCrewEntry(registry = [], name = "") {
  const key = crewKey(name);
  if (!key) return null;
  return (Array.isArray(registry) ? registry : []).find((entry) => crewKey(entry?.name) === key) || null;
}

// Cosa succede al registro rinominando «from» in «to».
//   merge: «to» è già un'altra squadra → si uniscono e resta il suo nome;
//   altrimenti la squadra prende il nome nuovo (anche solo maiuscole).
// La squadra risultante è non più attiva solo se lo erano tutte e due.
export function planCrewRename(registry = [], from = "", to = "") {
  const toName = cleanCrewName(to);
  const fromKey = crewKey(from);
  const toKey = crewKey(toName);
  if (!fromKey || !toKey) return { error: "crew_name_required" };
  const source = findCrewEntry(registry, from);
  const target = fromKey === toKey ? null : findCrewEntry(registry, toName);
  const merge = Boolean(target);
  const archived = merge
    ? Boolean(target.archived && (!source || source.archived))
    : Boolean(source?.archived);
  return {
    fromKey,
    toKey,
    finalName: merge ? target.name : toName,
    merge,
    source,
    target,
    archived,
    capacity: target?.capacity || source?.capacity || null,
  };
}

function renameIfSame(value, fromKey, to) {
  if (typeof value !== "string" || !value.trim()) return { value, changed: false };
  if (crewKey(value) !== fromKey || value === to) return { value, changed: false };
  return { value: to, changed: true };
}

// Rinomina dentro i dati di una posa: squadra, spese di trasferta e
// collaboratore del conto posa (che di solito è la squadra stessa).
export function renameCrewInInstallation(installation, fromKey, to) {
  if (!installation || typeof installation !== "object" || !fromKey || !to) {
    return { installation, changed: false };
  }
  let changed = false;
  const next = { ...installation };
  for (const field of ["crew", "assignedCrew"]) {
    const result = renameIfSame(next[field], fromKey, to);
    if (result.changed) { next[field] = result.value; changed = true; }
  }
  if (Array.isArray(next.travelExpenses)) {
    let expensesChanged = false;
    const list = next.travelExpenses.map((expense) => {
      if (!expense || typeof expense !== "object") return expense;
      const result = renameIfSame(expense.crew, fromKey, to);
      if (!result.changed) return expense;
      expensesChanged = true;
      return { ...expense, crew: result.value };
    });
    if (expensesChanged) { next.travelExpenses = list; changed = true; }
  }
  for (const field of ["profitSplit", "partnerSettlement"]) {
    const block = next[field];
    if (!block || typeof block !== "object") continue;
    const result = renameIfSame(block.partnerName, fromKey, to);
    if (result.changed) { next[field] = { ...block, partnerName: result.value }; changed = true; }
  }
  return { installation: changed ? next : installation, changed };
}

// Pianificatore (disponibilità «Assente», colori, basi): sposta le voci della
// vecchia squadra sulla nuova; se c'erano già, unisce i giorni di assenza.
export function renameCrewInPlanner(planner = {}, fromKey, to) {
  const source = planner && typeof planner === "object" ? planner : {};
  const teams = { ...(source.teams || {}) };
  const availability = { ...(source.availability || {}) };
  const toKey = crewKey(to);
  let changed = false;
  Object.keys(teams).forEach((name) => {
    if (crewKey(name) !== fromKey || name === to) return;
    if (!teams[to]) teams[to] = teams[name];
    delete teams[name];
    changed = true;
  });
  Object.keys(availability).forEach((name) => {
    if (crewKey(name) !== fromKey || name === to) return;
    availability[to] = { ...(availability[name] || {}), ...(availability[to] || {}) };
    delete availability[name];
    changed = true;
  });
  // L'archivio ora sta nel registro: qui si tolgono le voci di tutte e due.
  const archivedTeams = (Array.isArray(source.archivedTeams) ? source.archivedTeams : [])
    .filter((name) => {
      const key = crewKey(name);
      const drop = key === fromKey || key === toKey;
      if (drop) changed = true;
      return !drop;
    });
  return { planner: { ...source, teams, availability, archivedTeams }, changed };
}

export function crewUsageTotal(usage = null) {
  if (!usage || typeof usage !== "object") return 0;
  return ["pose", "accounts", "surveys", "repairs", "reports", "events"]
    .reduce((sum, field) => sum + (Number(usage[field]) || 0), 0);
}
