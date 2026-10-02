import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const html = readFileSync(new URL('../preventivo-v2.html', import.meta.url), 'utf8');
const code = html.slice(html.indexOf('  function renderInstallationWork('), html.indexOf('  function renderBadges('));
function render(mode, cost) {
 const box={style:{}}, el={};
 const fn=vm.runInNewContext(code+';renderInstallationWork', {document:{querySelector:s=>s.includes('installWorkBox')?box:s.includes('installationCost')?el:null},setField(){},fmtEur:n=>Number(n).toFixed(2)+' €',escHtml:s=>s});
 fn({mode,sqm:15,vat:22,installationCost:cost,installationWork:{steps:[{title:'Posa',text:'Test'}]}});
 return {box,el};
}
test('PDF posa: imponibile e totale IVA sono distinti e già inclusi',()=>{
 const {el}=render('fornitura+posa',{unitPrice:25,net:375,total:457.5,applyIva:true});
 assert.match(el.textContent,/15 m² × 25.00 €\/m² = 375.00 €/);
 assert.match(el.textContent,/457.50 € IVA inclusa/);
 assert.match(el.textContent,/già incluso/);
});
test('PDF posa: nessun importo inventato nei payload precedenti o sola fornitura',()=>{
 assert.equal(render('fornitura+posa',null).el.hidden,true);
 assert.equal(render('solo-fornitura',{net:0}).box.style.display,'none');
 const {el}=render('fornitura+posa',{unitPrice:25,net:375,total:375,applyIva:false});
 assert.match(el.textContent,/IVA non applicata/);
 assert.doesNotMatch(el.textContent,/457/);
});
