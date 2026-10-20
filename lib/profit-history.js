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
