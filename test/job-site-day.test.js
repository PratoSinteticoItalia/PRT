import test from "node:test";
import assert from "node:assert/strict";
import { diaryByDay, formatMinutes, romeDateKey, siteDayState, summarizeDay } from "../lib/job-site-day.js";

// 4 novembre 2026: a Roma è UTC+1.
const ev = (eventType, hhmm, extra = {}) => ({ eventType, occurredAt: `2026-11-04T${hhmm}:00+01:00`, ...extra });
const install3 = { installDate: "2026-11-04", installEndDate: "2026-11-06" };

test("giorno di Roma anche dopo la mezzanotte UTC", () => {
  assert.equal(romeDateKey("2026-11-04T23:30:00Z"), "2026-11-05");
  assert.equal(romeDateKey("2026-11-04T22:30:00Z"), "2026-11-04");
});

test("senza passaggi si parte dalla partenza", () => {
  const s = siteDayState([], install3, "2026-11-04");
  assert.equal(s.nextType, "departure");
  assert.equal(s.dayLabel, "day:1/3");
  assert.equal(s.lastDay, false);
});

test("primo giorno di tre: dopo l'inizio lavori viene Fine giornata", () => {
  const events = [ev("departure", "07:30"), ev("arrival", "08:12"), ev("work_start", "08:20")];
  const s = siteDayState(events, install3, "2026-11-04");
  assert.equal(s.nextType, "day_end");
  assert.equal(s.altEndType, "work_end");
});

test("ultimo giorno: Fine posa", () => {
  const events = [{ eventType: "work_start", occurredAt: "2026-11-06T08:00:00+01:00" }];
  const s = siteDayState(events, install3, "2026-11-06");
  assert.equal(s.nextType, "work_end");
  assert.equal(s.altEndType, "day_end");
});

test("i passaggi annullati non contano", () => {
  const events = [ev("departure", "07:30"), ev("arrival", "08:12", { voidedAt: "2026-11-04T08:13:00+01:00" })];
  assert.equal(siteDayState(events, install3, "2026-11-04").nextType, "arrival");
});

test("arrivo senza partenza: si va avanti dal punto più alto", () => {
  assert.equal(siteDayState([ev("arrival", "08:00")], install3, "2026-11-04").nextType, "work_start");
});

test("giornata chiusa dopo il rientro", () => {
  const events = [ev("departure", "07:30"), ev("arrival", "08:12"), ev("work_start", "08:20"), ev("day_end", "16:30"), ev("return", "17:15")];
  assert.equal(siteDayState(events, install3, "2026-11-04").nextType, "");
});

test("riepilogo: viaggio, lavori, km e attrezzi mancanti", () => {
  const events = [
    ev("departure", "07:30", { meta: { vanId: "ducato", km: 148236, tools: ["piastra", "rampe"] } }),
    ev("arrival", "08:12"),
    ev("work_start", "08:20"),
    ev("work_end", "16:30"),
    ev("return", "17:15", { meta: { vanId: "ducato", km: 148432, tools: ["rampe"] } }),
  ];
  const sum = summarizeDay(events);
  assert.equal(sum.travelMinutes, 42);
  assert.equal(sum.workMinutes, 490);
  assert.equal(sum.km, 196);
  assert.deepEqual(sum.toolsMissing, ["piastra"]);
  assert.equal(formatMinutes(490), "8 h 10 min");
  assert.equal(formatMinutes(42), "42 min");
  assert.equal(formatMinutes(120), "2 h");
});

test("posa finita un giorno prima", () => {
  const events = [{ eventType: "work_end", occurredAt: "2026-11-05T16:00:00+01:00" }];
  const s = siteDayState(events, install3, "2026-11-06");
  assert.equal(s.finishedBefore, true);
});

test("fuori dai giorni previsti", () => {
  assert.equal(siteDayState([], install3, "2026-11-03").dayLabel, "early");
  assert.equal(siteDayState([], install3, "2026-11-09").dayLabel, "extra");
  assert.equal(siteDayState([], install3, "2026-11-09").lastDay, true);
  assert.equal(siteDayState([], { installDate: "2026-11-04" }, "2026-11-04").dayLabel, "");
});

test("diario per giorno, dal più recente", () => {
  const events = [
    { eventType: "departure", occurredAt: "2026-11-04T07:00:00+01:00" },
    { eventType: "departure", occurredAt: "2026-11-05T07:00:00+01:00" },
  ];
  assert.deepEqual(diaryByDay(events).map((d) => d.dateKey), ["2026-11-05", "2026-11-04"]);
});
