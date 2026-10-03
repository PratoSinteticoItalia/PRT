import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../preventivo-v2.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('  function renderMaterialsBox('),html.indexOf('  function renderAccessories('));
function render(materials){
 const elements=new Map();
 const document={querySelector(s){if(!elements.has(s))elements.set(s,{style:{}});return elements.get(s)}};
 const fn=vm.runInNewContext(code+';renderMaterialsBox',{document,setField(){},fmtEur:n=>n.toFixed(2)+' €',escHtml:s=>String(s).replaceAll('<','&lt;').replaceAll('>','&gt;')});
 fn({materials,sqm:20,vat:22});
 return {box:elements.get('[data-field="materialsBox"]'),grid:elements.get('[data-field="materialsList"]')};
}
test('distinta unica: conserva materiali e calcola accessori con sconto, quantità e IVA',()=>{
 const {grid}=render({list:[{label:'Colla',qty:'6 kg',unitLabel:'5 €/kg',total:30}],accessories:[{name:'Banda',price:12,qty:2,discount:10,applyIva:false}]});
 assert.match(grid.innerHTML,/Colla/);assert.match(grid.innerHTML,/30.00 €/);
 assert.match(grid.innerHTML,/Banda/);assert.match(grid.innerHTML,/10.80 €/);assert.match(grid.innerHTML,/21.60 €/);
 assert.match(grid.innerHTML,/IVA non applicata/);assert.match(grid.innerHTML,/sconto 10% incluso/);
 assert.equal((grid.innerHTML.match(/class="mrow"/g)||[]).length,2);
});
test('soli accessori: distinta visibile e nomi trattati come testo',()=>{
 const {box,grid}=render({accessories:[{name:'<img>',price:5,qty:3}]});
 assert.equal(box.style.display,'');assert.match(grid.innerHTML,/&lt;img&gt;/);assert.match(grid.innerHTML,/15.00 €/);
});
test('distinta vuota nascosta',()=>assert.equal(render({}).box.style.display,'none'));
