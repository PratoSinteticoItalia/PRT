import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

// Inbox Ordini → "Preparazione & instradamento" (segnalato il 19 ott 2026):
// "Corriere" tornava "Da definire" quando il server era in riavvio, e la data
// digitata a mano veniva salvata a metà (Chrome manda 0002, 0020, 0202, 2026).
const source = readFileSync(new URL("../app.js", import.meta.url), "utf8");

function loadSaveFlow({ fetchImpl, transient = (error) => [0, 502, 503, 504].includes(error.status) } = {}) {
  const timers = [];
  const statuses = [];
  const context = {
    state: { orders: [{ id: "a", operations: { warehouse: { fulfillmentMode: "da-definire" }, installation: {} } }], lang: "it" },
    orderPendingPatchIds: new Set(),
    getOrderInventoryAllocations: () => [],
    apiFetchWithRetry: (url, options) => fetchImpl(JSON.parse(options.body)),
    isTransientApiError: transient,
    describeApiSaveError: (error) => `errore ${error.status}`,
    renderCurrentViewOnly: () => {},
    refreshCurrentView: () => {},
    flashButtonFeedback: () => {},
    showToast: () => {},
    setStatus: (_node, kind, message) => statuses.push([kind, message]),
    clearStatus: () => {},
    escapeHtml: (value) => String(value),
    ui: {},
    document: { querySelector: () => null },
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    clearTimeout: () => {},
  };
  const start = source.indexOf("const _inboxFlowSaveTimers");
  const end = source.indexOf("async function saveShipping(", start);
  vm.runInNewContext(`${source.slice(start, end)}
    globalThis.api = { saveInboxOrderFlow, retryInboxFlowUnsaved, isPlausibleInboxFlowDate, _inboxFlowUnsaved, _inboxFlowSaveStatus };`, context);
  return { context, api: context.api, timers, statuses };
}

const mode = (ctx) => ctx.state.orders[0].operations.warehouse.fulfillmentMode;

test("server giù anche dopo i ritentativi: la scelta resta a video e riparte da sola", async () => {
  let calls = 0;
  const { context, api, timers } = loadSaveFlow({
    fetchImpl: async (body) => {
      calls += 1;
      if (calls === 1) throw Object.assign(new Error("request_failed"), { status: 502 });
      return { id: "a", operations: { warehouse: body.warehouse, installation: {} } };
    },
  });
  await api.saveInboxOrderFlow("a", { warehouse: { selected: true, fulfillmentMode: "corriere" } });
  assert.equal(mode(context), "corriere", "la scelta non deve tornare a 'Da definire'");
  assert.equal(api._inboxFlowSaveStatus.get("a").kind, "unsaved");
  assert.equal(context.orderPendingPatchIds.has("a"), true, "gli aggiornamenti in arrivo non devono sovrascriverla");
  const retry = timers.find((t) => t.ms === 15000);
  assert.ok(retry, "nuovo tentativo programmato");
  retry.fn();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(calls, 2);
  assert.equal(mode(context), "corriere");
  assert.equal(api._inboxFlowSaveStatus.get("a").kind, "saved");
  assert.equal(context.orderPendingPatchIds.size, 0);
});

test("una nuova scelta mentre la precedente è in sospeso parte insieme a lei", async () => {
  const bodies = [];
  let fail = true;
  const { api } = loadSaveFlow({
    fetchImpl: async (body) => {
      bodies.push(body);
      if (fail) throw Object.assign(new Error("network_error"), { status: 0 });
      return { id: "a", operations: { warehouse: body.warehouse, installation: body.installation || {} } };
    },
  });
  await api.saveInboxOrderFlow("a", { warehouse: { selected: true, fulfillmentMode: "corriere" } });
  fail = false;
  await api.saveInboxOrderFlow("a", { warehouse: { preparationDate: "2026-10-22" } });
  const last = bodies.at(-1);
  assert.equal(last.warehouse.fulfillmentMode, "corriere");
  assert.equal(last.warehouse.preparationDate, "2026-10-22");
  assert.equal(api._inboxFlowUnsaved.size, 0);
});

test("errore definitivo (non di rete): si torna ai dati del server e si spiega", async () => {
  const { context, api, statuses } = loadSaveFlow({
    fetchImpl: async () => { throw Object.assign(new Error("forbidden"), { status: 403 }); },
  });
  await api.saveInboxOrderFlow("a", { warehouse: { selected: true, fulfillmentMode: "furgone" } });
  assert.equal(mode(context), "da-definire");
  assert.equal(api._inboxFlowSaveStatus.get("a").kind, "failed");
  assert.equal(context.orderPendingPatchIds.size, 0);
  assert.match(statuses.at(-1)[1], /errore 403/);
});

test("data: solo date complete e sensate (niente anni a metà)", () => {
  const { api } = loadSaveFlow({ fetchImpl: async () => ({}) });
  for (const partial of ["0002-10-15", "0020-10-15", "0202-10-15", "", "15/10/2026"]) {
    assert.equal(api.isPlausibleInboxFlowDate(partial), false, partial);
  }
  assert.equal(api.isPlausibleInboxFlowDate("2026-10-15"), true);
});

test("buildInboxOrderFlowPayload: con l'anno a metà resta la data già salvata", () => {
  const order = { id: "a", operations: { warehouse: { selected: true, fulfillmentMode: "corriere", preparationDate: "2026-10-20" }, installation: {} } };
  const nodes = {
    "[data-order-flow-mode=\"a\"]": { dataset: { value: "corriere" } },
    "[data-order-flow-date=\"a\"]": { value: "0020-10-22" },
    "[data-order-flow-warehouse=\"a\"]": { dataset: { on: "1" } },
    "[data-order-flow-installation=\"a\"]": { dataset: { on: "0" } },
  };
  const context = { state: { orders: [order] }, document: { querySelector: (sel) => nodes[sel] || null } };
  const start = source.indexOf("function buildInboxOrderFlowPayload(");
  const end = source.indexOf("const _inboxFlowSaveTimers", start);
  const plausible = source.slice(source.indexOf("function isPlausibleInboxFlowDate("), source.indexOf("// Scegliere Corriere/Furgone/Ritiro"));
  const build = vm.runInNewContext(`${plausible}\n${source.slice(start, end)};buildInboxOrderFlowPayload`, context);
  assert.equal(build("a").warehouse.preparationDate, "2026-10-20");
  nodes["[data-order-flow-date=\"a\"]"].value = "2026-10-22";
  assert.equal(build("a").warehouse.preparationDate, "2026-10-22");
  assert.equal(build("a").warehouse.fulfillmentMode, "corriere");
});

test("data preparazione proposta = giorno prima della posa (non due giorni in Italia)", () => {
  const start = source.indexOf("function getShippingTargetDate(");
  const end = source.indexOf("\n}", start) + 2;
  const getShippingTargetDate = vm.runInNewContext(`${source.slice(start, end)};getShippingTargetDate`, {});
  assert.equal(getShippingTargetDate({ operations: { installation: { installDate: "2026-10-15" } } }), "2026-10-14");
  assert.equal(getShippingTargetDate({ operations: { installation: { installDate: "2026-11-01" } } }), "2026-10-31");
  assert.equal(getShippingTargetDate({ operations: { warehouse: { preparationDate: "2026-10-20" }, installation: { installDate: "2026-10-25" } } }), "2026-10-20");
  assert.equal(getShippingTargetDate({ operations: {} }), "");
});
