// Pagina Analisi (ottobre 2026): i conti mese per mese. Funzioni pure, usate
// dal server (preventivi) e da app.js (ordini). I mesi sono quelli di Roma.
import { getAccountingPayments, getCollectedAmount, getOrderGrossTotal } from "./order-money.js?v=20261025-pagine-sospese-2";

const MONTH_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit" });
const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

export function romeMonthKey(value) {
  if (!value) return "";
  // Le date senza ora ("2026-10-22") sono già giorni italiani.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value.slice(0, 7);
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : MONTH_FORMAT.format(date).slice(0, 7);
}

export function monthRange(from, to) {
  const out = [];
  let [year, month] = String(from).split("-").map(Number);
  const [toYear, toMonth] = String(to).split("-").map(Number);
  while ((year < toYear || (year === toYear && month <= toMonth)) && out.length < 120) {
    out.push(`${year}-${String(month).padStart(2, "0")}`);
    month += 1;
    if (month > 12) { month = 1; year += 1; }
  }
  return out;
}

// Periodi della pagina: ultimi 12 mesi, anno in corso, anno scorso.
export function periodMonths(period = "12m", now = new Date()) {
  const current = romeMonthKey(now);
  const [year, month] = current.split("-").map(Number);
  if (period === "year") return monthRange(`${year}-01`, current);
  if (period === "last-year") return monthRange(`${year - 1}-01`, `${year - 1}-12`);
  const start = new Date(Date.UTC(year, month - 12, 1));
  return monthRange(`${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`, current);
}

function isCountableOrder(order) {
  if (!order) return false;
  if (order.cancelledAt) return false;
  if (/void|cancel/i.test(String(order.financialStatus || ""))) return false;
  // Bozze manuali: non sono ancora vendite.
  if (order.source === "manual" && order.operations?.officeStatus === "bozza") return false;
  return true;
}

/**
 * Fatturato (valore degli ordini, IVA inclusa) per mese dell'ordine e
 * incassato per mese del pagamento: un acconto di settembre su un ordine di
 * agosto conta a settembre. Senza date di pagamento vale la data dell'ordine.
 */
export function ordersByMonth(orders = [], months = []) {
  const rows = Object.fromEntries(months.map((month) => [month, { month, orders: 0, gross: 0, collected: 0 }]));
  for (const order of orders) {
    if (!isCountableOrder(order)) continue;
    const row = rows[romeMonthKey(order.createdAt || order.processedAt || order.date)];
    if (row) {
      row.orders += 1;
      row.gross += getOrderGrossTotal(order);
    }
    let rest = getCollectedAmount(order);
    for (const payment of getAccountingPayments(order)) {
      if (!/^\d{4}-\d{2}-\d{2}/.test(String(payment.date || "")) || rest <= 0) continue;
      const amount = Math.min(Number(payment.amount) || 0, rest);
      rest -= amount;
      const paidRow = rows[String(payment.date).slice(0, 7)];
      if (paidRow) paidRow.collected += amount;
    }
    if (rest > 0.005 && row) row.collected += rest;
  }
  return months.map((month) => ({ ...rows[month], gross: round2(rows[month].gross), collected: round2(rows[month].collected) }));
}

const finite = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

/**
 * Preventivi per mese: salvati, inviati, accettati con il loro utile stimato
 * (salvato col preventivo; per i più vecchi, dal margine % sul totale senza IVA).
 * L'accettazione cade nel mese dell'ultima modifica del preventivo.
 */
export function quotesByMonth(quotes = [], months = []) {
  const rows = Object.fromEntries(months.map((month) => [month, { month, saved: 0, sent: 0, accepted: 0, acceptedTotal: 0, profit: 0, profitNet: 0, profitCount: 0 }]));
  for (const quote of quotes) {
    const saved = rows[romeMonthKey(quote.createdAt)];
    if (saved) saved.saved += 1;
    const wasSent = quote.sentAt || ["sent", "accepted", "rejected", "expired"].includes(quote.status);
    const sent = wasSent ? rows[romeMonthKey(quote.sentAt || quote.createdAt)] : null;
    if (sent) sent.sent += 1;
    if (quote.status !== "accepted") continue;
    const row = rows[romeMonthKey(quote.updatedAt || quote.createdAt)];
    if (!row) continue;
    const total = Number(quote.total) || 0;
    row.accepted += 1;
    row.acceptedTotal += total;
    const net = finite(quote.marginRevenueNet) ? Number(quote.marginRevenueNet) : total / 1.22;
    const profit = finite(quote.marginProfit) ? Number(quote.marginProfit) : finite(quote.marginPct) ? (net * Number(quote.marginPct)) / 100 : null;
    if (profit == null) continue;
    row.profit += profit;
    row.profitNet += net;
    row.profitCount += 1;
  }
  return months.map((month) => {
    const row = rows[month];
    return { ...row, acceptedTotal: round2(row.acceptedTotal), profit: round2(row.profit), profitNet: round2(row.profitNet) };
  });
}

// Somma di una colonna sui mesi.
export function sumBy(rows = [], key) {
  return round2(rows.reduce((total, row) => total + (Number(row?.[key]) || 0), 0));
}
