import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import net from "node:net";
import { ImapFlow } from "imapflow";

// 19 ott 2026: "Server failure — Exited with status 1" su Render. Causa: un
// timeout della connessione IMAP (casella contatti@) emette "error" su
// ImapFlow; senza ascoltatore Node chiude l'intero server.
test("ImapFlow: un timeout senza ascoltatore 'error' farebbe crollare il processo — il lettore ne registra uno", async () => {
  const source = readFileSync(new URL("../imap-worker.js", import.meta.url), "utf8");
  const ctor = source.indexOf("client = new ImapFlow(");
  const connect = source.indexOf("await client.connect()", ctor);
  assert.ok(ctor > 0 && connect > ctor);
  assert.match(source.slice(ctor, connect), /client\.on\("error"/, "l'ascoltatore va registrato prima di connect()");
});

test("con l'ascoltatore, un server di posta che si blocca non lancia eccezioni non gestite", async () => {
  const server = net.createServer((sock) => { sock.write("* OK finto server\r\n"); sock.on("data", () => {}); });
  await new Promise((r) => server.listen(0, r));
  const errors = [];
  const client = new ImapFlow({ host: "127.0.0.1", port: server.address().port, secure: false, auth: { user: "u", pass: "p" }, logger: false, socketTimeout: 300, greetingTimeout: 300 });
  client.on("error", (err) => errors.push(err.code || err.message));
  await client.connect().catch(() => {});
  await new Promise((r) => setTimeout(r, 600));
  server.close();
  assert.ok(errors.length >= 1, "l'errore di timeout arriva all'ascoltatore invece di far crollare il processo");
});
