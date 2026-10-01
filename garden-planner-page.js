const { useState, useMemo, useRef, useEffect, useCallback } = React;
const SALES_GENERATOR_PLANNER_REPORT_KEY = "quote-generator-planner-report";

/* ═══════════════════════════════════════════
   CONSTANTS & DATA
   ═══════════════════════════════════════════ */
const B = {
  dark: "#0f2a18", primary: "#1D6B35", accent: "#4caf50",
  light: "#edf5ef", white: "#ffffff", cream: "#fafaf6",
  gray: "#f2f1ec", border: "#d8d7cf", borderLight: "#e8e7e0",
  text: "#1e1e1c", textMuted: "#7a796f", danger: "#c62828",
  info: "#1565c0", infoBg: "#eff6ff",
  warn: "#e65100", warnBg: "#fff8e1",
};
// Stessa palette del preventivo nativo (preventivo-v2.html, --gd/--gm/--gp/--br)
// — usata solo nel report CLIENTE del Garden Planner, così i due documenti
// allegati insieme (preventivo + progetto giardino) sembrano della stessa
// famiglia grafica. Il report tecnico interno resta sui colori B esistenti.
const CB = { dark: "#1c4229", mid: "#245c35", pale: "#e8f5ec", paleBorder: "#c2e8cc", line: "#d8e4da" };

const BORDER_TYPES = [
  { id: "pvc", name: "Bordura PVC", price: 4.5, unit: "m" },
  { id: "nessuna", name: "Nessuna bordura", price: 0, unit: "m" },
];

const INFILL_FO30 = {
  name: "Sabbia silicea FO30",
  kgPerSqm: 5,
  bagKg: 25,
  pricePerTon: 92,
};

const MATERIAL_COSTS = {
  scavoPerM3: 24,
  stabilizedPerTonFallback: 21,
  sandPerTonFallback: 21,
  geoPerSqm: 1.0,
  glueBucket: 45,
  tapeRoll: 30,
  pinPerUnit: 0.3,
};

const REGION_MATERIAL_PRICES = {
  "Abruzzo": { stabilizedPerTon: 18.0, sandPerTon: 19.0 },
  "Basilicata": { stabilizedPerTon: 15.0, sandPerTon: 17.0 },
  "Calabria": { stabilizedPerTon: 15.0, sandPerTon: 17.0 },
  "Campania": { stabilizedPerTon: 17.0, sandPerTon: 19.0 },
  "Emilia-Romagna": { stabilizedPerTon: 22.0, sandPerTon: 25.0 },
  "Friuli-Venezia Giulia": { stabilizedPerTon: 24.0, sandPerTon: 24.0 },
  "Lazio": { stabilizedPerTon: 21.0, sandPerTon: 21.0 },
  "Liguria": { stabilizedPerTon: 29.0, sandPerTon: 28.0 },
  "Lombardia": { stabilizedPerTon: 25.0, sandPerTon: 23.0 },
  "Marche": { stabilizedPerTon: 19.0, sandPerTon: 19.0 },
  "Molise": { stabilizedPerTon: 16.0, sandPerTon: 18.0 },
  "Piemonte": { stabilizedPerTon: 24.0, sandPerTon: 22.0 },
  "Puglia": { stabilizedPerTon: 16.0, sandPerTon: 18.0 },
  "Sardegna": { stabilizedPerTon: 18.0, sandPerTon: 20.0 },
  "Sicilia": { stabilizedPerTon: 14.0, sandPerTon: 17.0 },
  "Toscana": { stabilizedPerTon: 22.0, sandPerTon: 22.0 },
  "Trentino-Alto Adige": { stabilizedPerTon: 25.0, sandPerTon: 25.0 },
  "Umbria": { stabilizedPerTon: 19.0, sandPerTon: 23.0 },
  "Valle d'Aosta": { stabilizedPerTon: 27.0, sandPerTon: 25.0 },
  "Veneto": { stabilizedPerTon: 19.0, sandPerTon: 19.0 },
};

const GLUE_BUCKET_KG = 6;
const TAPE_ROLL_M = 25;
const INSTALLATION_RULES = {
  geoCoverageFactor: 1.05,
  glueKgPerSqm: 0.3,
  jointMetersPerSqm: 0.55,
  pinsPerLinearMeter: 2.2,
  layoutCoverageMin: 0.9,
  seamAlignmentToleranceM: 0.18,
  seamOverlapMinM: 0.25,
};
const MANUAL_ROLL_WIDTH_M = 2;
const MANUAL_ROLL_MAX_LENGTH_M = 25;
const MANUAL_ROLL_MIN_LENGTH_M = 1;

const DEFAULT_TRAVEL_SETTINGS = {
  departureBase: "Orta di Atella",
  kmTotal: 0,
  extraKm: 0,
  fuelPer100Km: 9.5,
  fuelPrice: 1.73,
  tollCost: 0,
  driveMinutes: 0,
  roundTrip: true,
  routeNote: "",
  routeStatus: "",
  routeLoading: false,
};

const ESTIMATED_TOLL_RATE_CLASS_B = 0.088;
const GARDEN_PLANNER_PREFILL_STORAGE_KEY = "garden-planner-quote-bridge-v1";
const GARDEN_PLANNER_REQUEST_PREFILL_STORAGE_KEY = "garden-planner-request-prefill-v1";
const APP_SHELL_VERSION = "20261001-pill-dati-tecnici";

const DECO_CATALOG = [
  { id: "detergente_prato", name: "Detergente prato sintetico", unit: "pz", pricePerUnit: 12.9, defaultQty: 0, cat: "Cura del prato", note: "Flacone pronto uso" },
  { id: "igienizzante_prato", name: "Igienizzante anti-odore prato sintetico", unit: "pz", pricePerUnit: 14.9, defaultQty: 0, cat: "Cura del prato", note: "Flacone trattamento" },
  { id: "scopa_ravvivante", name: "Scopa ravvivante manuale", unit: "pz", pricePerUnit: 24.9, defaultQty: 0, cat: "Cura del prato" },
  { id: "spazzola_prof", name: "Spazzola ravvivante professionale", unit: "pz", pricePerUnit: 39.9, defaultQty: 0, cat: "Cura del prato" },
  { id: "banda_extra", name: "Banda di giunzione - 25 mt", unit: "rotoli", pricePerUnit: 15.0, defaultQty: 0, cat: "Accessori posa" },
  { id: "colla_extra", name: "Colla bi-componente (A+B) - 6 Kg", unit: "secchi", pricePerUnit: 72.0, defaultQty: 0, cat: "Accessori posa" },
  { id: "picchetti_extra", name: "Picchetti a U", unit: "pz", pricePerUnit: 0.45, defaultQty: 0, cat: "Accessori posa" },
  { id: "telo_extra", name: "Telo da pacciamatura", unit: "rotoli", pricePerUnit: 48.0, defaultQty: 0, cat: "Accessori posa" },
];

const fmt = (n, d = 1) => Number(n).toFixed(d);
const fmtE = (n) => "\u20AC " + Number(n).toFixed(2);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const getLocalISODate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

// "2026-09-27" → "27 settembre 2026", per il report cliente — più
// presentabile della data ISO nuda usata nel report tecnico.
const IT_MONTHS = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
const formatItDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ""));
  if (!m) return "";
  const monthName = IT_MONTHS[Number(m[2]) - 1];
  return monthName ? `${Number(m[3])} ${monthName} ${m[1]}` : "";
};

function shouldUseSalesRequestPrefill() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search || "");
  const source = String(params.get("source") || "").trim().toLowerCase();
  const requestFlag = String(params.get("request") || params.get("prefill") || "").trim().toLowerCase();
  return source === "sales-request" || requestFlag === "1" || requestFlag === "sales-request";
}

function readGardenPlannerRequestPrefill() {
  if (!shouldUseSalesRequestPrefill()) return null;
  try {
    const raw = window.localStorage.getItem(GARDEN_PLANNER_REQUEST_PREFILL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (String(parsed?.source || "").trim() !== "sales-request") return null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getInitialProjectInfo() {
  const fallback = { client: "", address: "", date: getLocalISODate(), notes: "" };
  const request = readGardenPlannerRequestPrefill();
  if (!request) return fallback;
  const client = String(request.client || request.name || "").trim();
  const city = String(request.city || request.locality || "").trim();
  const address = String(request.address || city || "").trim();
  const notes = String(request.note || request.notes || "").trim();
  return {
    client,
    address,
    date: getLocalISODate(),
    notes,
  };
}

function sanitizeQuoteBridgeReportHtml(value) {
  const raw = String(value || "").trim();
  if (!raw || typeof document === "undefined") return raw;
  const shell = document.createElement("div");
  shell.innerHTML = raw;
  shell.querySelectorAll("script, style, link[rel='stylesheet'], #codex-pdf-export-style").forEach((node) => node.remove());
  const walker = document.createTreeWalker(shell, NodeFilter.SHOW_TEXT);
  const staleNodes = [];
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = String(node.textContent || "").trim();
    if (
      text.includes("@media print")
      || text.includes(".pdf-root")
      || text.includes(".pdf-no-break")
      || text.includes("print-color-adjust")
      || text.includes("page-break-inside")
      || text.includes("break-inside")
      || text.includes("@page")
    ) {
      staleNodes.push(node);
    }
  }
  staleNodes.forEach((node) => node.remove());
  return shell.innerHTML.trim();
}

// Converte i quantitativi calcolati dalla geometria reale del disegno
// (estimateInstallationNeeds) + la bordura selezionata nello stesso shape
// {key,label,qty,unit,unitPrice,total} usato da getMaterialBreakdown in
// lib/preventivo-pricing.js — permette al Generatore di ereditare QUESTI
// quantitativi invece di ricalcolarli con la formula piatta sui soli mq
// (che su forme non quadrate diverge molto: verificato, differenze 2-3x per
// singola voce su un rettangolo stretto). Le key (telo/bande/colla/picchetti)
// combaciano apposta con quelle del motore prezzi, così l'interfaccia
// "Materiali automatici" del Generatore le mostra senza bisogno di sapere da
// dove vengono. Il planner trasferisce solo quantità: unitPrice e total
// sono zero per compatibilità con il formato del Generatore.
function buildPlannerMaterialItems(installNeeds = {}, borderType = "nessuna", borderMeters = 0, pavingNeedsByArea = [], substrate = null, area = 0, regionalPricing = null) {
  const geo = Number(installNeeds.geo) || 0;
  const tapeRolls = Number(installNeeds.tapeRolls) || 0;
  const glueBuckets = Number(installNeeds.glueBuckets) || 0;
  const pins = Number(installNeeds.pins) || 0;
  const items = [];
  // Pietrisco (fondo drenante): nel Garden Planner è lo spessore "Fondo
  // drenante" (substrate.drenateCm) impostato dall'utente, non il 3cm fisso
  // che assume il Generatore in "Fornitura + posa" — quindi va SEMPRE incluso
  // qui quando il progetto arriva dal planner, altrimenti l'override materiali
  // (che sostituisce l'intera distinta, non solo aggiunge) lo fa sparire.
  const drenateCm = Number(substrate?.drenateCm) || 0;
  const safeArea = Number(area) || 0;
  if (drenateCm > 0 && safeArea > 0) {
    const drenateM3 = (safeArea * drenateCm) / 100;
    const drenateTon = (drenateM3 * 1600) / 1000;
    items.push({ key: "pietrisco", label: "Pietrisco (stabilizzato drenante)", qty: drenateTon, unit: "ton", unitPrice: 0, total: 0 });
  }
  items.push(
    { key: "telo", label: "Telo isolante", qty: geo, unit: "mq", unitPrice: 0, total: 0 },
    { key: "bande", label: "Bande di giunzione", qty: tapeRolls, unit: "pz", unitPrice: 0, total: 0 },
    { key: "colla", label: "Colla bicomponente", qty: glueBuckets, unit: "secchi", unitPrice: 0, total: 0 },
    { key: "picchetti", label: "Picchetti a U", qty: pins, unit: "pz", unitPrice: 0, total: 0 },
  );
  const safeBorderMeters = Number(borderMeters) || 0;
  if (borderType && borderType !== "nessuna" && safeBorderMeters > 0) {
    const border = BORDER_TYPES.find((entry) => entry.id === borderType);
    const unitPrice = 0;
    items.push({ key: "bordura", label: border?.name || "Bordura", qty: safeBorderMeters, unit: "m", unitPrice, total: safeBorderMeters * unitPrice });
  }
  // Distinta quantitativa: una riga per formato WPC. I campi prezzo restano
  // a zero esclusivamente per compatibilità con il contratto del Generatore.
  (pavingNeedsByArea || []).forEach((p, i) => {
    if (!p || !(p.tilesNeeded > 0)) return;
    const sizeLabel = `${p.tileSizeCm?.w || 30}×${p.tileSizeCm?.h || 30} cm`;
    items.push({
      key: pavingNeedsByArea.length > 1 ? `pavimentazione_${i + 1}` : "pavimentazione",
      label: pavingNeedsByArea.length > 1 ? `Mattonelle WPC zona ${i + 1} (${sizeLabel})` : `Mattonelle WPC (${sizeLabel})`,
      qty: p.tilesNeeded,
      unit: "pz",
      unitPrice: 0,
      total: 0,
    });
  });
  return items.map(({unitPrice,total,...item})=>({...item,unitPrice:0,total:0}));
}

function buildPlannerMaterialReferenceModel({
  area,
  turfArea = area,
  substrate,
  travel,
  installNeeds,
  borderType,
  borderMeters,
  decoItems,
  regionalPricing,
  viewerRole = "crew",
  reportVariant = "technical",
  pavingNeedsByArea = [],
}) {
  const safeTotalArea = Math.max(0, Number(area) || 0);
  const safeTurfArea = Math.max(0, Number(turfArea) || 0);
  const isClientVariant = reportVariant === "client";
  const canViewMaterialCosts = false; // Planner is a quantity takeoff tool for every role.
  const stabilizedPerTon = 0;
  const sandPerTon = 0;
  const pricingRegionLabel = regionalPricing?.region || "Lazio (fallback)";
  const scavoM3 = (safeTotalArea * substrate.scavoCm) / 100;
  const drenateM3 = (safeTotalArea * substrate.drenateCm) / 100;
  const drenateTon = (drenateM3 * 1600) / 1000;
  const sabbiaM3 = (safeTotalArea * substrate.sabbiaCm) / 100;
  const sabbiaKg = sabbiaM3 * 1500;
  const sabbiaTon = sabbiaKg / 1000;
  const border = BORDER_TYPES.find((entry) => entry.id === borderType);
  const infillKg = safeTurfArea * INFILL_FO30.kgPerSqm;
  const infillBags = Math.ceil(infillKg / INFILL_FO30.bagKg);
  const decoLines = Object.entries(decoItems || {})
    .filter(([, qty]) => Number(qty) > 0)
    .map(([id, qty]) => {
      const item = DECO_CATALOG.find((entry) => entry.id === id);
      return item
        ? { name: item.name, qty: `${qty} ${item.unit}`, cost: 0}
        : null;
    })
    .filter(Boolean);

  const travelSummary = getTravelSummary(travel);
  const travelCost = travelSummary.totalCost;

  const sections = [
    {
      key: "substrate",
      cat: "PREPARAZIONE FONDO",
      meta: "Quantità da approvvigionare",
      showCosts: canViewMaterialCosts,
      items: [
        substrate.scavoCm > 0 ? { name: "Scavo e smaltimento (" + substrate.scavoCm + "cm)", qty: fmt(scavoM3, 2) + " m\u00B3 \u2248 " + Math.round(scavoM3 * 1400) + " kg", cost: 0} : null,
        substrate.drenateCm > 0 ? { name: "Stabilizzato drenante (" + substrate.drenateCm + "cm)", qty: `${fmt(drenateM3, 2)} m\u00B3 · ${fmt(drenateTon, 2)} t`, cost: 0} : null,
        substrate.sabbiaCm > 0 ? { name: "Sabbia livellamento 0/4 (" + substrate.sabbiaCm + "cm)", qty: `${Math.round(sabbiaKg)} kg · ${fmt(sabbiaTon, 2)} t`, cost: 0} : null,
      ].filter(Boolean),
      sub: 0,
    },
    {
      key: "pose-materials",
      cat: "MATERIALI POSA",
      meta: "Quantità da ordinare",
      showCosts: canViewMaterialCosts,
      items: [
        { name: "Tessuto non tessuto", qty: fmt(installNeeds.geo) + " m\u00B2", cost: 0},
        {
          name: "Colla bicomponente",
          qty: installNeeds.calcMode === "layout"
            ? `${installNeeds.glueBuckets} secch${installNeeds.glueBuckets === 1 ? "io" : "i"} da ${GLUE_BUCKET_KG} kg · 1 secchio per rotolo banda`
            : `${fmt(installNeeds.glueKg, 1)} kg${installNeeds.glueBuckets > 0 ? ` · ${installNeeds.glueBuckets} secch${installNeeds.glueBuckets > 1 ? "i" : "io"} da ${GLUE_BUCKET_KG} kg` : ""} (${fmt(INSTALLATION_RULES.glueKgPerSqm, 1)} kg/m²)`,
          cost: 0,
        },
        installNeeds.jointMeters > 0 ? {
          name: "Nastro giunzione",
          qty: installNeeds.calcMode === "layout"
            ? `${fmt(installNeeds.jointMeters, 1)} m reali${installNeeds.tapeRolls > 0 ? ` · ${installNeeds.tapeRolls} rotol${installNeeds.tapeRolls > 1 ? "i" : "o"} da ${TAPE_ROLL_M} m` : ""}`
            : `${Math.round(installNeeds.jointMeters)} m stimati${installNeeds.tapeRolls > 0 ? ` · ${installNeeds.tapeRolls} rotol${installNeeds.tapeRolls > 1 ? "i" : "o"} da ${TAPE_ROLL_M} m` : ""}`,
          cost: 0,
        } : null,
        { name: "Chiodi a U", qty: installNeeds.pins + " pz", cost: 0},
        borderType !== "nessuna" && borderMeters > 0 ? { name: border?.name || "Bordura", qty: fmt(borderMeters) + " m", cost: 0} : null,
      ].filter(Boolean),
      sub: 0,
    },
    {
      key: "infill",
      cat: "INTASO",
      meta: "Quantità da ordinare",
      showCosts: canViewMaterialCosts,
      items: [
        { name: INFILL_FO30.name, qty: `${Math.round(infillKg)} kg · ${infillBags} sacchi da ${INFILL_FO30.bagKg} kg`, cost: 0},
      ],
      sub: 0,
    },
  ];

  if (decoLines.length > 0) {
    sections.push({
      key: "extras",
      cat: "MATERIALI AGGIUNTIVI",
      meta: "Extra selezionati",
      showCosts: canViewMaterialCosts,
      items: decoLines,
      sub: 0,
    });
  }

  if ((pavingNeedsByArea || []).some((p) => p?.tilesNeeded > 0)) {
    sections.push({
      key: "paving",
      cat: "PAVIMENTAZIONE WPC",
      meta: "Quantità da approvvigionare",
      showCosts: false,
      items: pavingNeedsByArea
        .filter((p) => p?.tilesNeeded > 0)
        .map((p, i) => ({
          name: pavingNeedsByArea.length > 1 ? `Mattonelle zona ${i + 1} (${p.tileSizeCm?.w || 30}×${p.tileSizeCm?.h || 30} cm)` : `Mattonelle (${p.tileSizeCm?.w || 30}×${p.tileSizeCm?.h || 30} cm)`,
          qty: `${p.tilesNeeded} pz · ${fmt(p.areaM2)} m² · +${Math.round(p.wasteFactor * 100)}% scarto`,
          cost: 0,
        })),
      sub: 0,
    });
  }

  if (travelSummary.totalKm > 0 || travelSummary.tollCost > 0 || travel?.departureBase) {
    sections.push({
      key: "travel",
      cat: "TRASFERTA E LOGISTICA",
      meta: "Stima costi",
      showCosts: !isClientVariant,
      items: [
        { name: "Sede di partenza", qty: travel?.departureBase || "Da definire", cost: null },
        { name: "Modalità viaggio", qty: travelSummary.modeLabel, cost: null },
        { name: "Km navigatore base", qty: `${fmt(travelSummary.routeKmTotal, 1)} km`, cost: null },
        { name: "Tempo guida stimato", qty: travelSummary.driveMinutes > 0 ? `${Math.round(travelSummary.driveMinutes)} min` : "—", cost: null },
        { name: "Carburante tratta base", qty: `${fmt(travelSummary.baseLiters, 1)} l`, cost: travelSummary.baseFuelCost },
        { name: "Caselli", qty: travelSummary.tollCost > 0 ? fmtE(travelSummary.tollCost) : "—", cost: travelSummary.tollCost },
        { name: "Costo base sede-cantiere", qty: `${fmt(travelSummary.routeKmTotal, 1)} km`, cost: travelSummary.baseTripCost },
        travelSummary.extraKm > 0 ? { name: "Km extra operativi", qty: `${fmt(travelSummary.extraKm, 1)} km`, cost: null } : null,
        travelSummary.extraKm > 0 ? { name: "Carburante km extra", qty: `${fmt(travelSummary.extraLiters, 1)} l`, cost: travelSummary.extraFuelCost } : null,
        { name: "Percorrenza totale", qty: `${fmt(travelSummary.totalKm, 1)} km`, cost: null },
        { name: "Costo trasferta totale", qty: travelSummary.extraKm > 0 ? "Base + extra" : "Solo tratta base", cost: travelSummary.totalCost },
      ].filter(Boolean),
      sub: travelCost,
    });
  }

  const materialSections = sections.filter((section) => section.key !== "travel");
  for(const section of materialSections){section.sub=0;section.items=section.items.map(({cost,...item})=>item);}
  const materialCostTotal = 0;

  return {
    canViewMaterialCosts,
    pricingRegionLabel,
    stabilizedPerTon,
    sandPerTon,
    sections,
    materialSections,
    materialCostTotal,
    travelSummary,
    travelCost,
    operationalCostTotal: materialCostTotal + travelCost,
  };
}

function buildPlannerQuotePrefill({ projectInfo, area, turfArea = area, substrate, travel, installNeeds, borderType, borderMeters, decoItems, regionalPricing, viewerRole = "crew", pavingNeedsByArea = [], sourceRequestId = "" }) {
  const safeTotalArea = Math.max(0, Number(area) || 0);
  const safeTurfArea = Math.max(0, Number(turfArea) || 0);
  const clientName = String(projectInfo.client || "").trim();
  const [firstName = "", ...restName] = clientName.split(/\s+/).filter(Boolean);
  const address = String(projectInfo.address || "").trim();
  const city = address.split(",").map((item) => item.trim()).filter(Boolean).pop() || address;
  const substrateSummary = [
    substrate.scavoCm > 0 ? `Scavo ${substrate.scavoCm} cm` : "",
    substrate.drenateCm > 0 ? `Drenante ${substrate.drenateCm} cm` : "",
    substrate.sabbiaCm > 0 ? `Sabbia ${substrate.sabbiaCm} cm` : "",
  ].filter(Boolean).join(" · ");
  const borderLabel = borderType !== "nessuna" && borderMeters > 0 ? `Bordura ${fmt(borderMeters, 1)} m` : "";
  const extraDecor = Object.entries(decoItems || {})
    .filter(([, qty]) => Number(qty) > 0)
    .map(([id, qty]) => {
      const item = DECO_CATALOG.find((entry) => entry.id === id);
      return item ? `${item.name} ${qty} ${item.unit}` : "";
    })
    .filter(Boolean);
  const materialReferenceModel = buildPlannerMaterialReferenceModel({
    area: safeTotalArea,
    turfArea: safeTurfArea,
    substrate,
    travel,
    installNeeds,
    borderType,
    borderMeters,
    decoItems,
    regionalPricing,
    viewerRole,
    reportVariant: "technical",
    pavingNeedsByArea,
  });
  const pavingTilesTotalForHighlight = (pavingNeedsByArea || []).reduce((sum, p) => sum + (Number(p?.tilesNeeded) || 0), 0);
  return {
    runId: Date.now(),
    createdAt: new Date().toISOString(),
    // Vuoto se il planner non è stato aperto da una richiesta CRM (disegno
    // libero): il generatore lo tratta come "nessuna associazione certa",
    // mai come "associato per default".
    sourceRequestId: String(sourceRequestId || "").trim(),
    client: clientName,
    address,
    city,
    sqmLabel: safeTurfArea === safeTotalArea
      ? `${fmt(safeTurfArea, 1)} m²`
      : `Prato ${fmt(safeTurfArea, 1)} m² · Totale ${fmt(safeTotalArea, 1)} m²`,
    serviceLabel: "Fornitura + posa",
    surfaceLabel: substrateSummary || "Fondo da definire",
    note: [
      address ? `Cantiere: ${address}` : "",
      substrateSummary ? `Fondo: ${substrateSummary}` : "",
      travel?.departureBase ? `Partenza: ${travel.departureBase}` : "",
      String(projectInfo.notes || "").trim(),
    ].filter(Boolean).join(" · "),
    materialHighlights: [
      `Prato ${fmt(safeTurfArea, 1)} m²`,
      safeTotalArea !== safeTurfArea ? `Totale progetto ${fmt(safeTotalArea, 1)} m²` : "",
      `TNT ${fmt(installNeeds.geo, 1)} m²`,
      installNeeds.tapeRolls > 0 ? `Banda ${fmt(installNeeds.jointMeters, 1)} m · ${installNeeds.tapeRolls} rot.` : "",
      installNeeds.glueBuckets > 0 ? `Colla ${installNeeds.glueBuckets} secchi` : "",
      borderLabel,
      pavingTilesTotalForHighlight > 0 ? `Pavimentazione WPC ${pavingTilesTotalForHighlight} pz` : "",
      ...extraDecor.slice(0, 3),
    ].filter(Boolean),
    materialsReference: {
      showCosts: materialReferenceModel.canViewMaterialCosts,
      region: materialReferenceModel.pricingRegionLabel,
      stabilizedPerTon: Number(materialReferenceModel.stabilizedPerTon || 0),
      sandPerTon: Number(materialReferenceModel.sandPerTon || 0),
      totalCost: materialReferenceModel.canViewMaterialCosts ? materialReferenceModel.materialCostTotal : 0,
      sections: materialReferenceModel.materialSections.map((section) => ({
        key: section.key,
        title: section.cat,
        subtotal: materialReferenceModel.canViewMaterialCosts ? Number(section.sub || 0) : 0,
        items: section.items.map((item) => ({
          name: item.name,
          qty: item.qty,
          cost: materialReferenceModel.canViewMaterialCosts && Number.isFinite(Number(item.cost)) ? Number(item.cost) : 0,
        })),
      })),
    },
    payload: {
      nome: firstName,
      cognome: restName.join(" "),
      citta: city,
      telefono: "",
      email: "",
      mq: Number(safeTurfArea).toFixed(1),
      altezza: "",
      servizio: "Fornitura + posa",
      fondo: substrateSummary || "Fondo da definire",
      whatsappTemplate: "",
      // Quantitativi materiali dalla geometria reale del disegno — vedi
      // buildPlannerMaterialItems. Machine-readable (non solo stringhe per
      // display come materialHighlights/materialsReference sopra): il
      // Generatore li userà al posto della formula piatta sui soli mq.
      materialItems: buildPlannerMaterialItems(installNeeds, borderType, borderMeters, pavingNeedsByArea, substrate, safeTotalArea, regionalPricing),
    },
  };
}

function normalizeRegionName(raw) {
  const normalized = String(raw || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (!normalized) return "";
  const aliases = {
    "abruzzo": "Abruzzo",
    "basilicata": "Basilicata",
    "calabria": "Calabria",
    "campania": "Campania",
    "emilia romagna": "Emilia-Romagna",
    "friuli venezia giulia": "Friuli-Venezia Giulia",
    "lazio": "Lazio",
    "liguria": "Liguria",
    "lombardia": "Lombardia",
    "marche": "Marche",
    "molise": "Molise",
    "piemonte": "Piemonte",
    "puglia": "Puglia",
    "sardegna": "Sardegna",
    "sicilia": "Sicilia",
    "toscana": "Toscana",
    "trentino alto adige": "Trentino-Alto Adige",
    "trentino alto adige sudtirol": "Trentino-Alto Adige",
    "provincia autonoma di trento": "Trentino-Alto Adige",
    "provincia autonoma di bolzano alto adige": "Trentino-Alto Adige",
    "umbria": "Umbria",
    "valle d aosta": "Valle d'Aosta",
    "vallee d aoste": "Valle d'Aosta",
    "aosta valley": "Valle d'Aosta",
    "veneto": "Veneto",
  };
  return aliases[normalized] || "";
}

function getRegionalMaterialPricing(rawRegion) {
  const regionName = normalizeRegionName(rawRegion);
  if (regionName && REGION_MATERIAL_PRICES[regionName]) {
    const row = REGION_MATERIAL_PRICES[regionName];
    return {
      region: regionName,
      stabilizedPerTon: Number(row.stabilizedPerTon),
      sandPerTon: Number(row.sandPerTon),
      fromRegionList: true,
    };
  }
  return {
    region: "Lazio (fallback)",
    stabilizedPerTon: Number(MATERIAL_COSTS.stabilizedPerTonFallback),
    sandPerTon: Number(MATERIAL_COSTS.sandPerTonFallback),
    fromRegionList: false,
  };
}

async function geocodeItalianAddress(query) {
  const cleaned = String(query || "").trim();
  if (!cleaned) throw new Error("missing_address");
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=it&q=${encodeURIComponent(cleaned)}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error("geocoding_failed");
  const data = await response.json();
  const first = Array.isArray(data) ? data[0] : null;
  if (!first) throw new Error("address_not_found");
  const rawRegion = first?.address?.state || first?.address?.region || first?.address?.county || "";
  return {
    lat: Number(first.lat),
    lon: Number(first.lon),
    label: first.display_name || cleaned,
    region: normalizeRegionName(rawRegion),
    regionRaw: rawRegion,
  };
}

async function fetchDrivingRoute(origin, destination) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=false&alternatives=false&steps=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("routing_failed");
  const data = await response.json();
  const route = data?.routes?.[0];
  if (!route) throw new Error("route_not_found");
  return {
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
  };
}

function estimateItalianTolls(distanceKm) {
  const km = Math.max(0, Number(distanceKm) || 0);
  if (km < 20) return 0;
  return km * ESTIMATED_TOLL_RATE_CLASS_B;
}

function sanitizeDims(shape, dims) {
  const safe = {
    a: Math.max(0, Number(dims.a) || 0),
    b: Math.max(0, Number(dims.b) || 0),
    c: Math.max(0, Number(dims.c) || 0),
    d: Math.max(0, Number(dims.d) || 0),
  };

  if (shape === "lshape") {
    safe.c = clamp(safe.c, 0, safe.a);
    safe.d = clamp(safe.d, 0, safe.b);
  }
  if (shape === "ushape") {
    safe.c = clamp(safe.c, 0, safe.a / 2);
    safe.d = clamp(safe.d, 0, safe.b);
  }
  return safe;
}

/* ═══════════════════════════════════════════
   GEOMETRY
   ═══════════════════════════════════════════ */
function polyArea(pts) {
  if (pts.length < 3) return 0;
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; a += pts[i].x * pts[j].y - pts[j].x * pts[i].y; }
  return Math.abs(a) / 2;
}
function polyPerimeter(pts) {
  if (pts.length < 2) return 0;
  let p = 0;
  for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; p += Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y); }
  return p;
}
function polyBBox(pts) {
  if (!pts.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  pts.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
function polyCenter(pts) {
  if (!Array.isArray(pts) || !pts.length) return { x: 0, y: 0 };
  const total = pts.reduce((acc, point) => {
    acc.x += Number(point?.x || 0);
    acc.y += Number(point?.y || 0);
    return acc;
  }, { x: 0, y: 0 });
  return { x: total.x / pts.length, y: total.y / pts.length };
}
function getShapePolygon(shape, dims) {
  const { a = 0, b = 0, c = 0, d = 0 } = sanitizeDims(shape, dims);
  if (shape === "rect" && a > 0 && b > 0) {
    return [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: b }, { x: 0, y: b }];
  }
  if (shape === "lshape" && a > 0 && b > 0) {
    return [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: d }, { x: c, y: d }, { x: c, y: b }, { x: 0, y: b }];
  }
  if (shape === "ushape" && a > 0 && b > 0) {
    return [{ x: 0, y: 0 }, { x: a, y: 0 }, { x: a, y: b }, { x: a - c, y: b }, { x: a - c, y: d }, { x: c, y: d }, { x: c, y: b }, { x: 0, y: b }];
  }
  return [];
}

function pointOnSegment(point, a, b, epsilon = 1e-6) {
  const cross = (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y);
  if (Math.abs(cross) > epsilon) return false;
  const dot = (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y);
  if (dot < -epsilon) return false;
  const sqLen = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (dot - sqLen > epsilon) return false;
  return true;
}

function pointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (pointOnSegment(point, a, b)) return true;
    const intersect = ((a.y > point.y) !== (b.y > point.y))
      && (point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1e-9) + a.x);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getRollCorners(roll) {
  const halfLength = (Number(roll?.length) || 0) / 2;
  const halfWidth = (Number(roll?.width) || MANUAL_ROLL_WIDTH_M) / 2;
  const angle = Number(roll?.angle) || 0;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const vx = -uy;
  const vy = ux;
  const cx = Number(roll?.cx) || 0;
  const cy = Number(roll?.cy) || 0;
  return [
    { x: cx - ux * halfLength - vx * halfWidth, y: cy - uy * halfLength - vy * halfWidth },
    { x: cx + ux * halfLength - vx * halfWidth, y: cy + uy * halfLength - vy * halfWidth },
    { x: cx + ux * halfLength + vx * halfWidth, y: cy + uy * halfLength + vy * halfWidth },
    { x: cx - ux * halfLength + vx * halfWidth, y: cy - uy * halfLength + vy * halfWidth },
  ];
}

function isRollInsidePolygon(roll, polygon) {
  const corners = getRollCorners(roll);
  return corners.every(point => pointInPolygon(point, polygon));
}

function normalizeRollGeometry(roll) {
  const length = Math.max(0, Number(roll?.length) || 0);
  const width = Math.max(0, Number(roll?.width) || MANUAL_ROLL_WIDTH_M);
  if (length <= 0 || width <= 0) return null;
  const angle = Number(roll?.angle) || 0;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const vx = -uy;
  const vy = ux;
  return {
    ...roll,
    length,
    width,
    angle,
    cx: Number(roll?.cx) || 0,
    cy: Number(roll?.cy) || 0,
    halfLength: length / 2,
    halfWidth: width / 2,
    ux,
    uy,
    vx,
    vy,
  };
}

function intervalOverlapLength(minA, maxA, minB, maxB) {
  return Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB));
}

function estimateJointLengthBetweenRolls(rollA, rollB) {
  const a = normalizeRollGeometry(rollA);
  const b = normalizeRollGeometry(rollB);
  if (!a || !b) return null;

  const crossNorm = Math.abs(a.ux * b.uy - a.uy * b.ux);
  if (crossNorm > 0.12) return null;

  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const along = dx * a.ux + dy * a.uy;
  const across = dx * a.vx + dy * a.vy;
  const lengthOverlap = intervalOverlapLength(
    -a.halfLength,
    a.halfLength,
    along - b.halfLength,
    along + b.halfLength,
  );
  const widthOverlap = intervalOverlapLength(
    -a.halfWidth,
    a.halfWidth,
    across - b.halfWidth,
    across + b.halfWidth,
  );
  const sideGap = Math.abs(Math.abs(across) - (a.halfWidth + b.halfWidth));
  const endGap = Math.abs(Math.abs(along) - (a.halfLength + b.halfLength));

  const sideJointMeters = sideGap <= INSTALLATION_RULES.seamAlignmentToleranceM
    && lengthOverlap >= INSTALLATION_RULES.seamOverlapMinM
    ? lengthOverlap
    : 0;
  const endJointMeters = endGap <= INSTALLATION_RULES.seamAlignmentToleranceM
    && widthOverlap >= INSTALLATION_RULES.seamOverlapMinM
    ? widthOverlap
    : 0;
  const totalJointMeters = sideJointMeters + endJointMeters;

  if (totalJointMeters <= 0) return null;
  return {
    totalJointMeters,
    sideJointMeters,
    endJointMeters,
  };
}

function estimateRollOverlapArea(rollA, rollB) {
  const a = normalizeRollGeometry(rollA);
  const b = normalizeRollGeometry(rollB);
  if (!a || !b) return 0;

  const crossNorm = Math.abs(a.ux * b.uy - a.uy * b.ux);
  if (crossNorm > 0.12) return 0;

  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const along = dx * a.ux + dy * a.uy;
  const across = dx * a.vx + dy * a.vy;
  const lengthOverlap = intervalOverlapLength(
    -a.halfLength,
    a.halfLength,
    along - b.halfLength,
    along + b.halfLength,
  );
  const widthOverlap = intervalOverlapLength(
    -a.halfWidth,
    a.halfWidth,
    across - b.halfWidth,
    across + b.halfWidth,
  );
  return lengthOverlap * widthOverlap;
}

function estimateRollLayoutMetrics(rolls = []) {
  const safeRolls = Array.isArray(rolls) ? rolls.filter(Boolean) : [];
  let jointMeters = 0;
  let sideJointMeters = 0;
  let endJointMeters = 0;
  let pairCount = 0;

  for (let i = 0; i < safeRolls.length; i += 1) {
    for (let j = i + 1; j < safeRolls.length; j += 1) {
      const seam = estimateJointLengthBetweenRolls(safeRolls[i], safeRolls[j]);
      if (!seam) continue;
      jointMeters += seam.totalJointMeters;
      sideJointMeters += seam.sideJointMeters;
      endJointMeters += seam.endJointMeters;
      pairCount += 1;
    }
  }

  const coverageArea = safeRolls.reduce((sum, roll) => (
    sum + (Math.max(0, Number(roll?.length) || 0) * Math.max(0, Number(roll?.width) || MANUAL_ROLL_WIDTH_M))
  ), 0);

  return {
    jointMeters,
    sideJointMeters,
    endJointMeters,
    pairCount,
    coverageArea,
    rollCount: safeRolls.length,
  };
}

function buildAdjacentRollCandidate(referenceRoll, direction = 1) {
  const source = normalizeRollGeometry(referenceRoll);
  if (!source) return null;
  const offset = source.width * direction;
  return {
    ...referenceRoll,
    id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cx: source.cx + source.vx * offset,
    cy: source.cy + source.vy * offset,
  };
}

function getPreferredParallelDuplicationDirection(referenceRoll, existingRolls = []) {
  if (!referenceRoll || !Array.isArray(existingRolls) || existingRolls.length < 2) return 1;
  const current = normalizeRollGeometry(referenceRoll);
  const previous = normalizeRollGeometry(existingRolls[existingRolls.length - 2]);
  if (!current || !previous) return 1;

  const crossNorm = Math.abs(current.ux * previous.uy - current.uy * previous.ux);
  if (crossNorm > 0.12) return 1;

  const dx = current.cx - previous.cx;
  const dy = current.cy - previous.cy;
  const normalOffset = dx * current.vx + dy * current.vy;
  if (Math.abs(normalOffset) < 0.05) return 1;
  return normalOffset >= 0 ? 1 : -1;
}

function scoreRollPlacementCandidate(candidateRoll, polygon = [], existingRolls = []) {
  if (!candidateRoll) return -Infinity;
  const corners = getRollCorners(candidateRoll);
  const insideCorners = Array.isArray(polygon) && polygon.length >= 3
    ? corners.reduce((sum, point) => sum + (pointInPolygon(point, polygon) ? 1 : 0), 0)
    : 0;
  const adjacencyScore = (existingRolls || []).reduce((sum, roll) => {
    const seam = estimateJointLengthBetweenRolls(candidateRoll, roll);
    return sum + (seam?.totalJointMeters || 0);
  }, 0);
  const overlapPenalty = (existingRolls || []).reduce((sum, roll) => (
    sum + (estimateRollOverlapArea(candidateRoll, roll) * 120)
  ), 0);
  return insideCorners * 20 + adjacencyScore - overlapPenalty;
}

function getTravelSummary(travel = {}) {
  const routeKm = Math.max(0, Number(travel?.kmTotal) || 0);
  const extraKm = Math.max(0, Number(travel?.extraKm) || 0);
  const fuelRate = Math.max(0, Number(travel?.fuelPer100Km) || 0);
  const fuelPrice = Math.max(0, Number(travel?.fuelPrice) || 0);
  const baseTollCost = Math.max(0, Number(travel?.tollCost) || 0);
  const baseDriveMinutes = Math.max(0, Number(travel?.driveMinutes) || 0);
  const isRoundTrip = travel?.roundTrip !== false;
  const multiplier = isRoundTrip ? 2 : 1;
  const routeKmTotal = routeKm * multiplier;
  const totalKm = routeKmTotal + extraKm;
  const driveMinutes = baseDriveMinutes * multiplier;
  const tollCost = baseTollCost * multiplier;
  const baseLiters = (routeKmTotal / 100) * fuelRate;
  const extraLiters = (extraKm / 100) * fuelRate;
  const liters = baseLiters + extraLiters;
  const baseFuelCost = baseLiters * fuelPrice;
  const extraFuelCost = extraLiters * fuelPrice;
  const fuelCost = baseFuelCost + extraFuelCost;
  const baseTripCost = baseFuelCost + tollCost;
  const totalCost = baseTripCost + extraFuelCost;

  return {
    routeKm,
    routeKmTotal,
    extraKm,
    totalKm,
    fuelRate,
    fuelPrice,
    baseTollCost,
    tollCost,
    baseDriveMinutes,
    driveMinutes,
    baseLiters,
    extraLiters,
    liters,
    baseFuelCost,
    extraFuelCost,
    fuelCost,
    baseTripCost,
    totalCost,
    multiplier,
    isRoundTrip,
    modeLabel: isRoundTrip ? "Andata e ritorno" : "Solo andata",
    modeShortLabel: isRoundTrip ? "A/R" : "A",
  };
}

function createManualRollFromSegment(start, end) {
  const dx = Number(end?.x || 0) - Number(start?.x || 0);
  const dy = Number(end?.y || 0) - Number(start?.y || 0);
  const rawLength = Math.hypot(dx, dy);
  if (rawLength <= 0) return null;
  const length = clamp(rawLength, MANUAL_ROLL_MIN_LENGTH_M, MANUAL_ROLL_MAX_LENGTH_M);
  const ux = dx / rawLength;
  const uy = dy / rawLength;
  const centerX = Number(start?.x || 0) + ux * (length / 2);
  const centerY = Number(start?.y || 0) + uy * (length / 2);
  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    cx: centerX,
    cy: centerY,
    length,
    width: MANUAL_ROLL_WIDTH_M,
    angle: Math.atan2(dy, dx),
  };
}

function getEdgeLabel(shape, index, count) {
  if (shape === "rect") {
    return ["Lato superiore", "Lato destro", "Lato inferiore", "Lato sinistro"][index] || `Lato ${index + 1}`;
  }
  if (shape === "custom") {
    return `Lato ${index + 1}`;
  }
  return count > 0 ? `Lato ${index + 1}` : "Lato";
}

function getShapeEdges(shape, dims, customPts, customClosed) {
  const pts = shape === "custom" ? (customClosed ? customPts : []) : getShapePolygon(shape, dims);
  if (!pts.length || pts.length < 2) return [];
  return pts.map((point, index) => {
    const next = pts[(index + 1) % pts.length];
    return {
      id: `${shape}-edge-${index}`,
      label: getEdgeLabel(shape, index, pts.length),
      length: Math.hypot(next.x - point.x, next.y - point.y),
    };
  });
}

function areClose(a, b, tolerance = 0.08) {
  const left = Math.max(0, Number(a) || 0);
  const right = Math.max(0, Number(b) || 0);
  const base = Math.max(left, right, 1e-6);
  return Math.abs(left - right) <= base * tolerance;
}

function isParallelVector(a, b, tolerance = 0.12) {
  const ax = Number(a?.x || 0);
  const ay = Number(a?.y || 0);
  const bx = Number(b?.x || 0);
  const by = Number(b?.y || 0);
  const aLen = Math.hypot(ax, ay);
  const bLen = Math.hypot(bx, by);
  if (aLen <= 1e-6 || bLen <= 1e-6) return false;
  const crossNorm = Math.abs((ax * by - ay * bx) / (aLen * bLen));
  return crossNorm <= tolerance;
}

function isRightAngleVector(a, b, tolerance = 0.12) {
  const ax = Number(a?.x || 0);
  const ay = Number(a?.y || 0);
  const bx = Number(b?.x || 0);
  const by = Number(b?.y || 0);
  const aLen = Math.hypot(ax, ay);
  const bLen = Math.hypot(bx, by);
  if (aLen <= 1e-6 || bLen <= 1e-6) return false;
  const dotNorm = Math.abs((ax * bx + ay * by) / (aLen * bLen));
  return dotNorm <= tolerance;
}

function classifyPolygonShape(points = []) {
  const pts = Array.isArray(points) ? points : [];
  if (pts.length === 3) return "Triangolo";
  if (pts.length !== 4) return "Forma irregolare";

  const vectors = pts.map((point, index) => {
    const next = pts[(index + 1) % pts.length];
    return {
      x: Number(next.x || 0) - Number(point.x || 0),
      y: Number(next.y || 0) - Number(point.y || 0),
    };
  });
  const sides = vectors.map((vector) => Math.hypot(vector.x, vector.y));
  const hasTwoParallelPairs = isParallelVector(vectors[0], vectors[2]) && isParallelVector(vectors[1], vectors[3]);
  const hasSingleParallelPair = isParallelVector(vectors[0], vectors[2]) !== isParallelVector(vectors[1], vectors[3]);
  const allRightAngles = vectors.every((vector, index) => isRightAngleVector(vector, vectors[(index + 1) % vectors.length]));

  if (hasTwoParallelPairs && allRightAngles) {
    const allEqual = sides.every((length) => areClose(length, sides[0], 0.07));
    return allEqual ? "Quadrato" : "Rettangolo";
  }
  if (hasSingleParallelPair) {
    return "Trapezio";
  }
  return "Forma irregolare";
}

function getShapeLabel(shape, dims, customPts, customClosed) {
  if (shape === "rect") {
    const { a = 0, b = 0 } = sanitizeDims(shape, dims);
    return areClose(a, b, 0.04) ? "Quadrato" : "Rettangolo";
  }
  if (shape === "custom") {
    if (!customClosed || !Array.isArray(customPts) || customPts.length < 3) return "Forma irregolare";
    return classifyPolygonShape(customPts);
  }
  if (shape === "lshape" || shape === "ushape") return "Forma irregolare";
  return "Forma irregolare";
}

function createLabelRect(centerX, centerY, width, height) {
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

function clampLabelRect(rect, bounds, padding = 6) {
  const maxX = Math.max(padding, Number(bounds?.width || 0) - rect.width - padding);
  const maxY = Math.max(padding, Number(bounds?.height || 0) - rect.height - padding);
  return {
    ...rect,
    x: clamp(rect.x, padding, maxX),
    y: clamp(rect.y, padding, maxY),
  };
}

function rectsOverlap(a, b, gap = 4) {
  return !(
    a.x + a.width + gap <= b.x
    || b.x + b.width + gap <= a.x
    || a.y + a.height + gap <= b.y
    || b.y + b.height + gap <= a.y
  );
}

function findAvailableLabelRect(candidates = [], width = 0, height = 0, occupied = [], bounds = { width: 0, height: 0 }) {
  let bestRect = null;
  let bestScore = Infinity;
  for (const candidate of candidates) {
    const rect = clampLabelRect(createLabelRect(candidate.x, candidate.y, width, height), bounds);
    const overlapScore = occupied.reduce((sum, item) => sum + (rectsOverlap(rect, item) ? 1 : 0), 0);
    if (overlapScore < bestScore) {
      bestRect = rect;
      bestScore = overlapScore;
      if (overlapScore === 0) break;
    }
  }
  const finalRect = bestRect || clampLabelRect(createLabelRect(bounds.width / 2, bounds.height / 2, width, height), bounds);
  occupied.push(finalRect);
  return finalRect;
}

function getEdgeOutwardNormal(point, next, polygon) {
  const dx = Number(next?.x || 0) - Number(point?.x || 0);
  const dy = Number(next?.y || 0) - Number(point?.y || 0);
  const length = Math.hypot(dx, dy) || 1;
  let nx = -dy / length;
  let ny = dx / length;
  const midpoint = {
    x: (Number(point?.x || 0) + Number(next?.x || 0)) / 2,
    y: (Number(point?.y || 0) + Number(next?.y || 0)) / 2,
  };
  const probePoint = { x: midpoint.x + nx * 0.35, y: midpoint.y + ny * 0.35 };
  if (pointInPolygon(probePoint, polygon)) {
    nx *= -1;
    ny *= -1;
  }
  return {
    midpoint,
    normal: { x: nx, y: ny },
    tangent: { x: dx / length, y: dy / length },
  };
}

function registerOccupiedCircle(occupied = [], centerX = 0, centerY = 0, radius = 0) {
  occupied.push({
    x: centerX - radius,
    y: centerY - radius,
    width: radius * 2,
    height: radius * 2,
  });
}

function estimateInstallationNeeds(area, perimeter, manualRolls = [], rollUsage = null) {
  const safeArea = Math.max(0, Number(area) || 0);
  const safePerimeter = Math.max(0, Number(perimeter) || 0);
  const geo = safeArea * INSTALLATION_RULES.geoCoverageFactor;
  const layoutMetrics = estimateRollLayoutMetrics(manualRolls);
  const rollMaterialArea = rollUsage?.material ?? layoutMetrics.coverageArea;
  const coveredArea = rollUsage?.covered ?? layoutMetrics.coverageArea;
  const layoutCoverageRatio = safeArea > 0 ? coveredArea / safeArea : 0;
  const useLayoutDrivenPose = layoutMetrics.rollCount > 0 && layoutCoverageRatio >= INSTALLATION_RULES.layoutCoverageMin;
  const fallbackGlueKg = safeArea * INSTALLATION_RULES.glueKgPerSqm;
  const fallbackJointMeters = safeArea * INSTALLATION_RULES.jointMetersPerSqm;
  const jointMeters = useLayoutDrivenPose ? layoutMetrics.jointMeters : fallbackJointMeters;
  const tapeRolls = jointMeters > 0 ? Math.ceil(jointMeters / TAPE_ROLL_M) : 0;
  const glueBuckets = useLayoutDrivenPose
    ? tapeRolls
    : (fallbackGlueKg > 0 ? Math.max(1, Math.ceil(fallbackGlueKg / GLUE_BUCKET_KG)) : 0);
  const glueKg = useLayoutDrivenPose ? glueBuckets * GLUE_BUCKET_KG : fallbackGlueKg;
  return {
    geo,
    glueKg,
    glueBuckets,
    jointMeters,
    tapeRolls,
    pins: Math.ceil(safePerimeter * INSTALLATION_RULES.pinsPerLinearMeter),
    calcMode: useLayoutDrivenPose ? "layout" : "area",
    layoutCoverageRatio,
    layoutCoverageArea: coveredArea,
    rollMaterialArea,
    rollWasteArea: rollUsage?.unused ?? Math.max(0, rollMaterialArea - safeArea),
    layoutJointMeters: layoutMetrics.jointMeters,
    sideJointMeters: layoutMetrics.sideJointMeters,
    endJointMeters: layoutMetrics.endJointMeters,
    jointPairCount: layoutMetrics.pairCount,
    fallbackGlueKg,
    fallbackJointMeters,
  };
}

// Percentuale di scarto per i tagli di bordo (la posa raramente combacia
// esattamente col perimetro dell'area) — stima non ancora verificata sui
// consumi reali di cantiere, confermata dall'utente come principio ("va
// tenuto sempre un margine") ma senza una cifra precisa: da ricalibrare
// se l'esperienza reale dice altro. Sfalsata più alta perché il taglio di
// inizio/fine fila si ripete più spesso.
const PAVING_WASTE_FACTOR = { straight: 0.08, offset: 0.12 };

// Conteggio mattonelle WPC ad incastro per un'area di pavimentazione.
// tileSizeCm: {w, h} in cm (formato reale più comune: 30×30, confermato
// dall'utente). layout: "straight" | "offset".
function estimatePavingNeeds(areaM2, tileSizeCm = { w: 30, h: 30 }, layout = "straight") {
  const safeArea = Math.max(0, Number(areaM2) || 0);
  const w = Math.max(1, Number(tileSizeCm?.w) || 30);
  const h = Math.max(1, Number(tileSizeCm?.h) || 30);
  const tileAreaM2 = (w / 100) * (h / 100);
  const wasteFactor = PAVING_WASTE_FACTOR[layout] ?? PAVING_WASTE_FACTOR.straight;
  const tilesNeeded = tileAreaM2 > 0 ? Math.ceil((safeArea / tileAreaM2) * (1 + wasteFactor)) : 0;
  return { tileAreaM2, tileSizeCm: { w, h }, wasteFactor, tilesNeeded, layout: PAVING_WASTE_FACTOR[layout] ? layout : "straight" };
}

/* ═══════════════════════════════════════════
   CANVAS
   ═══════════════════════════════════════════ */
const GRID_STEPS = [0.10, 0.25, 0.50, 1.00];
const DEFAULT_GRID_STEP = 0.25;
const BASE_PX = 36;

// kind: "turf" (default, prato — rotoli+bordura) | "paving" (mattonelle ad
// incastro WPC — nessun rotolo, conta pezzi da tileSize). tileSize/layout
// sono ignorati per le aree "turf", usati solo quando kind === "paving".
// Exact area of a union minus another union for simple straight-sided polygons.
// Vertex and edge-intersection x coordinates partition the plane into slabs;
// within each slab the union cross-section length is linear (no raster rounding).
function plannerNetArea(included = [], excluded = []) {
  const valid = polygons => polygons.filter(p => Array.isArray(p) && p.length >= 3 && p.every(v => Number.isFinite(v.x) && Number.isFinite(v.y)));
  const ins = valid(included), outs = valid(excluded);
  if (!ins.length) return 0;
  const polygons = [...ins, ...outs];
  const edges = polygons.flatMap(p => p.map((a, i) => [a, p[(i + 1) % p.length]]));
  const xs = polygons.flatMap(p => p.map(v => v.x));
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const [a, b] = edges[i], [c, d] = edges[j];
    const rx = b.x - a.x, ry = b.y - a.y, sx = d.x - c.x, sy = d.y - c.y;
    const det = rx * sy - ry * sx;
    if (Math.abs(det) < 1e-12) continue;
    const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / det;
    const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / det;
    if (t > 0 && t < 1 && u > 0 && u < 1) xs.push(a.x + t * rx);
  }
  const cuts = [...new Set(xs)].sort((a, b) => a - b);
  const intervals = (polys, x) => {
    const spans = polys.flatMap(p => {
      const ys = [];
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length];
        if ((a.x <= x && b.x > x) || (b.x <= x && a.x > x)) ys.push(a.y + (x - a.x) * (b.y - a.y) / (b.x - a.x));
      }
      ys.sort((a, b) => a - b);
      const pairs = [];
      for (let i = 0; i + 1 < ys.length; i += 2) pairs.push([ys[i], ys[i + 1]]);
      return pairs;
    }).sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const span of spans) {
      const last = merged[merged.length - 1];
      if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1]);
      else merged.push([...span]);
    }
    return merged;
  };
  let total = 0;
  for (let i = 1; i < cuts.length; i++) {
    const width = cuts[i] - cuts[i - 1];
    if (width < 1e-10) continue;
    const x = (cuts[i] + cuts[i - 1]) / 2;
    const holes = intervals(outs, x);
    let height = 0;
    for (const [a, b] of intervals(ins, x)) {
      height += b - a;
      for (const [c, d] of holes) height -= Math.max(0, Math.min(b, d) - Math.max(a, c));
    }
    total += width * Math.max(0, height);
  }
  return Math.max(0, total);
}

// Roll footprint is intersected with net lawn: material outside the lawn or
// over an obstacle never counts towards coverage. Duplicate rolls count as
// purchased material but do not cover the lawn twice.
function plannerRollUsage(areas = [], rolls = []) {
  const complete = areas.filter(a => a.closed !== false && Array.isArray(a.points) && a.points.length >= 3);
  const turf = complete.filter(a => !a.kind || a.kind === "turf").map(a => a.points);
  const excluded = complete.filter(a => a.kind === "paving" || a.kind === "exclusion").map(a => a.points);
  const validRolls = rolls.filter(r => Number(r.length) > 0 && (r.width == null || Number(r.width) > 0));
  const footprints = validRolls.map(getRollCorners);
  const netArea = plannerNetArea(turf, excluded);
  const uncovered = plannerNetArea(turf, [...excluded, ...footprints]);
  const covered = Math.max(0, netArea - uncovered);
  const material = validRolls.reduce((sum, r) => sum + Number(r.length) * (Number(r.width) || MANUAL_ROLL_WIDTH_M), 0);
  const union = plannerNetArea(footprints);
  const overlap = Math.max(0, material - union);
  const offcut = Math.max(0, union - covered);
  return { netArea, uncovered, covered, material, overlap, offcut,
    unused: Math.max(0, material - covered),
    wastePercent: material > 0 ? Math.max(0, material - covered) / material * 100 : 0 };
}

function createPlannerArea(kind = "turf") {
  return {
    id: `area-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    kind: ["paving", "exclusion"].includes(kind) ? kind : "turf",
    label: kind === "exclusion" ? "Casa / ostacolo" : "",
    points: [],
    closed: false,
    rolls: [],
    tileSize: { w: 30, h: 30 }, // cm — formato reale più usato, confermato dall'utente
    tileLayout: "straight", // "straight" | "offset"
  };
}

function applyStateUpdate(currentValue, nextValueOrUpdater) {
  return typeof nextValueOrUpdater === "function" ? nextValueOrUpdater(currentValue) : nextValueOrUpdater;
}

function getPlannerPolygons(customAreas = [], customPts = [], customClosed = false) {
  if (Array.isArray(customAreas) && customAreas.length) {
    return customAreas
      .map((area, index) => ({
        id: area.id || `area-${index + 1}`,
        index: index + 1,
        points: Array.isArray(area.points) ? area.points : [],
        closed: Boolean(area.closed),
        rolls: Array.isArray(area.rolls) ? area.rolls : [],
        kind: ["paving", "exclusion"].includes(area.kind) ? area.kind : "turf",
        label: area.label || "",
      }))
      .filter((area) => area.closed && area.points.length >= 3);
  }
  if (customClosed && Array.isArray(customPts) && customPts.length >= 3) {
    return [{
      id: "area-1",
      index: 1,
      points: customPts,
      closed: true,
      rolls: [],
    }];
  }
  return [];
}

function getPlannerShapeLabel(shape, dims, customPts, customClosed, customAreas = []) {
  const polygons = getPlannerPolygons(customAreas, customPts, customClosed);
  if (polygons.length > 1) return `${polygons.length} elementi disegnati`;
  return getShapeLabel(shape, dims, customPts, customClosed);
}

function getPlannerBorderEdges(customAreas = [], shape = "custom", dims = {}) {
  const polygons = getPlannerPolygons(customAreas).filter(a => a.kind !== "exclusion");
  if (!polygons.length) return [];
  return polygons.flatMap((area, areaIndex) => {
    const baseEdges = getShapeEdges(shape, dims, area.points, true);
    return baseEdges.map((edge, edgeIndex) => ({
      ...edge,
      id: `${area.id}-${edgeIndex}`,
      label: polygons.length > 1 ? `A${areaIndex + 1} · ${edge.label}` : edge.label,
      areaId: area.id,
      areaIndex: areaIndex + 1,
    }));
  });
}

function isRollInsideAnyPolygon(roll, polygons = []) {
  return polygons.some((polygon) => Array.isArray(polygon?.points) && polygon.points.length >= 3 && isRollInsidePolygon(roll, polygon.points));
}

function doesRollTouchPolygon(roll, polygon = []) {
  if (!Array.isArray(polygon) || polygon.length < 3) return true;
  const corners = getRollCorners(roll);
  return pointInPolygon({ x: roll.cx, y: roll.cy }, polygon) || corners.some(point => pointInPolygon(point, polygon));
}

// Direct manipulation uses immutable gesture snapshots: no cumulative drift.
function plannerRectangle(a, b) {
  const x=Math.min(a.x,b.x), y=Math.min(a.y,b.y), w=Math.abs(b.x-a.x), h=Math.abs(b.y-a.y);
  return w>0 && h>0 ? [{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}] : [];
}
// Cerchio (alberi, aiuole rotonde...): approssimato con un poligono a molti
// lati, non un vero arco — riusa TUTTA la pipeline esistente basata su
// point-array (area, esclusione dal prato, rendering, sfrido) senza toccarla.
// a = centro (punto di down), b = punto trascinato → definisce il raggio.
function plannerCircle(a, b, sides = 32) {
  const r = Math.hypot(b.x - a.x, b.y - a.y);
  if (r <= 0) return [];
  return Array.from({ length: sides }, (_, i) => {
    const angle = (i / sides) * Math.PI * 2;
    return { x: a.x + r * Math.cos(angle), y: a.y + r * Math.sin(angle) };
  });
}
function plannerMoveObject(areas, target, dx, dy) {
  return areas.map(area => {
    if(area.id!==target.areaId) return area;
    if(target.type==='roll') return {...area,rolls:area.rolls.map((r,i)=>i===target.index?{...target.original,cx:target.original.cx+dx,cy:target.original.cy+dy}:r)};
    return {...area,points:target.original.points.map(p=>({x:p.x+dx,y:p.y+dy})),rolls:(target.original.rolls||[]).map(r=>({...r,cx:r.cx+dx,cy:r.cy+dy}))};
  });
}
function plannerBorderLength(segments) {
  // Merge collinear overlapping intervals so retracing a border never doubles it.
  const groups=[];
  for(const {a,b} of segments) {
    let dx=b.x-a.x,dy=b.y-a.y, len=Math.hypot(dx,dy); if(len<1e-8) continue;
    dx/=len;dy/=len;if(dx<-1e-8 || (Math.abs(dx)<1e-8 && dy<0)){dx=-dx;dy=-dy;}
    const offset=-dy*a.x+dx*a.y;
    let g=groups.find(g=>Math.abs(g.dx-dx)<1e-8&&Math.abs(g.dy-dy)<1e-8&&Math.abs(g.offset-offset)<1e-7);
    if(!g){g={dx,dy,offset,ranges:[]};groups.push(g);}
    const t=a.x*dx+a.y*dy,u=b.x*dx+b.y*dy;g.ranges.push([Math.min(t,u),Math.max(t,u)]);
  }
  return groups.reduce((sum,g)=>{g.ranges.sort((a,b)=>a[0]-b[0]);let start=g.ranges[0][0],end=g.ranges[0][1],total=0;
    for(const [a,b] of g.ranges.slice(1)){if(a>end){total+=end-start;start=a;}end=Math.max(end,b);}return sum+total+end-start;},0);
}

// Keep callouts outside small pieces, including at the viewport edges.
function plannerLabelPosition(cx, cy, w, h, bounds, occupied, protectedBoxes, outside = null) {
  const clampX=x=>Math.max(bounds.left+w/2,Math.min(bounds.right-w/2,x));
  const clampY=y=>Math.max(bounds.top+h/2,Math.min(bounds.bottom-h/2,y));
  const overlaps=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2+4 && Math.abs(a.y-b.y)<(a.h+b.h)/2+4;
  const origins=outside ? [
    {x:cx,y:outside.y-(outside.h+h)/2-12},
    {x:cx,y:outside.y+(outside.h+h)/2+12},
    {x:outside.x+(outside.w+w)/2+12,y:cy},
    {x:outside.x-(outside.w+w)/2-12,y:cy},
  ] : [{x:cx,y:cy}];
  for(let step=0;step<30;step++) for(const origin of origins){
    const offset=(step%2?1:-1)*Math.ceil(step/2)*(h+5);
    const box={x:clampX(origin.x),y:clampY(origin.y+offset),w,h};
    if(box.w>bounds.right-bounds.left || box.h>bounds.bottom-bounds.top)continue;
    if([...occupied,...protectedBoxes,...(outside?[outside]:[])].some(b=>overlaps(box,b)))continue;
    return box;
  }
  return null;
}

function FreeDrawCanvas({
  points,
  setPoints,
  closed,
  setClosed,
  rolls = [],
  setRolls,
  areas = [],
  activeAreaId = "",
  drawMode = "shape",
  setDrawMode = () => {},
  previewMode = false,
  borderEdges = [],
  selectedBorderEdges = [],
  showBorderOverlay = false,
  editor = {},
  pendingOffcut = null, onPlaceOffcut = () => {}, onCancelOffcut = () => {},
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pointerStateRef = useRef({ pointerId: null, mode: "", start: null, moved: false });
  const [hoverPt, setHoverPt] = useState(null);
  const [selection,setSelection]=useState(null);
  const [gesture,setGesture]=useState(null);
  const [rectangleType,setRectangleType]=useState('Prato');
  const [borderStart,setBorderStart]=useState(null);
  useEffect(()=>{setPanMode(false);setGesture(null);setSelection(null);setBorderStart(null);setRollStart(null);},[drawMode]);
  const chooseTool=mode=>{onCancelOffcut();setPanMode(false);setDrawMode(mode);editor.onToolChange?.(mode);setCanvasMessage('');};
  const hitObject=p=>{
    const ordered=[...areas].reverse();
    for(const a of ordered.filter(a=>a.kind==='exclusion'||a.kind==='paving')) if(a.closed&&pointInPolygon(p,a.points)) return {type:'area',areaId:a.id,original:a};
    for(const a of ordered) for(let i=(a.rolls||[]).length-1;i>=0;i--) if(pointInPolygon(p,getRollCorners(a.rolls[i]))) return {type:'roll',areaId:a.id,index:i,original:a.rolls[i]};
    for(const a of ordered) if(a.closed&&pointInPolygon(p,a.points)) return {type:'area',areaId:a.id,original:a};
    return null;
  };
  const [dragging, setDragging] = useState(null);
  const [selectedVertices, setSelectedVertices] = useState(new Set());
  const [canvasW, setCanvasW] = useState(760);
  const [zoom, setZoom] = useState(1);
  const [rollStart, setRollStart] = useState(null);
  const [canvasMessage, setCanvasMessage] = useState("");
  const [gridStep, setGridStep] = useState(DEFAULT_GRID_STEP);
  const [canvasH, setCanvasH] = useState(600);
  const [view, setView] = useState({ x: 48, y: 48 });
  const [panMode, setPanMode] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showRollLabels, setShowRollLabels] = useState(true);
  const fitDrawing = () => {
    const pts = [...areas.flatMap(a => [...(a.points || []), ...(a.rolls || []).flatMap(getRollCorners)]), ...(editor.borderSegments||[]).flatMap(s=>[s.a,s.b])];
    if (!pts.length) return;
    const bb = polyBBox(pts);
    const scale = Math.min((canvasW - 140) / Math.max(bb.w, 1), (canvasH - 140) / Math.max(bb.h, 1));
    const z = Math.max(0.1, Math.min(5, scale / BASE_PX));
    setZoom(z); setView({ x: (canvasW - bb.w * BASE_PX * z) / 2 - bb.minX * BASE_PX * z, y: (canvasH - bb.h * BASE_PX * z) / 2 - bb.minY * BASE_PX * z });
  };
  const PX = BASE_PX * zoom;
  const GRID = gridStep;

  const snap = v => Math.round(v / GRID) * GRID;
  const toM = px => snap(px / PX);
  const toPx = m => m * PX;
  const totalRollMeters = useMemo(
    () => (Array.isArray(rolls) ? rolls.reduce((sum, roll) => sum + (Number(roll.length) || 0), 0) : 0),
    [rolls],
  );
  const areaEntries = Array.isArray(areas) ? areas : [];
  const inactiveAreas = areaEntries.filter((area) => area.id !== activeAreaId && Array.isArray(area.points) && area.points.length);
  const activeAreaIndex = Math.max(0, areaEntries.findIndex((area) => area.id === activeAreaId));
  const activeAreaEntry = areaEntries[activeAreaIndex] || null;
  const activeAreaKind = activeAreaEntry?.kind || "turf";

  useEffect(() => {
    if (!containerRef.current) return;

    const updateCanvasW = () => {
      const w = Math.max(280, Math.floor(containerRef.current?.offsetWidth || 0));
      if (w > 0) setCanvasW(w);
      setCanvasH(Math.max(360, Math.floor(window.innerHeight - (canvasRef.current?.getBoundingClientRect().top || 240) - 24)));
    };

    updateCanvasW();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateCanvasW);
      observer.observe(containerRef.current);
      window.addEventListener("resize", updateCanvasW);
      return () => { observer.disconnect(); window.removeEventListener("resize", updateCanvasW); };
    }

    window.addEventListener("resize", updateCanvasW);
    return () => window.removeEventListener("resize", updateCanvasW);
  }, []);

  useEffect(() => {
    if (!closed && drawMode === "roll") {
      setDrawMode("shape");
      setRollStart(null);
      setCanvasMessage("");
    }
  }, [closed, drawMode]);

  useEffect(() => {
    if (activeAreaKind !== "turf" && drawMode === "roll") {
      setDrawMode("shape");
      setRollStart(null);
    }
  }, [activeAreaKind, drawMode]);

  useEffect(() => {
    if(pendingOffcut) {setPanMode(false);setRollStart(null);setCanvasMessage("");}
  },[pendingOffcut]);
  useEffect(() => {
    const cancel=e=>{if(e.key!=="Escape")return;
      if(pendingOffcut)onCancelOffcut();
      setGesture(null);setBorderStart(null);setRollStart(null);setCanvasMessage('Operazione annullata');resetPointerState();
    };
    window.addEventListener("keydown",cancel);return()=>window.removeEventListener("keydown",cancel);
  },[pendingOffcut,onCancelOffcut]);
  const getPos = e => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const x = (e.clientX - r.left - c.clientLeft) * c.width / c.clientWidth;
    const y = (e.clientY - r.top - c.clientTop) * c.height / c.clientHeight;
    return { mx: toM(x - view.x), my: toM(y - view.y) };
  };

  const resetPointerState = () => {
    pointerStateRef.current = { pointerId: null, mode: "", start: null, moved: false };
  };

  const handleCanvasTap = ({ x: mx, y: my }) => {
    if(pendingOffcut) {
      const check=plannerOffcutPlacement(areas,pendingOffcut,mx,my);
      setCanvasMessage(check.reason);
      if(check.valid) onPlaceOffcut(mx,my);
      return;
    }
    if(drawMode==='select'||drawMode==='rectangle') return;
    if(drawMode==='border') {
      if(!borderStart){setBorderStart({x:mx,y:my});return;}
      if(Math.hypot(mx-borderStart.x,my-borderStart.y)>0) editor.onAddBorder?.(borderStart,{x:mx,y:my});
      setBorderStart(null);return;
    }
    if (drawMode === "roll" && closed) {
      if (!rollStart) {
        setRollStart({ x: mx, y: my });
        setCanvasMessage("Punto iniziale fissato. Clicca il punto finale del rotolo.");
        return;
      }
      const nextRoll = createManualRollFromSegment(rollStart, { x: mx, y: my });
      if (!nextRoll) {
        setCanvasMessage("Seleziona una lunghezza valida per il rotolo.");
        setRollStart(null);
        return;
      }
      nextRoll.length = clamp(snap(nextRoll.length), MANUAL_ROLL_MIN_LENGTH_M, MANUAL_ROLL_MAX_LENGTH_M);
      const dx = Math.cos(nextRoll.angle) * (nextRoll.length / 2);
      const dy = Math.sin(nextRoll.angle) * (nextRoll.length / 2);
      nextRoll.cx = rollStart.x + dx;
      nextRoll.cy = rollStart.y + dy;
      setRolls(prev => [...prev, nextRoll]);
      setRollStart(null);
      setCanvasMessage(`Rotolo inserito: 2.00m × ${fmt(nextRoll.length, 2)}m.`);
      return;
    }

    if (closed && dragging === null) return;
    if (points.length > 2) {
      if (Math.hypot(mx - points[0].x, my - points[0].y) < 0.7) {
        setClosed(true);
        return;
      }
    }
    setPoints(prev => [...prev, { x: mx, y: my }]);
  };

  const handlePointerMove = e => {
    const state = pointerStateRef.current;
    if (state.mode === "pan" && state.pointerId === e.pointerId) {
      setView({ x: state.view.x + (e.clientX - state.screen.x) * canvasW / canvasRef.current.clientWidth, y: state.view.y + (e.clientY - state.screen.y) * canvasH / canvasRef.current.clientHeight });
      return;
    }
    const { mx, my } = getPos(e);
    setHoverPt({ x: mx, y: my });
    const pointerState = pointerStateRef.current;
    if (pointerState.pointerId !== e.pointerId) return;
    if (pointerState.start && Math.hypot(mx - pointerState.start.x, my - pointerState.start.y) > 0.08) {
      pointerState.moved = true;
    }
    if(['object','rectangle','circle'].includes(pointerState.mode)) {
      setGesture({...pointerState,end:{x:mx,y:my}});return;
    }
    if (pointerState.mode === "drag" && dragging !== null && closed) {
      setPoints(prev => prev.map((p, i) => i === dragging ? { x: mx, y: my } : p));
    }
  };

  const handlePointerDown = e => {
    if (panMode || e.button === 1) {
      pointerStateRef.current = { pointerId: e.pointerId, mode: "pan", view, screen: { x: e.clientX, y: e.clientY } };
      canvasRef.current?.setPointerCapture?.(e.pointerId); e.preventDefault(); return;
    }
    if (typeof e.button === "number" && e.button !== 0) return;
    const { mx, my } = getPos(e);
    setHoverPt({ x: mx, y: my });
    if(!pendingOffcut && ['select','rectangle','circle'].includes(drawMode)) {
      const target=drawMode==='select'?hitObject({x:mx,y:my}):null;
      setSelection(target);
      if(target) editor.onSelectArea?.(target.areaId);
      const state={pointerId:e.pointerId,mode:(drawMode==='rectangle'||drawMode==='circle')?drawMode:'object',target,start:{x:mx,y:my},end:{x:mx,y:my},moved:false};
      pointerStateRef.current=state;setGesture(state);canvasRef.current?.setPointerCapture?.(e.pointerId);e.preventDefault();return;
    }
    if (!pendingOffcut && drawMode === "shape" && closed) {
      const idx = points.findIndex(p => Math.hypot(p.x - mx, p.y - my) < 0.6);
      if (idx >= 0) {
        pointerStateRef.current = { pointerId: e.pointerId, mode: "drag", start: { x: mx, y: my }, moved: false };
        setDragging(idx);
        canvasRef.current?.setPointerCapture?.(e.pointerId);
        e.preventDefault();
        return;
      }
    }
    pointerStateRef.current = { pointerId: e.pointerId, mode: "tap", start: { x: mx, y: my }, moved: false };
  };

  const handlePointerUp = e => {
    const pointerState = pointerStateRef.current;
    if (pointerState.pointerId !== e.pointerId) return;
    const { mx, my } = getPos(e);
    if(pointerState.mode==='object' && pointerState.target && pointerState.moved) {
      editor.onMove?.(pointerState.target,mx-pointerState.start.x,my-pointerState.start.y);
    } else if(pointerState.mode==='rectangle') {
      const pts=plannerRectangle(pointerState.start,{x:mx,y:my});
      if(pts.length) {editor.onRectangle?.(pts,rectangleType);setDrawMode('select');}
    } else if(pointerState.mode==='circle') {
      const pts=plannerCircle(pointerState.start,{x:mx,y:my});
      if(pts.length) {editor.onRectangle?.(pts,rectangleType);setDrawMode('select');}
    }
    setGesture(null);
    if (pointerState.mode === "drag" && !pointerState.moved && closed && drawMode === "shape") {
      const idx = points.findIndex(p => Math.hypot(p.x - mx, p.y - my) < 0.6);
      if (idx >= 0) {
        setSelectedVertices(prev => {
          const next = new Set(prev);
          if (next.has(idx)) next.delete(idx); else next.add(idx);
          return next;
        });
      }
    } else if (pointerState.mode === "tap") {
      handleCanvasTap({ x: mx, y: my });
    }
    setDragging(null);
    canvasRef.current?.releasePointerCapture?.(e.pointerId);
    resetPointerState();
  };

  const handlePointerCancel = e => {
    setGesture(null);
    if (pointerStateRef.current.pointerId === e.pointerId) {
      canvasRef.current?.releasePointerCapture?.(e.pointerId);
      resetPointerState();
    }
    setHoverPt(null);
    setDragging(null);
  };

  const reset = () => {
    setPoints([]);
    setClosed(false);
    setDragging(null);
    setSelectedVertices(new Set());
    setRollStart(null);
    setDrawMode("shape");
    setCanvasMessage("");
    setRolls([]);
    resetPointerState();
  };

  const removeLastRoll = () => {
    setRolls(prev => prev.slice(0, -1));
    setCanvasMessage("Ultimo rotolo rimosso.");
  };

  const clearRolls = () => {
    setRolls([]);
    setCanvasMessage("Layout rotoli azzerato.");
  };

  const duplicateLastRoll = () => {
    if (!closed || !rolls.length) return;
    const lastRoll = rolls[rolls.length - 1];
    const preferredDirection = getPreferredParallelDuplicationDirection(lastRoll, rolls);
    const candidates = [
      buildAdjacentRollCandidate(lastRoll, preferredDirection),
      buildAdjacentRollCandidate(lastRoll, preferredDirection * -1),
    ].filter(Boolean);
    if (!candidates.length) {
      setCanvasMessage("Non riesco a duplicare questo rotolo.");
      return;
    }
    const bestCandidate = candidates
      .map(candidate => ({
        candidate,
        score: scoreRollPlacementCandidate(candidate, points, rolls),
      }))
      .sort((left, right) => right.score - left.score)[0]?.candidate;
    if (!bestCandidate) {
      setCanvasMessage("Non trovo una replica parallela utile.");
      return;
    }
    setRolls(prev => [...prev, bestCandidate]);
    setDrawMode("roll");
    setRollStart(null);
    setCanvasMessage(`Rotolo duplicato in parallelo mantenendo la fila: 2.00m × ${fmt(bestCandidate.length, 2)}m.`);
  };

  const undoLastPoint = () => {
    if (closed) {
      setClosed(false);
      setDrawMode("shape");
      setCanvasMessage("Perimetro riaperto.");
      return;
    }
    if (!points.length) return;
    setPoints(prev => prev.slice(0, -1));
    setCanvasMessage("Ultimo vertice rimosso.");
  };

  const closeShape = () => {
    if (closed || points.length < 3) return;
    setClosed(true);
    setCanvasMessage("Perimetro chiuso.");
  };

  const reopenShape = () => {
    if (!closed) return;
    setClosed(false);
    setDrawMode("shape");
    setRollStart(null);
    setCanvasMessage("Perimetro riaperto per nuove modifiche.");
  };

  const smoothCorners = () => {
    if (points.length < 3) return;
    if (selectedVertices.size === 0) {
      setCanvasMessage("Seleziona un vertice prima di smussare l'angolo.");
      return;
    }
    const radius = GRID * 3;
    const smoothed = [];
    const n = points.length;
    const targets = selectedVertices;
    let smoothedCount = 0;
    for (let i = 0; i < n; i++) {
      if (targets && !targets.has(i)) { smoothed.push(points[i]); continue; }
      const prev = points[(i - 1 + n) % n];
      const curr = points[i];
      const next = points[(i + 1) % n];
      const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
      const offset = Math.min(radius, d1 / 3, d2 / 3);
      if (offset < GRID * 0.5) { smoothed.push(curr); continue; }
      const ux1 = (prev.x - curr.x) / d1, uy1 = (prev.y - curr.y) / d1;
      const ux2 = (next.x - curr.x) / d2, uy2 = (next.y - curr.y) / d2;
      const p1 = { x: snap(curr.x + ux1 * offset), y: snap(curr.y + uy1 * offset) };
      const p2 = { x: snap(curr.x + ux2 * offset), y: snap(curr.y + uy2 * offset) };
      const mid = { x: snap((p1.x + p2.x) / 2 + (curr.x - (p1.x + p2.x) / 2) * 0.3), y: snap((p1.y + p2.y) / 2 + (curr.y - (p1.y + p2.y) / 2) * 0.3) };
      smoothed.push(p1, mid, p2);
      smoothedCount++;
    }
    setPoints(smoothed);
    setSelectedVertices(new Set());
    if (!closed && smoothed.length >= 3) setClosed(true);
    setCanvasMessage(targets
      ? `${smoothedCount} angoli smussati su ${targets.size} selezionati.`
      : `Tutti gli angoli smussati: ${n} vertici → ${smoothed.length} vertici.`);
  };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = "#fcfdff"; ctx.fillRect(0, 0, canvasW, canvasH);
    // The visible mesh stays legible independently from the snap increment.
    let visibleStep = GRID;
    while (visibleStep * PX < 18) visibleStep *= 2;
    const mesh = visibleStep * PX;
    ctx.strokeStyle = "#dce4ed"; ctx.lineWidth = 1;
    for (let x = ((view.x % mesh) + mesh) % mesh; x < canvasW; x += mesh) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke(); }
    for (let y = ((view.y % mesh) + mesh) % mesh; y < canvasH; y += mesh) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke(); }
    const major = mesh * 5;
    ctx.fillStyle = "#53667c"; ctx.font = "10px monospace";
    ctx.strokeStyle = "#b9c8d8";
    for (let x = ((view.x % major) + major) % major; x < canvasW; x += major) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke(); ctx.fillText(((x-view.x)/PX).toFixed(1), x+3, 12); }
    for (let y = ((view.y % major) + major) % major; y < canvasH; y += major) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke(); ctx.fillText(((y-view.y)/PX).toFixed(1), 3, y-3); }
    ctx.save(); ctx.translate(view.x, view.y);
    const occupied = [];
    const labelQueue = [];
    const rollBox=roll=>{
      const pts=getRollCorners(roll),xs=pts.map(p=>toPx(p.x)),ys=pts.map(p=>toPx(p.y));
      const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
      return {x:(left+right)/2,y:(top+bottom)/2,w:right-left,h:bottom-top};
    };
    // Reserve the footprint for every label, not just the piece's own caption.
    const protectedPieces=areas.flatMap(a=>a.rolls||[])
      .filter(r=>r.sourceRollId || Math.min(r.width||2,r.length)*PX<28).map(rollBox);
    const drawLabelPill = (...args) => labelQueue.push(args);
    const renderLabelPill = (text, cx, cy, opts = {}) => {
      const { font = "bold 10px sans-serif", textColor = "#1a3d24", bg = "rgba(255,255,255,0.93)", r = 5, px: px2 = 6, py: py2 = 4, shortText = null } = opts;
      ctx.font = font;
      const anchor={x:cx,y:cy};
      const roll=opts.roll;
      const angle=roll?.angle||0;
      const measure=(t)=>{
        const tw=ctx.measureText(t).width;
        const w2=tw+px2*2, h2=14+py2;
        const ok=roll && w2*Math.abs(Math.cos(angle))+h2*Math.abs(Math.sin(angle))+8<=roll.length*PX
          && w2*Math.abs(Math.sin(angle))+h2*Math.abs(Math.cos(angle))+8<=(roll.width||2)*PX;
        return {w:w2,h:h2,fits:ok};
      };
      let m=measure(text);
      // Rotolo troppo stretto per l'etichetta completa (numero + misure): prova
      // solo "R{n}" prima di spostare l'etichetta fuori dal rotolo con una linea
      // guida — su piani densi (20+ rotoli) le linee guida si accavallano e non
      // si capisce più a quale rotolo corrisponda quale misura (segnalato
      // dall'utente il 27 set). Le misure complete restano nel riepilogo laterale.
      if(roll && !roll.sourceRollId && !m.fits && shortText){
        const shortM=measure(shortText);
        if(shortM.fits){text=shortText;m=shortM;}
      }
      const {w:bw,h:bh,fits}=m;
      const outside=roll && (roll.sourceRollId || !fits)?rollBox(roll):null;
      const position=plannerLabelPosition(cx,cy,bw,bh,
        {left:4-view.x,right:canvasW-view.x-4,top:18-view.y,bottom:canvasH-view.y-4},
        occupied,protectedPieces,outside);
      if(!position)return;
      cx=position.x;cy=position.y;occupied.push(position);
      if(outside){
        // The leader ends at the caption edge, leaving the small piece uncovered.
        const endX=Math.max(cx-bw/2,Math.min(cx+bw/2,anchor.x));
        const endY=Math.max(cy-bh/2,Math.min(cy+bh/2,anchor.y));
        ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);ctx.lineTo(endX,endY);
        ctx.strokeStyle=textColor;ctx.lineWidth=1;ctx.stroke();
        ctx.beginPath();ctx.arc(anchor.x,anchor.y,2,0,Math.PI*2);ctx.fillStyle=textColor;ctx.fill();
      }
      const bx = cx - bw / 2, by = cy - bh / 2;
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(bx, by, bw, bh, r); }
      else {
        ctx.moveTo(bx + r, by); ctx.lineTo(bx + bw - r, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
        ctx.lineTo(bx + bw, by + bh - r); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
        ctx.lineTo(bx + r, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
        ctx.lineTo(bx, by + r); ctx.quadraticCurveTo(bx, by, bx + r, by); ctx.closePath();
      }
      ctx.fillStyle = bg; ctx.fill();
      ctx.strokeStyle = "rgba(40,90,50,0.18)"; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = textColor; ctx.textAlign = "center"; ctx.fillText(text, cx, cy + 5); ctx.textAlign = "start";
    };

    // Polygon
    inactiveAreas.forEach((area, areaIndex) => {
      const areaPoints = Array.isArray(area.points) ? area.points : [];
      if (!areaPoints.length) return;
      const areaIsPaving = area.kind === "paving";
      if (area.kind === "exclusion") return;
      ctx.beginPath();
      ctx.moveTo(toPx(areaPoints[0].x), toPx(areaPoints[0].y));
      for (let i = 1; i < areaPoints.length; i++) ctx.lineTo(toPx(areaPoints[i].x), toPx(areaPoints[i].y));
      if (area.closed) ctx.closePath();
      if (area.closed) {
        ctx.fillStyle = areaIsPaving ? "rgba(138,109,59,0.18)" : "rgba(34,120,55,0.18)";
        ctx.fill();
      }
      ctx.strokeStyle = area.closed ? (areaIsPaving ? "#8a6d3b" : "#2d7040") : "rgba(61,90,63,0.5)";
      ctx.lineWidth = area.closed ? 2 : 1.5;
      ctx.setLineDash(area.closed ? [] : [6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
      if (area.closed) {
        const areaBb = polyBBox(areaPoints);
        const labelX = toPx(areaBb.minX + (areaBb.w / 2));
        const labelY = toPx(areaBb.minY + (areaBb.h / 2));
        drawLabelPill(`${areaIsPaving ? "▦ " : "🌱 "}Area ${areaIndex + 1}`, labelX, labelY);
      }
    });

    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(toPx(points[0].x), toPx(points[0].y));
      for (let i = 1; i < points.length; i++) ctx.lineTo(toPx(points[i].x), toPx(points[i].y));
      if (!closed && hoverPt) ctx.lineTo(toPx(hoverPt.x), toPx(hoverPt.y));
      if (closed) { ctx.closePath(); ctx.fillStyle = activeAreaKind === "exclusion" ? "#e2e6eb" : activeAreaKind === "paving" ? "rgba(138,109,59,0.26)" : "rgba(34,120,55,0.26)"; ctx.fill(); }
      ctx.strokeStyle = activeAreaKind === "exclusion" ? "#526175" : activeAreaKind === "paving" ? "#8a6d3b" : "#1a5e2f"; ctx.lineWidth = 2.5; ctx.stroke();

      // Anteprima materiali: hatch leggero sul riempimento (verde=prato,
      // legno=pavimentazione), stesso stile delle textures usate nel report.
      if (closed && previewMode && activeAreaKind !== "exclusion") {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(toPx(points[0].x), toPx(points[0].y));
        for (let i = 1; i < points.length; i++) ctx.lineTo(toPx(points[i].x), toPx(points[i].y));
        ctx.closePath();
        ctx.clip();
        const bb = polyBBox(points);
        const x0 = toPx(bb.minX), y0 = toPx(bb.minY), x1 = toPx(bb.minX + bb.w), y1 = toPx(bb.minY + bb.h);
        if (activeAreaKind === "paving") {
          ctx.strokeStyle = "rgba(166,138,84,0.4)"; ctx.lineWidth = 1.4;
          for (let y = y0; y < y1; y += 8) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); }
        } else {
          ctx.strokeStyle = "rgba(45,112,64,0.35)"; ctx.lineWidth = 1;
          const step = 7;
          for (let s = x0 - (y1 - y0); s < x1 + (y1 - y0); s += step) {
            ctx.beginPath(); ctx.moveTo(s, y0); ctx.lineTo(s + (y1 - y0) * 0.35, y1); ctx.stroke();
          }
        }
        ctx.restore();
      }

      // Edge lengths
      const all = [...points]; if (closed) all.push(all[0]);
      for (let i = 0; i < all.length - 1; i++) {
        const ax = toPx(all[i].x), ay = toPx(all[i].y), bx = toPx(all[i + 1].x), by = toPx(all[i + 1].y);
        const len = Math.hypot(all[i + 1].x - all[i].x, all[i + 1].y - all[i].y);
        if (len < 0.01 || !showDimensions) continue;
        const mx2 = (ax + bx) / 2, my2 = (ay + by) / 2;
        const center = polyCenter(points);
        let nx = -(by-ay) / (len*PX), ny = (bx-ax) / (len*PX);
        if (nx*(mx2-toPx(center.x))+ny*(my2-toPx(center.y)) < 0) { nx=-nx; ny=-ny; }
        const dx=nx*28, dy=ny*28;
        ctx.strokeStyle="#64748b"; ctx.lineWidth=0.8;
        ctx.beginPath(); ctx.moveTo(ax+dx,ay+dy); ctx.lineTo(bx+dx,by+dy);
        ctx.moveTo(ax,ay);ctx.lineTo(ax+dx*1.25,ay+dy*1.25);
        ctx.moveTo(bx,by);ctx.lineTo(bx+dx*1.25,by+dy*1.25);ctx.stroke();
        drawLabelPill(fmt(len, 2) + " m", mx2+dx, my2+dy, { font: "11px monospace", px: 5, py: 3 });
      }

      // Overlay bordura: quando lo strumento "Bordura" è attivo, mostra su
      // ogni lato se è incluso nella selezione (evidenziato) o no (grigio
      // tratteggiato) — collega i chip "Lato N" dell'inspector al disegno.
      if (closed && showBorderOverlay) {
        for (let i = 0; i < points.length; i++) {
          const next = points[(i + 1) % points.length];
          const edgeId = `${activeAreaId}-${i}`;
          const borderEdge = borderEdges.find((edge) => edge.id === edgeId);
          if (!borderEdge) continue;
          const isSelected = selectedBorderEdges.includes(edgeId);
          const ax = toPx(points[i].x), ay = toPx(points[i].y), bx = toPx(next.x), by = toPx(next.y);
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = isSelected ? "#8a6d3b" : "rgba(120,120,120,0.55)";
          ctx.lineWidth = isSelected ? 5 : 2;
          ctx.setLineDash(isSelected ? [] : [4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
          const midX = (ax + bx) / 2, midY = (ay + by) / 2;
          const dx = bx - ax, dy = by - ay;
          const nlen = Math.hypot(dx, dy) || 1;
          const offX = (-dy / nlen) * 16, offY = (dx / nlen) * 16;
          drawLabelPill(borderEdge.label || `L${i + 1}`, midX + offX, midY + offY, {
            textColor: isSelected ? "#5a4526" : "#666",
            bg: isSelected ? "rgba(245,239,227,0.96)" : "rgba(255,255,255,0.9)",
          });
        }
      }

      const drawRoll = (roll, index, options = {}) => {
        const corners = getRollCorners(roll);
        if (!corners.length) return;
        const valid = doesRollTouchPolygon(roll, points);
        const fillColor = valid ? (options.preview ? "rgba(21,101,192,0.12)" : "rgba(21,101,192,0.16)") : "rgba(198,40,40,0.14)";
        const strokeColor = valid ? "#1565c0" : B.danger;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(toPx(corners[0].x), toPx(corners[0].y));
        for (let i = 1; i < corners.length; i++) ctx.lineTo(toPx(corners[i].x), toPx(corners[i].y));
        ctx.closePath();
        ctx.fillStyle = fillColor; ctx.fill();
        // Diagonal stripe texture on rolls
        ctx.clip();
        ctx.strokeStyle = valid ? "rgba(21,101,192,0.22)" : "rgba(198,40,40,0.22)";
        ctx.lineWidth = 1; ctx.setLineDash([]);
        const step = 8;
        const [mnX, mnY, mxX, mxY] = [
          Math.min(...corners.map(c => toPx(c.x))), Math.min(...corners.map(c => toPx(c.y))),
          Math.max(...corners.map(c => toPx(c.x))), Math.max(...corners.map(c => toPx(c.y))),
        ];
        for (let s = mnX - (mxY - mnY); s < mxX + (mxY - mnY); s += step) {
          ctx.beginPath(); ctx.moveTo(s, mnY); ctx.lineTo(s + (mxY - mnY), mxY); ctx.stroke();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(toPx(corners[0].x), toPx(corners[0].y));
        for (let i = 1; i < corners.length; i++) ctx.lineTo(toPx(corners[i].x), toPx(corners[i].y));
        ctx.closePath();
        ctx.strokeStyle = strokeColor;
        ctx.setLineDash(options.preview ? [5, 4] : []);
        ctx.lineWidth = options.preview ? 1.8 : 2;
        ctx.stroke(); ctx.setLineDash([]);

        if (options.preview || showRollLabels) {
          const labelText = options.preview
            ? `Preview ${fmt(roll.length, 2)}m`
            : `R${index + 1}${roll.sourceRollId ? " recuperato" : ""} · ${fmt(roll.width || 2, 2)}×${fmt(roll.length, 2)}m`;
          drawLabelPill(labelText, toPx(roll.cx), toPx(roll.cy), {
            roll,
            shortText: options.preview ? null : `R${index + 1}`,
            textColor: valid ? "#0d47a1" : B.danger,
            bg: valid ? "rgba(235,244,255,0.96)" : "rgba(255,235,235,0.96)",
          });
        }
      };

      (rolls || []).forEach((roll, index) => drawRoll(roll, index));

      if (drawMode === "roll" && closed && rollStart && hoverPt) {
        const previewRoll = createManualRollFromSegment(rollStart, hoverPt);
        if (previewRoll) {
          previewRoll.length = clamp(snap(previewRoll.length), MANUAL_ROLL_MIN_LENGTH_M, MANUAL_ROLL_MAX_LENGTH_M);
          const dx = Math.cos(previewRoll.angle) * (previewRoll.length / 2);
          const dy = Math.sin(previewRoll.angle) * (previewRoll.length / 2);
          previewRoll.cx = rollStart.x + dx;
          previewRoll.cy = rollStart.y + dy;
          drawRoll(previewRoll, rolls.length, { preview: true });
        }
      }

      // Vertices
      points.forEach((p, i) => {
        const px = toPx(p.x), py = toPx(p.y);
        const isSelected = selectedVertices.has(i);
        const isFirst = i === 0;
        const r = closed ? 7 : (isFirst ? 7 : 5);
        // Outer glow for selected
        if (isSelected) {
          ctx.beginPath(); ctx.arc(px, py, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,214,0,0.18)"; ctx.fill();
        }
        // First-point pulse ring when open (invite to close)
        if (!closed && isFirst && points.length > 2 && hoverPt && Math.hypot(hoverPt.x - points[0].x, hoverPt.y - points[0].y) < 0.7) {
          ctx.beginPath(); ctx.arc(px, py, r + 8, 0, Math.PI * 2);
          ctx.strokeStyle = B.accent; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
        }
        // Main dot
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? "#ffd600" : (isFirst && !closed ? B.accent : "#1a5e2f"); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 2; ctx.stroke();
        // Vertex number pill (closed state)
        if (closed) {
          drawLabelPill("" + (i + 1), px, py, {
            font: "bold 9px sans-serif",
            textColor: isSelected ? "#5d4000" : "#fff",
            bg: isSelected ? "#ffd600" : "#1a5e2f",
            r: 4, px: 4, py: 2,
          });
        }
      });
    }

    // Preserve roll visibility when a different object is selected.
    inactiveAreas.forEach((a, ai) => (a.rolls || []).forEach((roll, ri) => {
      const corners=getRollCorners(roll);
      ctx.beginPath(); corners.forEach((p,i)=>i?ctx.lineTo(toPx(p.x),toPx(p.y)):ctx.moveTo(toPx(p.x),toPx(p.y)));ctx.closePath();
      ctx.fillStyle="rgba(21,101,192,.12)";ctx.fill();ctx.strokeStyle="#3978ae";ctx.lineWidth=1.5;ctx.stroke();
      if (showRollLabels) drawLabelPill(`${a.label || "Area "+(ai+1)} · R${ri+1}${roll.sourceRollId ? " recuperato" : ""}`,toPx(roll.cx),toPx(roll.cy),{roll,textColor:"#17466e"});
    }));
    // Obstacles remain visible above turf and roll previews, regardless of selection.
    [...inactiveAreas, { ...activeAreaEntry, points, closed }].filter(a => a.kind === "exclusion" && a.closed && a.points.length >= 3).forEach(a => {
      ctx.beginPath();
      a.points.forEach((p, i) => i ? ctx.lineTo(toPx(p.x), toPx(p.y)) : ctx.moveTo(toPx(p.x), toPx(p.y)));
      ctx.closePath(); ctx.fillStyle = "#e2e6eb"; ctx.fill();
      ctx.strokeStyle = "#526175"; ctx.lineWidth = 2; ctx.setLineDash([6, 3]); ctx.stroke(); ctx.setLineDash([]);
      const center = polyCenter(a.points);
      drawLabelPill(a.label || "Esclusione", toPx(center.x), toPx(center.y), { textColor: "#344154" });
      if (a.id === activeAreaId) a.points.forEach(p => { ctx.beginPath(); ctx.arc(toPx(p.x), toPx(p.y), 5, 0, Math.PI * 2); ctx.fillStyle = "#526175"; ctx.fill(); });
    });

    if (points.length === 0) {
      // Empty state hint
      const cx = canvasW / 2 - view.x, cy = canvasH / 2 - view.y;
      ctx.save();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(cx - 170, cy - 30, 340, 56, 10);
      else ctx.rect(cx - 170, cy - 30, 340, 56);
      ctx.fillStyle = "rgba(255,255,255,0.82)"; ctx.fill();
      ctx.strokeStyle = "rgba(40,90,50,0.15)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
      ctx.fillStyle = "#1a3d24"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(drawMode === "rectangle" ? "Trascina per disegnare il rettangolo" : drawMode === "circle" ? "Clicca al centro e trascina per il raggio" : drawMode === "border" ? "Clicca A, poi B per tracciare una bordura" : "Clicca per posizionare i vertici del giardino", cx, cy - 8);
      ctx.fillStyle = "#5a7a5a"; ctx.font = "11px sans-serif";
      ctx.fillText(`Griglia = ${fmt(GRID, 2)} m · ${drawMode === "rectangle" || drawMode === "circle" ? "Misure in tempo reale" : drawMode === "border" ? "Lunghezza in metri" : "Chiudi l’area sul punto 1"}`, cx, cy + 14);
      ctx.textAlign = "start";
    }
    if(pendingOffcut) {
      const sourceCorners=getRollCorners(pendingOffcut.piece);
      ctx.beginPath();sourceCorners.forEach((p,i)=>i?ctx.lineTo(toPx(p.x),toPx(p.y)):ctx.moveTo(toPx(p.x),toPx(p.y)));ctx.closePath();
      ctx.fillStyle="rgba(245,158,11,.35)";ctx.fill();ctx.strokeStyle="#b45309";ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
      if(hoverPt) {
        const check=plannerOffcutPlacement(areas,pendingOffcut,hoverPt.x,hoverPt.y);
        const corners=getRollCorners({...pendingOffcut.piece,cx:hoverPt.x,cy:hoverPt.y});
        ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(toPx(p.x),toPx(p.y)):ctx.moveTo(toPx(p.x),toPx(p.y)));ctx.closePath();
        ctx.fillStyle=check.valid?"rgba(16,185,129,.35)":"rgba(239,68,68,.25)";ctx.fill();ctx.strokeStyle=check.valid?"#047857":"#dc2626";ctx.lineWidth=3;ctx.stroke();
        drawLabelPill(check.valid?"Clicca per posare":"Zona non disponibile",toPx(hoverPt.x),toPx(hoverPt.y),{textColor:check.valid?"#047857":"#b91c1c"});
      }
    }
    const outline=(pts,color='#2563eb')=>{
      if(!pts.length)return;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(toPx(p.x),toPx(p.y)):ctx.moveTo(toPx(p.x),toPx(p.y)));ctx.closePath();ctx.fillStyle='rgba(59,130,246,.15)';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.stroke();ctx.setLineDash([]);
    };
    if(selection && !gesture){const a=areas.find(a=>a.id===selection.areaId);if(a)outline(selection.type==='roll'&&a.rolls[selection.index]?getRollCorners(a.rolls[selection.index]):a.points);}
    if(gesture?.mode==='object'&&gesture.target){const t=gesture.target,dx=gesture.end.x-gesture.start.x,dy=gesture.end.y-gesture.start.y;
      outline((t.type==='roll'?getRollCorners(t.original):t.original.points).map(p=>({x:p.x+dx,y:p.y+dy})));
      drawLabelPill(`Sposta · Δ ${fmt(dx,2)} / ${fmt(dy,2)} m`,toPx(gesture.end.x),toPx(gesture.end.y)-22);
    }
    if(gesture?.mode==='rectangle'){
      outline(plannerRectangle(gesture.start,gesture.end));
      drawLabelPill(`${rectangleType} · ${fmt(Math.abs(gesture.end.x-gesture.start.x),2)} × ${fmt(Math.abs(gesture.end.y-gesture.start.y),2)} m`,toPx(gesture.end.x),toPx(gesture.end.y)-22);
    }
    if(gesture?.mode==='circle'){
      outline(plannerCircle(gesture.start,gesture.end));
      const radius=Math.hypot(gesture.end.x-gesture.start.x,gesture.end.y-gesture.start.y);
      drawLabelPill(`${rectangleType} · Ø ${fmt(radius*2,2)} m`,toPx(gesture.end.x),toPx(gesture.end.y)-22);
    }
    const drawBorder=(a,b,label)=>{ctx.beginPath();ctx.moveTo(toPx(a.x),toPx(a.y));ctx.lineTo(toPx(b.x),toPx(b.y));ctx.strokeStyle='#c2410c';ctx.lineWidth=4;ctx.stroke();
      for(const p of [a,b]){ctx.beginPath();ctx.arc(toPx(p.x),toPx(p.y),4,0,Math.PI*2);ctx.fillStyle='#c2410c';ctx.fill();}
      drawLabelPill(label,toPx((a.x+b.x)/2),toPx((a.y+b.y)/2)-12,{textColor:'#9a3412'});
    };
    (editor.borderSegments||[]).forEach((s,i)=>drawBorder(s.a,s.b,`B${i+1} · ${fmt(Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y),2)} m`));
    if(borderStart&&hoverPt)drawBorder(borderStart,hoverPt,`${fmt(Math.hypot(hoverPt.x-borderStart.x,hoverPt.y-borderStart.y),2)} m`);
    labelQueue.forEach(args => renderLabelPill(...args));
    ctx.restore();
  }, [selection, gesture, rectangleType, borderStart, editor.borderSegments, pendingOffcut, areas, view, showDimensions, showRollLabels, points, hoverPt, closed, canvasW, canvasH, PX, zoom, rolls, drawMode, rollStart, gridStep, selectedVertices, previewMode, activeAreaKind, inactiveAreas, borderEdges, selectedBorderEdges, showBorderOverlay, activeAreaId, activeAreaEntry]);

  return (
    <div ref={containerRef} className="gp-drawing-board">
      <div className="gp-view-tools" role="toolbar" aria-label="Strumenti di disegno">
        <button type="button" aria-pressed={drawMode==='select'&&!panMode} onClick={()=>chooseTool('select')}>Seleziona e sposta</button>
        <button type="button" aria-pressed={drawMode==='shape'&&!panMode} onClick={()=>chooseTool('shape')}>Poligono / vertici</button>
        <button type="button" aria-pressed={drawMode==='rectangle'&&!panMode} onClick={()=>chooseTool('rectangle')}>Rettangolo</button>
        <button type="button" aria-pressed={drawMode==='circle'&&!panMode} onClick={()=>chooseTool('circle')}>Cerchio</button>
        <select aria-label="Tipo elemento" value={rectangleType} onChange={e=>{setRectangleType(e.target.value);chooseTool(drawMode==='circle'?'circle':'rectangle');}}>
          {['Prato','Casetta','Abitazione','Piscina','Patio esistente','Aiuola','Albero','Pavimentazione'].map(t=><option key={t}>{t}</option>)}
        </select>
        <button type="button" aria-pressed={drawMode==='border'&&!panMode} onClick={()=>chooseTool('border')}>Bordura A–B</button>
      </div>
      <div className="gp-view-tools">
        <strong>TAVOLA 01 · PIANTA</strong>
        {pendingOffcut && <button type="button" onClick={onCancelOffcut}>Annulla recupero</button>}
        {editor.canUndoMove && <button type="button" onClick={editor.undoMove}>Annulla spostamento</button>}
        <button type="button" onClick={fitDrawing}>Inquadra tutto</button>
        <button type="button" aria-pressed={panMode} onClick={() => setPanMode(v=>!v)}>{panMode ? "Mano attiva" : "Sposta vista"}</button>
        <button type="button" aria-pressed={showDimensions} onClick={() => setShowDimensions(v=>!v)}>Quote {showDimensions ? "visibili" : "nascoste"}</button>
        <button type="button" aria-pressed={showRollLabels} onClick={() => setShowRollLabels(v=>!v)}>Misure rotoli {showRollLabels ? "visibili" : "nascoste"}</button>
        <button type="button" aria-label="Riduci zoom" onClick={()=>setZoom(z=>Math.max(.1,z/1.25))}>−</button>
        <span>{Math.round(zoom*100)}%</span>
        <button type="button" aria-label="Aumenta zoom" onClick={()=>setZoom(z=>Math.min(5,z*1.25))}>＋</button>
        <span>Metri · snap {gridStep} m</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <div className="gp-canvas-hint" style={{ width: "100%", minHeight: 18, fontSize: 11, color: closed ? B.primary : B.textMuted, fontWeight: 500, lineHeight: 1.35 }}>
          {pendingOffcut ? "RECUPERO SFRIDO · Sposta il puntatore sul prato e clicca per posare. Esc per annullare." : drawMode==='select' ? 'Tocca un elemento e trascinalo. Il contorno blu indica la nuova posizione; rilascia per confermare. Esc annulla.'
          : drawMode==='rectangle' ? 'Premi e trascina da un angolo all’altro: le misure sono in metri. Le casette e gli ostacoli sono esclusi dal prato.'
          : drawMode==='circle' ? 'Premi al centro e trascina per il raggio: utile per alberi, aiuole rotonde e simili. Le misure sono in metri.'
          : drawMode==='border' ? 'Clicca il punto A, poi il punto B. Puoi tracciare anche porzioni di un lato. Esc annulla.'
          : drawMode === "roll"
            ? `Modalità rotoli: click inizio + click fine. Larghezza fissa ${MANUAL_ROLL_WIDTH_M}m, lunghezza max ${MANUAL_ROLL_MAX_LENGTH_M}m.`
            : closed
              ? (selectedVertices.size > 0
                ? `${selectedVertices.size} vertici selezionati — clicca Smussa per arrotondare solo questi angoli`
                : "Area chiusa — trascina i vertici per spostare, clicca per selezionare e smussare")
              : points.length === 0
                ? "Clicca per posizionare il primo vertice"
                : "Clicca per aggiungere vertici · Chiudi sul punto 1"}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          {/* Perimetro/Aggiungi rotolo si scelgono dal rail (Disegna/Rotolo)
              — qui solo le azioni dirette sul disegno, per non duplicare
              controlli e restare semplici per chi non è pratico dello
              strumento. Formato/tipo area e picker mattonella sono
              nell'inspector (strumento "Pavimentazione" nel rail). */}
          {drawMode === "shape" && <>
          <button
            type="button"
            onClick={closed ? reopenShape : undoLastPoint}
            disabled={closed ? false : !points.length}
            style={{
              padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11,
              cursor: closed || points.length ? "pointer" : "not-allowed", color: closed || points.length ? B.text : B.textMuted, opacity: closed || points.length ? 1 : 0.55,
            }}
          >
            {closed ? "Modifica" : "Annulla punto"}
          </button>
          <button
            type="button"
            onClick={closeShape}
            disabled={closed || points.length < 3}
            style={{
              padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11,
              cursor: !closed && points.length >= 3 ? "pointer" : "not-allowed", color: !closed && points.length >= 3 ? B.text : B.textMuted, opacity: !closed && points.length >= 3 ? 1 : 0.55,
            }}
          >
            Chiudi perimetro
          </button>
          <button
            type="button"
            onClick={smoothCorners}
            disabled={points.length < 3}
            style={{
              padding: "3px 10px", borderRadius: 4, fontSize: 11,
              cursor: points.length >= 3 ? "pointer" : "not-allowed",
              border: selectedVertices.size > 0 ? "1.5px solid " + B.accent : "1px solid " + B.border,
              background: selectedVertices.size > 0 ? "#fffde7" : B.white,
              color: points.length >= 3 ? B.text : B.textMuted,
              opacity: points.length >= 3 ? 1 : 0.55,
              fontWeight: selectedVertices.size > 0 ? 700 : 500,
            }}
          >
            {selectedVertices.size > 0 ? `Smussa ${selectedVertices.size} punti` : "Smussa angoli"}
          </button>
          </>}
          {drawMode === "roll" && (
            <>
              <button
                type="button"
                onClick={removeLastRoll}
                disabled={!rolls.length}
                style={{
                  padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11,
                  cursor: rolls.length ? "pointer" : "not-allowed", color: rolls.length ? B.text : B.textMuted, opacity: rolls.length ? 1 : 0.55,
                }}
              >
                Rimuovi ultimo rotolo
              </button>
              <button
                type="button"
                onClick={duplicateLastRoll}
                disabled={!closed || !rolls.length}
                style={{
                  padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11,
                  cursor: closed && rolls.length ? "pointer" : "not-allowed", color: closed && rolls.length ? B.text : B.textMuted, opacity: closed && rolls.length ? 1 : 0.55,
                }}
              >
                Duplica in parallelo
              </button>
              <button
                type="button"
                onClick={clearRolls}
                disabled={!rolls.length}
                style={{
                  padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11,
                  cursor: rolls.length ? "pointer" : "not-allowed", color: rolls.length ? B.text : B.textMuted, opacity: rolls.length ? 1 : 0.55,
                }}
              >
                Azzera rotoli
              </button>
            </>
          )}
          <button onClick={reset} style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11, cursor: "pointer", color: B.text }}>Ricomincia</button>
          <span style={{ width: 1, alignSelf: "stretch", background: B.borderLight, margin: "0 2px" }} />
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: B.textMuted }}>
            Zoom
            <select value={zoom} onChange={(e) => setZoom(Number(e.target.value))} style={{ padding: "3px 4px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11, color: B.text }}>
              {[...new Set([0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, zoom])].sort((a,b)=>a-b).map((z) => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}
            </select>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: B.textMuted }}>
            Aggancio
            <select value={gridStep} onChange={(e) => setGridStep(Number(e.target.value))} style={{ padding: "3px 4px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11, color: B.text }}>
              {GRID_STEPS.map((s) => <option key={s} value={s}>{s.toFixed(2)}m</option>)}
            </select>
          </label>
        </div>
      </div>
      {/* Aree multiple: gestite dalla striscia GpAreaStrip sopra il canvas
          (stessi onSelectArea/onAddArea/onRemoveArea), non più duplicate qui. */}
      <canvas ref={canvasRef} width={canvasW} height={canvasH}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={e=>{if(pointerStateRef.current.pointerId===null)setHoverPt(null);}}
        style={{
          width: "100%",
          height: canvasH,
          borderRadius: 10,
          border: "1.5px solid " + (closed ? B.primary : B.border),
          cursor: panMode ? "grab" : drawMode === "select" ? "move" : ["rectangle","circle","border"].includes(drawMode) ? "crosshair" : pendingOffcut ? "crosshair" : panMode ? "grab" : drawMode === "roll" && closed ? "crosshair" : closed ? (dragging !== null ? "grabbing" : "default") : "crosshair",
          display: "block",
          touchAction: "none",
        }}
      />

      {points.length > 0 && (
        <div style={{ marginTop: 10, padding: "10px 12px", border: "1px solid " + B.borderLight, borderRadius: 8, background: B.white, fontSize: 12, color: B.textMuted }}>
          {drawMode==='select' ? 'Selezione diretta: trascina il rotolo o l’elemento da spostare. Il verso del pelo e le dimensioni restano invariati.'
            : drawMode==='rectangle' ? 'Trascina per disegnare un rettangolo. Le misure seguono l’aggancio alla griglia.'
            : drawMode==='circle' ? 'Trascina dal centro per definire il raggio. Utile per alberi, aiuole rotonde e simili.'
            : drawMode==='border' ? 'Bordure indipendenti: un clic per l’inizio e un clic per la fine di ogni tratto.'
            : drawMode === "roll" && closed
            ? `${rolls.length} rotoli inseriti (${fmt(totalRollMeters, 2)} m lineari). ${canvasMessage || "I rotoli possono uscire dal perimetro per stimare lo scarto reale."}`
            : closed
              ? `${points.length} vertici definiti per Area ${activeAreaIndex + 1}. Per modificare il perimetro trascina i punti direttamente sul disegno.`
              : `${points.length} vertici inseriti per Area ${activeAreaIndex + 1}. Continua a cliccare sul disegno e chiudi il perimetro sul punto iniziale.`}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   UI ATOMS
   ═══════════════════════════════════════════ */
function MetricCard({ label, value, sub, accent, warning }) {
  return (
    <div style={{ background: warning ? B.warnBg : accent ? B.infoBg : B.gray, borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 130, border: "1px solid " + (warning ? "#ffe0b2" : accent ? "#bbdefb" : B.borderLight) }}>
      <div style={{ fontSize: 10, color: B.textMuted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: warning ? B.warn : accent ? B.info : B.dark }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function DimInput({ label, value, onChange, unit }) {
  return (
    <div style={{ flex: 1, minWidth: 100 }}>
      <label style={{ display: "block", fontSize: 11, color: B.textMuted, marginBottom: 4, fontWeight: 500 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input type="number" min={0} step={0.1} value={value ?? ""} onChange={e => onChange(e.target.value)} placeholder="0.0"
          style={{ width: "100%", padding: "9px 12px", paddingRight: unit ? 36 : 12, border: "1.5px solid " + B.border, borderRadius: 8, fontSize: 15, fontWeight: 600, boxSizing: "border-box", color: B.dark, outline: "none" }}
          onFocus={e => e.target.style.borderColor = B.primary} onBlur={e => e.target.style.borderColor = B.border} />
        {unit && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: B.textMuted }}>{unit}</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SECTIONS
   ═══════════════════════════════════════════ */
function ProjectHeader({ info, setInfo }) {
  const upd = (k, v) => setInfo(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 2, minWidth: 180 }}>
        <label style={lbl}>Nome cliente</label>
        <input value={info.client} onChange={e => upd("client", e.target.value)} placeholder="Es. Mario Rossi" style={fieldInp} />
      </div>
      <div style={{ flex: 3, minWidth: 220 }}>
        <label style={lbl}>Indirizzo cantiere</label>
        <input value={info.address} onChange={e => upd("address", e.target.value)} placeholder="Es. Via Roma 1, Milano" style={fieldInp} />
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <label style={lbl}>Data</label>
        <input type="date" value={info.date} onChange={e => upd("date", e.target.value)} style={fieldInp} />
      </div>
      <div style={{ flex: 3, minWidth: 220 }}>
        <label style={lbl}>Note progetto</label>
        <input value={info.notes} onChange={e => upd("notes", e.target.value)} placeholder="Es. Giardino retro con piscina" style={fieldInp} />
      </div>
    </div>
  );
}

function TravelPlanner({ travel, setTravel, cantiereAddress = "", onCantiereAddressChange = () => {} }) {
  const upd = (key, value) => setTravel(prev => ({ ...prev, [key]: value }));
  const travelSummary = getTravelSummary(travel);
  const sectionLabel = { fontSize: 11, fontWeight: 800, color: B.textMuted, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={sectionLabel}>Percorso — calcola km, tempo e caselli in automatico</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Sede di partenza</label>
            <input
              value={travel.departureBase}
              onChange={e => upd("departureBase", e.target.value)}
              placeholder="Es. Orta di Atella"
              style={fieldInp}
            />
          </div>
          <div style={{ minWidth: 0 }}>
            <label style={lbl}>Indirizzo cantiere</label>
            <input
              value={cantiereAddress}
              onChange={e => onCantiereAddressChange(e.target.value)}
              placeholder="Es. Via Roma 1, Milano"
              style={fieldInp}
            />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", borderRadius: 10, background: "#f7f7f2", border: "1px solid " + B.borderLight }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: B.dark }}>
            {travel.routeLoading ? "Calcolo tragitto in corso..." : "Calcolo automatico stile navigatore"}
          </div>
          <div style={{ fontSize: 11, color: B.textMuted, marginTop: 3 }}>
            {travel.routeStatus || "Compila entrambi gli indirizzi qui sopra: km, tempo, carburante e stima caselli si aggiornano da soli."}
          </div>
        </div>
        {travelSummary.baseDriveMinutes > 0 ? (
          <div style={{ padding: "8px 12px", borderRadius: 999, background: B.infoBg, border: "1px solid #bbdefb", color: B.info, fontSize: 12, fontWeight: 700 }}>
            Tempo stimato: {Math.round(travelSummary.driveMinutes)} min {travelSummary.modeShortLabel}
          </div>
        ) : null}
      </div>
      <div>
        <div style={sectionLabel}>Parametri viaggio — calcolati in automatico, modificabili se serve</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <DimInput label="Km tratta" value={travel.kmTotal} onChange={v => upd("kmTotal", v)} unit="km" />
          <DimInput label="Km extra" value={travel.extraKm} onChange={v => upd("extraKm", v)} unit="km" />
          <DimInput label="Consumo medio" value={travel.fuelPer100Km} onChange={v => upd("fuelPer100Km", v)} unit="l/100" />
          <DimInput label="Prezzo carburante" value={travel.fuelPrice} onChange={v => upd("fuelPrice", v)} unit="€/l" />
          <DimInput label="Caselli tratta" value={travel.tollCost} onChange={v => upd("tollCost", v)} unit="€" />
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: B.textMuted, lineHeight: 1.4 }}>
          Usa <strong style={{ color: B.dark }}>Km extra</strong> per sommare viaggi locali, pietrisco, cantiere ↔ albergo o altri spostamenti extra già totali. I km extra incidono sul carburante ma non duplicano i caselli del navigatore.
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: B.dark }}>Modalità viaggio</span>
        {[
          { value: false, label: "Solo andata" },
          { value: true, label: "Andata + ritorno" },
        ].map((option) => {
          const active = travelSummary.isRoundTrip === option.value;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => upd("roundTrip", option.value)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: active ? "2px solid " + B.primary : "1px solid " + B.border,
                background: active ? B.light : B.white,
                color: active ? B.primary : B.text,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {option.label}
            </button>
          );
        })}
        <span style={{ fontSize: 11, color: B.textMuted }}>
          Il navigatore calcola la singola tratta e il planner applica il moltiplicatore scelto.
        </span>
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <MetricCard
          label="Tratta base"
          value={`${fmt(travelSummary.routeKmTotal, 1)} km`}
          accent
          sub={travelSummary.modeLabel}
        />
        <MetricCard
          label="Costo base sede-cantiere"
          value={fmtE(travelSummary.baseTripCost)}
          sub={`${fmt(travelSummary.baseLiters, 1)} l carburante + ${fmtE(travelSummary.tollCost)} caselli`}
        />
        <MetricCard
          label="Km extra"
          value={`${fmt(travelSummary.extraKm, 1)} km`}
          sub={travelSummary.extraKm > 0 ? `${fmtE(travelSummary.extraFuelCost)} carburante extra` : "Nessun extra"}
        />
        <MetricCard
          label="Costo trasferta totale"
          value={fmtE(travelSummary.totalCost)}
          warning={travelSummary.totalCost > 0}
          sub={travelSummary.extraKm > 0
            ? `${fmtE(travelSummary.baseTripCost)} base + ${fmtE(travelSummary.extraFuelCost)} extra`
            : (travel.departureBase ? `${travel.departureBase} · ${travelSummary.modeLabel}` : "Compila la sede di partenza")}
        />
      </div>
    </div>
  );
}

function ShapeInput({
  customPts,
  setCustomPts,
  customClosed,
  setCustomClosed,
  manualRolls,
  setManualRolls,
  plannerAreas = [],
  activeAreaId = "",
  drawMode = "shape",
  setDrawMode = () => {},
  previewMode = false,
  borderEdges = [],
  selectedBorderEdges = [],
  showBorderOverlay = false,
  editor = {},
  pendingOffcut = null, onPlaceOffcut = () => {}, onCancelOffcut = () => {},
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <FreeDrawCanvas
        points={customPts}
        setPoints={setCustomPts}
        closed={customClosed}
        setClosed={setCustomClosed}
        rolls={manualRolls}
        setRolls={setManualRolls}
        areas={plannerAreas}
        activeAreaId={activeAreaId}
        drawMode={drawMode}
        setDrawMode={setDrawMode}
        previewMode={previewMode}
        borderEdges={borderEdges}
        selectedBorderEdges={selectedBorderEdges}
        showBorderOverlay={showBorderOverlay}
        editor={editor}
        pendingOffcut={pendingOffcut} onPlaceOffcut={onPlaceOffcut} onCancelOffcut={onCancelOffcut}
      />
    </div>
  );
}

// Shared by the client drawing and the dimension schedule, including exclusions.
function plannerClientDimensions(polygons) {
  return polygons.flatMap((area,ai)=>(area.points||[]).map((a,i)=>{
    const b=area.points[(i+1)%area.points.length];
    return {id:`A${ai+1}.${i+1}`,areaId:area.id,a,b,length:Math.hypot(b.x-a.x,b.y-a.y),...getEdgeOutwardNormal(a,b,area.points)};
  }).filter(e=>e.length>0.001));
}

function ClientPlanDrawing({polygons,rolls=[],borders=[]}) {
  const W=1000,H=660,pad=110;
  const pts=[...polygons.flatMap(a=>a.points),...rolls.flatMap(getRollCorners),...borders.flatMap(b=>[b.a,b.b])];
  const bb=polyBBox(pts),scale=Math.min((W-pad*2)/Math.max(bb.w,1),(H-pad*2)/Math.max(bb.h,1));
  const ox=(W-bb.w*scale)/2-bb.minX*scale,oy=(H-bb.h*scale)/2-bb.minY*scale;
  const screen=p=>({x:p.x*scale+ox,y:p.y*scale+oy});
  const path=points=>points.map((p,i)=>`${i?'L':'M'}${screen(p).x},${screen(p).y}`).join(' ')+' Z';
  const occupied=[];
  // Il riquadro dell'etichetta veniva verificato contro i bordi del foglio,
  // ma non i due estremi della linea di quota (spostati dallo stesso offset
  // a partire dai VERTICI dell'lato, non dal suo punto medio): su un lato
  // obliquo o vicino a un vertice concavo i due punti finiscono più lontani
  // dal bordo di quanto lo sia l'etichetta, ed escono dal foglio — segnalato
  // dall'utente il 29 set su una pianta reale (tavola "non inquadrata").
  // Restare nel foglio è un vincolo rigido, mai negoziabile. La sovrapposizione
  // con un'altra etichetta invece no: scartare la quota quando nessun offset
  // è privo di sovrapposizioni (comportamento precedente) lascia lati SENZA
  // alcuna misura su forme con molti lati/vertici ravvicinati — segnalato di
  // nuovo dall'utente su una pianta reale a 8 lati, con solo 3 quote su 8
  // visibili: un disegno con metà dei lati non quotati sembra incompleto,
  // più di quanto lo sia una quota leggermente sovrapposta a un'altra. Ora si
  // prova sempre a piazzare l'etichetta nella posizione meno sovrapposta tra
  // quelle sicure per il foglio, invece di ometterla.
  const dimensions=plannerClientDimensions(polygons).map(e=>{
    const a=screen(e.a),b=screen(e.b),m=screen(e.midpoint),w=76,h=22;
    const lineMargin=14;
    let best=null,bestScore=Infinity,bestOffset=30;
    for(const d of [30,54,78,16]){
      const p={x:m.x+e.normal.x*d,y:m.y+e.normal.y*d,w,h};
      if(p.x-w/2<12||p.x+w/2>W-12||p.y-h/2<24||p.y+h/2>H-46)continue;
      const la={x:a.x+e.normal.x*d,y:a.y+e.normal.y*d};
      const lb={x:b.x+e.normal.x*d,y:b.y+e.normal.y*d};
      if(la.x<lineMargin||la.x>W-lineMargin||la.y<lineMargin||la.y>H-lineMargin)continue;
      if(lb.x<lineMargin||lb.x>W-lineMargin||lb.y<lineMargin||lb.y>H-lineMargin)continue;
      const overlapScore=occupied.reduce((sum,o)=>sum+(Math.abs(o.x-p.x)<(o.w+w)/2+5&&Math.abs(o.y-p.y)<(o.h+h)/2+5?1:0),0);
      if(overlapScore<bestScore){ best=p; bestScore=overlapScore; bestOffset=d; if(overlapScore===0) break; }
    }
    if(best) occupied.push(best);
    return {...e,a,b,label:best,offset:bestOffset};
  });
  const bar=[.5,1,2,5,10,20,50].reduce((best,v)=>Math.abs(v*scale-110)<Math.abs(best*scale-110)?v:best,.5);
  return <svg role="img" aria-label="Planimetria quotata del progetto, misure in metri" width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:'block',fontFamily:'Arial, Helvetica, sans-serif',background:'#fff'}}>
    <defs>
      <pattern id="client-plan-grid" width={scale} height={scale} patternUnits="userSpaceOnUse" x={ox} y={oy}><path d={`M ${scale} 0 H 0 V ${scale}`} fill="none" stroke="#e9eef2" strokeWidth=".65"/></pattern>
      <pattern id="client-plan-turf" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#edf4ec"/><path d="M0 8L8 0" stroke="#c4d9c5" strokeWidth=".6"/></pattern>
      <pattern id="client-plan-paving" width="16" height="10" patternUnits="userSpaceOnUse"><rect width="16" height="10" fill="#f3eee5"/><path d="M0 0H16V10H0Z" fill="none" stroke="#c7bda9" strokeWidth=".6"/></pattern>
    </defs>
    <rect x="1" y="1" width={W-2} height={H-2} fill="url(#client-plan-grid)" stroke="#cbd5df"/>
    <text x="20" y="26" fontSize="12" letterSpacing="1.5" fill="#536171">PIANTA DI PROGETTO / UNITÀ: METRI</text>
    {polygons.filter(p=>p.kind!=='exclusion').map(p=><path key={p.id} d={path(p.points)} fill={`url(#client-plan-${p.kind==='paving'?'paving':'turf'})`} stroke="#284b36" strokeWidth="2"/>)}
    {rolls.map((r,i)=><g key={r.id||i}>
      <path d={path(getRollCorners(r))} fill="rgba(52,107,150,.04)" stroke="#467a9e" strokeWidth="1" strokeDasharray={r.sourceRollId?'3 2':undefined}/>
      {Math.min(r.width||2,r.length)*scale>28 && <text x={screen({x:r.cx,y:r.cy}).x} y={screen({x:r.cx,y:r.cy}).y+4} textAnchor="middle" fontSize="12" fill="#315f80">R{i+1}</text>}
    </g>)}
    {polygons.filter(p=>p.kind==='exclusion').map((p,i)=>{const c=screen(polyCenter(p.points));return <g key={p.id}><path d={path(p.points)} fill="#e7ebef" stroke="#526175" strokeWidth="1.6"/><text x={c.x} y={c.y} fontSize="13" textAnchor="middle" fill="#344154">{p.label||`Esclusione ${i+1}`}</text></g>;})}
    {borders.map((b,i)=><path key={b.id||i} d={`M${screen(b.a).x},${screen(b.a).y} L${screen(b.b).x},${screen(b.b).y}`} stroke="#b46527" strokeWidth="3" fill="none"/>)}
    {dimensions.filter(e=>e.label).map(e=>{
      const n=e.normal,d=e.offset,a={x:e.a.x+n.x*d,y:e.a.y+n.y*d},b={x:e.b.x+n.x*d,y:e.b.y+n.y*d};
      // Colore quote allineato al redesign tipografico del preventivo (30 set):
      // terracotta invece del grigio/blu neutro, coerente con --v3-clay usato
      // per la sezione materiali/tecnica in preventivo-v2.html.
      return <g key={e.id} stroke="#a15c3e" strokeWidth=".8">
        <path d={`M${e.a.x+n.x*5},${e.a.y+n.y*5} L${a.x+n.x*6},${a.y+n.y*6} M${e.b.x+n.x*5},${e.b.y+n.y*5} L${b.x+n.x*6},${b.y+n.y*6} M${a.x},${a.y} L${b.x},${b.y}`} fill="none"/>
        {[a,b].map((p,i)=><line key={i} x1={p.x-4} y1={p.y+4} x2={p.x+4} y2={p.y-4} strokeWidth="1.4"/>)}
        <rect x={e.label.x-38} y={e.label.y-11} width="76" height="22" fill="#fff" stroke="none"/>
        <text x={e.label.x} y={e.label.y+5} fontSize="15" fontWeight="600" fill="#243547" stroke="none" textAnchor="middle">{fmt(e.length,2)} m</text>
      </g>;
    })}
    <g transform={`translate(24,${H-25})`} fill="#344154" stroke="#344154">
      <path d={`M0 -5V5 M0 0H${bar*scale} M${bar*scale} -5V5`} fill="none" strokeWidth="1.5"/>
      <text x="0" y="-10" fontSize="11" stroke="none">0</text><text x={bar*scale} y="-10" textAnchor="end" fontSize="11" stroke="none">{bar} m</text>
    </g>
    <text x={W-20} y={H-20} textAnchor="end" fontSize="11" fill="#536171">Scala grafica · Griglia 1 m · Orientamento non georeferenziato</text>
  </svg>;
}

function ClientProjectSheet({polygons,rolls,borders,usage,borderMeters}) {
  const dimensions=plannerClientDimensions(polygons);
  const cell={padding:'10px 12px',borderRight:'1px solid #d3dce3'};
  return <div style={{color:'#243547',fontFamily:'Arial, Helvetica, sans-serif'}}>
    <div className="print-no-break" style={{border:'1px solid #b8c5d0'}}>
      <div style={{display:'flex',justifyContent:'space-between',padding:'9px 12px',borderBottom:'1px solid #b8c5d0',fontSize:11,fontWeight:700,letterSpacing:1}}><span>TAVOLA 01 · PLANIMETRIA QUOTATA</span><span>PROGETTO DI POSA</span></div>
      <ClientPlanDrawing polygons={polygons} rolls={rolls} borders={borders}/>
      <div style={{display:'flex',gap:20,padding:'10px 12px',fontSize:10,borderTop:'1px solid #d3dce3',flexWrap:'wrap'}}>
        <span><b style={{color:'#284b36'}}>▧</b> Prato sintetico</span><span><b style={{color:'#467a9e'}}>─</b> Tagli e rotoli</span><span><b style={{color:'#526175'}}>■</b> Elementi esclusi</span><span><b style={{color:'#b46527'}}>━</b> Bordura</span>
      </div>
    </div>
    <div className="print-no-break" style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',border:'1px solid #b8c5d0',marginTop:12}}>
      {[["PRATO NETTO",`${fmt(usage.netArea,1)} m²`],["MATERIALE INSERITO",`${fmt(usage.material,1)} m²`],["DA COPRIRE",`${fmt(usage.uncovered,1)} m²`],["BORDURA",`${fmt(borderMeters,2)} m`]].map(([label,value])=><div key={label} style={cell}><div style={{fontSize:9,letterSpacing:.6,color:'#536171'}}>{label}</div><div style={{fontSize:20,fontWeight:600,marginTop:5}}>{value}</div></div>)}
    </div>
    <div style={{marginTop:12,borderTop:'2px solid #344154',paddingTop:8}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:.8,marginBottom:7}}>ABACO DELLE QUOTE · METRI</div>
      {polygons.map((p,i)=><div key={p.id} className="print-no-break" style={{display:'flex',gap:12,padding:'6px 0',borderBottom:'1px solid #e1e6eb',fontSize:10,lineHeight:1.6}}>
        <strong style={{minWidth:125}}>A{i+1} · {p.label || (p.kind==='paving'?'Pavimentazione':p.kind==='exclusion'?'Esclusione':'Prato')}</strong>
        <span>{dimensions.filter(e=>e.areaId===p.id).map((e,j)=>`L${j+1}: ${fmt(e.length,2)} m`).join(' · ')}</span>
      </div>)}
    </div>
    <div className="print-no-break" style={{fontSize:10,lineHeight:1.6,marginTop:10,color:'#536171'}}>
      Superfici calcolate al netto delle esclusioni. Le quote si riferiscono alla geometria inserita; verificare le misure in cantiere prima del taglio. I lati sono elencati nell’ordine dei vertici di ciascuna area.
      {usage.uncovered>0.01 && <strong> Layout di posa parziale: {fmt(usage.uncovered,1)} m² ancora da coprire.</strong>}
    </div>
    <div style={{marginTop:14,paddingTop:8,borderTop:'1px solid #b8c5d0',display:'flex',justifyContent:'space-between',fontSize:9,color:'#536171'}}><span>VERTEX SRLS · PRATO SINTETICO ITALIA</span><span>ELABORATO DI PROGETTO · UNITÀ m / m²</span></div>
  </div>;
}

function TechnicalSketch({ shape, dims, customPts, customClosed, customAreas = [], borderSegments = [], manualRolls = [], isClientVariant = false, previewMode = false }) {
  const polygons = shape === "custom"
    ? getPlannerPolygons(customAreas, customPts, customClosed)
    : [{ id: "shape-default", index: 1, points: getShapePolygon(shape, dims), closed: true, rolls: [], kind: "turf" }].filter((item) => item.points.length);
  if (!polygons.length) {
    return (
      <div style={{ padding: "18px 14px", borderRadius: 10, border: "1px dashed " + B.border, color: B.textMuted, fontSize: 12 }}>
        Completa il perimetro per vedere la tavola tecnica 2D.
      </div>
    );
  }
  const rollCornerPoints = (manualRolls || []).flatMap((roll) => getRollCorners(roll));
  const polygonPoints = polygons.flatMap((polygon) => polygon.points);
  const drawingPoints = [...polygonPoints,...rollCornerPoints,...borderSegments.flatMap(s=>[s.a,s.b])];
  const bb = polyBBox(drawingPoints);
  const W = 328;
  const H = 214;
  const pad = 28;
  const safeW = Math.max(bb.w, 0.5);
  const safeH = Math.max(bb.h, 0.5);
  const scale = Math.min((W - pad * 2) / safeW, (H - pad * 2) / safeH);
  const ox = (W - safeW * scale) / 2 - bb.minX * scale;
  const oy = (H - safeH * scale) / 2 - bb.minY * scale;
  const occupiedLabels = [];
  const bounds = { width: W, height: H };
  const hasMultipleAreas = polygons.length > 1;
  const polygonSketches = polygons.map((polygon) => {
    const d = polygon.points.map((p, index) => `${index === 0 ? "M" : "L"}${(p.x * scale + ox).toFixed(2)},${(p.y * scale + oy).toFixed(2)}`).join(" ") + " Z";
    const vertexPoints = polygon.points.map((p) => ({ x: p.x * scale + ox, y: p.y * scale + oy }));
    const center = polyCenter(polygon.points);
    const box = polyBBox(vertexPoints);
    return {
      ...polygon,
      d,
      vertexPoints,
      center: { x: center.x * scale + ox, y: center.y * scale + oy },
      box,
    };
  });
  const rollPaths = (manualRolls || []).map((roll, index) => {
    const corners = getRollCorners(roll);
    const svgCorners = corners.map(corner => ({
      x: corner.x * scale + ox,
      y: corner.y * scale + oy,
    }));
    const path = svgCorners.map((corner, cornerIndex) => `${cornerIndex === 0 ? "M" : "L"}${corner.x.toFixed(2)},${corner.y.toFixed(2)}`).join(" ") + " Z";
    const polygonMatch = polygons.find((polygon) => isRollInsidePolygon(roll, polygon.points));
    return {
      id: roll.id || `roll-${index}`,
      path,
      rollIndex: index + 1,
      length: Number(roll.length) || 0,
      cx: (Number(roll.cx) || 0) * scale + ox,
      cy: (Number(roll.cy) || 0) * scale + oy,
      areaId: polygonMatch?.id || "",
      areaIndex: Number(polygonMatch?.index || 0),
    };
  });
  polygonSketches.forEach((polygon) => {
    if (!hasMultipleAreas) {
      polygon.vertexPoints.forEach((point) => registerOccupiedCircle(occupiedLabels, point.x, point.y, 6));
    }
  });
  // Oltre una certa densità, un'etichetta "R{n}" per rotolo (26 unità di
  // larghezza) si sovrappone alle altre — molte strisce sono più strette del
  // box stesso (es. tagli di rifinitura da 0.10-0.30m) — e "mangia" tutto lo
  // spazio disponibile, lasciando le quote del perimetro senza un posto dove
  // stare (segnalato dall'utente il 28 set su un layout da 29 rotoli). Sopra
  // la soglia, lato cliente, i rotoli restano visibili come linee di giunzione
  // ma senza etichetta numerica sopra: i numeri restano nella legenda sotto.
  const ROLL_LABEL_DENSITY_LIMIT = 9;
  const showRollLabelsOnSketch = !isClientVariant || rollPaths.length <= ROLL_LABEL_DENSITY_LIMIT;
  if (showRollLabelsOnSketch) {
    rollPaths.forEach((roll) => registerOccupiedCircle(occupiedLabels, roll.cx, roll.cy, 8.5));
  }
  const edges = !hasMultipleAreas ? polygonSketches.flatMap((polygon, polygonIndex) => polygon.points.map((point, index) => {
    const next = polygon.points[(index + 1) % polygon.points.length];
    const edgeNormal = getEdgeOutwardNormal(point, next, polygon.points);
    const edgePrefix = polygonSketches.length > 1 ? `A${polygonIndex + 1}-` : "";
    const txt = `${edgePrefix}${fmt(Math.hypot(next.x - point.x, next.y - point.y), 2)}m`;
    const chipW = Math.max(36, txt.length * 5.6 + 12);
    const chipH = 16;
    const candidates = [];
    [14, 20, 28].forEach((offset) => {
      [0, 10, -10].forEach((shift) => {
        candidates.push({
          x: edgeNormal.midpoint.x * scale + ox + (edgeNormal.normal.x * offset) + (edgeNormal.tangent.x * shift),
          y: edgeNormal.midpoint.y * scale + oy + (edgeNormal.normal.y * offset) + (edgeNormal.tangent.y * shift),
        });
      });
    });
    const labelRect = findAvailableLabelRect(candidates, chipW, chipH, occupiedLabels, bounds);
    return {
      areaIndex: polygonIndex + 1,
      edgeIndex: index + 1,
      length: Math.hypot(next.x - point.x, next.y - point.y),
      midX: edgeNormal.midpoint.x * scale + ox,
      midY: edgeNormal.midpoint.y * scale + oy,
      txt,
      chipW,
      chipH,
      labelRect,
    };
  })) : [];
  const vertexLabels = !hasMultipleAreas ? polygonSketches.flatMap((polygon, polygonIndex) => polygon.vertexPoints.map((point, index) => {
    const candidates = [
      { x: point.x, y: point.y - 14 },
      { x: point.x + 14, y: point.y - 10 },
      { x: point.x - 14, y: point.y - 10 },
      { x: point.x + 14, y: point.y + 12 },
      { x: point.x - 14, y: point.y + 12 },
      { x: point.x, y: point.y + 16 },
    ];
    return {
      point,
      label: polygonSketches.length > 1 ? `A${polygonIndex + 1}-V${index + 1}` : `V${index + 1}`,
      rect: findAvailableLabelRect(candidates, polygonSketches.length > 1 ? 34 : 24, 12, occupiedLabels, bounds),
    };
  })) : [];
  const areaSummaries = polygonSketches.map((polygon, polygonIndex) => {
    const edgeLengths = polygon.points.map((point, index) => {
      const next = polygon.points[(index + 1) % polygon.points.length];
      return Math.hypot(next.x - point.x, next.y - point.y);
    });
    const assignedRolls = rollPaths.filter((roll) => roll.areaId === polygon.id);
    return {
      id: polygon.id,
      label: polygon.kind === "exclusion" ? `A${polygonIndex + 1} · ${polygon.label || "Esclusione"}` : `A${polygonIndex + 1} · superficie lorda`,
      area: polyArea(polygon.points),
      perimeter: polyPerimeter(polygon.points),
      edgeLengths,
      vertexCount: polygon.points.length,
      rollCount: assignedRolls.length,
      rollIndices: assignedRolls.map((roll) => roll.rollIndex),
      rolls: assignedRolls.map((roll) => ({
        rollIndex: roll.rollIndex,
        length: roll.length,
      })),
    };
  });

  const textureNs = isClientVariant ? "client" : "technical";
  const turfPatternId = `turfTexture-${textureNs}`;
  const wpcPatternId = `wpcTexture-${textureNs}`;
  // Ingombro reale in metri → base per la scala grafica (bbox già calcolata sopra).
  const scaleBarTargetPx = 60;
  const scaleBarMetersRaw = scaleBarTargetPx / scale;
  const scaleBarNiceSteps = [0.5, 1, 2, 5, 10, 20, 50, 100];
  const scaleBarMeters = scaleBarNiceSteps.reduce((best, step) => (
    Math.abs(step - scaleBarMetersRaw) < Math.abs(best - scaleBarMetersRaw) ? step : best
  ), scaleBarNiceSteps[0]);
  const scaleBarPx = scaleBarMeters * scale;

  return (
    <div style={{
      border: "1px solid " + (isClientVariant ? CB.line : B.borderLight), borderRadius: 12, background: B.white,
      padding: isClientVariant ? "12px 12px 10px" : 10,
      boxShadow: isClientVariant ? "0 4px 16px rgba(28,66,41,0.1)" : "none",
    }}>
      {isClientVariant && (
        <div style={{ fontSize: 11, color: CB.mid, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>
          Pianta del giardino
        </div>
      )}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <defs>
          <pattern id={turfPatternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
            <rect width="6" height="6" fill={isClientVariant ? "#e4f0e2" : (B.primary + "14")} />
            <path d="M1,6 L1.6,2 M3,6 L3.6,1.5 M5,6 L5.6,2.2" stroke={isClientVariant ? "#5a9463" : B.primary} strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
          </pattern>
          <pattern id={wpcPatternId} width="14" height="8" patternUnits="userSpaceOnUse">
            <rect width="14" height="8" fill="#e8dfc9" />
            <path d="M0,1.5 H14 M0,4 H14 M0,6.5 H14" stroke="#a68a54" strokeWidth="0.7" opacity="0.55" />
          </pattern>
        </defs>

        {/* Background: neutro caldo per il cliente, non verdino — così il
            prato in verde pieno risalta per contrasto invece di confondersi
            con lo sfondo. */}
        <rect x="1" y="1" width={W - 2} height={H - 2} rx="10"
          fill={isClientVariant ? "#faf9f4" : B.cream}
          stroke={isClientVariant ? CB.line : B.borderLight} />

        {/* Polygons */}
        {polygonSketches.map((polygon, pi) => {
          const fillOpacity = isClientVariant ? (pi % 2 === 0 ? 0.5 : 0.4) : 1;
          const isPaving = polygon.kind === "paving";
          // Nel report cliente il prato è sempre un verde pieno, mai la
          // texture a trama sottile: a piccola scala/stampa la texture legge
          // come grigio spento, non "colorata" — richiesto dall'utente il
          // 27 set ("rendiamo il disegno maggiormente protagonista, con
          // colori"). Il report tecnico interno mantiene la texture realistica.
          const fillColor = polygon.kind === "exclusion" ? (isClientVariant ? "#e7ded0" : "#e2e6eb")
            : isClientVariant ? `rgba(29,107,53,${fillOpacity})`
            : previewMode ? `url(#${isPaving ? wpcPatternId : turfPatternId})`
            : (B.primary + "1c");
          const labelText = `A${polygon.index}`;
          const lw = labelText.length * 6.2 + 14;
          const lx = clamp(polygon.center.x - lw / 2, 4, W - lw - 4);
          const ly = clamp(polygon.center.y - 8, 6, H - 20);
          return (
            <g key={`poly-${polygon.id}`}>
              {isClientVariant && <path d={polygon.d} fill="rgba(10,50,15,0.08)" stroke="none" transform="translate(1.5,2.5)" />}
              <path d={polygon.d} fill={fillColor} stroke={isClientVariant ? "#1a5e2f" : B.primary} strokeWidth="2" strokeLinejoin="round" />
              {hasMultipleAreas && isClientVariant && (
                <>
                  <rect x={lx} y={ly} width={lw} height="16" rx="4" fill="rgba(255,255,255,0.92)" stroke="rgba(26,94,47,0.3)" strokeWidth="0.8" />
                  <text x={lx + lw / 2} y={ly + 11} fontSize="8.6" textAnchor="middle" fill="#1a3d24" fontWeight="800">{labelText}</text>
                </>
              )}
              {hasMultipleAreas && !isClientVariant && (
                <>
                  <rect x={clamp(polygon.box.minX + polygon.box.w / 2 - 16, 8, W - 40)} y={clamp(polygon.box.minY - 18, 8, H - 24)} width="32" height="16" rx="8" fill={B.primary} opacity="0.96" />
                  <text x={clamp(polygon.box.minX + polygon.box.w / 2, 24, W - 24)} y={clamp(polygon.box.minY - 6.5, 19, H - 10)} fontSize="8.6" textAnchor="middle" fill="#fff" fontWeight="800">{labelText}</text>
                </>
              )}
            </g>
          );
        })}

        {/* Rolls */}
        {rollPaths.map(roll => (
          <g key={roll.id}>
            {isClientVariant ? (
              /* Client: dashed seam lines, con etichetta numerata solo se lo
                 spazio lo permette (vedi showRollLabelsOnSketch sopra) —
                 altrimenti solo la linea di giunzione, il numero resta nella
                 legenda sotto la pianta. */
              <>
                <path d={roll.path} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeDasharray="5 3" />
                {showRollLabelsOnSketch && (
                  <>
                    <rect x={roll.cx - 13} y={roll.cy - 6.5} width="26" height="13" rx="3.5"
                      fill="rgba(255,255,255,0.82)" stroke="rgba(26,94,47,0.28)" strokeWidth="0.7" />
                    <text x={roll.cx} y={roll.cy + 4} fontSize="7.4" textAnchor="middle" fill="#1a3d24" fontWeight="700">{`R${roll.rollIndex}`}</text>
                  </>
                )}
              </>
            ) : (
              /* Technical: filled box with numbered center dot */
              <>
                <path d={roll.path} fill="rgba(21,101,192,0.2)" stroke="#1565c0" strokeWidth="1.35" />
                <circle cx={roll.cx} cy={roll.cy} r="5.2" fill="#1565c0" stroke="#fff" strokeWidth="1.2" />
                <text x={roll.cx} y={roll.cy + 2.9} fontSize="7.4" textAnchor="middle" fill="#fff" fontWeight="700">{roll.rollIndex}</text>
              </>
            )}
          </g>
        ))}

        {polygonSketches.filter(p => p.kind === "exclusion").map(p => (
          <g key={`obstacle-${p.id}`}>
            <path d={p.d} fill="#e2e6eb" stroke="#526175" strokeWidth="1.5" strokeDasharray="4 2" />
            <text x={p.center.x} y={p.center.y} textAnchor="middle" fontSize="8" fill="#344154">{p.label || "Esclusione"}</text>
          </g>
        ))}
        {/* Edge measurement labels — lato cliente con un piccolo richiamo
            dal bordo all'etichetta (linea tratteggiata + puntino sul
            bordo), come in un disegno tecnico vero, non un'etichetta che
            galleggia scollegata dal lato che misura. */}
        {edges.map((edge, index) => {
          const labelCx = edge.labelRect.x + edge.chipW / 2;
          const labelCy = edge.labelRect.y + edge.chipH / 2;
          const leaderLen = Math.hypot(labelCx - edge.midX, labelCy - edge.midY);
          return (
            <g key={index}>
              {isClientVariant && leaderLen > 7 && (
                <line x1={edge.midX} y1={edge.midY} x2={labelCx} y2={labelCy} stroke="rgba(26,94,47,0.4)" strokeWidth="0.7" strokeDasharray="1.5 1.8" />
              )}
              {isClientVariant && <circle cx={edge.midX} cy={edge.midY} r="1.5" fill="#1a5e2f" />}
              <rect x={edge.labelRect.x} y={edge.labelRect.y} width={edge.chipW} height={edge.chipH} rx={isClientVariant ? 4 : 6}
                fill={isClientVariant ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.96)"}
                stroke={isClientVariant ? "rgba(26,94,47,0.2)" : B.borderLight}
                strokeWidth={isClientVariant ? "0.8" : "1"} />
              <text x={labelCx} y={edge.labelRect.y + 10.6} fontSize="8.4" textAnchor="middle"
                fill={isClientVariant ? "#1a3d24" : B.dark} fontWeight="700" letterSpacing={isClientVariant ? "0.2" : "0"}>
                {edge.txt}
              </text>
            </g>
          );
        })}

        {/* Vertex labels — technical only */}
        {!isClientVariant && vertexLabels.map((item, index) => (
          <g key={`v-${index}`}>
            <circle cx={item.point.x} cy={item.point.y} r="4.3" fill={B.primary} stroke="#fff" strokeWidth="1.6" />
            <text x={item.rect.x + item.rect.width / 2} y={item.rect.y + 9} fontSize="8.2" textAnchor="middle" fill={B.dark} fontWeight="700">{item.label}</text>
          </g>
        ))}

        {/* Client vertex dots — small, clean */}
        {isClientVariant && polygonSketches.map((polygon) => polygon.vertexPoints.map((pt, vi) => (
          <circle key={`vc-${polygon.id}-${vi}`} cx={pt.x} cy={pt.y} r="2.6" fill="#1a5e2f" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" />
        )))}

        {/* North indicator — sempre presente (tecnico e cliente), orientamento
            convenzionale (non da bussola reale: nessun dato GPS disponibile). */}
        <g transform={`translate(${W - 20}, 18)`}>
          <circle cx="0" cy="0" r="8" fill="rgba(255,255,255,0.82)" stroke={isClientVariant ? "rgba(26,94,47,0.3)" : B.borderLight} strokeWidth="0.8" />
          <polygon points="0,-6 2.5,2 0,0 -2.5,2" fill={isClientVariant ? "#1a5e2f" : B.primary} />
          <polygon points="0,6 2.5,-2 0,0 -2.5,-2" fill={isClientVariant ? "rgba(26,94,47,0.25)" : (B.primary + "40")} />
          <text x="0" y="-7.5" fontSize="5.5" textAnchor="middle" fill={isClientVariant ? "#1a3d24" : B.dark} fontWeight="800" letterSpacing="0.5">N</text>
        </g>

        {/* Scala grafica — passo "bello" (0.5/1/2/5/10/20/50/100 m) più
            vicino a ~60px, ancorata in basso a sinistra del riquadro. */}
        <g transform={`translate(8, ${H - 10})`}>
          <line x1="0" y1="0" x2={scaleBarPx} y2="0" stroke={isClientVariant ? "#1a5e2f" : B.dark} strokeWidth="1.4" />
          <line x1="0" y1="-3" x2="0" y2="3" stroke={isClientVariant ? "#1a5e2f" : B.dark} strokeWidth="1.4" />
          <line x1={scaleBarPx} y1="-3" x2={scaleBarPx} y2="3" stroke={isClientVariant ? "#1a5e2f" : B.dark} strokeWidth="1.4" />
          <text x={scaleBarPx / 2} y="-5.5" fontSize="7" textAnchor="middle" fill={isClientVariant ? "#1a3d24" : B.textMuted} fontWeight="700">{scaleBarMeters >= 1 ? `${scaleBarMeters} m` : `${scaleBarMeters * 100} cm`}</text>
        </g>
      {borderSegments.map(s=><line key={s.id} x1={s.a.x*scale+ox} y1={s.a.y*scale+oy} x2={s.b.x*scale+ox} y2={s.b.y*scale+oy} stroke="#c2410c" strokeWidth="2" />)}
      </svg>
      <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
        <div style={{ fontSize: 11, color: B.textMuted }}>
          Ingombro massimo: <strong style={{ color: B.dark }}>{fmt(bb.w, 2)} m × {fmt(bb.h, 2)} m</strong> · Vertici: <strong style={{ color: B.dark }}>{polygonPoints.length}</strong>{polygonSketches.length > 1 ? ` · Elementi: ` : ""}
          {polygonSketches.length > 1 ? <strong style={{ color: B.dark }}>{polygonSketches.length}</strong> : null}
        </div>
        {rollPaths.length > 0 ? (
          <div style={{ fontSize: 11, color: B.textMuted }}>
            Rotoli posizionati nel layout: <strong style={{ color: isClientVariant ? CB.dark : B.dark }}>{rollPaths.length}</strong>
            {isClientVariant ? " · larghezza 2 m ciascuno" : ""}
          </div>
        ) : null}
        {rollPaths.length > 0 && !hasMultipleAreas ? (
          isClientVariant ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", padding: "8px 2px 2px", borderTop: "1px solid " + CB.line }}>
              {rollPaths.map((roll) => (
                <span key={`roll-chip-${roll.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                  <span style={{
                    width: 17, height: 17, borderRadius: "50%", background: CB.pale, border: "1px solid " + CB.paleBorder,
                    color: CB.dark, fontSize: 9, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>{roll.rollIndex}</span>
                  <span style={{ color: B.text, fontWeight: 600 }}>{fmt(roll.length, 2)} m</span>
                </span>
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 6 }}>
              {rollPaths.map((roll) => (
                <span
                  key={`roll-chip-${roll.id}`}
                  style={{
                    fontSize: 10,
                    padding: "4px 7px",
                    borderRadius: 999,
                    border: "1px solid rgba(21,101,192,0.28)",
                    background: "#eff6ff",
                    color: "#0b4f8a",
                    fontWeight: 700,
                  }}
                >
                  R{roll.rollIndex}: 2.00 × {fmt(roll.length, 2)} m
                </span>
              ))}
            </div>
          )
        ) : null}
        {hasMultipleAreas ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            {areaSummaries.map((areaItem) => (
              <div
                key={`area-summary-${areaItem.id}`}
                style={{
                  border: "1px solid " + B.borderLight,
                  borderRadius: 10,
                  background: B.cream,
                  padding: "8px 10px",
                  display: "grid",
                  gap: 5,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: B.primary }}>{areaItem.label}</span>
                  <span style={{ fontSize: 10, color: B.textMuted }}>{fmt(areaItem.area, 1)} m²</span>
                </div>
                <div style={{ fontSize: 10.5, color: B.textMuted }}>
                  Perimetro <strong style={{ color: B.dark }}>{fmt(areaItem.perimeter, 2)} m</strong> · {areaItem.vertexCount} vertici
                </div>
                <div style={{ fontSize: 10.5, color: B.textMuted }}>
                  Rotoli impiegati <strong style={{ color: B.dark }}>{areaItem.rollCount}</strong>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {areaItem.rolls.length ? areaItem.rolls.map((roll) => (
                    <span
                      key={`${areaItem.id}-roll-${roll.rollIndex}`}
                      style={{
                        fontSize: 9.5,
                        padding: "3px 6px",
                        borderRadius: 999,
                        border: "1px solid rgba(21,101,192,0.22)",
                        background: "#eff6ff",
                        color: "#0b4f8a",
                        fontWeight: 700,
                      }}
                    >
                      R{roll.rollIndex} · 2.00 × {fmt(roll.length, 2)} m
                    </span>
                  )) : (
                    <span
                      style={{
                        fontSize: 9.5,
                        padding: "3px 6px",
                        borderRadius: 999,
                        border: "1px solid " + B.borderLight,
                        background: B.white,
                        color: B.textMuted,
                        fontWeight: 600,
                      }}
                    >
                      Nessun rotolo assegnato
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {areaItem.edgeLengths.map((length, edgeIndex) => (
                    <span
                      key={`${areaItem.id}-edge-${edgeIndex}`}
                      style={{
                        fontSize: 9.5,
                        padding: "3px 6px",
                        borderRadius: 999,
                        border: "1px solid " + B.borderLight,
                        background: B.white,
                        color: B.dark,
                        fontWeight: 700,
                      }}
                    >
                      L{edgeIndex + 1} · {fmt(length, 2)} m
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {edges.map((edge, index) => (
              <span
                key={`edge-chip-${index}`}
                style={{
                  fontSize: 10,
                  padding: "4px 7px",
                  borderRadius: 999,
                  border: "1px solid " + B.borderLight,
                  background: B.cream,
                  color: B.dark,
                  fontWeight: 600,
                }}
              >
                L{index + 1}: {fmt(edge.length, 2)} m
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RollUsageSummary({ usage }) {
  if (!usage) return null;
  const percent=usage.netArea>0?Math.min(100,usage.covered/usage.netArea*100):0;
  return <section className="gp-usage" aria-label="Utilizzo dei rotoli">
    <strong>Il progetto in numeri</strong>
    <div className="gp-usage-main"><b>{fmt(usage.netArea,1)} m²</b><span>prato da realizzare</span></div>
    <div className="gp-progress" role="progressbar" aria-label="Prato coperto" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}><span style={{width:percent+"%"}}/></div>
    <p><b>{fmt(percent,0)}% coperto</b> · {usage.uncovered<.01?"Posa completata":`${fmt(usage.uncovered,2)} m² ancora da coprire`}</p>
    <dl>{[["Materiale inserito",usage.material],["Prato coperto",usage.covered],["Sfrido e sovrapposizioni",usage.unused]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{fmt(value,2)} m²</dd></div>)}</dl>
    <details><summary>Come si compone lo sfrido · {fmt(usage.wastePercent,1)}%</summary>
      <p>{fmt(usage.offcut,2)} m² fuori dal prato o sugli ostacoli.<br/>{fmt(usage.overlap,2)} m² sovrapposti ad altro materiale.</p>
      <p>Una parte può essere recuperata. Le proposte disponibili sono nel pannello Recupera sfrido. Il materiale inserito indica i pezzi disegnati, non un ordine d’acquisto completo.</p>
    </details>
  </section>;
}

function InstallationNeedsPanel({ area, perimeter, borderType, borderMeters, manualRolls, rollUsage }) {
  if (area <= 0) return null;
  const border = BORDER_TYPES.find(item => item.id === borderType);
  const needs = estimateInstallationNeeds(area, perimeter, manualRolls, rollUsage);
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        <MetricCard label="TNT da ordinare" value={`${fmt(needs.geo)} m²`} />
        <MetricCard
          label="Colla bicomponente"
          value={`${needs.glueBuckets} secchi`}
          sub={needs.calcMode === "layout"
            ? `${fmt(needs.glueKg, 1)} kg · 1 secchio per ogni rotolo banda`
            : `${fmt(needs.glueKg, 1)} kg stimati (${fmt(INSTALLATION_RULES.glueKgPerSqm, 1)} kg/m²)`}
        />
        <MetricCard
          label="Banda giunzione"
          value={`${needs.tapeRolls} rotoli`}
          sub={needs.calcMode === "layout"
            ? `${fmt(needs.jointMeters, 1)} m reali di giunzione`
            : `${fmt(needs.jointMeters, 1)} m stimati da superficie`}
        />
        <MetricCard label="Picchetti a U" value={`${needs.pins} pz`} />
        {borderType !== "nessuna" && borderMeters > 0 ? (
          <MetricCard label={border?.name || "Bordura"} value={`${fmt(borderMeters, 1)} m`} sub="Tratti disegnati" accent />
        ) : null}
      </div>
      <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid " + B.borderLight, background: needs.calcMode === "layout" ? B.infoBg : B.cream, fontSize: 12, color: needs.calcMode === "layout" ? B.info : B.textMuted, lineHeight: 1.45 }}>
        {needs.calcMode === "layout"
          ? `Calcolo posa basato sul layout reale: ${fmt(needs.layoutCoverageArea, 1)} m² coperti dai rotoli (${fmt(needs.layoutCoverageRatio * 100, 0)}% dell'area), ${fmt(needs.sideJointMeters, 1)} m di giunte laterali${needs.endJointMeters > 0 ? ` + ${fmt(needs.endJointMeters, 1)} m di testate` : ""}.`
          : `Stima rapida attiva finché il layout rotoli non copre almeno il ${fmt(INSTALLATION_RULES.layoutCoverageMin * 100, 0)}% dell'area. Al momento risultano ${fmt(needs.layoutCoverageArea, 1)} m² tracciati: banda e colla restano sul fallback da m².`}
      </div>
    </div>
  );
}

// Conteggio mattonelle per le aree "paving" del progetto — una card per area
// (utile con più zone pavimentate di formato diverso) + un totale pezzi.
// Nessun prezzo: il costo €/pz WPC non è ancora noto (da confermare), il
// pezzo arriva comunque nel Generatore con prezzo editabile — vedi
// buildPlannerMaterialItems.
function PavingNeedsPanel({ pavingNeedsByArea, pavingTilesTotal }) {
  if (!pavingNeedsByArea.length) return null;
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 14, paddingTop: 14, borderTop: "1px dashed " + B.borderLight }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: B.dark }}>Pavimentazione WPC</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        {pavingNeedsByArea.map((p, i) => (
          <MetricCard
            key={p.areaId}
            label={pavingNeedsByArea.length > 1 ? `Zona ${i + 1} · ${fmt(p.areaM2)} m²` : `Mattonelle · ${fmt(p.areaM2)} m²`}
            value={`${p.tilesNeeded} pz`}
            sub={`+${Math.round(p.wasteFactor * 100)}% scarto tagli`}
          />
        ))}
        {pavingNeedsByArea.length > 1 ? (
          <MetricCard label="Totale mattonelle" value={`${pavingTilesTotal} pz`} accent />
        ) : null}
      </div>
      <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid " + B.borderLight, background: B.warnBg, fontSize: 12, color: "#8a5a00", lineHeight: 1.45 }}>
        Quantità comprensiva dello scarto di taglio, da verificare con il formato scelto.
      </div>
    </div>
  );
}

function DecoSection({ decoItems, setDecoItems }) {
  const cats = [...new Set(DECO_CATALOG.map(d => d.cat))];
  const update = (id, qty) => setDecoItems(prev => ({ ...prev, [id]: Math.max(0, parseFloat(qty) || 0) }));
  const activeCount = Object.values(decoItems).filter(v => v > 0).length;

  return (
    <div>
      {cats.map(cat => {
        const items = DECO_CATALOG.filter(d => d.cat === cat);
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid " + B.borderLight }}>{cat}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
              {items.map(item => {
                const qty = decoItems[item.id] || 0;
                const active = qty > 0;
                return (
                  <div key={item.id} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 8, border: "1px solid " + (active ? B.primary + "44" : B.borderLight),
                    background: active ? B.light : B.white,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: B.text, lineHeight: 1.25, whiteSpace: "normal", overflowWrap: "anywhere" }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: B.textMuted, marginTop: 4, lineHeight: 1.35 }}>{`Unità: ${item.unit}${item.note ? " | " + item.note : ""}`}</div>
                    </div>
                    <input type="number" min={0} step={1} value={qty || ""} placeholder="0"
                      onChange={e => update(item.id, e.target.value)}
                      style={{ width: 60, padding: "5px 6px", border: "1.5px solid " + (active ? B.primary + "66" : B.borderLight), borderRadius: 6, fontSize: 13, fontWeight: 600, textAlign: "center", outline: "none", boxSizing: "border-box" }}
                    />
                    <span style={{ fontSize: 11, color: B.textMuted, minWidth: 46, textAlign: "right" }}>{item.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {activeCount > 0 && (
        <div style={{ marginTop: 8, padding: "8px 12px", background: B.infoBg, borderRadius: 8, border: "1px solid #bbdefb", fontSize: 12, color: B.info }}>
          {activeCount} material{activeCount > 1 ? "i" : "e"} aggiuntiv{activeCount > 1 ? "i" : "o"} selezionat{activeCount > 1 ? "i" : "o"} - riepilogo pronto per l'ordine.
        </div>
      )}
    </div>
  );
}

function MaterialsReport({ area, perimeter, turfArea, turfPerimeter, shape, dims, customPts, customClosed, customAreas = [], borderSegments = [], borderType, borderMeters, substrate, decoItems, projectInfo, travel, viewerRole, regionalPricing, manualRolls, pavingNeedsByArea = [], reportVariant = "technical", previewMode = false }) {
  if (area <= 0) return <div style={{ color: B.textMuted, fontSize: 13, padding: 16, textAlign: "center" }}>Inserisci le dimensioni per vedere il riepilogo.</div>;

  // turfArea/turfPerimeter esclude le aree "paving" (pavimentazione WPC) —
  // fallback su area/perimeter (totale) se non passati, per compatibilità.
  const reportAreas = shape === "custom" ? getPlannerPolygons(customAreas, customPts, customClosed) : [{ points: getShapePolygon(shape, dims), kind: "turf" }];
  const rollUsage = plannerRollUsage(reportAreas, manualRolls || []);
  const installNeeds = estimateInstallationNeeds(turfArea ?? area, turfPerimeter ?? perimeter, manualRolls, rollUsage);
  const isClientVariant = reportVariant === "client";
  const {
    canViewMaterialCosts,
    pricingRegionLabel,
    stabilizedPerTon,
    sandPerTon,
    sections,
    materialCostTotal,
    travelSummary,
    travelCost,
    operationalCostTotal,
  } = buildPlannerMaterialReferenceModel({
    area,
    turfArea: turfArea ?? area,
    substrate,
    travel,
    installNeeds,
    borderType,
    borderMeters,
    decoItems,
    regionalPricing,
    viewerRole,
    reportVariant,
    pavingNeedsByArea,
  });
  const rollCount = Array.isArray(manualRolls) ? manualRolls.length : 0;
  const rollLinearMeters = Array.isArray(manualRolls)
    ? manualRolls.reduce((sum, roll) => sum + (Number(roll.length) || 0), 0)
    : 0;
  const rollMaterialArea = installNeeds.rollMaterialArea || (rollLinearMeters * MANUAL_ROLL_WIDTH_M);
  const rollWasteArea = installNeeds.rollWasteArea;
  const rollPolygons = shape === "custom"
    ? getPlannerPolygons(customAreas, customPts, customClosed)
    : [{ points: getShapePolygon(shape, dims) }].filter((item) => item.points.length >= 3);
  const outsideRollCount = rollPolygons.length
    ? (manualRolls || []).reduce((count, roll) => (isRollInsideAnyPolygon(roll, rollPolygons) ? count : count + 1), 0)
    : 0;
  const shapeLabel = getPlannerShapeLabel(shape, dims, customPts, customClosed, customAreas);
  // Il cliente vede solo il layout (rotoli/bordura, già nelle card sopra), mai
  // le quantità di approvvigionamento (fondo/materiali posa/intaso): sono
  // informazioni operative per l'ufficio/squadra, non per chi legge il
  // preventivo (richiesto dall'utente il 27 set).
  const visibleSections = isClientVariant ? [] : sections;
  if(isClientVariant) return <ClientProjectSheet polygons={reportAreas} rolls={manualRolls||[]} borders={borderSegments} usage={rollUsage} borderMeters={borderType==='nessuna'?0:borderMeters}/>;

  return (
    <div>
      {!isClientVariant && <RollUsageSummary usage={rollUsage} />}
      {(projectInfo.client || projectInfo.address) && (
        <div className="print-no-break" style={{ marginBottom: 12, padding: "8px 12px", background: B.gray, borderRadius: 8, fontSize: 11.5, display: "flex", gap: 18, flexWrap: "wrap" }}>
          {projectInfo.client && <span><strong>Cliente:</strong> {projectInfo.client}</span>}
          {projectInfo.address && <span><strong>Cantiere:</strong> {projectInfo.address}</span>}
          {projectInfo.date && <span><strong>Data:</strong> {projectInfo.date}</span>}
          {projectInfo.notes && <span><strong>Note:</strong> {projectInfo.notes}</span>}
          {!isClientVariant && travel?.departureBase && <span><strong>Partenza:</strong> {travel.departureBase}</span>}
          {!isClientVariant && travelSummary.totalKm > 0 && <span><strong>Viaggio:</strong> {travelSummary.modeLabel}</span>}
          {!isClientVariant && travelSummary.extraKm > 0 && <span><strong>Km extra:</strong> {fmt(travelSummary.extraKm, 1)} km</span>}

        </div>
      )}

      <div className="print-no-break" style={{ display: "grid", gridTemplateColumns: isClientVariant ? "3fr 2fr" : "repeat(auto-fit, minmax(250px, 1fr))", gap: 10, marginBottom: 12 }}>
        <TechnicalSketch borderSegments={borderSegments} shape={shape} dims={dims} customPts={customPts} customClosed={customClosed} customAreas={customAreas} manualRolls={manualRolls} isClientVariant={isClientVariant} previewMode={previewMode} />
        <div style={{ border: "1px solid " + (isClientVariant ? CB.line : B.borderLight), borderRadius: 12, background: B.white, padding: "10px 12px", display: "grid", gap: 7, boxShadow: isClientVariant ? "0 2px 10px rgba(28,66,41,0.08)" : "none" }}>
          <div style={{ fontSize: 11, color: isClientVariant ? CB.mid : B.primary, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>{isClientVariant ? "Layout giardino" : "Tavola tecnica 2D"}</div>
          {isClientVariant ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "10px 14px", borderRadius: 10, background: `linear-gradient(135deg, ${CB.pale}, #fff)` }}>
              <GpStatIcon name="area" color={CB.mid} size={22} />
              <div>
                <span style={{ fontSize: 26, fontWeight: 800, color: CB.dark }}>{fmt(area)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: B.textMuted, marginLeft: 4 }}>m² di prato</span>
              </div>
            </div>
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            {!isClientVariant && (
              <div style={{ padding: "8px 10px", borderRadius: 8, background: B.cream, border: "1px solid " + B.borderLight }}>
                <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Superficie</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: B.dark }}>{fmt(area)} m²</div>
              </div>
            )}
            <div style={isClientVariant ? statCardClient : statCardTech}>
              {isClientVariant && <GpStatIcon name="perimeter" color={CB.mid} size={15} />}
              <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Perimetro</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: B.dark }}>{fmt(perimeter)} m</div>
            </div>
            <div style={isClientVariant ? statCardClient : statCardTech}>
              {isClientVariant && <GpStatIcon name="border" color={CB.mid} size={15} />}
              <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Bordura</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: B.dark }}>{borderType === "nessuna" ? "No" : `${fmt(borderMeters)} m`}</div>
            </div>
            <div style={isClientVariant ? statCardClient : statCardTech}>
              {isClientVariant && <GpStatIcon name="shape" color={CB.mid} size={15} />}
              <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Forma</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: B.dark }}>{shapeLabel}</div>
            </div>
            <div style={isClientVariant ? statCardClient : statCardTech}>
              {isClientVariant && <GpStatIcon name="rolls" color={CB.mid} size={15} />}
              <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Layout rotoli</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: B.dark }}>{rollCount} rotoli</div>
              <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>{fmt(rollLinearMeters, 2)} m lineari · {fmt(rollMaterialArea, 1)} m² inseriti</div>
              <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>
                Materiale non utilizzato: <strong style={{ color: B.dark }}>{fmt(rollWasteArea, 1)} m²</strong>
                {outsideRollCount > 0 ? ` · ${outsideRollCount} rotol${outsideRollCount > 1 ? "i" : "o"} oltre bordo` : ""}
              </div>
              <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>
                Giunzioni: <strong style={{ color: B.dark }}>{fmt(installNeeds.jointMeters, 1)} m</strong> · {installNeeds.calcMode === "layout" ? "layout reale" : "stima provvisoria"}
              </div>
            </div>
          </div>
          {!isClientVariant && (
            <div style={{ fontSize: 12, color: B.textMuted, lineHeight: 1.45 }}>
              Specifiche tecniche: scavo {substrate.scavoCm} cm, drenante {substrate.drenateCm} cm, sabbia {substrate.sabbiaCm} cm · Posa {installNeeds.calcMode === "layout" ? "calcolata da layout rotoli" : `in fallback da m² finché il layout non copre il ${fmt(INSTALLATION_RULES.layoutCoverageMin * 100, 0)}% dell'area`}
            </div>
          )}
        </div>
      </div>

      {!isClientVariant && (
      <div className="print-no-break" style={{ border: "1px solid " + B.border, borderRadius: 10, overflow: "hidden" }}>
        {visibleSections.map((sec, si) => (
          <div key={si}>
            <div style={{ background: B.gray, padding: "7px 12px", fontSize: 10.8, fontWeight: 700, color: B.primary, textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid " + B.borderLight, borderTop: si > 0 ? "1px solid " + B.border : "none", display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{sec.cat}</span>
              <span style={{ color: B.dark, whiteSpace: "nowrap" }}>{sec.showCosts && typeof sec.sub === "number" ? fmtE(sec.sub) : (sec.meta || "")}</span>
            </div>
            {sec.items.map((item, ii) => (
              <div key={ii} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", fontSize: 12.2, borderBottom: "1px solid " + B.borderLight, background: ii % 2 === 0 ? B.white : B.cream, flexWrap: "wrap", gap: 4 }}>
                <span style={{ flex: sec.showCosts ? 2 : 3, color: B.text, minWidth: 150 }}>{item.name}</span>
                <span style={{ flex: 1, textAlign: sec.showCosts ? "center" : "right", color: B.textMuted, minWidth: 120 }}>{item.qty}</span>
                {sec.showCosts ? (
                  <span style={{ minWidth: 80, textAlign: "right", fontWeight: 600, color: B.dark }}>{typeof item.cost === "number" ? fmtE(item.cost) : "\u2014"}</span>
                ) : null}
              </div>
            ))}
          </div>
        ))}
        {!isClientVariant ? (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: B.dark, color: "#fff", fontWeight: 700, fontSize: 15 }}>
            <span>STIMA COSTI TRASFERTA</span>
            <span style={{ color: B.accent, fontSize: 17 }}>{fmtE(travelCost)}</span>
          </div>
        ) : null}
      </div>
      )}
      {isClientVariant && (
        <div className="print-no-break" style={{
          marginTop: 16, padding: "18px 22px", borderRadius: 14, textAlign: "center",
          background: `linear-gradient(135deg, ${CB.pale}, #fff)`, border: "1px solid " + CB.line,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: CB.dark, marginBottom: 4 }}>
            Grazie per aver scelto Prato Sintetico Italia
          </div>
          <div style={{ fontSize: 11.5, color: B.textMuted, lineHeight: 1.6 }}>
            Vertex Srls · Via Ottorino Respighi 57, 81025 Marcianise (CE) · www.pratosinteticoitalia.com
          </div>
        </div>
      )}
    </div>
  );
}

function ReportShell({ id, variant = "technical", area, perimeter, turfArea, turfPerimeter, shape, dims, customPts, customClosed, customAreas = [], borderSegments = [], borderMeters, borderType, substrate, decoItems, projectInfo, travel, viewerRole, regionalPricing, manualRolls, pavingNeedsByArea = [], previewMode = false }) {
  const isClientVariant = variant === "client";
  return (
    <div id={id} style={{fontFamily:"Arial, Helvetica, sans-serif"}}>
      {isClientVariant ? (
        <div className="print-no-break" style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'center',borderTop:'3px solid #284b36',borderBottom:'1px solid #b8c5d0',padding:'14px 0',marginBottom:14,fontFamily:'Arial, Helvetica, sans-serif',color:'#243547'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <img src="./logo-prato.png" alt="Prato Sintetico Italia" width="38" height="38" style={{objectFit:'contain'}}/>
            <div><div style={{fontSize:10,letterSpacing:1.2,fontWeight:700}}>PRATO SINTETICO ITALIA</div><div style={{fontSize:23,fontWeight:600,marginTop:4}}>Progetto del giardino</div></div>
          </div>
          <div style={{fontSize:10,lineHeight:1.6,textAlign:'right',maxWidth:'45%',overflowWrap:'anywhere'}}>
            <div><strong>{projectInfo.client||'Progetto giardino'}</strong></div>
            {projectInfo.address&&<div>{projectInfo.address}</div>}
            <div>{formatItDate(projectInfo.date)||formatItDate(getLocalISODate())} · TAV. 01</div>
          </div>
        </div>
      ) : (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10, padding: "8px 2px 10px", borderBottom: "1px solid " + B.borderLight }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: B.primary, letterSpacing: "0.4px", textTransform: "uppercase" }}>Prato Sintetico Italia</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: B.dark, lineHeight: 1.15 }}>
            Report tecnico Garden Planner
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: B.textMuted }}>
          <div><strong style={{ color: B.dark }}>Data report:</strong> {projectInfo.date || getLocalISODate()}</div>
          {projectInfo.client ? <div><strong style={{ color: B.dark }}>Cliente:</strong> {projectInfo.client}</div> : null}
          <div><strong style={{ color: B.dark }}>Versione:</strong> Tecnica</div>
        </div>
      </div>
      )}
      <MaterialsReport
        area={area}
        perimeter={perimeter}
        turfArea={turfArea}
        turfPerimeter={turfPerimeter}
        shape={shape}
        dims={dims}
        customPts={customPts}
        customClosed={customClosed}
        customAreas={customAreas}
        borderSegments={borderSegments}
        borderMeters={borderMeters}
        borderType={borderType}
        substrate={substrate}
        decoItems={decoItems}
        projectInfo={projectInfo}
        travel={travel}
        viewerRole={viewerRole}
        regionalPricing={regionalPricing}
        manualRolls={manualRolls}
        pavingNeedsByArea={pavingNeedsByArea}
        reportVariant={variant}
        previewMode={previewMode}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════ */
// Icone minimali per le card statistiche del report cliente (stroke
// outline, stesso stile usato altrove nell'app) — solo lì, il report
// tecnico resta denso di dati senza fronzoli grafici.
function GpStatIcon({ name, color = "currentColor", size = 16 }) {
  const paths = {
    area: <rect x="4" y="4" width="16" height="16" rx="2.5" />,
    perimeter: <rect x="3.5" y="3.5" width="17" height="17" rx="2" strokeDasharray="3 2.2" />,
    border: <><path d="M4 20 20 4" /><path d="M4 20v-5M4 20h5" /></>,
    shape: <path d="M12 3l8 5-2 11H6L4 8z" />,
    rolls: <><rect x="3" y="9" width="18" height="6" rx="3" /><circle cx="7.5" cy="12" r="1.1" fill={color} /></>,
  };
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const statCardTech = { padding: "8px 10px", borderRadius: 8, background: B.cream, border: "1px solid " + B.borderLight };
const statCardClient = { padding: "9px 10px 8px", borderRadius: 8, background: B.white, border: "1px solid " + CB.line, display: "grid", gap: 3 };
const btnPrim = { padding: "8px 16px", borderRadius: 8, border: "none", background: B.primary, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const lbl = { display: "block", fontSize: 11, color: B.textMuted, marginBottom: 4, fontWeight: 500 };
const fieldInp = { width: "100%", padding: "10px 14px", border: "1.5px solid " + B.border, borderRadius: 10, fontSize: 13, boxSizing: "border-box", outline: "none", color: B.dark };

/* ═══════════════════════════════════════════
   REDESIGN — struttura workspace (Fase C)
   Un solo <style> con classi sotto prefisso gp- per non mischiare paradigmi
   con lo stile inline usato ovunque nel resto del file (bottoni, campi,
   canvas restano inline — qui solo l'ossatura: topbar/rail/area-strip/
   inspector/dock). Stessi colori di B, solo portati in variabili CSS.
   ═══════════════════════════════════════════ */
function GpPrecisionPanel({ area, areas, onUpdate, onAdd }) {
  const [rect, setRect] = useState({ x: 1, y: 1, w: 8, h: 6, angle:0, kind: "turf", label: "Prato" });
  const [error, setError] = useState("");
  const [rollForm, setRollForm] = useState({cx:5,cy:2,length:10,angle:0});
  const numeric = (key, title) => <label>{title}<input type="number" step="0.01" value={rect[key]} onChange={e=>setRect(r=>({...r,[key]:e.target.value}))}/></label>;
  return <div className="gp-precision">
    <div className="gp-section-title">Disegno e misure</div>
    <p>Usa Rettangolo sulla tavola e trascina. Per spostare gli elementi scegli Seleziona e sposta.</p>
    <details><summary>Inserimento numerico (opzionale)</summary>
    <label>Elemento<select value={rect.kind+":"+rect.label} onChange={e=>{ const [kind,label]=e.target.value.split(":"); setRect(r=>({...r,kind,label})); }}>
      {["turf:Prato","exclusion:Abitazione","exclusion:Casetta","exclusion:Patio esistente","exclusion:Piscina","exclusion:Aiuola","exclusion:Albero","paving:Pavimentazione"].map(v=><option key={v} value={v}>{v.split(":")[1]}</option>)}
    </select></label>
    <div className="gp-number-grid">{numeric("w","Larghezza m")}{numeric("h","Profondità m")}{numeric("x","Origine X m")}{numeric("y","Origine Y m")}{numeric("angle","Rotazione °")}</div>
    <button type="button" onClick={()=>{
      const {x,y,w,h}=Object.fromEntries(["x","y","w","h"].map(k=>[k,Number(rect[k])]));
      if (![x,y,w,h].every(Number.isFinite) || w<=0 || h<=0) { setError("Inserisci dimensioni maggiori di zero."); return; }
      const angle=Number(rect.angle)*Math.PI/180;
      if (!Number.isFinite(angle)) {setError("Inserisci un angolo valido.");return;}
      onAdd({...createPlannerArea(rect.kind), label:rect.label, closed:true, points:[[0,0],[w,0],[w,h],[0,h]].map(([dx,dy])=>({x:x+dx*Math.cos(angle)-dy*Math.sin(angle),y:y+dx*Math.sin(angle)+dy*Math.cos(angle)}))}); setError("");
    }}>＋ Inserisci rettangolo</button></details>
    {area.points.length>0 && <details><summary>Coordinate dei vertici · {area.points.length}</summary>
      <div className="gp-vertices">{area.points.map((p,i)=><div key={i}><span>P{i+1}</span>{["x","y"].map(axis=><input key={axis} aria-label={`P${i+1} ${axis} metri`} type="number" step="0.01" value={p[axis]} onChange={e=>{if(e.target.value!=="" && Number.isFinite(Number(e.target.value))) onUpdate(a=>({...a,points:a.points.map((v,j)=>j===i?{...v,[axis]:Number(e.target.value)}:v)}));}}/>)}</div>)}</div>
    </details>}
    {area.closed && area.kind==="turf" && <details><summary>Inserisci rotolo con misure</summary>
      <p>Larghezza 2 m. Posizione del centro e direzione di posa.</p>
      <div className="gp-number-grid">{[["length","Lunghezza m"],["angle","Direzione °"],["cx","Centro X m"],["cy","Centro Y m"]].map(([k,label])=><label key={k}>{label}<input type="number" step="0.01" value={rollForm[k]} onChange={e=>setRollForm(r=>({...r,[k]:e.target.value}))}/></label>)}</div>
      <button type="button" onClick={()=>{
        const r=Object.fromEntries(Object.entries(rollForm).map(([k,v])=>[k,Number(v)]));
        if (!Object.values(r).every(Number.isFinite)||r.length<1||r.length>25) {setError("Lunghezza rotolo da 1 a 25 metri.");return;}
        onUpdate(a=>({...a,rolls:[...a.rolls,{...r,angle:r.angle*Math.PI/180,width:2,id:"roll-"+Date.now()}]}));setError("");
      }}>＋ Inserisci rotolo da 2 m</button>
    </details>}
    {error && <p role="alert" style={{color:"#b42318"}}>{error}</p>}
  </div>;
}

function splitPlannerOffcut(area, index, length, x, y, areas = [area]) {
  const roll = area.rolls[index];
  if (!roll || ![length,x,y].every(Number.isFinite) || length<=0 || length>=roll.length) throw new Error("Il taglio deve essere positivo e più corto del rotolo.");
  const ux=Math.cos(roll.angle||0), uy=Math.sin(roll.angle||0);
  const piece={...roll,id:"cut-"+Date.now(),sourceRollId:roll.id,length,cx:roll.cx+ux*(roll.length-length)/2,cy:roll.cy+uy*(roll.length-length)/2};
  if (plannerNetArea([getRollCorners(piece)], areas.filter(a=>a.closed && (!a.kind || a.kind==="turf")).map(a=>a.points)) < length*(roll.width||2)-0.00001) throw new Error("La porzione scelta copre il prato: scegli un taglio terminale più corto.");
  const retained={...roll,length:roll.length-length,cx:roll.cx-ux*length/2,cy:roll.cy-uy*length/2};
  return area.rolls.map((r,i)=>i===index?retained:r).concat({...piece,cx:x,cy:y});
}

// Recover only rectangular strips whose complete footprint is unused.
// Quantization is conservative (5 cm); residual triangular waste is not offered.
function plannerCutStrip(roll, size, axis = "length", side = 1) {
  const dimension = Number(roll[axis]) || (axis === "width" ? 2 : 0);
  const angle = Number(roll.angle) || 0;
  const ux = axis === "length" ? Math.cos(angle) : -Math.sin(angle);
  const uy = axis === "length" ? Math.sin(angle) : Math.cos(angle);
  const piece = {...roll, [axis]:size, cx:roll.cx+side*ux*(dimension-size)/2, cy:roll.cy+side*uy*(dimension-size)/2};
  const retained = {...roll, [axis]:dimension-size, cx:roll.cx-side*ux*size/2, cy:roll.cy-side*uy*size/2};
  return {piece, retained};
}
function plannerPieceLawnArea(piece, areas) {
  const turf=areas.filter(a=>a.closed && (!a.kind || a.kind==="turf")).map(a=>a.points);
  const exclusions=areas.filter(a=>a.closed && ["exclusion","paving"].includes(a.kind)).map(a=>a.points);
  const polygon=getRollCorners(piece);
  return Math.max(0,plannerNetArea([polygon],exclusions)-plannerNetArea([polygon],[...exclusions,...turf]));
}
function plannerRecoverableStrips(areas) {
  const result=[];
  areas.forEach((area,areaIndex)=>{
    if (!area.closed || (area.kind && area.kind!=="turf")) return;
    (area.rolls||[]).forEach((roll,index)=>{
      for (const axis of ["length","width"]) for (const side of [-1,1]) {
        const dimension=Number(roll[axis]) || (axis==="width"?2:0);
        let lo=0,hi=Math.max(0,Math.floor((dimension-0.1+1e-8)/0.05));
        while(lo<hi) {
          const mid=Math.ceil((lo+hi)/2);
          if(plannerPieceLawnArea(plannerCutStrip(roll,mid*0.05,axis,side).piece,areas)<1e-8) lo=mid; else hi=mid-1;
        }
        const size=lo*0.05;
        if(size<0.1) continue;
        const {piece,retained}=plannerCutStrip(roll,size,axis,side);
        result.push({key:`${area.id}:${index}:${axis}:${side}`,areaId:area.id,index,source:roll,axis,side,size,piece,retained,
          label:`Area ${areaIndex+1} · R${index+1}`,surface:piece.length*(piece.width||2)});
      }
    });
  });
  return result.sort((a,b)=>b.surface-a.surface);
}
function plannerOffcutPlacement(areas, candidate, x, y) {
  const owner=areas.find(a=>a.id===candidate?.areaId);
  if(!owner || owner.rolls[candidate.index]!==candidate.source) return {valid:false,reason:"Il rotolo è cambiato: seleziona nuovamente il ritaglio."};
  if(plannerPieceLawnArea(candidate.piece,areas)>1e-8) return {valid:false,reason:"Il progetto è cambiato: questo taglio ora coprirebbe il prato."};
  const piece={...candidate.piece,cx:x,cy:y};
  const surface=piece.length*(piece.width||2);
  // Basta che il pezzo tocchi prato utile, non che ci stia per intero: come i
  // rotoli normali (doesRollTouchPolygon), vicino a un bordo obliquo o
  // irregolare è normale che sporga — in cantiere si rifila l'eccedenza dopo
  // la posa. Richiedere copertura al 100% rendeva il recupero sfrido
  // inutilizzabile proprio dove serve di più (segnalato dall'utente il 27 set).
  if(!Number.isFinite(x)||!Number.isFinite(y)||plannerPieceLawnArea(piece,areas)<1e-6) return {valid:false,reason:"Sposta il ritaglio sul prato, fuori dagli ostacoli."};
  const other=areas.flatMap(a=>(a.rolls||[]).map((r,i)=>getRollCorners(a.id===owner.id && i===candidate.index?candidate.retained:r)));
  if(plannerNetArea([getRollCorners(piece)],other)<surface-1e-6) return {valid:false,reason:"Qui c’è già materiale: sposta il ritaglio su una zona scoperta."};
  return {valid:true,reason:"Posizione valida · clicca per confermare",piece};
}
function GpOffcutTray({ candidates, pending, onChoose, onCancel, onUndo, canUndo }) {
  return <section className="gp-offcut-tray" aria-label="Recupera sfrido">
    <div className="gp-section-title">Recupera sfrido</div>
    <p>1. Scegli un ritaglio · 2. Spostalo sulla tavola · 3. Clicca per posarlo.</p>
    {pending ? <div role="status"><strong>{pending.label} · {fmt(pending.piece.length,2)} × {fmt(pending.piece.width||2,2)} m</strong><p>Il pezzo segue il puntatore. Verde: puoi posarlo. Rosso: cambia posizione. Il rotolo originale verrà tagliato solo alla conferma.</p><button type="button" onClick={onCancel}>Annulla posizionamento</button></div> : <>
      <p>{candidates.length ? "Tagli rettangolari disponibili, dal più grande. Le proposte sono alternative e si aggiornano dopo ogni utilizzo." : "Nessuna striscia rettangolare recuperabile. I ritagli triangolari o irregolari non sono ancora gestiti: lo sfrido totale resta visibile nel riepilogo."}</p>
      <div className="gp-offcut-list">{candidates.map(c=><button type="button" key={c.key} onClick={()=>onChoose(c)}>
        <span className="gp-piece-icon" aria-hidden="true">▱</span><span><strong>{c.label}</strong><small>{fmt(c.piece.length,2)} × {fmt(c.piece.width||2,2)} m · {c.axis==="length"?"testata":"fascia laterale"}</small></span><b>{fmt(c.surface,2)} m² →</b>
      </button>)}</div>
    </>}
    {canUndo && <button type="button" onClick={onUndo}>Annulla ultimo recupero</button>}
    <small>Verso del pelo conservato. Nessuna coordinata da inserire.</small>
  </section>;
}

function GpChromeStyles() {
  return (
    <style>{`
      .gp-shell { display: flex; flex-direction: column; gap: 12px; padding: 16px; margin: 0 auto; max-width: 1920px; }
      .gp-shell.is-focused { max-width: none; }
      .gp-shell.is-focused .gp-dock { display: none; }
      .gp-workspace-controls { display: flex; gap: 8px; flex-wrap: wrap; }
      .gp-workspace-controls button { border: 1px solid #ccd8d0; background: #fff; color: #244033; padding: 10px 14px; border-radius: 8px; cursor: pointer; font: inherit; font-size: 12px; }
      .gp-workspace-controls button[aria-pressed="true"] { background: #244033; color: white; }
      .gp-shell button:focus-visible, .gp-shell select:focus-visible { outline: 3px solid #278b57; outline-offset: 3px; }
      .gp-canvas-col { width: 100%; }
      .gp-topbar {
        display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
        background: ${B.white}; border: 1px solid ${B.borderLight}; border-radius: 12px;
        padding: 12px 18px;
      }
      .gp-topbar-id { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .gp-topbar-id strong { font-size: 14px; color: ${B.dark}; font-weight: 700; overflow-wrap: anywhere; }
      .gp-topbar-id span { font-size: 11.5px; color: ${B.textMuted}; overflow-wrap: anywhere; }
      .gp-topbar-metrics { display: flex; gap: 8px; flex-wrap: wrap; }
      .gp-topbar-chip {
        display: inline-flex; align-items: baseline; gap: 5px;
        background: ${B.cream}; border: 1px solid ${B.borderLight}; border-radius: 999px;
        padding: 5px 12px; font-size: 11.5px; color: ${B.textMuted};
      }
      .gp-topbar-chip b { font-size: 13px; color: ${B.dark}; font-weight: 800; }
      .gp-topbar-spacer { flex: 1; }

      .gp-workspace { display: flex; gap: 14px; align-items: flex-start; }
      .gp-rail {
        display: flex; flex-direction: column; gap: 6px;
        background: ${B.white}; border: 1px solid ${B.borderLight}; border-radius: 12px;
        padding: 10px; flex: 0 0 76px; position: sticky; top: 12px;
      }
      .gp-rail-btn {
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        padding: 10px 4px; border-radius: 9px; border: 1px solid transparent;
        background: transparent; color: ${B.textMuted}; font-size: 10px; font-weight: 700;
        cursor: pointer; line-height: 1.15; text-align: center;
      }
      .gp-rail-btn .ico { font-size: 18px; line-height: 1; }
      .gp-rail-btn.is-active { background: ${B.light}; border-color: ${B.primary}; color: ${B.primary}; }
      .gp-rail-btn.tone-border.is-active { background: #fdf2e3; border-color: #b8860b; color: #8a6d3b; }
      .gp-rail-btn.tone-paving.is-active { background: #f5efe3; border-color: #8a6d3b; color: #8a6d3b; }
      .gp-rail-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .gp-rail-divider { height: 1px; background: ${B.borderLight}; margin: 4px 2px; }

      .gp-canvas-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
      .gp-area-strip {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        background: ${B.white}; border: 1px solid ${B.borderLight}; border-radius: 12px; padding: 8px 12px;
      }
      .gp-area-strip-label { font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: ${B.textMuted}; }
      .gp-area-chip {
        display: inline-flex; align-items: center; gap: 6px;
        border: 1.5px solid ${B.border}; background: ${B.white}; color: ${B.textMuted};
        font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 999px; cursor: pointer;
      }
      .gp-area-chip.is-active { border-color: ${B.primary}; background: ${B.light}; color: ${B.primary}; }
      .gp-area-chip.tone-paving.is-active { border-color: #8a6d3b; background: #f5efe3; color: #8a6d3b; }
      .gp-area-chip .x { margin-left: 2px; opacity: 0.6; }
      .gp-area-add { border: 1.5px dashed ${B.border}; background: transparent; color: ${B.textMuted}; font-size: 11.5px; font-weight: 700; padding: 5px 10px; border-radius: 999px; cursor: pointer; }
      .gp-area-add:disabled { opacity: 0.4; cursor: not-allowed; }

      .gp-inspector {
        flex: 0 0 280px; background: ${B.white}; border: 1px solid ${B.borderLight}; border-radius: 12px;
        overflow: hidden; position: sticky; top: 12px;
      }
      .gp-inspector-tabs { display: flex; border-bottom: 1px solid ${B.borderLight}; }
      .gp-inspector-tabs button {
        flex: 1; padding: 11px 8px; font-size: 11.5px; font-weight: 700; color: ${B.textMuted};
        background: ${B.white}; border: none; border-bottom: 2px solid transparent; cursor: pointer;
      }
      .gp-inspector-tabs button.is-active { color: ${B.primary}; border-bottom-color: ${B.primary}; background: ${B.light}; }
      .gp-inspector-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; max-height: 52vh; overflow-y: auto; }

      .gp-dock { background: ${B.white}; border: 1px solid ${B.borderLight}; border-radius: 12px; overflow: hidden; }
      .gp-dock-tabs { display: flex; flex-wrap: wrap; border-bottom: 1px solid ${B.borderLight}; }
      .gp-dock-tabs button {
        display: flex; align-items: center; gap: 6px;
        padding: 10px 14px; font-size: 11.5px; font-weight: 700; color: ${B.textMuted};
        background: ${B.white}; border: none; border-bottom: 2px solid transparent; cursor: pointer;
      }
      .gp-dock-tabs button.is-active { color: ${B.primary}; border-bottom-color: ${B.primary}; background: ${B.light}; }
      .gp-dock-panel { display: none; padding: 16px 18px; flex-wrap: wrap; gap: 14px; }
      .gp-dock-panel.is-active { display: flex; }

      .gp-preview-toggle {
        display: flex; border: 1px solid ${B.border}; border-radius: 999px; overflow: hidden; flex: 0 0 auto;
      }
      .gp-preview-toggle button {
        padding: 5px 12px; font-size: 11px; font-weight: 700; border: none; cursor: pointer;
        background: ${B.white}; color: ${B.textMuted};
      }
      .gp-preview-toggle button.is-active { background: ${B.primary}; color: #fff; }

      .gp-shell { max-width:none; padding:12px; gap:8px; background:#e8edf3; }
      .gp-topbar { background:#172738; color:white; border:0; border-radius:6px; padding:12px 18px; }
      .gp-topbar-id strong { color:white; font-size:17px; }
      .gp-topbar-id span { color:#b9cadb; }
      .gp-workspace { gap:10px; }
      .gp-rail { border-radius:6px; padding:6px; flex-basis:62px; background:#f8fafc; }
      .gp-rail-btn { border-radius:4px; }
      .gp-area-strip,.gp-inspector,.gp-dock { border-radius:6px; border-color:#ccd6e2; }
      .gp-inspector { flex-basis:290px; max-height:calc(100vh - 110px); overflow:auto; }
      .gp-drawing-board { background:white; padding:10px; border:1px solid #ccd6e2; border-radius:6px; }
      .gp-view-tools { display:flex; gap:6px; align-items:center; flex-wrap:wrap; border-bottom:1px solid #dce4ed; padding-bottom:10px; margin-bottom:10px; }
      .gp-view-tools strong { font:700 11px monospace; letter-spacing:1px; margin-right:auto; color:#31465c; }
      .gp-view-tools span { font:11px monospace; color:#52657a; }
      .gp-view-tools button,.gp-precision button { background:#edf3f9; border:1px solid #b9c8d8; border-radius:4px; padding:7px 10px; color:#213b54; cursor:pointer; }
      .gp-view-tools button[aria-pressed=true] { background:#203b56; color:white; }
      .gp-precision { padding:14px; background:#f8fafc; border-bottom:1px solid #ccd6e2; display:flex; flex-direction:column; gap:10px; }
      .gp-offcut-tray { padding:14px; background:#eff8f5; border-bottom:1px solid #b4d6c8; }
      .gp-offcut-tray p { font-size:12px; line-height:1.5; color:#35534a; }
      .gp-offcut-tray small { display:block; font-size:11px; color:#48645a; margin-top:6px; }
      .gp-offcut-tray button { cursor:pointer; border:1px solid #a2c9b9; border-radius:6px; background:white; padding:9px; color:#174b37; }
      .gp-offcut-list { max-height:230px; overflow:auto; display:grid; gap:6px; }
      .gp-offcut-list button { display:flex; align-items:center; gap:8px; text-align:left; }
      .gp-offcut-list button b { margin-left:auto; white-space:nowrap; font-size:11px; }
      .gp-piece-icon { font-size:24px; }
      .gp-usage { padding:14px; background:white; border:1px solid #d6e1dc; border-radius:8px; }
      .gp-usage-main { display:flex; align-items:baseline; gap:8px; margin:12px 0; }
      .gp-usage-main b { font-size:24px; color:#184e39; }
      .gp-usage-main span,.gp-usage p,.gp-usage summary { font-size:12px; line-height:1.5; }
      .gp-progress { height:8px; border-radius:4px; background:#e5ece8; overflow:hidden; }
      .gp-progress>span { display:block; height:100%; background:#228463; }
      .gp-usage dl { display:grid; gap:10px; font-size:12px; }
      .gp-usage dl>div { display:flex; justify-content:space-between; gap:10px; }
      .gp-usage dd { margin:0; font-weight:700; white-space:nowrap; }
      .gp-usage summary { cursor:pointer; color:#315849; }
      .gp-section-title { color:#233c55; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:1px; }
      .gp-precision label { display:flex; flex-direction:column; gap:4px; font-size:11px; color:#52657a; }
      .gp-precision input,.gp-precision select { box-sizing:border-box; width:100%; min-width:0; border:1px solid #bdcad8; background:white; border-radius:4px; padding:7px; font:12px monospace; color:#20364c; }
      .gp-number-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .gp-precision summary { cursor:pointer; font-size:12px; padding:8px 0; font-weight:600; }
      .gp-precision p { font-size:11px; line-height:1.5; }
      .gp-vertices { max-height:220px; overflow:auto; }
      .gp-vertices>div { display:grid; grid-template-columns:28px 1fr 1fr; align-items:center; gap:4px; margin:4px 0; font-size:11px; }
      @media (max-width: 900px) {
        .gp-workspace { flex-direction: column; }
        .gp-inspector { max-height:none; }
        .gp-topbar { padding:8px 12px; gap:8px; }
        .gp-rail-btn { flex-direction:row; padding:6px; }
        .gp-rail { padding:4px; }
        .gp-rail { flex-direction: row; position: static; flex: 0 0 auto; overflow-x: auto; }
        .gp-inspector { flex: 1 1 auto; position: static; width: 100%; }
      }
    `}</style>
  );
}

// Barra in alto: identità progetto + superficie + toggle anteprima + CTA
// principale (prima in fondo pagina, ora sempre visibile).
function GpTopBar({ client, address, area, previewMode, onSetPreviewMode, onOpenGenerator, canOpenGenerator }) {
  return (
    <div className="gp-topbar">
      <div className="gp-topbar-id">
        <strong>{client || "Nuovo progetto"}</strong>
        <span>{address || "Indirizzo da definire"}</span>
      </div>
      <div className="gp-topbar-metrics">
        <div className="gp-topbar-chip">Superficie <b>{area > 0 ? fmt(area, 1) + " m²" : "—"}</b></div>
      </div>
      <div className="gp-topbar-spacer" />
      <div className="gp-preview-toggle">
        <button type="button" className={previewMode ? "" : "is-active"} onClick={() => onSetPreviewMode(false)}>Pianta tecnica</button>
        <button type="button" className={previewMode ? "is-active" : ""} onClick={() => onSetPreviewMode(true)}>Materiali</button>
      </div>
      <button
        type="button"
        onClick={onOpenGenerator}
        disabled={!canOpenGenerator}
        style={{ ...btnPrim, whiteSpace: "nowrap", background: "#244033", opacity: canOpenGenerator ? 1 : 0.55, cursor: canOpenGenerator ? "pointer" : "not-allowed" }}
      >
        Apri nel generatore
      </button>
    </div>
  );
}

// Striscia aree: sostituisce le vecchie "area tabs" dentro FreeDrawCanvas —
// stessi handler (onSelectArea/onAddArea/onRemoveArea), ora sempre visibile
// (prima solo con più di un'area) e fuori dal canvas per restare a vista
// mentre si cambia strumento.
function GpAreaStrip({ areas = [], activeAreaId, onSelectArea, onAddArea, onRemoveArea, canAddArea }) {
  return (
    <div className="gp-area-strip">
      <span className="gp-area-strip-label">Aree</span>
      {areas.map((areaItem, index) => {
        const active = areaItem.id === activeAreaId;
        const closed = Boolean(areaItem.closed);
        const sqm = closed && Array.isArray(areaItem.points) && areaItem.points.length >= 3 ? polyArea(areaItem.points) : 0;
        const isPaving = areaItem.kind === "paving";
        return (
          <button
            key={areaItem.id}
            type="button"
            className={`gp-area-chip ${isPaving ? "tone-paving" : ""} ${active ? "is-active" : ""}`}
            onClick={() => onSelectArea(areaItem.id)}
          >
            {areaItem.kind === "exclusion" ? `▧ ${areaItem.label || "Esclusione"}` : `${isPaving ? "▦" : "🌱"} Area ${index + 1}`}{closed ? ` · ${fmt(sqm, 1)} m²` : " · aperta"}
            {active && areas.length > 1 ? (
              <span className="x" onClick={(e) => { e.stopPropagation(); onRemoveArea(); }} title="Rimuovi area">×</span>
            ) : null}
          </button>
        );
      })}
      <button type="button" className="gp-area-add" onClick={onAddArea} disabled={!canAddArea} title={canAddArea ? "" : "Chiudi il perimetro attivo prima di aggiungerne un altro"}>
        ＋ Nuova area
      </button>
      <button type="button" className="gp-area-add" onClick={() => onAddArea("exclusion")} disabled={!canAddArea}>＋ Area da escludere</button>
    </div>
  );
}

// Barra strumenti a icone: i 4 "modi" del planner. Disegna/Rotolo governano
// drawMode (comportamento invariato, incluso il blocco rotolo su aree
// pavimentazione); Bordura/Pavimentazione cambiano SOLO cosa mostra
// l'inspector (inspectorFocus) — Pavimentazione in più marca l'area attiva
// come "paving" (stesso onUpdateActiveArea della Fase B).
function GpToolRail({ inspectorFocus, onSelectDraw, onSelectRoll, onSelectBorder, onSelectPaving, closed, activeAreaKind }) {
  return (
    <div className="gp-rail">
      <button type="button" className={`gp-rail-btn ${inspectorFocus === "draw" ? "is-active" : ""}`} onClick={onSelectDraw} title="Disegna perimetro">
        <span className="ico">✎</span>Disegna
      </button>
      <button
        type="button"
        className={`gp-rail-btn ${inspectorFocus === "roll" ? "is-active" : ""}`}
        onClick={onSelectRoll}
        disabled={!closed || activeAreaKind !== "turf"}
        title={activeAreaKind !== "turf" ? "I rotoli si posano solo sulle aree prato" : "Aggiungi rotolo"}
      >
        <span className="ico">▤</span>Rotolo
      </button>
      <div className="gp-rail-divider" />
      <button type="button" className={`gp-rail-btn tone-border ${inspectorFocus === "border" ? "is-active" : ""}`} onClick={onSelectBorder} title="Bordura">
        <span className="ico">⌢</span>Bordura
      </button>
      <button
        type="button"
        className={`gp-rail-btn tone-paving ${inspectorFocus === "paving" ? "is-active" : ""}`}
        onClick={onSelectPaving}
        title="Pavimentazione"
      >
        <span className="ico">▦</span>Pavim.
      </button>
    </div>
  );
}

// Dock inferiore: 4 tab per i campi che prima erano sezioni impilate (Dati
// progetto/Trasferta/Preparazione fondo/Materiali extra) — stessi componenti
// esistenti dentro (ProjectHeader/TravelPlanner/campi sostrato/DecoSection),
// solo in un contenitore a tab invece di card in sequenza.
function GpBottomDock({ activeTab, onSelectTab, children }) {
  const tabs = [
    { key: "dati", label: "Dati progetto", icon: "i" },
    { key: "trasferta", label: "Trasferta", icon: "€" },
    { key: "fondo", label: "Preparazione fondo", icon: "▦" },
    { key: "extra", label: "Materiali extra", icon: "＋" },
  ];
  return (
    <div className="gp-dock">
      <div className="gp-dock-tabs">
        {tabs.map((t) => (
          <button key={t.key} type="button" className={activeTab === t.key ? "is-active" : ""} onClick={() => onSelectTab(t.key)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

// Selettore tipo area (prato/pavimentazione) + formato mattonella + posa —
// stessa UI/logica della Fase B (era nel canvas-toolbar), ora nel tab
// "Elemento" dell'inspector quando si seleziona lo strumento Pavimentazione.
function GpPavingPicker({ activeAreaKind, activeTileSize, activeTileLayout, onUpdateActiveArea }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <label style={lbl}>Tipo di area</label>
        <div style={{ display: "flex", gap: 0, borderRadius: 4, overflow: "hidden", border: "1px solid " + B.border, width: "fit-content" }}>
          <button
            type="button"
            onClick={() => onUpdateActiveArea({ kind: "turf" })}
            title="Quest'area è prato: rotoli, telo, banda, colla, picchetti"
            style={{
              padding: "5px 12px", fontSize: 11.5, cursor: "pointer", border: "none",
              background: activeAreaKind === "turf" ? B.primary : B.white, color: activeAreaKind === "turf" ? "#fff" : B.textMuted, fontWeight: activeAreaKind === "turf" ? 700 : 500,
            }}
          >
            🌱 Prato
          </button>
          <button
            type="button"
            onClick={() => onUpdateActiveArea({ kind: "paving" })}
            title="Quest'area è pavimentazione: mattonelle WPC ad incastro, niente rotoli"
            style={{
              padding: "5px 12px", fontSize: 11.5, cursor: "pointer", border: "none", borderLeft: "1px solid " + B.border,
              background: activeAreaKind === "paving" ? "#8a6d3b" : B.white, color: activeAreaKind === "paving" ? "#fff" : B.textMuted, fontWeight: activeAreaKind === "paving" ? 700 : 500,
            }}
          >
            ▦ Pavimentazione
          </button>
        </div>
      </div>
      {activeAreaKind === "paving" && (
        <>
          <div>
            <label style={lbl}>Formato mattonella</label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[{ w: 30, h: 30 }, { w: 40, h: 40 }, { w: 50, h: 50 }].map((size) => {
                const active = activeTileSize.w === size.w && activeTileSize.h === size.h;
                return (
                  <button
                    key={`${size.w}x${size.h}`}
                    type="button"
                    onClick={() => onUpdateActiveArea({ tileSize: size })}
                    style={{
                      padding: "5px 10px", borderRadius: 4, fontSize: 11.5, cursor: "pointer",
                      border: active ? "1.5px solid #8a6d3b" : "1px solid " + B.border,
                      background: active ? "#f5efe3" : B.white, color: active ? "#8a6d3b" : B.text, fontWeight: active ? 700 : 500,
                    }}
                  >
                    {size.w}×{size.h} cm
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={lbl}>Tipo di posa</label>
            <select
              value={activeTileLayout}
              onChange={(e) => onUpdateActiveArea({ tileLayout: e.target.value })}
              style={{ padding: "6px 8px", borderRadius: 4, fontSize: 11.5, border: "1px solid " + B.border, background: B.white, color: B.text, width: "100%" }}
            >
              <option value="straight">Posa diritta (scarto 8%)</option>
              <option value="offset">Posa sfalsata (scarto 12%)</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
function GardenPlanner() {
  const [viewerRole, setViewerRole] = useState("crew");
  const [projectInfo, setProjectInfo] = useState(getInitialProjectInfo);
  // Id della richiesta CRM che ha aperto questo Garden Planner (se aperto da
  // "Apri nel Garden Planner" su una richiesta) — letto una sola volta al
  // mount, come projectInfo. Usato SOLO per verificare l'associazione reale
  // richiesta↔progetto quando si allega la tavola al preventivo: il
  // generatore confronta questo id con la richiesta attualmente selezionata
  // e, se non combaciano (o se è vuoto: disegno libero, mai aperto da una
  // richiesta), mostra uno stato esplicito invece di allegare in automatico
  // l'ultimo disegno aperto nel browser (richiesto dall'utente il 29 set).
  const [sourceRequestId] = useState(() => String(readGardenPlannerRequestPrefill()?.requestId || "").trim());
  const [travel, setTravel] = useState(DEFAULT_TRAVEL_SETTINGS);
  const initialArea = useMemo(() => createPlannerArea(), []);
  const shape = "custom";
  const [plannerAreas, setPlannerAreas] = useState(() => [initialArea]);
  const [activeAreaId, setActiveAreaId] = useState(() => initialArea.id);
  const [pendingOffcut,setPendingOffcut]=useState(null);
  const [cutHistory,setCutHistory]=useState(null);
  const [moveHistory,setMoveHistory]=useState(null);
  const recoverableStrips=useMemo(()=>plannerRecoverableStrips(plannerAreas),[plannerAreas]);
  const placeOffcut=(x,y)=>{
    const check=plannerOffcutPlacement(plannerAreas,pendingOffcut,x,y);
    if(!check.valid) return;
    const candidate=pendingOffcut;
    const piece={...check.piece,id:`reused-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,sourceRollId:candidate.source.id || candidate.key};
    const after=plannerAreas.map(a=>a.id===candidate.areaId?{...a,rolls:a.rolls.map((r,i)=>i===candidate.index?candidate.retained:r).concat(piece)}:a);
    setCutHistory({before:plannerAreas,after});setPlannerAreas(after);setPendingOffcut(null);
  };

  const [borderSegments,setBorderSegments]=useState([]);
  const [borderType, setBorderType] = useState("pvc");
  const selectedBorderEdges = [];
  const [substrate, setSubstrate] = useState({ scavoCm: 10, drenateCm: 5, sabbiaCm: 3 });
  const [decoItems, setDecoItems] = useState({});
  const [regionalPricing, setRegionalPricing] = useState(() => getRegionalMaterialPricing(""));
  const safeDims = useMemo(() => ({ a: 0, b: 0, c: 0, d: 0 }), []);
  const activeArea = useMemo(
    () => plannerAreas.find((area) => area.id === activeAreaId) || plannerAreas[0] || createPlannerArea(),
    [plannerAreas, activeAreaId],
  );
  const customPts = activeArea?.points || [];
  const customClosed = Boolean(activeArea?.closed);
  const manualRolls = activeArea?.rolls || [];
  const activeAreaKind = activeArea?.kind || "turf";
  const activeTileSize = activeArea?.tileSize || { w: 30, h: 30 };
  const activeTileLayout = activeArea?.tileLayout === "offset" ? "offset" : "straight";
  const [drawMode, setDrawMode] = useState("shape");
  const [inspectorFocus, setInspectorFocus] = useState("draw");
  const [inspectorTab, setInspectorTab] = useState("element");
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [focusWorkspace, setFocusWorkspace] = useState(false);
  const inspectorBeforeFocus = useRef(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeDockTab, setActiveDockTab] = useState("dati");
  const layoutKey = useMemo(
    () => JSON.stringify(plannerAreas.map((area) => ({ points: area.points, closed: area.closed }))),
    [plannerAreas],
  );
  const completedAreas = useMemo(
    () => plannerAreas.filter((area) => area.closed && Array.isArray(area.points) && area.points.length >= 3),
    [plannerAreas],
  );
  // Turf, new paving and existing obstacles have distinct material rules.
  // Boolean area calculations below remove intersections without double counting.
  const completedTurfAreas = useMemo(
    () => completedAreas.filter((areaItem) => !areaItem.kind || areaItem.kind === "turf"),
    [completedAreas],
  );
  const completedPavingAreas = useMemo(
    () => completedAreas.filter((areaItem) => areaItem.kind === "paving"),
    [completedAreas],
  );
  const allManualRolls = useMemo(
    () => completedTurfAreas.flatMap((areaItem) => (Array.isArray(areaItem.rolls) ? areaItem.rolls : [])),
    [completedTurfAreas],
  );
  const surfaceMetrics = useMemo(() => {
    const turf = completedTurfAreas.map(a => a.points);
    const paving = completedPavingAreas.map(a => a.points);
    const holes = completedAreas.filter(a => a.kind === "exclusion").map(a => a.points);
    const grossTurf = plannerNetArea(turf);
    const netTurf = plannerNetArea(turf, [...paving, ...holes]);
    return { grossTurf, netTurf, excluded: grossTurf - netTurf, prepared: plannerNetArea([...turf, ...paving], holes) };
  }, [completedAreas, completedTurfAreas, completedPavingAreas]);
  const area = surfaceMetrics.prepared;
  const turfArea = surfaceMetrics.netTurf;
  const perimeter = useMemo(
    () => completedAreas.filter(a => a.kind !== "exclusion").reduce((sum, a) => sum + polyPerimeter(a.points), 0),
    [completedAreas],
  );
  const turfPerimeter = useMemo(
    () => completedTurfAreas.reduce((sum, areaItem) => sum + polyPerimeter(areaItem.points), 0),
    [completedTurfAreas],
  );
  const pavingNeedsByArea = useMemo(
    () => completedPavingAreas.map((areaItem) => {
      const earlier = completedPavingAreas.slice(0, completedPavingAreas.indexOf(areaItem));
      const areaM2 = plannerNetArea([areaItem.points], [...completedAreas.filter(a => a.kind === "exclusion"), ...earlier].map(a => a.points));
      return { areaId: areaItem.id, areaM2, ...estimatePavingNeeds(areaM2, areaItem.tileSize, areaItem.tileLayout) };
    }),
    [completedPavingAreas, completedAreas],
  );
  const rollUsage = useMemo(() => plannerRollUsage(completedAreas, allManualRolls), [completedAreas, allManualRolls]);
  const pavingTilesTotal = useMemo(
    () => pavingNeedsByArea.reduce((sum, p) => sum + p.tilesNeeded, 0),
    [pavingNeedsByArea],
  );
  const borderEdges = useMemo(() => getPlannerBorderEdges(completedAreas, shape, safeDims), [completedAreas, shape, safeDims]);
  const selectedBorderMeters = useMemo(() => borderType==='nessuna'?0:plannerBorderLength(borderSegments),[borderSegments,borderType]);
  const editor={
    borderSegments:borderType==='nessuna'?[]:borderSegments,
    onSelectArea:setActiveAreaId,
    onToolChange:mode=>{setInspectorFocus(mode==='border'?'border':'draw');setInspectorTab('element');},
    onMove:(target,dx,dy)=>{const after=plannerMoveObject(plannerAreas,target,dx,dy);setMoveHistory({before:plannerAreas,after});setPendingOffcut(null);setCutHistory(null);setPlannerAreas(after);},
    canUndoMove:moveHistory?.after===plannerAreas,
    undoMove:()=>{if(moveHistory?.after===plannerAreas){setPlannerAreas(moveHistory.before);setMoveHistory(null);}},
    onRectangle:(points,label)=>{
      const kind=label==='Prato'?'turf':label==='Pavimentazione'?'paving':'exclusion';
      const a={...createPlannerArea(kind),label,points,closed:true};
      setPlannerAreas(prev=>[...prev.filter(p=>p.points.length||p.closed),a]);setActiveAreaId(a.id);setInspectorFocus('draw');
    },
    onAddBorder:(a,b)=>{setBorderType(t=>t==='nessuna'?'pvc':t);setBorderSegments(prev=>[...prev,{id:`border-${Date.now()}-${Math.random()}`,a,b}]);setInspectorFocus('border');}
  };

  useEffect(() => {
    if (!plannerAreas.some((areaItem) => areaItem.id === activeAreaId)) {
      setActiveAreaId(plannerAreas[0]?.id || "");
    }
  }, [plannerAreas, activeAreaId]);

  const updateActiveArea = useCallback((updater) => {
    setPlannerAreas((prev) => prev.map((areaItem) => {
      if (areaItem.id !== activeAreaId) return areaItem;
      return updater(areaItem);
    }));
  }, [activeAreaId]);

  const setCustomPts = useCallback((nextValueOrUpdater) => {
    updateActiveArea((areaItem) => ({
      ...areaItem,
      points: applyStateUpdate(areaItem.points, nextValueOrUpdater),
    }));
  }, [updateActiveArea]);

  const setCustomClosed = useCallback((nextValueOrUpdater) => {
    updateActiveArea((areaItem) => ({
      ...areaItem,
      closed: Boolean(applyStateUpdate(areaItem.closed, nextValueOrUpdater)),
    }));
  }, [updateActiveArea]);

  const setManualRolls = useCallback((nextValueOrUpdater) => {
    updateActiveArea((areaItem) => ({
      ...areaItem,
      rolls: applyStateUpdate(areaItem.rolls, nextValueOrUpdater),
    }));
  }, [updateActiveArea]);

  const addPlannerArea = useCallback((kind = "turf") => {
    if (!activeArea?.closed) return;
    const nextArea = createPlannerArea(typeof kind === "string" ? kind : "turf");
    setPlannerAreas((prev) => [...prev, nextArea]);
    setActiveAreaId(nextArea.id);
    setDrawMode("shape");
    setInspectorFocus("draw");
    setInspectorOpen(true);
  }, [activeArea]);

  const removeActivePlannerArea = useCallback(() => {
    if (plannerAreas.length <= 1) {
      updateActiveArea((areaItem) => ({ ...areaItem, points: [], closed: false, rolls: [] }));
      return;
    }
    const currentIndex = Math.max(0, plannerAreas.findIndex((areaItem) => areaItem.id === activeAreaId));
    const nextAreas = plannerAreas.filter((areaItem) => areaItem.id !== activeAreaId);
    setPlannerAreas(nextAreas);
    setActiveAreaId(nextAreas[Math.max(0, currentIndex - 1)]?.id || nextAreas[0]?.id || "");
  }, [plannerAreas, activeAreaId, updateActiveArea]);

  // I 4 "strumenti" del rail: Disegna/Rotolo pilotano drawMode (comportamento
  // invariato, incluso il blocco rotolo su aree pavimentazione), Bordura/
  // Pavimentazione cambiano solo cosa mostra l'inspector (Pavimentazione in
  // più marca l'area attiva come "paving", stesso onUpdateActiveArea già
  // usato dalla Fase B).
  const handleSelectDrawTool = useCallback(() => {
    setDrawMode("shape");
    setInspectorFocus("draw");
    setInspectorTab("element");
  }, []);
  const handleSelectRollTool = useCallback(() => {
    if (!customClosed || activeAreaKind !== "turf") return;
    setDrawMode("roll");
    setInspectorFocus("roll");
    setInspectorTab("element");
  }, [customClosed, activeAreaKind]);
  const handleSelectBorderTool = useCallback(() => {
    setDrawMode("border");
    setInspectorFocus("border");
    setInspectorTab("element");
  }, []);
  const handleSelectPavingTool = useCallback(() => {
    updateActiveArea((areaItem) => ({ ...areaItem, kind: "paving" }));
    setInspectorFocus("paving");
    setInspectorTab("element");
  }, [updateActiveArea]);



  useEffect(() => {
    const origin = String(travel.departureBase || "").trim();
    const destination = String(projectInfo.address || "").trim();
    if (!origin || !destination) {
      setTravel(prev => ({
        ...prev,
        routeLoading: false,
        routeStatus: "",
        routeNote: "",
        driveMinutes: 0,
      }));
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setTravel(prev => ({
        ...prev,
        routeLoading: true,
        routeStatus: "Recupero distanza e tempi di viaggio...",
      }));
      try {
        const [originPoint, destinationPoint] = await Promise.all([
          geocodeItalianAddress(origin),
          geocodeItalianAddress(destination),
        ]);
        const destinationPricing = getRegionalMaterialPricing(destinationPoint.region || destinationPoint.regionRaw || "");
        if (!cancelled) {
          setRegionalPricing(destinationPricing);
        }
        const route = await fetchDrivingRoute(originPoint, destinationPoint);
        const tollEstimate = estimateItalianTolls(route.distanceKm);
        if (cancelled) return;
        setTravel(prev => ({
          ...prev,
          kmTotal: Number(route.distanceKm.toFixed(1)),
          driveMinutes: Number(route.durationMinutes.toFixed(0)),
          tollCost: Number(tollEstimate.toFixed(2)),
          routeLoading: false,
          routeNote: `${originPoint.label} → ${destinationPoint.label}`,
          routeStatus: `Percorso singola tratta aggiornato automaticamente. Regione cantiere: ${destinationPricing.region}. Caselli stimati su tariffa media autostradale classe B.`,
        }));
      } catch (error) {
        if (cancelled) return;
        setTravel(prev => ({
          ...prev,
          routeLoading: false,
          routeStatus: "Non riesco a calcolare il tragitto automatico con questi indirizzi. Puoi correggerli o lasciare i valori manuali.",
        }));
      }
    }, 850);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [projectInfo.address, travel.departureBase]);

  useEffect(() => {
    let active = true;
    fetch("/api/session", { credentials: "same-origin" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!active) return;
        const role = String(payload?.user?.role || "").trim().toLowerCase();
        setViewerRole(role === "office" ? "office" : "crew");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handlePrintReport = (variant = "technical") => {
    const reportNode = document.getElementById(variant === "client" ? "garden-planner-client-print-content" : "garden-planner-print-content");
    const printSheet = document.getElementById("garden-print-sheet");
    if (!reportNode || !printSheet) {
      window.print();
      return;
    }

    const body = document.body;
    const measureSheet = document.createElement("div");
    measureSheet.style.position = "fixed";
    measureSheet.style.left = "0";
    measureSheet.style.top = "0";
    measureSheet.style.width = "194mm";
    measureSheet.style.maxWidth = "194mm";
    measureSheet.style.visibility = "hidden";
    measureSheet.style.pointerEvents = "none";
    measureSheet.style.zIndex = "-1";
    const measureClone = reportNode.cloneNode(true);
    measureClone.classList.add("print-sheet-root");
    measureSheet.appendChild(measureClone);
    body.appendChild(measureSheet);
    const targetPrintHeightPx = Math.round((281 / 25.4) * 96);
    const measuredHeight = Number(measureClone.scrollHeight || 0);
    const printScale = variant === "client" ? 1 : measuredHeight > 0 ? Math.min(1, targetPrintHeightPx / measuredHeight) : 1;
    body.removeChild(measureSheet);

    printSheet.innerHTML = "";
    const printableClone = reportNode.cloneNode(true);
    printableClone.classList.add("print-sheet-root");
    printSheet.appendChild(printableClone);
    if (printScale < 0.995) {
      printableClone.style.zoom = String(Number(printScale.toFixed(3)));
    }

    let fallbackTimer = null;
    const cleanup = () => {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      body.classList.remove("garden-print-report");
      printSheet.innerHTML = "";
      window.removeEventListener("afterprint", cleanup);
    };
    body.classList.add("garden-print-report");
    window.addEventListener("afterprint", cleanup);
    fallbackTimer = window.setTimeout(cleanup, 7000);

    // Il clone ricrea gli <img> da zero (il logo header, versione cliente):
    // se window.print() parte prima che siano decodificati, alcuni motori di
    // stampa/PDF del browser li omettono in silenzio (segnalato dall'utente
    // il 27 set: "manca il logo"). Aspettiamo il caricamento di ognuno, con
    // un timeout breve di sicurezza per non restare bloccati se una
    // immagine non arriva mai.
    const images = Array.from(printableClone.querySelectorAll("img"));
    const waitForImage = (img) => (img.complete && img.naturalWidth > 0)
      ? Promise.resolve()
      : new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    const imagesReady = images.length
      ? Promise.race([
        Promise.all(images.map(waitForImage)),
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ])
      : Promise.resolve();

    imagesReady.then(() => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.print();
        });
      });
    });
  };

  const handleOpenQuoteGenerator = () => {
    const technicalNode = document.getElementById("garden-planner-print-content");
    const clientNode = document.getElementById("garden-planner-client-print-content");
    const installNeeds = estimateInstallationNeeds(turfArea, turfPerimeter, allManualRolls, rollUsage);
    const plannerBridge = buildPlannerQuotePrefill({
      projectInfo,
      area,
      turfArea,
      substrate,
      travel,
      installNeeds,
      borderType,
      borderMeters: selectedBorderMeters,
      decoItems,
      regionalPricing,
      viewerRole,
      pavingNeedsByArea,
      sourceRequestId,
    });
    plannerBridge.reportHtml = {
      technical: sanitizeQuoteBridgeReportHtml(technicalNode ? technicalNode.innerHTML : ""),
      client: sanitizeQuoteBridgeReportHtml(clientNode ? clientNode.innerHTML : ""),
    };
    try {
      window.localStorage.setItem(GARDEN_PLANNER_PREFILL_STORAGE_KEY, JSON.stringify(plannerBridge));
      window.localStorage.setItem("quote-generator-prefill", JSON.stringify({
        runId: Date.now(),
        source: "garden-planner",
        payload: plannerBridge.payload,
      }));
      window.localStorage.setItem(SALES_GENERATOR_PLANNER_REPORT_KEY, JSON.stringify({
        source: "garden-planner",
        runId: Number(plannerBridge.runId || Date.now()),
        title: "Allegato materiali Garden Planner",
        client: String(plannerBridge.client || "").trim(),
        address: String(plannerBridge.address || "").trim(),
        sqmLabel: String(plannerBridge.sqmLabel || "").trim(),
        materialsReference: plannerBridge.materialsReference,
        reportHtml: sanitizeQuoteBridgeReportHtml(String(plannerBridge.reportHtml?.client || plannerBridge.reportHtml?.technical || "").trim()),
      }));
    } catch {}
    const targetUrl = new URL("./index.html", window.location.href);
    targetUrl.searchParams.set("shell", APP_SHELL_VERSION);
    targetUrl.searchParams.set("view", "sales-generator");
    targetUrl.searchParams.set("planner", "1");
    window.open(targetUrl.toString(), "_blank", "noopener,noreferrer");
  };

  const borderPanel = (
    <div>
      <label style={lbl}>Bordura perimetrale</label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {BORDER_TYPES.map(bt => (
          <button key={bt.id} onClick={() => setBorderType(bt.id)} style={{
            padding: "6px 12px", borderRadius: 8,
            border: borderType === bt.id ? "2px solid " + B.primary : "1px solid " + B.border,
            background: borderType === bt.id ? B.light : B.white, fontSize: 11, fontWeight: borderType === bt.id ? 600 : 400,
            color: borderType === bt.id ? B.primary : B.text, cursor: "pointer",
          }}>{bt.name}</button>
        ))}
      </div>
      <p>Clicca A e B sulla tavola per ogni tratto. Le sovrapposizioni sullo stesso segmento vengono contate una sola volta.</p>
      <button type="button" style={btnPrim} onClick={()=>setDrawMode('border')}>Traccia bordura A–B</button>
      <p><strong>Totale bordura: {fmt(selectedBorderMeters,2)} m</strong></p>
      {borderSegments.map((s,i)=><div key={s.id} style={{display:'flex',justifyContent:'space-between',gap:8,marginBottom:8}}>
        <span>B{i+1} · {fmt(Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y),2)} m</span>
        <button type="button" aria-label={`Elimina bordura B${i+1}`} onClick={()=>setBorderSegments(prev=>prev.filter(b=>b.id!==s.id))}>Elimina</button>
      </div>)}
    </div>
  );

  const clientReportShell = (
    <div style={{ display: "none" }} aria-hidden="true">
      <ReportShell
        id="garden-planner-client-print-content"
        area={area}
        perimeter={perimeter}
        turfArea={turfArea}
        turfPerimeter={turfPerimeter}
        shape={shape}
        dims={safeDims}
        customPts={customPts}
        customClosed={customClosed}
        customAreas={completedAreas}
        borderSegments={borderType==='nessuna'?[]:borderSegments} borderMeters={selectedBorderMeters}
        borderType={borderType}
        substrate={substrate}
        decoItems={decoItems}
        projectInfo={projectInfo}
        travel={travel}
        viewerRole={viewerRole}
        regionalPricing={regionalPricing}
        manualRolls={allManualRolls}
        pavingNeedsByArea={pavingNeedsByArea}
        previewMode={previewMode}
        variant="client"
      />
    </div>
  );

  return (
    <div style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif", minHeight: "100vh", background: "transparent" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <GpChromeStyles />
      <div className={`gp-shell ${focusWorkspace ? "is-focused" : ""}`}>
        <GpTopBar
          client={projectInfo.client}
          address={projectInfo.address}
          area={area}
          previewMode={previewMode}
          onSetPreviewMode={setPreviewMode}
          onOpenGenerator={handleOpenQuoteGenerator}
          canOpenGenerator={area > 0}
        />

        <div className="gp-workspace-controls" aria-label="Spazio di lavoro">
          <button type="button" aria-pressed={focusWorkspace} onClick={() => {
            if (focusWorkspace) setInspectorOpen(inspectorBeforeFocus.current);
            else { inspectorBeforeFocus.current = inspectorOpen; setInspectorOpen(false); }
            setFocusWorkspace(v => !v);
          }}>
            {focusWorkspace ? "Esci dalla modalità disegno" : "Amplia area di disegno"}
          </button>
          <button type="button" aria-expanded={inspectorOpen} aria-controls="gp-inspector" onClick={() => setInspectorOpen(v => !v)}>
            {inspectorOpen ? "Nascondi proprietà e materiali" : "Mostra proprietà e materiali"}
          </button>
        </div>
        <div className="gp-workspace">
          <GpToolRail
            inspectorFocus={inspectorFocus}
            onSelectDraw={handleSelectDrawTool}
            onSelectRoll={handleSelectRollTool}
            onSelectBorder={handleSelectBorderTool}
            onSelectPaving={handleSelectPavingTool}
            closed={customClosed}
            activeAreaKind={activeAreaKind}
          />

          <div className="gp-canvas-col">
            <GpAreaStrip
              areas={plannerAreas}
              activeAreaId={activeAreaId}
              onSelectArea={setActiveAreaId}
              onAddArea={addPlannerArea}
              onRemoveArea={removeActivePlannerArea}
              canAddArea={Boolean(activeArea?.closed)}
            />
            <ShapeInput
              editor={editor}
              customPts={customPts}
              setCustomPts={setCustomPts}
              customClosed={customClosed}
              setCustomClosed={setCustomClosed}
              manualRolls={manualRolls}
              setManualRolls={setManualRolls}
              plannerAreas={plannerAreas}
              activeAreaId={activeAreaId}
              drawMode={drawMode}
              setDrawMode={setDrawMode}
              previewMode={previewMode}
              borderEdges={borderEdges}
              selectedBorderEdges={selectedBorderEdges}
              pendingOffcut={pendingOffcut} onPlaceOffcut={placeOffcut} onCancelOffcut={()=>setPendingOffcut(null)}
              showBorderOverlay={inspectorFocus === "border"}
            />
            {area > 0 && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <MetricCard label="Prato netto" value={fmt(turfArea) + " m²"} accent />
                <MetricCard label="Prato lordo" value={fmt(surfaceMetrics.grossTurf) + " m²"} />
                <MetricCard label="Escluso dal prato" value={fmt(surfaceMetrics.excluded) + " m²"} sub="Ostacoli e pavimentazioni, senza sovrapposizioni" />
                <MetricCard label="Fondo da preparare" value={fmt(area) + " m²"} />
                <MetricCard label="Perimetro esterno lordo" value={fmt(perimeter) + " m"} />
                {shape === "custom" && completedAreas.length
                  ? <MetricCard label="Elementi disegnati" value={`${completedAreas.length}`} sub={`${completedAreas.reduce((sum, areaItem) => sum + areaItem.points.length, 0)} vertici complessivi`} />
                  : null}
                <MetricCard label="Lati rilevati" value={`${borderEdges.length}`} sub="Perimetro disponibile" />
              </div>
            )}

            <GpBottomDock activeTab={activeDockTab} onSelectTab={setActiveDockTab}>
              <div className={`gp-dock-panel ${activeDockTab === "dati" ? "is-active" : ""}`}>
                <ProjectHeader info={projectInfo} setInfo={setProjectInfo} />
              </div>
              <div className={`gp-dock-panel ${activeDockTab === "trasferta" ? "is-active" : ""}`}>
                <TravelPlanner
                  travel={travel}
                  setTravel={setTravel}
                  cantiereAddress={projectInfo.address}
                  onCantiereAddressChange={(value) => setProjectInfo((prev) => ({ ...prev, address: value }))}
                />
              </div>
              <div className={`gp-dock-panel ${activeDockTab === "fondo" ? "is-active" : ""}`} style={{ flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <DimInput label="Scavo da effettuare" value={substrate.scavoCm} onChange={v => setSubstrate(p => ({ ...p, scavoCm: parseFloat(v) || 0 }))} unit="cm" />
                  <DimInput label="Fondo drenante" value={substrate.drenateCm} onChange={v => setSubstrate(p => ({ ...p, drenateCm: parseFloat(v) || 0 }))} unit="cm" />
                  <DimInput label="Sabbia livellamento" value={substrate.sabbiaCm} onChange={v => setSubstrate(p => ({ ...p, sabbiaCm: parseFloat(v) || 0 }))} unit="cm" />
                </div>
                {area > 0 && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {substrate.scavoCm > 0 && <MetricCard label="Terra da smaltire" value={fmt((area * substrate.scavoCm) / 100, 2) + " m³"} sub={Math.round(area * substrate.scavoCm / 100 * 1400) + " kg circa"} warning />}
                    {substrate.drenateCm > 0 && <MetricCard label="Pietrisco drenante" value={fmt((area * substrate.drenateCm) / 100, 2) + " m³"} sub={Math.round(area * substrate.drenateCm / 100 * 1600) + " kg circa"} />}
                    {substrate.sabbiaCm > 0 && <MetricCard label="Sabbia livellamento" value={Math.round(area * substrate.sabbiaCm / 100 * 1500) + " kg"} sub={fmt((area * substrate.sabbiaCm) / 100, 2) + " m³"} />}
                  </div>
                )}

              </div>
              <div className={`gp-dock-panel ${activeDockTab === "extra" ? "is-active" : ""}`}>
                <DecoSection decoItems={decoItems} setDecoItems={setDecoItems} />
              </div>
            </GpBottomDock>
          </div>

          <div id="gp-inspector" className="gp-inspector" style={{ display: inspectorOpen ? undefined : "none" }}>
            {turfArea>0 && <RollUsageSummary usage={rollUsage}/> }
            {allManualRolls.length>0 && <GpOffcutTray candidates={recoverableStrips} pending={pendingOffcut}
              onChoose={c=>{setPendingOffcut(c);setActiveAreaId(c.areaId);setDrawMode("shape");}}
              onCancel={()=>setPendingOffcut(null)} canUndo={cutHistory?.after===plannerAreas}
              onUndo={()=>{setPlannerAreas(cutHistory.before);setCutHistory(null);setPendingOffcut(null);}}/>}
            <GpPrecisionPanel area={activeArea} areas={plannerAreas} onUpdate={updateActiveArea} onAdd={next=>{
              setPlannerAreas(prev=>prev.length===1 && !prev[0].points.length ? [next] : [...prev,next]);
              setActiveAreaId(next.id); setDrawMode("shape"); setInspectorFocus("draw");
            }}/>
            <div className="gp-inspector-tabs">
              <button type="button" className={inspectorTab === "element" ? "is-active" : ""} onClick={() => setInspectorTab("element")}>Elemento</button>
              <button type="button" className={inspectorTab === "summary" ? "is-active" : ""} onClick={() => setInspectorTab("summary")}>Riepilogo</button>
            </div>
            <div className="gp-inspector-body">
              {inspectorTab === "element" ? (
                <>
                  {activeAreaKind === "exclusion" && <div style={{ marginBottom: 12 }}>
                    <label style={lbl} htmlFor="gp-exclusion-label">Elemento escluso dal prato</label>
                    <select id="gp-exclusion-label" value={activeArea.label || "Casa / ostacolo"} onChange={e => updateActiveArea(a => ({ ...a, label: e.target.value }))} style={fieldInp}>
                      {["Casa / ostacolo", "Abitazione", "Casetta", "Patio esistente", "Piscina", "Aiuola", "Albero"].map(label => <option key={label}>{label}</option>)}
                    </select>
                    <p style={{ fontSize: 12 }}>Disegna il contorno dell'elemento. Solo la parte che interseca il giardino viene sottratta; qui non si conteggiano prato, pavimentazione o fondo.</p>
                  </div>}
                  {inspectorFocus === "border" ? borderPanel : null}
                  {inspectorFocus === "paving" ? (
                    <GpPavingPicker
                      activeAreaKind={activeAreaKind}
                      activeTileSize={activeTileSize}
                      activeTileLayout={activeTileLayout}
                      onUpdateActiveArea={(patch) => updateActiveArea((areaItem) => ({ ...areaItem, ...patch }))}
                    />
                  ) : null}
                  {inspectorFocus === "draw" || inspectorFocus === "roll" ? (
                    <div style={{ fontSize: 12, color: B.textMuted, lineHeight: 1.5 }}>
                      Area attiva: <strong style={{ color: B.dark }}>{customClosed ? `${fmt(polyArea(customPts))} m\u00B2` : "perimetro aperto"}</strong>{activeAreaKind === "paving" ? " · pavimentazione" : ""}
                    </div>
                  ) : null}
                  <InstallationNeedsPanel area={turfArea} perimeter={turfPerimeter} borderType={borderType} borderSegments={borderType==='nessuna'?[]:borderSegments} borderMeters={selectedBorderMeters} manualRolls={allManualRolls} rollUsage={rollUsage} />
                  {completedPavingAreas.length > 0 ? (
                    <PavingNeedsPanel pavingNeedsByArea={pavingNeedsByArea} pavingTilesTotal={pavingTilesTotal} />
                  ) : null}
                </>
              ) : (
                <>
                  <div>
                    <div style={{ fontSize: 12, color: B.textMuted, lineHeight: 1.4, marginBottom: 10 }}>
                      Questo è il report che finisce in stampa o allegato al preventivo — stessi dati, due versioni.
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button onClick={() => handlePrintReport("technical")} style={{ ...btnPrim, whiteSpace: "nowrap", fontSize: 11, padding: "7px 12px" }}>Stampa report tecnico</button>
                      <button onClick={() => handlePrintReport("client")} style={{ ...btnPrim, whiteSpace: "nowrap", fontSize: 11, padding: "7px 12px", background: B.white, color: B.primary, border: "1px solid " + B.primary }}>Stampa versione cliente</button>
                    </div>
                  </div>
                  <div style={{ border: "1px solid " + B.borderLight, borderRadius: 12, background: B.white, padding: 14 }}>
                    <ReportShell
                      id="garden-planner-print-content"
                      area={area}
                      perimeter={perimeter}
                      turfArea={turfArea}
                      turfPerimeter={turfPerimeter}
                      shape={shape}
                      dims={safeDims}
                      customPts={customPts}
                      customClosed={customClosed}
                      customAreas={completedAreas}
                      borderSegments={borderType==='nessuna'?[]:borderSegments} borderMeters={selectedBorderMeters}
                      borderType={borderType}
                      substrate={substrate}
                      decoItems={decoItems}
                      projectInfo={projectInfo}
                      travel={travel}
                      viewerRole={viewerRole}
                      regionalPricing={regionalPricing}
                      manualRolls={allManualRolls}
                      pavingNeedsByArea={pavingNeedsByArea}
                      previewMode={previewMode}
                      variant="technical"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {clientReportShell}

        <div style={{ textAlign: "center", padding: "8px 0 24px", fontSize: 11, color: B.textMuted }}>
          Garden Planner v3.5 - Prato Sintetico Italia / VERTEX SRLS - Strumento interno
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<GardenPlanner />);
