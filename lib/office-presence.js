// Presenze automatiche dalla rete del capannone (novembre 2026).
//
// Per ufficio e magazzino (i posatori non timbrano). Chi è abilitato e usa il
// portale collegato alla connessione internet del capannone risulta in sede:
//   - entrata: la prima volta nella giornata che usa il portale da quella rete;
//   - uscita: quando l'ultimo suo dispositivo collegato da lì si scollega e
//     non torna entro la tolleranza (10 minuti: un riavvio, un cambio di Wi-Fi);
//     l'ora d'uscita è quella del distacco;
//   - se torna lo stesso giorno il turno si riapre: l'entrata resta quella del
//     mattino e il tempo fuori va nella pausa (un turno al giorno per persona);
//   - la sera, se il PC è rimasto acceso col portale aperto, il turno si chiude
//     all'ultimo utilizzo.
// I turni aperti o chiusi a mano non si toccano.
//
// Qui solo le regole, senza database: server.js raccoglie i segnali e applica
// la decisione.

export const PRESENCE_DEFAULT_TOLERANCE_MIN = 10;
export const PRESENCE_CUTOFF_HOUR = 22;
export const PRESENCE_AUTO_SOURCE = "auto_network";

export function normalizePresenceSettings(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const networks = Array.isArray(source.networks) ? source.networks : [];
  const userIds = Array.isArray(source.userIds) ? source.userIds : [];
  const tolerance = Number(source.toleranceMin);
  return {
    networks: [...new Set(networks.map((value) => normalizeNetwork(value)).filter(Boolean))].slice(0, 20),
    userIds: [...new Set(userIds.map((value) => String(value || "").trim()).filter(Boolean))].slice(0, 200),
    toleranceMin: Number.isFinite(tolerance) ? Math.min(120, Math.max(3, Math.round(tolerance))) : PRESENCE_DEFAULT_TOLERANCE_MIN,
  };
}

export function normalizeIp(ip = "") {
  let value = String(ip || "").trim().toLowerCase();
  if (value.startsWith("::ffff:") && value.includes(".")) value = value.slice(7);
  // "1.2.3.4:5678" (alcuni proxy aggiungono la porta)
  if (/^\d+\.\d+\.\d+\.\d+:\d+$/.test(value)) value = value.split(":")[0];
  return value;
}

// Indirizzo singolo o rete ("93.41.2.10", "93.41.2.0/24", "2a01:e11::/64").
export function normalizeNetwork(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  const [addr, bits] = raw.split("/");
  const ip = normalizeIp(addr);
  if (isIpv4(ip)) {
    if (bits == null) return ip;
    const n = Number(bits);
    return Number.isInteger(n) && n >= 8 && n <= 32 ? `${ip}/${n}` : "";
  }
  if (isIpv6(ip)) {
    if (bits == null) return ip;
    const n = Number(bits);
    return Number.isInteger(n) && n >= 16 && n <= 128 ? `${ip}/${n}` : "";
  }
  return "";
}

function isIpv4(ip) {
  const parts = String(ip).split(".");
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}

function isIpv6(ip) {
  return /^[0-9a-f:]+$/.test(String(ip)) && String(ip).includes(":");
}

function ipv4ToInt(ip) {
  return String(ip).split(".").reduce((acc, part) => ((acc << 8) | Number(part)) >>> 0, 0);
}

function expandIpv6(ip) {
  const [head, tail] = String(ip).split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail != null && tail !== "" ? tail.split(":") : [];
  if (tail == null) return headParts.map((part) => part.padStart(4, "0"));
  const missing = 8 - headParts.length - tailParts.length;
  if (missing < 0) return null;
  return [...headParts, ...Array(missing).fill("0"), ...tailParts].map((part) => part.padStart(4, "0"));
}

export function ipMatchesNetwork(ip, network) {
  const address = normalizeIp(ip);
  const net = normalizeNetwork(network);
  if (!address || !net) return false;
  const [base, bitsRaw] = net.split("/");
  if (isIpv4(address) && isIpv4(base)) {
    if (bitsRaw == null) return address === base;
    const bits = Number(bitsRaw);
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ipv4ToInt(address) & mask) === (ipv4ToInt(base) & mask);
  }
  if (isIpv6(address) && isIpv6(base)) {
    const a = expandIpv6(address);
    const b = expandIpv6(base);
    if (!a || !b) return false;
    const bits = bitsRaw == null ? 128 : Number(bitsRaw);
    const binary = (groups) => groups.map((group) => parseInt(group, 16).toString(2).padStart(16, "0")).join("");
    return binary(a).slice(0, bits) === binary(b).slice(0, bits);
  }
  return false;
}

export function isCompanyNetwork(ip, networks = []) {
  return (Array.isArray(networks) ? networks : []).some((network) => ipMatchesNetwork(ip, network));
}

/**
 * Decide cosa fare per un dipendente abilitato.
 * @param {object} input
 *   now               ms
 *   todayKey          "YYYY-MM-DD" (Europe/Rome) di adesso
 *   dayKeyOf          (ms) => "YYYY-MM-DD" (Europe/Rome)
 *   hourOf            (ms) => ora 0-23 (Europe/Rome)
 *   connected         almeno un dispositivo collegato ora dalla rete del capannone
 *   firstActivityAt   primo uso del portale da quella rete oggi (ms) o null
 *   lastActivityAt    ultimo uso del portale da quella rete (ms) o null
 *   disconnectedAt    quando si è scollegato l'ultimo dispositivo (ms) o null
 *   shift             turno da considerare: quello di oggi, o quello ancora
 *                     aperto di un giorno precedente, o null
 *                     { date, clockInAt, clockOutAt, status, inAuto, outAuto }
 *   toleranceMs
 *   warmupUntil       ms: dopo un riavvio del server i dispositivi si
 *                     ricollegano; prima di questo istante non si chiude nulla
 * @returns {null | {type: "clock_in", at} | {type: "clock_out", at} | {type: "reopen", at}}
 */
export function decidePresenceAction(input = {}) {
  const {
    now = Date.now(), todayKey = "", dayKeyOf = () => "", hourOf = () => 12,
    connected = false, firstActivityAt = null, lastActivityAt = null, disconnectedAt = null,
    shift = null, toleranceMs = PRESENCE_DEFAULT_TOLERANCE_MIN * 60000, warmupUntil = 0,
  } = input;
  const afterCutoff = hourOf(now) >= PRESENCE_CUTOFF_HOUR;
  const editable = !shift || shift.status === "open" || shift.status === "closed";
  if (!editable) return null;

  // Turno aperto.
  if (shift && shift.clockInAt && !shift.clockOutAt) {
    if (!shift.inAuto) return null; // aperto a mano: non si tocca
    const clockInAt = shift.clockInAt;
    // Rimasto aperto da un giorno precedente: si chiude all'ultimo segnale
    // di quel giorno (o, se manca, all'entrata).
    if (shift.date && shift.date < todayKey) {
      const candidates = [disconnectedAt, lastActivityAt]
        .filter((value) => value != null && value >= clockInAt && dayKeyOf(value) === shift.date);
      return { type: "clock_out", at: candidates.length ? Math.max(...candidates) : clockInAt };
    }
    if (now < warmupUntil) return null;
    if (!connected && disconnectedAt != null && now - disconnectedAt >= toleranceMs) {
      return { type: "clock_out", at: Math.max(clockInAt, disconnectedAt) };
    }
    // PC acceso la sera: si chiude all'ultimo utilizzo.
    if (connected && afterCutoff && lastActivityAt != null && now - lastActivityAt >= toleranceMs) {
      return { type: "clock_out", at: Math.max(clockInAt, lastActivityAt) };
    }
    return null;
  }

  // Turno di oggi chiuso in automatico e di nuovo in sede: si riapre.
  if (shift && shift.clockInAt && shift.clockOutAt) {
    if (!shift.outAuto || shift.date !== todayKey || afterCutoff) return null;
    if (connected && lastActivityAt != null && lastActivityAt > shift.clockOutAt) {
      return { type: "reopen", at: lastActivityAt };
    }
    return null;
  }

  // Nessun turno oggi: entrata al primo uso del portale dalla rete del capannone.
  if (!shift || !shift.clockInAt) {
    if (afterCutoff || firstActivityAt == null || dayKeyOf(firstActivityAt) !== todayKey) return null;
    if (hourOf(firstActivityAt) >= PRESENCE_CUTOFF_HOUR) return null;
    return { type: "clock_in", at: firstActivityAt };
  }
  return null;
}

// Minuti di pausa da aggiungere quando un turno chiuso si riapre.
export function reopenBreakMinutes(clockOutAt, reopenAt) {
  const gap = Number(reopenAt) - Number(clockOutAt);
  return Number.isFinite(gap) && gap > 0 ? Math.round(gap / 60000) : 0;
}

// Minuti lavorati: dall'entrata all'uscita meno le pause.
export function workedMinutesWithBreaks(clockInAt, clockOutAt, breakMinutes = 0) {
  const total = Math.round((Number(clockOutAt) - Number(clockInAt)) / 60000);
  if (!Number.isFinite(total)) return null;
  return Math.max(0, total - Math.max(0, Number(breakMinutes) || 0));
}
