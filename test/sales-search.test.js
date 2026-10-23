import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSalesRequestSearchPatterns as patterns } from '../lib/sales-search.js';

test('ricerca: ogni parola anche a metà, minuscolo e senza accenti', () => {
  assert.deepEqual(patterns('Toda'), ['%toda%']);
  assert.deepEqual(patterns('  Gabriele   TODARO '), ['%gabriele%', '%todaro%']);
  assert.deepEqual(patterns('Nicolò Forlì'), ['%nicolo%', '%forli%']);
});

test('ricerca: il telefono si trova con spazi, punti o prefisso internazionale', () => {
  assert.deepEqual(patterns('349 111 3205'), ['%3491113205%']);
  assert.deepEqual(patterns('+39 349.111.3205'), ['%3491113205%']);
  assert.deepEqual(patterns('0039 3491113205'), ['%3491113205%']);
  assert.deepEqual(patterns('3911234567'), ['%3911234567%'], 'un cellulare 391… resta intero');
  assert.deepEqual(patterns('06 1234567'), ['%061234567%']);
  assert.deepEqual(patterns('+39 340'), ['%340%'], 'il prefisso scritto non deve escludere i numeri salvati senza');
  assert.deepEqual(patterns('393491113205'), ['%3491113205%']);
});

test('ricerca: caratteri speciali di LIKE neutralizzati, al massimo 6 parole', () => {
  assert.deepEqual(patterns('100%_x'), ['%100\\%\\_x%']);
  assert.equal(patterns('a b c d e f g h').length, 6);
  assert.deepEqual(patterns(''), []);
  assert.deepEqual(patterns('   '), []);
});
