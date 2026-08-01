/**
 * lib/notifications.js — Modello dati puro del centro notifiche.
 *
 * Problema che risolve: fino ad ora le notifiche erano SOLO push web
 * fire-and-forget (4 punti in tutto il server). Se il dispositivo era spento,
 * offline, o l'utente non aveva dato il permesso, l'evento spariva e non
 * restava traccia da nessuna parte. Non c'era un posto dove consultarle.
 *
 * Qui la notifica diventa un RECORD PERSISTENTE per destinatario. La push è
 * solo uno dei canali di consegna; il centro notifiche in-app è la fonte di
 * verità e funziona su qualunque dispositivo, anche senza permesso push.
 *
 * Tutto puro (nessun I/O, `now` iniettabile) → testabile. Vedi
 * test/notifications.test.js. Il lato server (persistenza, push, SSE) sta in
 * server.js e usa queste funzioni.
 */

// Tipi noti. `defaultChannels` decide dove va la notifica quando l'utente non
// ha espresso una preferenza: "inapp" = riga nel centro notifiche (sempre
// presente di fatto), "push" = anche notifica di sistema su PC/telefono.
export const NOTIFICATION_TYPES = {
  chat_message: { label: "Messaggi in chat", defaultChannels: ["inapp", "push"] },
  crew_assigned: { label: "Lavoro assegnato alla squadra", defaultChannels: ["inapp", "push"] },
  warehouse_ready: { label: "Ordine pronto per spedizione", defaultChannels: ["inapp", "push"] },
  warehouse_prep_needed: { label: "Nuovo ordine da preparare", defaultChannels: ["inapp", "push"] },
  job_status_updated: { label: "Stato lavoro aggiornato dalla squadra", defaultChannels: ["inapp", "push"] },
  absence_requested: { label: "Richiesta di assenza da approvare", defaultChannels: ["inapp", "push"] },
  absence_decided: { label: "Esito della tua richiesta di assenza", defaultChannels: ["inapp", "push"] },
  sales_request_new: { label: "Nuova richiesta di preventivo", defaultChannels: ["inapp", "push"] },
  reseller_order_new: { label: "Nuovo ordine da rivenditore", defaultChannels: ["inapp", "push"] },
  test: { label: "Notifica di prova", defaultChannels: ["inapp", "push"] },
};

export function isKnownNotificationType(type = "") {
  return Object.prototype.hasOwnProperty.call(NOTIFICATION_TYPES, String(type || ""));
}

function cleanString(value, max) {
  const s = String(value == null ? "" : value).trim();
  return max ? s.slice(0, max) : s;
}

/**
 * Riporta un record grezzo (da store JSON, potenzialmente vecchio o corrotto)
 * alla forma canonica. Ritorna null se non è recuperabile: un record senza
 * destinatario o senza tipo non è consegnabile a nessuno.
 */
export function normalizeNotification(raw = {}) {
  const id = cleanString(raw?.id);
  const userId = cleanString(raw?.userId);
  const type = cleanString(raw?.type);
  if (!id || !userId || !type) return null;
  const count = Number(raw?.count);
  return {
    id,
    userId,
    type,
    title: cleanString(raw?.title, 160),
    body: cleanString(raw?.body, 400),
    // Il deep link: quale vista aprire e su quale record atterrare.
    data: raw?.data && typeof raw.data === "object" && !Array.isArray(raw.data) ? { ...raw.data } : {},
    dedupeKey: cleanString(raw?.dedupeKey, 200),
    // Quante occorrenze sono state collassate in questa riga (vedi upsert).
    count: Number.isFinite(count) && count > 1 ? Math.floor(count) : 1,
    createdAt: cleanString(raw?.createdAt) || new Date(0).toISOString(),
    readAt: cleanString(raw?.readAt) || null,
  };
}

export function buildNotification({
  id,
  userId,
  type,
  title = "",
  body = "",
  data = {},
  dedupeKey = "",
  createdAt = new Date().toISOString(),
} = {}) {
  return normalizeNotification({
    id,
    userId,
    type,
    title,
    body,
    data,
    dedupeKey,
    count: 1,
    createdAt,
    readAt: null,
  });
}

/**
 * Inserisce una notifica nella lista (più recenti in testa).
 *
 * Se il record ha una `dedupeKey` e per lo stesso utente esiste già una
 * notifica NON LETTA con la stessa chiave, la sostituisce invece di
 * accodarne una nuova, incrementando `count`. È ciò che rende la chat
 * sopportabile: dieci messaggi nello stesso thread restano UNA riga
 * ("3 nuovi messaggi da Mario") invece di dieci. Appena l'utente la legge,
 * il prossimo messaggio riparte con una riga nuova.
 */
export function upsertNotification(list = [], record = null) {
  const items = Array.isArray(list) ? list.slice() : [];
  const incoming = normalizeNotification(record);
  if (!incoming) return { list: items, notification: null, collapsed: false };

  if (incoming.dedupeKey) {
    const idx = items.findIndex((item) => (
      item
      && String(item.userId) === incoming.userId
      && String(item.dedupeKey || "") === incoming.dedupeKey
      && !item.readAt
    ));
    if (idx !== -1) {
      const previous = normalizeNotification(items[idx]) || incoming;
      const merged = {
        ...incoming,
        // L'id della riga esistente resta, così un client che l'ha già
        // renderizzata la aggiorna in place invece di duplicarla.
        id: previous.id,
        count: previous.count + 1,
      };
      items.splice(idx, 1);
      items.unshift(merged);
      return { list: items, notification: merged, collapsed: true };
    }
  }

  items.unshift(incoming);
  return { list: items, notification: incoming, collapsed: false };
}

export function countUnread(list = [], userId = "") {
  const uid = cleanString(userId);
  if (!uid) return 0;
  return (Array.isArray(list) ? list : []).reduce((total, item) => (
    item && String(item.userId) === uid && !item.readAt ? total + 1 : total
  ), 0);
}

export function listNotificationsForUser(list = [], userId = "", { limit = 50 } = {}) {
  const uid = cleanString(userId);
  if (!uid) return [];
  return (Array.isArray(list) ? list : [])
    .map(normalizeNotification)
    .filter((item) => item && item.userId === uid)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, Math.max(1, Number(limit) || 50));
}

/**
 * Segna come lette le notifiche dell'utente. `ids = null` → tutte.
 * Ritorna anche `changed` così il chiamante evita una scrittura su disco
 * inutile quando non c'era davvero nulla da leggere.
 */
export function markNotificationsRead(list = [], userId = "", ids = null, readAt = new Date().toISOString()) {
  const uid = cleanString(userId);
  const wanted = ids === null ? null : new Set((Array.isArray(ids) ? ids : [ids]).map((id) => cleanString(id)));
  let changed = false;
  const next = (Array.isArray(list) ? list : []).map((item) => {
    if (!item || String(item.userId) !== uid || item.readAt) return item;
    if (wanted && !wanted.has(String(item.id))) return item;
    changed = true;
    return { ...item, readAt };
  });
  return { list: next, changed };
}

/**
 * Potatura: lo store viene riscritto per intero ad ogni salvataggio, quindi la
 * lista non può crescere all'infinito. Si tiene un tetto PER UTENTE (così un
 * utente molto attivo non svuota la casella degli altri) più un limite di età.
 * Le non lette recenti hanno la precedenza: entro il tetto si conserva prima
 * l'ordine cronologico, ma una non letta non viene mai scartata per età.
 */
export function pruneNotifications(list = [], {
  maxPerUser = 200,
  maxAgeDays = 60,
  now = Date.now(),
} = {}) {
  const cutoff = now - (Math.max(1, Number(maxAgeDays) || 60) * 24 * 60 * 60 * 1000);
  const perUser = new Map();
  const kept = [];

  for (const raw of Array.isArray(list) ? list : []) {
    const item = normalizeNotification(raw);
    if (!item) continue;
    const isUnread = !item.readAt;
    const timestamp = Date.parse(item.createdAt);
    if (!isUnread && Number.isFinite(timestamp) && timestamp < cutoff) continue;
    const used = perUser.get(item.userId) || 0;
    if (used >= Math.max(1, Number(maxPerUser) || 200)) continue;
    perUser.set(item.userId, used + 1);
    kept.push(item);
  }

  return kept.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

/**
 * Preferenze per tipo. La forma è { [type]: { inapp: bool, push: bool } }.
 * Il canale in-app NON è disattivabile: la riga nel centro notifiche resta
 * sempre, altrimenti si torna al problema di partenza (eventi che spariscono
 * senza lasciare traccia). L'utente può però spegnere la push per tipo.
 */
export function resolveChannels(type = "", prefs = {}) {
  const known = NOTIFICATION_TYPES[String(type || "")];
  const defaults = known ? known.defaultChannels : ["inapp"];
  const userPref = prefs && typeof prefs === "object" ? prefs[String(type || "")] : null;
  const pushDefault = defaults.includes("push");
  const push = userPref && typeof userPref.push === "boolean" ? userPref.push : pushDefault;
  return { inapp: true, push: Boolean(push) };
}

export function normalizeNotificationPrefs(raw = {}) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [type, value] of Object.entries(raw)) {
    if (!isKnownNotificationType(type)) continue;
    if (!value || typeof value !== "object") continue;
    if (typeof value.push !== "boolean") continue;
    out[type] = { push: value.push };
  }
  return out;
}
