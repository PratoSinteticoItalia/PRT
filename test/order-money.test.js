/**
 * Test della matematica denaro degli ordini (lib/order-money.js).
 * Esegui con: `npm test` (node --test, zero dipendenze).
 *
 * Coprono gli INVARIANTI sui soldi: residuo, incassato, pagamenti. Sono la
 * rete di sicurezza che deve scattare se qualcuno tocca questi calcoli.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  toNumber,
  normalizeAccountingPaymentEntry,
  getAccountingPayments,
  getInternalPaidAmount,
  getShopifyPaidAmount,
  isShopifyPaid,
  getOrderGrossTotal,
  getOrderTaxTotal,
  getOrderNetSubtotal,
  getOpenBalance,
  getCollectedAmount,
} from "../lib/order-money.js";

test("toNumber: parsing robusto di formati monetari", () => {
  assert.equal(toNumber(1234.56), 1234.56);
  assert.equal(toNumber("1234,56"), 1234.56);          // virgola decimale IT
  assert.equal(toNumber("1.234,56 €"), 1234.56);       // separatore migliaia + simbolo
  assert.equal(toNumber("€ 80,00"), 80);
  assert.equal(toNumber(""), 0);
  assert.equal(toNumber(null), 0);
  assert.equal(toNumber(undefined), 0);
  assert.equal(toNumber("abc"), 0);
  assert.equal(toNumber("-50"), -50);
});

test("normalizeAccountingPaymentEntry: scarta importi non positivi", () => {
  assert.equal(normalizeAccountingPaymentEntry({ amount: 0 }), null);
  assert.equal(normalizeAccountingPaymentEntry({ amount: -10 }), null);
  assert.equal(normalizeAccountingPaymentEntry({}), null);
});

test("normalizeAccountingPaymentEntry: normalizza tipo e arrotonda a 2 decimali", () => {
  const e = normalizeAccountingPaymentEntry({ id: "p1", amount: "100,126", type: "weird", method: "bonifico" });
  assert.equal(e.amount, 100.13);            // terza cifra tagliata via toFixed(2)
  assert.equal(e.type, "manual");            // tipo sconosciuto → manual
  assert.equal(e.method, "bonifico");
  assert.equal(e.id, "p1");
  assert.equal(normalizeAccountingPaymentEntry({ amount: 5, type: "deposit" }).type, "deposit");
  assert.equal(normalizeAccountingPaymentEntry({ amount: 5, type: "balance" }).type, "balance");
});

test("getAccountingPayments: usa l'array esplicito quando presente", () => {
  const order = { accounting: { payments: [{ id: "a", amount: 100 }, { id: "b", amount: 50 }] } };
  const payments = getAccountingPayments(order);
  assert.equal(payments.length, 2);
  assert.equal(payments[0].amount, 100);
});

test("getAccountingPayments: fallback legacy deposit/balance", () => {
  const order = { id: "o1", accounting: { depositPaid: 200, balancePaid: 300, paymentMethod: "bonifico" } };
  const payments = getAccountingPayments(order);
  assert.equal(payments.length, 2);
  assert.equal(payments[0].type, "deposit");
  assert.equal(payments[0].amount, 200);
  assert.equal(payments[1].type, "balance");
  assert.equal(payments[1].amount, 300);
});

test("getAccountingPayments: ordine senza pagamenti → array vuoto", () => {
  assert.deepEqual(getAccountingPayments({}), []);
  assert.deepEqual(getAccountingPayments({ accounting: {} }), []);
});

test("getInternalPaidAmount: somma i pagamenti interni", () => {
  const order = { accounting: { payments: [{ id: "a", amount: 100.10 }, { id: "b", amount: 50.05 }] } };
  assert.equal(getInternalPaidAmount(order), 150.15);
});

test("getShopifyPaidAmount: paid pieno vs parziale vs non pagato", () => {
  assert.equal(getShopifyPaidAmount({ financialStatus: "paid", total: 500 }), 500);
  assert.equal(getShopifyPaidAmount({ financialStatus: "PAID", total: 500 }), 500); // case-insensitive
  assert.equal(getShopifyPaidAmount({ financialStatus: "partially_paid", total: 500 }), 0);
  assert.equal(getShopifyPaidAmount({ financialStatus: "pending", total: 500 }), 0);
  assert.equal(getShopifyPaidAmount({ financialStatus: "", total: 500 }), 0);
  assert.equal(isShopifyPaid({ financialStatus: "paid", total: 500 }), true);
  assert.equal(isShopifyPaid({ financialStatus: "pending", total: 500 }), false);
});

test("totali: lordo, IVA, imponibile (esplicito e derivato)", () => {
  const explicit = { totals: { grossTotal: 122, taxTotal: 22, netSubtotal: 100 } };
  assert.equal(getOrderGrossTotal(explicit), 122);
  assert.equal(getOrderTaxTotal(explicit), 22);
  assert.equal(getOrderNetSubtotal(explicit), 100);

  // netSubtotal assente → derivato come lordo - IVA
  const derived = { totals: { grossTotal: 122, taxTotal: 22 } };
  assert.equal(getOrderNetSubtotal(derived), 100);

  // fallback su order.total quando totals assente
  assert.equal(getOrderGrossTotal({ total: 80 }), 80);
});

test("getOpenBalance: residuo = lordo - max(incassato shopify, interno)", () => {
  // Shopify paid copre tutto → residuo 0
  assert.equal(getOpenBalance({ financialStatus: "paid", total: 500, totals: { grossTotal: 500 } }), 0);

  // Solo acconto interno parziale
  const partial = { totals: { grossTotal: 1000 }, accounting: { payments: [{ id: "a", amount: 400 }] } };
  assert.equal(getOpenBalance(partial), 600);

  // Nessun pagamento → residuo = intero lordo
  assert.equal(getOpenBalance({ totals: { grossTotal: 250 } }), 250);

  // Non somma Shopify + interno: prende il MAGGIORE (evita doppio conteggio)
  const both = { financialStatus: "paid", total: 1000, totals: { grossTotal: 1000 }, accounting: { payments: [{ id: "a", amount: 300 }] } };
  assert.equal(getOpenBalance(both), 0);
});

test("getOpenBalance: residuo sotto 0,05 € è considerato saldato", () => {
  const order = { totals: { grossTotal: 100 }, accounting: { payments: [{ id: "a", amount: 99.97 }] } };
  assert.equal(getOpenBalance(order), 0); // 0,03 € residuo → saldato

  const order2 = { totals: { grossTotal: 100 }, accounting: { payments: [{ id: "a", amount: 99.90 }] } };
  // Fase 2: il residuo è arrotondato a 2 decimali alla fonte (niente più
  // float-fantasma tipo 0.0999999…).
  assert.equal(getOpenBalance(order2), 0.1); // 0,10 € → resta aperto, valore pulito
});

test("getCollectedAmount: incassato = totale - residuo", () => {
  const order = { total: 1000, totals: { grossTotal: 1000 }, accounting: { payments: [{ id: "a", amount: 400 }] } };
  assert.equal(getCollectedAmount(order), 400);
});
