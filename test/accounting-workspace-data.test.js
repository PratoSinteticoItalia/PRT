import test from "node:test";
import assert from "node:assert/strict";
import {
  orderDate, orderDisplayNumber, orderCustomerName, orderPaymentState,
  pendingOrderIncome, suggestEntryFromPending, registeredCentsByOrder, totalsByMethod, entryIssue,
} from "../lib/accounting-workspace-data.js";

const shopifyPaid = { id: "gid://shopify/Order/1", orderNumber: "#2777", firstName: "Mario", lastName: "Rossi", source: "shopify-live", financialStatus: "PAID", total: "1220.00", createdAt: "2026-10-03T10:00:00Z", accounting: { payments: [] } };
const income = (over = {}) => ({ id: "e1", orderId: shopifyPaid.id, type: "income", cents: 122000, date: "2026-10-03", fiscalDate: "2026-10-03", ...over });

test("ordini: numero leggibile, cliente e data anche senza createdAt", () => {
  assert.equal(orderDisplayNumber(shopifyPaid), "#2777");
  assert.equal(orderDisplayNumber({ id: "gid://shopify/Order/987" }), "#987");
  assert.equal(orderCustomerName(shopifyPaid), "Mario Rossi");
  assert.equal(orderDate(shopifyPaid), "2026-10-03");
  assert.equal(orderDate({ processedAt: "2026-09-30T23:00:00Z" }), "2026-09-30");
  assert.equal(orderDate({}), "");
});

test("ordini: stato pagamento distingue pagato, parziale, attesa e rimborso", () => {
  assert.equal(orderPaymentState(shopifyPaid).key, "paid");
  assert.equal(orderPaymentState({ ...shopifyPaid, financialStatus: "PENDING" }).key, "pending");
  assert.equal(orderPaymentState({ ...shopifyPaid, financialStatus: "PENDING", accounting: { payments: [{ amount: 200 }] } }).key, "partial");
  assert.equal(orderPaymentState({ ...shopifyPaid, financialStatus: "PARTIALLY_REFUNDED" }).label, "Rimborso parziale");
});

test("incassi da registrare: Shopify pagato proposto alla data ordine, sparisce quando registrato", () => {
  const pending = pendingOrderIncome([shopifyPaid], [], "2026-10");
  assert.equal(pending.length, 1);
  assert.equal(pending[0].cents, 122000);
  assert.equal(pending[0].dateSource, "order");
  assert.equal(pendingOrderIncome([shopifyPaid], [], "2026-09").length, 0);
  assert.equal(pendingOrderIncome([shopifyPaid], [income()], "2026-10").length, 0);
  const partial = pendingOrderIncome([shopifyPaid], [income({ cents: 20000 })], "2026-10");
  assert.equal(partial[0].cents, 102000);
});

test("incassi da registrare: un rimborso registrato non fa riproporre l'incasso", () => {
  const pending = pendingOrderIncome([shopifyPaid], [income(), income({ id: "r1", type: "refund", cents: 10000 })], "2026-10");
  assert.equal(pending.length, 0);
  assert.equal(registeredCentsByOrder([income(), income({ id: "r1", type: "refund", cents: 10000 })]).get(shopifyPaid.id), 112000);
});

test("incassi da registrare: pagamenti interni datati, uno per pagamento e solo nel loro mese", () => {
  const order = { id: "o2", orderNumber: "1001", financialStatus: "PENDING", total: "1000", createdAt: "2026-09-20", accounting: { payments: [
    { id: "p1", amount: 300, date: "2026-09-21", method: "Bonifico" },
    { id: "p2", amount: 700, date: "2026-10-02", method: "Contanti" },
  ] } };
  const sept = pendingOrderIncome([order], [], "2026-09");
  const oct = pendingOrderIncome([order], [], "2026-10");
  assert.deepEqual(sept.map((p) => [p.date, p.cents, p.method]), [["2026-09-21", 30000, "Bonifico"]]);
  assert.deepEqual(oct.map((p) => [p.date, p.cents, p.method]), [["2026-10-02", 70000, "Contanti"]]);
  const afterSept = pendingOrderIncome([order], [{ orderId: "o2", type: "income", cents: 30000, date: "2026-09-21" }], "2026-09");
  assert.equal(afterSept.length, 0);
});

test("proposta movimento: precompilata ma mai verificata in automatico", () => {
  const [item] = pendingOrderIncome([shopifyPaid], [], "2026-10");
  const s = suggestEntryFromPending(item);
  assert.equal(s.verified, false);
  assert.equal(s.document, "receipt");
  assert.equal(s.vatRate, 22);
  assert.equal(s.orderId, shopifyPaid.id);
  assert.equal(s.label, "Ordine #2777 · Mario Rossi");
  assert.equal(suggestEntryFromPending({ ...item, order: { ...shopifyPaid, accounting: { invoiceRequired: true } } }).document, "invoice");
});

test("totali e anomalie", () => {
  assert.deepEqual(totalsByMethod([income({ method: "Carta" }), income({ method: "Carta", cents: 100 }), { type: "expense", cents: 5, method: "Carta" }]), [["Carta", 122100]]);
  assert.equal(registeredCentsByOrder([income(), { orderId: shopifyPaid.id, type: "expense", cents: 50 }]).get(shopifyPaid.id), 122000);
  assert.match(entryIssue({ document: "pending" }), /corrispettivo/);
  assert.match(entryIssue({ document: "receipt", vatRate: null }), /aliquota/);
});
