import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const fn = source.slice(source.indexOf('async function keepSessionAlive('), source.indexOf('function startSessionKeepalive('));
function setup(responses) {
  let resets = 0;
  const state = { currentUser: { id: 'test-user' }, sessionRevision: 'r1' };
  const context = vm.createContext({
    state, sessionKeepaliveInFlight: false, sessionKeepaliveForceQueued: false,
    readSessionRevision: async () => ({ hasUser: false }),
    apiFetch: async () => {
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return response;
    },
    resetSessionToAuthView: () => { resets++; state.currentUser = null; },
    applyFetchedSessionSnapshot: session => {
      if (!session?.user) { resets++; state.currentUser = null; return false; }
      state.currentUser = session.user;
      return true;
    },
    setShellPending() {}, window: { setTimeout() {} },
  });
  vm.runInContext(fn, context);
  return { context, state, resets: () => resets, run: options => context.keepSessionAlive(options) };
}

test('network failure during session confirmation preserves the signed-in user', async () => {
  const app = setup([new Error('offline'), new Error('offline')]);
  assert.equal(await app.run(), false);
  assert.equal(app.state.currentUser.id, 'test-user');
  assert.equal(app.resets(), 0);
  assert.equal(app.context.sessionKeepaliveInFlight, false);
});

test('an explicit empty session confirms expiry and shows login', async () => {
  const app = setup([{}]);
  assert.equal(await app.run(), false);
  assert.equal(app.state.currentUser, null);
  assert.equal(app.resets(), 1);
});

test('a valid confirmation preserves authentication despite a missing revision user', async () => {
  const app = setup([{ user: { id: 'test-user' } }]);
  assert.equal(await app.run(), true);
  assert.equal(app.resets(), 0);
});

test('session confirmation can recover after a temporary network failure', async () => {
  const app = setup([new Error('timeout'), { user: { id: 'test-user' } }]);
  assert.equal(await app.run(), true);
  assert.equal(app.resets(), 0);
});

test('non-silent network failure propagates without logging out', async () => {
  const app = setup([new Error('offline'), new Error('offline')]);
  await assert.rejects(app.run({ silent: false }), /offline/);
  assert.equal(app.state.currentUser.id, 'test-user');
  assert.equal(app.resets(), 0);
});
