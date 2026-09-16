import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
function extract(start, end) { return source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start))); }
const writeSource = extract('async function writeJson(', 'function normalizeSessionEntry');
for (const postgres of [false, true]) {
  test(`failed durable write invalidates mutated cache, emits no success (postgres=${postgres})`, async () => {
    const old = { name: 'unsaved' };
    let broadcasts = 0;
    const context = vm.createContext({ resolve: x => x, STORE_PATH: 'store', SESSION_PATH: 'session',
      STORE_DOC_KEY: 'store', USE_POSTGRES: postgres, storeMemCache: old,
      buildStoreRevisionToken: () => 'new', rotateStoreRevision: value => { value._storeRevision = 'new'; },
      writeDatabaseDocument: async () => { throw Error('offline'); },
      writeLocalJson: async () => { throw Error('disk full'); },
      broadcastStoreRevision: () => broadcasts++,
      value: old,
    });
    await assert.rejects(vm.runInContext(`${writeSource}\nwriteJson('store', value)`, context));
    assert.equal(context.storeMemCache, null);
    assert.equal(broadcasts, 0);
  });
}
test('cache and notifications wait for durable success', async () => {
  let finish;
  let broadcasts = 0;
  const old = { name: 'old' };
  const value = { name: 'new' };
  const context = vm.createContext({ resolve: x => x, STORE_PATH: 'store', SESSION_PATH: 'session',
    STORE_DOC_KEY: 'store', USE_POSTGRES: true, storeMemCache: old,
    buildStoreRevisionToken: () => 'revision', rotateStoreRevision: value => { value._storeRevision = 'revision'; }, getStoreRevision: x => x._storeRevision,
    writeDatabaseDocument: () => new Promise(resolve => { finish = resolve; }),
    queuePostgresMirrorWrite() {}, broadcastStoreRevision: () => broadcasts++, value,
  });
  const pending = vm.runInContext(`${writeSource}\nwriteJson('store', value)`, context);
  assert.equal(context.storeMemCache, old);
  assert.equal(broadcasts, 0);
  finish(); await pending;
  assert.equal(context.storeMemCache, value);
  assert.equal(broadcasts, 1);
});
test('Shopify merge preserves changes committed during network wait', async () => {
  const latest = { orders: [{ id: '1', status: 'prepared' }], users: [{ name: 'changed' }],
    shopifySettings: { adminAccessToken: 'new-token', lastSyncStatus: 'old' } };
  const stale = { orders: [{ id: '1', status: 'pending' }], users: [],
    shopifySettings: { adminAccessToken: 'old-token', lastSyncStatus: 'ok' } };
  const context = vm.createContext({ STORE_PATH: 'store', readJson: async () => latest, stale });
  const result = await vm.runInContext(`${extract('async function readStoreAfterShopifySync(', 'async function runScheduledShopifySync(')}\nreadStoreAfterShopifySync(stale)`, context);
  assert.equal(result.orders[0].status, 'prepared');
  assert.equal(result.users[0].name, 'changed');
  assert.equal(result.shopifySettings.adminAccessToken, 'new-token');
  assert.equal(result.shopifySettings.lastSyncStatus, 'ok');
});
for (const unlockFails of [false, true]) {
  test(`lock clears stale cache and discards connection on failed unlock=${unlockFails}`, async () => {
    let released;
    const context = vm.createContext({ USE_POSTGRES: true, storeMemCache: { stale: true },
      API_STATE_LOCK_TIMEOUT_MS: 1000, API_STATE_LOCK_POLL_MS: 1, API_STATE_LOCK_KEY: 1,
      runExclusiveApiWrite: fn => fn(),
      getPgPool: async () => ({ connect: async () => ({
        query: async sql => {
          if (sql.includes('unlock') && unlockFails) throw Error('connection lost');
          return { rows: [{ locked: true }] };
        }, release: discard => { released = discard; },
      }) }),
    });
    const value = await vm.runInContext(`${extract('async function withApiStateLock(', 'function buildDefaultStore(')}\nwithApiStateLock(async () => storeMemCache)`, context);
    assert.equal(value, null);
    assert.equal(released, unlockFails);
  });
}

test('concurrent pool initialization creates one connection pool', async () => {
  let instances = 0;
  class Pool { constructor() { instances++; } on() {} }
  const context = vm.createContext({ USE_POSTGRES: true, pgPool: null, pgPoolPromise: null,
    DATABASE_URL: 'test', DB_OPERATION_TIMEOUT_MS: 1000, Pool, console });
  const poolSource = extract('async function getPgPool()', 'function withOperationTimeout')
    .replace('const { Pool } = await import("pg");', 'await Promise.resolve();');
  const pools = await vm.runInContext(`${poolSource}\nPromise.all([getPgPool(), getPgPool(), getPgPool()])`, context);
  assert.equal(instances, 1);
  assert.equal(pools[0], pools[1]);
});

test('scheduled Shopify sync saves latest store after a concurrent user change', async () => {
  const stale = { orders: [], shopifySettings: { storeDomain: 'test' }, users: [{ name: 'old' }] };
  const latest = { orders: [], shopifySettings: { storeDomain: 'test' }, users: [{ name: 'new' }] };
  let current = stale;
  let saved;
  const context = vm.createContext({ STORE_PATH: 'store', console,
    readJson: async () => current,
    syncOrdersFromShopify: async snapshot => {
      snapshot.shopifySettings.lastSyncStatus = 'ok';
      current = latest;
      return [];
    },
    withApiStateLock: async fn => fn(),
    sortOrdersByRecency: x => x,
    writeJson: async (path, value) => { saved = value; },
    reconcileSalesRequestShopifyPurchases: async () => {},
  });
  await vm.runInContext(`${extract('async function readStoreAfterShopifySync(', 'async function getShopifyAccessToken(')}\nrunScheduledShopifySync()`, context);
  assert.equal(saved.users[0].name, 'new');
  assert.equal(saved.shopifySettings.lastSyncStatus, 'ok');
  assert.equal(stale.shopifySettings.lastSyncStatus, undefined);
});

test('inventory insertion returns an explicit error when database fails', async () => {
  let response;
  const context = vm.createContext({ USE_POSTGRES: true, storeMemCache: {}, console: { error() {} },
    readStoreFieldFromDatabase: async () => [],
    getSessionContextFromUsers: async () => ({ user: { role: 'office' } }),
    readBody: async () => ({}), buildInventoryItemsFromBody: () => ({ created: [{ id: '1' }] }),
    buildStoreRevisionToken: () => 'revision', STORE_DOC_KEY: 'store', ensureDatabaseStorage: async () => {},
    getPgPool: async () => ({ query: async () => { throw Error('offline'); } }),
    sendJson: (res, status, payload) => { response = { status, payload }; },
  });
  await vm.runInContext(`${extract('async function handleFastInventoryItemsPost(', 'async function handleApi(')}\nhandleFastInventoryItemsPost({}, {})`, context);
  assert.equal(response.status, 503);
  assert.equal(response.payload.error, 'inventory_write_failed');
  assert.equal(context.storeMemCache, null);
});
