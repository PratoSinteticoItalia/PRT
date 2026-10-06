import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Dal Garden Planner al generatore: la richiesta collegata deve essere quella
// da cui il disegno è stato aperto (o nessuna) — mai l'ultima usata o la prima
// della lista CRM, che portava a "disegno non associato" e, peggio, ai contatti
// WhatsApp/email di un altro cliente.
const appSource = readFileSync(new URL("../app.js", import.meta.url), "utf8");
function extractFn(name) {
  const start = appSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} non trovata`);
  return appSource.slice(start, appSource.indexOf("\n}", start) + 2);
}

function makeContext({ requests = [], bridge = null, requestPrefill = null, plannerMode = false, selected = "" } = {}) {
  const storage = new Map();
  if (requestPrefill) storage.set("garden-planner-request-prefill-v1", JSON.stringify(requestPrefill));
  const ctx = {
    JSON, String, Number,
    GARDEN_PLANNER_REQUEST_PREFILL_STORAGE_KEY: "garden-planner-request-prefill-v1",
    window: { localStorage: { getItem: (k) => (storage.has(k) ? storage.get(k) : null) } },
    state: { selectedSalesRequestId: selected, selectedSalesRequestSnapshot: null, salesGeneratorPlannerMode: plannerMode },
    findSalesRequestById: (id) => requests.find((r) => r.id === id) || null,
    rememberSelectedSalesRequest: (item) => { ctx.state.selectedSalesRequestSnapshot = { ...item }; return ctx.state.selectedSalesRequestSnapshot; },
    getGardenPlannerQuoteBridge: () => bridge,
  };
  vm.createContext(ctx);
  vm.runInContext(`${extractFn("resolvePlannerLinkedRequest")}\n${extractFn("buildGardenPlannerAttachment")}`, ctx);
  return ctx;
}
const bridgeFor = (sourceRequestId) => ({ sourceRequestId, reportHtml: { client: "<svg></svg>", technical: "" }, client: "Mario Rossi" });

test("planner aperto da una richiesta: collega quella richiesta, non l'ultima usata", () => {
  const ctx = makeContext({ requests: [{ id: "R1", name: "Mario" }, { id: "R9", name: "Altro" }], selected: "R9", plannerMode: true });
  const linked = vm.runInContext(`resolvePlannerLinkedRequest(${JSON.stringify(bridgeFor("R1"))})`, ctx);
  assert.equal(linked.id, "R1");
  assert.equal(ctx.state.selectedSalesRequestId, "R1");
});

test("disegno libero: nessuna richiesta collegata (niente contatti di un altro cliente)", () => {
  const ctx = makeContext({ requests: [{ id: "R9", name: "Altro" }], selected: "R9", plannerMode: true });
  const linked = vm.runInContext(`resolvePlannerLinkedRequest(${JSON.stringify(bridgeFor(""))})`, ctx);
  assert.equal(linked, null);
  assert.equal(ctx.state.selectedSalesRequestId, "");
});

test("richiesta non in memoria: usa i contatti salvati all'apertura del planner, solo se è la stessa", () => {
  const prefill = { requestId: "R1", client: "Mario Rossi", city: "Bergamo", phone: "333", email: "m@x.it" };
  const ctx = makeContext({ requestPrefill: prefill, plannerMode: true });
  const linked = vm.runInContext(`resolvePlannerLinkedRequest(${JSON.stringify(bridgeFor("R1"))})`, ctx);
  assert.equal(linked.phone, "333");
  const other = makeContext({ requestPrefill: { ...prefill, requestId: "R2" }, plannerMode: true });
  assert.equal(vm.runInContext(`resolvePlannerLinkedRequest(${JSON.stringify(bridgeFor("R1"))})`, other), null);
  assert.equal(other.state.selectedSalesRequestId, "R1", "resta agganciato all'id giusto anche senza contatti");
});

test("allegato: associato se il preventivo nasce dal disegno, bloccato se è un disegno rimasto nel browser", () => {
  const fromPlanner = makeContext({ bridge: bridgeFor(""), plannerMode: true });
  assert.equal(vm.runInContext("buildGardenPlannerAttachment().associated", fromPlanner), true);
  const stale = makeContext({ bridge: bridgeFor(""), plannerMode: false, selected: "R9" });
  const staleAttachment = vm.runInContext("buildGardenPlannerAttachment()", stale);
  assert.equal(staleAttachment.available, true);
  assert.equal(staleAttachment.associated, false);
  const sameRequest = makeContext({ bridge: bridgeFor("R1"), plannerMode: false, selected: "R1" });
  assert.equal(vm.runInContext("buildGardenPlannerAttachment().associated", sameRequest), true);
  const otherRequest = makeContext({ bridge: bridgeFor("R1"), plannerMode: false, selected: "R2" });
  assert.equal(vm.runInContext("buildGardenPlannerAttachment().associated", otherRequest), false);
});
