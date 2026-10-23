import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeSupplierInvoiceExtras,
  computeSupplierLandedCosts,
  hasSupplierInvoiceCosts,
  normalizeSupplierInvoiceCosts,
} from '../lib/supplier-landed-cost.js';

const lines = [
  { id: 'prato', invoiceId: 'F1', unitPrice: 10, quantity: 100 }, // 1000 €
  { id: 'colla', invoiceId: 'F1', unitPrice: 5, quantity: 200 }, // 1000 €
];

test('trasporto diviso in proporzione al valore: ogni riga prende la stessa percentuale', () => {
  const landed = computeSupplierLandedCosts(lines, { F1: { shippingCost: 200 } });
  assert.equal(landed.get('prato').landedUnitPrice, 11); // +10%
  assert.equal(landed.get('colla').landedUnitPrice, 5.5);
  assert.equal(landed.get('prato').extraPct, 10);
  // Il totale dei costi in più torna: 100 × 1 + 200 × 0,5 = 200 €.
  assert.equal(100 * landed.get('prato').extraPerUnit + 200 * landed.get('colla').extraPerUnit, 200);
});

test('dazio in percentuale calcolato su merce + trasporto, come in dogana', () => {
  const extras = computeSupplierInvoiceExtras(lines, { shippingCost: 200, dutyMode: 'pct', dutyValue: 4 });
  assert.equal(extras.duty, 88); // (2000 + 200) × 4%
  assert.equal(extras.total, 288);
  assert.equal(extras.extraPct, 14.4);
});

test('dazio in euro e altre spese si sommano al trasporto', () => {
  const extras = computeSupplierInvoiceExtras(lines, { shippingCost: 100, dutyMode: 'eur', dutyValue: 60, otherCost: 40 });
  assert.equal(extras.total, 200);
  assert.equal(extras.factor, 1.1);
});

test('senza quantità gli importi in euro non si possono dividere', () => {
  const noQty = [{ id: 'a', invoiceId: 'F2', unitPrice: 10, quantity: null }];
  const landed = computeSupplierLandedCosts(noQty, { F2: { shippingCost: 50 } });
  assert.equal(landed.get('a').landedStatus, 'missing-quantity');
  assert.equal(landed.get('a').landedUnitPrice, 10);
});

test('solo dazio in percentuale: vale anche senza quantità', () => {
  const noQty = [{ id: 'a', invoiceId: 'F3', unitPrice: 10, quantity: null }];
  const landed = computeSupplierLandedCosts(noQty, { F3: { dutyMode: 'pct', dutyValue: 6.5 } });
  assert.equal(landed.get('a').landedUnitPrice, 10.65);
});

test('voci senza costi in più o senza fattura: costo effettivo = prezzo in fattura', () => {
  const landed = computeSupplierLandedCosts([...lines, { id: 'sola', unitPrice: 3, quantity: 1 }], {});
  assert.equal(landed.get('prato').landedUnitPrice, 10);
  assert.equal(landed.get('sola').landedStatus, 'none');
});

test('valori negativi o non numerici diventano zero; il dazio % non supera 100', () => {
  const costs = normalizeSupplierInvoiceCosts({ shippingCost: '-20', dutyMode: 'pct', dutyValue: '250', otherCost: 'abc' });
  assert.deepEqual([costs.shippingCost, costs.dutyValue, costs.otherCost], [0, 100, 0]);
  assert.equal(normalizeSupplierInvoiceCosts({ shippingCost: '12,5' }).shippingCost, 12.5);
  assert.equal(hasSupplierInvoiceCosts({ shippingCost: 0 }), false);
});
