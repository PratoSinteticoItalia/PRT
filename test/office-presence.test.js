import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizePresenceSettings, normalizeNetwork, ipMatchesNetwork, isCompanyNetwork,
  decidePresenceAction, reopenBreakMinutes, workedMinutesWithBreaks, PRESENCE_CUTOFF_HOUR,
} from "../lib/office-presence.js";

// Orario finto: giorno "2026-11-05", ms = ore*3600000 + minuti*60000 dal "mezzanotte" finta.
const H = (h, m = 0) => Date.UTC(2026, 10, 5, h, m);
const dayKeyOf = (ms) => new Date(ms).toISOString().slice(0, 10);
const hourOf = (ms) => new Date(ms).getUTCHours();
const base = { todayKey: "2026-11-05", dayKeyOf, hourOf, toleranceMs: 10 * 60000 };
const autoShift = (extra = {}) => ({ date: "2026-11-05", clockInAt: H(8, 2), clockOutAt: null, status: "open", inAuto: true, outAuto: false, ...extra });

test("presenze: reti del capannone, singolo indirizzo e /24, IPv6", () => {
  assert.equal(normalizeNetwork(" 93.41.2.10 "), "93.41.2.10");
  assert.equal(normalizeNetwork("93.41.2.0/24"), "93.41.2.0/24");
  assert.equal(normalizeNetwork("93.41.2.0/4"), "");
  assert.equal(normalizeNetwork("ciao"), "");
  assert.equal(ipMatchesNetwork("93.41.2.10", "93.41.2.10"), true);
  assert.equal(ipMatchesNetwork("::ffff:93.41.2.10", "93.41.2.10"), true);
  assert.equal(ipMatchesNetwork("93.41.2.77", "93.41.2.0/24"), true);
  assert.equal(ipMatchesNetwork("93.41.3.77", "93.41.2.0/24"), false);
  assert.equal(ipMatchesNetwork("2a01:e11:5::9", "2a01:e11:5::/48"), true);
  assert.equal(ipMatchesNetwork("2a01:e12::9", "2a01:e11::/32"), false);
  assert.equal(isCompanyNetwork("1.2.3.4", []), false);
  assert.equal(isCompanyNetwork("", ["1.2.3.4"]), false);
});

test("presenze: impostazioni ripulite (reti doppie, tolleranza fuori misura)", () => {
  const s = normalizePresenceSettings({ networks: ["1.2.3.4", "1.2.3.4", "x"], userIds: ["u1", "", "u1"], toleranceMin: 1 });
  assert.deepEqual(s, { networks: ["1.2.3.4"], userIds: ["u1"], toleranceMin: 3 });
  assert.equal(normalizePresenceSettings(null).toleranceMin, 10);
  assert.equal(normalizePresenceSettings({ toleranceMin: 999 }).toleranceMin, 120);
});

test("presenze: entrata al primo uso dalla rete del capannone", () => {
  const action = decidePresenceAction({ ...base, now: H(8, 3), connected: true, firstActivityAt: H(8, 2), lastActivityAt: H(8, 3) });
  assert.deepEqual(action, { type: "clock_in", at: H(8, 2) });
  // di sera non apre turni nuovi
  assert.equal(decidePresenceAction({ ...base, now: H(PRESENCE_CUTOFF_HOUR, 5), connected: true, firstActivityAt: H(PRESENCE_CUTOFF_HOUR, 1) }), null);
  // attività di ieri non conta
  assert.equal(decidePresenceAction({ ...base, now: H(8, 3), connected: true, firstActivityAt: H(8, 3) - 86400000 }), null);
});

test("presenze: uscita solo dopo la tolleranza, all'ora del distacco", () => {
  const shift = autoShift();
  assert.equal(decidePresenceAction({ ...base, now: H(13, 5), connected: false, disconnectedAt: H(13, 0), shift }), null);
  assert.deepEqual(decidePresenceAction({ ...base, now: H(13, 10), connected: false, disconnectedAt: H(13, 0), shift }), { type: "clock_out", at: H(13, 0) });
  // ancora collegato: niente
  assert.equal(decidePresenceAction({ ...base, now: H(15), connected: true, lastActivityAt: H(15), shift }), null);
  // dopo un riavvio del server si aspetta che i dispositivi si ricolleghino
  assert.equal(decidePresenceAction({ ...base, now: H(13, 20), connected: false, disconnectedAt: H(13, 0), shift, warmupUntil: H(13, 25) }), null);
});

test("presenze: i turni aperti, chiusi o approvati a mano non si toccano", () => {
  assert.equal(decidePresenceAction({ ...base, now: H(18), connected: false, disconnectedAt: H(13), shift: autoShift({ inAuto: false }) }), null);
  assert.equal(decidePresenceAction({ ...base, now: H(18), connected: true, lastActivityAt: H(17), shift: autoShift({ clockOutAt: H(13), status: "closed", outAuto: false }) }), null);
  assert.equal(decidePresenceAction({ ...base, now: H(18), connected: false, disconnectedAt: H(13), shift: autoShift({ status: "reviewed" }) }), null);
});

test("presenze: rientro nello stesso giorno riapre il turno", () => {
  const closed = autoShift({ clockOutAt: H(13), status: "closed", outAuto: true });
  assert.deepEqual(decidePresenceAction({ ...base, now: H(14, 1), connected: true, lastActivityAt: H(14), shift: closed }), { type: "reopen", at: H(14) });
  assert.equal(decidePresenceAction({ ...base, now: H(14, 1), connected: false, lastActivityAt: H(12), shift: closed }), null);
  assert.equal(reopenBreakMinutes(H(13), H(14)), 60);
  assert.equal(workedMinutesWithBreaks(H(8), H(17), 60), 480);
  assert.equal(workedMinutesWithBreaks(H(8), H(9), 120), 0);
});

test("presenze: PC acceso la sera si chiude all'ultimo utilizzo", () => {
  const shift = autoShift();
  assert.deepEqual(
    decidePresenceAction({ ...base, now: H(PRESENCE_CUTOFF_HOUR, 30), connected: true, lastActivityAt: H(18, 40), shift }),
    { type: "clock_out", at: H(18, 40) },
  );
});

test("presenze: turno rimasto aperto da ieri si chiude all'ultimo segnale di ieri", () => {
  const shift = autoShift({ date: "2026-11-04", clockInAt: H(8) - 86400000 });
  const lastYesterday = H(18) - 86400000;
  assert.deepEqual(decidePresenceAction({ ...base, now: H(7), connected: false, lastActivityAt: lastYesterday, disconnectedAt: null, shift }), { type: "clock_out", at: lastYesterday });
  // nessun segnale di quel giorno: si chiude all'entrata (0 ore, da sistemare a mano)
  assert.deepEqual(decidePresenceAction({ ...base, now: H(7), connected: true, lastActivityAt: H(6, 59), shift }), { type: "clock_out", at: shift.clockInAt });
});
