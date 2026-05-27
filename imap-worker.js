/**
 * IMAP Shadow Worker — Fase 1 migrazione lead (Architettura B)
 *
 * Scopo: leggere in SOLA LETTURA la casella `contatti@pratosinteticoitalia.it`
 * via IMAP, parsare le email di nuove richieste preventivo arrivate dal sito,
 * e salvarle nella tabella `incoming_leads_shadow` per audit + validazione
 * (vedi ANALISI.md Fase 2). NON inserisce ancora niente in `sales_requests`
 * — il "doppio binario" con import manuale arriva in Fase 3.
 *
 * Kill switch: env var IMAP_SHADOW_ENABLED = "true". Senza di essa il worker
 * non parte. Senza credenziali (IMAP_HOST/USER/PASSWORD) parte ma fallisce
 * subito e logga un warning chiaro.
 *
 * Sicurezza:
 *   - Connessione TLS (porta 993)
 *   - Operazioni solo READ (fetch, mai delete/move/store con flag changes)
 *   - Credenziali sempre da env, mai hard-coded
 *   - Errori loggati con redact di header sensibili
 *
 * Parser: in Fase 1A (questa) il parser e' un placeholder che salva solo
 * raw_body_preview + metadati. Il parsing strutturato (estrazione di nome,
 * telefono, mq, prodotto) richiede campioni email reali → Fase 1B.
 */

let imapflowLib = null;
async function loadImapFlow() {
  if (imapflowLib) return imapflowLib;
  try {
    const mod = await import("imapflow");
    imapflowLib = mod.ImapFlow || mod.default?.ImapFlow || mod.default;
    return imapflowLib;
  } catch (err) {
    console.warn("[imap-worker] imapflow non disponibile:", err?.message || err);
    return null;
  }
}

const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const DEFAULT_MAILBOX = "INBOX";
const PARSER_VERSION = "v0-placeholder";

let workerState = {
  running: false,
  lastPollAt: null,
  lastSuccessAt: null,
  lastError: null,
  totalSeen: 0,
  totalParsed: 0,
  totalFailed: 0,
  pollTimer: null,
};

function redactEmail(email) {
  if (!email) return "";
  const str = String(email);
  const atIdx = str.indexOf("@");
  if (atIdx < 2) return str.replace(/[a-zA-Z0-9]/g, "*");
  return `${str.slice(0, 2)}***${str.slice(atIdx)}`;
}

function isEnabled() {
  return String(process.env.IMAP_SHADOW_ENABLED || "").trim().toLowerCase() === "true";
}

function getConfig() {
  return {
    enabled: isEnabled(),
    host: String(process.env.IMAP_HOST || "").trim(),
    port: Number(process.env.IMAP_PORT || 993),
    secure: String(process.env.IMAP_SECURE || "true").trim().toLowerCase() !== "false",
    user: String(process.env.IMAP_USER || "").trim(),
    password: String(process.env.IMAP_PASSWORD || "").trim(),
    mailbox: String(process.env.IMAP_MAILBOX || DEFAULT_MAILBOX).trim() || DEFAULT_MAILBOX,
    pollIntervalMs: Number(process.env.IMAP_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS),
  };
}

function hasValidConfig(cfg) {
  return Boolean(cfg.host && cfg.user && cfg.password);
}

/**
 * Parser placeholder: estrae solo i metadati base e un preview del corpo.
 * In Fase 1B sostituiremo questa funzione con un parser strutturato che
 * estrae nome, cognome, telefono, mq, prodotto, ecc. dal body delle email
 * generate dal PHP del sito.
 */
function placeholderParseLeadEmail(message) {
  const subject = String(message?.envelope?.subject || "").trim();
  const fromAddr = message?.envelope?.from?.[0] || {};
  const fromEmail = String(fromAddr.address || "").trim();
  const fromName = String(fromAddr.name || "").trim();
  const receivedAt = message?.envelope?.date ? new Date(message.envelope.date) : new Date();
  const bodyText = String(message?.bodyText || message?.source || "").slice(0, 2000);
  return {
    subject,
    fromEmail,
    fromName,
    receivedAt,
    rawBodyPreview: bodyText,
    parsedPayload: {},
    parserVersion: PARSER_VERSION,
    parseStatus: "pending", // Fase 1A: niente parsing strutturato ancora
    parseErrors: [],
  };
}

async function persistShadowRecord(pool, messageId, uid, mailbox, parsed) {
  if (!pool || !messageId) return false;
  try {
    await pool.query(
      `INSERT INTO incoming_leads_shadow (
        imap_message_id, imap_uid, imap_mailbox,
        from_email, from_name, subject, received_at,
        raw_body_preview, parsed_payload, parser_version,
        parse_status, parse_errors
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (imap_message_id) DO NOTHING`,
      [
        messageId, uid, mailbox,
        parsed.fromEmail || "", parsed.fromName || "", parsed.subject || "", parsed.receivedAt,
        parsed.rawBodyPreview || "", JSON.stringify(parsed.parsedPayload || {}), parsed.parserVersion,
        parsed.parseStatus, JSON.stringify(parsed.parseErrors || []),
      ],
    );
    return true;
  } catch (err) {
    console.warn("[imap-worker] persistShadowRecord errore:", err?.message || err);
    return false;
  }
}

/**
 * Un singolo ciclo di polling: connette, fetcha messaggi nuovi (UID > last_seen),
 * parsa con placeholder, salva nello shadow store. Chiude la connessione a fine.
 */
async function runPollCycle(pool) {
  const cfg = getConfig();
  if (!cfg.enabled) return { skipped: "disabled" };
  if (!hasValidConfig(cfg)) {
    workerState.lastError = "missing_credentials";
    return { skipped: "no_credentials" };
  }
  const ImapFlow = await loadImapFlow();
  if (!ImapFlow) {
    workerState.lastError = "imapflow_not_installed";
    return { skipped: "no_library" };
  }

  workerState.lastPollAt = new Date();
  let client = null;
  try {
    client = new ImapFlow({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.password },
      logger: false, // niente log verbose; solo nostri log
    });
    await client.connect();
    const lock = await client.getMailboxLock(cfg.mailbox);
    try {
      // Trova il massimo UID gia' visto dal nostro shadow store per fare delta sync
      let lastUid = 0;
      try {
        const res = await pool.query(
          "SELECT MAX(imap_uid) AS max_uid FROM incoming_leads_shadow WHERE imap_mailbox = $1",
          [cfg.mailbox],
        );
        lastUid = Number(res?.rows?.[0]?.max_uid || 0);
      } catch (err) {
        console.warn("[imap-worker] query lastUid fallita:", err?.message);
      }

      const fetchRange = lastUid > 0 ? `${lastUid + 1}:*` : "1:*";
      let count = 0;
      for await (const msg of client.fetch(fetchRange, {
        uid: true,
        envelope: true,
        bodyParts: ["text"],
        source: false,
      }, { uid: true })) {
        count++;
        workerState.totalSeen++;
        const messageId = String(msg?.envelope?.messageId || `uid:${cfg.mailbox}:${msg.uid}`).trim();
        const parsed = placeholderParseLeadEmail(msg);
        const ok = await persistShadowRecord(pool, messageId, msg.uid, cfg.mailbox, parsed);
        if (ok) workerState.totalParsed++; else workerState.totalFailed++;
      }
      workerState.lastSuccessAt = new Date();
      workerState.lastError = null;
      return { fetched: count, lastUid };
    } finally {
      lock.release();
    }
  } catch (err) {
    workerState.lastError = String(err?.message || err);
    console.warn("[imap-worker] poll cycle errore:", workerState.lastError);
    return { error: workerState.lastError };
  } finally {
    if (client) {
      try { await client.logout(); } catch {}
    }
  }
}

function startImapWorker(pool) {
  if (workerState.running) return;
  const cfg = getConfig();
  if (!cfg.enabled) {
    console.log("[imap-worker] disabilitato (IMAP_SHADOW_ENABLED!=true) — worker dormant");
    return;
  }
  workerState.running = true;
  console.log(`[imap-worker] avviato (host=${cfg.host}, user=${redactEmail(cfg.user)}, mailbox=${cfg.mailbox}, interval=${cfg.pollIntervalMs}ms)`);

  // Primo ciclo dopo 10s (lascia tempo al server di completare boot)
  setTimeout(() => {
    void runPollCycle(pool);
  }, 10_000);

  workerState.pollTimer = setInterval(() => {
    void runPollCycle(pool);
  }, Math.max(60_000, cfg.pollIntervalMs)); // floor 1 minuto per evitare abuse
}

function stopImapWorker() {
  if (workerState.pollTimer) {
    clearInterval(workerState.pollTimer);
    workerState.pollTimer = null;
  }
  workerState.running = false;
  console.log("[imap-worker] fermato");
}

function getImapWorkerStatus() {
  const cfg = getConfig();
  return {
    enabled: cfg.enabled,
    configured: hasValidConfig(cfg),
    running: workerState.running,
    host: cfg.host || null,
    user: redactEmail(cfg.user),
    mailbox: cfg.mailbox,
    pollIntervalMs: cfg.pollIntervalMs,
    lastPollAt: workerState.lastPollAt,
    lastSuccessAt: workerState.lastSuccessAt,
    lastError: workerState.lastError,
    totalSeen: workerState.totalSeen,
    totalParsed: workerState.totalParsed,
    totalFailed: workerState.totalFailed,
    parserVersion: PARSER_VERSION,
  };
}

export {
  startImapWorker,
  stopImapWorker,
  runPollCycle,
  getImapWorkerStatus,
  isEnabled as isImapWorkerEnabled,
  hasValidConfig as hasImapWorkerConfig,
  getConfig as getImapWorkerConfig,
};
