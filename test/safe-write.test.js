/**
 * Test della guardia scritture (lib/safe-write.js).
 * Esegui con: `npm test`.
 *
 * Invarianti: una scrittura che fallisce non deve MAI sparire in silenzio né
 * far crashare il chiamante; i fallimenti transitori vanno ritentati.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { createWriteGuard } from "../lib/safe-write.js";

// sleep finto: niente attese reali nei test
const noSleep = () => Promise.resolve();

test("safeWrite: successo al primo tentativo → nessun fallimento, ritorna il valore", async () => {
  const guard = createWriteGuard({ sleep: noSleep });
  let calls = 0;
  const res = await guard.safeWrite("ordini", async () => { calls++; return "ok"; });
  assert.equal(res, "ok");
  assert.equal(calls, 1);
  assert.equal(guard.totalFailures(), 0);
  assert.deepEqual(guard.getFailureCounts(), {});
});

test("safeWrite: fallimento transitorio poi successo → ritenta e riesce", async () => {
  const guard = createWriteGuard({ retries: 1, sleep: noSleep });
  let calls = 0;
  const res = await guard.safeWrite("store", async () => {
    calls++;
    if (calls === 1) throw new Error("DB momentaneamente giù");
    return "salvato";
  });
  assert.equal(res, "salvato");
  assert.equal(calls, 2);                 // 1 fallito + 1 retry riuscito
  assert.equal(guard.totalFailures(), 0); // recuperato → nessun fallimento definitivo
});

test("safeWrite: fallimento definitivo → conta, logga, NON rilancia", async () => {
  const errors = [];
  const guard = createWriteGuard({
    retries: 1,
    sleep: noSleep,
    onError: (label, err, meta) => errors.push({ label, msg: err.message, meta }),
  });
  let calls = 0;
  // non deve lanciare nonostante fallisca sempre
  const res = await guard.safeWrite("ordini", async () => { calls++; throw new Error("vincolo violato"); }, { id: "2767" });
  assert.equal(res, undefined);
  assert.equal(calls, 2);                       // tentativo + 1 retry
  assert.equal(guard.totalFailures(), 1);
  assert.deepEqual(guard.getFailureCounts(), { ordini: 1 });
  assert.equal(errors.length, 1);
  assert.equal(errors[0].label, "ordini");
  assert.equal(errors[0].meta.id, "2767");      // meta propagata al reporter
});

test("safeWrite: contatori separati per label e cumulativi", async () => {
  const guard = createWriteGuard({ retries: 0, sleep: noSleep });
  const boom = async () => { throw new Error("x"); };
  await guard.safeWrite("ordini", boom);
  await guard.safeWrite("ordini", boom);
  await guard.safeWrite("inventario", boom);
  assert.deepEqual(guard.getFailureCounts(), { ordini: 2, inventario: 1 });
  assert.equal(guard.totalFailures(), 3);
});

test("safeWrite: un onError che esplode non rompe il chiamante", async () => {
  const guard = createWriteGuard({
    retries: 0,
    sleep: noSleep,
    onError: () => { throw new Error("reporter rotto"); },
  });
  // non deve propagare l'errore del reporter
  const res = await guard.safeWrite("audit", async () => { throw new Error("fail"); });
  assert.equal(res, undefined);
  assert.equal(guard.totalFailures(), 1);
});

test("safeWrite: retries=0 → un solo tentativo", async () => {
  const guard = createWriteGuard({ retries: 0, sleep: noSleep });
  let calls = 0;
  await guard.safeWrite("x", async () => { calls++; throw new Error("no"); });
  assert.equal(calls, 1);
});

test("recordFailure: conta e logga un errore già intercettato altrove", () => {
  const errors = [];
  const guard = createWriteGuard({ onError: (label, err, meta) => errors.push({ label, meta }) });
  guard.recordFailure("upsertOrder", new Error("db giù"), { id: "2767" });
  guard.recordFailure("upsertOrder", new Error("db giù"));
  assert.deepEqual(guard.getFailureCounts(), { upsertOrder: 2 });
  assert.equal(errors.length, 2);
  assert.equal(errors[0].meta.id, "2767");
});

test("resetFailureCounts: azzera i contatori", async () => {
  const guard = createWriteGuard({ retries: 0, sleep: noSleep });
  await guard.safeWrite("x", async () => { throw new Error("no"); });
  assert.equal(guard.totalFailures(), 1);
  guard.resetFailureCounts();
  assert.equal(guard.totalFailures(), 0);
  assert.deepEqual(guard.getFailureCounts(), {});
});
