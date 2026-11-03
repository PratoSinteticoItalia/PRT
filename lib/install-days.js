// Pose su più giorni (novembre 2026). Una posa ha il primo giorno
// (installDate) e, se dura di più, l'ultimo (installEndDate, vuoto = un giorno
// solo). La domenica non si lavora: dentro l'intervallo non conta, a meno che
// sia proprio il giorno scelto per iniziare.
const KEY = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_INSTALL_DAYS = 14;
const MONTHS_IT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toUtc = (key) => new Date(`${key}T12:00:00Z`);

export function isDateKey(value) {
  return KEY.test(String(value || ""));
}

export function addDaysToKey(key, days) {
  const date = toUtc(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// 0 = domenica … 6 = sabato.
export function weekdayOfKey(key) {
  return toUtc(key).getUTCDay();
}

// Ultimo giorno valido: dopo il primo, altrimenti nessuno (posa di un giorno).
export function normalizeInstallEndDate(start, end) {
  const s = String(start || "").slice(0, 10);
  const e = String(end || "").slice(0, 10);
  return isDateKey(s) && isDateKey(e) && e > s ? e : "";
}

export function installationDays(install = {}) {
  const start = String(install?.installDate || "").slice(0, 10);
  if (!isDateKey(start)) return [];
  const end = normalizeInstallEndDate(start, install?.installEndDate) || start;
  const days = [];
  for (let key = start; key <= end && days.length < MAX_INSTALL_DAYS; key = addDaysToKey(key, 1)) {
    if (key === start || weekdayOfKey(key) !== 0) days.push(key);
  }
  return days;
}

export function lastInstallationDay(install = {}) {
  const days = installationDays(install);
  return days[days.length - 1] || "";
}

// Trascinando una posa di più giorni su un altro giorno resta lunga uguale.
export function shiftInstallationDays(install = {}, newStart = "") {
  if (!isDateKey(newStart)) return { installDate: "", installEndDate: "" };
  const count = Math.max(1, installationDays(install).length);
  let end = newStart;
  let counted = 1;
  while (counted < count) {
    end = addDaysToKey(end, 1);
    if (weekdayOfKey(end) !== 0) counted += 1;
  }
  return { installDate: newStart, installEndDate: end > newStart ? end : "" };
}

// "4 nov", "4–6 nov", "30 ott – 2 nov".
export function formatInstallRange(install = {}, lang = "it") {
  const days = installationDays(install);
  if (!days.length) return "";
  const months = lang === "it" ? MONTHS_IT : MONTHS_EN;
  const part = (key) => ({ day: Number(key.slice(8, 10)), month: months[Number(key.slice(5, 7)) - 1] });
  const first = part(days[0]);
  if (days.length === 1) return `${first.day} ${first.month}`;
  const last = part(days[days.length - 1]);
  return first.month === last.month
    ? `${first.day}–${last.day} ${last.month}`
    : `${first.day} ${first.month} – ${last.day} ${last.month}`;
}
