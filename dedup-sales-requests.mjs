/**
 * dedup-sales-requests.mjs
 * Rimuove i duplicati dalla tabella sales_requests raggruppando per telefono.
 * Per ogni gruppo di duplicati tiene il record più avanzato (stato commerciale più alto).
 *
 * Uso: node dedup-sales-requests.mjs
 * Richiede DATABASE_URL nel env (stesso env in cui gira server.js).
 */

import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌  DATABASE_URL non trovato. Esegui lo script nel terminale dove gira il server.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

// Normalizza telefono: rimuove +39, spazi, trattini, punti, parentesi
const normPhone = `regexp_replace(regexp_replace(coalesce(phone,''), '^[+]39', ''), '[[:space:]()\\-\\.]', '', 'g')`;

// Rank stato commerciale: più alto = più avanzato = da tenere
const normSt = `lower(regexp_replace(translate(coalesce(trim(status),''), 'àèéìíòóùúÀÈÉÌÍÒÓÙÚ', 'aaeiioouuAAEIIOOUU'), '[^a-zA-Z0-9 ]', '', 'g'))`;
const statusRank = `CASE
  WHEN ${normSt} IN ('preventivo confermato','ordine confermato','ordine eseguito','campione acquistato')
    OR (${normSt} LIKE '%confermato%' AND ${normSt} NOT LIKE '%non%')
    OR ${normSt} LIKE '%ordine%' THEN 8
  WHEN ${normSt} IN ('preventivo inviato','offerta inviata')
    OR (${normSt} LIKE '%preventivo%' AND ${normSt} LIKE '%inviato%') THEN 7
  WHEN ${normSt} IN ('preventivo','in preventivo','preventivo da inviare','offerta','quotato')
    OR (${normSt} LIKE '%preventivo%' AND ${normSt} NOT LIKE '%inviato%')
    OR (${normSt} LIKE '%offerta%' AND ${normSt} NOT LIKE '%inviata%') THEN 6
  WHEN ${normSt} LIKE '%follow%' OR ${normSt} LIKE '%richiam%' OR ${normSt} LIKE '%attesa%'
    OR ${normSt} IN ('followup','follow up','da richiamare','richiamare') THEN 5
  WHEN ${normSt} IN ('1 contatto','1 contatto whatsapp','primo contatto')
    OR ${normSt} LIKE '1 contatt%' OR ${normSt} LIKE '1° contatt%' THEN 4
  WHEN ${normSt} LIKE '%contatt%' OR ${normSt} IN ('nuovo contatto','new contact') THEN 3
  WHEN coalesce(trim(assignment),'') <> '' THEN 2
  ELSE 1
END`;

const ricchezza = `(
  CASE WHEN coalesce(trim(first_name),'') <> '' THEN 1 ELSE 0 END +
  CASE WHEN coalesce(trim(last_name),'') <> '' THEN 1 ELSE 0 END +
  CASE WHEN coalesce(trim(email),'') <> '' THEN 2 ELSE 0 END +
  CASE WHEN coalesce(trim(note),'') <> '' THEN 2 ELSE 0 END +
  CASE WHEN coalesce(trim(city),'') <> '' THEN 1 ELSE 0 END +
  CASE WHEN sqm IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN coalesce(trim(assignment),'') <> '' THEN 2 ELSE 0 END +
  CASE WHEN coalesce(trim(requested_height),'') <> '' THEN 1 ELSE 0 END
)`;

async function main() {
  const client = await pool.connect();
  try {
    console.log("🔍  Cerco duplicati per numero di telefono…\n");

    const { rows } = await client.query(`
      WITH normed AS (
        SELECT id, first_name, last_name, email, city, phone, status, assignment,
               sqm, surface, job_type, requested_height, note, created_at,
               (${normPhone}) AS norm_phone,
               (${statusRank}) AS st_rank,
               (${ricchezza}) AS richness
        FROM sales_requests
        WHERE length(coalesce(trim(${normPhone}),'')) >= 7
      ),
      dup_phones AS (
        SELECT norm_phone FROM normed GROUP BY norm_phone HAVING COUNT(*) > 1
      ),
      ranked AS (
        SELECT n.*,
               ROW_NUMBER() OVER (
                 PARTITION BY n.norm_phone
                 ORDER BY n.st_rank DESC, n.richness DESC, n.created_at ASC
               ) AS rn
        FROM normed n
        INNER JOIN dup_phones d ON d.norm_phone = n.norm_phone
      )
      SELECT id, first_name, last_name, email, city,
             trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')) AS full_name,
             phone, norm_phone, status, sqm, surface, job_type, requested_height, note,
             st_rank, richness, created_at,
             rn,
             (rn = 1) AS is_keeper
      FROM ranked
      ORDER BY norm_phone, rn
    `);

    if (rows.length === 0) {
      console.log("✅  Nessun duplicato trovato — lista già pulita!");
      return;
    }

    // Raggruppa: ogni gruppo tiene la riga keeper completa + le righe dei duplicati.
    const groups = {};
    for (const r of rows) {
      const k = r.norm_phone;
      if (!groups[k]) groups[k] = { keeper: null, dups: [] };
      if (r.is_keeper) groups[k].keeper = r;
      else groups[k].dups.push(r);
    }

    const groupList = Object.values(groups).filter(g => g.keeper && g.dups.length > 0);
    const toDeleteIds = groupList.flatMap(g => g.dups.map(r => r.id));

    // MERGE: prima di cancellare, travasa nel keeper i campi VUOTI usando il
    // primo valore non vuoto trovato tra i duplicati (già ordinati per ricchezza).
    // Così cognome/mq/fondo/servizio del record povero sopravvissuto vengono
    // recuperati invece di andare persi con la cancellazione.
    const isEmpty = (v) => v == null || String(v).trim() === "";
    const pick = (keeperVal, dups, field) =>
      !isEmpty(keeperVal) ? keeperVal : (dups.find(d => !isEmpty(d[field]))?.[field] ?? keeperVal);
    let mergedCount = 0;

    console.log(`📋  Trovati ${groupList.length} gruppi duplicati → ${toDeleteIds.length} record da eliminare:\n`);
    for (const g of groupList) {
      const k = g.keeper;
      // Valori fusi (default = valore keeper, quindi no-op se non c'è nulla da riempire)
      let firstName = k.first_name;
      let lastName  = pick(k.last_name, g.dups, "last_name");
      // Cognome ancora vuoto ma il nome contiene più parole → splitta (es. "FABIO DALLE DONNE")
      if (isEmpty(lastName) && !isEmpty(firstName) && String(firstName).trim().includes(" ")) {
        const parts = String(firstName).trim().split(/\s+/);
        firstName = parts.slice(0, 1).join(" ");
        lastName  = parts.slice(1).join(" ");
      }
      const merged = {
        first_name: firstName,
        last_name: lastName,
        email: pick(k.email, g.dups, "email"),
        city: pick(k.city, g.dups, "city"),
        sqm: k.sqm != null ? k.sqm : (g.dups.find(d => d.sqm != null)?.sqm ?? null),
        surface: pick(k.surface, g.dups, "surface"),
        job_type: pick(k.job_type, g.dups, "job_type"),
        requested_height: pick(k.requested_height, g.dups, "requested_height"),
        note: pick(k.note, g.dups, "note"),
      };
      const changed = Object.keys(merged).some(f => String(merged[f] ?? "") !== String(k[f] ?? ""));
      if (changed) {
        await client.query(
          `UPDATE sales_requests SET
             first_name=$2, last_name=$3, email=$4, city=$5, sqm=$6,
             surface=$7, job_type=$8, requested_height=$9, note=$10, updated_at=NOW()
           WHERE id=$1`,
          [k.id, merged.first_name, merged.last_name, merged.email, merged.city,
           merged.sqm, merged.surface, merged.job_type, merged.requested_height, merged.note],
        );
        mergedCount++;
      }
      const keeperName = k.full_name || k.id;
      const delDesc = g.dups.map(d => `"${d.full_name || d.id}" [${d.status || "(nuova)"}]`).join(", ");
      console.log(`  ✓ Tengo:   "${keeperName}" [${k.status || "(nuova)"}]${changed ? "  ⟲ campi recuperati" : ""}`);
      console.log(`  ✗ Elimino: ${delDesc}`);
      console.log();
    }

    console.log(`\n🔀  Merge: ${mergedCount} keeper arricchiti coi dati dei duplicati.`);
    console.log(`🗑️   Elimino ${toDeleteIds.length} record…`);
    await client.query(`DELETE FROM sales_requests WHERE id = ANY($1)`, [toDeleteIds]);
    console.log(`✅  Fatto! ${toDeleteIds.length} duplicati rimossi, ${groupList.length} clienti de-duplicati.`);
    console.log("\n👉  Ricarica la pagina CRM per vedere la lista pulita.");

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error("❌  Errore:", err.message);
  process.exit(1);
});
