import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('function applySupplierInvoiceDraft('),source.indexOf('async function stageSupplierPriceAttachment('));
function setup(values={},lines=[]) {
 const fields=Object.fromEntries(['supplierName','invoiceDate','invoiceNumber'].map(k=>[k,{value:values[k]||'',readOnly:false}]));
 const state={supplierPriceFormLines:lines};let updated=false;
 const apply=vm.runInNewContext(code+'\napplySupplierInvoiceDraft',{state,normalizeSupplierPriceKey:s=>s.toLowerCase(),syncSupplierPriceLinesFromDom:()=>{},updateSupplierPriceLinesDom:()=>{updated=true;}});
 return {fields,state,apply:d=>apply({elements:{namedItem:k=>fields[k]}},d),updated:()=>updated};
}
const draft={supplierName:'Demo SRL',invoiceDate:'2026-09-28',invoiceNumber:'20',lines:[{material:'Prato',unit:'mq',quantity:10,unitPrice:15}]};
test('PDF draft fills empty fields and rows',()=>{
 const ui=setup();ui.apply(draft);
 assert.equal(ui.fields.invoiceDate.value,draft.invoiceDate);assert.equal(ui.fields.supplierName.value,draft.supplierName);
 assert.equal(ui.state.supplierPriceFormLines[0].unitPrice,15);assert.ok(ui.updated());
});
test('PDF draft never overwrites existing header values or lines',()=>{
 const ui=setup({invoiceDate:'2026-09-01',invoiceNumber:'manual'},[{material:'Existing',unitPrice:9}]);
 const messages=ui.apply(draft);
 assert.equal(ui.fields.invoiceNumber.value,'manual');assert.equal(ui.fields.invoiceDate.value,'2026-09-01');
 assert.equal(ui.state.supplierPriceFormLines[0].material,'Existing');assert.equal(ui.updated(),false);assert.ok(messages.length);
});
test('different supplier aborts all autofill instead of attaching extracted rows to wrong supplier',()=>{
 const ui=setup({supplierName:'Another supplier'});const messages=ui.apply(draft);
 assert.equal(ui.fields.invoiceDate.value,'');assert.equal(ui.state.supplierPriceFormLines.length,0);assert.match(messages[0],/Nessun campo/);
});
