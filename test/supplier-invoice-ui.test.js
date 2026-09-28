import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
// isSameSupplierName (fuzzy) e le sue dipendenze pure vivono più su nel file,
// vicino a normalizeSupplierPriceKey (uguaglianza esatta, usata altrove per
// raggruppare gli storici prezzi) — slice separato, iniettato nello stesso
// contesto VM di applySupplierInvoiceDraft, così il test esercita la VERA
// logica di confronto invece di uno stub che potrebbe divergere da essa.
const matchCode=source.slice(source.indexOf('const SUPPLIER_NAME_LEGAL_SUFFIX_RE'),source.indexOf('function getSupplierPriceEntries('));
const {isSameSupplierName}=vm.runInNewContext(matchCode+'\n({isSameSupplierName})');
const code=source.slice(source.indexOf('function applySupplierInvoiceDraft('),source.indexOf('async function stageSupplierPriceAttachment('));
function setup(values={},lines=[]) {
 const fields=Object.fromEntries(['supplierName','invoiceDate','invoiceNumber'].map(k=>[k,{value:values[k]||'',readOnly:false}]));
 const state={supplierPriceFormLines:lines};let updated=false;
 const apply=vm.runInNewContext(code+'\napplySupplierInvoiceDraft',{state,isSameSupplierName,syncSupplierPriceLinesFromDom:()=>{},updateSupplierPriceLinesDom:()=>{updated=true;}});
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
test('isSameSupplierName: tollera ragione sociale estesa/abbreviata, forma societaria, casistica reale',()=>{
 // Caso reale segnalato dall'utente il 28 set: anagrafica breve contro
 // ragione sociale cinese estesa sulla fattura — stesso fornitore.
 assert.equal(isSameSupplierName('WMg grass','Jiangsu WMgrass Co., Ltd'),true);
 assert.equal(isSameSupplierName('Acme S.p.A.','ACME SPA'),true);
 assert.equal(isSameSupplierName('Rossi Srl','Rossi S.r.l.'),true);
 assert.equal(isSameSupplierName('  Bianchi Forniture  ','bianchi forniture'),true);
});
test('isSameSupplierName: resta severo su fornitori genuinamente diversi',()=>{
 assert.equal(isSameSupplierName('Rossi Srl','Verdi Snc'),false);
 assert.equal(isSameSupplierName('Acme','Beta'),false);
 assert.equal(isSameSupplierName('','Acme'),false);
 assert.equal(isSameSupplierName('Acme',''),false);
});
