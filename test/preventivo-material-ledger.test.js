import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../preventivo-v2.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('  function tidyUnits('),html.indexOf('  function tidyTechValue('))+html.slice(html.indexOf('  function renderMaterialsBox('),html.indexOf('  function renderAccessories('));
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
test('unità al singolare: 1 secchio, ma 2 secchi restano plurali',()=>{
 const {grid}=render({list:[{label:'Colla',qty:'1 secchi (6 kg)',unitLabel:'45,00 €/secchi',total:45},{label:'Colla',qty:'2 secchi (12 kg)',unitLabel:'45,00 €/secchio',total:90}]});
 assert.match(grid.innerHTML,/1 secchio \(6 kg\)/);assert.match(grid.innerHTML,/45,00 €\/secchio/);assert.match(grid.innerHTML,/2 secchi \(12 kg\)/);
});
const helpers=vm.runInNewContext(html.slice(html.indexOf('  const SMALL_WORDS'),html.indexOf('  // "1 secchi"'))+html.slice(html.indexOf('  function tidyTechValue('),html.indexOf('  const escHtml'))+';({tidyProperName,tidyTechValue})');
test('nome e città scritti in minuscolo vengono messi in maiuscolo, quelli già curati no',()=>{
 assert.equal(helpers.tidyProperName('jessica antonacci'),'Jessica Antonacci');
 assert.equal(helpers.tidyProperName('castellammare di stabia'),'Castellammare di Stabia');
 assert.equal(helpers.tidyProperName("sant'antonio abate"),"Sant'Antonio Abate");
 assert.equal(helpers.tidyProperName('De Luca'),'De Luca');
 assert.equal(helpers.tidyProperName('—'),'—');
});
test('drenaggio salvato con barre viene ripulito',()=>{
 assert.equal(helpers.tidyTechValue('40/L/min/m2'),'40 L/min/m²');
 assert.equal(helpers.tidyTechValue('60 L/min/m2'),'60 L/min/m²');
 assert.equal(helpers.tidyTechValue('—'),'—');
});
