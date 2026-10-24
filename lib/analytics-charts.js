// Grafici della pagina Analisi (ottobre 2026): colonne per mese, barre
// orizzontali e linea, come stringhe HTML/SVG. Segni sottili (colonne max
// 24 px con la cima arrotondata, linea 2 px), griglia leggera, e su ogni
// colonna/barra un data-tip che app.js mostra al passaggio del mouse o col
// tasto Tab. Ogni grafico ha sotto la tabella con gli stessi numeri.

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const MONTHS_IT = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthShort(month, lang = "it", withYear = false) {
  const [year, m] = String(month).split("-").map(Number);
  const name = (lang === "it" ? MONTHS_IT : MONTHS_EN)[m - 1] || "";
  return withYear ? `${name} ${String(year).slice(2)}` : name;
}

// Tacche dell'asse a numeri tondi (1, 2, 2,5, 5 × 10^n); per i conteggi
// (integer) solo passi interi, niente "2,5 richieste".
export function niceTicks(max, count = 4, integer = false) {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const factors = integer ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10];
  const step = Math.max(integer ? 1 : 0, factors.map((f) => f * power).find((s) => s >= raw) || 10 * power);
  const ticks = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100);
  if (ticks[ticks.length - 1] < max) ticks.push(Math.round((ticks[ticks.length - 1] + step) * 100) / 100);
  return ticks;
}

export function compactNumber(value) {
  const v = Number(value) || 0;
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toLocaleString("it-IT", { maximumFractionDigits: 1 })}M`;
  if (abs >= 1e3) return `${(v / 1e3).toLocaleString("it-IT", { maximumFractionDigits: abs >= 1e4 ? 0 : 1 })}k`;
  return v.toLocaleString("it-IT", { maximumFractionDigits: abs < 10 ? 1 : 0 });
}

const tipAttr = (title, rows) => `data-tip="${esc(JSON.stringify({ title, rows }))}" tabindex="0"`;

// Colonna con la cima arrotondata di 4 px e la base dritta sull'asse.
function columnPath(x, y, w, h) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * Colonne per mese, una o due serie affiancate (stessa unità, un solo asse).
 * series: [{ label, color, values }]; extra(i) → righe in più nel tooltip.
 */
export function columnChart({ months, series, width = 640, height = 220, lang = "it", format = (v) => v, extra = () => [], ariaLabel = "", integer = false }) {
  const pad = { top: 12, right: 8, bottom: 26, left: 44 };
  const plotW = Math.max(120, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;
  const max = Math.max(0, ...series.flatMap((s) => s.values));
  const ticks = niceTicks(max, 4, integer);
  const top = ticks[ticks.length - 1] || 1;
  const band = plotW / Math.max(1, months.length);
  const gap = 2;
  const barW = Math.max(3, Math.min(24, (band * 0.7 - gap * (series.length - 1)) / series.length));
  const groupW = barW * series.length + gap * (series.length - 1);
  const yOf = (v) => pad.top + plotH - (Math.max(0, v) / top) * plotH;
  const grid = ticks.map((t) => `<line x1="${pad.left}" x2="${width - pad.right}" y1="${yOf(t)}" y2="${yOf(t)}" class="an-grid"/><text x="${pad.left - 6}" y="${yOf(t) + 4}" class="an-axis" text-anchor="end">${esc(compactNumber(t))}</text>`).join("");
  const showEvery = band < 34 ? 2 : 1;
  const cols = months.map((month, i) => {
    const x0 = pad.left + band * i + (band - groupW) / 2;
    const bars = series.map((s, k) => {
      const v = Number(s.values[i]) || 0;
      const y = yOf(v);
      return `<path d="${columnPath(x0 + k * (barW + gap), y, barW, pad.top + plotH - y)}" fill="${s.color}" class="an-mark"/>`;
    }).join("");
    const first = i === 0 || month.endsWith("-01");
    const label = i % showEvery === 0 || first ? `<text x="${pad.left + band * i + band / 2}" y="${height - 8}" class="an-axis" text-anchor="middle">${esc(monthShort(month, lang, first))}</text>` : "";
    const tip = tipAttr(monthShort(month, lang, true), [...series.map((s) => [s.label, format(s.values[i]), s.color]), ...extra(i)]);
    return `<g class="an-col">${bars}<rect x="${pad.left + band * i}" y="${pad.top}" width="${band}" height="${plotH}" class="an-hit" ${tip}/>${label}</g>`;
  }).join("");
  return `<svg class="an-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(ariaLabel)}">${grid}<line x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + plotH}" y2="${pad.top + plotH}" class="an-base"/>${cols}</svg>`;
}

/** Linea per i valori giorno per giorno (storico del magazzino). */
export function lineChart({ points, width = 640, height = 180, color, format = (v) => v, ariaLabel = "", dateLabel = (d) => d }) {
  const pad = { top: 12, right: 12, bottom: 24, left: 44 };
  const plotW = Math.max(120, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;
  const values = points.map((p) => Number(p.value) || 0);
  const ticks = niceTicks(Math.max(0, ...values));
  const top = ticks[ticks.length - 1] || 1;
  const xOf = (i) => pad.left + (points.length > 1 ? (plotW * i) / (points.length - 1) : plotW / 2);
  const yOf = (v) => pad.top + plotH - (Math.max(0, v) / top) * plotH;
  const grid = ticks.map((t) => `<line x1="${pad.left}" x2="${width - pad.right}" y1="${yOf(t)}" y2="${yOf(t)}" class="an-grid"/><text x="${pad.left - 6}" y="${yOf(t) + 4}" class="an-axis" text-anchor="end">${esc(compactNumber(t))}</text>`).join("");
  const path = points.map((p, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)},${yOf(p.value).toFixed(1)}`).join("");
  const last = points.length - 1;
  const hitW = points.length > 1 ? plotW / (points.length - 1) : plotW;
  const hits = points.map((p, i) => `<rect x="${xOf(i) - hitW / 2}" y="${pad.top}" width="${hitW}" height="${plotH}" class="an-hit" ${tipAttr(dateLabel(p.date), [["", format(p.value), color]])}/>`).join("");
  const labels = points.length ? `<text x="${xOf(0)}" y="${height - 6}" class="an-axis" text-anchor="${points.length > 1 ? "start" : "middle"}">${esc(dateLabel(points[0].date))}</text>${last > 0 ? `<text x="${xOf(last)}" y="${height - 6}" class="an-axis" text-anchor="end">${esc(dateLabel(points[last].date))}</text>` : ""}` : "";
  return `<svg class="an-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(ariaLabel)}">${grid}
    ${points.length > 1 ? `<path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>` : ""}
    ${points.length ? `<circle cx="${xOf(last)}" cy="${yOf(points[last].value)}" r="4" fill="${color}" class="an-dot"/>` : ""}${labels}${hits}</svg>`;
}

/**
 * Barre orizzontali (classifiche, imbuto): etichetta, barra, valore.
 * items: [{ label, value, valueLabel, note, tip }]
 */
export function barList({ items, color, max = null }) {
  const top = max ?? Math.max(0, ...items.map((item) => Number(item.value) || 0));
  return `<div class="an-bars">${items.map((item) => {
    const pct = top > 0 ? Math.max(0, Math.min(100, ((Number(item.value) || 0) / top) * 100)) : 0;
    return `<div class="an-bar-row" ${tipAttr(item.label, item.tip || [["", item.valueLabel, color]])}>
      <span class="an-bar-label">${esc(item.label)}${item.note ? `<small>${esc(item.note)}</small>` : ""}</span>
      <span class="an-bar-track"><span class="an-bar-fill" style="width:${pct.toFixed(1)}%;background:${color}"></span></span>
      <strong class="an-bar-value">${esc(item.valueLabel)}</strong>
    </div>`;
  }).join("")}</div>`;
}

/** Tabella con gli stessi numeri del grafico (si apre sotto). */
export function dataTable({ summary, head, rows }) {
  return `<details class="an-table"><summary>${esc(summary)}</summary><div class="an-table-wrap"><table><thead><tr>${head.map((h, i) => `<th${i ? ' class="an-num"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => `<td${i ? ' class="an-num"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}
