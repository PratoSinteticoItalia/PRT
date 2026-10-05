import test from 'node:test';
import assert from 'node:assert/strict';
import {mutateRegister,receiptSummary,registerCSV} from '../lib/accounting-register.js';
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
