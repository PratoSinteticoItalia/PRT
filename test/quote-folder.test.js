import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
const start=server.indexOf('function resolveCanSeeAllQuotes(');
const end=server.indexOf('function getCommunicationUserLabel(',start);
const resolveCanSeeAllQuotes=vm.runInNewContext(server.slice(start,end)+';resolveCanSeeAllQuotes',{});

const office=(id,canSeeAllQuotes=false)=>({id,role:'office',canSeeAllQuotes});

test('vede tutti i preventivi: alla prima attivazione chiunque dell\'ufficio può darlo',()=>{
 const users=[office('gabriele'),office('ivan')];
 assert.equal(resolveCanSeeAllQuotes({canSeeAllQuotes:true},users[0],'office',users[0],users),true);
});

test('vede tutti i preventivi: dopo, solo chi ce l\'ha lo può dare o togliere',()=>{
 const users=[office('gabriele',true),office('ivan')];
 assert.equal(resolveCanSeeAllQuotes({canSeeAllQuotes:true},users[1],'office',users[1],users),false,'Ivan non se lo può dare da solo');
 assert.equal(resolveCanSeeAllQuotes({canSeeAllQuotes:false},users[0],'office',users[1],users),true,'Ivan non lo può togliere al titolare');
 assert.equal(resolveCanSeeAllQuotes({canSeeAllQuotes:true},users[1],'office',users[0],users),true,'il titolare lo può dare');
});

test('vede tutti i preventivi: senza il campo resta com\'è, e vale solo per l\'ufficio',()=>{
 const users=[office('gabriele',true)];
 assert.equal(resolveCanSeeAllQuotes({},users[0],'office',users[0],users),true);
 assert.equal(resolveCanSeeAllQuotes({canSeeAllQuotes:true},users[0],'warehouse',users[0],users),false);
 assert.equal(resolveCanSeeAllQuotes({canSeeAllQuotes:true},null,'crew',users[0],users),false);
});

test('cartella: i preventivi privati si vedono solo dall\'autore o con il permesso',()=>{
 // La regola di visibilità del server, ricostruita sui suoi tre casi.
 assert.match(server,/const isVisible = \(row\) => Boolean\(row\.shared\) \|\| String\(row\.author_id\) === String\(currentUser\.id\) \|\| seeAll;/);
 // Ai colleghi la cartella restituisce solo numero, autore e data: niente totale né PDF.
 const ghost=server.slice(server.indexOf('if (!isVisible(latest)) {'),server.indexOf('return { ...toQuote(latest), visible: true'));
 assert.ok(ghost.includes('visible: false'));
 assert.ok(!/total|pdf|payload/.test(ghost));
});

test('preventivo salvato = da inviare; inviato solo con l\'invio vero', () => {
  const save=server.slice(server.indexOf('if (url.pathname === "/api/quotes" && req.method === "POST")'),server.indexOf('const sendMatch ='));
  assert.ok(save.includes("'to_send'"),'il preventivo nasce "da inviare"');
  assert.ok(save.includes('QUOTE_TO_SEND_REQUEST_STATUS'),'la richiesta passa a "preventivo da inviare"');
  assert.ok(!save.includes('quoted_at'),'salvare non fa partire il follow-up');
  const send=server.slice(server.indexOf('const sendMatch ='),server.indexOf('const quoteMatch ='));
  assert.ok(send.includes("status = 'sent', sent_at = NOW()"));
  assert.ok(send.includes('quoted_at = NOW()'),'il follow-up parte dall\'invio');
  assert.ok(send.includes('!["won", "lost"].includes(bucket)'),'una richiesta confermata o chiusa non torna indietro');
});

test('riaprire un preventivo aggiorna il modulo esistente, non lo sostituisce', () => {
  const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
  // I gestori del generatore restano collegati all'oggetto del modulo: una
  // copia nuova renderebbe le modifiche invisibili (bug del 23 ott).
  const assignments=app.match(/state\.preventivoForm = /g)||[];
  assert.equal(assignments.length,1,'solo ensurePreventivoForm crea il modulo');
});

test('invio preventivo: la condivisione col PDF solo su telefono e tablet, sul computer la chat', () => {
  const appSource = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const start = appSource.indexOf('function isPhoneOrTabletDevice(');
  const end = appSource.indexOf('\nasync function openQuoteSendDialog(', start);
  const detect = (userAgent, maxTouchPoints = 0) => vm.runInNewContext(
    `${appSource.slice(start, end)};isPhoneOrTabletDevice()`,
    { navigator: { userAgent, maxTouchPoints } },
  );
  assert.equal(detect('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', 5), true);
  assert.equal(detect('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 5), true);
  assert.equal(detect('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 5), true); // iPad
  assert.equal(detect('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', 0), false); // Mac
  assert.equal(detect('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0', 0), false);
});
