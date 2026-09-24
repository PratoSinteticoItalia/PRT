/**
 * Generazione PDF "report sopralluogo" — riepilogo di una visita pre-vendita
 * (cliente, indirizzo, esito squadra: mq, terreno, criticità, fattibilità,
 * note) scaricabile a fine sopralluogo. Stesso schema di lib/site-sheet-pdf.js
 * (PDFKit, deps iniettate, nessun accesso diretto a stato globale).
 *
 * Come la scheda cantiere e a differenza del verbale di fine cantiere
 * (lib/work-report-pdf.js), NON viene persistito né archiviato: si rigenera
 * al volo dai dati correnti del sopralluogo ad ogni richiesta. Le foto NON
 * vengono incorporate nel PDF (restano consultabili in app) — solo un
 * conteggio, per tenere il modulo semplice e stateless.
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
const COLOR_CRITICAL = "#b91c1c";

const CRITICALITY_LABELS = {
  nessuna: "Nessuna",
  lieve: "Lieve",
  bloccante: "Bloccante",
};

function formatDate(isoOrDate) {
  if (!isoOrDate) return "—";
  try {
    return new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(new Date(isoOrDate));
  } catch { return "—"; }
}

function composeClientLines(survey) {
  const lines = [];
  lines.push({ text: survey?.customerName || "—", bold: true, size: 12 });
  const address = String(survey?.address || "").trim();
  const cityRow = [survey?.city, survey?.province ? `(${survey.province})` : ""].filter(Boolean).join(" ");
  if (address) lines.push({ text: address, size: 10 });
  if (cityRow) lines.push({ text: cityRow, size: 10 });
  if (survey?.phone) lines.push({ text: `Tel: ${survey.phone}`, size: 10 });
  if (survey?.email) lines.push({ text: survey.email, size: 10 });
  return lines;
}

function drawHeader(doc, survey, logoBuffer) {
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
    .text("REPORT SOPRALLUOGO", MARGIN + 10, boxY + 10, { width: 340 });
  doc.font("Helvetica").fontSize(9).fillColor(COLOR_MUTED)
    .text("Rif.", MARGIN + 360, boxY + 8)
    .font("Helvetica-Bold").fontSize(11).fillColor(COLOR_TEXT)
    .text(survey?.id || "—", MARGIN + 360, boxY + 19);
  doc.y = boxY + 40 + 14;
  doc.fillColor(COLOR_TEXT);
}

function drawClientSection(doc, survey) {
  const startY = doc.y;
  const boxH = 100;
  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, startY, CONTENT_W, boxH).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("CLIENTE / INDIRIZZO", MARGIN + 10, startY + 8);
  let lineY = startY + 22;
  composeClientLines(survey).forEach((line) => {
    doc.font(line.bold ? "Helvetica-Bold" : "Helvetica").fontSize(line.size || 10).fillColor(COLOR_TEXT)
      .text(line.text, MARGIN + 10, lineY, { width: CONTENT_W - 20 });
    lineY += (line.size || 10) + 5;
  });
  doc.y = startY + boxH + 14;
}

function drawOutcomeSection(doc, survey) {
  const startY = doc.y;
  const colW = CONTENT_W / 2 - 6;
  const boxH = 90;
  const criticality = survey?.criticality || "nessuna";
  const criticalityColor = criticality === "bloccante" ? COLOR_CRITICAL : COLOR_TEXT;

  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, startY, colW, boxH).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("MQ MISURATI", MARGIN + 10, startY + 8)
    .font("Helvetica-Bold").fontSize(12).fillColor(COLOR_TEXT)
    .text(survey?.measuredSqm != null ? `${survey.measuredSqm} mq` : "—", MARGIN + 10, startY + 20)
    .font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("STATO TERRENO", MARGIN + 10, startY + 58)
    .font("Helvetica-Bold").fontSize(12).fillColor(COLOR_TEXT)
    .text(survey?.groundCondition || "—", MARGIN + 10, startY + 69, { width: colW - 20 });

  const rightX = MARGIN + colW + 12;
  const feasibleLabel = survey?.feasible === true ? "Sì" : survey?.feasible === false ? "No" : "Da valutare";
  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(rightX, startY, colW, boxH).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("FATTIBILE", rightX + 10, startY + 8)
    .font("Helvetica-Bold").fontSize(12).fillColor(COLOR_TEXT)
    .text(feasibleLabel, rightX + 10, startY + 20)
    .font("Helvetica").fontSize(8).fillColor(COLOR_MUTED)
    .text("CRITICITÀ", rightX + 10, startY + 58)
    .font("Helvetica-Bold").fontSize(12).fillColor(criticalityColor)
    .text(CRITICALITY_LABELS[criticality] || criticality, rightX + 10, startY + 69);

  doc.y = startY + boxH + 14;
  doc.fillColor(COLOR_TEXT);
}

function drawNotesSection(doc, survey) {
  const notes = [survey?.crewNotes, survey?.criticalityNotes].filter((n) => String(n || "").trim());
  const startY = doc.y;
  const boxH = 120;
  doc.lineWidth(0.6).strokeColor(COLOR_BORDER).rect(MARGIN, startY, CONTENT_W, boxH).stroke();
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLOR_MUTED)
    .text("NOTE SQUADRA", MARGIN + 10, startY + 8);
  doc.font("Helvetica").fontSize(10).fillColor(COLOR_TEXT)
    .text(notes.length ? notes.join("\n\n") : "Nessuna nota.", MARGIN + 10, startY + 22, { width: CONTENT_W - 20, height: boxH - 30 });
  doc.y = startY + boxH + 14;
}

function drawPhotosNote(doc, survey) {
  const count = Array.isArray(survey?.photos) ? survey.photos.length : 0;
  doc.font("Helvetica").fontSize(9).fillColor(COLOR_MUTED)
    .text(
      count > 0 ? `${count} foto allegate, consultabili nell'app.` : "Nessuna foto allegata.",
      MARGIN, doc.y, { width: CONTENT_W },
    );
  doc.y += 20;
}

function drawFooter(doc, survey) {
  const y = PAGE_H - MARGIN - 14;
  doc.font("Helvetica").fontSize(7).fillColor(COLOR_MUTED)
    .text(
      `Documento generato da Prato Sintetico Italia — Sopralluogo ${survey?.id || ""} — ${formatDate(new Date().toISOString())}`,
      MARGIN, y, { width: CONTENT_W, align: "center" },
    );
}

/**
 * Genera il PDF del report sopralluogo.
 * @param {Object} survey — record sopralluogo normalizzato (lib/surveys.js).
 * @param {Object} deps
 * @param {Buffer} [deps.logoBuffer]
 * @returns {Promise<Buffer>}
 */
export async function generateSiteSurveyReportPdf(survey, { logoBuffer } = {}) {
  if (!survey) throw new Error("generateSiteSurveyReportPdf: missing survey");
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    info: {
      Title: `Report sopralluogo ${survey?.id || ""}`,
      Author: "Prato Sintetico Italia",
      Subject: "Report sopralluogo",
      Creator: "PSI Ops",
    },
  });
  const chunks = [];
  doc.on("data", (c) => chunks.push(c));
  const donePromise = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  drawHeader(doc, survey, logoBuffer);
  drawClientSection(doc, survey);
  drawOutcomeSection(doc, survey);
  drawNotesSection(doc, survey);
  drawPhotosNote(doc, survey);
  drawFooter(doc, survey);

  doc.end();
  return await donePromise;
}
