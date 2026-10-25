import test from 'node:test';
import assert from 'node:assert/strict';
import {mutateRegister,receiptSummary,receiptDailySummary,receiptMethodKey,registerCSV} from '../lib/accounting-register.js';
const raw={date:'2026-10-05',fiscalDate:'2026-10-05',amount:122,type:'income',label:'Vendita',document:'receipt',vatRate:22,reference:'R1',verified:true};
const add=(s={},entry=raw)=>mutateRegister(s,{action:'entry',revision:s.revision||0,entry},'office','2026-10-05','e1');
test('registro: IVA, rimborsi e fatture separati',()=>{
 const s=add();const e=s.entries[0];const summary=receiptSummary([e,{...e,type:'refund',cents:6100},{...e,document:'invoice'}]);
 assert.deepEqual(summary,[{date:'2026-10-05',rate:22,gross:6100,net:5000,tax:1100,count:2}]);
});
test('registro: chiusura blocca modifiche, riapertura richiede motivo e conserva audit',()=>{
 let s=add();s=mutateRegister(s,{action:'close',month:'2026-10',revision:1},'a','now','x');
 assert.throws(()=>add(s,{...raw,id:'e1',amount:200}),/Mese chiuso/);
 assert.throws(()=>mutateRegister(s,{action:'reopen',month:'2026-10',revision:2},'a','now','x'),/motivo/);
 s=mutateRegister(s,{action:'reopen',month:'2026-10',revision:2,reason:'Rettifica'},'a','now','x');
 const updated=add(s,{...raw,id:'e1',amount:200});
 assert.equal(updated.audit[2].snapshot.entries[0].cents,12200);
 assert.equal(updated.entries[0].cents,20000);
});
test('registro: conflitti, date impossibili e movimenti incompleti non chiudibili',()=>{
 assert.throws(()=>add({}, {...raw,date:'2026-02-30'}),/Data/);
 const s=add({}, {...raw,verified:false});
 assert.throws(()=>mutateRegister(s,{action:'close',month:'2026-10',revision:1},'a','now','x'),/Verifica/);
 assert.throws(()=>mutateRegister(s,{action:'close',month:'2026-10',revision:0},'a','now','x'),/altro operatore/);
 assert.throws(()=>add({}, {...raw,vatRate:null}),/aliquota/);
});
test('accredito: quadratura e riferimento univoco, nessuna entrata duplicata',()=>{
 const cmd={action:'payout',revision:0,payout:{date:'2026-10-05',reference:'P1',orderIds:['a','b'],gross:1600,refund:0,fees:40,bank:1560}};
 const s=mutateRegister({},cmd,'a','now','p1');assert.equal(s.entries.length,0);assert.equal(s.payouts[0].bank,156000);
 assert.throws(()=>mutateRegister(s,{...cmd,revision:1},'a','now','p2'),/già registrato/);
 assert.throws(()=>mutateRegister({}, {...cmd,payout:{...cmd.payout,bank:1590}},'a','now','p3'),/non coincide/);
});
test('CSV neutralizza formule e protegge virgolette',()=>{assert.match(registerCSV([['=1+1','a"b']]),/"'=1\+1";"a""b"/);});

test('corrispettivi per giornata: totale del giorno e importo per metodo di pagamento', () => {
  const base = { verified: true, document: 'receipt', type: 'income', vatRate: 22, fiscalDate: '2026-10-20' };
  const days = receiptDailySummary([
    { ...base, cents: 12000, method: 'paypal' },
    { ...base, cents: 1220, method: 'PayPal Express Checkout' },
    { ...base, cents: 120000, method: 'HeyLight' },
    { ...base, cents: 54000, method: 'Bonifico bancario' },
    { ...base, cents: 9900, method: 'shopify_payments', fiscalDate: '2026-10-21' },
    { ...base, cents: 5000, method: 'paypal', document: 'invoice' },
    { ...base, cents: 5000, method: 'paypal', verified: false },
  ]);
  assert.equal(days.length, 2);
  const [day] = days;
  assert.equal(day.gross, 187220);
  assert.equal(day.count, 4);
  assert.deepEqual(day.methods, { card: 0, paypal: 13220, transfer: 54000, heylight: 120000, scalapay: 0, cash: 0, other: 0 });
  assert.equal(days[1].methods.card, 9900);
});

test('corrispettivi per giornata: un rimborso toglie dal suo metodo', () => {
  const base = { verified: true, document: 'receipt', vatRate: 22, fiscalDate: '2026-10-20', method: 'PayPal' };
  const [day] = receiptDailySummary([{ ...base, type: 'income', cents: 10000 }, { ...base, type: 'refund', cents: 2500 }]);
  assert.equal(day.gross, 7500);
  assert.equal(day.methods.paypal, 7500);
});

test('metodi di pagamento: circuiti Shopify e testo libero nella categoria giusta', () => {
  assert.equal(receiptMethodKey('shopify_payments'), 'card');
  assert.equal(receiptMethodKey('Carta'), 'card');
  assert.equal(receiptMethodKey('Bank Deposit'), 'transfer');
  assert.equal(receiptMethodKey('Bonifico'), 'transfer');
  assert.equal(receiptMethodKey('Hey Light'), 'heylight');
  assert.equal(receiptMethodKey('Cash on Delivery (COD)'), 'cash');
  assert.equal(receiptMethodKey('Shopify'), 'other');
  assert.equal(receiptMethodKey(''), 'other');
});

test('registro: un movimento registrato per sbaglio si elimina, con il motivo, solo a mese aperto', () => {
  let s = add();
  assert.throws(() => mutateRegister(s, { action: 'delete-entry', id: 'e1', revision: s.revision }, 'a', 'now', 'x'), /perché/);
  const removed = mutateRegister(s, { action: 'delete-entry', id: 'e1', reason: 'ordine sbagliato', revision: s.revision }, 'a', 'now', 'x');
  assert.equal(removed.entries.length, 0);
  assert.equal(removed.audit.at(-1).before.id, 'e1');
  assert.equal(removed.audit.at(-1).reason, 'ordine sbagliato');
  s = mutateRegister(s, { action: 'close', month: '2026-10', revision: s.revision }, 'a', 'now', 'x');
  assert.throws(() => mutateRegister(s, { action: 'delete-entry', id: 'e1', reason: 'x', revision: s.revision }, 'a', 'now', 'x'), /Mese chiuso/);
});
