// Costo effettivo dei materiali comprati dai fornitori (ottobre 2026).
//
// Il prezzo scritto in fattura non è tutto quello che un materiale costa:
// spesso c'è il trasporto, per i fornitori esteri il dazio, a volte altre
// spese (sdoganamento, spedizioniere). Questi costi si registrano sulla
// fattura e si dividono sulle sue righe in proporzione al valore di ogni riga:
// così ogni materiale riceve la stessa percentuale in più.
//
// L'IVA non entra, nemmeno quella pagata in dogana: si recupera come l'IVA
// normale, e l'utile dei preventivi si calcola sull'imponibile.

const round = (value, decimals) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value) || 0) * factor) / factor;
};

const positive = (value) => {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) && number > 0 ? round(number, 2) : 0;
};

export function normalizeSupplierInvoiceCosts(raw = {}) {
  const dutyMode = raw?.dutyMode === "pct" ? "pct" : "eur";
  const dutyValue = positive(raw?.dutyValue);
  return {
    shippingCost: positive(raw?.shippingCost),
    dutyMode,
    dutyValue: dutyMode === "pct" ? Math.min(100, dutyValue) : dutyValue,
    otherCost: positive(raw?.otherCost),
    updatedAt: String(raw?.updatedAt || ""),
    updatedBy: String(raw?.updatedBy || ""),
  };
}

export function hasSupplierInvoiceCosts(raw) {
  const costs = normalizeSupplierInvoiceCosts(raw || {});
  return costs.shippingCost > 0 || costs.dutyValue > 0 || costs.otherCost > 0;
}

// Costi in più di una fattura e percentuale da aggiungere a ogni riga.
// Senza le quantità di tutte le righe il valore della merce non si conosce e
// gli importi in euro non si possono dividere: `factor` resta null.
export function computeSupplierInvoiceExtras(lines = [], rawCosts = {}) {
  const costs = normalizeSupplierInvoiceCosts(rawCosts);
  const missingQuantity = !lines.length || lines.some((line) => !(Number(line.quantity) > 0));
  const goodsValue = missingQuantity
    ? null
    : round(lines.reduce((sum, line) => sum + (Number(line.unitPrice) || 0) * Number(line.quantity), 0), 2);
  // Il dazio in percentuale si calcola come in dogana: su merce + trasporto.
  const duty = costs.dutyMode === "pct"
    ? (goodsValue == null ? null : round((goodsValue + costs.shippingCost) * costs.dutyValue / 100, 2))
    : costs.dutyValue;
  const total = duty == null ? null : round(costs.shippingCost + duty + costs.otherCost, 2);
  let factor = null;
  if (goodsValue > 0 && total != null) factor = (goodsValue + total) / goodsValue;
  // Solo dazio in percentuale e nessun importo in euro: si applica anche senza quantità.
  if (factor == null && costs.dutyMode === "pct" && !costs.shippingCost && !costs.otherCost) {
    factor = 1 + costs.dutyValue / 100;
  }
  return {
    costs,
    goodsValue,
    duty,
    total,
    factor,
    extraPct: factor == null ? null : round((factor - 1) * 100, 1),
    missingQuantity,
  };
}

// Per ogni voce prezzo: costo effettivo per unità. Le voci senza costi in più
// (o senza fattura raggruppata) hanno costo effettivo = prezzo in fattura.
export function computeSupplierLandedCosts(entries = [], costsByInvoiceId = {}) {
  const groups = new Map();
  entries.forEach((entry) => {
    const invoiceId = String(entry?.invoiceId || "").trim();
    if (!invoiceId || !hasSupplierInvoiceCosts(costsByInvoiceId?.[invoiceId])) return;
    if (!groups.has(invoiceId)) groups.set(invoiceId, []);
    groups.get(invoiceId).push(entry);
  });
  const extrasByInvoice = new Map();
  groups.forEach((lines, invoiceId) => {
    extrasByInvoice.set(invoiceId, computeSupplierInvoiceExtras(lines, costsByInvoiceId[invoiceId]));
  });
  const result = new Map();
  entries.forEach((entry) => {
    const unitPrice = Number(entry?.unitPrice) || 0;
    const extras = extrasByInvoice.get(String(entry?.invoiceId || "").trim());
    if (!extras) {
      result.set(entry.id, { landedUnitPrice: unitPrice, extraPerUnit: 0, extraPct: 0, landedStatus: "none" });
      return;
    }
    if (extras.factor == null) {
      result.set(entry.id, { landedUnitPrice: unitPrice, extraPerUnit: 0, extraPct: null, landedStatus: "missing-quantity" });
      return;
    }
    const landedUnitPrice = round(unitPrice * extras.factor, 3);
    result.set(entry.id, {
      landedUnitPrice,
      extraPerUnit: round(landedUnitPrice - unitPrice, 3),
      extraPct: extras.extraPct,
      landedStatus: "ok",
    });
  });
  return result;
}
