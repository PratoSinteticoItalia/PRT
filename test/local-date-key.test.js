import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const start = app.indexOf('function localDateKey(');
const end = app.indexOf('\nfunction getInstallationWeekStart(', start);
const localDateKey = vm.runInNewContext(`${app.slice(start, end)};localDateKey`, { Date });

test('calendario pose: il giorno resta quello locale, anche a mezzanotte e con l\'ora legale', () => {
  // Mezzanotte del lunedì in ora locale: con toISOString() in Italia diventava domenica.
  assert.equal(localDateKey(new Date(2026, 9, 19, 0, 0, 0)), '2026-10-19');
  assert.equal(localDateKey(new Date(2026, 9, 25, 23, 59, 0)), '2026-10-25');
  assert.equal(localDateKey(new Date(2026, 0, 1, 0, 30, 0)), '2026-01-01');
  assert.match(localDateKey(), /^\d{4}-\d{2}-\d{2}$/);
});
