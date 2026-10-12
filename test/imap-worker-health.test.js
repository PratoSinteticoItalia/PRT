import { test } from "node:test";
import assert from "node:assert/strict";

// Il lettore della casella contatti@ abilitato ma mai avviato restava "warmup"
// (avvio in corso) per giorni: ora diventa "stopped" dopo 3 minuti, così
// l'avviso in Richieste può comparire.
test("lettore email abilitato ma mai avviato: warmup subito, stopped dopo 3 minuti", async () => {
  process.env.IMAP_SHADOW_ENABLED = "true";
  process.env.IMAP_HOST = "mail.example.test";
  process.env.IMAP_USER = "contatti@example.test";
  process.env.IMAP_PASSWORD = "x";
  const { getImapWorkerStatus } = await import(`../imap-worker.js?health-test=${Date.now()}`);
  const status = getImapWorkerStatus();
  assert.equal(status.running, false);
  assert.equal(status.health, "warmup");
  assert.ok(status.processStartedAt);

  const realNow = Date.now;
  try {
    const start = realNow();
    Date.now = () => start + 4 * 60_000;
    assert.equal(getImapWorkerStatus().health, "stopped");
  } finally {
    Date.now = realNow;
  }
});
