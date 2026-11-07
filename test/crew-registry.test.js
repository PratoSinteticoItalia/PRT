import test from "node:test";
import assert from "node:assert/strict";
import {
  crewKey,
  cleanCrewName,
  normalizeCrewRegistry,
  findCrewEntry,
  planCrewRename,
  renameCrewInInstallation,
  renameCrewInPlanner,
  crewUsageTotal,
} from "../lib/crew-registry.js";

test("crewKey: stessa squadra scritta in modi diversi", () => {
  assert.equal(crewKey("Team Campania"), "campania");
  assert.equal(crewKey("  squadra   CAMPANIA "), "campania");
  assert.equal(crewKey("Città Verde"), "citta verde");
  assert.notEqual(crewKey("Kingarten"), crewKey("Kingarden"));
  assert.equal(crewKey("Team"), "");
  assert.equal(cleanCrewName("  Ever   Green  "), "Ever Green");
});

test("registro: righe doppie della stessa squadra → vince quella attiva", () => {
  const registry = normalizeCrewRegistry([
    { value: "Team Campania", label: "Team Campania", active: false, metadata: { archivedAt: "2026-11-06" } },
    { value: "Kingarden", label: "Kingarden", active: true, metadata: '{"capacity":150}' },
    { value: "Campania", label: "Campania", active: true, metadata: {} },
    { value: "", label: "", active: true },
  ]);
  assert.equal(registry.length, 2);
  assert.deepEqual(registry.map((e) => [e.name, e.archived]), [["Campania", false], ["Kingarden", false]]);
  assert.equal(findCrewEntry(registry, "kingarden").capacity, 150);
  assert.equal(findCrewEntry(registry, "Alpha"), null);
});

test("rinomina: nome nuovo, unione con squadra esistente, solo maiuscole", () => {
  const registry = normalizeCrewRegistry([
    { value: "Kingarten", label: "Kingarten", active: true },
    { value: "Kingarden", label: "Kingarden", active: true, metadata: { capacity: 200 } },
    { value: "Team Campania", label: "Team Campania", active: false },
  ]);
  const merge = planCrewRename(registry, "Kingarten", "kingarden");
  assert.equal(merge.merge, true);
  assert.equal(merge.finalName, "Kingarden");
  assert.equal(merge.archived, false);
  assert.equal(merge.capacity, 200);

  const plain = planCrewRename(registry, "Kingarten", "  King  Garden ");
  assert.equal(plain.merge, false);
  assert.equal(plain.finalName, "King Garden");

  const caseOnly = planCrewRename(registry, "Kingarden", "KinGarden");
  assert.equal(caseOnly.merge, false);
  assert.equal(caseOnly.finalName, "KinGarden");

  const archived = planCrewRename(registry, "Team Campania", "Campania Vecchia");
  assert.equal(archived.archived, true);

  assert.equal(planCrewRename(registry, "Kingarten", "  ").error, "crew_name_required");
});

test("rinomina dentro la posa: squadra, spese, conto posa; il resto non si tocca", () => {
  const installation = {
    crew: "Kingarten",
    installDate: "2026-11-05",
    travelExpenses: [{ id: "e1", crew: "kingarten", amount: 10 }, { id: "e2", crew: "Arboart", amount: 5 }],
    profitSplit: { partnerName: "Kingarten", partnerPercent: 50 },
    partnerSettlement: null,
  };
  const { installation: next, changed } = renameCrewInInstallation(installation, crewKey("Kingarten"), "Kingarden");
  assert.equal(changed, true);
  assert.equal(next.crew, "Kingarden");
  assert.deepEqual(next.travelExpenses.map((e) => e.crew), ["Kingarden", "Arboart"]);
  assert.equal(next.profitSplit.partnerName, "Kingarden");
  assert.equal(next.profitSplit.partnerPercent, 50);
  assert.equal(installation.crew, "Kingarten", "l'originale non cambia");

  const untouched = renameCrewInInstallation({ crew: "Arboart" }, crewKey("Kingarten"), "Kingarden");
  assert.equal(untouched.changed, false);
  // «Ever Green Garden» non è «Green»: niente somiglianze parziali.
  assert.equal(renameCrewInInstallation({ crew: "Ever Green Garden" }, crewKey("Green"), "X").changed, false);
});

test("pianificatore: assenze unite, archivio tolto", () => {
  const { planner, changed } = renameCrewInPlanner({
    teams: { Kingarten: { color: "#111" }, Kingarden: { color: "#222" } },
    availability: { Kingarten: { "2026-11-10": true }, Kingarden: { "2026-11-11": true } },
    archivedTeams: ["Kingarten", "Arboart"],
  }, crewKey("Kingarten"), "Kingarden");
  assert.equal(changed, true);
  assert.deepEqual(Object.keys(planner.teams), ["Kingarden"]);
  assert.equal(planner.teams.Kingarden.color, "#222");
  assert.deepEqual(planner.availability.Kingarden, { "2026-11-10": true, "2026-11-11": true });
  assert.equal(planner.availability.Kingarten, undefined);
  assert.deepEqual(planner.archivedTeams, ["Arboart"]);
});

test("uso della squadra: zero = si può eliminare", () => {
  assert.equal(crewUsageTotal(null), 0);
  assert.equal(crewUsageTotal({ pose: 0, accounts: 0, surveys: 0 }), 0);
  assert.equal(crewUsageTotal({ pose: 10, surveys: 2 }), 12);
});
