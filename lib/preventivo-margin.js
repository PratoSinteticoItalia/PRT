// Barra dell'utile del generatore (ottobre 2026): quanto resta davvero
// all'azienda su un'opzione del preventivo. Tutto sull'imponibile (senza IVA).
//
// - Fornitura: ricavi di prato, materiali, spedizione e accessori meno i loro
//   costi (prato e materiali dall'ultima fattura fornitore collegata in
//   Impostazioni, spedizione dalla tariffa One Express quando c'è il bancale).
//   Una spedizione gratis per il cliente (sopra la soglia di imponibile) resta
//   un costo nostro: senza tariffa né costo medio finisce in `missing`.
// - Posa: come in Conti posa, l'utile della posa (posa + lavori extra meno le
//   spese della posa) si divide con il posatore; all'azienda resta la sua quota.
//
// Un costo che non si conosce resta null e finisce in `missing`: la barra lo
// dice invece di far sembrare il margine più alto di quello che è.

export const DEFAULT_MARGIN_CONFIG = { wastePct: 8, partnerSharePct: 50, lowPct: 15, goodPct: 30, freeShippingFrom: 1000, freeShippingCost: null };

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function computeQuoteMargin({
  option = {},
  quote = {},
  sqm = 0,
  turfCostPerSqm = null,
  wastePct = DEFAULT_MARGIN_CONFIG.wastePct,
  materialCosts = [],
  shippingCost = null,
  shippingMissing = false,
  accessoriesCost = null,
  posaExpenses = 0,
  partnerSharePct = DEFAULT_MARGIN_CONFIG.partnerSharePct,
} = {}) {
  const mq = Number(sqm) || 0;
  const missing = [];
  const turfQty = mq * (1 + (Number(wastePct) || 0) / 100);
  const turfCost = turfCostPerSqm == null ? null : round2(turfQty * Number(turfCostPerSqm));
  if (turfCost == null) missing.push("prato");

  const materialsIncluded = materialCosts.filter((item) => !item.excluded);
  const materialsMissing = materialsIncluded.filter((item) => item.cost == null);
  if (materialsMissing.length) missing.push(...materialsMissing.map((item) => item.key));
  const materialsCost = round2(materialsIncluded.reduce((sum, item) => sum + (Number(item.cost) || 0), 0));

  const shippingRevenue = round2(option.shippingNet);
  // Spedizione senza tariffa calcolata: si considera a pareggio (costo = prezzo).
  const shippingCostValue = shippingCost == null ? shippingRevenue : round2(shippingCost);
  if (shippingCost == null && shippingMissing) missing.push("spedizione");
  const accessoriesRevenue = round2(quote.accessoriesNet);
  if (accessoriesRevenue > 0 && accessoriesCost == null) missing.push("accessori");
  const accessoriesCostValue = accessoriesCost == null ? 0 : round2(accessoriesCost);

  const supplyRevenue = round2(option.pratoNet + option.materialsNet + shippingRevenue + accessoriesRevenue);
  const supplyCost = round2((turfCost || 0) + materialsCost + shippingCostValue + accessoriesCostValue);
  const supplyProfit = round2(supplyRevenue - supplyCost);

  const posaRevenue = round2((Number(option.posaNet) || 0) + (Number(quote.extraWorksNet) || 0));
  const posaExpensesValue = round2(posaExpenses);
  const posaProfit = round2(posaRevenue - posaExpensesValue);
  const partnerPct = Math.min(100, Math.max(0, Number(partnerSharePct) || 0));
  // Come in Conti posa: si divide solo un utile positivo; una perdita resta all'azienda.
  const partnerShare = posaRevenue > 0 && posaProfit > 0 ? round2(posaProfit * partnerPct / 100) : 0;
  const ownerPosaShare = round2(posaProfit - partnerShare);

  const revenueNet = round2(supplyRevenue + posaRevenue);
  const profit = round2(supplyProfit + ownerPosaShare);
  const marginPct = revenueNet > 0 ? round2((profit / revenueNet) * 100) : 0;

  return {
    revenueNet,
    profit,
    marginPct,
    missing,
    supply: {
      revenue: supplyRevenue,
      cost: supplyCost,
      profit: supplyProfit,
      turfCost,
      turfQty: round2(turfQty),
      materialsCost,
      shippingCost: shippingCostValue,
      shippingEstimated: shippingCost != null,
      accessoriesCost: accessoriesCostValue,
    },
    posa: {
      revenue: posaRevenue,
      expenses: posaExpensesValue,
      profit: posaProfit,
      partnerPct,
      partnerShare,
      ownerShare: ownerPosaShare,
    },
  };
}

export function marginTone(marginPct = 0, { lowPct = DEFAULT_MARGIN_CONFIG.lowPct, goodPct = DEFAULT_MARGIN_CONFIG.goodPct } = {}) {
  if (marginPct < lowPct) return "low";
  if (marginPct < goodPct) return "mid";
  return "good";
}

// Sconto massimo sul prato (in %) per restare almeno alla soglia indicata.
// Uno sconto in più di x € toglie x sia ai ricavi sia all'utile:
// (utile - x) / (ricavi - x) = soglia  →  x = (utile - soglia·ricavi) / (1 - soglia).
export function maxTurfDiscountForMargin(margin = {}, { pricePerSqm = 0, sqm = 0, currentDiscount = 0, targetPct = DEFAULT_MARGIN_CONFIG.lowPct } = {}) {
  const listTurf = (Number(pricePerSqm) || 0) * (Number(sqm) || 0);
  if (listTurf <= 0 || !(margin.revenueNet > 0)) return null;
  const target = Math.min(0.99, Math.max(0, (Number(targetPct) || 0) / 100));
  const extra = (margin.profit - target * margin.revenueNet) / (1 - target);
  const pct = (Number(currentDiscount) || 0) + (extra / listTurf) * 100;
  // Oltre il 100% vuol dire che si resta sopra soglia anche regalando il prato.
  if (pct >= 100) return null;
  return Math.max(0, Math.floor(pct * 10) / 10);
}
