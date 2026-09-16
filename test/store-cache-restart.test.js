import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const fn = source.slice(source.indexOf('async function readJson('), source.indexOf('async function writeJson('));
for (const postgres of [true, false]) {
  test(`persisted reconciliation flag is ignored after restart (postgres=${postgres})`, async () => {
    const payload = { __memReconciled: true, users: [] };
    const context = vm.createContext({ resolve: x => x, STORE_PATH: 'store',
      storeMemCache: null, USE_POSTGRES: postgres, STORE_DOC_KEY: 'store',
      readDatabaseDocument: async () => payload, readLocalJson: async () => payload,
      ensureStoreRevision() {},
    });
    const result = await vm.runInContext(`${fn}\nreadJson('store', {})`, context);
    assert.equal(result.__memReconciled, undefined);
    assert.equal(result.users, payload.users);
  });
}
