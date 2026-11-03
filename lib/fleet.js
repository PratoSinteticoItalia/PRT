// Furgoni e attrezzatura (novembre 2026). Anagrafica dei mezzi e degli
// attrezzi, costo al km del furgone e dove si trova ogni attrezzo. Viaggi e
// posizioni non si scrivono a mano: si ricavano dai passaggi di cantiere
// (Partenza con furgone/km/attrezzatura caricata, Rientro con km e attrezzatura
// riportata). Annullando un passaggio, anche viaggi e posizioni tornano indietro.

export const DEFAULT_FLEET = {
  vans: [
    { id: "ducato", name: "Fiat Ducato", plate: "EB231ZE", active: true },
  ],
  tools: [
    { id: "motozappa", name: "Motozappa", brand: "Geotech" },
    { id: "piastra-vibrante", name: "Piastra vibrante", brand: "Scheppach" },
    { id: "motocarriola", name: "Motocarriola", brand: "RSV Motori" },
    { id: "motospazzola", name: "Motospazzola", brand: "CNCEST" },
    { id: "soffiatore", name: "Soffiatore per motospazzola", brand: "CNCEST", note: "Facoltativo" },
    { id: "rampe", name: "Rampe di carico", brand: "Geotech", qty: 2 },
    { id: "verricello", name: "Verricello", brand: "" },
  ],
  toolMoves: [],
};

export const VAN_COST_FIELDS = [
  "purchasePrice", "residualValue", "years", "kmPerYear",
  "kmPerLiter", "fuelPrice",
  "insurancePerYear", "taxPerYear", "maintenancePerYear", "tyresPerYear",
  "manualCostPerKm",
];
export const VAN_DEADLINES = ["revisione", "assicurazione", "bollo", "tagliando"];

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

const text = (value, max = 80) => String(value ?? "").trim().slice(0, max);
const positive = (value) => {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
};

export function slugId(value, fallback = "item") {
  const slug = String(value || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return slug || fallback;
}

function uniqueId(base, used) {
  let id = base;
  for (let i = 2; used.has(id); i += 1) id = `${base}-${i}`;
  used.add(id);
  return id;
}

export function normalizeVan(raw = {}, used = new Set()) {
  const costs = {};
  for (const key of VAN_COST_FIELDS) costs[key] = positive(raw.costs?.[key]);
  const deadlines = {};
  for (const key of VAN_DEADLINES) {
    const value = text(raw.deadlines?.[key], 10);
    deadlines[key] = DATE_KEY.test(value) ? value : "";
  }
  const name = text(raw.name) || "Furgone";
  return {
    id: uniqueId(text(raw.id, 40) || slugId(name, "furgone"), used),
    name,
    plate: text(raw.plate, 12).toUpperCase().replace(/\s+/g, ""),
    active: raw.active !== false,
    odometerKm: positive(raw.odometerKm),
    odometerDate: DATE_KEY.test(text(raw.odometerDate, 10)) ? text(raw.odometerDate, 10) : "",
    serviceEveryKm: positive(raw.serviceEveryKm),
    lastServiceKm: positive(raw.lastServiceKm),
    costs,
    deadlines,
  };
}

export function normalizeTool(raw = {}, used = new Set()) {
  const name = text(raw.name) || "Attrezzo";
  const qty = Math.round(Number(raw.qty) || 0);
  return {
    id: uniqueId(text(raw.id, 40) || slugId(name, "attrezzo"), used),
    name,
    brand: text(raw.brand, 40),
    note: text(raw.note, 120),
    qty: qty > 1 ? Math.min(qty, 99) : 1,
    active: raw.active !== false,
  };
}

export function normalizeFleet(raw) {
  const source = raw && typeof raw === "object" ? raw : DEFAULT_FLEET;
  const vanIds = new Set();
  const toolIds = new Set();
  const vans = (Array.isArray(source.vans) ? source.vans : []).slice(0, 20).map((van) => normalizeVan(van, vanIds));
  const tools = (Array.isArray(source.tools) ? source.tools : []).slice(0, 80).map((tool) => normalizeTool(tool, toolIds));
  const toolMoves = (Array.isArray(source.toolMoves) ? source.toolMoves : [])
    .filter((move) => toolIds.has(move?.toolId) && !Number.isNaN(new Date(move?.at).getTime()))
    .map((move) => ({ toolId: move.toolId, at: new Date(move.at).toISOString(), location: "warehouse", by: text(move.by, 80), note: text(move.note, 160) }))
    .slice(-500);
  return { vans, tools, toolMoves };
}

// Costo al km: ammortamento + carburante + spese fisse divise per i km
// dell'anno. Se l'ufficio scrive un costo al km a mano, vale quello.
export function vanCostPerKm(van = {}) {
  const c = van.costs || {};
  const kmYear = positive(c.kmPerYear);
  const purchase = positive(c.purchasePrice);
  const years = positive(c.years);
  const amort = purchase && years && kmYear ? Math.max(0, purchase - (positive(c.residualValue) || 0)) / years / kmYear : null;
  const fuel = positive(c.fuelPrice) && positive(c.kmPerLiter) ? c.fuelPrice / c.kmPerLiter : null;
  const fixedYear = ["insurancePerYear", "taxPerYear", "maintenancePerYear", "tyresPerYear"].reduce((sum, key) => sum + (positive(c[key]) || 0), 0);
  const fixed = kmYear && fixedYear > 0 ? fixedYear / kmYear : null;
  const manual = positive(c.manualCostPerKm);
  const parts = [amort, fuel, fixed].filter((value) => value != null);
  const computed = parts.length ? parts.reduce((sum, value) => sum + value, 0) : null;
  return {
    total: manual ?? computed,
    computed,
    amort,
    fuel,
    fixed,
    manual: manual != null,
    complete: amort != null && fuel != null && fixed != null,
  };
}

function eventKm(event) {
  const km = Number(event?.meta?.km);
  return Number.isFinite(km) && km > 0 ? km : null;
}

function sorted(events) {
  return events.filter((e) => e && !e.voidedAt && e.meta?.vanId && (e.eventType === "departure" || e.eventType === "return"))
    .slice().sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)));
}

// Viaggi: ogni Partenza apre un viaggio del suo furgone, il Rientro dello
// stesso furgone lo chiude. Se il furgone riparte senza rientro (da un
// cantiere all'altro), il viaggio precedente finisce ai km della nuova partenza.
export function buildTrips(events = [], fleet = {}) {
  const costs = new Map((fleet.vans || []).map((van) => [van.id, vanCostPerKm(van).total]));
  const open = new Map();
  const trips = [];
  const close = (trip, endEvent, kmEnd) => {
    trip.endAt = endEvent?.occurredAt || "";
    trip.kmEnd = kmEnd;
    if (endEvent?.eventType === "return") trip.returned = true;
    if (endEvent?.orderId && endEvent.orderId !== trip.orderId && endEvent.eventType === "return") trip.returnOrderId = endEvent.orderId;
    trip.km = trip.kmStart != null && kmEnd != null && kmEnd >= trip.kmStart ? kmEnd - trip.kmStart : null;
    const perKm = costs.get(trip.vanId);
    trip.cost = trip.km != null && perKm != null ? Math.round(trip.km * perKm * 100) / 100 : null;
  };
  for (const event of sorted(events)) {
    const vanId = event.meta.vanId;
    const current = open.get(vanId);
    if (event.eventType === "departure") {
      if (current) close(current, event, eventKm(event));
      const trip = {
        id: String(event.id || ""),
        vanId,
        orderId: event.orderId || "",
        crewName: event.crewName || "",
        startAt: event.occurredAt,
        kmStart: eventKm(event),
        tools: Array.isArray(event.meta.tools) ? event.meta.tools : [],
        endAt: "",
        kmEnd: null,
        km: null,
        cost: null,
        returned: false,
      };
      trips.push(trip);
      open.set(vanId, trip);
    } else if (current) {
      close(current, event, eventKm(event));
      open.delete(vanId);
    }
  }
  return trips.sort((a, b) => String(b.startAt).localeCompare(String(a.startAt)));
}

// Dove sono furgoni e attrezzi adesso.
export function fleetStatus(events = [], fleet = {}) {
  const vans = {};
  for (const van of fleet.vans || []) vans[van.id] = { km: van.odometerKm || null, kmAt: van.odometerDate || "", out: null };
  const tools = {};
  for (const tool of fleet.tools || []) tools[tool.id] = { state: "warehouse", since: "", orderId: "" };
  const loadedByVan = new Map();
  for (const event of sorted(events)) {
    const vanId = event.meta.vanId;
    const km = eventKm(event);
    if (vans[vanId] && km != null && (vans[vanId].km == null || km >= vans[vanId].km)) {
      vans[vanId].km = km;
      vans[vanId].kmAt = event.occurredAt;
    }
    if (event.eventType === "departure") {
      if (vans[vanId]) vans[vanId].out = { orderId: event.orderId || "", since: event.occurredAt, crewName: event.crewName || "" };
      const loaded = Array.isArray(event.meta.tools) ? event.meta.tools : [];
      loadedByVan.set(vanId, { orderId: event.orderId || "", tools: loaded });
      for (const id of loaded) {
        if (tools[id]) tools[id] = { state: "out", since: event.occurredAt, orderId: event.orderId || "", vanId };
      }
    } else {
      if (vans[vanId]) vans[vanId].out = null;
      const departure = loadedByVan.get(vanId);
      loadedByVan.delete(vanId);
      const back = Array.isArray(event.meta.tools) ? event.meta.tools : null;
      for (const id of departure?.tools || []) {
        if (!tools[id]) continue;
        // Rientro senza lista: si dà per riportato tutto quello che era partito.
        tools[id] = !back || back.includes(id)
          ? { state: "warehouse", since: event.occurredAt, orderId: "" }
          : { state: "left", since: event.occurredAt, orderId: departure.orderId || event.orderId || "" };
      }
      for (const id of back || []) {
        if (tools[id] && tools[id].state !== "warehouse") tools[id] = { state: "warehouse", since: event.occurredAt, orderId: "" };
      }
    }
  }
  // «Rimesso in magazzino» a mano dall'ufficio vale se è più recente.
  for (const move of fleet.toolMoves || []) {
    const status = tools[move.toolId];
    if (status && String(move.at) > String(status.since || "")) tools[move.toolId] = { state: "warehouse", since: move.at, orderId: "", manual: true };
  }
  return { vans, tools };
}

// Somma dei viaggi per commessa (per il conto posa) e per mese (per l'Analisi).
export function tripsTotals(trips = [], keyOf) {
  const totals = {};
  for (const trip of trips) {
    const key = keyOf(trip);
    if (!key) continue;
    const row = totals[key] || (totals[key] = { trips: 0, km: 0, cost: 0, missingKm: 0, missingCost: 0 });
    row.trips += 1;
    if (trip.km != null) row.km += trip.km; else row.missingKm += 1;
    if (trip.cost != null) row.cost = Math.round((row.cost + trip.cost) * 100) / 100; else row.missingCost += 1;
  }
  return totals;
}

// Scadenze del furgone: scadute o entro 30 giorni.
export function vanDeadlineStatus(dateKey, todayKey) {
  if (!DATE_KEY.test(String(dateKey || ""))) return "";
  if (dateKey < todayKey) return "expired";
  const soon = new Date(`${todayKey}T12:00:00Z`);
  soon.setUTCDate(soon.getUTCDate() + 30);
  return dateKey <= soon.toISOString().slice(0, 10) ? "soon" : "ok";
}
