import test from "node:test";
import assert from "node:assert/strict";
import { buildTrips, DEFAULT_FLEET, fleetStatus, normalizeFleet, tripsTotals, vanCostPerKm, vanDeadlineStatus } from "../lib/fleet.js";

const dep = (at, km, tools, orderId = "o1") => ({ id: at, eventType: "departure", occurredAt: at, orderId, meta: { vanId: "ducato", km, tools } });
const ret = (at, km, tools, orderId = "o1") => ({ id: at, eventType: "return", occurredAt: at, orderId, meta: { vanId: "ducato", km, tools } });

test("anagrafica di partenza: Ducato e attrezzatura", () => {
  const fleet = normalizeFleet(undefined);
  assert.equal(fleet.vans[0].plate, "EB231ZE");
  assert.equal(fleet.tools.length, DEFAULT_FLEET.tools.length);
  assert.equal(fleet.tools.find((t) => t.id === "rampe").qty, 2);
});

test("id doppi e campi sporchi", () => {
  const fleet = normalizeFleet({ vans: [{ name: "Ducato" }, { name: "Ducato", plate: "ab 123 cd", costs: { fuelPrice: "1,85", kmPerLiter: "-3" } }], tools: [] });
  assert.deepEqual(fleet.vans.map((v) => v.id), ["ducato", "ducato-2"]);
  assert.equal(fleet.vans[1].plate, "AB123CD");
  assert.equal(fleet.vans[1].costs.fuelPrice, 1.85);
  assert.equal(fleet.vans[1].costs.kmPerLiter, null);
});

test("costo al km: ammortamento + carburante + spese fisse", () => {
  const cost = vanCostPerKm({ costs: { purchasePrice: 30000, residualValue: 6000, years: 8, kmPerYear: 30000, fuelPrice: 1.8, kmPerLiter: 9, insurancePerYear: 1200, taxPerYear: 300, maintenancePerYear: 900, tyresPerYear: 600 } });
  assert.equal(cost.amort, 0.1);
  assert.equal(cost.fuel, 0.2);
  assert.equal(cost.fixed, 0.1);
  assert.ok(Math.abs(cost.total - 0.4) < 1e-9);
  assert.equal(cost.complete, true);
  assert.equal(vanCostPerKm({ costs: { manualCostPerKm: 0.45, fuelPrice: 1.8, kmPerLiter: 9 } }).total, 0.45);
  assert.equal(vanCostPerKm({}).total, null);
});

test("viaggi: partenza e rientro dello stesso furgone", () => {
  const fleet = { vans: [{ id: "ducato", costs: { manualCostPerKm: 0.5 } }] };
  const trips = buildTrips([dep("2026-11-04T07:30:00Z", 1000, ["piastra"]), ret("2026-11-04T17:00:00Z", 1196, ["piastra"])], fleet);
  assert.equal(trips.length, 1);
  assert.equal(trips[0].km, 196);
  assert.equal(trips[0].cost, 98);
  assert.equal(trips[0].returned, true);
});

test("da un cantiere all'altro senza rientro", () => {
  const trips = buildTrips([
    dep("2026-11-04T07:00:00Z", 1000, [], "a"),
    dep("2026-11-04T12:00:00Z", 1080, [], "b"),
    ret("2026-11-04T18:00:00Z", 1200, [], "b"),
  ], { vans: [{ id: "ducato", costs: {} }] });
  const byOrder = Object.fromEntries(trips.map((t) => [t.orderId, t.km]));
  assert.deepEqual(byOrder, { a: 80, b: 120 });
  const totals = tripsTotals(trips, (t) => t.orderId);
  assert.equal(totals.a.km, 80);
  assert.equal(totals.a.missingCost, 1);
});

test("passaggi annullati e km al contrario", () => {
  const trips = buildTrips([
    dep("2026-11-04T07:00:00Z", 1000, []),
    { ...ret("2026-11-04T09:00:00Z", 1500, []), voidedAt: "2026-11-04T09:01:00Z" },
    ret("2026-11-04T18:00:00Z", 900, []),
  ], { vans: [{ id: "ducato" }] });
  assert.equal(trips.length, 1);
  assert.equal(trips[0].km, null);
});

test("attrezzi: fuori, rimasti in cantiere, rimessi a mano", () => {
  const fleet = normalizeFleet(undefined);
  const events = [
    dep("2026-11-04T07:00:00Z", 1000, ["piastra-vibrante", "rampe", "motozappa"]),
    ret("2026-11-04T18:00:00Z", 1100, ["rampe"]),
    dep("2026-11-05T07:00:00Z", 1100, ["rampe"], "o2"),
  ];
  let status = fleetStatus(events, fleet);
  assert.equal(status.tools["piastra-vibrante"].state, "left");
  assert.equal(status.tools["piastra-vibrante"].orderId, "o1");
  assert.equal(status.tools.rampe.state, "out");
  assert.equal(status.tools.verricello.state, "warehouse");
  assert.equal(status.vans.ducato.km, 1100);
  assert.equal(status.vans.ducato.out.orderId, "o2");
  status = fleetStatus(events, { ...fleet, toolMoves: [{ toolId: "piastra-vibrante", at: "2026-11-05T09:00:00Z" }] });
  assert.equal(status.tools["piastra-vibrante"].state, "warehouse");
});

test("rientro senza lista: torna tutto", () => {
  const status = fleetStatus([
    dep("2026-11-04T07:00:00Z", 1000, ["motozappa"]),
    { id: "r", eventType: "return", occurredAt: "2026-11-04T18:00:00Z", meta: { vanId: "ducato", km: 1100 } },
  ], normalizeFleet(undefined));
  assert.equal(status.tools.motozappa.state, "warehouse");
});

test("scadenze del furgone", () => {
  assert.equal(vanDeadlineStatus("2026-11-01", "2026-11-04"), "expired");
  assert.equal(vanDeadlineStatus("2026-11-20", "2026-11-04"), "soon");
  assert.equal(vanDeadlineStatus("2027-03-01", "2026-11-04"), "ok");
  assert.equal(vanDeadlineStatus("", "2026-11-04"), "");
});
