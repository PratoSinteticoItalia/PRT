/**
 * lib/safe-write.js — Guardia per le scritture dati "best-effort" del server.
 *
 * Problema (Fase 1 hardening): molte scritture critiche erano `fn().catch(() => {})`
 * → se fallivano (DB giù, vincolo, timeout) il dato si perdeva IN SILENZIO
 * (ordini da webhook Shopify, store su disco, inventario, richieste CRM).
 *
 * `createWriteGuard().safeWrite(label, fn, meta)`:
 *   - esegue fn(), con retry (default 1) su fallimento transitorio;
 *   - se fallisce comunque NON rilancia (la scrittura resta best-effort) ma
 *     la rende VISIBILE: incrementa un contatore per `label` e chiama onError
 *     (loud log). I contatori sono esponibili via /api/healthz.
 *
 * Puro e testabile: timer (`sleep`) e `onError` sono iniettabili → niente
 * dipendenze da DB o tempo reale nei test. Vedi test/safe-write.test.js.
 *
 * NB: la coda PERSISTENTE (retry oltre il riavvio) è materia di Fase 2; qui
 * l'obiettivo è solo la VISIBILITÀ + retry transitorio in-memory.
 */

export function createWriteGuard({
  retries = 1,
  delayMs = 250,
  onError = () => {},
  sleep,
} = {}) {
  const failures = new Map(); // label → conteggio fallimenti definitivi
  const _sleep = sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));

  // Registra un fallimento già intercettato altrove (es. dentro il catch di una
  // funzione di scrittura che gestisce l'errore in proprio): conta + logga.
  function recordFailure(label, error, meta = {}) {
    failures.set(label, (failures.get(label) || 0) + 1);
    try {
      onError(label, error, meta);
    } catch {
      // il reporter non deve mai rompere il flusso chiamante
    }
  }

  async function safeWrite(label, fn, meta = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastErr = err;
        if (attempt < retries) await _sleep(delayMs);
      }
    }
    recordFailure(label, lastErr, meta);
    return undefined;
  }

  function getFailureCounts() {
    return Object.fromEntries(failures);
  }

  function totalFailures() {
    let sum = 0;
    for (const n of failures.values()) sum += n;
    return sum;
  }

  function resetFailureCounts() {
    failures.clear();
  }

  return { safeWrite, recordFailure, getFailureCounts, totalFailures, resetFailureCounts };
}
