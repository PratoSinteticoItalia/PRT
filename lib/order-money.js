/**
 * lib/order-money.js — Matematica denaro degli ordini (FUNZIONI PURE).
 *
 * Estratto da app.js (Fase 0 hardening): qui vive l'unica copia della logica
 * di calcolo di residuo, incassato, pagamenti e totali. È volutamente PURA —
 * nessuna dipendenza da `state`, da `t()`/i18n o dal DOM — così è:
 *   1) testabile in Node (`node --test`, vedi test/order-money.test.js)
 *   2) condivisa dal browser via `import` in app.js (single source of truth)
 *
 * REGOLA: non introdurre qui dipendenze da `state`, `document` o `window`.
 * Le funzioni di FORMATTAZIONE/i18n (formatCurrency, getOrderTaxDisplay, …)
 * restano in app.js perché dipendono dalla lingua corrente.
 */

/**
 * Converte un valore (stringa "1.234,56 €", numero, null) in Number sicuro.
 *
 * Formato IT: se è presente una virgola la trattiamo come separatore decimale,
 * quindi i punti sono separatori di migliaia e vanno rimossi PRIMA di convertire.
 * Senza virgola, un eventuale punto resta separatore decimale (comportamento
 * storico preservato). Fix Fase 0: prima "1.234,56" diventava NaN → 0.
 */
export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let s = String(value ?? "").trim();
  if (!s) return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  s = s.replace(/[^\d.-]/g, "");
  const parsed = Number(s);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Normalizza una singola voce di pagamento; ritorna null se importo <= 0. */
export function normalizeAccountingPaymentEntry(entry = {}, index = 0, fallbackMethod = "") {
  const amount = Number(toNumber(entry.amount ?? entry.value ?? 0).toFixed(2));
  if (amount <= 0) return null;
  const type = ["deposit", "balance", "manual"].includes(String(entry.type || "").trim())
    ? String(entry.type || "").trim()
    : "manual";
  return {
    id: String(entry.id || `payment-${Date.now()}-${index}`),
    type,
    amount,
    method: String(entry.method || fallbackMethod || "").trim(),
    date: String(entry.date || "").trim(),
    note: String(entry.note || "").trim(),
  };
}

/**
 * Pagamenti interni registrati su un ordine. Preferisce l'array esplicito
 * `accounting.payments`; in fallback ricostruisce dalle vecchie chiavi
 * depositPaid/balancePaid (compatibilità dati legacy).
 */
export function getAccountingPayments(order) {
  const accounting = order?.accounting || {};
  const explicit = Array.isArray(accounting.payments)
    ? accounting.payments.map((entry, index) => normalizeAccountingPaymentEntry(entry, index, accounting.paymentMethod || order?.paymentMethod || ""))
      .filter(Boolean)
    : [];
  if (explicit.length) return explicit;

  const legacy = [];
  const paymentMethod = accounting.paymentMethod || order?.paymentMethod || "";
  const depositPaid = Number(toNumber(accounting.depositPaid || 0).toFixed(2));
  const balancePaid = Number(toNumber(accounting.balancePaid || 0).toFixed(2));
  if (depositPaid > 0) {
    legacy.push(normalizeAccountingPaymentEntry({
      id: `legacy-deposit-${order?.id || "order"}`,
      type: "deposit",
      amount: depositPaid,
      method: paymentMethod,
    }, 0, paymentMethod));
  }
  if (balancePaid > 0) {
    legacy.push(normalizeAccountingPaymentEntry({
      id: `legacy-balance-${order?.id || "order"}`,
      type: "balance",
      amount: balancePaid,
      method: paymentMethod,
    }, 1, paymentMethod));
  }
  return legacy.filter(Boolean);
}

/** Somma dei pagamenti interni registrati (arrotondata a 2 decimali). */
export function getInternalPaidAmount(order) {
  return Number(getAccountingPayments(order).reduce((sum, payment) => sum + toNumber(payment.amount || 0), 0).toFixed(2));
}

/** Importo considerato incassato via Shopify: totale ordine se "paid" (non parziale). */
export function getShopifyPaidAmount(order) {
  const normalized = String(order.financialStatus || "").toLowerCase();
  if (normalized.includes("paid") && !normalized.includes("partial")) return toNumber(order.total);
  return 0;
}

/** True se l'ordine risulta pagato via Shopify. */
export function isShopifyPaid(order) {
  return getShopifyPaidAmount(order) > 0;
}

/** Totale lordo (ivato) dell'ordine. */
export function getOrderGrossTotal(order) {
  return toNumber(order?.totals?.grossTotal ?? order?.total ?? 0);
}

/** Totale IVA dichiarato sull'ordine (0 se assente). */
export function getOrderTaxTotal(order) {
  return toNumber(order?.totals?.taxTotal ?? 0);
}

/** Imponibile (netto): esplicito se presente, altrimenti lordo - IVA. */
export function getOrderNetSubtotal(order) {
  const explicitNet = order?.totals?.netSubtotal;
  if (explicitNet != null) return toNumber(explicitNet);
  return Math.max(0, Number((getOrderGrossTotal(order) - getOrderTaxTotal(order)).toFixed(2)));
}

/**
 * Residuo aperto: lordo meno il maggiore tra incassato Shopify e incassato
 * interno. Sotto 0,05 € lo consideriamo saldato (residui da arrotondamento).
 */
export function getOpenBalance(order) {
  const total = getOrderGrossTotal(order);
  const effectivePaid = Math.max(getShopifyPaidAmount(order), getInternalPaidAmount(order));
  const residual = Math.max(0, total - effectivePaid);
  return residual < 0.05 ? 0 : residual;
}

/** Importo effettivamente incassato (totale ordine - residuo aperto). */
export function getCollectedAmount(order) {
  return Math.max(0, toNumber(order.total) - getOpenBalance(order));
}
