import test from "node:test";
import assert from "node:assert/strict";
import { monthRange, ordersByMonth, periodMonths, quotesByMonth, romeMonthKey, sumBy } from "../lib/analytics.js";

test("mesi: ora di Roma e intervalli", () => {
  assert.equal(romeMonthKey("2026-10-31T23:30:00Z"), "2026-11");
  assert.equal(romeMonthKey("2026-10-22"), "2026-10");
  assert.deepEqual(monthRange("2025-11", "2026-02"), ["2025-11", "2025-12", "2026-01", "2026-02"]);
  const now = new Date("2026-10-25T10:00:00Z");
  assert.equal(periodMonths("12m", now).length, 12);
  assert.equal(periodMonths("12m", now)[0], "2025-11");
  assert.deepEqual(periodMonths("year", now).slice(-1), ["2026-10"]);
  assert.equal(periodMonths("last-year", now).length, 12);
});

test("ordini: fatturato nel mese dell'ordine, incassato nel mese del pagamento", () => {
  const months = ["2026-08", "2026-09"];
  const rows = ordersByMonth([
    { createdAt: "2026-08-10T10:00:00Z", total: 1000, source: "manual", accounting: { payments: [{ amount: 300, date: "2026-08-10" }, { amount: 700, date: "2026-09-05" }] } },
    { createdAt: "2026-09-02T10:00:00Z", total: 200, source: "manual", cancelledAt: "2026-09-03T10:00:00Z" },
  ], months);
  assert.deepEqual(rows.map((r) => [r.month, r.orders, r.gross, r.collected]), [["2026-08", 1, 1000, 300], ["2026-09", 0, 0, 700]]);
});

test("preventivi: utile salvato o stimato dal margine, nel mese dell'accettazione", () => {
  const months = ["2026-10"];
  const [row] = quotesByMonth([
    { status: "accepted", total: 1220, marginProfit: 300, marginRevenueNet: 1000, createdAt: "2026-10-01T10:00:00Z", updatedAt: "2026-10-03T10:00:00Z" },
    { status: "accepted", total: 2440, marginPct: 25, createdAt: "2026-10-02T10:00:00Z", updatedAt: "2026-10-04T10:00:00Z" },
    { status: "accepted", total: 500, createdAt: "2026-10-02T10:00:00Z", updatedAt: "2026-10-04T10:00:00Z" },
    { status: "sent", total: 900, sentAt: "2026-10-05T10:00:00Z", createdAt: "2026-10-05T09:00:00Z" },
    { status: "to_send", total: 900, createdAt: "2026-10-06T09:00:00Z" },
  ], months);
  assert.equal(row.saved, 5);
  assert.equal(row.sent, 4);
  assert.equal(row.accepted, 3);
  assert.equal(row.profitCount, 2);
  assert.equal(row.profit, 800);
  assert.equal(sumBy([row, row], "accepted"), 6);
});

test("tacche dell'asse: numeri tondi, interi per i conteggi", async () => {
  const { niceTicks } = await import("../lib/analytics-charts.js");
  assert.deepEqual(niceTicks(9, 4, true), [0, 5, 10]);
  assert.deepEqual(niceTicks(1740), [0, 500, 1000, 1500, 2000]);
  assert.deepEqual(niceTicks(0), [0, 1]);
});
