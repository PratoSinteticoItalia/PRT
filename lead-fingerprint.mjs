/**
 * Lead fingerprint matching — modulo condiviso tra server.js e imap-worker.js.
 *
 * Definisce la logica per stabilire se due richieste (una shadow IMAP e una
 * sales_request esistente nel CRM) rappresentano la stessa richiesta.
 *
 * Decisione utente (vedi ANALISI.md): match SOLO se 6 campi obbligatori
 * coincidono dopo normalizzazione. Niente finestra temporale: Mario Rossi
 * 30mq chiesti a mesi di distanza con stessa altezza = stessa richiesta;
 * Mario Rossi 30mq vs 50mq = richieste diverse anche se a 2 secondi.
 */

import { randomUUID } from "node:crypto";

export function normalizeLeadName(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, " ");
}
export function normalizeLeadEmail(value) {
  return String(value || "").trim().toLowerCase();
}
export function normalizeLeadPhone(value) {
  return String(value || "").replace(/[^\d]/g, "");
}
export function normalizeLeadCity(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, " ");
}
export function normalizeLeadNumber(value) {
  const n = parseFloat(String(value || "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
export function normalizeLeadHeight(value) {
  return String(value || "").replace(/[^\dA-Za-z]/g, "").toUpperCase();
}

export function buildLeadFingerprint(rec = {}) {
  const fullName = [
    rec.nome
    || [
      rec.first_name || rec.firstName || rec.name,
      rec.last_name || rec.lastName || rec.surname,
    ].filter(Boolean).join(" "),
  ].filter(Boolean).join(" ");
  return {
    nome: normalizeLeadName(fullName),
    email: normalizeLeadEmail(rec.email),
    telefono: normalizeLeadPhone(rec.telefono || rec.phone),
    citta: normalizeLeadCity(rec.citta || rec.city),
    mq: normalizeLeadNumber(rec.metri_quadri ?? rec.sqm ?? rec.mq),
    altezza: normalizeLeadHeight(rec.altezza ?? rec.requested_height ?? rec.requestedHeight),
    _optional: {
      posa_in_opera: rec.posa_in_opera_normalized
        || (rec.service
          ? (String(rec.service).toLowerCase().includes("posa") ? "fornitura+posa" : "fornitura")
          : null),
      fondo: rec.fondo_normalized || (rec.surface ? String(rec.surface).toLowerCase() : null),
    },
  };
}

export function fingerprintIsComplete(fp) {
  return Boolean(
    fp.nome && fp.email && fp.telefono && fp.citta
    && fp.mq != null && fp.altezza,
  );
}

export function fingerprintsMatch(a, b) {
  if (!fingerprintIsComplete(a) || !fingerprintIsComplete(b)) return false;
  if (a.nome !== b.nome) return false;
  if (a.email !== b.email) return false;
  if (a.telefono !== b.telefono) return false;
  if (a.citta !== b.citta) return false;
  if (a.mq !== b.mq) return false;
  if (a.altezza !== b.altezza) return false;
  const ao = a._optional || {};
  const bo = b._optional || {};
  if (ao.posa_in_opera && bo.posa_in_opera && ao.posa_in_opera !== bo.posa_in_opera) return false;
  if (ao.fondo && bo.fondo && ao.fondo !== bo.fondo) return false;
  return true;
}

export async function findMatchingSalesRequest(pool, shadowFp) {
  if (!pool || !fingerprintIsComplete(shadowFp)) return null;
  try {
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, city, sqm, requested_height,
              surface, job_type, created_at
       FROM sales_requests
       WHERE LOWER(email) = $1 OR REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $2
       LIMIT 200`,
      [shadowFp.email, shadowFp.telefono],
    );
    const rows = result.rows || [];
    for (const row of rows) {
      const candidateFp = buildLeadFingerprint(row);
      if (fingerprintsMatch(shadowFp, candidateFp)) {
        return { id: row.id, matched: row };
      }
    }
    return null;
  } catch (err) {
    console.warn("[reconcile] findMatchingSalesRequest errore:", err?.message);
    return null;
  }
}

/**
 * Riconcilia i lead shadow non ancora promossi con i sales_requests esistenti.
 * Per ogni shadow `ok`:
 *   - se match trovato → UPDATE shadow.promoted_to_sales_request_id (link)
 *   - se no match → INSERT sales_requests (orfano) + link shadow
 *
 * @param pool        Pool PostgreSQL
 * @param options     { dryRun, limit, onlyOk }
 * @returns { dryRun, considered, matched, imported, skippedIncompleteFingerprint, errors, samples }
 */
export async function reconcileShadowLeads(pool, options = {}) {
  const dryRun = options.dryRun !== false; // default true (safety)
  const limit = Math.min(1000, Math.max(1, Number(options.limit || 200)));
  const onlyOk = options.onlyOk !== false;

  const statusFilter = onlyOk ? "AND parse_status = 'ok'" : "";
  const candidates = await pool.query(
    `SELECT id, imap_message_id, imap_uid, received_at, parsed_payload, parse_status
     FROM incoming_leads_shadow
     WHERE promoted_to_sales_request_id IS NULL
     ${statusFilter}
     ORDER BY received_at ASC NULLS LAST
     LIMIT $1`,
    [limit],
  );

  const result = {
    dryRun,
    considered: candidates.rows.length,
    matched: 0,
    imported: 0,
    skippedIncompleteFingerprint: 0,
    errors: [],
    samples: { matched: [], imported: [] },
  };

  for (const row of candidates.rows) {
    try {
      const payload = row.parsed_payload || {};
      const fp = buildLeadFingerprint(payload);
      if (!fingerprintIsComplete(fp)) {
        result.skippedIncompleteFingerprint++;
        continue;
      }
      const match = await findMatchingSalesRequest(pool, fp);
      if (match) {
        result.matched++;
        if (result.samples.matched.length < 5) {
          result.samples.matched.push({
            shadow_id: row.id,
            imap_uid: row.imap_uid,
            matched_sales_id: match.id,
            nome: fp.nome,
            email: fp.email,
          });
        }
        if (!dryRun) {
          await pool.query(
            `UPDATE incoming_leads_shadow
             SET promoted_to_sales_request_id = $1, promoted_at = NOW(), updated_at = NOW()
             WHERE id = $2`,
            [match.id, row.id],
          );
        }
      } else {
        result.imported++;
        if (result.samples.imported.length < 5) {
          result.samples.imported.push({
            shadow_id: row.id,
            imap_uid: row.imap_uid,
            nome: fp.nome,
            email: fp.email,
            citta: fp.citta,
            mq: fp.mq,
            altezza: fp.altezza,
            received_at: row.received_at,
          });
        }
        if (!dryRun) {
          const newId = randomUUID();
          const fullName = String(payload.nome || "").trim();
          const parts = fullName.split(/\s+/);
          const firstName = parts.slice(0, 1).join(" ");
          const lastName = parts.slice(1).join(" ");
          const sqm = payload.metri_quadri ?? null;
          const surface = payload.fondo || null;
          const jobType = payload.posa_in_opera || null;
          const note = [payload.note_aggiuntive, payload.note_posa, payload.descrizione_area]
            .filter(Boolean).join(" | ").slice(0, 2000);
          const createdIso = row.received_at instanceof Date
            ? row.received_at.toISOString()
            : (row.received_at || new Date().toISOString());
          await pool.query(
            `INSERT INTO sales_requests
               (id, first_name, last_name, email, phone, city, sqm,
                requested_height, surface, job_type, note,
                status, assignment, source, created_at, updated_at)
             VALUES
               ($1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11,
                'new', '', 'imap', $12, NOW())`,
            [
              newId, firstName, lastName,
              payload.email || "", payload.telefono || "", payload.citta || "",
              sqm, payload.altezza || "", surface, jobType, note,
              createdIso,
            ],
          );
          await pool.query(
            `UPDATE incoming_leads_shadow
             SET promoted_to_sales_request_id = $1, promoted_at = NOW(), updated_at = NOW()
             WHERE id = $2`,
            [newId, row.id],
          );
        }
      }
    } catch (rowErr) {
      result.errors.push({ shadow_id: row.id, message: String(rowErr?.message || rowErr) });
    }
  }

  return result;
}
