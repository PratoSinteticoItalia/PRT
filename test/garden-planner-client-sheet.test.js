import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const source=readFileSync(new URL('../garden-planner-page.js',import.meta.url),'utf8').split('const root = ReactDOM.createRoot')[0];
const api=vm.runInNewContext(transformSync(source,{loader:'jsx'}).code+'\n({plannerClientDimensions,ClientProjectSheet,ClientPlanDrawing,plannerRollUsage})',{React:{createElement:(type,props,...children)=>({type,props,children})},fmt:(n,d=1)=>Number(n).toFixed(d)});
const rectangle=(id,kind,x,y,w,h)=>({id,kind,points:[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]});
// Raccoglie ricorsivamente le coordinate assolute di un dato type
// nell'albero {type,props,children} prodotto dal mock React.createElement
// sopra, tenendo conto di eventuali transform="translate(dx,dy)" sui <g>
// antenati (es. la scala grafica usa coordinate LOCALI che diventano valide
// solo dopo la traslazione) — senza questo, elementi legittimi come la
// scala grafica darebbero falsi positivi.
function collectAbsolutePoints(node, type, coordKeys, dx = 0, dy = 0, out = []) {
  if (!node || typeof node !== 'object') return out;
  // {list.map(...)} dentro il JSX arriva qui come un array annidato tra i
  // children (il mock createElement non lo appiattisce come farebbe React):
  // senza questo ramo la ricorsione non entra nei suoi elementi e mancano
  // TUTTE le righe generate da un .map (praticamente ogni riga di quota).
  if (Array.isArray(node)) {
    node.forEach((child) => collectAbsolutePoints(child, type, coordKeys, dx, dy, out));
    return out;
  }
  const m = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(node.props?.transform || '');
  const ndx = dx + (m ? Number(m[1]) : 0);
  const ndy = dy + (m ? Number(m[2]) : 0);
  if (node.type === type) {
    const abs = {};
    coordKeys.forEach(([xk, yk]) => {
      if (node.props[xk] != null) abs[xk] = Number(node.props[xk]) + ndx;
      if (node.props[yk] != null) abs[yk] = Number(node.props[yk]) + ndy;
    });
    out.push(abs);
  }
  (node.children || []).forEach((child) => collectAbsolutePoints(child, type, coordKeys, ndx, ndy, out));
  return out;
}
test('client dimensions include every lawn and exclusion edge with outward normals',()=>{
 const areas=[rectangle('lawn','turf',0,0,14,12),rectangle('pool','exclusion',3,3,4,2)];
 const edges=api.plannerClientDimensions(areas);
 assert.equal(edges.length,8);
 assert.deepEqual(Array.from(edges,e=>e.length),[14,12,14,12,4,2,4,2]);
 assert.equal(edges[0].normal.y,-1);
 assert.equal(new Set(edges.map(e=>e.id)).size,8);
});
test('client takeoff subtracts excluded surface and renders quantities without prices',()=>{
 const polygons=[rectangle('lawn','turf',0,0,14,12),rectangle('pool','exclusion',3,3,4,2)];
 const usage=api.plannerRollUsage(polygons,[]);
 assert.equal(usage.netArea,160);
 const sheet=api.ClientProjectSheet({polygons,rolls:[],borders:[],usage,borderMeters:0});
 const text=JSON.stringify(sheet);
 assert.match(text,/160.0 m²/);
 assert.match(text,/Layout di posa parziale/);
 assert.doesNotMatch(text,/€|prezzo|costo/i);
});

// Segnalato dall'utente il 29 set su una pianta reale (poligono con un
// vertice concavo): le linee di quota di alcuni lati uscivano dal riquadro
// stampato ("il disegno viene salvato ma non è inquadrato"). Il riquadro
// dell'etichetta era verificato contro i bordi del foglio, ma non i due
// estremi della linea di quota stessa (vedi ClientPlanDrawing in
// garden-planner-page.js) — su un lato vicino a un vertice concavo i due
// estremi finiscono più lontani dal bordo dell'etichetta e sforano.
test('ClientPlanDrawing: le linee di quota di un poligono concavo restano sempre dentro il riquadro 1000×660',()=>{
 // Pentagono a freccia con un vertice concavo (rientrante) al centro —
 // stessa forma generale riprodotta dal vivo per il collaudo del fix.
 const dart={id:'lawn',kind:'turf',points:[
   {x:0,y:11},{x:0.6,y:2},{x:10.8,y:1.6},{x:6,y:5.6},{x:11,y:8.4},
 ]};
 const rendered=api.ClientPlanDrawing({polygons:[dart],rolls:[],borders:[]});
 const svgProps=rendered.props;
 const [,,W,H]=String(svgProps.viewBox).split(' ').map(Number);
 assert.ok(W>0 && H>0,'viewBox non valido');
 const lines=collectAbsolutePoints(rendered,'line',[['x1','y1'],['x2','y2']]);
 assert.ok(lines.length>0,'nessuna linea trovata: il fixture non sta esercitando il caso');
 for (const line of lines) {
  for (const [x,y] of [[line.x1,line.y1],[line.x2,line.y2]]) {
   if (x==null || y==null) continue;
   assert.ok(x>=0 && x<=W, `estremo linea fuori dal riquadro in X: ${x} (limite 0..${W})`);
   assert.ok(y>=0 && y<=H, `estremo linea fuori dal riquadro in Y: ${y} (limite 0..${H})`);
  }
 }
 // Anche le etichette di testo devono restare dentro il riquadro.
 for (const t of collectAbsolutePoints(rendered,'text',[['x','y']])) {
  if (t.x==null || t.y==null) continue;
  assert.ok(t.x>=0 && t.x<=W, `etichetta fuori dal riquadro in X: ${t.x}`);
  assert.ok(t.y>=0 && t.y<=H, `etichetta fuori dal riquadro in Y: ${t.y}`);
 }
});

// Segnalato di nuovo dall'utente su un secondo preventivo reale, con una
// pianta a 8 lati: solo 3 quote su 8 erano visibili, il resto omesso.
// Causa: il primo fix sopra (confini rigidi) scartava del tutto una quota
// quando nessun offset era privo di sovrapposizioni con altre etichette —
// su una forma con lati ravvicinati questo lasciava la maggior parte dei
// lati senza alcuna misura, un disegno "incompleto" più che "non
// inquadrato". Ora si piazza sempre la quota nella posizione meno
// sovrapposta tra quelle sicure per il foglio, invece di ometterla quando
// sovrappone qualcosa. Fixture: un pettine a 6 denti stretti e ravvicinati
// (20 lati) — verificato che discrimina davvero le due versioni (16/20
// quotati con l'algoritmo precedente, 20/20 con questo).
test('ClientPlanDrawing: un poligono con molti lati ravvicinati (pettine, 20 lati) riceve una quota su OGNI lato',()=>{
 const teeth=6, toothW=1, gap=0.3, toothH=6, baseH=1;
 const points=[{x:0,y:0}];
 let x=0;
 for (let i=0;i<teeth;i++){
  points.push({x,y:baseH+toothH});
  points.push({x:x+toothW,y:baseH+toothH});
  points.push({x:x+toothW,y:baseH});
  x+=toothW+gap;
 }
 points.push({x:x-gap,y:0});
 const comb={id:'lawn',kind:'turf',points};
 const edges=api.plannerClientDimensions([comb]);
 assert.equal(edges.length,20,'il fixture non ha 20 lati: aggiornare il test');
 const rendered=api.ClientPlanDrawing({polygons:[comb],rolls:[],borders:[]});
 // Ogni lato quotato produce un <text> il cui primo figlio è la lunghezza
 // formattata da fmt() (es. "10.00"), seguito da un secondo figlio " m" —
 // leggo l'output REALE del componente, non una reimplementazione
 // dell'algoritmo di piazzamento (che divergerebbe silenziosamente da
 // futuri cambi del componente).
 function collectFirstChildren(node,out=[]){
  if(!node||typeof node!=='object')return out;
  if(Array.isArray(node)){node.forEach((n)=>collectFirstChildren(n,out));return out;}
  if(node.type==='text' && node.props?.x!=null && /^\d+\.\d{2}$/.test(String(node.children?.[0])))out.push(node.children[0]);
  (node.children||[]).forEach((c)=>collectFirstChildren(c,out));
  return out;
 }
 const dimensionLabels=collectFirstChildren(rendered);
 assert.equal(dimensionLabels.length,20,`solo ${dimensionLabels.length}/20 lati hanno ricevuto una quota nel render reale (atteso: tutti e 20) — trovate: ${JSON.stringify(dimensionLabels)}`);
});
