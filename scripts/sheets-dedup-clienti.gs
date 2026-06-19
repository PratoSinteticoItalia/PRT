/**
 * Pulizia doppioni foglio "Clienti Prato Sintetico".
 * ────────────────────────────────────────────────────────────────────────────
 * I doppioni sono stati creati dal vecchio bug (il portale appendeva una riga
 * nuova ad ogni cambio di stato). Questo script, per ogni TELEFONO:
 *   • tiene la PRIMA riga (posizione cronologica originale),
 *   • ci copia Stato + assegnazione dell'ULTIMA riga (= stato più recente),
 *   • cancella tutte le altre righe doppie.
 *
 * COME USARLO (in sicurezza):
 *   1. File → Crea una copia del foglio (lavora SEMPRE prima sulla COPIA).
 *   2. Sulla copia: Estensioni → Apps Script → incolla questo file → Salva.
 *   3. In alto seleziona la funzione `anteprimaPulizia` e premi ▶ (Esegui):
 *      NON cancella niente, scrive solo un report in un nuovo foglio
 *      "_dedup_report" con quante righe verrebbero rimosse e qualche esempio.
 *   4. Controlla il report. Se ti torna, esegui `eseguiPulizia` (questa CANCELLA).
 *   5. Verifica il risultato. Se ok, ripeti sul foglio vero.
 *
 * Cambia SHEET_NAME se la scheda non si chiama "clienti".
 */

var SHEET_NAME = "clienti";          // nome della scheda (tab) con i contatti
var HEADER_ROW = 1;                  // riga delle intestazioni
var COL_PHONE  = "telefono";         // intestazioni da cercare (case-insensitive)
var COL_EMAIL  = "email";
var COL_STATO  = "stato";
var COL_ASSEGN = "assegnazione";

function anteprimaPulizia() { _pulizia(true); }
function eseguiPulizia()    { _pulizia(false); }

function _pulizia(dryRun) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('Scheda "' + SHEET_NAME + '" non trovata. Correggi SHEET_NAME.');

  var lastRow = sh.getLastRow();
  var lastCol = sh.getLastColumn();
  if (lastRow <= HEADER_ROW) { _log("Nessun dato."); return; }

  var headers = sh.getRange(HEADER_ROW, 1, 1, lastCol).getValues()[0]
                  .map(function (h) { return String(h || "").trim().toLowerCase(); });
  var iPhone  = headers.indexOf(COL_PHONE);
  var iEmail  = headers.indexOf(COL_EMAIL);
  var iStato  = headers.indexOf(COL_STATO);
  var iAssegn = headers.indexOf(COL_ASSEGN);
  if (iPhone < 0 && iEmail < 0) throw new Error("Colonne telefono/email non trovate nelle intestazioni.");

  var firstDataRow = HEADER_ROW + 1;
  var n = lastRow - HEADER_ROW;
  var data = sh.getRange(firstDataRow, 1, n, lastCol).getValues();

  // Raggruppa per chiave (telefono normalizzato, fallback email).
  var groups = {}; // key -> { firstIdx, lastIdx, rows:[idx...] }  (idx = 0-based su data)
  for (var i = 0; i < data.length; i++) {
    var key = _phoneKey(iPhone >= 0 ? data[i][iPhone] : "") ||
              _emailKey(iEmail >= 0 ? data[i][iEmail] : "");
    if (!key) continue; // riga senza contatto → lasciata stare
    if (!groups[key]) groups[key] = { rows: [] };
    groups[key].rows.push(i);
  }

  // Decidi cosa fare.
  var toDelete = [];          // indici 0-based (su data) da cancellare
  var updates = [];           // { rowNumber, stato, assegn } sulla riga da tenere
  var dupGroups = 0, dupRows = 0;
  var sample = [];
  Object.keys(groups).forEach(function (key) {
    var rows = groups[key].rows;
    if (rows.length < 2) return;
    dupGroups++;
    var keepIdx = rows[0];                 // prima riga (più in alto = più vecchia)
    var lastIdx = rows[rows.length - 1];   // ultima riga = stato più recente
    // Copia stato/assegnazione recenti sulla riga tenuta.
    var newStato  = iStato  >= 0 ? data[lastIdx][iStato]  : null;
    var newAssegn = iAssegn >= 0 ? data[lastIdx][iAssegn] : null;
    updates.push({ rowNumber: firstDataRow + keepIdx, stato: newStato, assegn: newAssegn });
    for (var k = 1; k < rows.length; k++) { toDelete.push(rows[k]); dupRows++; }
    if (sample.length < 15) {
      sample.push([key, rows.length, (firstDataRow + keepIdx), String(newStato || "")]);
    }
  });

  if (dryRun) {
    _writeReport(ss, dupGroups, dupRows, sample);
    _log("ANTEPRIMA: " + dupGroups + " contatti con doppioni, " + dupRows +
         " righe da rimuovere. Report in '_dedup_report'. Nessuna modifica fatta.");
    return;
  }

  // 1) aggiorna stato/assegnazione sulle righe tenute
  updates.forEach(function (u) {
    if (iStato  >= 0 && u.stato  !== null) sh.getRange(u.rowNumber, iStato  + 1).setValue(u.stato);
    if (iAssegn >= 0 && u.assegn !== null) sh.getRange(u.rowNumber, iAssegn + 1).setValue(u.assegn);
  });

  // 2) cancella le righe doppie, dal BASSO verso l'ALTO (così gli indici reggono)
  var rowNumbers = toDelete.map(function (idx) { return firstDataRow + idx; })
                           .sort(function (a, b) { return b - a; });
  rowNumbers.forEach(function (rowNumber) { sh.deleteRow(rowNumber); });

  _log("PULIZIA FATTA: aggiornate " + updates.length + " righe, rimosse " +
       rowNumbers.length + " righe doppie.");
}

// Telefono → chiave: solo cifre, togli prefisso 39 se presente.
function _phoneKey(v) {
  var d = String(v || "").replace(/\D+/g, "");
  if (!d) return "";
  if (d.length > 10 && d.indexOf("39") === 0) d = d.slice(2);
  d = d.replace(/^0+/, "");
  return d.length >= 6 ? d : "";
}
function _emailKey(v) {
  var e = String(v || "").trim().toLowerCase();
  return e.indexOf("@") > 0 ? "email:" + e : "";
}

function _writeReport(ss, dupGroups, dupRows, sample) {
  var name = "_dedup_report";
  var sh = ss.getSheetByName(name);
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet(name);
  sh.getRange(1, 1, 1, 4).setValues([["Contatti con doppioni", dupGroups, "Righe da rimuovere", dupRows]]);
  sh.getRange(3, 1, 1, 4).setValues([["chiave", "righe totali", "riga tenuta", "stato finale"]]);
  if (sample.length) sh.getRange(4, 1, sample.length, 4).setValues(sample);
}

function _log(msg) { Logger.log(msg); try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, "Dedup", 8); } catch (e) {} }
