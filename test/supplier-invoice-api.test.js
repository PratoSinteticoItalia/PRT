import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../server.js',import.meta.url),'utf8');
const start=source.indexOf('  if (url.pathname === "/api/supplier-prices/extract-pdf"');
const end=source.indexOf('  // Supplier invoice drafts',start);
function handler(user,busy=0,body={dataUrl:'data:application/pdf;base64,JVBERi0='}) {
 let calls=0;
 const context={Buffer,currentUser:user,activeInvoiceExtractions:busy,store:{},buildSupplierDirectory:()=>[],readBody:async()=>body,
  sendJson:(_r,status,data)=>({status,data}),extractSupplierInvoice:async()=>{calls++;return {lines:[]};}};
 const run=vm.runInNewContext(`(async function(req,res,url){${source.slice(start,end)}})`,context);
 return {run:()=>run({method:"POST"}, {},{pathname:'/api/supplier-prices/extract-pdf'}),context,calls:()=>calls};
}
test('invoice extraction: authentication and office role checked before reading file',async()=>{
 for(const [user,status] of [[null,401],[{role:'crew'},403],[{role:'sales'},403]]){
  const h=handler(user);assert.equal((await h.run()).status,status);assert.equal(h.calls(),0);
 }
});
test('invoice extraction: busy limit and malformed payload rejected, slot always released',async()=>{
 const busy=handler({role:'office'},2);assert.equal((await busy.run()).status,429);assert.equal(busy.calls(),0);
 const bad=handler({role:'office'},0,{dataUrl:'wrong'});assert.equal((await bad.run()).status,400);assert.equal(bad.context.activeInvoiceExtractions,0);
 const ok=handler({role:'office'});assert.equal((await ok.run()).status,200);assert.equal(ok.calls(),1);assert.equal(ok.context.activeInvoiceExtractions,0);
});
function batchHandler() {
 const a=source.indexOf('  if (url.pathname === "/api/supplier-prices/batch"'),b=source.indexOf('\n  if (url.pathname.match(',a);
 const context={currentUser:{role:'office',id:'office'},store:{supplierPriceEntries:[]},pendingSupplierInvoiceKeys:new Set(),
  supplierProfileKey:s=>s.toLowerCase().trim(),readBody:async req=>req.body,sendJson:(_r,status,data)=>({status,data}),
  randomUUID:()=>crypto.randomUUID(),storeAttachmentAsset:async()=>null,normalizeSupplierPriceEntry:e=>e,
  writeJson:async()=>{},STORE_PATH:'unused',serializeSupplierPriceEntryForClient:e=>e,
  hasSupplierInvoiceCosts:c=>Boolean(c&&(c.shippingCost||c.dutyValue||c.otherCost)),normalizeSupplierInvoiceCosts:c=>c,
  serializeSupplierPriceEntriesWithCosts:(_store,entries)=>entries};
 const run=vm.runInNewContext(`(async function(req,res,url){${source.slice(a,b)}})`,context);
 return {context,run:body=>run({method:'POST',body},{},{pathname:'/api/supplier-prices/batch'})};
}
const invoice={supplierName:'Demo',invoiceDate:'2026-09-28',invoiceNumber:'1',attachment:{dataUrl:'test'},lines:[{material:'Prato',unitPrice:10,unit:'mq',quantity:20}]};
test('invoice save rejects concurrent duplicate and persists a single invoice',async()=>{
 const h=batchHandler();const results=await Promise.all([h.run(invoice),h.run(invoice)]);
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 assert.equal(h.context.store.supplierPriceEntries.length,1);assert.equal(h.context.pendingSupplierInvoiceKeys.size,0);
 assert.equal((await h.run(invoice)).status,409);
});
test('invoice save rejects partial/invalid rows rather than silently dropping them',async()=>{
 const h=batchHandler();assert.equal((await h.run({...invoice,lines:[...invoice.lines,{material:'Other',unitPrice:0,unit:'kg'}]})).status,400);
 assert.equal((await h.run({...invoice,lines:[{material:'Other',unitPrice:10,unit:''}]})).status,400);
 assert.equal(h.context.store.supplierPriceEntries.length,0);
});

function costsHandler(entries) {
 const a=source.indexOf('  if (url.pathname === "/api/supplier-invoice-costs"'),b=source.indexOf('\n  if (url.pathname === "/api/supplier-prices" && req.method === "GET"',a);
 let n=0;
 const context={currentUser:{role:'office',email:'office@test'},store:{supplierPriceEntries:entries,supplierInvoiceCosts:{}},
  supplierProfileKey:s=>String(s).toLowerCase().trim(),readBody:async req=>req.body,sendJson:(_r,status,data)=>({status,data}),
  randomUUID:()=>`inv-${++n}`,normalizeSupplierPriceEntry:e=>e,writeJson:async()=>{},STORE_PATH:'unused',
  hasSupplierInvoiceCosts:c=>Boolean(c&&(c.shippingCost||c.dutyValue||c.otherCost)),normalizeSupplierInvoiceCosts:c=>({shippingCost:Number(c.shippingCost)||0,dutyValue:Number(c.dutyValue)||0,otherCost:Number(c.otherCost)||0})};
 const run=vm.runInNewContext(`(async function(req,res,url){${source.slice(a,b)}})`,context);
 return {context,run:body=>run({method:'PUT',body},{},{pathname:'/api/supplier-invoice-costs'})};
}
test('invoice costs: old entries without invoice get a shared one, other suppliers are refused',async()=>{
 const h=costsHandler([{id:'a',supplierName:'Demo'},{id:'b',supplierName:'demo '},{id:'c',supplierName:'Altro'}]);
 const saved=await h.run({entryIds:['a','b'],shippingCost:50});
 assert.equal(saved.status,200);
 assert.equal(saved.data.invoiceId,'inv-1');
 assert.deepEqual(h.context.store.supplierPriceEntries.filter(e=>e.invoiceId==='inv-1').map(e=>e.id),['a','b']);
 assert.equal(h.context.store.supplierInvoiceCosts['inv-1'].shippingCost,50);
 assert.equal((await h.run({entryIds:['a','c'],shippingCost:5})).status,400);
 assert.equal((await h.run({entryIds:['zz'],shippingCost:5})).status,404);
 // Costi azzerati: la voce sparisce, la fattura resta raggruppata.
 assert.equal((await h.run({entryIds:['a','b'],shippingCost:0})).data.costs,null);
 assert.equal(h.context.store.supplierInvoiceCosts['inv-1'],undefined);
});
