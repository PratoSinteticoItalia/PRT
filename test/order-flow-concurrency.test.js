import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('rapid partial Inbox changes preserve every queued field',async()=>{
 const state={orders:[{id:'a',operations:{warehouse:{},installation:{}}}],currentView:'orders'};
 const requests=[];
 const context={state,orderPendingPatchIds:new Set(),getOrderInventoryAllocations:()=>[],
  apiFetch:(_url,options)=>new Promise(resolve=>requests.push({body:JSON.parse(options.body),resolve})),
  renderCurrentViewOnly:()=>{},flashButtonFeedback:()=>{},showToast:()=>{},setStatus:()=>{},ui:{},
  setTimeout,clearTimeout};
 const start=source.indexOf('const _inboxFlowSaveTimers');
 const end=source.indexOf('async function saveShipping(',start);
 const save=vm.runInNewContext(source.slice(start,end)+';saveInboxOrderFlow',context);
 const running=save('a',{warehouse:{status:'pronto'}});
 await save('a',{warehouse:{preparationDate:'2026-10-06'}});
 await save('a',{installation:{selected:true}});
 assert.equal(requests.length,1);
 requests[0].resolve({id:'a',operations:{warehouse:{status:'pronto'}}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests.length,2);
 assert.equal(requests[1].body.warehouse.preparationDate,'2026-10-06');
 assert.equal(requests[1].body.installation.selected,true);
 requests[1].resolve({id:'a',operations:requests[1].body});
 await running;
 assert.equal(context.orderPendingPatchIds.size,0);
});
test('Inbox debounce is independent per order and captures the form before selection changes',()=>{
 const tasks=new Map();let timer=0;const saves=[];
 const context={setTimeout:fn=>{tasks.set(++timer,fn);return timer;},clearTimeout:id=>tasks.delete(id),
 buildInboxOrderFlowPayload:id=>({warehouse:{note:id}})};
 const start=source.indexOf('const _inboxFlowSaveTimers');
 const end=source.indexOf('async function saveInboxOrderFlow(',start);
 context.saveInboxOrderFlow=(id,payload)=>saves.push([id,payload]);
 const debounce=vm.runInNewContext(source.slice(start,end)+';debouncedSaveInboxOrderFlow',context);
 debounce('a');debounce('b');
 for(const callback of tasks.values()) callback();
 assert.deepEqual(saves.map(([id])=>id),['a','b']);
 assert.equal(saves[0][1].warehouse.note,'a');
});
