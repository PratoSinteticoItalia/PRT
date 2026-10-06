// Contabilità gestionale (solo ufficio): registro persistito lato server
// (/api/accounting/register, lib/accounting-register.js) + ordini reali.
// Layout e percorso ricalcano la simulazione concordata (tmp/contabilita-demo.html).
import { receiptSummary, registerCSV } from "./accounting-register.js";
import { getCollectedAmount, getOpenBalance, getOrderGrossTotal } from "./order-money.js";
import {
  orderDate, orderDisplayNumber, orderCustomerName, orderPaymentState, orderShippingLabel,
  registeredCentsByOrder, pendingOrderIncome, suggestEntryFromPending, entryIssue, totalsByMethod,
} from "./accounting-workspace-data.js";

const PAGES = {
  overview: ["Panoramica", "Il mese a colpo d’occhio. Prima i numeri, poi le azioni."],
  orders: ["Ordini e incassi", "Dall’ordine al conto: pagamento, spedizione e accredito sono stati distinti."],
  ledger: ["Prima nota", "Ogni entrata e uscita, con il suo documento."],
  receipts: ["Corrispettivi", "Riepilogo per giorno e aliquota dei corrispettivi verificati."],
  review: ["Da verificare", "Risolvi le anomalie prima di chiudere il mese."],
  close: ["Chiusura ed export", "Un mese controllato, un pacchetto ordinato."],
};
// "Pagamenti ordini" è la sezione storica per ordine (#accounting-legacy in
// index.html): resta nel DOM, il pannello la mostra solo su questa scheda.
const TAB_ORDER = [...Object.keys(PAGES), "payments"];
const PAYMENTS_LABEL = "Pagamenti ordini";
const PANE_STORAGE_KEY = "psi-accounting-pane";
const DOCS = { pending: "Da classificare", receipt: "Corrispettivo", invoice: "Fattura", other: "Altro documento" };
const TYPES = { income: "Entrata", expense: "Uscita", refund: "Rimborso cliente" };
const RATES = [22, 10, 5, 4, 0];
const METHODS = ["Shopify", "Carta", "Bonifico", "PayPal", "Contanti", "Scalapay", "HeyLight", "Assegno"];
const PAGE_SIZE = 50;

const ctx = {
  userKey: "", data: null, loading: false, error: "", busy: false,
  pane: readStoredPane(), month: new Date().toLocaleDateString("sv-SE").slice(0, 7),
  orders: [], toast: null, onPaneChange: null,
  ledgerQuery: "", ledgerType: "all", orderQuery: "", orderFilter: "all", orderLimit: PAGE_SIZE, pendingLimit: 30,
};
let pendingCache = [];

function readStoredPane() {
  try { const v = localStorage.getItem(PANE_STORAGE_KEY); if (TAB_ORDER.includes(v)) return v; } catch {}
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
  const methods = totalsByMethod(s.list);
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

function filteredMonthOrders(s) {
  const q = ctx.orderQuery.trim().toLowerCase();
  const pendingIds = new Set(s.pending.map((p) => p.order.id));
  return s.monthOrders.filter((o) => {
    if (q && !`${orderDisplayNumber(o)} ${orderCustomerName(o)}`.toLowerCase().includes(q)) return false;
    if (ctx.orderFilter === "open") return getOpenBalance(o) > 0;
    if (ctx.orderFilter === "paid") return getOpenBalance(o) <= 0 && getCollectedAmount(o) > 0;
    if (ctx.orderFilter === "register") return pendingIds.has(o.id);
    return true;
  });
}
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
    return `<tr>
      <td><button type="button" class="acw-link" data-order="${esc(o.id)}">${esc(orderDisplayNumber(o))} ↗</button><small>${esc(orderCustomerName(o))} · ${fmtDate(orderDate(o))}</small></td>
      <td class="acw-right acw-amount">${eurFromEuros(getOrderGrossTotal(o))}</td>
      <td class="acw-right">${eurFromEuros(paid)}</td>
      <td class="acw-right">${eurFromEuros(getOpenBalance(o))}</td>
      <td>${pill(state.label, tone)}<small>${esc(orderShippingLabel(o))}</small></td>
      <td>${pendingIds.has(o.id) && !isClosed() ? `<button type="button" class="acw-btn is-small" data-register-order="${esc(o.id)}">Registra</button>${reg ? `<small>${eur(reg)} già registrati</small>` : ""}` : reg ? `${eur(reg)}<small>registrati</small>` : `<span class="acw-muted">—</span>`}</td>
      <td>${payout ? `<button type="button" class="acw-link" data-payout-detail="${esc(payout.id)}">${esc(payout.reference)} ↗</button><small>Riconciliato</small>` : `<span class="acw-muted">—</span>`}</td>
    </tr>`;
  }).join("");
  const more = list.length > ctx.orderLimit ? `<div class="acw-more"><button type="button" class="acw-btn" data-more-orders>Mostra altri ${Math.min(PAGE_SIZE, list.length - ctx.orderLimit)} di ${list.length - ctx.orderLimit}</button></div>` : "";
  return `<div class="acw-table-wrap"><table><thead><tr><th>Ordine</th><th class="acw-right">Totale</th><th class="acw-right">Pagato</th><th class="acw-right">Da incassare</th><th>Pagamento / spedizione</th><th>Prima nota</th><th>Accredito</th></tr></thead><tbody>${rows || `<tr><td colspan="7" class="acw-empty">Nessun ordine trovato in ${esc(monthLabel(ctx.month))}.</td></tr>`}</tbody></table></div>${more}`;
}
function renderOrders(s) {
  const payouts = monthPayouts();
  const toRegister = s.pending.reduce((t, p) => t + p.cents, 0);
  return `<div class="acw-notice">Ordini creati nel mese (data ordine). <strong>Pagamento, spedizione e accredito sono stati indipendenti</strong>: un ordine spedito non conferma un incasso. Le commissioni del circuito non sono note dagli ordini, quindi nessun netto viene stimato.</div>
  ${cards([
    ["Ordini del mese", String(s.monthOrders.length), `Valore complessivo ${eur(s.monthGross)}`],
    ["Pagato dai clienti", eur(s.monthPaid), "Secondo lo stato degli ordini"],
    ["Da incassare", eur(s.monthOpen), "Residuo aperto sugli ordini del mese", s.monthOpen ? "is-warn" : ""],
    ["Da registrare", eur(toRegister), `${s.pending.length} incassi non ancora in prima nota`, toRegister ? "is-warn" : ""],
  ])}
  <section class="acw-panel"><div class="acw-panel-head"><div><h3>Ordini e pagamenti</h3><p>Apri un ordine per vederne il percorso, oppure registra l’incasso in prima nota.</p></div>
    <div class="acw-filters"><input type="search" data-order-query placeholder="Cerca numero o cliente…" value="${esc(ctx.orderQuery)}" aria-label="Cerca ordine"><select data-order-filter aria-label="Filtra ordini">${[["all", "Tutti"], ["open", "Da incassare"], ["paid", "Pagati"], ["register", "Da registrare"]].map(([v, l]) => `<option value="${v}" ${ctx.orderFilter === v ? "selected" : ""}>${l}</option>`).join("")}</select></div></div>
    <div data-orders-table>${ordersRows(s)}</div>
  </section>
  <div class="acw-grid">
    <section class="acw-panel"><div class="acw-panel-head"><div><h3>Accrediti del circuito</h3><p>Un accredito può raggruppare più ordini. Non è una nuova vendita e non si somma ai ricavi.</p></div><button type="button" class="acw-btn" data-new-payout ${isClosed() ? "disabled" : ""}>+ Riconcilia accredito</button></div>
      ${payouts.length ? payouts.map((p) => `<div class="acw-line"><div><strong>${esc(p.reference)}</strong><p>${fmtDate(p.date)} · ${p.orderIds.length} ordini · netto banca coincidente</p></div><div class="acw-right"><strong>${eur(p.bank)}</strong><br><button type="button" class="acw-link" data-payout-detail="${esc(p.id)}">Dettaglio →</button></div></div>`).join("") : `<p class="acw-empty-inline">Nessun accredito riconciliato in ${esc(monthLabel(ctx.month))}.</p>`}
    </section>
    <section class="acw-panel"><div class="acw-eyebrow">Come leggerlo</div><h3>Tre stati, tre significati</h3>
      ${[["Cliente ha pagato", "Chiude il credito verso il cliente."], ["Ordine spedito", "Descrive la logistica, non conferma un incasso."], ["Accredito riconciliato", "Il netto del circuito coincide con il movimento bancario."]].map(([t, p], i) => `<div class="acw-step"><b>${i + 1}</b><div><strong>${t}</strong><p>${p}</p></div></div>`).join("")}
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
  return `<section class="acw-panel"><div class="acw-filters is-wide">
      <input type="search" data-ledger-query placeholder="Cerca descrizione, riferimento o documento…" value="${esc(ctx.ledgerQuery)}" aria-label="Cerca movimento">
      <select data-ledger-type aria-label="Tipo movimento">${[["all", "Tutti"], ["income", "Entrate"], ["expense", "Uscite"], ["refund", "Rimborsi"]].map(([v, l]) => `<option value="${v}" ${ctx.ledgerType === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <button type="button" class="acw-btn" data-export="ledger">Esporta CSV</button>
    </div>
    <div data-ledger-table>${entriesTable(filteredLedger(s), s.list.length ? "Nessun movimento corrisponde alla ricerca." : `Nessun movimento registrato in ${monthLabel(ctx.month)}.`)}</div></section>`;
}

function renderReceipts(s) {
  const rows = receiptSummary(s.list);
  const included = rows.reduce((t, r) => t + r.count, 0);
  const tot = rows.reduce((t, r) => ({ gross: t.gross + r.gross, net: t.net + r.net, tax: t.tax + r.tax }), { gross: 0, net: 0, tax: 0 });
  const hint = !rows.length && (s.pending.length || s.unverified.length) ? `<p class="acw-hint">Ci sono ${s.pending.length + s.unverified.length} operazioni ancora da registrare o verificare: compariranno qui dopo la verifica. <button type="button" class="acw-link" data-go="review">Vai a Da verificare →</button></p>` : "";
  return `<div class="acw-notice">Prospetto gestionale da validare con il commercialista, non registro fiscale definitivo. Include solo movimenti <strong>verificati</strong> classificati come corrispettivo; i rimborsi entrano a segno negativo, le fatture sono escluse. Nessun invio fiscale.</div>
  <section class="acw-panel"><div class="acw-panel-head"><h3>${esc(monthLabel(ctx.month))}</h3>${pill(`${included} operazioni incluse`)}</div>
    <div class="acw-table-wrap"><table><thead><tr><th>Giorno</th><th>Aliquota</th><th>Operazioni</th><th class="acw-right">Imponibile</th><th class="acw-right">IVA</th><th class="acw-right">Lordo</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td><button type="button" class="acw-link" data-day="${esc(r.date)}">${fmtDate(r.date)} ↗</button></td><td>${r.rate}%</td><td>${r.count}</td><td class="acw-right">${eur(r.net)}</td><td class="acw-right">${eur(r.tax)}</td><td class="acw-right acw-amount">${eur(r.gross)}</td></tr>`).join("") || `<tr><td colspan="6" class="acw-empty">Nessun corrispettivo verificato in ${esc(monthLabel(ctx.month))}.</td></tr>`}
    ${rows.length ? `<tr class="acw-total"><td colspan="3"><strong>Totale corrispettivi inclusi</strong></td><td class="acw-right">${eur(tot.net)}</td><td class="acw-right">${eur(tot.tax)}</td><td class="acw-right acw-amount">${eur(tot.gross)}</td></tr>` : ""}
    </tbody></table></div>${hint}
    <div class="acw-actions-row"><button type="button" class="acw-btn" data-export="receipts">Esporta corrispettivi CSV</button></div>
  </section>`;
}

function renderReview(s) {
  if (!s.issues) {
    return `<section class="acw-panel"><div class="acw-empty">✓ Tutte le operazioni di ${esc(monthLabel(ctx.month))} sono registrate e verificate.<br><button type="button" class="acw-btn is-primary" data-go="close">Vai alla chiusura</button></div></section>`;
  }
  const pendingShown = s.pending.slice(0, ctx.pendingLimit);
  return `${s.pending.length ? `<section class="acw-panel"><div class="acw-panel-head"><div><h3>${s.pending.length === 1 ? "1 incasso degli ordini da registrare" : `${s.pending.length} incassi degli ordini da registrare`}</h3><p>Risultano incassati sugli ordini ma non sono in prima nota. La proposta è precompilata: controlla data, documento e aliquota prima di salvare.</p></div>${pill("Dagli ordini", "warn")}</div>
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
      ${[["Controlla le operazioni", step1], ["Chiudi il periodo", "La chiusura conserva una fotografia e blocca le modifiche al registro del mese. Non blocca le operazioni sugli ordini."], ["Scarica il prospetto", "CSV apribili in Excel: prima nota, corrispettivi, accrediti. Nessun invio automatico."]].map(([t, p], i) => `<div class="acw-step"><b>${i + 1}</b><div><strong>${t}</strong><p>${esc(p)}</p></div></div>`).join("")}
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
  section.classList.toggle("acw-on-payments", ctx.pane === "payments");
  try { ctx.onPaneChange?.(); } catch {}
}
function tabsHtml(issues) {
  return `<div class="acw-tabs" role="tablist" aria-label="Sezioni della contabilità">${TAB_ORDER.map((k) => {
    const label = k === "payments" ? PAYMENTS_LABEL : PAGES[k][0];
    const count = k === "review" && issues ? `<span class="acw-count">${issues}</span>` : "";
    return `<button type="button" role="tab" aria-selected="${ctx.pane === k}" class="${ctx.pane === k ? "is-active" : ""}" data-pane="${k}">${label}${count}</button>`;
  }).join("")}</div>`;
}
function draw() {
  const root = document.getElementById("accounting-workspace");
  if (!root) return;
  syncSection();
  if (ctx.pane === "payments") { root.innerHTML = tabsHtml(ctx.data ? summary().issues : 0); return; }
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
  else if (kind === "receipts") rows = [["Prospetto gestionale corrispettivi", ctx.month, state], ["Data", "Aliquota", "Operazioni", "Imponibile", "IVA", "Lordo"], ...receiptSummary(list).map((r) => [r.date, `${r.rate}%`, r.count, csvEur(r.net), csvEur(r.tax), csvEur(r.gross)])];
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
    ${order ? line("Ordine collegato", `<button type="button" class="acw-link" data-open-order="${esc(order.id)}">${esc(orderDisplayNumber(order))} ↗</button>`) : ""}
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
  d.querySelector("[data-open-order]")?.addEventListener("click", () => orderDetail(order));
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

function orderDetail(o) {
  if (!o) return;
  const registered = registeredCentsByOrder(ctx.data.entries).get(o.id) || 0;
  const pending = pendingCache.filter((p) => p.order.id === o.id);
  const payouts = ctx.data.payouts.filter((p) => p.orderIds.includes(o.id));
  const state = orderPaymentState(o);
  const d = dialog(`<div class="acw-eyebrow">Ordine · ${esc(String(o.source || "").startsWith("shopify") ? "Shopify" : "Manuale")}</div><h3>${esc(orderDisplayNumber(o))} · ${esc(orderCustomerName(o))}</h3>
    ${line("Data ordine", fmtDate(orderDate(o)))}
    ${line("Valore ordine", eurFromEuros(getOrderGrossTotal(o)))}
    ${line("Pagato dal cliente", eurFromEuros(getCollectedAmount(o)))}
    ${line("Da incassare", eurFromEuros(getOpenBalance(o)))}
    ${line("Stato pagamento", esc(state.label))}
    ${line("Spedizione", esc(orderShippingLabel(o)))}
    ${line("Documento richiesto", o.accounting?.invoiceRequired ? "Fattura" : "Corrispettivo")}
    ${line("Registrato in prima nota", registered ? eur(registered) : "Nulla")}
    ${line("Accredito", payouts.length ? payouts.map((p) => esc(p.reference)).join(", ") : "Nessuno collegato")}
    ${state.key === "refunded" ? `<p class="acw-hint">Il rimborso resta collegato all’ordine originale: registralo come «Rimborso cliente».</p>` : ""}
    <div class="acw-dialog-actions"><button type="button" class="acw-btn" data-cancel>Chiudi</button>
      <button type="button" class="acw-btn" data-action="select-order" data-id="${esc(o.id)}" data-view="accounting" data-open-card>Apri scheda ordine</button>
      ${pending.length && !isClosed() ? `<button type="button" class="acw-btn is-primary" data-register-from-order>Registra incasso ${eur(pending[0].cents)}</button>` : ""}</div>`);
  d.querySelector("[data-open-card]").addEventListener("click", () => { d.close(); setPane("payments"); });
  d.querySelector("[data-register-from-order]")?.addEventListener("click", () => { const s = suggestEntryFromPending(pending[0]); editEntry(s, { dateSource: s.dateSource }); });
}

function dayDetail(date) {
  const items = monthEntries().filter((e) => e.fiscalDate === date && e.verified && e.document === "receipt" && ["income", "refund"].includes(e.type));
  dialog(`<div class="acw-eyebrow">Corrispettivi</div><h3>${fmtDate(date)}</h3>
    ${items.map((e) => line(`<button type="button" class="acw-link" data-day-entry="${esc(e.id)}">${esc(e.label)}</button> · ${e.vatRate}%`, `${e.type === "refund" ? "−" : ""}${eur(e.cents)}`)).join("")}
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
    if (ds.order) { orderDetail(findOrder(ds.order)); return; }
    if (ds.registerOrder) { const p = pendingCache.find((x) => x.order.id === ds.registerOrder); if (p) { const s = suggestEntryFromPending(p); editEntry(s, { dateSource: s.dateSource }); } return; }
    if (ds.suggest) { const p = pendingCache[Number(ds.suggest)]; if (p) { const s = suggestEntryFromPending(p); editEntry(s, { dateSource: s.dateSource }); } return; }
    if (ds.day) { dayDetail(ds.day); return; }
    if (ds.payoutDetail) { payoutDetail(ds.payoutDetail); return; }
    if ("newPayout" in ds) { payoutForm(); return; }
    if (ds.export) { exportFile(ds.export); return; }
    if ("closeMonth" in ds) { closeMonth(); return; }
    if ("moreOrders" in ds) { ctx.orderLimit += PAGE_SIZE; redrawTable("[data-orders-table]", ordersRows(summary())); return; }
    if ("morePending" in ds) { ctx.pendingLimit += 30; draw(); }
  });
  root.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.matches("[data-ledger-query]")) { ctx.ledgerQuery = t.value; redrawLedger(); }
    else if (t.matches("[data-order-query]")) { ctx.orderQuery = t.value; ctx.orderLimit = PAGE_SIZE; redrawTable("[data-orders-table]", ordersRows(summary())); }
  });
  root.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.matches("[data-month]") && t.value) { ctx.month = t.value; ctx.orderLimit = PAGE_SIZE; ctx.pendingLimit = 30; draw(); }
    else if (t.matches("[data-ledger-type]")) { ctx.ledgerType = t.value; redrawLedger(); }
    else if (t.matches("[data-order-filter]")) { ctx.orderFilter = t.value; ctx.orderLimit = PAGE_SIZE; redrawTable("[data-orders-table]", ordersRows(summary())); }
  });
}
function redrawLedger() {
  const s = summary();
  redrawTable("[data-ledger-table]", entriesTable(filteredLedger(s), s.list.length ? "Nessun movimento corrisponde alla ricerca." : `Nessun movimento registrato in ${monthLabel(ctx.month)}.`));
}

// Chi apre un ordine in Contabilità da un'altra vista (dashboard, ricerca…)
// deve vederne il dettaglio, che sta nella scheda "Pagamenti ordini".
export function showAccountingPane(pane) {
  if (!TAB_ORDER.includes(pane)) return;
  const root = document.getElementById("accounting-workspace");
  if (root?.dataset.mounted) setPane(pane);
  else { ctx.pane = pane; try { localStorage.setItem(PANE_STORAGE_KEY, pane); } catch {} }
}

export function mountAccountingWorkspace(root, nextOrders, nextUserKey, { toast: toastFn, onPaneChange } = {}) {
  if (toastFn) ctx.toast = toastFn;
  if (onPaneChange) ctx.onPaneChange = onPaneChange;
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
