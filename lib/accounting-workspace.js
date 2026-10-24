// Contabilità gestionale (solo ufficio): registro persistito lato server
// (/api/accounting/register, lib/accounting-register.js) + ordini reali.
// Layout e percorso ricalcano la simulazione concordata (tmp/contabilita-demo.html).
import { receiptSummary, receiptDailySummary, receiptMethodKey, receiptMethodLabel, RECEIPT_METHODS, registerCSV } from "./accounting-register.js?v=20261025-registra-tutti";
import { getCollectedAmount, getOpenBalance, getOrderGrossTotal } from "./order-money.js?v=20261025-registra-tutti";
import {
  orderDate, orderDisplayNumber, orderCustomerName, orderPaymentState, orderShippingLabel, orderDocumentState,
  registeredCentsByOrder, pendingOrderIncome, suggestEntryFromPending, entryIssue, totalsByMethod,
} from "./accounting-workspace-data.js?v=20261025-registra-tutti";

const PAGES = {
  overview: ["Panoramica", "Il mese a colpo d’occhio: quanto è entrato, quanto è uscito, cosa manca da sistemare."],
  orders: ["Ordini e incassi", "Ogni ordine: quanto ha pagato il cliente, cosa resta da incassare, se va fatturato. Clicca un ordine per aprirne la scheda."],
  ledger: ["Prima nota", "Il registro dei soldi del mese: ogni entrata e uscita, con il suo documento."],
  receipts: ["Corrispettivi", "Le vendite senza fattura giorno per giorno: totale della giornata e importo per metodo di pagamento."],
  review: ["Da verificare", "Cosa manca prima di chiudere il mese."],
  close: ["Chiusura ed export", "A fine mese: blocchi il mese e scarichi i file per il commercialista."],
};
// La vecchia scheda "Pagamenti ordini" è confluita in "Ordini e incassi": di
// #accounting-legacy (index.html) resta solo la scheda dell'ordine, che si apre
// a destra cliccando un ordine. Chi aveva salvato quella scheda torna qui.
const TAB_ORDER = Object.keys(PAGES);
const LEGACY_PANES = { payments: "orders" };
const PANE_STORAGE_KEY = "psi-accounting-pane";
const DOCS = { pending: "Da classificare", receipt: "Corrispettivo", invoice: "Fattura", other: "Altro documento" };
const TYPES = { income: "Entrata", expense: "Uscita", refund: "Rimborso cliente" };
const RATES = [22, 10, 5, 4, 0];
// Nomi che i corrispettivi riconoscono da soli (vedi receiptMethodKey).
const METHODS = ["Carta di credito", "PayPal", "Bonifico bancario", "HeyLight", "Scalapay", "Contanti", "Assegno"];
const PAGE_SIZE = 50;

const ctx = {
  userKey: "", data: null, loading: false, error: "", busy: false,
  pane: readStoredPane(), month: new Date().toLocaleDateString("sv-SE").slice(0, 7),
  orders: [], toast: null, onPaneChange: null,
  ledgerQuery: "", ledgerType: "all", orderQuery: "", orderFilter: "all", orderScope: "month", orderLimit: PAGE_SIZE, pendingLimit: 30,
  exportOrders: null,
};
let pendingCache = [];

function readStoredPane() {
  try { const v = LEGACY_PANES[localStorage.getItem(PANE_STORAGE_KEY)] || localStorage.getItem(PANE_STORAGE_KEY); if (TAB_ORDER.includes(v)) return v; } catch {}
  return "overview";
}
function setPane(pane) {
  if (!TAB_ORDER.includes(pane)) return;
  ctx.pane = pane;
  ctx.orderLimit = PAGE_SIZE;
  try { localStorage.setItem(PANE_STORAGE_KEY, pane); } catch {}
  draw();
}

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const eur = (c) => ((Number(c) || 0) / 100).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const eurFromEuros = (n) => eur(Math.round((Number(n) || 0) * 100));
const fmtDate = (iso) => (/^\d{4}-\d{2}-\d{2}/.test(String(iso)) ? new Date(`${String(iso).slice(0, 10)}T12:00:00`).toLocaleDateString("it-IT") : "—");
const monthLabel = (m) => new Date(`${m}-15T12:00:00`).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
const toast = (msg, kind = "success") => { try { ctx.toast?.(msg, kind); } catch {} };

async function api(body) {
  const r = await fetch("/api/accounting/register", {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let d = {};
  try { d = await r.json(); } catch {}
  if (r.status === 401) throw new Error("Sessione scaduta: ricarica la pagina e accedi di nuovo.");
  if (r.status === 403) throw new Error("La contabilità gestionale è riservata all’ufficio.");
  if (!r.ok) throw new Error(d.error || "Operazione non riuscita");
  return d;
}
async function load() {
  ctx.loading = true;
  try { ctx.data = await api(); ctx.error = ""; } catch (e) { ctx.error = e.message; }
  finally { ctx.loading = false; draw(); }
}
async function save(command, okMessage) {
  if (ctx.busy) return false;
  ctx.busy = true;
  let ok = false;
  try {
    ctx.data = await api({ ...command, revision: ctx.data.revision });
    ctx.error = "";
    ok = true;
    if (okMessage) toast(okMessage);
  } catch (e) {
    ctx.error = e.message;
  } finally {
    ctx.busy = false;
    draw();
  }
  return ok;
}

const isClosed = () => Boolean(ctx.data?.periods?.[ctx.month]?.closed);
function monthEntries() {
  const period = ctx.data?.periods?.[ctx.month];
  if (period?.closed) return period.entries || [];
  return (ctx.data?.entries || []).filter((e) => String(e.fiscalDate || "").startsWith(ctx.month));
}
function monthPayouts() {
  const period = ctx.data?.periods?.[ctx.month];
  if (period?.closed) return period.payouts || [];
  return (ctx.data?.payouts || []).filter((p) => String(p.date || "").startsWith(ctx.month));
}
const findOrder = (id) => ctx.orders.find((o) => o.id === id);
const orderRef = (id) => { const o = findOrder(id); return o ? orderDisplayNumber(o) : "ordine rimosso"; };

function pill(text, tone = "") { return `<span class="acw-pill ${tone}">${esc(text)}</span>`; }
function cards(items) {
  return `<div class="acw-cards">${items.map(([label, value, sub, tone]) => `<div class="acw-card ${tone || ""}"><small>${esc(label)}</small><div class="acw-number">${esc(value)}</div><p>${esc(sub)}</p></div>`).join("")}</div>`;
}
function line(left, right, extra = "") { return `<div class="acw-line ${extra}"><span>${left}</span><b>${right}</b></div>`; }

function entriesTable(items, emptyText, { compact = false } = {}) {
  const rows = items.map((e) => `<tr>
    <td>${fmtDate(e.date)}<small>${esc(e.label)}${compact && e.method ? ` · ${esc(e.method)}` : ""}</small></td>
    ${compact ? "" : `<td>${esc(e.method || "—")}</td>`}
    <td>${esc(DOCS[e.document] || e.document)}${e.vatRate != null ? `<small>IVA ${e.vatRate}%</small>` : ""}</td>
    <td class="acw-right acw-amount ${e.type === "income" ? "" : "is-out"}">${e.type === "income" ? "+" : "−"}${eur(e.cents)}</td>
    <td><button type="button" class="acw-link" data-entry="${esc(e.id)}">${pill(`${e.verified ? "Verificato" : "Da verificare"} ↗`, e.verified ? "" : "warn")}</button></td>
  </tr>`).join("");
  return `<div class="acw-table-wrap"><table><thead><tr><th>Data / operazione</th>${compact ? "" : "<th>Metodo</th>"}<th>Documento</th><th class="acw-right">Importo</th><th>Verifica</th></tr></thead><tbody>${rows || `<tr><td colspan="${compact ? 4 : 5}" class="acw-empty">${esc(emptyText)}</td></tr>`}</tbody></table></div>`;
}

function renderOverview(s) {
  const latest = [...s.list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const total = s.list.length + s.pending.length;
  const progress = total ? Math.round((100 * s.verified) / total) : 0;
  const methods = totalsByMethod(s.list, receiptMethodLabel);
  const emptyLatest = `<div class="acw-empty">Nessun movimento in prima nota per ${esc(monthLabel(ctx.month))}.${s.pending.length ? `<br><button type="button" class="acw-btn is-primary" data-go="review">Registra gli incassi degli ordini (${s.pending.length}) →</button>` : ""}</div>`;
  return `${cards([
    ["Incassi registrati", eur(s.income), "Entrate in prima nota nel mese"],
    ["Uscite registrate", eur(s.out), "Pagamenti e rimborsi"],
    ["Saldo dei movimenti", eur(s.income - s.out), "Entrate meno uscite · non è l’utile"],
    ["Da verificare", String(s.issues), `${s.unverified.length} movimenti · ${s.pending.length} incassi da registrare`, s.issues ? "is-warn" : ""],
  ])}
  <div class="acw-grid">
    <section class="acw-panel"><div class="acw-panel-head"><h3>Ultimi movimenti</h3><button type="button" class="acw-link" data-go="ledger">Tutta la prima nota →</button></div>
      ${latest.length ? entriesTable(latest, "", { compact: true }) : emptyLatest}</section>
    <div>
      <section class="acw-panel"><div class="acw-eyebrow">Verso la chiusura</div>
        <h3>${s.issues ? (s.issues === 1 ? "Manca 1 verifica" : `Mancano ${s.issues} verifiche`) : s.list.length ? "Il mese è pronto" : "Nessun movimento da chiudere"}</h3>
        <p>${s.list.length ? `${s.verified} movimenti verificati su ${s.list.length}` : "Nessun movimento in prima nota"}${s.pending.length ? ` · ${s.pending.length} incassi degli ordini da registrare` : ""}</p>
        <div class="acw-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"><span style="width:${progress}%"></span></div>
        <button type="button" class="acw-btn is-primary" data-go="${s.issues ? "review" : "close"}">${s.issues ? "Risolvi le anomalie" : "Prepara il mese"} →</button>
      </section>
      <section class="acw-panel"><h3>Incassi per metodo</h3>
        ${methods.length ? methods.map(([m, c]) => line(esc(m), eur(c))).join("") : `<p>Nessun incasso registrato nel mese.</p>`}
      </section>
    </div>
  </div>`;
}

// "Tutti i mesi" serve per i crediti e le fatture rimasti indietro: un saldo
// aperto di agosto non deve sparire guardando ottobre.
function scopedOrders(s) {
  return ctx.orderScope === "all"
    ? [...ctx.orders].sort((a, b) => orderDate(b).localeCompare(orderDate(a)))
    : s.monthOrders;
}
function filteredMonthOrders(s) {
  const q = ctx.orderQuery.trim().toLowerCase();
  const pendingIds = new Set(s.pending.map((p) => p.order.id));
  return scopedOrders(s).filter((o) => {
    if (q && !`${orderDisplayNumber(o)} ${orderCustomerName(o)} ${o.email || ""}`.toLowerCase().includes(q)) return false;
    if (ctx.orderFilter === "open") return getOpenBalance(o) > 0;
    if (ctx.orderFilter === "invoice") return orderDocumentState(o).key === "invoice-open";
    if (ctx.orderFilter === "paid") return getOpenBalance(o) <= 0 && getCollectedAmount(o) > 0;
    if (ctx.orderFilter === "register") return pendingIds.has(o.id);
    return true;
  });
}
const DOC_TONES = { receipt: "subtle", "invoice-open": "warn", "invoice-done": "" };
function ordersRows(s) {
  const registered = registeredCentsByOrder(ctx.data.entries);
  const pendingIds = new Set(s.pending.map((p) => p.order.id));
  const payoutsByOrder = new Map();
  for (const p of ctx.data.payouts) for (const id of p.orderIds) payoutsByOrder.set(id, p);
  const list = filteredMonthOrders(s);
  const rows = list.slice(0, ctx.orderLimit).map((o) => {
    const paid = getCollectedAmount(o);
    const state = orderPaymentState(o);
    const reg = registered.get(o.id) || 0;
    const payout = payoutsByOrder.get(o.id);
    const tone = state.key === "paid" ? "" : state.key === "pending" ? "warn" : "subtle";
    const doc = orderDocumentState(o);
    const open = getOpenBalance(o);
    // La scheda dell'ordine (pagamenti, fattura, note) si apre a destra: è il
    // gestore globale di "select-order" in app.js, come in tutte le liste ordini.
    return `<tr>
      <td><button type="button" class="acw-link acw-order-open" data-action="select-order" data-id="${esc(o.id)}" data-view="accounting"><strong>${esc(orderDisplayNumber(o))}</strong> ${esc(orderCustomerName(o))}</button><small>${fmtDate(orderDate(o))}${paid > 0 && open > 0 ? ` · pagati ${eurFromEuros(paid)}` : ""}</small></td>
      <td class="acw-right acw-amount">${eurFromEuros(getOrderGrossTotal(o))}</td>
      <td class="acw-right ${open > 0 ? "acw-open" : "acw-muted"}">${open > 0 ? eurFromEuros(open) : "—"}</td>
      <td>${pill(state.label, tone)}<small>${esc(orderShippingLabel(o))}</small></td>
      <td>${pill(doc.label, DOC_TONES[doc.key])}</td>
      <td>${pendingIds.has(o.id) && !isClosed() ? `<button type="button" class="acw-btn is-small" data-register-order="${esc(o.id)}">Registra</button>${reg ? `<small>${eur(reg)} già registrati</small>` : ""}` : reg ? `${eur(reg)}<small>registrati</small>` : `<span class="acw-muted">—</span>`}</td>
      <td>${payout ? `<button type="button" class="acw-link" data-payout-detail="${esc(payout.id)}">${esc(payout.reference)} ↗</button><small>Riconciliato</small>` : `<span class="acw-muted">—</span>`}</td>
    </tr>`;
  }).join("");
  const more = list.length > ctx.orderLimit ? `<div class="acw-more"><button type="button" class="acw-btn" data-more-orders>Mostra altri ${Math.min(PAGE_SIZE, list.length - ctx.orderLimit)} di ${list.length - ctx.orderLimit}</button></div>` : "";
  const empty = ctx.orderScope === "all" ? "Nessun ordine con questi filtri." : `Nessun ordine trovato in ${esc(monthLabel(ctx.month))}.`;
  return `<div class="acw-table-wrap"><table><thead><tr><th>Ordine</th><th class="acw-right">Totale</th><th class="acw-right">Da incassare</th><th>Pagamento / spedizione</th><th>Documento</th><th>Prima nota</th><th>Accredito</th></tr></thead><tbody>${rows || `<tr><td colspan="7" class="acw-empty">${empty}</td></tr>`}</tbody></table></div>${more}`;
}
function filteredOrdersCount(s) {
  const n = filteredMonthOrders(s).length;
  return n === 1 ? "1 ordine" : `${n} ordini`;
}
function renderOrders(s) {
  const payouts = monthPayouts();
  const toRegister = s.pending.reduce((t, p) => t + p.cents, 0);
  const invoicesOpen = ctx.orders.filter((o) => orderDocumentState(o).key === "invoice-open").length;
  const openAll = ctx.orders.reduce((t, o) => t + Math.round(Math.max(0, getOpenBalance(o)) * 100), 0);
  return `${cards([
    ["Ordini del mese", String(s.monthOrders.length), `Valore ${eur(s.monthGross)} · pagati ${eur(s.monthPaid)}`],
    ["Da incassare", eur(s.monthOpen), openAll > s.monthOpen ? `Nel mese · ${eur(openAll)} contando tutti i mesi` : "Residuo aperto sugli ordini del mese", s.monthOpen ? "is-warn" : ""],
    ["Fatture da emettere", String(invoicesOpen), invoicesOpen ? "In tutti i mesi · filtro «Da fatturare»" : "Nessuna fattura in sospeso", invoicesOpen ? "is-warn" : ""],
    ["Da registrare", eur(toRegister), `${s.pending.length} incassi del mese non ancora in prima nota`, toRegister ? "is-warn" : ""],
  ])}
  <section class="acw-panel"><div class="acw-panel-head"><div><h3>Ordini</h3><p>Clicca un ordine per aprirne la scheda: pagamenti, acconti e saldi, fattura. «Registra» porta l’incasso in prima nota.</p></div>
    <div class="acw-filters"><input type="search" data-order-query placeholder="Cerca numero, cliente o email…" value="${esc(ctx.orderQuery)}" aria-label="Cerca ordine">
      <select data-order-filter aria-label="Filtra ordini">${[["all", "Tutti"], ["open", "Da incassare"], ["invoice", "Da fatturare"], ["register", "Da registrare in prima nota"], ["paid", "Pagati"]].map(([v, l]) => `<option value="${v}" ${ctx.orderFilter === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <select data-order-scope aria-label="Periodo degli ordini"><option value="month" ${ctx.orderScope === "month" ? "selected" : ""}>Solo ${esc(monthLabel(ctx.month))}</option><option value="all" ${ctx.orderScope === "all" ? "selected" : ""}>Tutti i mesi</option></select>
      ${ctx.exportOrders ? `<button type="button" class="acw-btn" data-export-orders="csv" title="Gli ordini della lista, in un file per Excel">CSV</button><button type="button" class="acw-btn" data-export-orders="pdf" title="Gli ordini della lista, da stampare o salvare in PDF">PDF</button>` : ""}</div></div>
    <p class="acw-list-count" data-orders-count>${filteredOrdersCount(s)}</p>
    <div data-orders-table>${ordersRows(s)}</div>
  </section>
  <div class="acw-grid">
    <section class="acw-panel"><div class="acw-panel-head"><div><h3>Accrediti del circuito</h3><p>Un accredito può raggruppare più ordini. Non è una nuova vendita e non si somma ai ricavi.</p></div><button type="button" class="acw-btn" data-new-payout ${isClosed() ? "disabled" : ""}>+ Riconcilia accredito</button></div>
      ${payouts.length ? payouts.map((p) => `<div class="acw-line"><div><strong>${esc(p.reference)}</strong><p>${fmtDate(p.date)} · ${p.orderIds.length} ordini · netto banca coincidente</p></div><div class="acw-right"><strong>${eur(p.bank)}</strong><br><button type="button" class="acw-link" data-payout-detail="${esc(p.id)}">Dettaglio →</button></div></div>`).join("") : `<p class="acw-empty-inline">Nessun accredito riconciliato in ${esc(monthLabel(ctx.month))}.</p>`}
    </section>
    <section class="acw-panel"><div class="acw-eyebrow">Come leggerlo</div><h3>Pagato, spedito, accreditato</h3>
      ${[["Il cliente ha pagato", "Il credito verso il cliente è chiuso. Acconti e saldi si segnano nella scheda dell’ordine."], ["L’ordine è spedito", "Riguarda la logistica: non vuol dire che sia stato pagato."], ["L’accredito è riconciliato", "Shopify, PayPal o Scalapay ti hanno versato i soldi in banca e la cifra torna."]].map(([t, p], i) => `<div class="acw-step"><b>${i + 1}</b><div><strong>${t}</strong><p>${p}</p></div></div>`).join("")}
    </section>
  </div>`;
}

function filteredLedger(s) {
  const q = ctx.ledgerQuery.trim().toLowerCase();
  return [...s.list]
    .filter((e) => (ctx.ledgerType === "all" || e.type === ctx.ledgerType) && (!q || `${e.label} ${e.reference} ${DOCS[e.document] || ""} ${e.method}`.toLowerCase().includes(q)))
    .sort((a, b) => a.date.localeCompare(b.date));
}
function renderLedger(s) {
  return `<div class="acw-notice"><strong>A cosa serve.</strong> È il registro dei soldi del mese, una riga per ogni entrata o uscita con il suo documento (corrispettivo, fattura…): è quello che il commercialista vuole a fine mese.
    <ul class="acw-explain"><li><strong>Gli incassi degli ordini non si scrivono a mano:</strong> li trovi già compilati in «Da verificare», basta confermarli.</li><li><strong>Le uscite</strong> (fornitori, carburante, rimborsi ai clienti…) le aggiungi con «+ Movimento».</li><li>Un movimento è <strong>verificato</strong> quando hai controllato importo, data, documento e IVA: solo allora entra nei corrispettivi e nella chiusura.</li></ul></div>
  <section class="acw-panel"><div class="acw-filters is-wide">
      <input type="search" data-ledger-query placeholder="Cerca descrizione, riferimento o documento…" value="${esc(ctx.ledgerQuery)}" aria-label="Cerca movimento">
      <select data-ledger-type aria-label="Tipo movimento">${[["all", "Tutti"], ["income", "Entrate"], ["expense", "Uscite"], ["refund", "Rimborsi"]].map(([v, l]) => `<option value="${v}" ${ctx.ledgerType === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <button type="button" class="acw-btn" data-export="ledger">Esporta CSV</button>
    </div>
    <div data-ledger-table>${entriesTable(filteredLedger(s), s.list.length ? "Nessun movimento corrisponde alla ricerca." : `Nessun movimento registrato in ${monthLabel(ctx.month)}.`)}</div></section>`;
}

// Una riga per giornata: totale e quanto per metodo di pagamento. Carta,
// PayPal, bonifico e HeyLight sempre in colonna (anche a zero), gli altri
// metodi solo se usati nel mese.
function receiptMonthTotals(days) {
  return days.reduce((t, d) => {
    t.count += d.count; t.gross += d.gross; t.net += d.net; t.tax += d.tax;
    for (const [k] of RECEIPT_METHODS) t.methods[k] += d.methods[k];
    return t;
  }, { count: 0, gross: 0, net: 0, tax: 0, methods: Object.fromEntries(RECEIPT_METHODS.map(([k]) => [k, 0])) });
}
const ratesLabel = (d) => Object.keys(d.rates).map((r) => `${r}%`).join(" · ");
function renderReceipts(s) {
  const days = receiptDailySummary(s.list);
  const tot = receiptMonthTotals(days);
  const cols = RECEIPT_METHODS.filter(([k], i) => i < 4 || tot.methods[k] !== 0);
  const cell = (c) => (c ? eur(c) : `<span class="acw-muted">—</span>`);
  const hint = s.pending.length && !isClosed()
    ? `<p class="acw-hint">${s.pending.length === 1 ? "1 incasso degli ordini non è" : `${s.pending.length} incassi degli ordini non sono`} ancora in prima nota: entrano qui dopo la registrazione. <button type="button" class="acw-link" data-register-all>Registra tutti →</button></p>`
    : !days.length && s.unverified.length ? `<p class="acw-hint">Ci sono ${s.unverified.length} movimenti ancora da verificare: compariranno qui dopo la verifica. <button type="button" class="acw-link" data-go="review">Vai a Da verificare →</button></p>` : "";
  const otherHint = tot.methods.other ? `<p class="acw-hint">${eur(tot.methods.other)} hanno un metodo di pagamento non riconosciuto: apri il giorno, poi il movimento, e scrivi il metodo (Carta di credito, PayPal, Bonifico bancario…).</p>` : "";
  return `<div class="acw-notice">Qui finiscono le vendite senza fattura, giorno per giorno: il totale della giornata e quanto è arrivato con ogni metodo di pagamento. Contano solo i movimenti verificati in prima nota segnati come corrispettivo; i rimborsi si tolgono, le fatture restano fuori. <strong>È un prospetto da far controllare al commercialista: il programma non invia nulla al fisco.</strong></div>
  <section class="acw-panel"><div class="acw-panel-head"><h3>${esc(monthLabel(ctx.month))}</h3>${pill(`${tot.count} operazioni incluse`)}</div>
    <div class="acw-table-wrap"><table class="acw-receipts"><thead><tr><th>Giorno</th><th class="acw-right">Totale giornata</th>${cols.map(([, l]) => `<th class="acw-right">${esc(l)}</th>`).join("")}<th class="acw-right">Imponibile</th><th class="acw-right">IVA</th></tr></thead><tbody>
    ${days.map((d) => `<tr><td><button type="button" class="acw-link" data-day="${esc(d.date)}">${fmtDate(d.date)} ↗</button><small>${d.count === 1 ? "1 operazione" : `${d.count} operazioni`}</small></td><td class="acw-right acw-amount">${eur(d.gross)}</td>${cols.map(([k]) => `<td class="acw-right">${cell(d.methods[k])}</td>`).join("")}<td class="acw-right">${eur(d.net)}</td><td class="acw-right">${eur(d.tax)}<small>${esc(ratesLabel(d))}</small></td></tr>`).join("") || `<tr><td colspan="${cols.length + 4}" class="acw-empty">Nessun corrispettivo verificato in ${esc(monthLabel(ctx.month))}.</td></tr>`}
    ${days.length ? `<tr class="acw-total"><td><strong>Totale del mese</strong></td><td class="acw-right acw-amount">${eur(tot.gross)}</td>${cols.map(([k]) => `<td class="acw-right">${cell(tot.methods[k])}</td>`).join("")}<td class="acw-right">${eur(tot.net)}</td><td class="acw-right">${eur(tot.tax)}</td></tr>` : ""}
    </tbody></table></div>${otherHint}${hint}
    <div class="acw-actions-row"><button type="button" class="acw-btn" data-export="receipts">Esporta corrispettivi CSV</button></div>
  </section>`;
}

function renderReview(s) {
  if (!s.issues) {
    return `<section class="acw-panel"><div class="acw-empty">✓ Tutte le operazioni di ${esc(monthLabel(ctx.month))} sono registrate e verificate.<br><button type="button" class="acw-btn is-primary" data-go="close">Vai alla chiusura</button></div></section>`;
  }
  const pendingShown = s.pending.slice(0, ctx.pendingLimit);
  return `${s.pending.length ? `<section class="acw-panel"><div class="acw-panel-head"><div><h3>${s.pending.length === 1 ? "1 incasso degli ordini da registrare" : `${s.pending.length} incassi degli ordini da registrare`}</h3><p>Risultano incassati sugli ordini ma non sono in prima nota. La proposta è precompilata: controlla data, documento e aliquota prima di salvare.</p></div>${!isClosed() ? `<button type="button" class="acw-btn is-primary" data-register-all ${ctx.busy ? "disabled" : ""}>Registra tutti (${s.pending.length}) →</button>` : pill("Dagli ordini", "warn")}</div>
    ${pendingShown.map((p, i) => `<div class="acw-line"><div><strong>${esc(orderDisplayNumber(p.order))} · ${esc(orderCustomerName(p.order))}</strong><p>${fmtDate(p.date)} · ${esc(p.method)} · ${p.dateSource === "order" ? "data ordine, da confermare" : "data del pagamento registrato"}</p></div><div class="acw-line-actions"><b>${eur(p.cents)}</b><button type="button" class="acw-btn" data-suggest="${i}" ${isClosed() ? "disabled" : ""}>Registra →</button></div></div>`).join("")}
    ${s.pending.length > ctx.pendingLimit ? `<div class="acw-more"><button type="button" class="acw-btn" data-more-pending>Mostra altri ${Math.min(30, s.pending.length - ctx.pendingLimit)}</button></div>` : ""}
  </section>` : ""}
  ${s.unverified.length ? `<section class="acw-panel"><div class="acw-panel-head"><h3>${s.unverified.length === 1 ? "1 movimento da verificare" : `${s.unverified.length} movimenti da verificare`}</h3>${pill("Controllo prima della chiusura", "warn")}</div>
    ${s.unverified.map((e) => `<div class="acw-line"><div><strong>${esc(e.label)}</strong><p>${esc(entryIssue(e))} · ${fmtDate(e.date)} · ${e.type === "income" ? "+" : "−"}${eur(e.cents)}</p></div><button type="button" class="acw-btn" data-entry="${esc(e.id)}">Verifica →</button></div>`).join("")}
  </section>` : ""}`;
}

function renderClose(s) {
  const closed = isClosed();
  const canClose = !closed && s.list.length > 0 && s.unverified.length === 0 && !ctx.busy;
  const receipts = receiptSummary(s.list).reduce((t, r) => t + r.gross, 0);
  const history = (ctx.data.audit || []).filter((a) => a.month === ctx.month).slice(-10).reverse();
  const step1 = s.unverified.length ? `${s.unverified.length} movimenti da verificare impediscono la chiusura.` : s.list.length ? "Tutti i movimenti registrati sono verificati." : "Nessun movimento registrato nel mese.";
  return `<div class="acw-grid">
    <section class="acw-panel"><div class="acw-eyebrow">${esc(monthLabel(ctx.month))}</div><h3>${closed ? "Mese chiuso · fotografia salvata" : "Prepara la consegna"}</h3>
      ${[["Controlla che non manchi niente", step1], ["Chiudi il mese", "Il programma salva una fotografia della prima nota e la blocca, così nessuno la cambia per sbaglio dopo che l’hai mandata. Gli ordini restano modificabili, e il mese si può riaprire."], ["Scarica i file per il commercialista", "Prima nota, corrispettivi e accrediti in CSV, che si aprono con Excel. Li mandi tu: nessun invio automatico."]].map(([t, p], i) => `<div class="acw-step"><b>${i + 1}</b><div><strong>${t}</strong><p>${esc(p)}</p></div></div>`).join("")}
      ${!closed && s.pending.length ? `<div class="acw-notice is-warn">${s.pending.length} incassi risultano sugli ordini ma non in prima nota: se chiudi ora, il prospetto non li comprende.</div>` : ""}
      <div class="acw-actions-row"><button type="button" class="acw-btn is-primary" data-close-month ${closed || canClose ? "" : "disabled"}>${closed ? "Riapri il mese" : `Chiudi ${esc(monthLabel(ctx.month))}`}</button>
        <button type="button" class="acw-btn" data-export="ledger">Prima nota CSV</button><button type="button" class="acw-btn" data-export="receipts">Corrispettivi CSV</button><button type="button" class="acw-btn" data-export="payouts">Accrediti CSV</button></div>
    </section>
    <section class="acw-panel"><h3>Contenuto del prospetto</h3>
      ${line("Movimenti", String(s.list.length))}${line("Incassi", eur(s.income))}${line("Uscite e rimborsi", eur(s.out))}${line("Corrispettivi lordi", eur(receipts))}${line("Da verificare", String(s.unverified.length))}
      <h4>Storico del periodo</h4>
      ${history.length ? history.map((a) => `<p class="acw-history">${esc(new Date(a.at).toLocaleString("it-IT"))} · ${a.action === "close" ? "Chiusura" : "Riapertura"}${a.reason ? ` · ${esc(a.reason)}` : ""}</p>`).join("") : `<p class="acw-history">Nessuna chiusura registrata.</p>`}
    </section>
  </div>`;
}

function summary() {
  const list = monthEntries();
  const unverified = list.filter((e) => !e.verified);
  const pending = isClosed() ? [] : pendingOrderIncome(ctx.orders, ctx.data.entries, ctx.month);
  pendingCache = pending;
  const income = list.filter((e) => e.type === "income").reduce((t, e) => t + e.cents, 0);
  const out = list.filter((e) => e.type !== "income").reduce((t, e) => t + e.cents, 0);
  const monthOrders = ctx.orders.filter((o) => orderDate(o).startsWith(ctx.month)).sort((a, b) => orderDate(b).localeCompare(orderDate(a)));
  const toCents = (n) => Math.round((Number(n) || 0) * 100);
  return {
    list, unverified, pending, income, out,
    verified: list.length - unverified.length,
    issues: unverified.length + pending.length,
    monthOrders,
    monthGross: monthOrders.reduce((t, o) => t + toCents(getOrderGrossTotal(o)), 0),
    monthPaid: monthOrders.reduce((t, o) => t + toCents(getCollectedAmount(o)), 0),
    monthOpen: monthOrders.reduce((t, o) => t + toCents(getOpenBalance(o)), 0),
  };
}

function syncSection() {
  const section = document.getElementById("accounting");
  if (!section) return;
  section.classList.add("acw-active");
  try { ctx.onPaneChange?.(); } catch {}
}
function tabsHtml(issues) {
  return `<div class="acw-tabs" role="tablist" aria-label="Sezioni della contabilità">${TAB_ORDER.map((k) => {
    const label = PAGES[k][0];
    const count = k === "review" && issues ? `<span class="acw-count">${issues}</span>` : "";
    return `<button type="button" role="tab" aria-selected="${ctx.pane === k}" class="${ctx.pane === k ? "is-active" : ""}" data-pane="${k}">${label}${count}</button>`;
  }).join("")}</div>`;
}
function draw() {
  const root = document.getElementById("accounting-workspace");
  if (!root) return;
  syncSection();
  if (!ctx.data) {
    root.innerHTML = `${tabsHtml(0)}<div class="acw-loading">${esc(ctx.error || "Caricamento del registro…")}${ctx.error ? ` <button type="button" class="acw-btn" data-reload>Riprova</button>` : ""}</div>`;
    return;
  }
  const s = summary();
  const closed = isClosed();
  const [title, subtitle] = PAGES[ctx.pane];
  const body = { overview: renderOverview, orders: renderOrders, ledger: renderLedger, receipts: renderReceipts, review: renderReview, close: renderClose }[ctx.pane](s);
  root.innerHTML = `${tabsHtml(s.issues)}
    <section class="acw-main">
      <div class="acw-heading"><div><div class="acw-eyebrow">Controllo economico</div><h2>${title}</h2><p>${subtitle}</p></div>
        <div class="acw-actions"><input type="month" value="${ctx.month}" data-month aria-label="Periodo"><span class="acw-pill ${closed ? "subtle" : ""}">${closed ? "Mese chiuso" : "Mese aperto"}</span><button type="button" class="acw-btn" data-reload title="Ricarica il registro">Aggiorna</button><button type="button" class="acw-btn is-primary" data-new ${closed || ctx.busy ? "disabled" : ""}>+ Movimento</button></div></div>
      ${ctx.error ? `<div role="alert" class="acw-error">${esc(ctx.error)}</div>` : ""}
      <div class="acw-body">${body}</div>
      <p class="acw-footnote">Nessun collegamento bancario · Nessun invio fiscale · Prospetti da validare con il commercialista</p>
    </section>`;
}

function redrawTable(selector, html) { const el = document.querySelector(`#accounting-workspace ${selector}`); if (el) el.innerHTML = html; }

// Importi con la virgola decimale: il CSV (separatore ";") si apre in Excel italiano.
const csvEur = (c) => ((Number(c) || 0) / 100).toFixed(2).replace(".", ",");
function exportFile(kind) {
  const list = monthEntries();
  const state = isClosed() ? "Chiuso" : "Bozza";
  let rows;
  if (kind === "payouts") rows = [["Accrediti riconciliati", ctx.month, state], ["Data", "Riferimento", "Ordini", "Lordo", "Rimborsi", "Commissioni", "Netto"], ...monthPayouts().map((p) => [p.date, p.reference, p.orderIds.map(orderRef).join(", "), csvEur(p.gross), csvEur(p.refund), csvEur(p.fees), csvEur(p.bank)])];
  else if (kind === "receipts") {
    // Una riga per giornata con tutti i metodi in colonna, anche a zero.
    const days = receiptDailySummary(list);
    const tot = receiptMonthTotals(days);
    const rates = (d) => Object.entries(d.rates).map(([r, c]) => `${r}% ${csvEur(c)}`).join(" | ");
    rows = [["Corrispettivi per giornata e metodo di pagamento", ctx.month, state],
      ["Data", "Operazioni", "Totale giornata", ...RECEIPT_METHODS.map(([, l]) => l), "Imponibile", "IVA", "Lordo per aliquota"],
      ...days.map((d) => [fmtDate(d.date), d.count, csvEur(d.gross), ...RECEIPT_METHODS.map(([k]) => csvEur(d.methods[k])), csvEur(d.net), csvEur(d.tax), rates(d)]),
      ["Totale del mese", tot.count, csvEur(tot.gross), ...RECEIPT_METHODS.map(([k]) => csvEur(tot.methods[k])), csvEur(tot.net), csvEur(tot.tax), ""]];
  }
  else rows = [["Prima nota gestionale", ctx.month, state], ["Data incasso/pagamento", "Data registrazione", "Descrizione", "Tipo", "Lordo EUR", "Metodo", "Documento", "Aliquota", "Riferimento", "Ordine", "Verificato"], ...list.map((e) => [e.date, e.fiscalDate, e.label, TYPES[e.type] || e.type, `${e.type === "income" ? "" : "-"}${csvEur(e.cents)}`, e.method, DOCS[e.document] || e.document, e.vatRate == null ? "" : `${e.vatRate}%`, e.reference, e.orderId ? orderRef(e.orderId) : "", e.verified ? "Sì" : "No"])];
  const url = URL.createObjectURL(new Blob([registerCSV(rows)], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${{ ledger: "prima-nota", receipts: "corrispettivi", payouts: "accrediti" }[kind]}-${ctx.month}-${state.toLowerCase()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("CSV scaricato");
}

// ─── Dialog ────────────────────────────────────────────────────────────────
function dialog(html) {
  let d = document.getElementById("acw-dialog");
  if (!d) {
    d = document.createElement("dialog");
    d.id = "acw-dialog";
    d.className = "acw-dialog";
    d.addEventListener("click", (ev) => {
      if (ev.target === d || ev.target.closest("[data-cancel]")) d.close();
    });
    document.body.append(d);
  }
  d.innerHTML = html;
  if (!d.open) d.showModal();
  return d;
}
const closeDialog = () => document.getElementById("acw-dialog")?.close();
const options = (pairs, selected) => pairs.map(([v, l]) => `<option value="${esc(v)}" ${String(selected) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("");
const rateOptions = (selected) => `<option value="" ${selected == null || selected === "" ? "selected" : ""}>Da verificare</option>${RATES.map((r) => `<option value="${r}" ${Number(selected) === r && selected !== "" && selected != null ? "selected" : ""}>${r}%</option>`).join("")}`;

function entryDetail(e) {
  const frozen = Boolean(ctx.data.periods[String(e.fiscalDate).slice(0, 7)]?.closed);
  const net = e.vatRate != null ? Math.round(e.cents / (1 + e.vatRate / 100)) : null;
  const order = e.orderId ? findOrder(e.orderId) : null;
  const d = dialog(`<div class="acw-eyebrow">Movimento · ${esc(TYPES[e.type] || e.type)}</div><h3>${esc(e.label)}</h3>
    ${line(`${fmtDate(e.date)} · ${esc(e.method || "metodo non indicato")}`, `${e.type === "income" ? "+" : "−"}${eur(e.cents)}`)}
    ${e.fiscalDate !== e.date ? line("Data registrazione", fmtDate(e.fiscalDate)) : ""}
    ${order ? line("Ordine collegato", `<button type="button" class="acw-link" data-open-order data-action="select-order" data-id="${esc(order.id)}" data-view="accounting">${esc(orderDisplayNumber(order))} ↗</button>`) : ""}
    ${net != null ? `<p class="acw-hint">Imponibile ${eur(net)} · IVA ${eur(e.cents - net)} (${e.vatRate}%)</p>` : ""}
    <form data-verify-form>
      <label>Classificazione del documento<select name="document" ${frozen ? "disabled" : ""}>${options(Object.entries(DOCS), e.document)}</select></label>
      <label>Aliquota IVA<select name="vatRate" ${frozen ? "disabled" : ""}>${rateOptions(e.vatRate)}</select></label>
      <label>Riferimento documento / transazione<input name="reference" maxlength="120" value="${esc(e.reference || "")}" ${frozen ? "disabled" : ""}></label>
      <p role="alert" class="acw-error-inline" data-error></p>
      <div class="acw-dialog-actions"><button type="button" class="acw-btn" data-cancel>Chiudi</button><button type="button" class="acw-btn" data-edit-full ${frozen ? "disabled" : ""}>Modifica tutto</button><button class="acw-btn is-primary" ${frozen ? "disabled" : ""}>${e.verified ? "Salva verifica" : "Conferma e verifica"}</button></div>
      ${frozen ? `<p class="acw-hint">Mese chiuso: riaprilo da «Chiusura ed export» per modificare.</p>` : ""}
    </form>`);
  d.querySelector("[data-edit-full]").onclick = () => editEntry(e);
  d.querySelector("[data-open-order]")?.addEventListener("click", () => d.close());
  d.querySelector("[data-verify-form]").onsubmit = async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const entry = { ...e, amount: e.cents / 100, document: f.get("document"), vatRate: f.get("vatRate"), reference: f.get("reference"), verified: true };
    const ok = await save({ action: "entry", entry }, "Movimento verificato. Riepiloghi aggiornati.");
    if (ok) closeDialog(); else d.querySelector("[data-error]").textContent = ctx.error;
  };
}

function editEntry(e = {}, { dateSource } = {}) {
  const isNew = !e.id;
  const d = dialog(`<div class="acw-eyebrow">${isNew ? (e.orderId ? "Incasso da ordine" : "Nuovo movimento") : "Modifica movimento"}</div><h3>${esc(e.label || "Nuovo movimento")}</h3>
    ${dateSource === "order" ? `<div class="acw-notice is-warn">Data proposta = data dell’ordine. Correggila se l’incasso è avvenuto in un altro giorno.</div>` : ""}
    <form data-entry-form>
      <label>Descrizione<input name="label" required maxlength="240" value="${esc(e.label || "")}"></label>
      <div class="acw-form-row"><label>Data incasso / pagamento<input name="date" type="date" required value="${esc(e.date || "")}"></label><label>Data registrazione<input name="fiscalDate" type="date" required value="${esc(e.fiscalDate || e.date || "")}"></label></div>
      <div class="acw-form-row"><label>Importo lordo €<input name="amount" type="number" min="0.01" step="0.01" required value="${e.cents ? (e.cents / 100).toFixed(2) : ""}"></label><label>Tipo<select name="type">${options(Object.entries(TYPES), e.type || "income")}</select></label></div>
      <div class="acw-form-row"><label>Metodo<input name="method" required list="acw-methods" value="${esc(e.method || "")}"></label><label>Documento<select name="document">${options(Object.entries(DOCS), e.document || "pending")}</select></label></div>
      <datalist id="acw-methods">${METHODS.map((m) => `<option value="${m}">`).join("")}</datalist>
      <div class="acw-form-row"><label>Aliquota IVA<select name="vatRate">${rateOptions(e.vatRate)}</select></label><label>Riferimento documento / transazione<input name="reference" maxlength="120" value="${esc(e.reference || "")}"></label></div>
      <p class="acw-hint">Data incasso e data registrazione devono cadere nello stesso mese. Per verificare servono documento, aliquota e riferimento.</p>
      <p role="alert" class="acw-error-inline" data-error></p>
      <div class="acw-dialog-actions"><button type="button" class="acw-btn" data-cancel>Annulla</button><button class="acw-btn" value="draft">Salva come da verificare</button><button class="acw-btn is-primary" value="verify">Salva e verifica</button></div>
    </form>`);
  d.querySelector("[data-entry-form]").onsubmit = async (ev) => {
    ev.preventDefault();
    const f = new FormData(ev.target);
    const verify = ev.submitter?.value === "verify";
    const entry = { ...Object.fromEntries(f), id: e.id, orderId: e.orderId || "", verified: verify };
    const buttons = ev.target.querySelectorAll("button");
    buttons.forEach((b) => { b.disabled = true; });
    const ok = await save({ action: "entry", entry }, verify ? "Movimento salvato e verificato." : "Movimento salvato: lo trovi in «Da verificare».");
    if (ok) closeDialog();
    else { d.querySelector("[data-error]").textContent = ctx.error; buttons.forEach((b) => { b.disabled = false; }); }
  };
}

function dayDetail(date) {
  const items = monthEntries().filter((e) => e.fiscalDate === date && e.verified && e.document === "receipt" && ["income", "refund"].includes(e.type));
  const day = receiptDailySummary(items)[0];
  const byMethod = day ? RECEIPT_METHODS.filter(([k]) => day.methods[k]).map(([k, l]) => `${esc(l)} <strong>${eur(day.methods[k])}</strong>`).join(" · ") : "";
  dialog(`<div class="acw-eyebrow">Corrispettivi</div><h3>${fmtDate(date)} · ${eur(day?.gross || 0)}</h3>
    ${byMethod ? `<p class="acw-hint">${byMethod}</p>` : ""}
    ${items.map((e) => line(`<button type="button" class="acw-link" data-day-entry="${esc(e.id)}">${esc(e.label)}</button> · ${esc(receiptMethodLabel(e.method))} · ${e.vatRate}%`, `${e.type === "refund" ? "−" : ""}${eur(e.cents)}`)).join("")}
    <div class="acw-dialog-actions"><button type="button" class="acw-btn" data-cancel>Chiudi</button></div>`)
    .querySelectorAll("[data-day-entry]").forEach((b) => { b.onclick = () => entryDetail(ctx.data.entries.find((x) => x.id === b.dataset.dayEntry) || items.find((x) => x.id === b.dataset.dayEntry)); });
}

function payoutDetail(id) {
  const p = [...ctx.data.payouts, ...monthPayouts()].find((x) => x.id === id);
  if (!p) return;
  dialog(`<div class="acw-eyebrow">Accredito cumulativo</div><h3>${esc(p.reference)}</h3><p>${fmtDate(p.date)} · Ordini inclusi: ${p.orderIds.map((oid) => esc(orderRef(oid))).join(", ")}</p>
    ${line("Pagamenti lordi dei clienti", eur(p.gross))}${line("Rimborsi", `−${eur(p.refund)}`)}${line("Commissioni", `−${eur(p.fees)}`)}${line("<strong>Netto accreditato in banca</strong>", `<strong>${eur(p.bank)}</strong>`)}
    <div class="acw-notice">Differenza tra netto atteso e movimento bancario: <strong>${eur(p.gross - p.refund - p.fees - p.bank)}</strong>. Abbinamento confermato.</div>
    <div class="acw-dialog-actions"><button type="button" class="acw-btn" data-cancel>Chiudi</button></div>`);
}

function payoutForm() {
  const [y, m] = ctx.month.split("-").map(Number);
  const prev = new Date(y, m - 2, 15).toLocaleDateString("sv-SE").slice(0, 7);
  const candidates = ctx.orders.filter((o) => { const dt = orderDate(o); return (dt.startsWith(ctx.month) || dt.startsWith(prev)) && getCollectedAmount(o) > 0; })
    .sort((a, b) => orderDate(b).localeCompare(orderDate(a)));
  const d = dialog(`<div class="acw-eyebrow">Accredito del circuito</div><h3>Riconcilia accredito</h3>
    <form data-payout-form>
      <div class="acw-form-row"><label>Data accredito<input name="date" type="date" required></label><label>Riferimento univoco del rendiconto<input name="reference" required maxlength="120"></label></div>
      <label>Ordini collegati <input type="search" data-payout-filter placeholder="Filtra per numero o cliente…"></label>
      <div class="acw-checklist">${candidates.map((o) => `<label data-filter-text="${esc(`${orderDisplayNumber(o)} ${orderCustomerName(o)}`.toLowerCase())}"><input type="checkbox" name="orderIds" value="${esc(o.id)}"> ${esc(orderDisplayNumber(o))} · ${esc(orderCustomerName(o))} · ${eurFromEuros(getCollectedAmount(o))}</label>`).join("") || `<p class="acw-hint">Nessun ordine pagato in ${esc(monthLabel(prev))} o ${esc(monthLabel(ctx.month))}.</p>`}</div>
      <div class="acw-form-row">${[["gross", "Pagamenti lordi €"], ["refund", "Rimborsi €"]].map(([k, l]) => `<label>${l}<input name="${k}" type="number" step="0.01" min="0" required value="${k === "refund" ? "0" : ""}"></label>`).join("")}</div>
      <div class="acw-form-row">${[["fees", "Commissioni €"], ["bank", "Netto accreditato in banca €"]].map(([k, l]) => `<label>${l}<input name="${k}" type="number" step="0.01" min="0" required></label>`).join("")}</div>
      <p class="acw-hint" data-payout-check>Il netto deve coincidere con lordo meno rimborsi e commissioni. Inserisci i valori del rendiconto, senza dedurli dai totali degli ordini.</p>
      <p role="alert" class="acw-error-inline" data-error></p>
      <div class="acw-dialog-actions"><button type="button" class="acw-btn" data-cancel>Annulla</button><button class="acw-btn is-primary">Conferma abbinamento</button></div>
    </form>`);
  const form = d.querySelector("[data-payout-form]");
  d.querySelector("[data-payout-filter]").oninput = (ev) => {
    const q = ev.target.value.trim().toLowerCase();
    d.querySelectorAll("[data-filter-text]").forEach((l) => { l.hidden = Boolean(q) && !l.dataset.filterText.includes(q); });
  };
  form.oninput = () => {
    const v = (k) => Number(form.elements[k]?.value || 0);
    const diff = Math.round((v("gross") - v("refund") - v("fees") - v("bank")) * 100);
    const check = d.querySelector("[data-payout-check]");
    if (form.elements.bank.value) check.textContent = diff === 0 ? "✓ Il netto coincide con lordo − rimborsi − commissioni." : `Differenza di ${eur(diff)} tra netto atteso e netto inserito.`;
  };
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const f = new FormData(form);
    if (!f.getAll("orderIds").length) { d.querySelector("[data-error]").textContent = "Seleziona almeno un ordine."; return; }
    const ok = await save({ action: "payout", payout: { ...Object.fromEntries(f), orderIds: f.getAll("orderIds") } }, "Accredito riconciliato.");
    if (ok) closeDialog(); else d.querySelector("[data-error]").textContent = ctx.error;
  };
}

// "Registra tutti": gli incassi degli ordini del mese in prima nota con una
// sola conferma, invece che uno per uno. Stesse proposte del pulsante singolo
// (suggestEntryFromPending); chi va controllato si toglie dalla lista.
function registerAllForm() {
  const items = pendingCache.map((p, i) => ({ p, i, s: suggestEntryFromPending(p) }));
  if (!items.length || isClosed()) return;
  const sum = (list) => list.reduce((t, x) => t + x.s.cents, 0);
  const receipts = items.filter((x) => x.s.document === "receipt");
  const invoices = items.filter((x) => x.s.document === "invoice");
  const byMethod = RECEIPT_METHODS.map(([k, l]) => [l, sum(items.filter((x) => receiptMethodKey(x.s.method) === k))]).filter(([, c]) => c);
  const fromOrderDate = items.filter((x) => x.s.dateSource === "order").length;
  const d = dialog(`<div class="acw-eyebrow">Prima nota</div><h3>Registra ${items.length === 1 ? "1 incasso" : `${items.length} incassi`} degli ordini · ${eur(sum(items))}</h3>
    <p class="acw-hint">Corrispettivi ${eur(sum(receipts))} (${receipts.length})${invoices.length ? ` · Fatture ${eur(sum(invoices))} (${invoices.length})` : ""}<br>${byMethod.map(([l, c]) => `${esc(l)} <strong>${eur(c)}</strong>`).join(" · ")}</p>
    ${fromOrderDate ? `<div class="acw-notice is-warn">${fromOrderDate === 1 ? "1 incasso ha" : `${fromOrderDate} incassi hanno`} come data quella dell’ordine. Se il cliente ha pagato un altro giorno (es. un bonifico arrivato dopo), togli la spunta e registralo a parte, oppure correggilo dopo dalla prima nota.</div>` : ""}
    <form data-bulk-form>
      <div class="acw-checklist is-tall">${items.map(({ p, i, s: e }) => `<label><input type="checkbox" name="pick" value="${i}" checked><span>${esc(orderDisplayNumber(p.order))} · ${esc(orderCustomerName(p.order))} · ${fmtDate(e.date)} · ${esc(receiptMethodLabel(e.method))} · ${esc(DOCS[e.document])}</span><strong class="acw-bulk-amount">${eur(e.cents)}</strong></label>`).join("")}</div>
      <p class="acw-hint">Tutti con IVA 22% e riferimento «Ordine #…». Se un ordine ha un’aliquota diversa, togli la spunta e registralo con «Registra →».</p>
      <p role="alert" class="acw-error-inline" data-error></p>
      <div class="acw-dialog-actions"><button type="button" class="acw-btn" data-cancel>Annulla</button><button class="acw-btn" value="draft">Registra senza verificare</button><button class="acw-btn is-primary" value="verify">Registra e verifica</button></div>
    </form>`);
  const form = d.querySelector("[data-bulk-form]");
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const verify = ev.submitter?.value === "verify";
    const picked = new FormData(form).getAll("pick").map(Number);
    const errorEl = d.querySelector("[data-error]");
    if (!picked.length) { errorEl.textContent = "Seleziona almeno un incasso."; return; }
    if (ctx.busy) return;
    const buttons = form.querySelectorAll("button");
    buttons.forEach((b) => { b.disabled = true; });
    const progress = ev.submitter;
    ctx.busy = true;
    let done = 0;
    try {
      for (const index of picked) {
        const entry = { ...items[index].s, amount: items[index].s.cents / 100, verified: verify };
        progress.textContent = `Registro ${done + 1} di ${picked.length}…`;
        ctx.data = await api({ action: "entry", entry, revision: ctx.data.revision });
        done++;
      }
      ctx.error = "";
    } catch (e) {
      ctx.error = e.message;
    } finally {
      ctx.busy = false;
    }
    if (done === picked.length) {
      closeDialog();
      toast(verify ? `${done} incassi registrati e verificati: sono nei corrispettivi.` : `${done} incassi registrati: li trovi in «Da verificare».`);
    } else {
      errorEl.textContent = `Registrati ${done} su ${picked.length}. ${ctx.error}`;
      buttons.forEach((b) => { b.disabled = false; });
      progress.textContent = verify ? "Registra e verifica" : "Registra senza verificare";
    }
    draw();
  };
}

function closeMonth() {
  if (isClosed()) {
    const d = dialog(`<h3>Riaprire ${esc(monthLabel(ctx.month))}?</h3><p>Il registro del mese tornerà modificabile. La fotografia della chiusura resta nello storico.</p>
      <form data-reopen-form><label>Motivo della riapertura<input name="reason" required maxlength="300" placeholder="Es. rettifica importo incasso del 12"></label><p role="alert" class="acw-error-inline" data-error></p>
      <div class="acw-dialog-actions"><button type="button" class="acw-btn" data-cancel>Annulla</button><button class="acw-btn is-primary">Riapri</button></div></form>`);
    d.querySelector("[data-reopen-form]").onsubmit = async (ev) => {
      ev.preventDefault();
      const ok = await save({ action: "reopen", month: ctx.month, reason: new FormData(ev.target).get("reason") }, "Mese riaperto.");
      if (ok) closeDialog(); else d.querySelector("[data-error]").textContent = ctx.error;
    };
    return;
  }
  const d = dialog(`<h3>Chiudere ${esc(monthLabel(ctx.month))}?</h3><p>Verrà salvata una fotografia del registro e le modifiche al mese saranno bloccate fino a una riapertura motivata.</p>
    ${pendingCache.length ? `<div class="acw-notice is-warn">${pendingCache.length} incassi risultano sugli ordini ma non in prima nota e non saranno compresi.</div>` : ""}
    <p role="alert" class="acw-error-inline" data-error></p>
    <div class="acw-dialog-actions"><button type="button" class="acw-btn" data-cancel>Annulla</button><button type="button" class="acw-btn is-primary" data-confirm-close>Chiudi il mese</button></div>`);
  d.querySelector("[data-confirm-close]").onclick = async () => {
    const ok = await save({ action: "close", month: ctx.month }, "Mese chiuso. Modifiche bloccate.");
    if (ok) closeDialog(); else d.querySelector("[data-error]").textContent = ctx.error;
  };
}

// ─── Eventi (delegati sul contenitore: sopravvivono ai ridisegni) ─────────────
function bind(root) {
  root.addEventListener("click", (ev) => {
    const t = ev.target.closest("button");
    if (!t || !root.contains(t) || t.disabled) return;
    const ds = t.dataset;
    if (ds.pane) {
      setPane(ds.pane);
      if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ block: "start" });
      return;
    }
    if (ds.go) { setPane(ds.go); return; }
    if ("reload" in ds) { load(); return; }
    if ("new" in ds) { editEntry({ date: new Date().toLocaleDateString("sv-SE"), type: "income" }); return; }
    if (ds.entry) { const e = monthEntries().find((x) => x.id === ds.entry) || ctx.data.entries.find((x) => x.id === ds.entry); if (e) entryDetail(e); return; }
    if (ds.registerOrder) { const p = pendingCache.find((x) => x.order.id === ds.registerOrder); if (p) { const s = suggestEntryFromPending(p); editEntry(s, { dateSource: s.dateSource }); } return; }
    if (ds.suggest) { const p = pendingCache[Number(ds.suggest)]; if (p) { const s = suggestEntryFromPending(p); editEntry(s, { dateSource: s.dateSource }); } return; }
    if (ds.day) { dayDetail(ds.day); return; }
    if (ds.payoutDetail) { payoutDetail(ds.payoutDetail); return; }
    if ("newPayout" in ds) { payoutForm(); return; }
    if ("registerAll" in ds) { registerAllForm(); return; }
    if (ds.export) { exportFile(ds.export); return; }
    if ("closeMonth" in ds) { closeMonth(); return; }
    if (ds.exportOrders) { ctx.exportOrders?.(ds.exportOrders, filteredMonthOrders(summary())); return; }
    if ("moreOrders" in ds) { ctx.orderLimit += PAGE_SIZE; redrawOrders(); return; }
    if ("morePending" in ds) { ctx.pendingLimit += 30; draw(); }
  });
  root.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.matches("[data-ledger-query]")) { ctx.ledgerQuery = t.value; redrawLedger(); }
    else if (t.matches("[data-order-query]")) { ctx.orderQuery = t.value; ctx.orderLimit = PAGE_SIZE; redrawOrders(); }
  });
  root.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.matches("[data-month]") && t.value) { ctx.month = t.value; ctx.orderLimit = PAGE_SIZE; ctx.pendingLimit = 30; draw(); }
    else if (t.matches("[data-ledger-type]")) { ctx.ledgerType = t.value; redrawLedger(); }
    else if (t.matches("[data-order-filter]")) { ctx.orderFilter = t.value; ctx.orderLimit = PAGE_SIZE; redrawOrders(); }
    else if (t.matches("[data-order-scope]")) { ctx.orderScope = t.value === "all" ? "all" : "month"; ctx.orderLimit = PAGE_SIZE; redrawOrders(); }
  });
}
function redrawOrders() {
  const s = summary();
  redrawTable("[data-orders-table]", ordersRows(s));
  redrawTable("[data-orders-count]", filteredOrdersCount(s));
}
function redrawLedger() {
  const s = summary();
  redrawTable("[data-ledger-table]", entriesTable(filteredLedger(s), s.list.length ? "Nessun movimento corrisponde alla ricerca." : `Nessun movimento registrato in ${monthLabel(ctx.month)}.`));
}

// Chi apre un ordine in Contabilità da un'altra vista (dashboard, ricerca…)
// arriva su "Ordini e incassi", con la scheda dell'ordine aperta a destra.
export function showAccountingPane(pane) {
  pane = LEGACY_PANES[pane] || pane;
  if (!TAB_ORDER.includes(pane)) return;
  const root = document.getElementById("accounting-workspace");
  if (root?.dataset.mounted) setPane(pane);
  else { ctx.pane = pane; try { localStorage.setItem(PANE_STORAGE_KEY, pane); } catch {} }
}

// Dalla dashboard ("Soldi da chiudere", "Fatture"): la lista già filtrata, su
// tutti i mesi, perché un credito o una fattura vecchi contano lo stesso.
export function showAccountingOrders({ filter = "all", scope = "all" } = {}) {
  ctx.orderFilter = ["all", "open", "invoice", "register", "paid"].includes(filter) ? filter : "all";
  ctx.orderScope = scope === "month" ? "month" : "all";
  ctx.orderQuery = "";
  ctx.orderLimit = PAGE_SIZE;
  showAccountingPane("orders");
}

export function mountAccountingWorkspace(root, nextOrders, nextUserKey, { toast: toastFn, onPaneChange, exportOrders } = {}) {
  if (toastFn) ctx.toast = toastFn;
  if (onPaneChange) ctx.onPaneChange = onPaneChange;
  if (exportOrders) ctx.exportOrders = exportOrders;
  if (ctx.userKey !== nextUserKey) {
    ctx.userKey = nextUserKey;
    ctx.data = null;
    ctx.error = "";
    if (root) delete root.dataset.mounted;
  }
  ctx.orders = Array.isArray(nextOrders) ? nextOrders : [];
  if (!root) return;
  if (!root.dataset.bound) { root.dataset.bound = "true"; bind(root); }
  if (!root.dataset.mounted) { root.dataset.mounted = "true"; load(); }
  // Un ridisegno di sfondo (sync ordini) non deve rubare il fuoco a chi sta scrivendo.
  const active = document.activeElement;
  if (active && root.contains(active) && /^(INPUT|SELECT|TEXTAREA)$/.test(active.tagName)) return;
  draw();
}
