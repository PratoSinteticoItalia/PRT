import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterProfitHistory } from '../lib/profit-history.js';
const entries = [
  { partnerName: 'Alpha', savedAt: '2026-10-20T23:59:00Z', jobLabel: 'Città verde', order: { orderNumber: '#123' } },
  { partnerName: 'Beta', savedAt: '2026-10-19T10:00:00Z', jobLabel: 'Altro' },
  { partnerName: 'Alpha', savedAt: '', jobLabel: 'Senza data' },
];
test('storico: filtri combinati, estremi inclusivi, ricerca senza accenti', () => {
  assert.deepEqual(filterProfitHistory(entries, {partner:'Alpha',query:'citta',from:'2026-10-20',to:'2026-10-20'}), [entries[0]]);
  assert.deepEqual(filterProfitHistory(entries, {query:'#123'}), [entries[0]]);
  assert.deepEqual(filterProfitHistory(entries, {from:'2026-10-21',to:'2026-10-19'}), []);
});
test('storico: senza periodo mantiene conti senza data; periodo li esclude', () => {
  assert.equal(filterProfitHistory(entries, {partner:'Alpha'}).length, 2);
  assert.equal(filterProfitHistory(entries, {to:'2026-10-20'}).length, 2);
  assert.equal(entries.length, 3);
});
