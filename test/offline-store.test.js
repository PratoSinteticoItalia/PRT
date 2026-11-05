import test from "node:test";
import assert from "node:assert/strict";
import {
  isOfflineCacheablePath, offlineCacheKey, newClientRef, outboxBackoffMs,
  classifyReplayError, outboxReadyItems, outboxSummary,
} from "../lib/offline-store.js";

test("offline: si tengono solo le letture utili, non esportazioni o il diario live", () => {
  assert.equal(isOfflineCacheablePath("/api/session"), true);
  assert.equal(isOfflineCacheablePath("/api/session-revision"), false);
  assert.equal(isOfflineCacheablePath("/api/session/revision"), false);
  assert.equal(isOfflineCacheablePath("/api/jobs/ord-1/events"), true);
  assert.equal(isOfflineCacheablePath("/api/jobs/live"), false);
  assert.equal(isOfflineCacheablePath("/api/work-reports?orderId=1"), true);
  assert.equal(isOfflineCacheablePath("/api/timesheet/export?from=1"), false);
  assert.equal(isOfflineCacheablePath("/api/sales/requests"), false);
  assert.equal(isOfflineCacheablePath("https://x/api/session"), false);
  assert.equal(offlineCacheKey("u1", "/api/session"), "get:u1:/api/session");
});

test("offline: codice azione valido per il server e diverso ogni volta", () => {
  const a = newClientRef();
  const b = newClientRef();
  assert.match(a, /^[A-Za-z0-9_-]{8,80}$/);
  assert.notEqual(a, b);
});

test("offline: attese crescenti fino a 5 minuti", () => {
  assert.equal(outboxBackoffMs(0), 5000);
  assert.equal(outboxBackoffMs(3), 60000);
  assert.equal(outboxBackoffMs(50), 300000);
});

test("offline: rete assente si riprova, dato rifiutato resta come «non inviata»", () => {
  assert.equal(classifyReplayError({ status: 0 }), "retry");
  assert.equal(classifyReplayError({ status: 503 }), "retry");
  assert.equal(classifyReplayError({ status: 429 }), "retry");
  assert.equal(classifyReplayError({ status: 401 }), "auth");
  assert.equal(classifyReplayError({ status: 400 }), "fail");
  assert.equal(classifyReplayError(undefined), "retry");
});

test("offline: si inviano solo le azioni dell'account collegato, in ordine", () => {
  const items = [
    { id: 3, userId: "u1", createdAt: 30 },
    { id: 1, userId: "u1", createdAt: 10 },
    { id: 2, userId: "u2", createdAt: 20 },
    { id: 4, userId: "u1", createdAt: 40, nextAttemptAt: 999 },
    { id: 5, userId: "u1", createdAt: 50, failed: true },
  ];
  assert.deepEqual(outboxReadyItems(items, "u1", 100).map((i) => i.id), [1, 3]);
  assert.deepEqual(outboxReadyItems(items, "u1", 1000).map((i) => i.id), [1, 3, 4]);
  // La prima in attesa di riprovare blocca quelle dopo (ordine dei passaggi).
  const waiting = [
    { id: 1, userId: "u1", createdAt: 10, nextAttemptAt: 500 },
    { id: 2, userId: "u1", createdAt: 20 },
  ];
  assert.deepEqual(outboxReadyItems(waiting, "u1", 100).map((i) => i.id), []);
  assert.deepEqual(outboxReadyItems(waiting, "u1", 600).map((i) => i.id), [1, 2]);
  const summary = outboxSummary(items, "u1");
  assert.equal(summary.pending, 3);
  assert.equal(summary.failed, 1);
});
