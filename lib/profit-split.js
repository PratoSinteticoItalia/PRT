// Matematica del riparto utili pose (conti pose) — unica copia, pura e testata
// (test/profit-split.test.js). Usata sia dal client (app.js) sia dal server
// (lib/profit-split-pdf.js + endpoint) così la formula del documento ufficiale
// coincide al centesimo con quella mostrata a schermo. Vedi lib/order-money.js
// per la stessa filosofia sulla matematica denaro.

import { toNumber } from "./order-money.js";

export function getDefaultProfitSplitExpenseLine(overrides = {}) {
  const payer = ["owner", "partner", "shared"].includes(String(overrides.payer || "").trim())
    ? String(overrides.payer || "").trim()
    : "owner";
  return {
    id: String(overrides.id || crypto.randomUUID()),
    label: String(overrides.label ?? ""),
    amount: String(overrides.amount ?? ""),
    payer,
  };
}

export function getProfitSplitLegacyExpenseLines(input = {}) {
  const lines = [];
  const legacyRows = [
    { amount: input.ownerPaidExpenses, payer: "owner", label: "Spesa pagata da te" },
    { amount: input.partnerPaidExpenses, payer: "partner", label: "Spesa pagata dal collaboratore" },
    { amount: input.sharedJobCosts, payer: "shared", label: "Costo condiviso" },
  ];
  legacyRows.forEach((row) => {
    const rawAmount = String(row.amount ?? "").trim();
    if (!rawAmount || Math.abs(toNumber(rawAmount || 0)) <= 0) return;
    lines.push(getDefaultProfitSplitExpenseLine(row));
  });
  return lines;
}

export function normalizeProfitSplitExpenseLines(lines = [], legacyInput = {}) {
  const sourceLines = Array.isArray(lines) && lines.length
    ? lines
    : getProfitSplitLegacyExpenseLines(legacyInput);
  const normalizedLines = sourceLines.map((line) => getDefaultProfitSplitExpenseLine(line));
  return normalizedLines.length ? normalizedLines : [getDefaultProfitSplitExpenseLine()];
}

export function isProfitSplitExpenseLineBlank(line = {}) {
  const label = String(line.label || "").trim();
  const amount = Number(toNumber(line.amount || 0).toFixed(2));
  return !label && Math.abs(amount) <= 0;
}

export function addProfitSplitExpenseLine(lines = [], overrides = {}) {
  const normalizedLines = normalizeProfitSplitExpenseLines(lines);
  const nextLine = getDefaultProfitSplitExpenseLine(overrides);
  const blankIndex = normalizedLines.findLastIndex
    ? normalizedLines.findLastIndex((line) => isProfitSplitExpenseLineBlank(line))
    : (() => {
        for (let index = normalizedLines.length - 1; index >= 0; index -= 1) {
          if (isProfitSplitExpenseLineBlank(normalizedLines[index])) return index;
        }
        return -1;
      })();
  if (blankIndex >= 0) {
    normalizedLines[blankIndex] = {
      ...normalizedLines[blankIndex],
      ...nextLine,
      id: normalizedLines[blankIndex].id,
      amount: overrides.amount ?? normalizedLines[blankIndex].amount,
    };
    return normalizedLines;
  }
  return [...normalizedLines, nextLine];
}

// Calcola lo scenario completo del riparto. `lang` serve solo per le etichette
// di fallback delle spese senza nome; i numeri sono indipendenti dalla lingua.
export function computeProfitSplitScenario(draft = {}, lang = "it") {
  const partnerName = String(draft.partnerName || "").trim();
  const revenue = Number(toNumber(draft.revenue || 0).toFixed(2));
  const partnerDailyFixed = Number(toNumber(draft.partnerDailyFixed || 0).toFixed(2));
  const partnerDays = Math.max(0, Number(toNumber(draft.partnerDays || 0).toFixed(2)));
  const partnerSharePct = Math.min(100, Math.max(0, Number(toNumber(draft.partnerSharePct || 50).toFixed(2))));
  const ownerSharePct = Number((100 - partnerSharePct).toFixed(2));
  const expenseLines = normalizeProfitSplitExpenseLines(draft.expenseLines, draft)
    .map((line) => {
      const payer = ["owner", "partner", "shared"].includes(String(line.payer || "").trim())
        ? String(line.payer || "").trim()
        : "owner";
      const label = String(line.label || "").trim();
      const amountValue = Number(toNumber(line.amount || 0).toFixed(2));
      const fallbackLabel = payer === "partner"
        ? (lang === "it" ? "Spesa collaboratore" : "Partner expense")
        : payer === "shared"
          ? (lang === "it" ? "Costo condiviso" : "Shared cost")
          : (lang === "it" ? "Spesa tua" : "Your expense");
      const isFilled = Boolean(label) || Math.abs(amountValue) > 0;
      return {
        ...line,
        payer,
        label,
        amountValue,
        displayLabel: label || fallbackLabel,
        isFilled,
      };
    });
  const ownerExpenseLines = expenseLines.filter((line) => line.payer === "owner" && line.isFilled);
  const partnerExpenseLines = expenseLines.filter((line) => line.payer === "partner" && line.isFilled);
  const sharedExpenseLines = expenseLines.filter((line) => line.payer === "shared" && line.isFilled);
  const sumExpenseLines = (lines) => Number(lines.reduce((sum, line) => sum + line.amountValue, 0).toFixed(2));
  const ownerPaidExpenses = sumExpenseLines(ownerExpenseLines);
  const partnerPaidExpenses = sumExpenseLines(partnerExpenseLines);
  const sharedJobCosts = sumExpenseLines(sharedExpenseLines);
  const ownerRecovery = Number(toNumber(draft.ownerRecovery || 0).toFixed(2));
  const partnerRecovery = Number(toNumber(draft.partnerRecovery || 0).toFixed(2));
  const partnerFixedTotal = Number((partnerDailyFixed * partnerDays).toFixed(2));
  const deductibleCosts = Number((
    ownerPaidExpenses
    + partnerPaidExpenses
    + sharedJobCosts
    + ownerRecovery
    + partnerRecovery
    + partnerFixedTotal
  ).toFixed(2));
  const divisibleProfit = Number((revenue - deductibleCosts).toFixed(2));
  const partnerProfitShare = Number(((divisibleProfit * partnerSharePct) / 100).toFixed(2));
  const ownerProfitShare = Number((divisibleProfit - partnerProfitShare).toFixed(2));
  const partnerDue = Number((partnerPaidExpenses + partnerRecovery + partnerFixedTotal + partnerProfitShare).toFixed(2));
  const ownerDue = Number((ownerPaidExpenses + ownerRecovery + ownerProfitShare).toFixed(2));
  const reconciliationGap = Number((revenue - sharedJobCosts - partnerDue - ownerDue).toFixed(2));

  return {
    partnerName,
    expenseLines,
    ownerExpenseLines,
    partnerExpenseLines,
    sharedExpenseLines,
    expenseLineCount: expenseLines.filter((line) => line.isFilled).length,
    revenue,
    partnerDailyFixed,
    partnerDays,
    partnerSharePct,
    ownerSharePct,
    ownerPaidExpenses,
    partnerPaidExpenses,
    sharedJobCosts,
    ownerRecovery,
    partnerRecovery,
    partnerFixedTotal,
    deductibleCosts,
    divisibleProfit,
    partnerProfitShare,
    ownerProfitShare,
    partnerDue,
    ownerDue,
    reconciliationGap,
  };
}
