import test from "node:test";
import assert from "node:assert/strict";

import {
  buildNotification,
  countUnread,
  listNotificationsForUser,
  markNotificationsRead,
  normalizeNotification,
  normalizeNotificationPrefs,
  pruneNotifications,
  resolveChannels,
  upsertNotification,
} from "../lib/notifications.js";

test("notifiche: un record senza destinatario o tipo non è consegnabile", () => {
  assert.equal(normalizeNotification({ id: "n1", type: "chat_message" }), null);
  assert.equal(normalizeNotification({ id: "n1", userId: "u2" }), null);
  assert.equal(normalizeNotification({ userId: "u2", type: "chat_message" }), null);
});

test("notifiche: upsert collassa le non lette con la stessa dedupeKey", () => {
  let list = [];
  ({ list } = upsertNotification(list, buildNotification({
    id: "n1",
    userId: "u2",
    type: "chat_message",
    title: "Mario",
    body: "Ciao",
    dedupeKey: "chat:t1",
    createdAt: "2026-07-27T10:00:00.000Z",
  })));
  const second = upsertNotification(list, buildNotification({
    id: "n2",
    userId: "u2",
    type: "chat_message",
    title: "Mario",
    body: "Sei arrivato?",
    dedupeKey: "chat:t1",
    createdAt: "2026-07-27T10:01:00.000Z",
  }));
  list = second.list;

  assert.equal(list.length, 1, "due messaggi nello stesso thread restano una riga");
  assert.equal(second.collapsed, true);
  assert.equal(list[0].count, 2);
  assert.equal(list[0].body, "Sei arrivato?", "mostra il messaggio più recente");
  assert.equal(list[0].id, "n1", "l'id resta quello già renderizzato dal client");
});

test("notifiche: dopo la lettura un nuovo messaggio crea una riga nuova", () => {
  let list = [];
  ({ list } = upsertNotification(list, buildNotification({
    id: "n1", userId: "u2", type: "chat_message", dedupeKey: "chat:t1",
    createdAt: "2026-07-27T10:00:00.000Z",
  })));
  ({ list } = markNotificationsRead(list, "u2", null, "2026-07-27T10:05:00.000Z"));
  ({ list } = upsertNotification(list, buildNotification({
    id: "n2", userId: "u2", type: "chat_message", dedupeKey: "chat:t1",
    createdAt: "2026-07-27T10:06:00.000Z",
  })));

  assert.equal(list.length, 2);
  assert.equal(countUnread(list, "u2"), 1);
});

test("notifiche: dedupeKey uguale ma destinatario diverso non collassa", () => {
  let list = [];
  ({ list } = upsertNotification(list, buildNotification({
    id: "n1", userId: "u2", type: "chat_message", dedupeKey: "chat:t1",
    createdAt: "2026-07-27T10:00:00.000Z",
  })));
  ({ list } = upsertNotification(list, buildNotification({
    id: "n2", userId: "u3", type: "chat_message", dedupeKey: "chat:t1",
    createdAt: "2026-07-27T10:00:01.000Z",
  })));

  assert.equal(list.length, 2);
  assert.equal(countUnread(list, "u2"), 1);
  assert.equal(countUnread(list, "u3"), 1);
});

test("notifiche: mark-read mirato tocca solo gli id indicati e segnala il cambiamento", () => {
  const base = [
    buildNotification({ id: "n1", userId: "u2", type: "chat_message", createdAt: "2026-07-27T10:00:00.000Z" }),
    buildNotification({ id: "n2", userId: "u2", type: "crew_assigned", createdAt: "2026-07-27T09:00:00.000Z" }),
    buildNotification({ id: "n3", userId: "u3", type: "crew_assigned", createdAt: "2026-07-27T09:00:00.000Z" }),
  ];

  const targeted = markNotificationsRead(base, "u2", ["n1"], "2026-07-27T11:00:00.000Z");
  assert.equal(targeted.changed, true);
  assert.equal(countUnread(targeted.list, "u2"), 1);
  assert.equal(countUnread(targeted.list, "u3"), 1, "non tocca le notifiche di altri utenti");

  const repeat = markNotificationsRead(targeted.list, "u2", ["n1"], "2026-07-27T11:00:00.000Z");
  assert.equal(repeat.changed, false, "niente scrittura su disco se non c'era nulla da leggere");
});

test("notifiche: la lista per utente è ordinata dal più recente ed è limitata", () => {
  const list = [
    buildNotification({ id: "old", userId: "u2", type: "test", createdAt: "2026-07-20T10:00:00.000Z" }),
    buildNotification({ id: "new", userId: "u2", type: "test", createdAt: "2026-07-27T10:00:00.000Z" }),
    buildNotification({ id: "other", userId: "u3", type: "test", createdAt: "2026-07-27T10:00:00.000Z" }),
  ];

  assert.deepEqual(listNotificationsForUser(list, "u2").map((n) => n.id), ["new", "old"]);
  assert.deepEqual(listNotificationsForUser(list, "u2", { limit: 1 }).map((n) => n.id), ["new"]);
});

test("notifiche: la potatura scarta le vecchie lette ma tiene le non lette", () => {
  const now = Date.parse("2026-07-27T10:00:00.000Z");
  const list = [
    { ...buildNotification({ id: "vecchia-letta", userId: "u2", type: "test", createdAt: "2026-01-01T10:00:00.000Z" }), readAt: "2026-01-02T10:00:00.000Z" },
    buildNotification({ id: "vecchia-non-letta", userId: "u2", type: "test", createdAt: "2026-01-01T10:00:00.000Z" }),
    buildNotification({ id: "recente", userId: "u2", type: "test", createdAt: "2026-07-27T09:00:00.000Z" }),
  ];

  const pruned = pruneNotifications(list, { maxAgeDays: 60, now });
  assert.deepEqual(pruned.map((n) => n.id), ["recente", "vecchia-non-letta"]);
});

test("notifiche: il tetto per utente non svuota la casella degli altri", () => {
  const list = [];
  for (let i = 0; i < 5; i++) {
    list.push(buildNotification({
      id: `a${i}`, userId: "u2", type: "test",
      createdAt: new Date(Date.parse("2026-07-27T10:00:00.000Z") - (i * 1000)).toISOString(),
    }));
  }
  list.push(buildNotification({ id: "b1", userId: "u3", type: "test", createdAt: "2026-07-27T09:00:00.000Z" }));

  const pruned = pruneNotifications(list, { maxPerUser: 2, now: Date.parse("2026-07-27T10:00:00.000Z") });
  assert.equal(pruned.filter((n) => n.userId === "u2").length, 2);
  assert.equal(pruned.filter((n) => n.userId === "u3").length, 1);
});

test("notifiche: il canale in-app non è disattivabile, la push sì", () => {
  assert.deepEqual(resolveChannels("chat_message", {}), { inapp: true, push: true });
  assert.deepEqual(
    resolveChannels("chat_message", { chat_message: { push: false } }),
    { inapp: true, push: false },
    "spegnere la push lascia comunque la riga nel centro notifiche",
  );
  assert.deepEqual(resolveChannels("tipo_sconosciuto", {}), { inapp: true, push: false });
});

test("notifiche: le preferenze scartano tipi sconosciuti e valori non booleani", () => {
  assert.deepEqual(
    normalizeNotificationPrefs({
      chat_message: { push: false },
      tipo_inventato: { push: false },
      crew_assigned: { push: "no" },
      warehouse_ready: null,
    }),
    { chat_message: { push: false } },
  );
});
