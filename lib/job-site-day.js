// Cantiere di oggi (novembre 2026). Dai passaggi registrati dalla squadra
// capisce a che punto è la giornata, qual è il prossimo passo e quanto è durato
// ogni tratto. Una posa può durare più giorni: ogni giorno ha la sua sequenza
// Partenza → Arrivo → Inizio lavori → Fine giornata/Fine posa → Rientro.
import { installationDays } from "./install-days.js?v=20261105-presenze-offline-5";

export const DAY_STEPS = ["departure", "arrival", "work_start", "end", "return"];
const END_TYPES = new Set(["day_end", "work_end"]);

const ROME_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" });

export function romeDateKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : ROME_DAY.format(date);
}

export function stepOfEvent(type) {
  return END_TYPES.has(type) ? "end" : type;
}

function byTime(a, b) {
  return String(a.occurredAt || "").localeCompare(String(b.occurredAt || ""));
}

export function minutesBetween(from, to) {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round((b - a) / 60000);
}

// "42 min", "8 h", "8 h 10 min".
export function formatMinutes(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const metaKm = (event) => {
  const km = Number(event?.meta?.km);
  return Number.isFinite(km) && km > 0 ? km : null;
};

// Riepilogo di una giornata a partire dai suoi eventi (già in ordine).
export function summarizeDay(dayEvents = []) {
  const first = (step) => dayEvents.find((e) => stepOfEvent(e.eventType) === step) || null;
  const departure = first("departure");
  const arrival = first("arrival");
  const workStart = first("work_start");
  const end = first("end");
  const back = first("return");
  const kmOut = metaKm(departure);
  const kmBack = metaKm(back);
  const sameVan = departure && back && (!back.meta?.vanId || back.meta.vanId === departure.meta?.vanId);
  const loaded = Array.isArray(departure?.meta?.tools) ? departure.meta.tools : [];
  const returned = Array.isArray(back?.meta?.tools) ? back.meta.tools : null;
  return {
    travelMinutes: departure && arrival ? minutesBetween(departure.occurredAt, arrival.occurredAt) : null,
    workMinutes: workStart && end ? minutesBetween(workStart.occurredAt, end.occurredAt) : null,
    backMinutes: end && back ? minutesBetween(end.occurredAt, back.occurredAt) : null,
    km: sameVan && kmOut != null && kmBack != null && kmBack >= kmOut ? kmBack - kmOut : null,
    vanId: departure?.meta?.vanId || back?.meta?.vanId || "",
    toolsLoaded: loaded,
    toolsMissing: back && returned ? loaded.filter((id) => !returned.includes(id)) : [],
    endType: end?.eventType || "",
    closed: Boolean(back),
  };
}

// Stato della giornata di oggi per una posa.
// events: tutti gli eventi della posa (quelli annullati vengono ignorati);
// todayKey: "YYYY-MM-DD" del giorno di oggi a Roma.
export function siteDayState(events = [], install = {}, todayKey = romeDateKey(new Date())) {
  const live = events.filter((e) => e && !e.voidedAt).slice().sort(byTime);
  const days = installationDays(install);
  const dayIndex = days.indexOf(todayKey);
  const lastPlanned = days[days.length - 1] || "";
  const today = live.filter((e) => romeDateKey(e.occurredAt) === todayKey && DAY_STEPS.includes(stepOfEvent(e.eventType)));
  let reached = -1;
  for (const event of today) reached = Math.max(reached, DAY_STEPS.indexOf(stepOfEvent(event.eventType)));
  const nextStep = DAY_STEPS[reached + 1] || "";
  // Ultimo giorno previsto (o oltre, o posa senza data): il pulsante finale è «Fine posa».
  const lastDay = !days.length || todayKey >= lastPlanned;
  const finishEvent = live.filter((e) => e.eventType === "work_end").pop() || null;
  const finishedBefore = Boolean(finishEvent && romeDateKey(finishEvent.occurredAt) < todayKey);
  const workedDays = [...new Set(live.filter((e) => e.eventType === "work_start").map((e) => romeDateKey(e.occurredAt)))].sort();
  let dayLabel = "";
  if (dayIndex >= 0 && days.length > 1) dayLabel = `day:${dayIndex + 1}/${days.length}`;
  else if (days.length && todayKey < days[0]) dayLabel = "early";
  else if (days.length && todayKey > lastPlanned) dayLabel = "extra";
  return {
    todayKey,
    days,
    dayIndex,
    dayCount: days.length,
    dayLabel,
    lastDay,
    today,
    nextStep,
    nextType: nextStep === "end" ? (lastDay ? "work_end" : "day_end") : nextStep,
    altEndType: nextStep === "end" ? (lastDay ? "day_end" : "work_end") : "",
    lastToday: today[today.length - 1] || null,
    summary: summarizeDay(today),
    finishedBefore,
    finishedAt: finishEvent?.occurredAt || "",
    workedDays,
  };
}

// Diario di tutta la posa, giorno per giorno (dal più recente).
export function diaryByDay(events = []) {
  const live = events.filter((e) => e && !e.voidedAt).slice().sort(byTime);
  const groups = new Map();
  for (const event of live) {
    const key = romeDateKey(event.occurredAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, dayEvents]) => ({ dateKey, events: dayEvents, summary: summarizeDay(dayEvents) }));
}
