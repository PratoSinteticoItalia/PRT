import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../preventivo-v2.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('  function renderUnifiedLedger('),html.indexOf('  function renderAccessories('));
test('distinta unica: prezzi scontati, posa ed extra una sola volta, nessun totale duplicato',()=>{
 const box={style:{}};const nodes=new Map();
 const document={querySelector:s=>s.includes('materialsBox')?box:(nodes.has(s)?nodes.get(s):(nodes.set(s,{style:{}}),nodes.get(s))),querySelectorAll:()=>[]};
 const fn=vm.runInNewContext(code+';renderUnifiedLedger',{document,tidyUnits:s=>s,escHtml:s=>String(s).replaceAll('<','&lt;'),fmtEur:n=>n.toFixed(2),setField(){}});
 fn({sqm:25,mode:'fornitura+posa',options:[{name:'A',breakdown:{prato:100,posa:625}},{name:'B',breakdown:{prato:200,posa:625}}],shipping:{cost:0},materials:{discount:15,list:[{label:'Telo',qty:'25 m²',total:25},{label:'Trasporto',total:0}],accessories:[{name:'Bordura',qty:1,price:3,discount:10}],extraServices:[{description:'Extra',cost:10}]}});
 assert.match(box.innerHTML,/<del>25.00<\/del>/);
 assert.match(box.innerHTML,/−15%/);
 assert.match(box.innerHTML,/−10%/);
 assert.equal((box.innerHTML.match(/21.25/g)||[]).length,1);
 assert.equal((box.innerHTML.match(/625.00/g)||[]).length,1);
 assert.match(box.innerHTML,/colspan="2"/);
 assert.match(box.innerHTML,/21.25/);assert.match(box.innerHTML,/2.70/);assert.match(box.innerHTML,/625.00/);
 assert.equal((box.innerHTML.match(/>Posa in opera /g)||[]).length,1);assert.equal((box.innerHTML.match(/>Trasporto /g)||[]).length,1);
 assert.doesNotMatch(box.innerHTML,/Totale offerta|Imponibile/);assert.equal(nodes.get('[data-field="priceComposition"]').style.display,'none');
 for(const count of [1,3]){
  fn({sqm:25,options:Array.from({length:count},(_,i)=>({name:'Prato '+i,breakdown:{prato:100+i}})),materials:{list:[{label:'Colla',qty:'6 kg',total:45}]},shipping:{cost:0}});
  assert.match(box.innerHTML,new RegExp('colspan="'+count+'"'));
  assert.equal((box.innerHTML.match(/45.00/g)||[]).length,1);
  assert.doesNotMatch(box.innerHTML,/<del>|discount-pill/);
 }
});
