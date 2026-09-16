import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const server = readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const source = server.slice(server.indexOf('async function setupPgListener()'), server.indexOf('async function ensureDatabaseStorage()'))
  .replace('const { Client } = await import("pg");', 'const Client = FakeClient;');

async function harness({ rejectQuery = false, rejectConnect = false } = {}) {
  const clients = [];
  const timers = [];
  class FakeClient extends EventEmitter {
    constructor() { super(); clients.push(this); this.closed = false; }
    async connect() { if (rejectConnect) throw new Error('connection slots exhausted'); }
    async query() { if (rejectQuery) throw new Error('LISTEN failed'); }
    async end() { this.closed = true; this.emit('end'); }
  }
  const context = vm.createContext({
    FakeClient, USE_POSTGRES: true, DATABASE_URL: 'test', pgListenerClient: null,
    console: { log() {}, error() {} },
    setTimeout(fn) { timers.push(fn); return timers.length; },
  });
  await vm.runInContext(`${source}\nsetupPgListener();`, context);
  return { clients, timers, context };
}

test('PG listener: error plus end creates only one replacement and closes old client', async () => {
  const { clients, timers, context } = await harness();
  clients[0].emit('error', new Error('disconnected'));
  clients[0].emit('end');
  assert.equal(timers.length, 1);
  assert.equal(clients[0].closed, true);
  timers.shift()();
  await new Promise(setImmediate);
  assert.equal(clients.length, 2);
  assert.equal(context.pgListenerClient, clients[1]);
  clients[0].emit('end');
  assert.equal(context.pgListenerClient, clients[1]);
  assert.equal(timers.length, 0);
});

for (const failure of ['rejectQuery', 'rejectConnect']) {
  test(`PG listener: ${failure} closes failed connection and schedules one retry`, async () => {
    const { clients, timers, context } = await harness({ [failure]: true });
    assert.equal(clients[0].closed, true);
    assert.equal(context.pgListenerClient, null);
    assert.equal(timers.length, 1);
  });
}
