import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../preventivo-v2.html',import.meta.url),'utf8');
const code=html.slice(html.indexOf('  function technicalValue('),html.indexOf('  function renderTechCards('));
const box={style:{}};
const f=vm.runInNewContext(code+';({technicalValue,productDifference,normalizeQuoteShipping,renderPriceComposition})',{document:{querySelector:()=>box},fmtEur:n=>n.toFixed(2)+' €',escHtml:s=>String(s).replaceAll('<','&lt;')});
test('spedizione: importo esplicito prevale sulla soglia generica senza frammenti numerici',()=>{
 const input={shipping:{cost:0},materials:{desc:'Rotoli da 2 metri. La spedizione è gratuita sopra 1.000 euro.'},conditions:[{label:'Spedizione',text:'Gratuita oltre 1.000 euro.'}]};
 const result=f.normalizeQuoteShipping(input);
 assert.equal(result.materials.desc,'Rotoli da 2 metri.');assert.equal(result.conditions[0].text,'Spedizione gratuita per questa offerta.');
 assert.match(input.conditions[0].text,/1.000/);
 assert.match(f.normalizeQuoteShipping({...input,shipping:{cost:50,applyIva:false}}).conditions[0].text,/50.00 € \(IVA non applicata\)/);
});
test('unità tecniche: formatta numeri, preserva unità esistenti e valori mancanti',()=>{
 assert.equal(f.technicalValue('3240','g/m²'),'3.240 g/m²');assert.equal(f.technicalValue('29.400','punti/m²'),'29.400 punti/m²');assert.equal(f.technicalValue('3,24 kg/m²','g/m²'),'3,24 kg/m²');assert.equal(f.technicalValue('—','g/m²'),'—');
 assert.equal(f.productDifference({name:'Cedro 30 mm',tech:{struttura:'Unidirezionale'}}),'Filo intermedio da 30 mm · unidirezionale');
});
test('composizione: visualizza importi esatti, non inventa dettaglio per vecchi payload',()=>{
 f.renderPriceComposition({options:[{name:'Cedro',breakdown:{prato:100,materiali:20,posa:0,trasporto:0,accessori:10,lavorazioni:0},grandNet:130,vatAmount:28.6,total:158.6}]});
 assert.match(box.innerHTML,/158.60 €/);assert.match(box.innerHTML,/100.00 €/);assert.doesNotMatch(box.innerHTML,/>Posa</);
 f.renderPriceComposition({options:[{name:'Vecchio',total:100}]});assert.equal(box.style.display,'none');
});
