/**
 * lib/sales-merge.js — Merge di una riga Google Sheets su una richiesta vendita
 * esistente nel portale. FUNZIONE PURA (niente DB/state) → testabile.
 *
 * Regole di ownership (Fase 2 hardening):
 *  - Campi "di lavorazione" del PORTALE (status, assignment, note, primo
 *    contatto, whatsapp): il portale è autorevole → preservati se il record
 *    esiste già. Il foglio non li sovrascrive.
 *  - TELEFONO: dopo il primo import il portale vince. Il numero viene
 *    normalizzato/corretto a mano per WhatsApp; prima il sync lo sovrascriveva
 *    col valore del foglio → numeri persi ("bug subdolo"). Ora: se il portale
 *    ha un telefono, vince; dal foglio si prende solo se il portale è vuoto.
 *  - Altri dati anagrafici (nome, email, città, mq, prodotto): restano di
 *    competenza del foglio (comportamento storico invariato).
 *
 * Per i record NUOVI (existing = null) si prende tutto dal foglio.
 */
export function mergeSheetSalesRequestRecord(sheetItem, existing, { now } = {}) {
  const timestamp = now || new Date().toISOString();
  const assignment = existing ? existing.assignment : (sheetItem.assignment || "");
  const status = existing?.status || sheetItem.status || "new";
  const portalPhone = String(existing?.phone || "").trim();
  const phone = existing && portalPhone ? existing.phone : sheetItem.phone;
  return {
    ...sheetItem,
    phone,
    requestedHeight: sheetItem.requestedHeight,
    assignment,
    status,
    note: sheetItem.note || existing?.note || "",
    whatsappTemplate: sheetItem.whatsappTemplate || existing?.whatsappTemplate || "",
    whatsappUrl: sheetItem.whatsappUrl || existing?.whatsappUrl || "",
    firstContactState: existing?.firstContactState || "",
    firstContactScheduledAt: existing?.firstContactScheduledAt || "",
    firstContactSentAt: existing?.firstContactSentAt || "",
    firstContactBy: existing ? existing.firstContactBy : assignment,
    createdAt: existing?.createdAt || sheetItem.createdAt || timestamp,
    updatedAt: timestamp,
  };
}
