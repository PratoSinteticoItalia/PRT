/**
 * diagnose-requests.mjs — SOLA LETTURA, non modifica nulla.
 * Conferma le cause del disallineamento pagina Richieste ↔ casella email.
 *
 * Uso: node diagnose-requests.mjs   (nel terminale dove gira il server, con DATABASE_URL)
 */
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL non trovato. Lancialo dove gira server.js.");
  process.exit(1);
}
const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const q = (sql) => pool.query(sql).then((r) => r.rows);

async function main() {
  console.log("════════ DIAGNOSI PAGINA RICHIESTE ════════\n");

  // 1) Quanti sales_requests, e quanti hanno created_at = data di import (oggi)
  const [tot] = await q(`SELECT COUNT(*)::int AS n FROM sales_requests`);
  const [oggi] = await q(`
    SELECT COUNT(*)::int AS n
    FROM sales_requests
    WHERE created_at::date >= CURRENT_DATE - INTERVAL '2 days'`);
  console.log(`Sales requests totali:                 ${tot.n}`);
  console.log(`  con created_at "recente" (~import):  ${oggi.n}  (${pct(oggi.n, tot.n)})`);

  // 2) Shadow store
  const [sh] = await q(`SELECT COUNT(*)::int AS n FROM incoming_leads_shadow`);
  const [shProm] = await q(`SELECT COUNT(*)::int AS n FROM incoming_leads_shadow WHERE promoted_to_sales_request_id IS NOT NULL`);
  const [shOk] = await q(`SELECT COUNT(*)::int AS n FROM incoming_leads_shadow WHERE parse_status='ok'`);
  const byStatus = await q(`SELECT parse_status, COUNT(*)::int AS n FROM incoming_leads_shadow GROUP BY parse_status ORDER BY n DESC`);
  console.log(`\nShadow IMAP totali:                    ${sh.n}`);
  console.log(`  promossi (link a sales_request):     ${shProm.n}  (${pct(shProm.n, sh.n)})`);
  console.log(`  parse_status='ok':                   ${shOk.n}`);
  console.log("  per parse_status:", byStatus.map((r) => `${r.parse_status}=${r.n}`).join("  "));

  // 3) Quanti shadow 'ok' fallirebbero fingerprintIsComplete (manca uno dei 6 campi)
  const [incompleti] = await q(`
    SELECT COUNT(*)::int AS n FROM incoming_leads_shadow
    WHERE parse_status='ok' AND (
      coalesce(parsed_payload->>'nome','')='' OR
      coalesce(parsed_payload->>'email','')='' OR
      coalesce(parsed_payload->>'telefono','')='' OR
      coalesce(parsed_payload->>'citta','')='' OR
      parsed_payload->>'metri_quadri' IS NULL OR
      coalesce(parsed_payload->>'altezza','')=''
    )`);
  console.log(`\nShadow 'ok' INCOMPLETI (mai promossi): ${incompleti.n}  ← persi per fingerprint a 6 campi`);

  // 4) Copertura data reale: via id, via telefono (no +39), via telefono CON fix +39
  const [coverId] = await q(`
    SELECT COUNT(DISTINCT promoted_to_sales_request_id)::int AS n
    FROM incoming_leads_shadow
    WHERE promoted_to_sales_request_id IS NOT NULL AND received_at IS NOT NULL`);
  const [coverPhone] = await q(`
    SELECT COUNT(DISTINCT sr.id)::int AS n
    FROM sales_requests sr
    JOIN incoming_leads_shadow ils
      ON regexp_replace(coalesce(sr.phone,''),'[^0-9]','','g') =
         regexp_replace(coalesce(ils.parsed_payload->>'telefono',''),'[^0-9]','','g')
     AND length(regexp_replace(coalesce(sr.phone,''),'[^0-9]','','g')) >= 8`);
  const [coverPhoneFix] = await q(`
    SELECT COUNT(DISTINCT sr.id)::int AS n
    FROM sales_requests sr
    JOIN incoming_leads_shadow ils
      ON regexp_replace(regexp_replace(coalesce(sr.phone,''),'^(\\+?39)',''),'[^0-9]','','g') =
         regexp_replace(regexp_replace(coalesce(ils.parsed_payload->>'telefono',''),'^(\\+?39)',''),'[^0-9]','','g')
     AND length(regexp_replace(regexp_replace(coalesce(sr.phone,''),'^(\\+?39)',''),'[^0-9]','','g')) >= 8`);
  console.log(`\nCopertura "data reale" su ${tot.n} richieste:`);
  console.log(`  via linkage diretto (shadow_by_id):  ${coverId.n}  (${pct(coverId.n, tot.n)})`);
  console.log(`  via telefono ATTUALE (no +39):       ${coverPhone.n}  (${pct(coverPhone.n, tot.n)})`);
  console.log(`  via telefono CON fix +39:            ${coverPhoneFix.n}  (${pct(coverPhoneFix.n, tot.n)})  ← guadagno del fix`);

  // 5) Dati mancanti sulle richieste
  const [missing] = await q(`
    SELECT
      COUNT(*) FILTER (WHERE coalesce(trim(last_name),'')='')::int AS no_cognome,
      COUNT(*) FILTER (WHERE sqm IS NULL)::int AS no_mq,
      COUNT(*) FILTER (WHERE coalesce(trim(surface),'')='')::int AS no_fondo,
      COUNT(*) FILTER (WHERE coalesce(trim(job_type),'')='')::int AS no_servizio
    FROM sales_requests`);
  console.log(`\nRichieste con dati mancanti:`);
  console.log(`  senza cognome:  ${missing.no_cognome}  (${pct(missing.no_cognome, tot.n)})`);
  console.log(`  senza mq:       ${missing.no_mq}  (${pct(missing.no_mq, tot.n)})`);
  console.log(`  senza fondo:    ${missing.no_fondo}  (${pct(missing.no_fondo, tot.n)})`);
  console.log(`  senza servizio: ${missing.no_servizio}  (${pct(missing.no_servizio, tot.n)})`);

  console.log("\n════════ FINE DIAGNOSI ════════");
}

function pct(n, tot) { return tot ? `${Math.round((n / tot) * 100)}%` : "0%"; }

main().catch((e) => { console.error("❌", e.message); process.exit(1); }).finally(() => pool.end());
