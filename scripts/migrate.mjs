#!/usr/bin/env node
/**
 * scripts/migrate.mjs
 * PSI Ops — Migrazione schema relazionale
 *
 * Crea le tabelle Postgres (DDL idempotente) e popola i dati
 * leggendo il blob JSON da app_documents WHERE key='store'.
 *
 * Uso:
 *   DATABASE_URL=postgres://... node scripts/migrate.mjs
 */

import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = String(process.env.DATABASE_URL || '').trim();
if (!DATABASE_URL) {
  console.error('Errore: DATABASE_URL mancante');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, max: 2 });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeTs(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function safeNum(value) {
  const n = Number(value);
  return isFinite(n) ? n : null;
}

function safeJson(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

// ---------------------------------------------------------------------------
// 1. DDL — crea tabelle e indici
// ---------------------------------------------------------------------------

async function createTables() {
  console.log('Creazione tabelle...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      shopify_numeric_id TEXT,
      shopify_graphql_id TEXT,
      order_number TEXT,
      first_name TEXT, last_name TEXT, email TEXT, phone TEXT,
      city TEXT, address TEXT, postal_code TEXT, province_code TEXT, province TEXT, country_code TEXT,
      financial_status TEXT, fulfillment_status TEXT, payment_method TEXT,
      source TEXT, note TEXT, total TEXT,
      totals JSONB DEFAULT '{}',
      billing JSONB DEFAULT '{}',
      warehouse JSONB DEFAULT '{}',
      installation JSONB DEFAULT '{}',
      accounting JSONB DEFAULT '{}',
      line_items JSONB DEFAULT '[]',
      line_details JSONB DEFAULT '[]',
      attachments JSONB DEFAULT '[]',
      converted_job_id TEXT,
      shopify_raw JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      product TEXT, family TEXT,
      piece_type TEXT, piece_state TEXT,
      width NUMERIC, length NUMERIC, units TEXT, label TEXT,
      allocated_to_order_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      first_name TEXT, last_name TEXT, city TEXT, phone TEXT, email TEXT, address TEXT,
      job_type TEXT, surface TEXT, product TEXT, sqm NUMERIC,
      install_date TEXT, install_time TEXT, crew TEXT,
      priority TEXT, warehouse_status TEXT, install_status TEXT,
      materials JSONB DEFAULT '[]', notes TEXT,
      attachments JSONB DEFAULT '[]',
      source_order_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sales_requests (
      id TEXT PRIMARY KEY,
      first_name TEXT, last_name TEXT, email TEXT, phone TEXT,
      city TEXT, address TEXT, postal_code TEXT, province_code TEXT, province TEXT, country_code TEXT,
      company TEXT, job_type TEXT, surface TEXT, sqm NUMERIC, note TEXT,
      status TEXT, assignment TEXT, first_contact_by TEXT, first_contact_at TIMESTAMPTZ,
      source TEXT, source_row_number INTEGER,
      attachments JSONB DEFAULT '[]',
      whatsapp_thread_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS catalog_items (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      category TEXT NOT NULL,
      value TEXT NOT NULL,
      label TEXT,
      position INTEGER DEFAULT 0,
      metadata JSONB DEFAULT '{}',
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (category, value)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id BIGSERIAL PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_id TEXT,
      action TEXT NOT NULL,
      diff JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('  tabelle create.');

  console.log('Creazione indici...');
  await pool.query(`
    CREATE INDEX IF NOT EXISTS orders_shopify_id_idx       ON orders (shopify_numeric_id);
    CREATE INDEX IF NOT EXISTS orders_updated_at_idx       ON orders (updated_at DESC);
    CREATE INDEX IF NOT EXISTS orders_financial_status_idx ON orders (financial_status);
    CREATE INDEX IF NOT EXISTS inventory_state_idx         ON inventory_items (piece_state);
    CREATE INDEX IF NOT EXISTS inventory_order_idx         ON inventory_items (allocated_to_order_id);
    CREATE INDEX IF NOT EXISTS sales_requests_status_idx   ON sales_requests (status);
    CREATE INDEX IF NOT EXISTS sales_requests_phone_idx    ON sales_requests (phone);
    CREATE INDEX IF NOT EXISTS audit_log_entity_idx        ON audit_log (entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS audit_log_created_idx       ON audit_log (created_at DESC);
  `);
  console.log('  indici creati.\n');
}

// ---------------------------------------------------------------------------
// 2. Leggi il blob JSON dallo store Postgres
// ---------------------------------------------------------------------------

async function readStore() {
  console.log("Lettura blob store da app_documents WHERE key='store'...");
  let result;
  try {
    result = await pool.query("SELECT payload FROM app_documents WHERE key = 'store' LIMIT 1");
  } catch (err) {
    console.error('  Errore lettura app_documents:', err.message);
    console.error('  La tabella app_documents potrebbe non esistere ancora. Uscita.');
    process.exit(1);
  }

  if (!result.rows.length || !result.rows[0].payload) {
    console.warn('  Nessun blob trovato. Migrazione dati saltata.');
    return {};
  }

  const payload = result.rows[0].payload;
  const store = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const counts = {
    orders: (store.orders ?? []).length,
    inventory: (store.inventory ?? []).length,
    jobs: (store.jobs ?? []).length,
    salesRequests: (store.salesRequests ?? []).length,
    users: (store.users ?? []).length,
  };
  console.log(`  blob letto: ordini=${counts.orders}, inventory=${counts.inventory}, lavori=${counts.jobs}, richieste=${counts.salesRequests}, utenti=${counts.users}\n`);
  return store;
}

// ---------------------------------------------------------------------------
// 3. Migra ordini
// ---------------------------------------------------------------------------

async function migrateOrders(orders) {
  console.log(`Migrazione ordini (${orders.length})...`);
  let count = 0;

  for (const order of orders) {
    const ops = order.operations || {};
    const warehouseCol  = ops.warehouse    ?? {};
    const installCol    = ops.installation ?? {};
    const accountingCol = order.accounting ?? ops.accounting ?? {};

    await pool.query(`
      INSERT INTO orders (
        id, shopify_numeric_id, shopify_graphql_id, order_number,
        first_name, last_name, email, phone,
        city, address, postal_code, province_code, province, country_code,
        financial_status, fulfillment_status, payment_method,
        source, note, total,
        totals, billing, warehouse, installation, accounting,
        line_items, line_details, attachments,
        converted_job_id,
        operations_json,
        shopify_raw,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20,
        $21, $22, $23, $24, $25,
        $26, $27, $28,
        $29,
        $30,
        $31,
        $32, $33
      )
      ON CONFLICT (id) DO UPDATE SET
        shopify_numeric_id  = EXCLUDED.shopify_numeric_id,
        shopify_graphql_id  = EXCLUDED.shopify_graphql_id,
        order_number        = EXCLUDED.order_number,
        first_name          = EXCLUDED.first_name,
        last_name           = EXCLUDED.last_name,
        email               = EXCLUDED.email,
        phone               = EXCLUDED.phone,
        city                = EXCLUDED.city,
        address             = EXCLUDED.address,
        postal_code         = EXCLUDED.postal_code,
        province_code       = EXCLUDED.province_code,
        province            = EXCLUDED.province,
        country_code        = EXCLUDED.country_code,
        financial_status    = EXCLUDED.financial_status,
        fulfillment_status  = EXCLUDED.fulfillment_status,
        payment_method      = EXCLUDED.payment_method,
        source              = EXCLUDED.source,
        note                = EXCLUDED.note,
        total               = EXCLUDED.total,
        totals              = EXCLUDED.totals,
        billing             = EXCLUDED.billing,
        warehouse           = EXCLUDED.warehouse,
        installation        = EXCLUDED.installation,
        accounting          = EXCLUDED.accounting,
        line_items          = EXCLUDED.line_items,
        line_details        = EXCLUDED.line_details,
        attachments         = EXCLUDED.attachments,
        converted_job_id    = EXCLUDED.converted_job_id,
        operations_json     = EXCLUDED.operations_json,
        shopify_raw         = EXCLUDED.shopify_raw,
        created_at          = EXCLUDED.created_at,
        updated_at          = EXCLUDED.updated_at
    `, [
      String(order.id),
      String(order.shopifyNumericId || order.id || ''),
      String(order.shopifyGraphqlId || ''),
      String(order.orderNumber || ''),
      String(order.firstName || ''),
      String(order.lastName || ''),
      String(order.email || ''),
      String(order.phone || ''),
      String(order.city || ''),
      String(order.address || ''),
      String(order.postalCode || ''),
      String(order.provinceCode || ''),
      String(order.province || ''),
      String(order.countryCode || 'IT'),
      String(order.financialStatus || 'pending'),
      String(order.fulfillmentStatus || 'unfulfilled'),
      String(order.paymentMethod || ''),
      String(order.source || 'shopify-json'),
      String(order.note || ''),
      String(order.total || ''),
      JSON.stringify(safeJson(order.totals) ?? {}),
      JSON.stringify(safeJson(order.billing) ?? {}),
      JSON.stringify(safeJson(warehouseCol) ?? {}),
      JSON.stringify(safeJson(installCol) ?? {}),
      JSON.stringify(safeJson(accountingCol) ?? {}),
      JSON.stringify(Array.isArray(order.lineItems) ? order.lineItems : []),
      JSON.stringify(Array.isArray(order.lineDetails) ? order.lineDetails : []),
      JSON.stringify(Array.isArray(order.attachments) ? order.attachments : []),
      order.convertedJobId ? String(order.convertedJobId) : null,
      JSON.stringify(safeJson(order.operations) ?? {}),
      JSON.stringify({}),
      safeTs(order.createdAt) ?? new Date().toISOString(),
      safeTs(order.updatedAt) ?? new Date().toISOString(),
    ]);
    count++;
    if (count % 100 === 0) console.log(`  ... ${count} ordini elaborati`);
  }

  console.log(`  ordini migrati: ${count}`);
  return count;
}

// ---------------------------------------------------------------------------
// 4. Migra inventory
// ---------------------------------------------------------------------------

async function migrateInventory(inventory) {
  console.log(`Migrazione inventory (${inventory.length})...`);
  let count = 0;

  for (const item of inventory) {
    // allocatedToOrderId: store nei campi committedOrderId
    const allocatedTo = item.committedOrderId || item.orderId || item.allocatedToOrderId || null;
    // family non è un campo canonico nel normalizeInventoryPieceRecord, ma potrebbe essere presente
    const family = item.family || item.variant || null;
    // label composta: es. "4.0 x 12.5"
    const label = item.label || (item.width && item.length ? `${item.width} x ${item.length}` : null);

    await pool.query(`
      INSERT INTO inventory_items (
        id, product, family,
        piece_type, piece_state,
        width, length, units, label,
        allocated_to_order_id,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        product               = EXCLUDED.product,
        family                = EXCLUDED.family,
        piece_type            = EXCLUDED.piece_type,
        piece_state           = EXCLUDED.piece_state,
        width                 = EXCLUDED.width,
        length                = EXCLUDED.length,
        units                 = EXCLUDED.units,
        label                 = EXCLUDED.label,
        allocated_to_order_id = EXCLUDED.allocated_to_order_id,
        created_at            = EXCLUDED.created_at,
        updated_at            = EXCLUDED.updated_at
    `, [
      String(item.id),
      String(item.product || ''),
      family ? String(family) : null,
      String(item.pieceType || item.status || ''),
      String(item.pieceState || item.availability || 'disponibile'),
      safeNum(item.width),
      safeNum(item.length),
      item.units != null ? String(item.units) : null,
      label ? String(label) : null,
      allocatedTo ? String(allocatedTo) : null,
      safeTs(item.createdAt) ?? new Date().toISOString(),
      safeTs(item.updatedAt ?? item.createdAt) ?? new Date().toISOString(),
    ]);
    count++;
  }

  console.log(`  inventory migrati: ${count}`);
  return count;
}

// ---------------------------------------------------------------------------
// 5. Migra jobs
// ---------------------------------------------------------------------------

async function migrateJobs(jobs) {
  console.log(`Migrazione jobs (${jobs.length})...`);
  let count = 0;

  for (const job of jobs) {
    await pool.query(`
      INSERT INTO jobs (
        id,
        first_name, last_name, city, phone, email, address,
        job_type, surface, product, sqm,
        install_date, install_time, crew,
        priority, warehouse_status, install_status,
        materials, notes, attachments,
        source_order_id,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20,
        $21,
        $22, $23
      )
      ON CONFLICT (id) DO UPDATE SET
        first_name       = EXCLUDED.first_name,
        last_name        = EXCLUDED.last_name,
        city             = EXCLUDED.city,
        phone            = EXCLUDED.phone,
        email            = EXCLUDED.email,
        address          = EXCLUDED.address,
        job_type         = EXCLUDED.job_type,
        surface          = EXCLUDED.surface,
        product          = EXCLUDED.product,
        sqm              = EXCLUDED.sqm,
        install_date     = EXCLUDED.install_date,
        install_time     = EXCLUDED.install_time,
        crew             = EXCLUDED.crew,
        priority         = EXCLUDED.priority,
        warehouse_status = EXCLUDED.warehouse_status,
        install_status   = EXCLUDED.install_status,
        materials        = EXCLUDED.materials,
        notes            = EXCLUDED.notes,
        attachments      = EXCLUDED.attachments,
        source_order_id  = EXCLUDED.source_order_id,
        created_at       = EXCLUDED.created_at,
        updated_at       = EXCLUDED.updated_at
    `, [
      String(job.id),
      String(job.firstName || ''),
      String(job.lastName || ''),
      String(job.city || ''),
      String(job.phone || ''),
      String(job.email || ''),
      String(job.address || ''),
      String(job.jobType || ''),
      String(job.surface || ''),
      String(job.product || ''),
      safeNum(job.sqm),
      String(job.installDate || ''),
      String(job.installTime || ''),
      String(job.crew || ''),
      String(job.priority || ''),
      String(job.warehouseStatus || 'da-preparare'),
      String(job.installStatus || 'da-pianificare'),
      JSON.stringify(Array.isArray(job.materials) ? job.materials : []),
      String(job.notes || ''),
      JSON.stringify(Array.isArray(job.attachments) ? job.attachments : []),
      job.sourceOrderId ? String(job.sourceOrderId) : null,
      safeTs(job.createdAt) ?? new Date().toISOString(),
      safeTs(job.updatedAt ?? job.createdAt) ?? new Date().toISOString(),
    ]);
    count++;
  }

  console.log(`  jobs migrati: ${count}`);
  return count;
}

// ---------------------------------------------------------------------------
// 6. Migra sales_requests
// ---------------------------------------------------------------------------

async function migrateSalesRequests(requests) {
  console.log(`Migrazione sales_requests (${requests.length})...`);
  let count = 0;

  for (const req of requests) {
    await pool.query(`
      INSERT INTO sales_requests (
        id,
        first_name, last_name, email, phone,
        city, address, postal_code, province_code, province, country_code,
        company, job_type, surface, sqm, note,
        status, assignment, first_contact_by, first_contact_at,
        source, source_row_number,
        attachments,
        whatsapp_thread_id,
        created_at, updated_at
      ) VALUES (
        $1,
        $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20,
        $21, $22,
        $23,
        $24,
        $25, $26
      )
      ON CONFLICT (id) DO UPDATE SET
        first_name        = EXCLUDED.first_name,
        last_name         = EXCLUDED.last_name,
        email             = EXCLUDED.email,
        phone             = EXCLUDED.phone,
        city              = EXCLUDED.city,
        address           = EXCLUDED.address,
        postal_code       = EXCLUDED.postal_code,
        province_code     = EXCLUDED.province_code,
        province          = EXCLUDED.province,
        country_code      = EXCLUDED.country_code,
        company           = EXCLUDED.company,
        job_type          = EXCLUDED.job_type,
        surface           = EXCLUDED.surface,
        sqm               = EXCLUDED.sqm,
        note              = EXCLUDED.note,
        status            = EXCLUDED.status,
        assignment        = EXCLUDED.assignment,
        first_contact_by  = EXCLUDED.first_contact_by,
        first_contact_at  = EXCLUDED.first_contact_at,
        source            = EXCLUDED.source,
        source_row_number = EXCLUDED.source_row_number,
        attachments       = EXCLUDED.attachments,
        whatsapp_thread_id = EXCLUDED.whatsapp_thread_id,
        created_at        = EXCLUDED.created_at,
        updated_at        = EXCLUDED.updated_at
    `, [
      String(req.id),
      String(req.firstName || ''),
      String(req.lastName || ''),
      String(req.email || ''),
      String(req.phone || ''),
      String(req.city || ''),
      String(req.address || ''),
      String(req.postalCode || ''),
      String(req.provinceCode || ''),
      String(req.province || ''),
      String(req.countryCode || 'IT'),
      String(req.company || ''),
      String(req.jobType || ''),
      String(req.surface || ''),
      safeNum(req.sqm),
      String(req.note || ''),
      String(req.status || ''),
      String(req.assignment || ''),
      String(req.firstContactBy || ''),
      safeTs(req.firstContactAt),
      String(req.source || ''),
      req.sourceRowNumber != null ? Number(req.sourceRowNumber) : null,
      JSON.stringify(Array.isArray(req.attachments) ? req.attachments : []),
      req.whatsappThreadId ? String(req.whatsappThreadId) : null,
      safeTs(req.createdAt) ?? new Date().toISOString(),
      safeTs(req.updatedAt ?? req.createdAt) ?? new Date().toISOString(),
    ]);
    count++;
    if (count % 200 === 0) console.log(`  ... ${count} richieste elaborate`);
  }

  console.log(`  sales_requests migrate: ${count}`);
  return count;
}

// ---------------------------------------------------------------------------
// 7. Migra settings
// ---------------------------------------------------------------------------

async function migrateSettings(store) {
  console.log('Migrazione settings...');
  const entries = [
    { key: 'shopify',            value: store.shopifySettings ?? {} },
    { key: 'salesRequestSource', value: store.salesRequestSource ?? {} },
    { key: 'coveragePlanner',    value: store.coveragePlanner ?? {} },
  ];

  for (const { key, value } of entries) {
    await pool.query(`
      INSERT INTO settings (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value      = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
    `, [key, JSON.stringify(value)]);
  }

  console.log(`  settings migrate: ${entries.length} chiavi`);
}

// ---------------------------------------------------------------------------
// 8. Migra catalog_items
// ---------------------------------------------------------------------------

async function migrateCatalog(store) {
  console.log('Migrazione catalog_items...');
  let count = 0;

  // category='crew' — da store.users dove role === 'crew'
  const crewUsers = (store.users ?? []).filter((u) => u.role === 'crew');
  for (let i = 0; i < crewUsers.length; i++) {
    const user = crewUsers[i];
    const crewValue = String(user.crewName || user.name || `crew-${i}`).trim();
    if (!crewValue) continue;
    await pool.query(`
      INSERT INTO catalog_items (category, value, label, position, metadata, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, [
      'crew',
      crewValue,
      crewValue,
      i,
      JSON.stringify({ capacity: user.dailyCapacity ?? 120 }),
      true,
    ]);
    count++;
  }

  // category='sales_assignment' — valori unici da store.salesRequests[].assignment
  const assignments = [...new Set(
    (store.salesRequests ?? [])
      .map((r) => String(r.assignment || '').trim())
      .filter(Boolean),
  )];
  for (let i = 0; i < assignments.length; i++) {
    await pool.query(`
      INSERT INTO catalog_items (category, value, label, position, metadata, active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `, [
      'sales_assignment',
      assignments[i],
      assignments[i],
      i,
      JSON.stringify({}),
      true,
    ]);
    count++;
  }

  console.log(`  catalog_items migrati: ${count} (${crewUsers.length} crew, ${assignments.length} assignment)`);
  return count;
}

// ---------------------------------------------------------------------------
// 9. Conteggi finali
// ---------------------------------------------------------------------------

async function printFinalCounts() {
  const tables = ['orders', 'inventory_items', 'jobs', 'sales_requests', 'settings', 'catalog_items', 'audit_log'];
  console.log('\n=== Conteggi finali nelle tabelle ===');
  for (const table of tables) {
    const res = await pool.query(`SELECT COUNT(*) AS n FROM ${table}`);
    console.log(`  ${table.padEnd(20)} ${res.rows[0].n} record`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  console.log('=== PSI Ops — Migrazione schema relazionale ===\n');

  try {
    // 1. Crea tabelle e indici
    await createTables();

    // 2. Leggi blob store
    const store = await readStore();

    // Se lo store è vuoto non c'è nulla da migrare
    if (!Object.keys(store).length) {
      console.log('Store vuoto — nessun dato da migrare.');
      await printFinalCounts();
      return;
    }

    // 3. Migra ogni entità
    const stats = {};
    stats.orders        = await migrateOrders(store.orders ?? []);
    stats.inventory     = await migrateInventory(store.inventory ?? []);
    stats.jobs          = await migrateJobs(store.jobs ?? []);
    stats.salesRequests = await migrateSalesRequests(store.salesRequests ?? []);
    await migrateSettings(store);
    await migrateCatalog(store);

    // 4. Riepilogo migrazione
    console.log('\n=== Migrazione completata ===');
    for (const [k, v] of Object.entries(stats)) {
      console.log(`  ${String(k).padEnd(16)} ${v} record migrati`);
    }

    // 5. Conteggi attuali nelle tabelle
    await printFinalCounts();

  } catch (err) {
    console.error('\nErrore durante la migrazione:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
