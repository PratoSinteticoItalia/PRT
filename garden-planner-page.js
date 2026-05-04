const { useState, useMemo, useRef, useEffect } = React;
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
const APP_SHELL_VERSION = "20260504-garden-request-service-wa-109";

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

const SHAPES = [
  { id: "custom", name: "Disegno libero", icon: "\u270E" },
];

const fmt = (n, d = 1) => Number(n).toFixed(d);
const fmtE = (n) => "\u20AC " + Number(n).toFixed(2);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const getLocalISODate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
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

function buildPlannerMaterialReferenceModel({
  area,
  substrate,
  travel,
  installNeeds,
  borderType,
  borderMeters,
  decoItems,
  regionalPricing,
  viewerRole = "crew",
  reportVariant = "technical",
}) {
  const isClientVariant = reportVariant === "client";
  const canViewMaterialCosts = String(viewerRole || "").trim().toLowerCase() === "office" && !isClientVariant;
  const stabilizedPerTon = Number(regionalPricing?.stabilizedPerTon) || Number(MATERIAL_COSTS.stabilizedPerTonFallback);
  const sandPerTon = Number(regionalPricing?.sandPerTon) || Number(MATERIAL_COSTS.sandPerTonFallback);
  const pricingRegionLabel = regionalPricing?.region || "Lazio (fallback)";
  const scavoM3 = (area * substrate.scavoCm) / 100;
  const drenateM3 = (area * substrate.drenateCm) / 100;
  const drenateTon = (drenateM3 * 1600) / 1000;
  const sabbiaM3 = (area * substrate.sabbiaCm) / 100;
  const sabbiaKg = sabbiaM3 * 1500;
  const sabbiaTon = sabbiaKg / 1000;
  const border = BORDER_TYPES.find((entry) => entry.id === borderType);
  const infillKg = area * INFILL_FO30.kgPerSqm;
  const infillBags = Math.ceil(infillKg / INFILL_FO30.bagKg);
  const substrateCost = (scavoM3 * MATERIAL_COSTS.scavoPerM3)
    + (drenateTon * stabilizedPerTon)
    + (sabbiaTon * sandPerTon);
  const poseMaterialCost = (installNeeds.geo * MATERIAL_COSTS.geoPerSqm)
    + (installNeeds.glueBuckets * MATERIAL_COSTS.glueBucket)
    + (installNeeds.tapeRolls * MATERIAL_COSTS.tapeRoll)
    + (installNeeds.pins * MATERIAL_COSTS.pinPerUnit)
    + (borderType !== "nessuna" ? borderMeters * Number(border?.price || 0) : 0);
  const infillCost = (infillKg / 1000) * INFILL_FO30.pricePerTon;
  const decoLines = Object.entries(decoItems || {})
    .filter(([, qty]) => Number(qty) > 0)
    .map(([id, qty]) => {
      const item = DECO_CATALOG.find((entry) => entry.id === id);
      return item
        ? { name: item.name, qty: `${qty} ${item.unit}`, cost: Number(qty) * Number(item.pricePerUnit || 0) }
        : null;
    })
    .filter(Boolean);
  const decoCost = decoLines.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const travelSummary = getTravelSummary(travel);
  const travelCost = travelSummary.totalCost;

  const sections = [
    {
      key: "substrate",
      cat: "PREPARAZIONE FONDO",
      meta: canViewMaterialCosts ? fmtE(substrateCost) : "Quantità da approvvigionare",
      showCosts: canViewMaterialCosts,
      items: [
        substrate.scavoCm > 0 ? { name: "Scavo e smaltimento (" + substrate.scavoCm + "cm)", qty: fmt(scavoM3, 2) + " m\u00B3 \u2248 " + Math.round(scavoM3 * 1400) + " kg", cost: scavoM3 * MATERIAL_COSTS.scavoPerM3 } : null,
        substrate.drenateCm > 0 ? { name: "Stabilizzato drenante (" + substrate.drenateCm + "cm)", qty: canViewMaterialCosts ? `${fmt(drenateM3, 2)} m\u00B3 · ${fmt(drenateTon, 2)} t (${fmt(stabilizedPerTon, 1)} €/t)` : `${fmt(drenateM3, 2)} m\u00B3 · ${fmt(drenateTon, 2)} t`, cost: drenateTon * stabilizedPerTon } : null,
        substrate.sabbiaCm > 0 ? { name: "Sabbia livellamento 0/4 (" + substrate.sabbiaCm + "cm)", qty: canViewMaterialCosts ? `${Math.round(sabbiaKg)} kg · ${fmt(sabbiaTon, 2)} t (${fmt(sandPerTon, 1)} €/t)` : `${Math.round(sabbiaKg)} kg · ${fmt(sabbiaTon, 2)} t`, cost: sabbiaTon * sandPerTon } : null,
      ].filter(Boolean),
      sub: substrateCost,
    },
    {
      key: "pose-materials",
      cat: "MATERIALI POSA",
      meta: canViewMaterialCosts ? fmtE(poseMaterialCost) : "Quantità da ordinare",
      showCosts: canViewMaterialCosts,
      items: [
        { name: "Tessuto non tessuto", qty: fmt(installNeeds.geo) + " m\u00B2", cost: installNeeds.geo * MATERIAL_COSTS.geoPerSqm },
        {
          name: "Colla bicomponente",
          qty: installNeeds.calcMode === "layout"
            ? `${installNeeds.glueBuckets} secch${installNeeds.glueBuckets === 1 ? "io" : "i"} da ${GLUE_BUCKET_KG} kg · 1 secchio per rotolo banda`
            : `${fmt(installNeeds.glueKg, 1)} kg${installNeeds.glueBuckets > 0 ? ` · ${installNeeds.glueBuckets} secch${installNeeds.glueBuckets > 1 ? "i" : "io"} da ${GLUE_BUCKET_KG} kg` : ""} (${fmt(INSTALLATION_RULES.glueKgPerSqm, 1)} kg/m²)`,
          cost: installNeeds.glueBuckets * MATERIAL_COSTS.glueBucket,
        },
        installNeeds.jointMeters > 0 ? {
          name: "Nastro giunzione",
          qty: installNeeds.calcMode === "layout"
            ? `${fmt(installNeeds.jointMeters, 1)} m reali${installNeeds.tapeRolls > 0 ? ` · ${installNeeds.tapeRolls} rotol${installNeeds.tapeRolls > 1 ? "i" : "o"} da ${TAPE_ROLL_M} m` : ""}`
            : `${Math.round(installNeeds.jointMeters)} m stimati${installNeeds.tapeRolls > 0 ? ` · ${installNeeds.tapeRolls} rotol${installNeeds.tapeRolls > 1 ? "i" : "o"} da ${TAPE_ROLL_M} m` : ""}`,
          cost: installNeeds.tapeRolls * MATERIAL_COSTS.tapeRoll,
        } : null,
        { name: "Chiodi a U", qty: installNeeds.pins + " pz", cost: installNeeds.pins * MATERIAL_COSTS.pinPerUnit },
        borderType !== "nessuna" && borderMeters > 0 ? { name: border?.name || "Bordura", qty: fmt(borderMeters) + " m", cost: borderMeters * Number(border?.price || 0) } : null,
      ].filter(Boolean),
      sub: poseMaterialCost,
    },
    {
      key: "infill",
      cat: "INTASO",
      meta: canViewMaterialCosts ? fmtE(infillCost) : "Quantità da ordinare",
      showCosts: canViewMaterialCosts,
      items: [
        { name: INFILL_FO30.name, qty: `${Math.round(infillKg)} kg · ${infillBags} sacchi da ${INFILL_FO30.bagKg} kg`, cost: infillCost },
      ],
      sub: infillCost,
    },
  ];

  if (decoLines.length > 0) {
    sections.push({
      key: "extras",
      cat: "MATERIALI AGGIUNTIVI",
      meta: canViewMaterialCosts ? fmtE(decoCost) : "Extra selezionati",
      showCosts: canViewMaterialCosts,
      items: decoLines,
      sub: decoCost,
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
  const materialCostTotal = materialSections.reduce((sum, section) => sum + (Number(section.sub) || 0), 0);

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

function buildPlannerQuotePrefill({ projectInfo, area, substrate, travel, installNeeds, borderType, borderMeters, decoItems, regionalPricing, viewerRole = "crew" }) {
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
    area,
    substrate,
    travel,
    installNeeds,
    borderType,
    borderMeters,
    decoItems,
    regionalPricing,
    viewerRole,
    reportVariant: "technical",
  });
  return {
    runId: Date.now(),
    createdAt: new Date().toISOString(),
    client: clientName,
    address,
    city,
    sqmLabel: `${fmt(area, 1)} m²`,
    serviceLabel: "Fornitura + posa",
    surfaceLabel: substrateSummary || "Fondo da definire",
    note: [
      address ? `Cantiere: ${address}` : "",
      substrateSummary ? `Fondo: ${substrateSummary}` : "",
      travel?.departureBase ? `Partenza: ${travel.departureBase}` : "",
      String(projectInfo.notes || "").trim(),
    ].filter(Boolean).join(" · "),
    materialHighlights: [
      `Prato ${fmt(area, 1)} m²`,
      `TNT ${fmt(installNeeds.geo, 1)} m²`,
      installNeeds.tapeRolls > 0 ? `Banda ${fmt(installNeeds.jointMeters, 1)} m · ${installNeeds.tapeRolls} rot.` : "",
      installNeeds.glueBuckets > 0 ? `Colla ${installNeeds.glueBuckets} secchi` : "",
      borderLabel,
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
      mq: Number(area).toFixed(1),
      altezza: "",
      servizio: "Fornitura + posa",
      fondo: substrateSummary || "Fondo da definire",
      whatsappTemplate: "",
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
function calcShapeArea(shape, dims) {
  const { a = 0, b = 0, c = 0, d = 0 } = sanitizeDims(shape, dims);
  if (shape === "rect") return a * b;
  if (shape === "lshape") return (a * b) - ((a - c) * (b - d));
  if (shape === "ushape") return (a * b) - ((a - 2 * c) * d);
  return 0;
}
function calcShapePerimeter(shape, dims) {
  const { a = 0, b = 0, c = 0, d = 0 } = sanitizeDims(shape, dims);
  if (shape === "rect") return 2 * (a + b);
  if (shape === "lshape") return 2 * (a + b);
  if (shape === "ushape") return 2 * (a + b + d);
  return 0;
}
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

function estimateInstallationNeeds(area, perimeter, manualRolls = []) {
  const safeArea = Math.max(0, Number(area) || 0);
  const safePerimeter = Math.max(0, Number(perimeter) || 0);
  const geo = safeArea * INSTALLATION_RULES.geoCoverageFactor;
  const layoutMetrics = estimateRollLayoutMetrics(manualRolls);
  const layoutCoverageRatio = safeArea > 0 ? layoutMetrics.coverageArea / safeArea : 0;
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
    layoutCoverageArea: layoutMetrics.coverageArea,
    layoutJointMeters: layoutMetrics.jointMeters,
    sideJointMeters: layoutMetrics.sideJointMeters,
    endJointMeters: layoutMetrics.endJointMeters,
    jointPairCount: layoutMetrics.pairCount,
    fallbackGlueKg,
    fallbackJointMeters,
  };
}

/* ═══════════════════════════════════════════
   CANVAS
   ═══════════════════════════════════════════ */
const GRID = 0.5;
const BASE_PX = 36;

function FreeDrawCanvas({ points, setPoints, closed, setClosed, rolls = [], setRolls }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const pointerStateRef = useRef({ pointerId: null, mode: "", start: null, moved: false });
  const [hoverPt, setHoverPt] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [canvasW, setCanvasW] = useState(760);
  const [zoom, setZoom] = useState(1);
  const [drawMode, setDrawMode] = useState("shape");
  const [rollStart, setRollStart] = useState(null);
  const [canvasMessage, setCanvasMessage] = useState("");
  const canvasH = 420;
  const PX = BASE_PX * zoom;

  const snap = v => Math.round(v / GRID) * GRID;
  const toM = px => snap(px / PX);
  const toPx = m => m * PX;
  const totalRollMeters = useMemo(
    () => (Array.isArray(rolls) ? rolls.reduce((sum, roll) => sum + (Number(roll.length) || 0), 0) : 0),
    [rolls],
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const updateCanvasW = () => {
      const w = Math.max(280, Math.floor(containerRef.current?.offsetWidth || 0));
      if (w > 0) setCanvasW(w);
    };

    updateCanvasW();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateCanvasW);
      observer.observe(containerRef.current);
      return () => observer.disconnect();
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

  const getPos = e => {
    const r = canvasRef.current.getBoundingClientRect();
    return { mx: toM(e.clientX - r.left), my: toM(e.clientY - r.top) };
  };

  const resetPointerState = () => {
    pointerStateRef.current = { pointerId: null, mode: "", start: null, moved: false };
  };

  const handleCanvasTap = ({ x: mx, y: my }) => {
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
    const { mx, my } = getPos(e);
    setHoverPt({ x: mx, y: my });
    const pointerState = pointerStateRef.current;
    if (pointerState.pointerId !== e.pointerId) return;
    if (pointerState.start && Math.hypot(mx - pointerState.start.x, my - pointerState.start.y) > 0.08) {
      pointerState.moved = true;
    }
    if (pointerState.mode === "drag" && dragging !== null && closed) {
      setPoints(prev => prev.map((p, i) => i === dragging ? { x: mx, y: my } : p));
    }
  };

  const handlePointerDown = e => {
    if (typeof e.button === "number" && e.button !== 0) return;
    const { mx, my } = getPos(e);
    setHoverPt({ x: mx, y: my });
    if (drawMode === "shape" && closed) {
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
    if (pointerState.mode === "tap") {
      handleCanvasTap({ x: mx, y: my });
    }
    setDragging(null);
    canvasRef.current?.releasePointerCapture?.(e.pointerId);
    resetPointerState();
  };

  const handlePointerCancel = e => {
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

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.fillStyle = "#fafaf7"; ctx.fillRect(0, 0, canvasW, canvasH);

    // Sub-grid
    ctx.strokeStyle = "#eceae2"; ctx.lineWidth = 0.5;
    for (let x = 0; x < canvasW; x += GRID * PX) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke(); }
    for (let y = 0; y < canvasH; y += GRID * PX) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke(); }
    // Meter grid
    ctx.strokeStyle = "#d8d7cf"; ctx.lineWidth = 1;
    for (let x = 0; x < canvasW; x += PX) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke(); }
    for (let y = 0; y < canvasH; y += PX) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke(); }
    // Labels
    ctx.fillStyle = B.textMuted; ctx.font = "10px sans-serif";
    for (let m = 1; m * PX < canvasW; m++) ctx.fillText(m + "m", m * PX + 2, 11);
    for (let m = 1; m * PX < canvasH; m++) ctx.fillText(m + "m", 3, m * PX - 3);

    // Polygon
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(toPx(points[0].x), toPx(points[0].y));
      for (let i = 1; i < points.length; i++) ctx.lineTo(toPx(points[i].x), toPx(points[i].y));
      if (!closed && hoverPt) ctx.lineTo(toPx(hoverPt.x), toPx(hoverPt.y));
      if (closed) { ctx.closePath(); ctx.fillStyle = "rgba(29,107,53,0.1)"; ctx.fill(); }
      ctx.strokeStyle = B.primary; ctx.lineWidth = 2.5; ctx.stroke();

      // Edge lengths
      const all = [...points]; if (closed) all.push(all[0]);
      for (let i = 0; i < all.length - 1; i++) {
        const ax = toPx(all[i].x), ay = toPx(all[i].y), bx = toPx(all[i + 1].x), by = toPx(all[i + 1].y);
        const len = Math.hypot(all[i + 1].x - all[i].x, all[i + 1].y - all[i].y);
        if (len < 0.3) continue;
        const mx2 = (ax + bx) / 2, my2 = (ay + by) / 2, txt = fmt(len, 2) + "m";
        ctx.font = "bold 11px sans-serif"; const tw = ctx.measureText(txt).width;
        ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fillRect(mx2 - tw / 2 - 3, my2 - 9, tw + 6, 18);
        ctx.fillStyle = B.dark; ctx.textAlign = "center"; ctx.fillText(txt, mx2, my2 + 4); ctx.textAlign = "start";
      }

      const drawRoll = (roll, index, options = {}) => {
        const corners = getRollCorners(roll);
        if (!corners.length) return;
        const valid = isRollInsidePolygon(roll, points);
        ctx.beginPath();
        ctx.moveTo(toPx(corners[0].x), toPx(corners[0].y));
        for (let i = 1; i < corners.length; i++) ctx.lineTo(toPx(corners[i].x), toPx(corners[i].y));
        ctx.closePath();
        if (options.preview) {
          ctx.fillStyle = valid ? "rgba(21, 101, 192, 0.18)" : "rgba(198, 40, 40, 0.18)";
          ctx.strokeStyle = valid ? "#1565c0" : B.danger;
          ctx.setLineDash([6, 5]);
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = valid ? "rgba(21, 101, 192, 0.20)" : "rgba(198, 40, 40, 0.18)";
          ctx.strokeStyle = valid ? "#1565c0" : B.danger;
          ctx.setLineDash([]);
          ctx.lineWidth = 1.8;
        }
        ctx.stroke();
        ctx.fill();
        ctx.setLineDash([]);

        const labelText = options.preview
          ? `Preview ${fmt(roll.length, 2)}m`
          : `R${index + 1} · 2m × ${fmt(roll.length, 2)}m`;
        const labelX = toPx(roll.cx);
        const labelY = toPx(roll.cy);
        ctx.font = "bold 10px sans-serif";
        const tw = ctx.measureText(labelText).width;
        ctx.fillStyle = "rgba(255,255,255,0.94)";
        ctx.fillRect(labelX - tw / 2 - 4, labelY - 8, tw + 8, 16);
        ctx.fillStyle = valid ? "#0d2f16" : B.danger;
        ctx.textAlign = "center";
        ctx.fillText(labelText, labelX, labelY + 3);
        ctx.textAlign = "start";
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
        ctx.beginPath(); ctx.arc(px, py, closed ? 8 : 5, 0, Math.PI * 2);
        ctx.fillStyle = i === 0 && !closed ? B.accent : B.primary; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
        if (closed) { ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center"; ctx.fillText("" + (i + 1), px, py + 3); ctx.textAlign = "start"; }
      });

      // Close hint
      if (!closed && hoverPt && points.length > 2) {
        if (Math.hypot(hoverPt.x - points[0].x, hoverPt.y - points[0].y) < 0.7) {
          ctx.beginPath(); ctx.arc(toPx(points[0].x), toPx(points[0].y), 14, 0, Math.PI * 2);
          ctx.strokeStyle = B.accent; ctx.lineWidth = 2.5; ctx.stroke();
        }
      }
    }

    if (points.length === 0) {
      ctx.fillStyle = B.textMuted; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Clicca per posizionare i vertici del giardino", canvasW / 2, canvasH / 2 - 10);
      ctx.font = "12px sans-serif";
      ctx.fillText("Griglia = 0.5m · Clicca vicino al punto 1 per chiudere", canvasW / 2, canvasH / 2 + 14);
      ctx.textAlign = "start";
    }
  }, [points, hoverPt, closed, canvasW, canvasH, PX, zoom, rolls, drawMode, rollStart]);

  return (
    <div ref={containerRef}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: closed ? B.primary : B.textMuted, fontWeight: 500, lineHeight: 1.35 }}>
          {drawMode === "roll"
            ? `Modalità rotoli: click inizio + click fine. Larghezza fissa ${MANUAL_ROLL_WIDTH_M}m, lunghezza max ${MANUAL_ROLL_MAX_LENGTH_M}m.`
            : closed
              ? "Area chiusa — trascina i vertici per modificare il perimetro"
              : points.length === 0
                ? "Clicca per posizionare il primo vertice"
                : "Clicca per aggiungere vertici · Chiudi sul punto 1"}
        </div>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              setDrawMode("shape");
              setRollStart(null);
            }}
            style={{
              padding: "3px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer",
              border: drawMode === "shape" ? "1.5px solid " + B.primary : "1px solid " + B.border,
              background: drawMode === "shape" ? B.light : B.white, color: drawMode === "shape" ? B.primary : B.text, fontWeight: drawMode === "shape" ? 700 : 500,
            }}
          >
            Perimetro
          </button>
          <button
            type="button"
            onClick={() => {
              if (!closed) return;
              setDrawMode("roll");
              setRollStart(null);
            }}
            disabled={!closed}
            style={{
              padding: "3px 8px", borderRadius: 4, fontSize: 11, cursor: closed ? "pointer" : "not-allowed",
              border: drawMode === "roll" ? "1.5px solid #1565c0" : "1px solid " + B.border,
              background: drawMode === "roll" ? "#e8f1ff" : B.white, color: drawMode === "roll" ? "#1565c0" : B.textMuted, fontWeight: drawMode === "roll" ? 700 : 500,
              opacity: closed ? 1 : 0.55,
            }}
          >
            Aggiungi rotolo
          </button>
          <button
            type="button"
            onClick={undoLastPoint}
            disabled={!points.length}
            style={{
              padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11,
              cursor: points.length ? "pointer" : "not-allowed", color: points.length ? B.text : B.textMuted, opacity: points.length ? 1 : 0.55,
            }}
          >
            {closed ? "Riapri" : "Annulla punto"}
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
            onClick={reopenShape}
            disabled={!closed}
            style={{
              padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11,
              cursor: closed ? "pointer" : "not-allowed", color: closed ? B.text : B.textMuted, opacity: closed ? 1 : 0.55,
            }}
          >
            Modifica profilo
          </button>
          <span style={{ fontSize: 11, color: B.textMuted }}>Zoom:</span>
          {[0.6, 0.8, 1, 1.3, 1.6].map(z => (
            <button key={z} onClick={() => setZoom(z)} style={{
              padding: "3px 8px", borderRadius: 4, fontSize: 11, cursor: "pointer",
              border: zoom === z ? "1.5px solid " + B.primary : "1px solid " + B.border,
              background: zoom === z ? B.light : B.white, color: zoom === z ? B.primary : B.text, fontWeight: zoom === z ? 600 : 400,
            }}>{Math.round(z * 100)}%</button>
          ))}
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
          <button onClick={reset} style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid " + B.border, background: B.white, fontSize: 11, cursor: "pointer", color: B.text }}>Ricomincia</button>
        </div>
      </div>
      <canvas ref={canvasRef} width={canvasW} height={canvasH}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
        style={{
          width: "100%",
          height: canvasH,
          borderRadius: 10,
          border: "1.5px solid " + (closed ? B.primary : B.border),
          cursor: drawMode === "roll" && closed ? "crosshair" : closed ? (dragging !== null ? "grabbing" : "default") : "crosshair",
          display: "block",
          touchAction: "none",
        }}
      />

      {points.length > 0 && (
        <div style={{ marginTop: 10, padding: "10px 12px", border: "1px solid " + B.borderLight, borderRadius: 8, background: B.white, fontSize: 12, color: B.textMuted }}>
          {drawMode === "roll" && closed
            ? `${rolls.length} rotoli inseriti (${fmt(totalRollMeters, 2)} m lineari). ${canvasMessage || "I rotoli possono uscire dal perimetro per stimare lo scarto reale."}`
            : closed
              ? `${points.length} vertici definiti. Per modificare il perimetro trascina i punti direttamente sul disegno.`
              : `${points.length} vertici inseriti. Continua a cliccare sul disegno e chiudi il perimetro sul punto iniziale.`}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   UI ATOMS
   ═══════════════════════════════════════════ */
function Header() {
  return (
    <div style={{ background: "linear-gradient(135deg, #0f2a18 0%, #163a22 100%)", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={() => {
          if (window.history.length > 1) window.history.back();
          else window.location.href = "./index.html";
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "9px 14px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.16)",
          background: "rgba(255,255,255,0.08)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <span aria-hidden="true">←</span>
        <span>Torna al portale</span>
      </button>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: B.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 18, border: "2px solid rgba(255,255,255,0.2)" }}>PS</div>
      <div>
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>Garden Planner</div>
        <div style={{ color: B.accent, fontSize: 11, fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>Prato Sintetico Italia - Vertex SRLS</div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>v3.4</div>
    </div>
  );
}
function MetricCard({ label, value, sub, accent, warning }) {
  return (
    <div style={{ background: warning ? B.warnBg : accent ? B.infoBg : B.gray, borderRadius: 10, padding: "12px 16px", flex: 1, minWidth: 130, border: "1px solid " + (warning ? "#ffe0b2" : accent ? "#bbdefb" : B.borderLight) }}>
      <div style={{ fontSize: 10, color: B.textMuted, marginBottom: 3, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: warning ? B.warn : accent ? B.info : B.dark }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function StepBadge({ n }) {
  return <div style={{ width: 28, height: 28, borderRadius: "50%", background: B.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{n}</div>;
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
function ShapePreview({ shape, dims }) {
  const W = 240, H = 150, pad = 25;
  const { a = 0, b = 0, c = 0, d = 0 } = sanitizeDims(shape, dims);
  if (a <= 0 || b <= 0) return null;
  const scale = Math.min((W - pad * 2) / a, (H - pad * 2) / b);
  const sw = a * scale, sh = b * scale, ox = (W - sw) / 2, oy = (H - sh) / 2;
  let path = "";
  if (shape === "rect") path = "M" + ox + "," + oy + " h" + sw + " v" + sh + " h" + (-sw) + " Z";
  else if (shape === "lshape") { const cw = c * scale, cd = d * scale; path = "M" + ox + "," + oy + " h" + sw + " v" + cd + " h" + (-cw) + " v" + (sh - cd) + " h" + (-(sw - cw)) + " Z"; }
  else if (shape === "ushape") { const cw = c * scale, cd = d * scale; path = "M" + ox + "," + oy + " h" + sw + " v" + sh + " h" + (-cw) + " v" + (-cd) + " h" + (-(sw - 2 * cw)) + " v" + cd + " h" + (-cw) + " Z"; }
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
      <svg width={W} height={H} style={{ borderRadius: 8, background: B.cream, border: "1px solid " + B.borderLight }}>
        <path d={path} fill={B.primary + "18"} stroke={B.primary} strokeWidth={2} />
        <text x={ox + sw / 2} y={oy - 6} textAnchor="middle" fontSize={11} fill={B.primary} fontWeight={600}>{a}m</text>
        <text x={ox + sw + 8} y={oy + sh / 2} textAnchor="start" fontSize={11} fill={B.primary} fontWeight={600} dominantBaseline="middle">{b}m</text>
      </svg>
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

function TravelPlanner({ travel, setTravel }) {
  const upd = (key, value) => setTravel(prev => ({ ...prev, [key]: value }));
  const travelSummary = getTravelSummary(travel);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <label style={lbl}>Sede di partenza</label>
          <input
            value={travel.departureBase}
            onChange={e => upd("departureBase", e.target.value)}
            placeholder="Es. Orta di Atella"
            style={fieldInp}
          />
        </div>
        <DimInput label="Km tratta" value={travel.kmTotal} onChange={v => upd("kmTotal", v)} unit="km" />
        <DimInput label="Km extra" value={travel.extraKm} onChange={v => upd("extraKm", v)} unit="km" />
        <DimInput label="Consumo medio" value={travel.fuelPer100Km} onChange={v => upd("fuelPer100Km", v)} unit="l/100" />
        <DimInput label="Prezzo carburante" value={travel.fuelPrice} onChange={v => upd("fuelPrice", v)} unit="€/l" />
        <DimInput label="Caselli tratta" value={travel.tollCost} onChange={v => upd("tollCost", v)} unit="€" />
      </div>
      <div style={{ marginTop: -4, fontSize: 11, color: B.textMuted, lineHeight: 1.4 }}>
        Usa <strong style={{ color: B.dark }}>Km extra</strong> per sommare viaggi locali, pietrisco, cantiere ↔ albergo o altri spostamenti extra già totali. I km extra incidono sul carburante ma non duplicano i caselli del navigatore.
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "10px 14px", borderRadius: 10, background: "#f7f7f2", border: "1px solid " + B.borderLight }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: B.dark }}>
            {travel.routeLoading ? "Calcolo tragitto in corso..." : "Calcolo automatico stile navigatore"}
          </div>
          <div style={{ fontSize: 11, color: B.textMuted, marginTop: 3 }}>
            {travel.routeStatus || "Inserisci sede di partenza e indirizzo cantiere: km, tempo, carburante e stima caselli si aggiornano in automatico."}
          </div>
        </div>
        {travelSummary.baseDriveMinutes > 0 ? (
          <div style={{ padding: "8px 12px", borderRadius: 999, background: B.infoBg, border: "1px solid #bbdefb", color: B.info, fontSize: 12, fontWeight: 700 }}>
            Tempo stimato: {Math.round(travelSummary.driveMinutes)} min {travelSummary.modeShortLabel}
          </div>
        ) : null}
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

function ShapeInput({ customPts, setCustomPts, customClosed, setCustomClosed, manualRolls, setManualRolls }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={secTitle}>Disegno libero tecnico</div>
      <div style={{ marginTop: -4, fontSize: 12, color: B.textMuted, lineHeight: 1.45 }}>
        Definisci il perimetro cliccando i vertici e chiudi sul punto iniziale. Poi usa <strong style={{ color: B.dark }}>Aggiungi rotolo</strong> per simulare la posa reale e gli scarti.
      </div>
      <FreeDrawCanvas
        points={customPts}
        setPoints={setCustomPts}
        closed={customClosed}
        setClosed={setCustomClosed}
        rolls={manualRolls}
        setRolls={setManualRolls}
      />
    </div>
  );
}

function TechnicalSketch({ shape, dims, customPts, customClosed, manualRolls = [] }) {
  const points = shape === "custom" ? (customClosed ? customPts : []) : getShapePolygon(shape, dims);
  if (!points.length) {
    return (
      <div style={{ padding: "18px 14px", borderRadius: 10, border: "1px dashed " + B.border, color: B.textMuted, fontSize: 12 }}>
        Completa il perimetro per vedere la tavola tecnica 2D.
      </div>
    );
  }
  const rollCornerPoints = (manualRolls || []).flatMap((roll) => getRollCorners(roll));
  const drawingPoints = rollCornerPoints.length ? [...points, ...rollCornerPoints] : points;
  const bb = polyBBox(drawingPoints);
  const W = 328;
  const H = 214;
  const pad = 28;
  const safeW = Math.max(bb.w, 0.5);
  const safeH = Math.max(bb.h, 0.5);
  const scale = Math.min((W - pad * 2) / safeW, (H - pad * 2) / safeH);
  const ox = (W - safeW * scale) / 2 - bb.minX * scale;
  const oy = (H - safeH * scale) / 2 - bb.minY * scale;
  const d = points.map((p, index) => `${index === 0 ? "M" : "L"}${(p.x * scale + ox).toFixed(2)},${(p.y * scale + oy).toFixed(2)}`).join(" ") + " Z";
  const occupiedLabels = [];
  const bounds = { width: W, height: H };
  const vertexPoints = points.map((p) => ({ x: p.x * scale + ox, y: p.y * scale + oy }));
  const rollPaths = (manualRolls || []).map((roll, index) => {
    const corners = getRollCorners(roll);
    const svgCorners = corners.map(corner => ({
      x: corner.x * scale + ox,
      y: corner.y * scale + oy,
    }));
    const path = svgCorners.map((corner, cornerIndex) => `${cornerIndex === 0 ? "M" : "L"}${corner.x.toFixed(2)},${corner.y.toFixed(2)}`).join(" ") + " Z";
    return {
      id: roll.id || `roll-${index}`,
      path,
      rollIndex: index + 1,
      length: Number(roll.length) || 0,
      cx: (Number(roll.cx) || 0) * scale + ox,
      cy: (Number(roll.cy) || 0) * scale + oy,
    };
  });
  vertexPoints.forEach((point) => registerOccupiedCircle(occupiedLabels, point.x, point.y, 6));
  rollPaths.forEach((roll) => registerOccupiedCircle(occupiedLabels, roll.cx, roll.cy, 8.5));
  const edges = points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    const edgeNormal = getEdgeOutwardNormal(point, next, points);
    const txt = `${fmt(Math.hypot(next.x - point.x, next.y - point.y), 2)}m`;
    const chipW = Math.max(30, txt.length * 5.4 + 10);
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
      length: Math.hypot(next.x - point.x, next.y - point.y),
      txt,
      chipW,
      chipH,
      labelRect,
    };
  });
  const vertexLabelRects = vertexPoints.map((point) => {
    const candidates = [
      { x: point.x, y: point.y - 14 },
      { x: point.x + 14, y: point.y - 10 },
      { x: point.x - 14, y: point.y - 10 },
      { x: point.x + 14, y: point.y + 12 },
      { x: point.x - 14, y: point.y + 12 },
      { x: point.x, y: point.y + 16 },
    ];
    return findAvailableLabelRect(candidates, 24, 12, occupiedLabels, bounds);
  });

  return (
    <div style={{ border: "1px solid " + B.borderLight, borderRadius: 12, background: B.white, padding: 10 }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <rect x="1" y="1" width={W - 2} height={H - 2} rx="10" fill={B.cream} stroke={B.borderLight} />
        <path d={d} fill={B.primary + "1c"} stroke={B.primary} strokeWidth="2.2" />
        {rollPaths.map(roll => (
          <g key={roll.id}>
            <path d={roll.path} fill="rgba(21,101,192,0.2)" stroke="#1565c0" strokeWidth="1.35" />
            <circle cx={roll.cx} cy={roll.cy} r="5.2" fill="#1565c0" stroke="#fff" strokeWidth="1.2" />
            <text x={roll.cx} y={roll.cy + 2.9} fontSize="7.4" textAnchor="middle" fill="#fff" fontWeight="700">
              {roll.rollIndex}
            </text>
          </g>
        ))}
        {edges.map((edge, index) => {
          return (
            <g key={index}>
              <rect x={edge.labelRect.x} y={edge.labelRect.y} width={edge.chipW} height={edge.chipH} rx={6} fill="rgba(255,255,255,0.96)" stroke={B.borderLight} />
              <text x={edge.labelRect.x + edge.chipW / 2} y={edge.labelRect.y + 10.6} fontSize="8.7" textAnchor="middle" fill={B.dark} fontWeight="700">
                {edge.txt}
              </text>
            </g>
          );
        })}
        {vertexPoints.map((point, index) => (
          <g key={`v-${index}`}>
            <circle cx={point.x} cy={point.y} r="4.3" fill={B.primary} stroke="#fff" strokeWidth="1.6" />
            <text x={vertexLabelRects[index].x + (vertexLabelRects[index].width / 2)} y={vertexLabelRects[index].y + 9} fontSize="8.2" textAnchor="middle" fill={B.dark} fontWeight="700">
              V{index + 1}
            </text>
          </g>
        ))}
      </svg>
      <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
        <div style={{ fontSize: 11, color: B.textMuted }}>
          Ingombro massimo: <strong style={{ color: B.dark }}>{fmt(bb.w, 2)} m × {fmt(bb.h, 2)} m</strong> · Vertici: <strong style={{ color: B.dark }}>{points.length}</strong>
        </div>
        {rollPaths.length > 0 ? (
          <div style={{ fontSize: 11, color: B.textMuted }}>
            Rotoli posizionati nel layout: <strong style={{ color: B.dark }}>{rollPaths.length}</strong>
          </div>
        ) : null}
        {rollPaths.length > 0 ? (
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
        ) : null}
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
      </div>
    </div>
  );
}

function InstallationNeedsPanel({ area, perimeter, borderType, borderMeters, manualRolls }) {
  if (area <= 0) return null;
  const border = BORDER_TYPES.find(item => item.id === borderType);
  const needs = estimateInstallationNeeds(area, perimeter, manualRolls);
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
          <MetricCard label={border?.name || "Bordura"} value={`${fmt(borderMeters, 1)} m`} sub="Lati selezionati" accent />
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

function MaterialsReport({ area, perimeter, shape, dims, customPts, customClosed, borderType, borderMeters, substrate, decoItems, projectInfo, travel, viewerRole, regionalPricing, manualRolls, reportVariant = "technical" }) {
  if (area <= 0) return <div style={{ color: B.textMuted, fontSize: 13, padding: 16, textAlign: "center" }}>Inserisci le dimensioni per vedere il riepilogo.</div>;

  const installNeeds = estimateInstallationNeeds(area, perimeter, manualRolls);
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
    substrate,
    travel,
    installNeeds,
    borderType,
    borderMeters,
    decoItems,
    regionalPricing,
    viewerRole,
    reportVariant,
  });
  const rollCount = Array.isArray(manualRolls) ? manualRolls.length : 0;
  const rollLinearMeters = Array.isArray(manualRolls)
    ? manualRolls.reduce((sum, roll) => sum + (Number(roll.length) || 0), 0)
    : 0;
  const rollVisualArea = rollLinearMeters * MANUAL_ROLL_WIDTH_M;
  const rollWasteArea = Math.max(0, rollVisualArea - area);
  const rollPolygon = shape === "custom"
    ? (customClosed ? customPts : [])
    : getShapePolygon(shape, dims);
  const outsideRollCount = rollPolygon.length >= 3
    ? (manualRolls || []).reduce((count, roll) => (isRollInsidePolygon(roll, rollPolygon) ? count : count + 1), 0)
    : 0;
  const shapeLabel = getShapeLabel(shape, dims, customPts, customClosed);
  const visibleSections = isClientVariant ? sections.filter((section) => section.key !== "travel") : sections;

  return (
    <div>
      {(projectInfo.client || projectInfo.address) && (
        <div className="print-no-break" style={{ marginBottom: 12, padding: "8px 12px", background: B.gray, borderRadius: 8, fontSize: 11.5, display: "flex", gap: 18, flexWrap: "wrap" }}>
          {projectInfo.client && <span><strong>Cliente:</strong> {projectInfo.client}</span>}
          {projectInfo.address && <span><strong>Cantiere:</strong> {projectInfo.address}</span>}
          {projectInfo.date && <span><strong>Data:</strong> {projectInfo.date}</span>}
          {projectInfo.notes && <span><strong>Note:</strong> {projectInfo.notes}</span>}
          {!isClientVariant && travel?.departureBase && <span><strong>Partenza:</strong> {travel.departureBase}</span>}
          {!isClientVariant && travelSummary.totalKm > 0 && <span><strong>Viaggio:</strong> {travelSummary.modeLabel}</span>}
          {!isClientVariant && travelSummary.extraKm > 0 && <span><strong>Km extra:</strong> {fmt(travelSummary.extraKm, 1)} km</span>}
          {!isClientVariant && <span><strong>Listino regionale:</strong> {pricingRegionLabel}</span>}
        </div>
      )}

      <div className="print-no-break" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 10, marginBottom: 12 }}>
        <TechnicalSketch shape={shape} dims={dims} customPts={customPts} customClosed={customClosed} manualRolls={manualRolls} />
        <div style={{ border: "1px solid " + B.borderLight, borderRadius: 12, background: B.white, padding: "10px 12px", display: "grid", gap: 7 }}>
          <div style={{ fontSize: 11, color: B.primary, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>Tavola tecnica 2D</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
            <div style={{ padding: "8px 10px", borderRadius: 8, background: B.cream, border: "1px solid " + B.borderLight }}>
              <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Superficie</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: B.dark }}>{fmt(area)} m²</div>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 8, background: B.cream, border: "1px solid " + B.borderLight }}>
              <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Perimetro</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: B.dark }}>{fmt(perimeter)} m</div>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 8, background: B.cream, border: "1px solid " + B.borderLight }}>
              <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Bordura</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: B.dark }}>{borderType === "nessuna" ? "No" : `${fmt(borderMeters)} m`}</div>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 8, background: B.cream, border: "1px solid " + B.borderLight }}>
              <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Forma</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: B.dark }}>{shapeLabel}</div>
            </div>
            <div style={{ padding: "8px 10px", borderRadius: 8, background: B.cream, border: "1px solid " + B.borderLight }}>
              <div style={{ fontSize: 10, color: B.textMuted, textTransform: "uppercase" }}>Layout rotoli</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: B.dark }}>{rollCount} rotoli</div>
              <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>{fmt(rollLinearMeters, 2)} m lineari · {fmt(rollVisualArea, 1)} m² coperti</div>
              <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>
                Scarto stimato: <strong style={{ color: B.dark }}>{fmt(rollWasteArea, 1)} m²</strong>
                {outsideRollCount > 0 ? ` · ${outsideRollCount} rotol${outsideRollCount > 1 ? "i" : "o"} oltre bordo` : ""}
              </div>
              <div style={{ fontSize: 11, color: B.textMuted, marginTop: 2 }}>
                Giunzioni: <strong style={{ color: B.dark }}>{fmt(installNeeds.jointMeters, 1)} m</strong> · {installNeeds.calcMode === "layout" ? "layout reale" : "stima provvisoria"}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: B.textMuted, lineHeight: 1.45 }}>
            Specifiche tecniche: scavo {substrate.scavoCm} cm, drenante {substrate.drenateCm} cm, sabbia {substrate.sabbiaCm} cm{!isClientVariant ? ` · Posa ${installNeeds.calcMode === "layout" ? "calcolata da layout rotoli" : `in fallback da m² finché il layout non copre il ${fmt(INSTALLATION_RULES.layoutCoverageMin * 100, 0)}% dell'area`}` : "."}{!isClientVariant ? ` · Listino ${pricingRegionLabel}: stabilizzato ${fmt(stabilizedPerTon, 1)} €/t, sabbia ${fmt(sandPerTon, 1)} €/t.` : ""}
          </div>
        </div>
      </div>

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
            <span>{canViewMaterialCosts ? "TOTALE COSTI OPERATIVI (NO PRATO)" : "STIMA COSTI TRASFERTA"}</span>
            <span style={{ color: B.accent, fontSize: 17 }}>{fmtE(canViewMaterialCosts ? operationalCostTotal : travelCost)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ReportShell({ id, variant = "technical", area, perimeter, shape, dims, customPts, customClosed, borderMeters, borderType, substrate, decoItems, projectInfo, travel, viewerRole, regionalPricing, manualRolls }) {
  const isClientVariant = variant === "client";
  return (
    <div id={id}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10, padding: "8px 2px 10px", borderBottom: "1px solid " + B.borderLight }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: B.primary, letterSpacing: "0.4px", textTransform: "uppercase" }}>Prato Sintetico Italia</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: B.dark, lineHeight: 1.15 }}>
            {isClientVariant ? "Report materiali Garden Planner" : "Report tecnico Garden Planner"}
          </div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, color: B.textMuted }}>
          <div><strong style={{ color: B.dark }}>Data report:</strong> {projectInfo.date || getLocalISODate()}</div>
          {projectInfo.client ? <div><strong style={{ color: B.dark }}>Cliente:</strong> {projectInfo.client}</div> : null}
          <div><strong style={{ color: B.dark }}>Versione:</strong> {isClientVariant ? "Cliente" : "Tecnica"}</div>
        </div>
      </div>
      <MaterialsReport
        area={area}
        perimeter={perimeter}
        shape={shape}
        dims={dims}
        customPts={customPts}
        customClosed={customClosed}
        borderMeters={borderMeters}
        borderType={borderType}
        substrate={substrate}
        decoItems={decoItems}
        projectInfo={projectInfo}
        travel={travel}
        viewerRole={viewerRole}
        regionalPricing={regionalPricing}
        manualRolls={manualRolls}
        reportVariant={variant}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════ */
const secTitle = { fontSize: 12, fontWeight: 700, color: B.dark, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.2px" };
const btnPrim = { padding: "8px 16px", borderRadius: 8, border: "none", background: B.primary, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const cardStyle = { background: B.white, borderRadius: 12, padding: "20px 24px", border: "1px solid " + B.borderLight };
const lbl = { display: "block", fontSize: 11, color: B.textMuted, marginBottom: 4, fontWeight: 500 };
const fieldInp = { width: "100%", padding: "10px 14px", border: "1.5px solid " + B.border, borderRadius: 10, fontSize: 13, boxSizing: "border-box", outline: "none", color: B.dark };

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
function GardenPlanner() {
  const [viewerRole, setViewerRole] = useState("crew");
  const [projectInfo, setProjectInfo] = useState(getInitialProjectInfo);
  const [travel, setTravel] = useState(DEFAULT_TRAVEL_SETTINGS);
  const shape = "custom";
  const [customPts, setCustomPts] = useState([]);
  const [customClosed, setCustomClosed] = useState(false);
  const [manualRolls, setManualRolls] = useState([]);
  const [borderType, setBorderType] = useState("pvc");
  const [selectedBorderEdges, setSelectedBorderEdges] = useState([]);
  const [substrate, setSubstrate] = useState({ scavoCm: 10, drenateCm: 5, sabbiaCm: 3 });
  const [decoItems, setDecoItems] = useState({});
  const [regionalPricing, setRegionalPricing] = useState(() => getRegionalMaterialPricing(""));
  const safeDims = useMemo(() => ({ a: 0, b: 0, c: 0, d: 0 }), []);
  const layoutKey = useMemo(() => JSON.stringify({ customPts, customClosed }), [customPts, customClosed]);

  const area = useMemo(() => (customClosed ? polyArea(customPts) : 0), [customPts, customClosed]);
  const perimeter = useMemo(() => (customClosed ? polyPerimeter(customPts) : 0), [customPts, customClosed]);
  const borderEdges = useMemo(() => getShapeEdges(shape, safeDims, customPts, customClosed), [shape, safeDims, customPts, customClosed]);
  const selectedBorderMeters = useMemo(() => (
    borderEdges
      .filter(edge => selectedBorderEdges.includes(edge.id))
      .reduce((sum, edge) => sum + edge.length, 0)
  ), [borderEdges, selectedBorderEdges]);

  useEffect(() => {
    setSelectedBorderEdges(borderEdges.map(edge => edge.id));
  }, [layoutKey, borderEdges]);

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
    const printScale = measuredHeight > 0 ? Math.min(1, targetPrintHeightPx / measuredHeight) : 1;
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
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  const handleOpenQuoteGenerator = () => {
    const technicalNode = document.getElementById("garden-planner-print-content");
    const clientNode = document.getElementById("garden-planner-client-print-content");
    const installNeeds = estimateInstallationNeeds(area, perimeter, manualRolls);
    const plannerBridge = buildPlannerQuotePrefill({
      projectInfo,
      area,
      substrate,
      travel,
      installNeeds,
      borderType,
      borderMeters: selectedBorderMeters,
      decoItems,
      regionalPricing,
      viewerRole,
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

  return (
    <div style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif", minHeight: "100vh", background: B.cream }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Header />
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* PROJECT INFO */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={0} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Dati progetto</span>
          </div>
          <ProjectHeader info={projectInfo} setInfo={setProjectInfo} />
        </div>

        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={"0B"} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Trasferta e costi viaggio</span>
          </div>
          <TravelPlanner travel={travel} setTravel={setTravel} />
        </div>

        {/* STEP 1: AREA */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={1} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Definisci l'area</span>
          </div>
          <ShapeInput
            customPts={customPts}
            setCustomPts={setCustomPts}
            customClosed={customClosed}
            setCustomClosed={setCustomClosed}
            manualRolls={manualRolls}
            setManualRolls={setManualRolls}
          />
          {area > 0 && (
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <MetricCard label="Superficie" value={fmt(area) + " m\u00B2"} accent />
              <MetricCard label="Perimetro" value={fmt(perimeter) + " m"} />
              {shape === "custom" && customClosed
                ? <MetricCard label="Vertici" value={`${customPts.length}`} sub="Punti del perimetro" />
                : null}
              <MetricCard label="Lati rilevati" value={`${borderEdges.length}`} sub="Perimetro disponibile" />
            </div>
          )}
        </div>

        {/* STEP 2: SUBSTRATE */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={2} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Preparazione fondo</span>
          </div>
          <div style={secTitle}>Spessori lavorazione</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <DimInput label="Scavo da effettuare" value={substrate.scavoCm} onChange={v => setSubstrate(p => ({ ...p, scavoCm: parseFloat(v) || 0 }))} unit="cm" />
            <DimInput label="Fondo drenante" value={substrate.drenateCm} onChange={v => setSubstrate(p => ({ ...p, drenateCm: parseFloat(v) || 0 }))} unit="cm" />
            <DimInput label="Sabbia livellamento" value={substrate.sabbiaCm} onChange={v => setSubstrate(p => ({ ...p, sabbiaCm: parseFloat(v) || 0 }))} unit="cm" />
          </div>
          {area > 0 && (
            <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              {substrate.scavoCm > 0 && <MetricCard label="Terra da smaltire" value={fmt((area * substrate.scavoCm) / 100, 2) + " m\u00B3"} sub={Math.round(area * substrate.scavoCm / 100 * 1400) + " kg circa"} warning />}
              {substrate.drenateCm > 0 && <MetricCard label="Pietrisco drenante" value={fmt((area * substrate.drenateCm) / 100, 2) + " m\u00B3"} sub={Math.round(area * substrate.drenateCm / 100 * 1600) + " kg circa"} />}
              {substrate.sabbiaCm > 0 && <MetricCard label="Sabbia livellamento" value={Math.round(area * substrate.sabbiaCm / 100 * 1500) + " kg"} sub={fmt((area * substrate.sabbiaCm) / 100, 2) + " m\u00B3"} />}
            </div>
          )}
          <div style={{ marginTop: 10, fontSize: 12, color: B.textMuted, padding: "8px 10px", background: B.cream, borderRadius: 8, border: "1px solid " + B.borderLight }}>
            Listino regionale attivo: <strong style={{ color: B.dark }}>{regionalPricing.region}</strong> · Stabilizzato <strong style={{ color: B.dark }}>{fmt(regionalPricing.stabilizedPerTon, 1)} €/t</strong> · Sabbia 0/4 <strong style={{ color: B.dark }}>{fmt(regionalPricing.sandPerTon, 1)} €/t</strong>
          </div>
        </div>

        {/* STEP 3: BORDER + INSTALLATION */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <StepBadge n={3} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Bordure e posa</span>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Bordura perimetrale</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {BORDER_TYPES.map(bt => (
                <button key={bt.id} onClick={() => setBorderType(bt.id)} style={{
                  padding: "6px 12px", borderRadius: 8,
                  border: borderType === bt.id ? "2px solid " + B.primary : "1px solid " + B.border,
                  background: borderType === bt.id ? B.light : B.white, fontSize: 11, fontWeight: borderType === bt.id ? 600 : 400,
                  color: borderType === bt.id ? B.primary : B.text, cursor: "pointer",
                }}>{bt.name}</button>
              ))}
            </div>
          </div>
          {borderType === "pvc" && borderEdges.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Seleziona i lati dove posare la bordura</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setSelectedBorderEdges(borderEdges.map(edge => edge.id))}
                  style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid " + B.border, background: B.white, color: B.text, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Seleziona tutti i lati
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBorderEdges([])}
                  style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid " + B.border, background: B.white, color: B.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Deseleziona tutto
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {borderEdges.map(edge => {
                  const active = selectedBorderEdges.includes(edge.id);
                  return (
                    <button
                      key={edge.id}
                      type="button"
                      onClick={() => setSelectedBorderEdges(prev => prev.includes(edge.id) ? prev.filter(id => id !== edge.id) : [...prev, edge.id])}
                      style={{
                        padding: "7px 12px",
                        borderRadius: 999,
                        border: active ? "2px solid " + B.primary : "1px solid " + B.border,
                        background: active ? B.light : B.white,
                        color: active ? B.primary : B.text,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {edge.label} · {fmt(edge.length)} m
                    </button>
                  );
                })}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: B.textMuted }}>
                Bordura selezionata: <strong style={{ color: B.dark }}>{fmt(selectedBorderMeters)} m</strong> · {selectedBorderEdges.length}/{borderEdges.length} lati
              </div>
            </div>
          )}
          <InstallationNeedsPanel area={area} perimeter={perimeter} borderType={borderType} borderMeters={selectedBorderMeters} manualRolls={manualRolls} />
        </div>

        {/* STEP 4: DECORATIVE */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <StepBadge n={4} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Materiali aggiuntivi</span>
          </div>
          <DecoSection decoItems={decoItems} setDecoItems={setDecoItems} />
        </div>

        {/* STEP 5: REPORT */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <StepBadge n={5} /><span style={{ fontSize: 16, fontWeight: 700, color: B.dark }}>Riepilogo materiali e trasferta</span>
            <div style={{ flex: 1 }} />
            <button disabled={area <= 0} onClick={handleOpenQuoteGenerator} style={{ ...btnPrim, whiteSpace: "nowrap", background: "#244033", opacity: area > 0 ? 1 : 0.55, cursor: area > 0 ? "pointer" : "not-allowed" }}>Apri nel generatore</button>
            <button onClick={() => handlePrintReport("technical")} style={{ ...btnPrim, whiteSpace: "nowrap" }}>Stampa report tecnico</button>
            <button onClick={() => handlePrintReport("client")} style={{ ...btnPrim, whiteSpace: "nowrap", background: B.white, color: B.primary, border: "1px solid " + B.primary }}>Stampa versione cliente</button>
          </div>
          <ReportShell
            id="garden-planner-print-content"
            area={area}
            perimeter={perimeter}
            shape={shape}
            dims={safeDims}
            customPts={customPts}
            customClosed={customClosed}
            borderMeters={selectedBorderMeters}
            borderType={borderType}
            substrate={substrate}
            decoItems={decoItems}
            projectInfo={projectInfo}
            travel={travel}
            viewerRole={viewerRole}
            regionalPricing={regionalPricing}
            manualRolls={manualRolls}
            variant="technical"
          />
          <div style={{ display: "none" }} aria-hidden="true">
            <ReportShell
              id="garden-planner-client-print-content"
              area={area}
              perimeter={perimeter}
              shape={shape}
              dims={safeDims}
              customPts={customPts}
              customClosed={customClosed}
              borderMeters={selectedBorderMeters}
              borderType={borderType}
              substrate={substrate}
              decoItems={decoItems}
              projectInfo={projectInfo}
              travel={travel}
              viewerRole={viewerRole}
              regionalPricing={regionalPricing}
              manualRolls={manualRolls}
              variant="client"
            />
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "8px 0 24px", fontSize: 11, color: B.textMuted }}>
          Garden Planner v3.5 - Prato Sintetico Italia / VERTEX SRLS - Strumento interno
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<GardenPlanner />);
