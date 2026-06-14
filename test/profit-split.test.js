/**
 * Test della matematica del riparto utili pose (lib/profit-split.js).
 * Esegui con: `npm test` (node --test, zero dipendenze).
 *
 * Bloccano gli INVARIANTI del conto posa: costi dedotti, utile divisibile,
 * quote e totali per parte, quadratura. Sono la rete di sicurezza condivisa
 * tra schermo (app.js) e documento PDF (lib/profit-split-pdf.js): se la formula
 * cambia, lo screen e il PDF devono cambiare insieme — e questi test scattano.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeProfitSplitScenario,
  normalizeProfitSplitExpenseLines,
  addProfitSplitExpenseLine,
} from "../lib/profit-split.js";

test("computeProfitSplitScenario: scenario completo con spese miste", () => {
  const r = computeProfitSplitScenario({
    partnerName: "Luigi",
    revenue: "4000",
    partnerDailyFixed: "100",
    partnerDays: "3",
    partnerSharePct: "50",
    ownerRecovery: "200",
    partnerRecovery: "0",
    expenseLines: [
      { label: "Benzina", amount: "180", payer: "owner" },
      { label: "Alloggio", amount: "220", payer: "partner" },
    ],
  });
  assert.equal(r.partnerFixedTotal, 300);
  assert.equal(r.ownerPaidExpenses, 180);
  assert.equal(r.partnerPaidExpenses, 220);
  assert.equal(r.sharedJobCosts, 0);
  // 180 + 220 + 0 + 200(recupero tuo) + 0 + 300(fisso)
  assert.equal(r.deductibleCosts, 900);
  assert.equal(r.divisibleProfit, 3100);
  assert.equal(r.partnerProfitShare, 1550);
  assert.equal(r.ownerProfitShare, 1550);
  // 220(spese sue) + 0 + 300(fisso) + 1550(quota)
  assert.equal(r.partnerDue, 2070);
  // 180(spese tue) + 200(recupero) + 1550(quota)
  assert.equal(r.ownerDue, 1930);
});

test("computeProfitSplitScenario: la quadratura chiude (ricavo = costi condivisi + dovuti)", () => {
  const r = computeProfitSplitScenario({
    revenue: "3200",
    partnerDailyFixed: "100",
    partnerDays: "2",
    partnerSharePct: "50",
    ownerRecovery: "200",
    expenseLines: [{ label: "Caselli", amount: "90", payer: "shared" }],
  });
  assert.equal(r.sharedJobCosts, 90);
  // ricavo - condivisi - partnerDue - ownerDue ≈ 0
  assert.ok(Math.abs(r.reconciliationGap) <= 0.02, `gap ${r.reconciliationGap}`);
});

test("computeProfitSplitScenario: quota collaboratore clampata 0..100 e complemento titolare", () => {
  const r = computeProfitSplitScenario({ revenue: "1000", partnerSharePct: "150", partnerDays: "0" });
  assert.equal(r.partnerSharePct, 100);
  assert.equal(r.ownerSharePct, 0);
  assert.equal(r.partnerProfitShare, 1000);
  assert.equal(r.ownerProfitShare, 0);
});

test("computeProfitSplitScenario: commessa in perdita → utile divisibile negativo", () => {
  const r = computeProfitSplitScenario({
    revenue: "500",
    partnerDailyFixed: "100",
    partnerDays: "8",
    partnerSharePct: "50",
  });
  assert.ok(r.divisibleProfit < 0, `divisibleProfit ${r.divisibleProfit}`);
});

test("computeProfitSplitScenario: importi italiani con migliaia (1.234,56) letti correttamente", () => {
  const r = computeProfitSplitScenario({ revenue: "1.234,56", partnerDays: "0", partnerSharePct: "0" });
  assert.equal(r.revenue, 1234.56);
  assert.equal(r.ownerProfitShare, 1234.56);
});

test("normalizeProfitSplitExpenseLines: array vuoto → una riga di default owner", () => {
  const lines = normalizeProfitSplitExpenseLines([], {});
  assert.equal(lines.length, 1);
  assert.equal(lines[0].payer, "owner");
});

test("addProfitSplitExpenseLine: riempie la riga vuota invece di accodarne una nuova", () => {
  const lines = normalizeProfitSplitExpenseLines([], {});
  const next = addProfitSplitExpenseLine(lines, { label: "Benzina" });
  assert.equal(next.length, 1);
  assert.equal(next[0].label, "Benzina");
});
