/**
 * Generazione PDF del DDT (documento di trasporto) per l'invio email
 * giornaliero automatico — stesso schema di lib/work-report-pdf.js
 * (PDFKit, deps iniettate, nessun accesso diretto a stato globale).
 *
 * Il PDF "Scarica PDF" del singolo DDT in app.js resta invariato (genera
 * bytes PDF grezzi client-side): questo modulo è un renderer INDIPENDENTE,
 * pensato per girare lato server senza browser. Layout allineato a quello
 * client (stesse sezioni/etichette/bordi) — pixel-identico non è
 * l'obiettivo, ma non deve più sembrare "un altro documento".
 *
 * Limite noto: "COSTO STIMATO" non è riprodotto (mostra "—") perché il
 * calcolo tariffe corriere (One Express / manuale) vive solo lato client
 * in calculateShippingEstimate() e non è persistito sul DDT — portarlo
 * qui richiederebbe duplicare l'intero motore tariffe. Tutto il resto
 * (peso, bancale, destinatario, articoli) è invariato.
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

function composeRecipientLines(order) {
  const ddt = order?.operations?.warehouse?.ddt || {};
  const rec = (ddt.recipient && typeof ddt.recipient === "object") ? ddt.recipient : null;
  const lines = [];
  const name = String(rec?.name || `${order?.firstName || ""} ${order?.lastName || ""}`.trim() || "—").trim();
  lines.push({ text: name || "—", bold: true, size: 11 });
  const address = String(rec?.address || order?.address || "").trim();
  if (address) lines.push({ text: address, size: 9.5 });
  const cityRow = [
    rec?.postalCode || order?.postalCode || "",
    rec?.city || order?.city || "",
    (rec?.province || order?.provinceCode) ? `(${rec?.province || order?.provinceCode})` : "",
  ].filter(Boolean).join(" ");
  if (cityRow) lines.push({ text: cityRow, size: 9.5 });
  const phone = rec?.phone || order?.phone || "";
  if (phone) lines.push({ text: `Tel: ${phone} · PREAVVISO TELEFONICO`, size: 9.5 });
  const email = rec?.email || order?.email || "";
  if (email) lines.push({ text: `Email: ${email}`, size: 9.5 });
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

// Larghezza x Lunghezza x Altezza — stesso ordine di formatPalletDimensions
// lato client (non L x W x H: invertirli fa apparire un bancale deforme).
function formatPalletDimensions(ddt = {}) {
  const parts = [ddt.palletWidth, ddt.palletLength, ddt.palletHeight]
    .map((item) => String(item || "").replace(/\s*cm$/i, "").trim())
    .filter(Boolean);
  return parts.length ? parts.join("x") : "—";
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
    .text("81025 Marcianise (CE)", 348, startY + 29, { width: 207, align: "right" })
    .text("www.pratosinteticoitalia.com", 348, startY + 40, { width: 207, align: "right" });

  const ddt = order?.operations?.warehouse?.ddt || {};
  const boxY = startY + 58;
  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, boxY, CONTENT_W, 44).stroke();
  const printableNumber = String(ddt.number || order?.orderNumber || "").replace(/^D\.?D\.?T\.?\s*[-:]?\s*/i, "");
  doc.font("Helvetica-Bold").fontSize(18).fillColor(COLOR_PRIMARY)
    .text(`DDT ${printableNumber}`, MARGIN + 10, boxY + 8, { width: 340 });
  doc.font("Helvetica").fontSize(9).fillColor(COLOR_MUTED)
    .text(`Ordine ${order?.orderNumber || "—"} · ${composeRecipientLines(order)[0]?.text || "—"}`, MARGIN + 10, boxY + 29, { width: 340, ellipsis: true });
  doc.font("Helvetica").fontSize(9).fillColor(COLOR_MUTED)
    .text("Data", MARGIN + 360, boxY + 8)
    .font("Helvetica-Bold").fontSize(11).fillColor(COLOR_TEXT)
    .text(formatDate(ddt.createdAt || new Date().toISOString()), MARGIN + 360, boxY + 19);
  if (order?.createdAt) {
    doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
      .text(`Ordine Shopify ${formatDate(order.createdAt)}`, MARGIN + 360, boxY + 34);
  }
  doc.y = boxY + 44 + 14;
  doc.fillColor(COLOR_TEXT);
}

function drawRecipientAndPalletSection(doc, order) {
  const startY = doc.y;
  const leftW = CONTENT_W * 0.62;
  const rightX = MARGIN + leftW + 10;
  const rightW = CONTENT_W - leftW - 10;
  const boxH = 100;

  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, startY, leftW, boxH).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("DESTINATARIO / SPEDIZIONE", MARGIN + 10, startY + 8);
  let lineY = startY + 22;
  composeRecipientLines(order).slice(0, 5).forEach((line) => {
    doc.font(line.bold ? "Helvetica-Bold" : "Helvetica").fontSize(line.size || 9.5).fillColor(COLOR_TEXT)
      .text(line.text, MARGIN + 10, lineY, { width: leftW - 20 });
    lineY += (line.size || 9.5) + 4;
  });

  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(rightX, startY, rightW, boxH).stroke();
  const ddt = order?.operations?.warehouse?.ddt || {};
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("BANCALE", rightX + 10, startY + 8)
    .font("Helvetica-Bold").fontSize(13).fillColor(COLOR_TEXT)
    .text(formatPalletDimensions(ddt), rightX + 10, startY + 20)
    .font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("PESO REALE", rightX + 10, startY + 44)
    .font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
    .text(ddt.palletWeight || "—", rightX + 10, startY + 55)
    .font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("COSTO STIMATO", rightX + 10, startY + 74)
    .font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
    .text("—", rightX + 10, startY + 85);

  doc.y = startY + boxH + 14;
}

function drawItemsSection(doc, order) {
  const startY = doc.y;
  const lines = getDdtLines(order);
  const descW = CONTENT_W - 130;
  const qtyX = MARGIN + descW;
  const noteX = MARGIN + descW + 45;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("ARTICOLI TRASPORTATI", MARGIN + 10, startY + 8)
    .text("QTA", qtyX, startY + 8, { width: 40, align: "right" })
    .text("NOTE", noteX, startY + 8, { width: CONTENT_W - descW - 55 });
  doc.moveTo(MARGIN + 10, startY + 20).lineTo(MARGIN + CONTENT_W - 10, startY + 20)
    .strokeColor(COLOR_BORDER).lineWidth(0.4).stroke();

  let rowY = startY + 28;
  if (!lines.length) {
    doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT)
      .text("Nessuna merce fisica da trasportare", MARGIN + 10, rowY);
    rowY += 18;
  }
  lines.forEach((item) => {
    const titleY = rowY;
    doc.font("Helvetica").fontSize(9.5).fillColor(COLOR_TEXT)
      .text(String(item.title || "Prodotto"), MARGIN + 10, titleY, { width: descW - 10 });
    const afterTitleY = doc.y;
    doc.font("Helvetica").fontSize(9.5)
      .text(String(item.quantity || 1), qtyX, titleY, { width: 40, align: "right" });
    if (item.note) {
      doc.font("Helvetica").fontSize(8.5).fillColor(COLOR_MUTED)
        .text(String(item.note), noteX, titleY, { width: CONTENT_W - descW - 55 });
    }
    rowY = Math.max(afterTitleY, titleY + 12) + 6;
  });

  const boxH = Math.max(120, rowY - startY + 10);
  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, startY, CONTENT_W, boxH).stroke();
  doc.y = startY + boxH + 16;
}

function drawSignaturesSection(doc) {
  // `y` va fissato UNA volta prima del ciclo: .text() sposta doc.y come
  // effetto collaterale, quindi leggerlo di nuovo ad ogni iterazione faceva
  // "ereditare" alla casella successiva lo spostamento lasciato dall'etichetta
  // di quella precedente — da qui le tre caselle disallineate in verticale.
  const y = Math.min(doc.y, PAGE_H - MARGIN - 70);
  const colW = CONTENT_W / 3 - 8;
  ["FIRMA MITTENTE", "FIRMA TRASPORTATORE", "FIRMA DESTINATARIO"].forEach((label, index) => {
    const x = MARGIN + index * (colW + 12);
    doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(x, y, colW, 40).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED).text(label, x, y + 44, { width: colW });
  });
  doc.y = y + 44 + 12;
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
  drawRecipientAndPalletSection(doc, order);
  drawItemsSection(doc, order);
  drawSignaturesSection(doc);
  drawFooter(doc, order);

  doc.end();
  return await donePromise;
}
