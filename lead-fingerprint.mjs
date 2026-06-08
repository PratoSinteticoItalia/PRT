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

/**
 * Gate PERMISSIVO per la promozione/aggancio data: a differenza di
 * fingerprintIsComplete (usato per il match anti-duplicato a 6 campi), qui
 * basta un nome + un canale di contatto. Serve a NON perdere i lead reali con
 * città o altezza mancanti: vanno comunque importati (portano mq/fondo/servizio)
 * o agganciati a un sales_request esistente (per recuperarne la data IMAP reale).
 */
export function fingerprintCanPromote(fp) {
  return Boolean(fp && fp.nome && (fp.telefono || fp.email));
}

/**
 * Canonicalizza un telefono italiano: solo cifre, e rimuove il prefisso
 * internazionale "39" SOLO quando è chiaramente country code (numero > 10 cifre
 * che inizia con 39). Un mobile bare a 10 cifre come 393xxxxxxx NON viene toccato.
 */
export function canonicalItPhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("0039")) d = d.slice(4);
  if (d.length > 10 && d.startsWith("39")) d = d.slice(2);
  return d;
}

/**
 * Match LEGGERO per contatto (email OR telefono canonico), senza richiedere il
 * fingerprint completo. Usato per i lead "can-promote" ma incompleti: trova un
 * sales_request già esistente a cui agganciare la data, evitando di crearne un
 * doppione. Ritorna { id, matched } o null.
 */
export async function findSalesRequestByContact(pool, fp) {
  if (!pool || !fp) return null;
  const email = String(fp.email || "").trim().toLowerCase();
  const phone = canonicalItPhone(fp.telefono);
  if (!email && phone.length < 8) return null;
  const digits = (c) => `regexp_replace(regexp_replace(coalesce(${c},''),'[^0-9]','','g'),'^0039','')`;
  const canon = (c) => `CASE WHEN length(${digits(c)})>10 AND left(${digits(c)},2)='39' THEN substr(${digits(c)},3) ELSE ${digits(c)} END`;
  try {
    const res = await pool.query(
      `SELECT id, first_name, last_name, email, phone, city, sqm, surface, job_type, requested_height
       FROM sales_requests
       WHERE ($1 <> '' AND lower(coalesce(email,'')) = $1)
          OR ($2 <> '' AND length($2) >= 8 AND ${canon("phone")} = $2)
       ORDER BY created_at ASC NULLS LAST
       LIMIT 1`,
      [email, phone],
    );
    return res.rows[0] ? { id: res.rows[0].id, matched: res.rows[0] } : null;
  } catch (err) {
    console.warn("[reconcile] findSalesRequestByContact errore:", err?.message);
    return null;
  }
}

/**
 * Riempie SOLO i campi vuoti di un sales_request con i dati di una mail shadow
 * (non sovrascrive mai un valore già presente). Recupera cognome/mq/fondo/servizio
 * persi quando a sopravvivere è stato un record povero di dati.
 */
export async function backfillSalesRequestFromShadow(pool, srId, payload = {}) {
  if (!pool || !srId) return;
  const fullName = String(payload.nome || "").trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const lastName = parts.slice(1).join(" ");
  const sqm = payload.metri_quadri != null && payload.metri_quadri !== "" ? payload.metri_quadri : null;
  try {
    await pool.query(
      `UPDATE sales_requests SET
         last_name        = CASE WHEN coalesce(trim(last_name),'')='' THEN $2 ELSE last_name END,
         city             = CASE WHEN coalesce(trim(city),'')='' THEN $3 ELSE city END,
         email            = CASE WHEN coalesce(trim(email),'')='' THEN $4 ELSE email END,
         sqm              = CASE WHEN sqm IS NULL THEN $5 ELSE sqm END,
         surface          = CASE WHEN coalesce(trim(surface),'')='' THEN $6 ELSE surface END,
         job_type         = CASE WHEN coalesce(trim(job_type),'')='' THEN $7 ELSE job_type END,
         requested_height = CASE WHEN coalesce(trim(requested_height),'')='' THEN $8 ELSE requested_height END,
         updated_at = NOW()
       WHERE id = $1`,
      [
        srId, lastName, payload.citta || "", payload.email || "",
        sqm, payload.fondo || null, payload.posa_in_opera || null, payload.altezza || "",
      ],
    );
  } catch (err) {
    console.warn("[reconcile] backfillSalesRequestFromShadow errore:", err?.message);
  }
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
      const complete = fingerprintIsComplete(fp);
      // Lead completo → match anti-duplicato stretto (6 campi).
      // Lead incompleto ma promovibile (nome + contatto) → match LEGGERO per
      // contatto, così agganciamo la data reale a un sales_request esistente
      // invece di perderlo. Solo i lead senza nome/contatto vengono saltati.
      if (!complete && !fingerprintCanPromote(fp)) {
        result.skippedIncompleteFingerprint++;
        continue;
      }
      const match = complete
        ? await findMatchingSalesRequest(pool, fp)
        : await findSalesRequestByContact(pool, fp);
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
          // Riempi i campi vuoti del record sopravvissuto (cognome/mq/fondo/servizio).
          await backfillSalesRequestFromShadow(pool, match.id, payload);
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
