/**
 * Generazione PDF del DDT (documento di trasporto) per l'invio email
 * giornaliero automatico — stesso schema di lib/work-report-pdf.js
 * (PDFKit, deps iniettate, nessun accesso diretto a stato globale).
 *
 * Il PDF "Scarica PDF" del singolo DDT in app.js resta invariato (genera
 * bytes PDF grezzi client-side): questo modulo è un renderer INDIPENDENTE,
 * pensato per girare lato server senza browser, usato solo dall'invio
 * email giornaliero. Stessi campi, layout non pixel-identico.
 *
 * Output: Buffer del PDF A4.
 */

import PDFDocument from "pdfkit";

const MARGIN = 40;
const PAGE_W = 595.28; // A4 portrait in pt
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLOR_PRIMARY = "#1f4637";
const COLOR_MUTED = "#666666";
const COLOR_BORDER = "#cccccc";
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

function composeRecipientLines(order) {
  const ddt = order?.operations?.warehouse?.ddt || {};
  const rec = (ddt.recipient && typeof ddt.recipient === "object") ? ddt.recipient : null;
  const lines = [];
  const name = String(rec?.name || `${order?.firstName || ""} ${order?.lastName || ""}`.trim() || "—").trim();
  lines.push(name || "—");
  const address = String(rec?.address || order?.address || "").trim();
  if (address) lines.push(address);
  const cityRow = [
    rec?.postalCode || order?.postalCode || "",
    rec?.city || order?.city || "",
    (rec?.province || order?.provinceCode) ? `(${rec?.province || order?.provinceCode})` : "",
  ].filter(Boolean).join(" ");
  if (cityRow) lines.push(cityRow);
  const phone = rec?.phone || order?.phone || "";
  if (phone) lines.push(`Tel: ${phone}`);
  const email = rec?.email || order?.email || "";
  if (email) lines.push(`Email: ${email}`);
  return lines;
}

function getDdtLines(order) {
  const ddt = order?.operations?.warehouse?.ddt || {};
  if (Array.isArray(ddt.lines) && ddt.lines.length) return ddt.lines;
  if (Array.isArray(order?.lineDetails) && order.lineDetails.length) {
    return order.lineDetails.map((item) => ({ title: item.title || "", quantity: item.quantity || 1, note: "" }));
  }
  return [];
}

function drawHeader(doc, order, logoBuffer) {
  const startY = MARGIN;
  let textX = MARGIN;
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, MARGIN, startY, { width: 70 });
      textX = MARGIN + 85;
    } catch { /* logo non leggibile, salto */ }
  }
  const ddt = order?.operations?.warehouse?.ddt || {};
  doc
    .font("Helvetica-Bold").fontSize(16).fillColor(COLOR_PRIMARY)
    .text(`DDT ${String(ddt.number || order?.orderNumber || "").replace(/^D\.?D\.?T\.?\s*[-:]?\s*/i, "")}`, textX, startY + 5)
    .font("Helvetica").fontSize(9).fillColor(COLOR_MUTED)
    .text("Prato Sintetico Italia", textX, startY + 28);
  const boxX = PAGE_W - MARGIN - 160;
  const boxW = 160;
  doc.lineWidth(0.5).strokeColor(COLOR_BORDER).rect(boxX, startY, boxW, 55).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("DATA", boxX + 8, startY + 6)
    .font("Helvetica-Bold").fontSize(12).fillColor(COLOR_TEXT)
    .text(formatDate(ddt.createdAt || new Date().toISOString()), boxX + 8, startY + 17)
    .font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("ORDINE", boxX + 8, startY + 33)
    .font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
    .text(String(order?.orderNumber || "—"), boxX + 8, startY + 42);
  doc.moveTo(MARGIN, startY + 70).lineTo(PAGE_W - MARGIN, startY + 70)
    .strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
  doc.y = startY + 80;
  doc.fillColor(COLOR_TEXT);
}

function drawRecipientSection(doc, order) {
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLOR_PRIMARY).text("DESTINATARIO / SPEDIZIONE", MARGIN, doc.y);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT);
  const lines = composeRecipientLines(order);
  lines.forEach((line, index) => {
    doc.font(index === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(index === 0 ? 11 : 10)
      .text(line, MARGIN, doc.y, { width: CONTENT_W });
  });
  doc.moveDown(0.6);
}

function drawPalletSection(doc, order) {
  const ddt = order?.operations?.warehouse?.ddt || {};
  const dims = [ddt.palletLength, ddt.palletWidth, ddt.palletHeight].filter(Boolean).join(" x ");
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLOR_PRIMARY).text("BANCALE", MARGIN, doc.y);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT)
    .text(`Dimensioni: ${dims || "—"}`, MARGIN, doc.y)
    .text(`Peso reale: ${ddt.palletWeight || "—"}`, MARGIN, doc.y + 14);
  doc.y += 30;
}

function drawItemsSection(doc, order) {
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLOR_PRIMARY).text("ARTICOLI TRASPORTATI", MARGIN, doc.y);
  doc.moveDown(0.3);
  const colDescW = CONTENT_W - 100;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLOR_MUTED)
    .text("DESCRIZIONE", MARGIN, doc.y)
    .text("QTA", MARGIN + colDescW, doc.y, { width: 100, align: "right" });
  doc.y += 12;
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).strokeColor(COLOR_BORDER).lineWidth(0.3).stroke();
  doc.y += 4;
  const lines = getDdtLines(order);
  if (!lines.length) {
    doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT).text("Nessuna merce fisica da trasportare", MARGIN, doc.y);
    doc.y += 18;
  }
  lines.forEach((item) => {
    const startY = doc.y;
    doc.font("Helvetica").fontSize(9.5).fillColor(COLOR_TEXT)
      .text(String(item.title || "Prodotto"), MARGIN, startY, { width: colDescW - 10 });
    const afterTitleY = doc.y;
    doc.font("Helvetica").fontSize(9.5)
      .text(String(item.quantity || 1), MARGIN + colDescW, startY, { width: 100, align: "right" });
    doc.y = Math.max(afterTitleY, startY + 12) + 4;
  });
  doc.y += 10;
}

function drawSignaturesSection(doc) {
  const y = Math.min(doc.y, PAGE_H - MARGIN - 60);
  doc.y = y;
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
  doc.y += 10;
  const colW = CONTENT_W / 3 - 8;
  ["FIRMA MITTENTE", "FIRMA TRASPORTATORE", "FIRMA DESTINATARIO"].forEach((label, index) => {
    const x = MARGIN + index * (colW + 12);
    doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED).text(label, x, doc.y, { width: colW });
    doc.moveTo(x, doc.y + 30).lineTo(x + colW, doc.y + 30).strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
  });
}

function drawFooter(doc, order) {
  const y = PAGE_H - MARGIN - 14;
  doc.font("Helvetica").fontSize(7).fillColor(COLOR_MUTED)
    .text(
      `Documento generato da Prato Sintetico Italia — Ordine ${order?.orderNumber || ""}`,
      MARGIN, y, { width: CONTENT_W, align: "center" },
    );
}

/**
 * Genera il PDF del DDT per un ordine.
 * @param {Object} order — record ordine (con operations.warehouse.ddt).
 * @param {Object} deps
 * @param {Buffer} [deps.logoBuffer]
 * @returns {Promise<Buffer>}
 */
export async function generateDdtPdf(order, { logoBuffer } = {}) {
  if (!order) throw new Error("generateDdtPdf: missing order");
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    info: {
      Title: `DDT ${order?.operations?.warehouse?.ddt?.number || order?.orderNumber || ""}`,
      Author: "Prato Sintetico Italia",
      Subject: "Documento di trasporto",
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
  drawRecipientSection(doc, order);
  drawPalletSection(doc, order);
  drawItemsSection(doc, order);
  drawSignaturesSection(doc);
  drawFooter(doc, order);

  doc.end();
  return await donePromise;
}
