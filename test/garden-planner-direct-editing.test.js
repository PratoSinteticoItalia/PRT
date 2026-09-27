import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../garden-planner-page.js',import.meta.url),'utf8');
const slice=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const {plannerRectangle:rect,plannerCircle:circle,plannerMoveObject:move,plannerBorderLength:border}=vm.runInNewContext(slice('function plannerRectangle(','function FreeDrawCanvas(')+'\n({plannerRectangle,plannerCircle,plannerMoveObject,plannerBorderLength})');
const net=vm.runInNewContext(slice('function plannerNetArea(','function createPlannerArea(')+'\nplannerNetArea');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
test('direct rectangle: drawing in all four directions has the same area; zero edges rejected',()=>{
 for(const end of [{x:8,y:6},{x:-8,y:6},{x:8,y:-6},{x:-8,y:-6}])near(net([rect({x:0,y:0},end)]),48);
 assert.equal(rect({x:0,y:0},{x:0,y:6}).length,0);
});
test('direct circle: 32-sided regular-polygon area, zero radius rejected, direction-independent',()=>{
 const sides=32,r=4;
 const c=circle({x:0,y:0},{x:r,y:0});
 assert.equal(c.length,sides);
 near(net([c]),(sides/2)*r*r*Math.sin(2*Math.PI/sides)); // exact area of the approximating n-gon, close to but not π·r²
 assert.equal(circle({x:2,y:2},{x:2,y:2}).length,0);
 // Radius only depends on the distance dragged, not the direction.
 near(net([circle({x:5,y:5},{x:5,y:8})]),net([circle({x:5,y:5},{x:8,y:5})]));
});
test('moving obstacle changes net turf, preserving geometry and source snapshot',()=>{
 const lawn={id:'lawn',points:rect({x:0,y:0},{x:10,y:10}),rolls:[]};
 const house={id:'house',kind:'exclusion',points:rect({x:2,y:2},{x:4,y:5}),rolls:[]};
 const snapshot=JSON.stringify(house);
 const moved=move([lawn,house],{type:'area',areaId:'house',original:house},10,0);
 near(net([lawn.points],[house.points]),94);near(net([lawn.points],[moved[1].points]),100);
 assert.equal(JSON.stringify(house),snapshot);assert.equal(moved[0],lawn);
});
test('dragging rotated recovered roll preserves dimensions, grain and provenance',()=>{
 const r={id:'cut',sourceRollId:'source',cx:3,cy:4,length:2.75,width:.5,angle:Math.PI/3};
 const a={id:'lawn',points:[],rolls:[r,{...r,id:'other'}]};
 const t={type:'roll',areaId:'lawn',index:0,original:r};
 const first=move([a],t,1.25,-2)[0];const second=move([first],t,2.5,-1)[0];
 near(second.rolls[0].cx,5.5);near(second.rolls[0].cy,3);
 for(const k of ['length','width','angle','sourceRollId'])assert.equal(second.rolls[0][k],r[k]);
 assert.equal(second.rolls[1],a.rolls[1]);near(a.rolls[0].cx,3);
});
test('moving a lawn preserves its layout by translating owned rolls with it',()=>{
 const a={id:'lawn',points:rect({x:0,y:0},{x:8,y:6}),rolls:[{cx:4,cy:1,width:2,length:8,angle:0}]};
 const moved=move([a],{type:'area',areaId:'lawn',original:a},-3,2)[0];
 near(net([moved.points]),48);near(moved.rolls[0].cx,1);near(moved.rolls[0].cy,3);
});
test('border takeoff counts partial, reverse, overlapping and diagonal segments only once',()=>{
 const seg=(x,y,u,v)=>({a:{x,y},b:{x:u,y:v}});
 near(border([]),0);near(border([seg(0,0,3,0)]),3);
 near(border([seg(0,0,3,0),seg(5,0,2,0),seg(3,0,0,0)]),5);
 near(border([seg(0,0,3,4),seg(1.5,2,4.5,6)]),7.5);
 near(border([seg(0,0,3,0),seg(0,1,3,1),seg(1,0,1,0)]),6);
});
const context={BORDER_TYPES:[{id:'pvc',name:'PVC',price:999}],INFILL_FO30:{kgPerSqm:5,bagKg:25,name:'Intaso'},DECO_CATALOG:[],GLUE_BUCKET_KG:5,TAPE_ROLL_M:10,INSTALLATION_RULES:{glueKgPerSqm:.3},fmt:(v,d=1)=>Number(v).toFixed(d),fmtE:v=>`${v} €`,getTravelSummary:()=>({totalKm:20,routeKmTotal:20,totalCost:37,tollCost:7,baseFuelCost:30,baseLiters:10,baseTripCost:37})};
const {buildPlannerMaterialReferenceModel:model,buildPlannerMaterialItems:items}=vm.runInNewContext(slice('function buildPlannerMaterialItems(','function buildPlannerQuotePrefill(')+'\n({buildPlannerMaterialReferenceModel,buildPlannerMaterialItems})',context);
test('all roles get quantities without material prices, travel still has its costs',()=>{
 const needs={geo:50,glueBuckets:3,tapeRolls:2,pins:30,glueKg:15,jointMeters:12};
 for(const viewerRole of ['office','crew']){
 const m=model({area:48,substrate:{scavoCm:10,drenateCm:5,sabbiaCm:3},travel:{},installNeeds:needs,borderType:'pvc',borderMeters:3,decoItems:{},viewerRole,regionalPricing:{stabilizedPerTon:1000}});
 assert.equal(m.canViewMaterialCosts,false);assert.equal(m.materialCostTotal,0);
 for(const s of m.materialSections){assert.equal(s.showCosts,false);for(const i of s.items){assert.ok(!('cost' in i));assert.doesNotMatch(i.qty,/€/);}}
 const t=m.sections.find(s=>s.key==='travel');assert.equal(t.showCosts,true);assert.equal(t.sub,37);assert.equal(m.operationalCostTotal,37);
 }
 const exported=items(needs,'pvc',3,[],{drenateCm:5},48,{stabilizedPerTon:999});
 assert.ok(exported.every(i=>i.unitPrice===0&&i.total===0));near(exported.find(i=>i.key==='bordura').qty,3);near(exported.find(i=>i.key==='pietrisco').qty,3.84);
});

const labelPosition=vm.runInNewContext(slice('function plannerLabelPosition(','function FreeDrawCanvas(')+'\nplannerLabelPosition');
test('small offcut captions stay outside the piece, even at viewport edges and with neighbouring labels',()=>{
 const bounds={left:0,top:0,right:600,bottom:400};
 const intersects=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2 && Math.abs(a.y-b.y)<(a.h+b.h)/2;
 for(const piece of [{x:300,y:200,w:72,h:14.4},{x:550,y:385,w:72,h:14.4},{x:40,y:12,w:72,h:14.4},{x:590,y:180,w:8,h:72}]){
  const existing={x:piece.x,y:piece.y-30,w:180,h:18};
  const pos=labelPosition(piece.x,piece.y,180,18,bounds,[existing],[piece],piece);
  assert.ok(pos);assert.equal(intersects(pos,piece),false);assert.equal(intersects(pos,existing),false);
  assert.ok(pos.x-pos.w/2>=0&&pos.x+pos.w/2<=600&&pos.y-pos.h/2>=0&&pos.y+pos.h/2<=400);
 }
});
test('other captions cannot obscure a reserved offcut; omit a label if there is no space',()=>{
 const piece={x:100,y:100,w:72,h:14.4};
 const pos=labelPosition(100,100,100,18,{left:0,top:0,right:300,bottom:200},[],[piece]);
 assert.ok(pos);assert.ok(Math.abs(pos.y-piece.y)>=(pos.h+piece.h)/2);
 assert.equal(labelPosition(50,50,180,18,{left:0,top:0,right:100,bottom:100},[],[],piece),null);
});
