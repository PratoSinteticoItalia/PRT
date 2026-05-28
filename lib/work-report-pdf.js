/**
 * Generazione PDF del verbale di fine cantiere (work_completion_reports).
 *
 * Standalone: niente accesso diretto a R2/DB. Le dipendenze sono iniettate:
 *   - fetchR2Buffer(objectKey) → Promise<Buffer | null>  (per foto + firme)
 *   - logoBuffer (opzionale)                              (PNG/JPG buffer per header)
 *
 * Output: Buffer del PDF A4 (~2-5 pagine tipicamente).
 *
 * Layout (MVP):
 *   Pagina 1: header, dati cliente+cantiere, dati lavoro, note, extras, scarico, firme
 *   Pagina N: foto cantiere in griglia 2x2 (se presenti)
 */

import PDFDocument from "pdfkit";

const MARGIN = 40;
const PAGE_W = 595.28;  // A4 portrait in pt
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

const COLOR_PRIMARY = "#2d5016";   // verde PSI (placeholder, vedi branding reale)
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

function formatDateTime(isoOrDate) {
  if (!isoOrDate) return "—";
  try {
    return new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(isoOrDate));
  } catch { return "—"; }
}

function formatEuro(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(num);
}

function computeHours(start, end) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return (ms / 3_600_000).toFixed(1);
}

const DEFAULT_LIABILITY_TEXT =
  "Il cliente dichiara di aver verificato l'esecuzione dei lavori a regola d'arte, " +
  "ne accetta lo stato di consegna ed esonera la ditta da ogni responsabilità per " +
  "interventi successivi su materiali o strutture non installati direttamente da " +
  "Prato Sintetico Italia, salvo difetti palesi o vizi occulti coperti dalle garanzie " +
  "di legge. La firma del presente verbale costituisce conferma della consegna lavori.";

/**
 * Sezione header verbale.
 */
function drawHeader(doc, report, logoBuffer) {
  const startY = MARGIN;
  let textX = MARGIN;
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, MARGIN, startY, { width: 70 });
      textX = MARGIN + 85;
    } catch { /* logo non leggibile, salto */ }
  }
  doc
    .font("Helvetica-Bold").fontSize(16).fillColor(COLOR_PRIMARY)
    .text("VERBALE DI FINE LAVORI", textX, startY + 5)
    .font("Helvetica").fontSize(9).fillColor(COLOR_MUTED)
    .text("Prato Sintetico Italia", textX, startY + 28);
  // box numero + data a destra
  const boxX = PAGE_W - MARGIN - 160;
  const boxW = 160;
  doc.lineWidth(0.5).strokeColor(COLOR_BORDER).rect(boxX, startY, boxW, 55).stroke();
  doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("NUMERO", boxX + 8, startY + 6)
    .font("Helvetica-Bold").fontSize(12).fillColor(COLOR_TEXT)
    .text(String(report.id || "—"), boxX + 8, startY + 17)
    .font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("DATA FIRMA", boxX + 8, startY + 33)
    .font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
    .text(formatDate(report.signedAt || new Date().toISOString()), boxX + 8, startY + 42);
  doc.moveTo(MARGIN, startY + 70).lineTo(PAGE_W - MARGIN, startY + 70)
    .strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
  doc.y = startY + 80;
  doc.fillColor(COLOR_TEXT);
}

function drawSectionTitle(doc, title) {
  doc.moveDown(0.4);
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLOR_PRIMARY)
    .text(title.toUpperCase(), MARGIN, doc.y);
  const y = doc.y + 2;
  doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y)
    .strokeColor(COLOR_BORDER).lineWidth(0.3).stroke();
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

function drawClientSection(doc, report) {
  drawSectionTitle(doc, "Cliente e cantiere");
  drawKeyValueRow(doc, [
    { label: "Cliente",        value: report.customerName || "—" },
    { label: "Email",          value: report.customerEmail || "—" },
    { label: "Indirizzo cantiere", value: report.siteAddress || "—" },
    { label: "Riferimento ordine", value: report.orderId || "—" },
  ]);
}

function drawWorkSection(doc, report) {
  drawSectionTitle(doc, "Lavorazione eseguita");
  const hours = computeHours(report.workHoursStart, report.workHoursEnd);
  const operators = Array.isArray(report.operators) ? report.operators.join(", ") : "";
  drawKeyValueRow(doc, [
    { label: "Mq posati",      value: report.executedSqm != null ? `${report.executedSqm} m²` : "—" },
    { label: "Modello prato",  value: report.productModel || "—" },
    { label: "Squadra",        value: report.crewName || "—" },
    { label: "Operatori",      value: operators || "—" },
    { label: "Inizio lavori",  value: formatDateTime(report.workHoursStart) },
    { label: "Fine lavori",    value: formatDateTime(report.workHoursEnd) },
    { label: "Ore totali",     value: hours ? `${hours} h` : "—" },
  ]);
  if (report.notes && String(report.notes).trim()) {
    doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED).text("NOTE TECNICHE", MARGIN, doc.y);
    doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT)
      .text(String(report.notes).trim(), MARGIN, doc.y + 11, { width: CONTENT_W });
    doc.moveDown(0.4);
  }
}

function drawExtrasSection(doc, report) {
  const extras = Array.isArray(report.extras) ? report.extras.filter(Boolean) : [];
  if (!extras.length) return;
  drawSectionTitle(doc, "Extra concordati in cantiere");
  const rowH = 18;
  const descW = CONTENT_W - 100;
  // Header
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLOR_MUTED)
    .text("DESCRIZIONE", MARGIN, doc.y)
    .text("IMPORTO", MARGIN + descW, doc.y, { width: 100, align: "right" });
  doc.y += 12;
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).strokeColor(COLOR_BORDER).lineWidth(0.3).stroke();
  doc.y += 4;
  let total = 0;
  for (const extra of extras) {
    const desc = String(extra.description || extra.label || "—").trim();
    const amount = Number(extra.amount_eur ?? extra.amount ?? 0);
    if (Number.isFinite(amount)) total += amount;
    doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT)
      .text(desc, MARGIN, doc.y, { width: descW - 10 })
      .text(formatEuro(amount), MARGIN + descW, doc.y, { width: 100, align: "right" });
    doc.y += rowH;
  }
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_W - MARGIN, doc.y).strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
  doc.y += 4;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
    .text("Totale extra", MARGIN, doc.y, { width: descW - 10, align: "right" })
    .text(formatEuro(total), MARGIN + descW, doc.y, { width: 100, align: "right" });
  doc.y += 20;
}

function drawLiabilitySection(doc, report) {
  drawSectionTitle(doc, "Scarico di responsabilità");
  const text = String(report.liabilityText || DEFAULT_LIABILITY_TEXT).trim();
  doc.font("Helvetica").fontSize(9).fillColor(COLOR_TEXT)
    .text(text, MARGIN, doc.y, { width: CONTENT_W, align: "justify" });
  doc.moveDown(0.5);
}

async function drawSignaturesSection(doc, report, fetchR2Buffer) {
  drawSectionTitle(doc, "Firme");
  const colW = CONTENT_W / 2 - 10;
  const boxH = 70;
  const startY = doc.y;
  // Box cliente
  doc.rect(MARGIN, startY, colW, boxH).strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
  if (report.customerSignatureR2Key) {
    try {
      const buf = await fetchR2Buffer(report.customerSignatureR2Key);
      if (buf) doc.image(buf, MARGIN + 5, startY + 5, { fit: [colW - 10, boxH - 10] });
    } catch { /* skip */ }
  }
  doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("FIRMA CLIENTE", MARGIN, startY + boxH + 4)
    .font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
    .text(report.customerName || "—", MARGIN, startY + boxH + 14);
  // Box posatore
  const crewX = MARGIN + colW + 20;
  doc.rect(crewX, startY, colW, boxH).strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
  if (report.crewSignatureR2Key) {
    try {
      const buf = await fetchR2Buffer(report.crewSignatureR2Key);
      if (buf) doc.image(buf, crewX + 5, startY + 5, { fit: [colW - 10, boxH - 10] });
    } catch { /* skip */ }
  }
  const operators = Array.isArray(report.operators) ? report.operators.join(", ") : "";
  doc.font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("FIRMA POSATORE", crewX, startY + boxH + 4)
    .font("Helvetica-Bold").fontSize(10).fillColor(COLOR_TEXT)
    .text(`${report.crewName || "—"}${operators ? " — " + operators : ""}`, crewX, startY + boxH + 14, { width: colW });
  doc.y = startY + boxH + 30;
}

async function drawPhotosPage(doc, report, fetchR2Buffer) {
  const photos = Array.isArray(report.photos) ? report.photos.filter((p) => p?.objectKey) : [];
  if (!photos.length) return;
  doc.addPage({ size: "A4", margin: MARGIN });
  doc.font("Helvetica-Bold").fontSize(14).fillColor(COLOR_PRIMARY).text("FOTO CANTIERE", MARGIN, MARGIN);
  doc.moveTo(MARGIN, doc.y + 4).lineTo(PAGE_W - MARGIN, doc.y + 4)
    .strokeColor(COLOR_BORDER).lineWidth(0.5).stroke();
  doc.y += 14;
  const cellW = (CONTENT_W - 10) / 2;
  const cellH = 230;
  let col = 0;
  let rowY = doc.y;
  for (const photo of photos.slice(0, 8)) {
    try {
      const buf = await fetchR2Buffer(photo.objectKey);
      if (buf) {
        const x = MARGIN + col * (cellW + 10);
        doc.image(buf, x, rowY, { fit: [cellW, cellH], align: "center", valign: "center" });
        doc.rect(x, rowY, cellW, cellH).strokeColor(COLOR_BORDER).lineWidth(0.3).stroke();
      }
    } catch { /* skip foto rotta */ }
    col++;
    if (col >= 2) {
      col = 0;
      rowY += cellH + 12;
      if (rowY + cellH > PAGE_H - MARGIN) {
        doc.addPage({ size: "A4", margin: MARGIN });
        rowY = MARGIN;
      }
    }
  }
}

function drawFooter(doc, report) {
  const y = PAGE_H - MARGIN - 14;
  doc.font("Helvetica").fontSize(7).fillColor(COLOR_MUTED)
    .text(
      `Verbale ${report.id || ""} — generato il ${formatDateTime(new Date().toISOString())} — Prato Sintetico Italia`,
      MARGIN, y, { width: CONTENT_W, align: "center" },
    );
}

/**
 * Genera il PDF del verbale.
 * @param {Object} report — record DB serializzato (vedi dbRowToWorkReport).
 * @param {Object} deps
 * @param {(key: string) => Promise<Buffer|null>} deps.fetchR2Buffer
 * @param {Buffer} [deps.logoBuffer]
 * @returns {Promise<Buffer>}
 */
export async function generateWorkReportPdf(report, { fetchR2Buffer, logoBuffer } = {}) {
  if (!report) throw new Error("generateWorkReportPdf: missing report");
  if (typeof fetchR2Buffer !== "function") throw new TypeError("generateWorkReportPdf: fetchR2Buffer required");

  const doc = new PDFDocument({ size: "A4", margin: MARGIN, info: {
    Title: `Verbale ${report.id || ""}`,
    Author: "Prato Sintetico Italia",
    Subject: "Verbale di fine lavori",
    Creator: "PSI Ops",
  }});
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const donePromise = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawHeader(doc, report, logoBuffer);
  drawClientSection(doc, report);
  drawWorkSection(doc, report);
  drawExtrasSection(doc, report);
  drawLiabilitySection(doc, report);
  await drawSignaturesSection(doc, report, fetchR2Buffer);
  drawFooter(doc, report);
  await drawPhotosPage(doc, report, fetchR2Buffer);

  doc.end();
  return await donePromise;
}
