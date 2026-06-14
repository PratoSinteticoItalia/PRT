/**
 * Test degli helper di backup (lib/backup.js).
 * Invarianti: uno snapshot valido si riconosce, uno corrotto si blocca prima
 * del restore, la rotazione tiene i più recenti.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildSnapshot,
  validateSnapshot,
  snapshotFileName,
  isSnapshotFile,
  selectBackupsToPrune,
  BACKUP_SCHEMA,
} from "../lib/backup.js";

const NOW = "2026-06-14T10:00:00.000Z";

test("buildSnapshot: struttura, conteggi e default", () => {
  const snap = buildSnapshot({
    orders: [{ id: "1" }, { id: "2" }],
    inventory: [{ id: "p1" }],
    jobs: [],
    salesRequests: [{ id: "r1" }],
    settings: { foo: "bar" },
    store: { a: 1 },
  }, { now: NOW });
  assert.equal(snap.schema, BACKUP_SCHEMA);
  assert.equal(snap.version, 1);
  assert.equal(snap.createdAt, NOW);
  assert.deepEqual(snap.counts, { orders: 2, inventory: 1, jobs: 0, salesRequests: 1 });
  assert.equal(snap.data.settings.foo, "bar");
});

test("buildSnapshot: parti mancanti → default vuoti (niente crash)", () => {
  const snap = buildSnapshot({}, { now: NOW });
  assert.deepEqual(snap.counts, { orders: 0, inventory: 0, jobs: 0, salesRequests: 0 });
  assert.deepEqual(snap.data.orders, []);
  assert.equal(snap.data.store, null);
});

test("validateSnapshot: accetta uno snapshot valido", () => {
  const snap = buildSnapshot({ orders: [{ id: "1" }] }, { now: NOW });
  const { ok, errors } = validateSnapshot(snap);
  assert.equal(ok, true);
  assert.deepEqual(errors, []);
});

test("validateSnapshot: rifiuta null / schema errato / data mancante", () => {
  assert.equal(validateSnapshot(null).ok, false);
  assert.equal(validateSnapshot({ version: 1, data: {} }).ok, false); // schema errato
  const bad = validateSnapshot({ schema: BACKUP_SCHEMA, version: 1 });
  assert.equal(bad.ok, false);
  assert.ok(bad.errors.some((e) => /data mancante/.test(e)));
});

test("validateSnapshot: rifiuta se una tabella non è un array", () => {
  const { ok, errors } = validateSnapshot({
    schema: BACKUP_SCHEMA, version: 1,
    data: { orders: "oops", inventory: [], jobs: [], salesRequests: [] },
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => /data\.orders/.test(e)));
});

test("snapshotFileName / isSnapshotFile", () => {
  const name = snapshotFileName(NOW);
  assert.equal(name, "snapshot-2026-06-14T10-00-00-000Z.json");
  assert.equal(isSnapshotFile(name), true);
  assert.equal(isSnapshotFile("store.json"), false);
});

test("selectBackupsToPrune: tiene i più recenti, elimina i più vecchi", () => {
  const files = [
    "snapshot-2026-06-10T00-00-00-000Z.json",
    "snapshot-2026-06-11T00-00-00-000Z.json",
    "snapshot-2026-06-12T00-00-00-000Z.json",
    "snapshot-2026-06-13T00-00-00-000Z.json",
    "store.json", // ignorato
  ];
  const prune = selectBackupsToPrune(files, 2);
  assert.deepEqual(prune, [
    "snapshot-2026-06-10T00-00-00-000Z.json",
    "snapshot-2026-06-11T00-00-00-000Z.json",
  ]);
});

test("selectBackupsToPrune: sotto soglia → niente da eliminare", () => {
  const files = ["snapshot-2026-06-13T00-00-00-000Z.json"];
  assert.deepEqual(selectBackupsToPrune(files, 14), []);
});
