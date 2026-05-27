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

// Auto-promote: importato lazy per evitare dipendenze al boot del worker
let leadFingerprintLib = null;
async function loadLeadFingerprint() {
  if (leadFingerprintLib) return leadFingerprintLib;
  try {
    leadFingerprintLib = await import("./lead-fingerprint.mjs");
    return leadFingerprintLib;
  } catch (err) {
    console.warn("[imap-worker] lead-fingerprint non disponibile:", err?.message || err);
    return null;
  }
}

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

let mailparserLib = null;
async function loadMailParser() {
  if (mailparserLib) return mailparserLib;
  try {
    const mod = await import("mailparser");
    mailparserLib = mod.simpleParser || mod.default?.simpleParser;
    return mailparserLib;
  } catch (err) {
    console.warn("[imap-worker] mailparser non disponibile:", err?.message || err);
    return null;
  }
}

const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const DEFAULT_MAILBOX = "INBOX";
const PARSER_VERSION = "v2-multi-template";

// Pattern dei campi nelle email generate dai form PHP di pratosinteticoitalia.com.
// Esistono almeno 2 template: il modulo del sito principale (8-9 campi base) e
// il modulo "landing" (campi base + 6 campi extra: area di posa, posa in opera,
// fondo, animali domestici, descrizione area, note posa).
//
// Le regex sono permissive: case-insensitive, accettano spazi extra, fine riga
// \r\n o \n. La citta' puo' avere accenti. Alcuni campi terminano con ; o \,
// li puliamo nella normalizzazione.
const PSI_LEAD_PATTERNS = {
  // Campi base (presenti in entrambi i template)
  nome:               /Nome:\s*([^\r\n]+)/i,
  email:              /Email:\s*(\S+@\S+)/i,
  telefono:           /Telefono:\s*([^\r\n]+)/i,
  citta:              /Citt[àa]:\s*([^\r\n]+)/i,
  tipologia_cliente:  /Tipologia\s*cliente:\s*([^\r\n]+)/i,
  metri_quadri:       /Metri\s*quadri:\s*([\d.,]+)/i,
  kit_installazione:  /Kit\s*installazione:\s*([^\r\n]+)/i,
  altezza:            /Altezza:\s*([^\r\n;]+)/i,
  // Note aggiuntive/posa possono essere VUOTE: usiamo [ \t]* invece di \s*
  // dopo i due punti per evitare che il match consumi newlines e finisca
  // catturando il valore della riga successiva (bug riscontrato in test).
  note_aggiuntive:    /Note\s*aggiuntive:[ \t]*([^\r\n]*)/i,
  sorgente_pagina:    /Ricevuti\s*dalla\s*pagina:\s*(\S+)/i,
  // Campi extra del template "landing"
  area_di_posa:       /Area\s*di\s*posa:\s*([^\r\n]+)/i,
  posa_in_opera:      /Posa\s*in\s*opera:\s*([^\r\n]+)/i,
  fondo:              /Fondo:\s*([^\r\n]+)/i,
  animali_domestici:  /Animali\s*domestici:\s*([^\r\n]+)/i,
  descrizione_area:   /Descrizione\s*dell['’]area:\s*([^\r\n]+)/i,
  note_posa:          /Note\s*Posa:[ \t]*([^\r\n]*)/i,
};

// Sanitizza valori di tipo testo: rimuove caratteri di escape spuri (\) che
// alcuni form PHP inseriscono ai bordi dei campi, normalizza spazi, trim.
function cleanText(raw) {
  if (raw == null) return "";
  return String(raw)
    .replace(/\\+$/g, "")        // rimuove backslash finali (es. "GIUSEPPE CRINO\")
    .replace(/^\\+/g, "")        // rimuove backslash iniziali
    .replace(/\s{2,}/g, " ")
    .trim();
}

// Strip HTML basico: rimuove tag, normalizza entità HTML comuni, mantiene il
// testo. Usato come fallback se la mail non ha bodyText (solo HTML).
function stripHtmlToText(html) {
  if (!html) return "";
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&agrave;/gi, "à")
    .replace(/&egrave;/gi, "è")
    .replace(/&igrave;/gi, "ì")
    .replace(/&ograve;/gi, "ò")
    .replace(/&ugrave;/gi, "ù")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizePhoneIt(raw) {
  if (!raw) return "";
  // Mantiene cifre e il + iniziale (per prefissi internazionali)
  const cleaned = String(raw).trim().replace(/[^\d+]/g, "");
  return cleaned;
}

function normalizeKitBoolean(raw) {
  if (raw == null) return null;
  const v = String(raw).trim().toLowerCase();
  if (["si", "sì", "yes", "true", "1"].includes(v)) return true;
  if (["no", "false", "0", "n"].includes(v)) return false;
  return null;
}

function parsePsiLeadEmail({ subject, fromEmail, fromName, receivedAt, bodyText, bodyHtml }) {
  // Pre-processing: preferiamo plain text; se vuoto, strippiamo l'HTML.
  let text = String(bodyText || "").trim();
  if (!text && bodyHtml) text = stripHtmlToText(bodyHtml);

  const errors = [];
  const payload = {};
  let matchedFields = 0;

  for (const [key, regex] of Object.entries(PSI_LEAD_PATTERNS)) {
    const m = text.match(regex);
    if (m) {
      const cleaned = cleanText(m[1]);
      if (cleaned) {
        payload[key] = cleaned;
        matchedFields++;
      }
    }
  }

  // Normalizzazioni — campi base
  if (payload.email) {
    payload.email = payload.email.toLowerCase().replace(/[<>,;]+$/g, "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
      errors.push({ field: "email", reason: "invalid_format", value: payload.email });
      delete payload.email;
    }
  }
  if (payload.telefono) {
    payload.telefono_raw = payload.telefono;
    payload.telefono = normalizePhoneIt(payload.telefono);
  }
  if (payload.metri_quadri) {
    payload.metri_quadri_raw = payload.metri_quadri;
    const num = parseFloat(String(payload.metri_quadri).replace(",", "."));
    if (Number.isFinite(num) && num >= 0) {
      payload.metri_quadri = num;
    } else {
      errors.push({ field: "metri_quadri", reason: "not_a_number", value: payload.metri_quadri });
      delete payload.metri_quadri;
    }
  }
  if (payload.kit_installazione) {
    payload.kit_installazione_raw = payload.kit_installazione;
    const bool = normalizeKitBoolean(payload.kit_installazione);
    if (bool !== null) payload.kit_installazione = bool;
  }
  if (payload.note_aggiuntive) {
    payload.note_aggiuntive = String(payload.note_aggiuntive).slice(0, 1000).trim();
  }

  // Normalizzazioni — campi template "landing"
  if (payload.animali_domestici) {
    payload.animali_domestici_raw = payload.animali_domestici;
    const bool = normalizeKitBoolean(payload.animali_domestici); // riusa "si/no" parser
    if (bool !== null) payload.animali_domestici = bool;
  }
  if (payload.posa_in_opera) {
    // Normalizza in valori chiave: "fornitura", "fornitura+posa"
    const v = payload.posa_in_opera.toLowerCase();
    if (v.includes("posa")) payload.posa_in_opera_normalized = "fornitura+posa";
    else payload.posa_in_opera_normalized = "fornitura";
  }
  if (payload.descrizione_area) {
    payload.descrizione_area = payload.descrizione_area.slice(0, 1000).trim();
  }
  if (payload.note_posa) {
    payload.note_posa = payload.note_posa.slice(0, 1000).trim();
  }
  if (payload.fondo) {
    // Normalizza in valori chiave: "terra", "cemento", "erba", "altro"
    const v = payload.fondo.toLowerCase();
    if (v.includes("terra")) payload.fondo_normalized = "terra";
    else if (v.includes("cemento") || v.includes("asfalto")) payload.fondo_normalized = "cemento";
    else if (v.includes("erba") || v.includes("prato")) payload.fondo_normalized = "erba";
    else payload.fondo_normalized = "altro";
  }

  // Status:
  //   ok      → almeno nome, email o telefono, metri_quadri (lead utilizzabile)
  //   partial → matchato qualche campo ma non i 4 base
  //   no_match → niente, probabilmente non e' una richiesta preventivo
  const requiredKeys = ["nome", "metri_quadri"];
  const optionalContactKeys = ["email", "telefono"];
  const hasRequired = requiredKeys.every((k) => payload[k] != null && payload[k] !== "");
  const hasContact = optionalContactKeys.some((k) => payload[k] != null && payload[k] !== "");
  let status;
  if (hasRequired && hasContact) status = "ok";
  else if (matchedFields > 0) status = "partial";
  else status = "no_match";

  // Metadati di parsing
  payload._meta = {
    matchedFields,
    parserVersion: PARSER_VERSION,
    subject,
    fromEmail,
    fromName,
    receivedAtIso: receivedAt instanceof Date ? receivedAt.toISOString() : null,
  };

  return { payload, status, errors };
}

let workerState = {
  running: false,
  lastPollAt: null,
  lastSuccessAt: null,
  lastError: null,
  totalSeen: 0,
  totalParsed: 0,
  totalFailed: 0,
  pollTimer: null,
  // Fase 4 — stats auto-promote
  lastAutoReconcileAt: null,
  lastAutoReconcileResult: null, // { matched, imported, errors: N }
  totalAutoMatched: 0,
  totalAutoImported: 0,
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
    // Fase 4: auto-reconcile dei nuovi shadow leads dopo ogni polling cycle.
    // Quando true, dopo aver fetchato/salvato le nuove email il worker chiama
    // il reconciler che le promuove automaticamente a sales_requests nel CRM
    // (link se esistono gia' via Sheets, import se sono orfane).
    autoPromote: String(process.env.IMAP_AUTO_PROMOTE || "false").trim().toLowerCase() === "true",
  };
}

function hasValidConfig(cfg) {
  return Boolean(cfg.host && cfg.user && cfg.password);
}

/**
 * Estrae i campi richiesta dall'email PHP del sito pratosinteticoitalia.com.
 * Parser strutturato v1 (vedi PSI_LEAD_PATTERNS sopra). Restituisce un oggetto
 * pronto per persistShadowRecord con metadati base + parsedPayload JSON.
 */
function parseLeadEmail(message) {
  const subject = String(message?.envelope?.subject || "").trim();
  const fromAddr = message?.envelope?.from?.[0] || {};
  const fromEmail = String(fromAddr.address || "").trim();
  const fromName = String(fromAddr.name || "").trim();
  const receivedAt = message?.envelope?.date ? new Date(message.envelope.date) : new Date();
  // imapflow puo' restituire bodyText (parts.text) e bodyHtml (parts.html)
  // come stringhe; quando passiamo source:true c'e' anche message.source raw.
  const bodyText = String(message?.bodyText || "");
  const bodyHtml = String(message?.bodyHtml || "");
  const sourceText = bodyText || stripHtmlToText(bodyHtml) || String(message?.source || "");
  const { payload, status, errors } = parsePsiLeadEmail({
    subject, fromEmail, fromName, receivedAt, bodyText, bodyHtml,
  });
  return {
    subject,
    fromEmail,
    fromName,
    receivedAt,
    rawBodyPreview: sourceText.slice(0, 2000),
    parsedPayload: payload,
    parserVersion: PARSER_VERSION,
    parseStatus: status,
    parseErrors: errors,
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
      logger: false,
      // Opzioni TLS permissive: alcune caselle (SiteGround inclusi) usano
      // certificati che ImapFlow non valida by default
      tls: {
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      },
      // Timeouts espliciti
      socketTimeout: 60_000,
      greetingTimeout: 30_000,
    });
    console.log(`[imap-worker] connecting to ${cfg.host}:${cfg.port}...`);
    await client.connect();
    console.log(`[imap-worker] connected, opening mailbox ${cfg.mailbox}...`);
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
      // STRATEGIA: scarichiamo il messaggio MIME completo (source: true,
      // imapflow usa BODY.PEEK[] universalmente supportato) e parsiamo
      // localmente con mailparser. Necessario per server Dovecot stretti
      // (es. SiteGround) che rifiutano la sintassi BODY[1.MIME] usata
      // dall'opzione bodyParts.
      const simpleParser = await loadMailParser();
      console.log(`[imap-worker] starting fetch range ${fetchRange}...`);
      for await (const msg of client.fetch(fetchRange, {
        uid: true,
        envelope: true,
        source: true,
      }, { uid: true })) {
        count++;
        workerState.totalSeen++;
        let bodyText = "";
        let bodyHtml = "";
        if (simpleParser && msg.source) {
          try {
            const parsedMime = await simpleParser(msg.source);
            bodyText = String(parsedMime.text || "");
            bodyHtml = String(parsedMime.html || "");
          } catch (err) {
            console.warn(`[imap-worker] mailparser failed uid=${msg.uid}:`, err?.message);
          }
        }
        // Iniettiamo i body parsati nel message per il parser PSI
        msg.bodyText = bodyText;
        msg.bodyHtml = bodyHtml;
        const messageId = String(msg?.envelope?.messageId || `uid:${cfg.mailbox}:${msg.uid}`).trim();
        const parsed = parseLeadEmail(msg);
        const ok = await persistShadowRecord(pool, messageId, msg.uid, cfg.mailbox, parsed);
        if (ok) workerState.totalParsed++; else workerState.totalFailed++;
        if (count % 100 === 0) {
          console.log(`[imap-worker] progress: ${count} email processate (parsed=${workerState.totalParsed}, failed=${workerState.totalFailed})`);
        }
      }
      console.log(`[imap-worker] fetch completed: ${count} email in this cycle (parsed=${workerState.totalParsed}, failed=${workerState.totalFailed})`);
      workerState.lastSuccessAt = new Date();
      workerState.lastError = null;

      // Fase 4 — auto-promote: se attivato via env IMAP_AUTO_PROMOTE=true,
      // chiama il reconciler in modalita' reale (dryRun=false) per promuovere
      // i nuovi shadow a sales_requests nel CRM. Solo dei lead OK non ancora
      // promossi (limit 500 per ciclo, sufficiente per ritmo normale).
      if (cfg.autoPromote && count > 0) {
        try {
          const lib = await loadLeadFingerprint();
          if (lib && typeof lib.reconcileShadowLeads === "function") {
            console.log("[imap-worker] auto-promote: running reconcileShadowLeads...");
            const recResult = await lib.reconcileShadowLeads(pool, {
              dryRun: false,
              limit: 500,
              onlyOk: true,
            });
            workerState.lastAutoReconcileAt = new Date();
            workerState.lastAutoReconcileResult = {
              matched: recResult.matched,
              imported: recResult.imported,
              errors: (recResult.errors || []).length,
            };
            workerState.totalAutoMatched += recResult.matched || 0;
            workerState.totalAutoImported += recResult.imported || 0;
            console.log(`[imap-worker] auto-promote done: matched=${recResult.matched}, imported=${recResult.imported}, errors=${(recResult.errors || []).length}`);
          }
        } catch (recErr) {
          console.warn("[imap-worker] auto-promote errore:", recErr?.message || recErr);
        }
      }
      return { fetched: count, lastUid };
    } finally {
      lock.release();
    }
  } catch (err) {
    // Logging dettagliato per diagnosi: imapflow espone vari campi utili
    // ("Command failed" da solo non basta per capire la causa)
    const details = {
      message: err?.message,
      code: err?.code,
      response: err?.response,
      responseText: err?.responseText,
      responseStatus: err?.responseStatus,
      authenticationFailed: err?.authenticationFailed,
      serverResponseCode: err?.serverResponseCode,
    };
    workerState.lastError = JSON.stringify(details);
    console.warn("[imap-worker] poll cycle errore:", details);
    if (err?.stack) console.warn("[imap-worker] stack:", err.stack.split("\n").slice(0, 5).join(" | "));
    return { error: details };
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
  // Health: verde se ultimo successo entro 2x intervallo polling, niente errore.
  // Giallo: nessun successo recente o ultimo polling >2x intervallo fa.
  // Rosso: lastError non null AND ultimo successo > 30 min fa (oppure mai).
  const now = Date.now();
  const lastSuccessMs = workerState.lastSuccessAt ? workerState.lastSuccessAt.getTime() : 0;
  const lastPollMs = workerState.lastPollAt ? workerState.lastPollAt.getTime() : 0;
  const healthyWindowMs = Math.max(60_000, cfg.pollIntervalMs * 2);
  let health = "unknown";
  if (!cfg.enabled) {
    health = "disabled";
  } else if (!hasValidConfig(cfg)) {
    health = "no_credentials";
  } else if (workerState.lastError && (now - lastSuccessMs > 30 * 60_000)) {
    health = "error";
  } else if (lastSuccessMs && now - lastSuccessMs < healthyWindowMs) {
    health = "ok";
  } else if (lastPollMs && now - lastPollMs < healthyWindowMs) {
    health = "ok";
  } else if (workerState.running) {
    health = "stale";
  }
  const nextPollEtaMs = lastPollMs && cfg.pollIntervalMs
    ? Math.max(0, (lastPollMs + cfg.pollIntervalMs) - now)
    : null;
  return {
    enabled: cfg.enabled,
    configured: hasValidConfig(cfg),
    running: workerState.running,
    health,
    host: cfg.host || null,
    user: redactEmail(cfg.user),
    mailbox: cfg.mailbox,
    pollIntervalMs: cfg.pollIntervalMs,
    autoPromote: cfg.autoPromote,
    lastPollAt: workerState.lastPollAt,
    lastSuccessAt: workerState.lastSuccessAt,
    lastError: workerState.lastError,
    nextPollEtaMs,
    totalSeen: workerState.totalSeen,
    totalParsed: workerState.totalParsed,
    totalFailed: workerState.totalFailed,
    lastAutoReconcileAt: workerState.lastAutoReconcileAt,
    lastAutoReconcileResult: workerState.lastAutoReconcileResult,
    totalAutoMatched: workerState.totalAutoMatched,
    totalAutoImported: workerState.totalAutoImported,
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
