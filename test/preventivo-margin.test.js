import test from 'node:test';
import assert from 'node:assert/strict';
import { computeQuoteMargin, marginTone, maxTurfDiscountForMargin } from '../lib/preventivo-margin.js';

const supplyOption = { pratoNet: 1200, materialsNet: 200, posaNet: 0, shippingNet: 100 };

test('utile fornitura: prato con scarto, materiali e spedizione calcolata', () => {
  const margin = computeQuoteMargin({
    option: supplyOption, quote: { accessoriesNet: 0, extraWorksNet: 0 }, sqm: 60,
    turfCostPerSqm: 10, wastePct: 8,
    materialCosts: [{ key: 'colla', cost: 70 }, { key: 'bande', cost: 50 }, { key: 'telo', cost: 99, excluded: true }],
    shippingCost: 90,
  });
  assert.equal(margin.supply.turfCost, 648); // 60 m² + 8% = 64,8 m² × 10 €
  assert.equal(margin.supply.materialsCost, 120); // il telo escluso non costa
  assert.equal(margin.revenueNet, 1500);
  assert.equal(margin.profit, 642);
  assert.equal(margin.marginPct, 42.8);
  assert.deepEqual(margin.missing, []);
});

test('posa: l\'utile si divide con il posatore come in Conti posa', () => {
  const margin = computeQuoteMargin({
    option: { ...supplyOption, posaNet: 1500 }, quote: { accessoriesNet: 0, extraWorksNet: 200 }, sqm: 60,
    turfCostPerSqm: 10, wastePct: 8, materialCosts: [{ key: 'colla', cost: 120 }], shippingCost: 90,
    posaExpenses: 300, partnerSharePct: 50,
  });
  assert.equal(margin.posa.revenue, 1700);
  assert.equal(margin.posa.profit, 1400);
  assert.equal(margin.posa.partnerShare, 700);
  assert.equal(margin.posa.ownerShare, 700);
  assert.equal(margin.revenueNet, 3200);
  assert.equal(margin.profit, 642 + 700);
});

test('posa in perdita: niente quota al posatore, la perdita resta all\'azienda', () => {
  const margin = computeQuoteMargin({
    option: { pratoNet: 0, materialsNet: 0, posaNet: 500, shippingNet: 0 }, quote: {}, sqm: 20,
    turfCostPerSqm: 0, posaExpenses: 800, partnerSharePct: 50,
  });
  assert.equal(margin.posa.partnerShare, 0);
  assert.equal(margin.posa.ownerShare, -300);
  assert.equal(margin.profit, -300);
});

test('costi mancanti: il margine lo dice, la spedizione senza tariffa è a pareggio', () => {
  const margin = computeQuoteMargin({
    option: supplyOption, quote: { accessoriesNet: 40 }, sqm: 60,
    turfCostPerSqm: null, materialCosts: [{ key: 'colla', cost: null }], shippingCost: null,
  });
  assert.deepEqual(margin.missing, ['prato', 'colla', 'accessori']);
  assert.equal(margin.supply.shippingCost, 100);
  assert.equal(margin.supply.shippingEstimated, false);
});

test('sconto massimo sul prato: applicandolo il margine arriva alla soglia', () => {
  const base = { quote: { accessoriesNet: 0, extraWorksNet: 0 }, sqm: 60, turfCostPerSqm: 10, wastePct: 8, materialCosts: [{ key: 'colla', cost: 120 }], shippingCost: 90 };
  const pricePerSqm = 20;
  const margin = computeQuoteMargin({ ...base, option: { ...supplyOption, pratoNet: pricePerSqm * 60 } });
  const maxDiscount = maxTurfDiscountForMargin(margin, { pricePerSqm, sqm: 60, currentDiscount: 0, targetPct: 15 });
  const discounted = computeQuoteMargin({ ...base, option: { ...supplyOption, pratoNet: pricePerSqm * (1 - maxDiscount / 100) * 60 } });
  assert.ok(discounted.marginPct >= 15 && discounted.marginPct < 15.5, `margine ${discounted.marginPct}% con sconto ${maxDiscount}%`);
});

test('colori della barra: rossa, gialla, verde', () => {
  assert.equal(marginTone(10, { lowPct: 15, goodPct: 30 }), 'low');
  assert.equal(marginTone(20, { lowPct: 15, goodPct: 30 }), 'mid');
  assert.equal(marginTone(30, { lowPct: 15, goodPct: 30 }), 'good');
});

test('sconto massimo: nessuna indicazione se si resta sopra soglia anche regalando il prato', () => {
  const margin = computeQuoteMargin({
    option: { pratoNet: 100, materialsNet: 0, posaNet: 2000, shippingNet: 0 }, quote: {}, sqm: 10,
    turfCostPerSqm: 1, posaExpenses: 0, partnerSharePct: 0,
  });
  assert.equal(maxTurfDiscountForMargin(margin, { pricePerSqm: 10, sqm: 10, targetPct: 15 }), null);
});

test('spedizione gratis per il cliente senza costo noto: manca, non vale zero di nascosto', () => {
  const margin = computeQuoteMargin({
    option: { pratoNet: 1200, materialsNet: 0, posaNet: 0, shippingNet: 0 }, quote: {}, sqm: 50,
    turfCostPerSqm: 10, wastePct: 0, materialCosts: [], shippingCost: null, shippingMissing: true,
  });
  assert.deepEqual(margin.missing, ['spedizione']);
  assert.equal(margin.supply.shippingCost, 0);
});

test('spedizione gratis con costo stimato: il costo scende dall\'utile', () => {
  const margin = computeQuoteMargin({
    option: { pratoNet: 1200, materialsNet: 0, posaNet: 0, shippingNet: 0 }, quote: {}, sqm: 50,
    turfCostPerSqm: 10, wastePct: 0, materialCosts: [], shippingCost: 140, shippingMissing: true,
  });
  assert.deepEqual(margin.missing, []);
  assert.equal(margin.supply.shippingCost, 140);
  assert.equal(margin.profit, 1200 - 500 - 140);
});
