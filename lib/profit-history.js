// Dates refer to the saved account, not to a payment or installation date.
export function filterProfitHistory(entries, { partner = "", query = "", from = "", to = "" } = {}) {
  const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const search = normalize(query).trim();
  return entries.filter(entry => {
    const date = String(entry.savedAt || "").slice(0, 10);
    return (!partner || entry.partnerName === partner)
      && (!from || (date && date >= from))
      && (!to || (date && date <= to))
      && (!search || normalize([entry.jobLabel, entry.partnerName, entry.order?.orderNumber, entry.order?.firstName, entry.order?.lastName, entry.order?.city].join(" ")).includes(search));
  });
}

export function profitPaymentBalance(due, settlement = {}) {
  const paid = Math.max(0, Number(settlement?.amount) || 0);
  const remaining = Math.round((Number(due || 0) - paid) * 100) / 100;
  return { paid, remaining, settled: remaining <= 0 && paid > 0 };
}
