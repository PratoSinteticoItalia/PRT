// Dati derivati per il pannello Contabilità gestionale (FUNZIONI PURE).
// Collega il registro (centesimi, lib/accounting-register.js) agli ordini reali
// (euro, lib/order-money.js) senza mai scrivere nulla: ogni proposta di
// movimento resta da confermare dall'ufficio.
import { getAccountingPayments, getCollectedAmount, getOpenBalance, getOrderGrossTotal } from "./order-money.js";

const cents = (euros) => Math.round((Number(euros) || 0) * 100);

export function orderDate(order) {
  const raw = String(order?.createdAt || order?.processedAt || order?.date || "");
  return /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : "";
}

export function orderDisplayNumber(order) {
  const number = String(order?.orderNumber || order?.name || "").trim();
  if (number) return number.startsWith("#") ? number : `#${number}`;
  const numeric = String(order?.shopifyNumericId || "").trim();
  if (numeric) return `#${numeric}`;
  return String(order?.id || "").replace(/^gid:\/\/shopify\/Order\//, "#");
}

export function orderCustomerName(order) {
  const name = [order?.firstName, order?.lastName].filter(Boolean).join(" ").trim();
  return name || String(order?.billing?.name || order?.customerName || order?.email || "Cliente").trim();
}

export function orderPaymentState(order) {
  const status = String(order?.financialStatus || "").toUpperCase();
  if (status.includes("REFUNDED")) return { key: "refunded", label: status.includes("PARTIALLY") ? "Rimborso parziale" : "Rimborsato" };
  const open = getOpenBalance(order);
  const collected = getCollectedAmount(order);
  if (open <= 0 && collected > 0) return { key: "paid", label: "Pagato" };
  if (collected > 0) return { key: "partial", label: "Pagato in parte" };
  return { key: "pending", label: "In attesa" };
}

const SHIPPING_LABELS = {
  FULFILLED: "Spedito",
  PARTIALLY_FULFILLED: "Spedito in parte",
  IN_PROGRESS: "In preparazione",
  UNFULFILLED: "Da spedire",
  ON_HOLD: "In sospeso",
  SCHEDULED: "Programmato",
};
export function orderShippingLabel(order) {
  return SHIPPING_LABELS[String(order?.fulfillmentStatus || "").toUpperCase()] || "Spedizione non indicata";
}

// Netto registrato in prima nota per ordine: entrate meno rimborsi collegati.
export function registeredCentsByOrder(entries = []) {
  const totals = new Map();
  for (const e of entries) {
    if (!e?.orderId) continue;
    const sign = e.type === "income" ? 1 : e.type === "refund" ? -1 : 0;
    if (!sign) continue;
    totals.set(e.orderId, (totals.get(e.orderId) || 0) + sign * e.cents);
  }
  return totals;
}

function methodFor(order, payment) {
  const raw = String(payment?.method || order?.accounting?.paymentMethod || order?.paymentMethod || "").trim();
  if (raw) return raw;
  return String(order?.source || "").startsWith("shopify") ? "Shopify" : "Da indicare";
}

// Incassi già risultanti dagli ordini ma non ancora in prima nota, per il mese
// scelto. Pagamenti interni datati → una proposta per pagamento del mese;
// altrimenti (es. Shopify "pagato") una proposta sull'incassato residuo, alla
// data dell'ordine — data da confermare, non una deduzione definitiva.
export function pendingOrderIncome(orders = [], entries = [], month = "") {
  // Solo le entrate: un rimborso registrato non deve far riproporre l'incasso.
  const registered = registeredCentsByOrder(entries.filter((e) => e?.type === "income"));
  const out = [];
  for (const order of orders) {
    if (!order?.id) continue;
    const collected = cents(getCollectedAmount(order));
    const already = registered.get(order.id) || 0;
    let remaining = collected - already;
    if (remaining <= 5) continue;
    const dated = getAccountingPayments(order).filter((p) => /^\d{4}-\d{2}-\d{2}/.test(p.date));
    if (dated.length) {
      for (const p of dated) {
        const amount = cents(p.amount);
        const date = p.date.slice(0, 10);
        if (!date.startsWith(month) || remaining <= 5) continue;
        const matched = entries.some((e) => e.orderId === order.id && e.type === "income" && e.date === date && e.cents === amount);
        if (matched) continue;
        const proposed = Math.min(amount, remaining);
        remaining -= proposed;
        out.push({ order, date, cents: proposed, method: methodFor(order, p), dateSource: "payment" });
      }
      continue;
    }
    const date = orderDate(order);
    if (!date.startsWith(month)) continue;
    out.push({ order, date, cents: remaining, method: methodFor(order), dateSource: "order" });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export function suggestEntryFromPending(item) {
  const { order } = item;
  return {
    label: `Ordine ${orderDisplayNumber(order)} · ${orderCustomerName(order)}`,
    date: item.date,
    fiscalDate: item.date,
    cents: item.cents,
    type: "income",
    method: item.method,
    document: order?.accounting?.invoiceRequired ? "invoice" : "receipt",
    vatRate: 22,
    reference: `Ordine ${orderDisplayNumber(order)}`,
    orderId: order.id,
    verified: false,
    dateSource: item.dateSource,
  };
}

// Perché un movimento non è ancora verificato (testo per la lista anomalie).
export function entryIssue(entry) {
  if (entry.document === "pending") return "Indica se è un corrispettivo, una fattura o altro documento.";
  if (entry.vatRate == null) return "Indica l'aliquota IVA.";
  if (!String(entry.reference || "").trim()) return "Aggiungi il riferimento del documento o della transazione.";
  return "Conferma importo, data e assenza di duplicati.";
}

export function totalsByMethod(entries = []) {
  const map = new Map();
  for (const e of entries) {
    if (e.type !== "income") continue;
    const key = String(e.method || "Non indicato").trim() || "Non indicato";
    map.set(key, (map.get(key) || 0) + e.cents);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function orderMonthSummary(orders = [], entries = [], month = "") {
  const inMonth = orders.filter((o) => orderDate(o).startsWith(month));
  const registered = registeredCentsByOrder(entries);
  let gross = 0, paid = 0, open = 0, toRegister = 0;
  for (const o of inMonth) {
    gross += cents(getOrderGrossTotal(o));
    const collected = cents(getCollectedAmount(o));
    paid += collected;
    open += cents(getOpenBalance(o));
    toRegister += Math.max(0, collected - (registered.get(o.id) || 0));
  }
  return { orders: inMonth, gross, paid, open, toRegister };
}
