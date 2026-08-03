/**
 * Generazione PDF "scheda cantiere" — riepilogo di una posa (cliente,
 * indirizzo, prodotto, mq, data/ora, squadra, note) scaricabile con un tap
 * dal dettaglio posa mobile, utile alla squadra sul furgone senza dover
 * riaprire l'app per ritrovare i dati. Stesso schema di lib/ddt-pdf.js
 * (PDFKit, deps iniettate, nessun accesso diretto a stato globale).
 *
 * A differenza del verbale di fine cantiere (lib/work-report-pdf.js) NON
 * viene persistito né archiviato: si rigenera al volo dai dati correnti
 * dell'ordine ad ogni richiesta, quindi mostra sempre lo stato più recente.
 *
 * Output: Buffer del PDF A4 (una sola pagina).
 */

import PDFDocument from "pdfkit";

const MARGIN = 40;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLOR_PRIMARY = "#1f4637";
const COLOR_MUTED = "#666666";
const COLOR_BORDER = "#999999";
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

function composeClientLines(order) {
  const lines = [];
  const name = `${order?.firstName || ""} ${order?.lastName || ""}`.trim() || "—";
  lines.push({ text: name, bold: true, size: 12 });
  const address = String(order?.address || "").trim();
  const cityRow = [order?.postalCode, order?.city, order?.provinceCode ? `(${order.provinceCode})` : ""]
    .filter(Boolean).join(" ");
  if (address) lines.push({ text: address, size: 10 });
  if (cityRow) lines.push({ text: cityRow, size: 10 });
  if (order?.phone) lines.push({ text: `Tel: ${order.phone}`, size: 10 });
  return lines;
}

function drawHeader(doc, order, logoBuffer) {
  const startY = MARGIN;
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, MARGIN, startY, { width: 60 });
    } catch { /* logo non leggibile, salto */ }
  }
  doc
    .font("Helvetica-Bold").fontSize(11).fillColor(COLOR_TEXT)
    .text("PRATO SINTETICO ITALIA", 348, startY + 3, { width: 207, align: "right" })
    .font("Helvetica").fontSize(8.5).fillColor(COLOR_MUTED)
    .text("Vertex Srls · Via Ottorino Respighi 57", 348, startY + 18, { width: 207, align: "right" })
    .text("81025 Marcianise (CE)", 348, startY + 29, { width: 207, align: "right" });

  const boxY = startY + 50;
  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, boxY, CONTENT_W, 40).stroke();
  doc.font("Helvetica-Bold").fontSize(17).fillColor(COLOR_PRIMARY)
    .text("SCHEDA CANTIERE", MARGIN + 10, boxY + 10, { width: 340 });
  doc.font("Helvetica").fontSize(9).fillColor(COLOR_MUTED)
    .text("Ordine", MARGIN + 360, boxY + 8)
    .font("Helvetica-Bold").fontSize(11).fillColor(COLOR_TEXT)
    .text(order?.orderNumber || "—", MARGIN + 360, boxY + 19);
  doc.y = boxY + 40 + 14;
  doc.fillColor(COLOR_TEXT);
}

function drawClientSection(doc, order) {
  const startY = doc.y;
  const boxH = 90;
  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, startY, CONTENT_W, boxH).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("CLIENTE / INDIRIZZO", MARGIN + 10, startY + 8);
  let lineY = startY + 22;
  composeClientLines(order).forEach((line) => {
    doc.font(line.bold ? "Helvetica-Bold" : "Helvetica").fontSize(line.size || 10).fillColor(COLOR_TEXT)
      .text(line.text, MARGIN + 10, lineY, { width: CONTENT_W - 20 });
    lineY += (line.size || 10) + 5;
  });
  doc.y = startY + boxH + 14;
}

function drawJobSection(doc, order, sqm) {
  const install = order?.operations?.installation || {};
  const startY = doc.y;
  const colW = CONTENT_W / 2 - 6;
  const boxH = 90;

  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, startY, colW, boxH).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("PRODOTTO", MARGIN + 10, startY + 8)
    .font("Helvetica-Bold").fontSize(12).fillColor(COLOR_TEXT)
    .text(String(order?.operations?.product || "—"), MARGIN + 10, startY + 20, { width: colW - 20 })
    .font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("MQ", MARGIN + 10, startY + 58)
    .font("Helvetica-Bold").fontSize(12).fillColor(COLOR_TEXT)
    .text(sqm > 0 ? `${sqm} mq` : "—", MARGIN + 10, startY + 69);

  const rightX = MARGIN + colW + 12;
  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(rightX, startY, colW, boxH).stroke();
  const dateLabel = [install.installDate ? formatDate(install.installDate) : "", install.installTime || ""]
    .filter(Boolean).join(" · ");
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("DATA / ORA POSA", rightX + 10, startY + 8)
    .font("Helvetica-Bold").fontSize(12).fillColor(COLOR_TEXT)
    .text(dateLabel || "Da definire", rightX + 10, startY + 20, { width: colW - 20 })
    .font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("SQUADRA", rightX + 10, startY + 58)
    .font("Helvetica-Bold").fontSize(12).fillColor(COLOR_TEXT)
    .text(String(install.crew || "—"), rightX + 10, startY + 69);

  doc.y = startY + boxH + 14;
}

function drawNotesSection(doc, order) {
  const note = String(order?.operations?.installation?.reportNote || "").trim();
  const startY = doc.y;
  const boxH = 120;
  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, startY, CONTENT_W, boxH).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("NOTE SQUADRA / CANTIERE", MARGIN + 10, startY + 8);
  doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT)
    .text(note || "Nessuna nota.", MARGIN + 10, startY + 22, { width: CONTENT_W - 20, height: boxH - 30 });
  doc.y = startY + boxH + 14;
}

function drawFooter(doc, order) {
  const y = PAGE_H - MARGIN - 14;
  doc.font("Helvetica").fontSize(7).fillColor(COLOR_MUTED)
    .text(
      `Documento generato da Prato Sintetico Italia — Ordine ${order?.orderNumber || ""} — ${formatDate(new Date().toISOString())}`,
      MARGIN, y, { width: CONTENT_W, align: "center" },
    );
}

/**
 * Genera il PDF della scheda cantiere per un ordine.
 * @param {Object} order — record ordine (con operations.installation).
 * @param {Object} deps
 * @param {Buffer} [deps.logoBuffer]
 * @param {number} [deps.sqm] — mq da mostrare; se omesso usa order.operations?.sqm.
 * @returns {Promise<Buffer>}
 */
export async function generateSiteSheetPdf(order, { logoBuffer, sqm } = {}) {
  if (!order) throw new Error("generateSiteSheetPdf: missing order");
  const resolvedSqm = Number.isFinite(sqm) && sqm > 0 ? sqm : Number(order?.operations?.sqm) || 0;
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    info: {
      Title: `Scheda cantiere ${order?.orderNumber || ""}`,
      Author: "Prato Sintetico Italia",
      Subject: "Scheda cantiere",
      Creator: "PSI Ops",
    },
  });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const donePromise = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawHeader(doc, order, logoBuffer);
  drawClientSection(doc, order);
  drawJobSection(doc, order, resolvedSqm);
  drawNotesSection(doc, order);
  drawFooter(doc, order);

  doc.end();
  return await donePromise;
}
