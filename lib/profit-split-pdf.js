/**
 * Generazione PDF dei conti pose (riparto utili).
 *
 * Due documenti, stesso stile del verbale (lib/work-report-pdf.js):
 *   - generateProfitSplitContoPdf:  un singolo conto, versione completa/trasparente
 *     (ricavo, costi, utile diviso, quota tua E quota collaboratore).
 *   - generateProfitSplitStatementPdf: estratto di un collaboratore — tutte le sue
 *     pose con totale aggregato di quanto gli spetta.
 *
 * Standalone: nessun accesso a DB/R2. logoBuffer (PNG/JPG) iniettato opzionale.
 * I numeri NON sono mai presi dal client: si ricalcolano qui con la stessa
 * formula condivisa (lib/profit-split.js) usata a schermo.
 *
 * Output: Buffer del PDF A4.
 */

import PDFDocument from "pdfkit";
import { computeProfitSplitScenario } from "./profit-split.js";

const MARGIN = 40;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLOR_PRIMARY = "#2d6a4f";   // verde PSI (--brand)
const COLOR_STRONG = "#1a2e23";    // verde scuro (--brand-strong)
const COLOR_MUTED = "#666666";
const COLOR_BORDER = "#cccccc";
const COLOR_SOFT = "#d8f3dc";      // verde soft (--brand-soft)
const COLOR_TEXT = "#1a1a1a";

function formatDate(isoOrDate) {
  if (!isoOrDate) return "—";
  try {
    return new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date(isoOrDate));
  } catch { return "—"; }
}

function formatEuro(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(num);
}

function payerLabel(payer, partnerName) {
  if (payer === "partner") return partnerName || "Collaboratore";
  if (payer === "shared") return "Condiviso";
  return "Tu";
}

function newDoc(title) {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN, info: { Title: title, Author: "Prato Sintetico Italia" } });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const donePromise = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  return { doc, donePromise };
}

function drawHeader(doc, { title, rightBox = [] }, logoBuffer) {
  const startY = MARGIN;
  let textX = MARGIN;
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, MARGIN, startY, { width: 70 });
      textX = MARGIN + 85;
    } catch { /* logo non leggibile */ }
  }
  doc
    .font("Helvetica-Bold").fontSize(16).fillColor(COLOR_PRIMARY)
    .text(title, textX, startY + 5)
    .font("Helvetica").fontSize(9).fillColor(COLOR_MUTED)
    .text("Prato Sintetico Italia", textX, startY + 28);
  if (rightBox.length) {
    const boxX = PAGE_W - MARGIN - 160;
    const boxW = 160;
    const boxH = 18 + rightBox.length * 19;
    doc.lineWidth(0.5).strokeColor(COLOR_BORDER).rect(boxX, startY, boxW, boxH).stroke();
    let by = startY + 7;
    rightBox.forEach((pair) => {
      doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED).text(pair.label.toUpperCase(), boxX + 8, by);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
        .text(pair.value || "—", boxX + 8, by + 8, { width: boxW - 16, ellipsis: true });
      by += 19;
    });
  }
  doc.moveTo(MARGIN, startY + 70).lineTo(PAGE_W - MARGIN, startY + 70).strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
  doc.y = startY + 80;
  doc.fillColor(COLOR_TEXT);
}

function drawSectionTitle(doc, title) {
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLOR_PRIMARY).text(title.toUpperCase(), MARGIN, doc.y);
  const y = doc.y + 2;
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).strokeColor(COLOR_BORDER).lineWidth(0.3).stroke();
  doc.y = y + 6;
  doc.fillColor(COLOR_TEXT).font("Helvetica").fontSize(10);
}

function drawKeyValueRow(doc, pairs, columns = 2) {
  const colW = CONTENT_W / columns;
  const rowH = 22;
  const startY = doc.y;
  pairs.forEach((p, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const x = MARGIN + col * colW;
    const y = startY + row * rowH;
    doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED).text(p.label.toUpperCase(), x, y);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
      .text(p.value || "—", x, y + 9, { width: colW - 10, ellipsis: true });
  });
  const totalRows = Math.ceil(pairs.length / columns);
  doc.y = startY + totalRows * rowH + 4;
}

// Tabella generica a 3 colonne (descrizione | meta | importo a destra).
function drawAmountTable(doc, { head, rows, total }) {
  const amountW = 90;
  const metaW = 110;
  const descW = CONTENT_W - amountW - metaW;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLOR_MUTED)
    .text(head[0], MARGIN, doc.y)
    .text(head[1], MARGIN + descW, doc.y, { width: metaW })
    .text(head[2], MARGIN + descW + metaW, doc.y, { width: amountW, align: "right" });
  doc.y += 12;
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).strokeColor(COLOR_BORDER).lineWidth(0.3).stroke();
  doc.y += 4;
  rows.forEach((r) => {
    const top = doc.y;
    doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT).text(r.desc, MARGIN, top, { width: descW - 8 });
    const descBottom = doc.y;
    doc.font("Helvetica").fontSize(9).fillColor(COLOR_MUTED).text(r.meta || "", MARGIN + descW, top, { width: metaW });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
      .text(formatEuro(r.amount), MARGIN + descW + metaW, top, { width: amountW, align: "right" });
    doc.y = Math.max(descBottom, top + 14);
  });
  if (total) {
    doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
    doc.y += 4;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
      .text(total.label, MARGIN, doc.y, { width: descW + metaW - 8, align: "right" })
      .text(formatEuro(total.amount), MARGIN + descW + metaW, doc.y, { width: amountW, align: "right" });
    doc.y += 18;
  }
}

// Due riquadri affiancati con l'esito del riparto.
function drawSplitBoxes(doc, { leftLabel, leftValue, rightLabel, rightValue }) {
  const gap = 12;
  const boxW = (CONTENT_W - gap) / 2;
  const boxH = 54;
  const top = doc.y;
  [[MARGIN, leftLabel, leftValue], [MARGIN + boxW + gap, rightLabel, rightValue]].forEach(([x, label, value]) => {
    doc.save().rect(x, top, boxW, boxH).fill(COLOR_SOFT).restore();
    doc.font("Helvetica").fontSize(9).fillColor(COLOR_STRONG).text(label.toUpperCase(), x + 12, top + 10, { width: boxW - 24 });
    doc.font("Helvetica-Bold").fontSize(18).fillColor(COLOR_STRONG).text(formatEuro(value), x + 12, top + 24, { width: boxW - 24 });
  });
  doc.y = top + boxH + 8;
  doc.fillColor(COLOR_TEXT);
}

/**
 * PDF di un singolo conto posa (versione completa/trasparente).
 * `conto` è il draft salvato (profitSplit) + info commessa per l'intestazione.
 */
export async function generateProfitSplitContoPdf(conto = {}, { logoBuffer, lang = "it" } = {}) {
  const { doc, donePromise } = newDoc("Conto posa");
  const r = computeProfitSplitScenario(conto, lang);
  const partner = r.partnerName || "Collaboratore";
  const jobLabel = String(conto.jobLabel || "").trim() || "Conto posa";

  drawHeader(doc, {
    title: "CONTO POSA",
    rightBox: [
      { label: "Commessa", value: String(conto.orderNumber || "—") },
      { label: "Data", value: formatDate(conto.savedAt) },
    ],
  }, logoBuffer);

  drawSectionTitle(doc, "Commessa e collaboratore");
  drawKeyValueRow(doc, [
    { label: "Commessa", value: jobLabel },
    { label: "Cliente", value: conto.clientName || "—" },
    { label: "Collaboratore", value: partner },
    { label: "Località", value: conto.city || "—" },
    { label: "Giornate", value: String(r.partnerDays) },
    { label: "Fisso giornaliero", value: formatEuro(r.partnerDailyFixed) },
    { label: "Quota collaboratore", value: `${r.partnerSharePct}%` },
    { label: "Quota tua", value: `${r.ownerSharePct}%` },
  ]);

  drawSectionTitle(doc, "Spese e costi");
  const expenseRows = r.expenseLines.filter((l) => l.isFilled).map((l) => ({
    desc: l.displayLabel,
    meta: payerLabel(l.payer, partner),
    amount: l.amountValue,
  }));
  if (r.partnerFixedTotal > 0) {
    expenseRows.push({ desc: "Fisso collaboratore", meta: `${r.partnerDays} gg × ${formatEuro(r.partnerDailyFixed)}`, amount: r.partnerFixedTotal });
  }
  if (r.ownerRecovery > 0) expenseRows.push({ desc: "Recuperi tuoi", meta: "Tu", amount: r.ownerRecovery });
  if (r.partnerRecovery > 0) expenseRows.push({ desc: "Recuperi collaboratore", meta: partner, amount: r.partnerRecovery });
  if (expenseRows.length) {
    drawAmountTable(doc, {
      head: ["DESCRIZIONE", "PAGATO DA", "IMPORTO"],
      rows: expenseRows,
      total: { label: "Totale costi dedotti", amount: r.deductibleCosts },
    });
  } else {
    doc.font("Helvetica").fontSize(10).fillColor(COLOR_MUTED).text("Nessuna spesa registrata.", MARGIN, doc.y);
    doc.y += 16;
  }

  drawSectionTitle(doc, "Riparto utile");
  drawKeyValueRow(doc, [
    { label: "Ricavo posa", value: formatEuro(r.revenue) },
    { label: "Costi dedotti", value: formatEuro(r.deductibleCosts) },
    { label: "Utile da dividere", value: formatEuro(r.divisibleProfit) },
    { label: `Quota utile ${partner}`, value: formatEuro(r.partnerProfitShare) },
    { label: "Quota utile tua", value: formatEuro(r.ownerProfitShare) },
    { label: "Quadratura", value: Math.abs(r.reconciliationGap) <= 0.02 ? "OK" : formatEuro(r.reconciliationGap) },
  ]);

  doc.moveDown(0.4);
  drawSplitBoxes(doc, {
    leftLabel: `Spetta a ${partner}`,
    leftValue: r.partnerDue,
    rightLabel: "Spetta a te",
    rightValue: r.ownerDue,
  });

  const note = String(conto.note || "").trim();
  if (note) {
    drawSectionTitle(doc, "Note di quadratura");
    doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT).text(note, MARGIN, doc.y, { width: CONTENT_W });
  }

  doc.end();
  return await donePromise;
}

/**
 * PDF estratto collaboratore: tutte le pose di una persona + totale spettante.
 * `entries`: [{ jobLabel, orderNumber, savedAt, revenue, partnerDue }] già
 * ricalcolate dal server. `totalDue`/`totalRevenue` sono i totali aggregati.
 */
export async function generateProfitSplitStatementPdf({ partnerName, entries = [], totalDue = 0, totalRevenue = 0, generatedAt } = {}, { logoBuffer } = {}) {
  const { doc, donePromise } = newDoc("Estratto collaboratore");
  const partner = String(partnerName || "Collaboratore").trim();

  drawHeader(doc, {
    title: "ESTRATTO COLLABORATORE",
    rightBox: [
      { label: "Collaboratore", value: partner },
      { label: "Generato il", value: formatDate(generatedAt || new Date().toISOString()) },
    ],
  }, logoBuffer);

  drawSectionTitle(doc, "Pose registrate");
  if (entries.length) {
    drawAmountTable(doc, {
      head: ["COMMESSA", "DATA", "SPETTA"],
      rows: entries.map((e) => ({
        desc: String(e.jobLabel || e.orderNumber || "—"),
        meta: formatDate(e.savedAt),
        amount: e.partnerDue,
      })),
      total: { label: `Totale spettante a ${partner}`, amount: totalDue },
    });
    doc.moveDown(0.4);
    drawSplitBoxes(doc, {
      leftLabel: `Ricavo totale (${entries.length} pose)`,
      leftValue: totalRevenue,
      rightLabel: "Totale spettante",
      rightValue: totalDue,
    });
  } else {
    doc.font("Helvetica").fontSize(10).fillColor(COLOR_MUTED).text("Nessun conto registrato per questo collaboratore.", MARGIN, doc.y);
  }

  doc.end();
  return await donePromise;
}
