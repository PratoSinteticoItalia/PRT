import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const source=readFileSync(new URL('../garden-planner-page.js',import.meta.url),'utf8').split('const root = ReactDOM.createRoot')[0];
const api=vm.runInNewContext(transformSync(source,{loader:'jsx'}).code+'\n({plannerClientDimensions,ClientProjectSheet,plannerRollUsage})',{React:{createElement:(type,props,...children)=>({type,props,children})}});
const rectangle=(id,kind,x,y,w,h)=>({id,kind,points:[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]});
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
