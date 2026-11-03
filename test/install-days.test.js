import test from "node:test";
import assert from "node:assert/strict";
import { formatInstallRange, installationDays, lastInstallationDay, normalizeInstallEndDate, shiftInstallationDays } from "../lib/install-days.js";

test("posa di un giorno solo e di più giorni", () => {
  assert.deepEqual(installationDays({ installDate: "2026-11-04" }), ["2026-11-04"]);
  assert.deepEqual(installationDays({ installDate: "2026-11-04", installEndDate: "2026-11-06" }), ["2026-11-04", "2026-11-05", "2026-11-06"]);
  assert.deepEqual(installationDays({}), []);
});

test("la domenica in mezzo non conta", () => {
  // venerdì 6 → lunedì 9 novembre 2026
  assert.deepEqual(installationDays({ installDate: "2026-11-06", installEndDate: "2026-11-09" }), ["2026-11-06", "2026-11-07", "2026-11-09"]);
  assert.equal(lastInstallationDay({ installDate: "2026-11-06", installEndDate: "2026-11-09" }), "2026-11-09");
});

test("ultimo giorno prima del primo o uguale: posa di un giorno", () => {
  assert.equal(normalizeInstallEndDate("2026-11-06", "2026-11-04"), "");
  assert.equal(normalizeInstallEndDate("2026-11-06", "2026-11-06"), "");
  assert.equal(normalizeInstallEndDate("2026-11-06", "2026-11-08"), "2026-11-08");
  assert.deepEqual(installationDays({ installDate: "2026-11-06", installEndDate: "2026-11-01" }), ["2026-11-06"]);
});

test("spostare una posa di 3 giorni lavorativi la lascia di 3 giorni", () => {
  const install = { installDate: "2026-11-04", installEndDate: "2026-11-06" };
  // da venerdì 13: ven, sab, (dom no), lun 16
  assert.deepEqual(shiftInstallationDays(install, "2026-11-13"), { installDate: "2026-11-13", installEndDate: "2026-11-16" });
  assert.deepEqual(shiftInstallationDays({ installDate: "2026-11-04" }, "2026-11-10"), { installDate: "2026-11-10", installEndDate: "" });
});

test("etichetta dei giorni", () => {
  assert.equal(formatInstallRange({ installDate: "2026-11-04" }), "4 nov");
  assert.equal(formatInstallRange({ installDate: "2026-11-04", installEndDate: "2026-11-06" }), "4–6 nov");
  assert.equal(formatInstallRange({ installDate: "2026-10-30", installEndDate: "2026-11-02" }), "30 ott – 2 nov");
});
