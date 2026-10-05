import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
function fn(name,next,context){
 return vm.runInNewContext(source.slice(source.indexOf('function '+name+'('),source.indexOf('function '+next+'(')).replace(/async\s*$/, '')+';'+name,context);
}
test('supplier comparison never mixes kg and packs and does not award a sole supplier',()=>{
 const entries=[
 {material:'Colla',supplierName:'A',unit:'kg',unitPrice:5,invoiceDate:'2026-01-01'},
 {material:'Colla',supplierName:'A',unit:'confezione',unitPrice:30,invoiceDate:'2026-02-01'},
 {material:'Colla',supplierName:'B',unit:'kg',unitPrice:5,invoiceDate:'2026-02-01'},
 {material:'Colla',supplierName:'C',unit:'kg',unitPrice:0,invoiceDate:'2026-02-01'},
 ];
 const compute=fn('computeSupplierPriceComparison','loadSupplierPriceEntries',{
 getFilteredSupplierPriceEntries:()=>entries,normalizeSupplierPriceKey:s=>s.toLowerCase()
 });
 const result=compute();
 assert.equal(result.length,2);
 const kg=result.find(r=>r.unit==='kg');
 assert.equal(kg.suppliers[0].avg,5);
 assert.equal(kg.suppliers.filter(s=>s.isBest).length,2);
 assert.equal(kg.suppliers.find(s=>s.label==='C').isBest,false);
 assert.equal(result.find(r=>r.unit==='confezione').suppliers[0].isBest,false);
});
test('completed shipments do not request preparation even with past or absent dates',()=>{
 const context={state:{lang:'it'},isOrderClosed:o=>o.closed,isLogisticsOrderCompleted:o=>o.delivered,getShippingTargetDate:o=>o.date,t:()=>'',formatDate:x=>x};
 const label=fn('getShippingTargetLabel','getShippingTargetUrgency',context);
 const urgency=fn('getShippingTargetUrgency','getShippingSummary',context);
 for(const order of [{closed:true,date:'2000-01-01'},{delivered:true},{delivered:true,date:'2000-01-01'}]){
 assert.equal(label(order),'Preparazione conclusa');assert.equal(urgency(order),'completed');
 }
 assert.equal(urgency({date:'2000-01-01'}),'overdue');
 assert.equal(urgency({}),'unset');
});
test('closed orders take precedence over missing address',()=>{
 const start=source.indexOf('function getNextOrderAction(');
 const end=source.indexOf('\nfunction ',start+1);
 const next=vm.runInNewContext(source.slice(start,end)+';getNextOrderAction',{
 state:{lang:'it'},isOrderClosed:o=>o.closed,t:s=>s
 });
 assert.match(next({closed:true}),/Ordine chiuso/);
 assert.equal(next({closed:false}),'needsAddress');
});
test('quick filters remain available without misleading page-only counts',()=>{
 const get=fn('getSalesRequestQuickFilterOptions','isSalesRequestsDbUnavailable',{
 state:{lang:'it',salesRequestsStats:{thisWeek:80}},getSalesRequestOperatorFromCurrentUser:()=> 'Gabriele'
 });
 const options=get([]);
 assert.equal(options.find(o=>o.value==='this-week').count,80);
 assert.equal(options.find(o=>o.value==='posa').count,null);
 assert.equal(options.find(o=>o.value==='mine').count,null);
});
test('CRM stats can bypass stale cache after an import',async()=>{
 const server=readFileSync(new URL('../server.js',import.meta.url),'utf8');
 const start=server.indexOf('async function getSalesRequestsStatsFromDb(');
 const end=server.indexOf('\n/**',start);
 let calls=0;
 const read=vm.runInNewContext(server.slice(start,end)+';getSalesRequestsStatsFromDb',{
 _salesRequestsStatsDbCache:{total:10},_salesRequestsStatsDbCacheAt:Date.now(),SALES_REQUESTS_DB_CACHE_TTL_MS:15000,
 getSalesRequestPipelineBucketSql:()=>"'new'"
 });
 const pool={query:async()=>{calls++;return {rows:[{total:20}]};}};
 assert.equal((await read(pool,'')).total,10);
 assert.equal(calls,0);
 assert.equal((await read(pool,'',{force:true})).total,20);
 assert.equal(calls,1);
 assert.equal((await read(pool,'')).total,20);
});
test('profit split distinguishes an absent revenue from an explicit zero',()=>{
 const ready=fn('isProfitSplitRevenueEntered','renderProfitSplitCalculator',{});
 for(const revenue of ['', ' ', undefined, 'abc', '-1', 'Infinity']) assert.equal(ready({revenue}),false);
 for(const revenue of [0,'0','125,50','125.50']) assert.equal(ready({revenue}),true);
});
test('commercial labels preserve unknown historical statuses',()=>{
 const label=fn('getSalesRequestStatusLabel','getSalesRequestStatusTone',{state:{lang:'it'}});
 assert.equal(label('new_contact'),'Nuovo contatto');
 assert.equal(label('quoted'),'Preventivo inviato');
 assert.equal(label('Chiamare domani'),'Chiamare domani');
});
test('supplier filters have persistent associated labels',()=>{
 const render=fn('renderSupplierPriceFiltersHtml','renderSupplierPriceCompareHtml',{
 state:{lang:'it',supplierPricesFilter:{}},escapeAttr:s=>s
 });
 const html=render();
 assert.equal((html.match(/<label /g)||[]).length,4);
 assert.match(html,/>Dal<input type="date"/);
 assert.match(html,/>Al<input type="date"/);
});
